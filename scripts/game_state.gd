class_name GameState
extends RefCounted

# Signals
signal state_updated()
signal turn_advanced(day: int, hour: int, turn: int)
signal game_over_triggered(reason: String, is_win: bool)
signal alert_message(text: String, alert_type: String)

# Game Mode Constants
const MODE_CASUAL: String = "CASUAL"
const MODE_REALISM: String = "REALISM"
const MODE_CUSTOM: String = "CUSTOM"

# Exchanges
const EX_BANANANCE: String = "Bananance"
const EX_PUMPBIT: String = "PumpBit"
const EX_UNISWAMP: String = "UniSwamp"
const EX_COLDWALLET: String = "ColdWallet"

# Mode configuration
var current_mode: String = MODE_REALISM
var win_target_balance: float = 10000.0
var target_days: int = 30
var survival_enabled: bool = true
var bans_enabled: bool = true
var news_frequency: float = 0.4 # chance of news each turn
var market_volatility: float = 0.02

# Time & Turn Progression
# 1 turn = 4 hours. 6 turns = 1 day (24 hours).
# Turn 0 -> Day 1, 00:00
# Turn 1 -> Day 1, 04:00
# Turn 2 -> Day 1, 08:00
# Turn 3 -> Day 1, 12:00
# Turn 4 -> Day 1, 16:00
# Turn 5 -> Day 1, 20:00
# Turn 6 -> Day 2, 00:00
var current_turn: int = 0

# Exchanges and Wallets
# Bananance: safe CEX, max x50 leverage, low fee
# PumpBit: offshore CEX, max x100, bonus balance, KYC freeze risk
# UniSwamp: DEX, fixed gas fee, no ban risk, slippage
# ColdWallet: Safe, cannot trade directly, transfer delay 1 turn
var exchange_balances: Dictionary = {
	EX_BANANANCE: 1000.0,
	EX_PUMPBIT: 0.0,
	EX_UNISWAMP: 0.0,
	EX_COLDWALLET: 0.0
}

# Bonus margin granted by offshore exchanges (cannot be withdrawn, used for margin)
var pumpbit_bonus: float = 0.0

# KYC or Freeze statuses: { "Bananance": 0, "PumpBit": 0, ... } turns remaining
var exchange_lock_turns: Dictionary = {
	EX_BANANANCE: 0,
	EX_PUMPBIT: 0,
	EX_UNISWAMP: 0,
	EX_COLDWALLET: 0
}

# Pending transfers: Array of { "from": String, "to": String, "amount": float, "turns_left": int }
var pending_transfers: Array = []

var selected_exchange: String = EX_BANANANCE

# Bills & Utilities
# Rent is due every 7 days (every 42 turns).
var rent_cost: float = 150.0
var rent_interval_turns: int = 42 # 7 days * 6 turns
var turns_until_rent: int = 42
var unpaid_rent: bool = false
var blackout_turns: int = 0 # If rent unpaid, internet/electricity disabled for N turns

# Loans & Debts
# Active loans: Array of { "amount": float, "daily_interest_rate": float, "days_overdue": int }
var active_loans: Array = []
var total_loan_debt: float = 0.0

# Game Over / Victory state
var is_game_over: bool = false
var game_over_reason: String = ""
var is_victory: bool = false

# Selected Coin for trading
var selected_coin: String = "BITCON"
var coin_prices: Dictionary = {
	"BITCON": 64000.0,
	"ETHERIUM": 3200.0,
	"DOGECOIN": 0.15
}

func init_mode(mode: String, custom_params: Dictionary = {}) -> void:
	current_mode = mode
	current_turn = 0
	is_game_over = false
	game_over_reason = ""
	is_victory = false
	pending_transfers.clear()
	active_loans.clear()
	total_loan_debt = 0.0
	unpaid_rent = false
	blackout_turns = 0
	turns_until_rent = rent_interval_turns

	exchange_lock_turns = {
		EX_BANANANCE: 0,
		EX_PUMPBIT: 0,
		EX_UNISWAMP: 0,
		EX_COLDWALLET: 0
	}

	pumpbit_bonus = 0.0

	if mode == MODE_CASUAL:
		win_target_balance = 1000.0
		target_days = 999
		survival_enabled = false
		bans_enabled = false
		news_frequency = 0.35
		market_volatility = 0.02
		exchange_balances = {
			EX_BANANANCE: 100.0,
			EX_PUMPBIT: 0.0,
			EX_UNISWAMP: 0.0,
			EX_COLDWALLET: 0.0
		}
	elif mode == MODE_REALISM:
		win_target_balance = 10000.0
		target_days = 30
		survival_enabled = true
		bans_enabled = true
		news_frequency = 0.4
		market_volatility = 0.02
		exchange_balances = {
			EX_BANANANCE: 1000.0,
			EX_PUMPBIT: 0.0,
			EX_UNISWAMP: 0.0,
			EX_COLDWALLET: 0.0
		}
	elif mode == MODE_CUSTOM:
		var start_bal: float = float(custom_params.get("start_balance", 1000.0))
		win_target_balance = float(custom_params.get("target_balance", 10000.0))
		target_days = int(custom_params.get("target_days", 30))
		survival_enabled = bool(custom_params.get("survival_enabled", true))
		bans_enabled = bool(custom_params.get("bans_enabled", true))
		news_frequency = float(custom_params.get("news_frequency", 0.4))
		market_volatility = float(custom_params.get("market_volatility", 0.02))
		exchange_balances = {
			EX_BANANANCE: start_bal,
			EX_PUMPBIT: 0.0,
			EX_UNISWAMP: 0.0,
			EX_COLDWALLET: 0.0
		}

	selected_exchange = EX_BANANANCE

# Time calculations
func get_current_day() -> int:
	return (current_turn / 6) + 1

func get_current_hour() -> int:
	return (current_turn % 6) * 4

func get_time_string() -> String:
	return "День %d | %02d:00" % [get_current_day(), get_current_hour()]

# Total Net Worth calculation across all exchanges, bonuses, minus debt, plus active position equity
func get_net_worth(active_position_equity: float = 0.0) -> float:
	var total: float = 0.0
	for ex in exchange_balances:
		total += exchange_balances[ex]
	total += pumpbit_bonus
	total += active_position_equity
	total -= total_loan_debt
	return total

# Advance turn
func advance_turn_step() -> void:
	current_turn += 1
	var day: int = get_current_day()
	var hour: int = get_current_hour()

	# Process pending transfers
	var finished_transfers: Array = []
	for transfer in pending_transfers:
		transfer.turns_left -= 1
		if transfer.turns_left <= 0:
			exchange_balances[transfer.to] += transfer.amount
			finished_transfers.append(transfer)
			alert_message.emit("Перевод $%.2f на %s успешно зачислен!" % [transfer.amount, transfer.to], "INFO")

	for ft in finished_transfers:
		pending_transfers.erase(ft)

	# Process exchange locks (KYC / Bans)
	for ex in exchange_lock_turns:
		if exchange_lock_turns[ex] > 0:
			exchange_lock_turns[ex] -= 1
			if exchange_lock_turns[ex] == 0:
				alert_message.emit("Биржа %s разблокировала ваш аккаунт!" % ex, "SUCCESS")

	# Process rent and bills (in Realism mode)
	if survival_enabled:
		turns_until_rent -= 1
		if turns_until_rent <= 0:
			turns_until_rent = rent_interval_turns
			unpaid_rent = true
			alert_message.emit("Пришел счет за аренду и коммуналку: $%.2f!" % rent_cost, "WARNING")

		if unpaid_rent and blackout_turns <= 0:
			# Threat of blackout
			blackout_turns = 3
			alert_message.emit("Из-за неуплаты аренды отключили свет и интернет!", "DANGER")

		if blackout_turns > 0:
			blackout_turns -= 1
			if blackout_turns == 0 and unpaid_rent:
				# Remains unpaid
				blackout_turns = 2

		# Process loan interest (applied once every 6 turns / 1 day)
		if current_turn % 6 == 0:
			apply_daily_loan_interest()

	# Check Win / Loss conditions
	check_win_loss_conditions()

	turn_advanced.emit(day, hour, current_turn)
	state_updated.emit()

func apply_daily_loan_interest() -> void:
	total_loan_debt = 0.0
	for loan in active_loans:
		var interest: float = loan.amount * loan.daily_interest_rate
		loan.amount += interest
		loan.days_overdue += 1
		total_loan_debt += loan.amount

		# If loan overdue for more than 7 days without repayment -> Debt collectors GameOver
		if loan.days_overdue > 7:
			trigger_game_over("Коллекторы пришли за долгами! Ваша торговая карьера окончена.", false)

# Transfer funds between exchanges
func transfer_funds(from_ex: String, to_ex: String, amount: float) -> bool:
	if from_ex == to_ex or amount <= 0.0:
		return false
	if exchange_balances.get(from_ex, 0.0) < amount:
		return false
	if exchange_lock_turns.get(from_ex, 0) > 0:
		alert_message.emit("Нельзя перевести: биржа %s заморожена!" % from_ex, "ERROR")
		return false

	exchange_balances[from_ex] -= amount

	# Cold wallet transfer takes 1 turn delay
	if from_ex == EX_COLDWALLET or to_ex == EX_COLDWALLET:
		pending_transfers.append({
			"from": from_ex,
			"to": to_ex,
			"amount": amount,
			"turns_left": 1
		})
		alert_message.emit("Перевод отправлен на холодный кошелек (доставка 1 ход)", "INFO")
	else:
		# Direct CEX/DEX transfer
		exchange_balances[to_ex] += amount
		# If depositing into PumpBit, award deposit bonus (+20%)
		if to_ex == EX_PUMPBIT:
			var bonus: float = amount * 0.20
			pumpbit_bonus += bonus
			alert_message.emit("PumpBit начислил бонус +20%% к депозиту: +$%.2f" % bonus, "SUCCESS")

	state_updated.emit()
	return true

# Pay Rent
func pay_rent() -> bool:
	# Deduct from selected exchange or any available balance
	var needed: float = rent_cost
	for ex in [selected_exchange, EX_BANANANCE, EX_PUMPBIT, EX_UNISWAMP]:
		if exchange_balances.get(ex, 0.0) >= needed:
			exchange_balances[ex] -= needed
			unpaid_rent = false
			blackout_turns = 0
			alert_message.emit("Аренда и коммуналка успешно оплачены!", "SUCCESS")
			state_updated.emit()
			return true
	alert_message.emit("Недостаточно средств для оплаты аренды ($%.2f)!" % rent_cost, "ERROR")
	return false

# Take Loan
func take_loan(amount: float, daily_rate: float = 0.05) -> bool:
	if amount <= 0.0:
		return false
	active_loans.append({
		"amount": amount,
		"daily_interest_rate": daily_rate,
		"days_overdue": 0
	})
	total_loan_debt += amount
	exchange_balances[selected_exchange] += amount
	alert_message.emit("Получен займ на сумму $%.2f (ставка %d%% в день)" % [amount, int(daily_rate * 100)], "WARNING")
	state_updated.emit()
	return true

# Repay Loan
func repay_loan(loan_idx: int) -> bool:
	if loan_idx < 0 or loan_idx >= active_loans.size():
		return false
	var loan: Dictionary = active_loans[loan_idx]
	var needed: float = loan.amount
	if exchange_balances.get(selected_exchange, 0.0) < needed:
		alert_message.emit("Недостаточно средств на %s для погашения кредита ($%.2f)" % [selected_exchange, needed], "ERROR")
		return false

	exchange_balances[selected_exchange] -= needed
	total_loan_debt -= needed
	active_loans.remove_at(loan_idx)
	alert_message.emit("Кредит успешно погашен!", "SUCCESS")
	state_updated.emit()
	return true

func trigger_game_over(reason: String, win: bool) -> void:
	if is_game_over:
		return
	is_game_over = true
	game_over_reason = reason
	is_victory = win
	game_over_triggered.emit(reason, win)

func check_win_loss_conditions(active_position_equity: float = 0.0) -> void:
	if is_game_over:
		return

	var nw: float = get_net_worth(active_position_equity)

	# Win condition: reached win target balance
	if nw >= win_target_balance:
		trigger_game_over("ПОБЕДА! Вы успешно разогнали депозит до $%.2f!" % nw, true)
		return

	# Win condition for Realism: survived 30 days without bankruptcy
	if current_mode == MODE_REALISM and get_current_day() > target_days and nw > 0.0:
		trigger_game_over("ПОБЕДА! Вы выжили 30 дней в суровом крипто-мире с капиталом $%.2f!" % nw, true)
		return

	# Loss condition: bankruptcy with debt or 0 capital
	if nw <= 0.0 and active_loans.size() > 0:
		trigger_game_over("БАНКРОТСТВО! Ваши средства исчерпаны, а долги продолжают расти.", false)
		return

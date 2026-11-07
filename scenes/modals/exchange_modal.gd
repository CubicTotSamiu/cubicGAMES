class_name ExchangeModal
extends PanelContainer

signal closed()
signal transfer_requested(from_ex: String, to_ex: String, amount: float)

var game_state: GameState
var survival: SurvivalSystem

@onready var bal_bananance: Label = $VBox/ExchangesList/ExBananance/Bal
@onready var bal_pumpbit: Label = $VBox/ExchangesList/ExPumpBit/Bal
@onready var bal_uniswamp: Label = $VBox/ExchangesList/ExUniSwamp/Bal
@onready var bal_cold: Label = $VBox/ExchangesList/ExCold/Bal

@onready var from_option: OptionButton = $VBox/TransferBox/FromOpt
@onready var to_option: OptionButton = $VBox/TransferBox/ToOpt
@onready var amount_spin: SpinBox = $VBox/TransferBox/AmountSpin
@onready var transfer_btn: Button = $VBox/TransferBox/TransferBtn
@onready var info_label: Label = $VBox/InfoLabel

func setup(p_state: GameState, p_survival: SurvivalSystem) -> void:
	game_state = p_state
	survival = p_survival
	update_view()

func update_view() -> void:
	if not game_state:
		return

	var b_ban: float = game_state.exchange_balances.get(GameState.EX_BANANANCE, 0.0)
	var b_pump: float = game_state.exchange_balances.get(GameState.EX_PUMPBIT, 0.0)
	var b_uni: float = game_state.exchange_balances.get(GameState.EX_UNISWAMP, 0.0)
	var b_cold: float = game_state.exchange_balances.get(GameState.EX_COLDWALLET, 0.0)

	var lock_ban: int = game_state.exchange_lock_turns.get(GameState.EX_BANANANCE, 0)
	var lock_pump: int = game_state.exchange_lock_turns.get(GameState.EX_PUMPBIT, 0)

	bal_bananance.text = "$%.2f %s" % [b_ban, "🔒 [KYC БЛОК %d х.]" % lock_ban if lock_ban > 0 else ""]
	bal_pumpbit.text = "$%.2f (+ бонус $%.2f) %s" % [b_pump, game_state.pumpbit_bonus, "🔒 [KYC БЛОК %d х.]" % lock_pump if lock_pump > 0 else ""]
	bal_uniswamp.text = "$%.2f (DEX без риска бана)" % b_uni

	if survival and survival.has_hardware_wallet:
		bal_cold.text = "$%.2f [Сейф Ledger]" % b_cold
	else:
		bal_cold.text = "Купите кошелек в магазине"

	# Populate options
	from_option.clear()
	to_option.clear()

	var exchanges: Array = [GameState.EX_BANANANCE, GameState.EX_PUMPBIT, GameState.EX_UNISWAMP]
	if survival and survival.has_hardware_wallet:
		exchanges.append(GameState.EX_COLDWALLET)

	for ex in exchanges:
		from_option.add_item(ex)
		to_option.add_item(ex)

	if to_option.item_count > 1:
		to_option.selected = 1

	amount_spin.max_value = 100000.0

func _on_transfer_btn_pressed() -> void:
	var from_ex: String = from_option.get_item_text(from_option.selected)
	var to_ex: String = to_option.get_item_text(to_option.selected)
	var amount: float = amount_spin.value

	if from_ex == to_ex:
		info_label.text = "Выберите разные площадки для перевода."
		return

	if amount <= 0.0:
		info_label.text = "Укажите сумму больше $0."
		return

	var ok: bool = game_state.transfer_funds(from_ex, to_ex, amount)
	if ok:
		info_label.text = "Перевод $%.2f отправлен!" % amount
		transfer_requested.emit(from_ex, to_ex, amount)
		update_view()
	else:
		info_label.text = "Ошибка перевода: недостаточно средств или аккаунт заблокирован!"

func _on_close_btn_pressed() -> void:
	hide()
	closed.emit()

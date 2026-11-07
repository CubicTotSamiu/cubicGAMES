class_name Dashboard
extends Control

# State & Systems
var game_state: GameState
var survival: SurvivalSystem
var news_manager: NewsManager

# Market candle series for coins
var coin_candles: Dictionary = {
	"BITCON": [],
	"ETHERIUM": [],
	"DOGECOIN": []
}

# Current active trading position:
# { "type": "LONG"|"SHORT", "margin": float, "leverage": int, "entry_price": float, "liquidation_price": float, "stop_loss": float, "take_profit": float, "exchange": String, "coin": String }
var current_position: Dictionary = {}

# Selected leverage
var selected_leverage: int = 10

# UI References
@onready var top_time_lbl: Label = $MainLayout/TopBar/Margin/HBox/TimeLabel
@onready var top_networth_lbl: Label = $MainLayout/TopBar/Margin/HBox/NetWorthLabel
@onready var top_exchange_opt: OptionButton = $MainLayout/TopBar/Margin/HBox/ExchangeOpt
@onready var top_mode_btn: Button = $MainLayout/TopBar/Margin/HBox/ModeBtn
@onready var top_shop_btn: Button = $MainLayout/TopBar/Margin/HBox/ShopBtn
@onready var top_wallet_btn: Button = $MainLayout/TopBar/Margin/HBox/WalletBtn
@onready var top_loan_btn: Button = $MainLayout/TopBar/Margin/HBox/LoanBtn

@onready var chart: CandlestickChart = $MainLayout/Body/CenterArea/ChartContainer/Chart
@onready var coin_opt: OptionButton = $MainLayout/Body/CenterArea/CoinSelectionBar/HBox/CoinOpt
@onready var coin_price_lbl: Label = $MainLayout/Body/CenterArea/CoinSelectionBar/HBox/PriceLabel
@onready var pos_info_lbl: Label = $MainLayout/Body/CenterArea/CoinSelectionBar/HBox/PosInfoLabel

# Bottom Trading Panel
@onready var margin_spin: SpinBox = $MainLayout/Body/CenterArea/BottomTradingPanel/Margin/HBox/MarginBox/MarginSpin
@onready var lev_btn_x2: Button = $MainLayout/Body/CenterArea/BottomTradingPanel/Margin/HBox/LeverageBox/HBox/LevX2
@onready var lev_btn_x5: Button = $MainLayout/Body/CenterArea/BottomTradingPanel/Margin/HBox/LeverageBox/HBox/LevX5
@onready var lev_btn_x10: Button = $MainLayout/Body/CenterArea/BottomTradingPanel/Margin/HBox/LeverageBox/HBox/LevX10
@onready var lev_btn_x25: Button = $MainLayout/Body/CenterArea/BottomTradingPanel/Margin/HBox/LeverageBox/HBox/LevX25
@onready var lev_btn_x50: Button = $MainLayout/Body/CenterArea/BottomTradingPanel/Margin/HBox/LeverageBox/HBox/LevX50
@onready var lev_btn_x100: Button = $MainLayout/Body/CenterArea/BottomTradingPanel/Margin/HBox/LeverageBox/HBox/LevX100
@onready var tp_spin: SpinBox = $MainLayout/Body/CenterArea/BottomTradingPanel/Margin/HBox/TPSLBox/HBox/TPSpin
@onready var sl_spin: SpinBox = $MainLayout/Body/CenterArea/BottomTradingPanel/Margin/HBox/TPSLBox/HBox/SLSpin
@onready var long_btn: Button = $MainLayout/Body/CenterArea/BottomTradingPanel/Margin/HBox/OrderActions/LongBtn
@onready var short_btn: Button = $MainLayout/Body/CenterArea/BottomTradingPanel/Margin/HBox/OrderActions/ShortBtn
@onready var close_pos_btn: Button = $MainLayout/Body/CenterArea/BottomTradingPanel/Margin/HBox/OrderActions/CloseBtn
@onready var next_turn_btn: Button = $MainLayout/Body/CenterArea/BottomTradingPanel/Margin/HBox/TurnBox/NextTurnBtn

# Sidebar (Survival & News)
@onready var survival_panel: VBoxContainer = $MainLayout/Body/Sidebar/VBox/SurvivalSection
@onready var energy_bar: ProgressBar = $MainLayout/Body/Sidebar/VBox/SurvivalSection/Bars/EnergyBar
@onready var hunger_bar: ProgressBar = $MainLayout/Body/Sidebar/VBox/SurvivalSection/Bars/HungerBar
@onready var tilt_bar: ProgressBar = $MainLayout/Body/Sidebar/VBox/SurvivalSection/Bars/TiltBar
@onready var gear_info_lbl: Label = $MainLayout/Body/Sidebar/VBox/SurvivalSection/GearInfo
@onready var eat_doshirak_btn: Button = $MainLayout/Body/Sidebar/VBox/SurvivalSection/ActionButtons/DoshirakBtn
@onready var eat_pizza_btn: Button = $MainLayout/Body/Sidebar/VBox/SurvivalSection/ActionButtons/PizzaBtn
@onready var sleep_btn: Button = $MainLayout/Body/Sidebar/VBox/SurvivalSection/ActionButtons/SleepBtn
@onready var pay_rent_btn: Button = $MainLayout/Body/Sidebar/VBox/SurvivalSection/ActionButtons/RentBtn

@onready var vip_hint_lbl: Label = $MainLayout/Body/Sidebar/VBox/NewsSection/VIPHint
@onready var news_feed_box: VBoxContainer = $MainLayout/Body/Sidebar/VBox/NewsSection/Scroll/NewsFeed

# Modals
@onready var shop_modal: ShopModal = $Modals/ShopModal
@onready var exchange_modal: ExchangeModal = $Modals/ExchangeModal
@onready var loan_modal: LoanModal = $Modals/LoanModal
@onready var mode_modal: ModeSelectModal = $Modals/ModeSelectModal
@onready var alert_toast: PanelContainer = $Toast
@onready var alert_toast_lbl: Label = $Toast/Label

func _ready() -> void:
	game_state = GameState.new()
	survival = SurvivalSystem.new()
	news_manager = NewsManager.new()

	# Connect signals
	game_state.turn_advanced.connect(_on_turn_advanced)
	game_state.game_over_triggered.connect(_on_game_over)
	game_state.alert_message.connect(show_toast)
	game_state.state_updated.connect(update_ui)

	survival.stats_changed.connect(update_ui)
	survival.collapsed.connect(_on_player_collapsed)
	survival.cat_action.connect(func(msg: String):
		show_toast(msg, "WARNING")
		if not current_position.is_empty():
			close_current_position("Кот закрыл сделку по рынку!")
	)

	news_manager.news_broadcasted.connect(_on_news_received)

	# Connect modal signals
	shop_modal.closed.connect(update_ui)
	shop_modal.item_purchased.connect(func(_type, _id):
		update_ui()
		shop_modal.update_view(news_manager)
	)
	exchange_modal.closed.connect(update_ui)
	exchange_modal.transfer_requested.connect(func(_f, _t, _a): update_ui())
	loan_modal.closed.connect(update_ui)
	mode_modal.mode_selected.connect(_on_mode_selected)

	# Setup Coin Options
	coin_opt.clear()
	coin_opt.add_item("BITCON ($64,000)")
	coin_opt.add_item("ETHERIUM ($3,200)")
	coin_opt.add_item("DOGECOIN ($0.15)")
	coin_opt.item_selected.connect(_on_coin_selected)

	# Setup Exchange Options
	top_exchange_opt.clear()
	top_exchange_opt.add_item(GameState.EX_BANANANCE)
	top_exchange_opt.add_item(GameState.EX_PUMPBIT)
	top_exchange_opt.add_item(GameState.EX_UNISWAMP)
	top_exchange_opt.item_selected.connect(_on_exchange_selected)

	# Setup Leverage Buttons
	lev_btn_x2.pressed.connect(func(): _set_leverage(2))
	lev_btn_x5.pressed.connect(func(): _set_leverage(5))
	lev_btn_x10.pressed.connect(func(): _set_leverage(10))
	lev_btn_x25.pressed.connect(func(): _set_leverage(25))
	lev_btn_x50.pressed.connect(func(): _set_leverage(50))
	lev_btn_x100.pressed.connect(func(): _set_leverage(100))

	# Start in Realism mode by default
	start_new_game(GameState.MODE_REALISM, {})

func start_new_game(mode: String, custom_params: Dictionary) -> void:
	game_state.init_mode(mode, custom_params)
	survival.reset()
	news_manager.reset()
	current_position.clear()

	# Generate initial chart history (30 candles)
	for coin in coin_candles:
		coin_candles[coin].clear()
		var base_p: float = game_state.coin_prices[coin]
		var cur_p: float = base_p
		for i in range(30):
			var c: Dictionary = TradingEngine.generate_next_candle(cur_p, 0.015, 0.0, 1.0, i - 30)
			coin_candles[coin].append(c)
			cur_p = c.close
		game_state.coin_prices[coin] = cur_p

	# Setup initial UI
	_set_leverage(10)
	margin_spin.value = min(100.0, game_state.exchange_balances[game_state.selected_exchange])

	# Clear news feed
	for child in news_feed_box.get_children():
		child.queue_free()

	news_manager.broadcast_event({
		"title": "Терминал запущен",
		"desc": "Добро пожаловать в TRUE TRADER. Удачной охоты за ликвидностью!",
		"type": "SYSTEM"
	}, game_state.get_time_string())

	update_ui()
	show_toast("Игра начата в режиме: %s" % mode, "SUCCESS")

func _on_mode_selected(mode: String, params: Dictionary) -> void:
	start_new_game(mode, params)

func _on_coin_selected(idx: int) -> void:
	var coins: Array = ["BITCON", "ETHERIUM", "DOGECOIN"]
	game_state.selected_coin = coins[idx]
	update_ui()

func _on_exchange_selected(idx: int) -> void:
	game_state.selected_exchange = top_exchange_opt.get_item_text(idx)
	update_ui()

func _set_leverage(lev: int) -> void:
	selected_leverage = lev
	var buttons = [lev_btn_x2, lev_btn_x5, lev_btn_x10, lev_btn_x25, lev_btn_x50, lev_btn_x100]
	var values = [2, 5, 10, 25, 50, 100]
	for i in range(buttons.size()):
		if values[i] == lev:
			buttons[i].add_theme_color_override("font_color", Color(0, 1, 0.5))
		else:
			buttons[i].remove_theme_color_override("font_color")
	_update_tp_sl_defaults()

func _update_tp_sl_defaults() -> void:
	var cur_p: float = game_state.coin_prices[game_state.selected_coin]
	if tp_spin.value == 0.0 or abs(tp_spin.value - cur_p) > cur_p * 0.5:
		tp_spin.value = cur_p * 1.05
	if sl_spin.value == 0.0 or abs(sl_spin.value - cur_p) > cur_p * 0.5:
		sl_spin.value = cur_p * 0.95

func update_ui() -> void:
	if not game_state or not survival:
		return

	# Top bar
	top_time_lbl.text = game_state.get_time_string()
	var pos_equity: float = 0.0
	if not current_position.is_empty():
		var cur_p: float = game_state.coin_prices[current_position.coin]
		var pnl_d: Dictionary = TradingEngine.calculate_pnl(current_position, cur_p)
		pos_equity = current_position.margin + pnl_d.pnl

	var nw: float = game_state.get_net_worth(pos_equity)
	top_networth_lbl.text = "Капитал: $%.2f" % nw

	# Current exchange balance
	var ex_bal: float = game_state.exchange_balances.get(game_state.selected_exchange, 0.0)
	var is_locked: bool = game_state.exchange_lock_turns.get(game_state.selected_exchange, 0) > 0
	top_exchange_opt.text = "%s: $%.2f %s" % [
		game_state.selected_exchange,
		ex_bal,
		"🔒" if is_locked else ""
	]

	# Price display
	var coin_p: float = game_state.coin_prices[game_state.selected_coin]
	coin_price_lbl.text = "$%.2f" % coin_p if coin_p < 100.0 else "$%.0f" % coin_p

	# Position display
	if current_position.is_empty():
		pos_info_lbl.text = "Позиций нет"
		pos_info_lbl.add_theme_color_override("font_color", Color(0.6, 0.6, 0.6))
		long_btn.disabled = is_locked or game_state.blackout_turns > 0
		short_btn.disabled = is_locked or game_state.blackout_turns > 0
		close_pos_btn.disabled = true
	else:
		var pnl_d: Dictionary = TradingEngine.calculate_pnl(current_position, coin_p)
		var pnl_val: float = pnl_d.pnl
		var roe_val: float = pnl_d.roe
		var pnl_sign: String = "+" if pnl_val >= 0.0 else ""
		pos_info_lbl.text = "%s %sx | PnL: %s$%.2f (%s%.1f%%) | Liq: $%.2f" % [
			current_position.type,
			current_position.leverage,
			pnl_sign, pnl_val,
			pnl_sign, roe_val,
			current_position.liquidation_price
		]
		var col: Color = Color(0, 0.9, 0.46) if pnl_val >= 0.0 else Color(1, 0.2, 0.4)
		pos_info_lbl.add_theme_color_override("font_color", col)
		long_btn.disabled = true
		short_btn.disabled = true
		close_pos_btn.disabled = game_state.blackout_turns > 0

	# Survival bars
	survival_panel.visible = game_state.survival_enabled
	if game_state.survival_enabled:
		energy_bar.value = survival.energy
		hunger_bar.value = survival.hunger
		tilt_bar.value = survival.tilt

		# Shake / Warp UI if Tilt > 75%
		if survival.tilt > 75.0:
			chart.position.x = randf_range(-3.0, 3.0)
			chart.position.y = randf_range(-3.0, 3.0)
			tilt_bar.modulate = Color(1.5, 0.3, 0.3)
		else:
			chart.position = Vector2.ZERO
			tilt_bar.modulate = Color.WHITE

		gear_info_lbl.text = "%s | %s%s%s" % [
			SurvivalSystem.CHAIR_NAMES[survival.chair_level],
			SurvivalSystem.MONITOR_NAMES[survival.monitor_level],
			" | ⚡ИБП" if survival.has_ups_fiber else "",
			" | 🐱Кот" if survival.has_cat else ""
		]

		# Rent status
		if game_state.unpaid_rent:
			pay_rent_btn.text = "Оплатить счет ($150) ⚠️"
			pay_rent_btn.disabled = false
		else:
			pay_rent_btn.text = "Аренда через %d х." % game_state.turns_until_rent
			pay_rent_btn.disabled = true

	# VIP hint
	vip_hint_lbl.text = news_manager.get_vip_insider_hint()

	# Update chart
	var active_c: Array = coin_candles[game_state.selected_coin]
	chart.set_chart_data(active_c, current_position, survival.monitor_level if game_state.survival_enabled else 3)

# Place Trade (Long / Short)
func open_trade(pos_type: String) -> void:
	if not current_position.is_empty():
		show_toast("У вас уже есть открытая позиция!", "WARNING")
		return

	if game_state.exchange_lock_turns.get(game_state.selected_exchange, 0) > 0:
		show_toast("Биржа %s заблокирована!" % game_state.selected_exchange, "ERROR")
		return

	if game_state.blackout_turns > 0:
		show_toast("Электричество и интернет отключены за неуплату!", "DANGER")
		return

	var margin: float = margin_spin.value
	var cur_bal: float = game_state.exchange_balances[game_state.selected_exchange]

	if margin <= 0.0 or margin > cur_bal:
		show_toast("Недостаточно средств на балансе!", "ERROR")
		return

	# Check Tilt Breakdown (Degenerate breakdown at >75% tilt)
	var leverage_to_use: int = selected_leverage
	var sl_to_use: float = sl_spin.value
	var tp_to_use: float = tp_spin.value

	if game_state.survival_enabled and survival.should_trigger_tilt_breakdown():
		show_toast("💥 ЛУДОМАНСКИЙ СРЫВ! Тильт заставил вас поставить плечо x100 и убрать стоп!", "DANGER")
		leverage_to_use = 100
		sl_to_use = 0.0

	# Deduct margin from exchange
	game_state.exchange_balances[game_state.selected_exchange] -= margin

	# Entry price with DEX slippage / fees
	var cur_p: float = game_state.coin_prices[game_state.selected_coin]
	var is_dex: bool = game_state.selected_exchange == GameState.EX_UNISWAMP
	var slippage: float = survival.get_effective_slippage(is_dex)
	var entry_p: float = cur_p * (1.0 + slippage if pos_type == "LONG" else 1.0 - slippage)

	var liq_p: float = TradingEngine.calculate_liquidation_price(entry_p, pos_type, leverage_to_use)

	current_position = {
		"type": pos_type,
		"margin": margin,
		"leverage": leverage_to_use,
		"entry_price": entry_p,
		"liquidation_price": liq_p,
		"stop_loss": sl_to_use,
		"take_profit": tp_to_use,
		"exchange": game_state.selected_exchange,
		"coin": game_state.selected_coin
	}

	show_toast("Открыт %s x%d на $%0.f!" % [pos_type, leverage_to_use, margin], "SUCCESS")
	update_ui()

func close_current_position(reason: String = "Закрытие по рынку") -> void:
	if current_position.is_empty():
		return

	var cur_p: float = game_state.coin_prices[current_position.coin]
	var pnl_d: Dictionary = TradingEngine.calculate_pnl(current_position, cur_p)
	var pnl_val: float = pnl_d.pnl
	var return_amount: float = max(0.0, current_position.margin + pnl_val)

	# Credit back to the exchange position was opened on
	game_state.exchange_balances[current_position.exchange] += return_amount

	# Update Tilt
	if game_state.survival_enabled:
		if pnl_val > 0.0:
			survival.add_tilt(-10.0)
		elif pnl_val < 0.0:
			survival.add_tilt(10.0)

	show_toast("%s | PnL: %s$%.2f" % [reason, "+" if pnl_val >= 0 else "", pnl_val], "INFO")
	current_position.clear()
	update_ui()

# Advance turn by 1 step (4 hours)
func advance_step() -> void:
	if game_state.is_game_over:
		return

	# Cat check
	if game_state.survival_enabled and survival.check_cat_keyboard_incident():
		# Cat closed trade
		pass

	# Prepare random event / news
	var event: Dictionary = news_manager.prepare_turn_events(game_state.news_frequency, game_state.bans_enabled)
	var impulse: float = 0.0
	var squeeze: float = 1.0
	var ev_label: String = ""

	if not event.is_empty():
		if event.type == "MARKET":
			impulse = float(event.get("impulse", 0.0))
			squeeze = float(event.get("squeeze", 1.0))
			ev_label = event.get("title", "")
		elif event.type == "PLATFORM" and game_state.bans_enabled:
			var target_ex: String = event.get("target_exchange", "")
			var lock_t: int = int(event.get("lock_turns", 1))
			game_state.exchange_lock_turns[target_ex] = lock_t

		news_manager.broadcast_event(event, game_state.get_time_string())

	# Generate new candle for all coins
	for coin in coin_candles:
		var last_p: float = game_state.coin_prices[coin]
		# Coin being traded receives news impulse
		var coin_impulse: float = impulse if coin == game_state.selected_coin else (randf_range(-0.01, 0.01))
		var candle: Dictionary = TradingEngine.generate_next_candle(
			last_p,
			game_state.market_volatility,
			coin_impulse,
			squeeze if coin == game_state.selected_coin else 1.0,
			game_state.current_turn,
			ev_label if coin == game_state.selected_coin else ""
		)
		coin_candles[coin].append(candle)
		game_state.coin_prices[coin] = candle.close

	# Check order resolution on active position
	if not current_position.is_empty():
		var traded_candle: Dictionary = coin_candles[current_position.coin].back()
		var is_dex: bool = current_position.exchange == GameState.EX_UNISWAMP
		var slippage: float = survival.get_effective_slippage(is_dex)
		var eval_res: Dictionary = TradingEngine.evaluate_candle_for_position(traded_candle, current_position, slippage)

		if eval_res.status == "LIQUIDATED":
			if game_state.survival_enabled:
				survival.add_tilt(eval_res.tilt_delta)
			show_toast("💀 ЛИКВИДАЦИЯ ПОЗИЦИИ! Вся маржа ($%.2f) сгорела!" % current_position.margin, "DANGER")
			current_position.clear()
		elif eval_res.status == "STOP_LOSS":
			if game_state.survival_enabled:
				survival.add_tilt(eval_res.tilt_delta)
			var return_margin: float = max(0.0, current_position.margin + eval_res.pnl)
			game_state.exchange_balances[current_position.exchange] += return_margin
			show_toast("🛑 Стоп-Лосс сработал! Убыток: $%.2f" % abs(eval_res.pnl), "WARNING")
			current_position.clear()
		elif eval_res.status == "TAKE_PROFIT":
			if game_state.survival_enabled:
				survival.add_tilt(eval_res.tilt_delta)
			var return_margin: float = current_position.margin + eval_res.pnl
			game_state.exchange_balances[current_position.exchange] += return_margin
			show_toast("🎯 Тейк-Профит сработал! Прибыль: +$%.2f" % eval_res.pnl, "SUCCESS")
			current_position.clear()

	# Survival tick
	if game_state.survival_enabled:
		survival.tick_turn()

	# Advance turn
	game_state.advance_turn_step()
	update_ui()

# Sleep action (skips 2 turns = 8 hours)
func perform_sleep() -> void:
	if game_state.is_game_over:
		return
	survival.perform_sleep()
	show_toast("Вы легли спать на 8 часов (+2 хода)...", "INFO")
	advance_step()
	if not game_state.is_game_over:
		advance_step()

func _on_player_collapsed() -> void:
	show_toast("ВЫ УПАЛИ В ОБМОРОК ОТ ИСТОЩЕНИЯ! (Пропуск 3 ходов)", "DANGER")
	survival.handle_forced_collapse()
	for i in range(3):
		if not game_state.is_game_over:
			advance_step()

func _on_turn_advanced(_day: int, _hour: int, _turn: int) -> void:
	pass

func _on_game_over(reason: String, is_win: bool) -> void:
	show_toast(reason, "SUCCESS" if is_win else "DANGER")
	next_turn_btn.disabled = true
	long_btn.disabled = true
	short_btn.disabled = true
	close_pos_btn.disabled = true

func _on_news_received(item: Dictionary) -> void:
	var label := Label.new()
	label.autowrap_mode = TextServer.AUTOWRAP_WORD
	label.add_theme_font_size_override("font_size", 11)

	var prefix: String = ""
	var color: Color = Color(0.8, 0.8, 0.8)
	if item.type == "MARKET":
		prefix = "📈 " if "ПАМП" in item.get("impact_text", "") else "📉 "
		color = Color(1, 0.84, 0)
	elif item.type == "PLATFORM":
		prefix = "⚠️ "
		color = Color(1, 0.4, 0.4)

	label.text = "[%s] %s%s: %s" % [item.time, prefix, item.title, item.desc]
	label.add_theme_color_override("font_color", color)
	news_feed_box.add_child(label)
	news_feed_box.move_child(label, 0) # newest on top

func show_toast(text: String, alert_type: String = "INFO") -> void:
	alert_toast_lbl.text = text
	var col := Color(0, 0.8, 1)
	if alert_type == "SUCCESS":
		col = Color(0, 1, 0.5)
	elif alert_type == "WARNING":
		col = Color(1, 0.8, 0)
	elif alert_type == "DANGER" or alert_type == "ERROR":
		col = Color(1, 0.2, 0.3)
	alert_toast.modulate = col
	alert_toast.show()

	# Auto hide after 3 seconds
	get_tree().create_timer(3.5).timeout.connect(func():
		alert_toast.hide()
	)

# UI Button Handlers
func _on_long_pressed() -> void:
	open_trade("LONG")

func _on_short_pressed() -> void:
	open_trade("SHORT")

func _on_close_pressed() -> void:
	close_current_position()

func _on_next_turn_pressed() -> void:
	advance_step()

func _on_doshirak_pressed() -> void:
	var cost: float = SurvivalSystem.FOOD_DOSHIRAK.cost
	if game_state.exchange_balances[game_state.selected_exchange] >= cost:
		game_state.exchange_balances[game_state.selected_exchange] -= cost
		survival.eat_food(SurvivalSystem.FOOD_DOSHIRAK)
		show_toast("Съеден доширак (+25% сытости, +5% тильта)", "INFO")
		update_ui()
	else:
		show_toast("Нет $5 на балансе для доширака!", "ERROR")

func _on_pizza_pressed() -> void:
	var cost: float = SurvivalSystem.FOOD_PIZZA.cost
	if game_state.exchange_balances[game_state.selected_exchange] >= cost:
		game_state.exchange_balances[game_state.selected_exchange] -= cost
		survival.eat_food(SurvivalSystem.FOOD_PIZZA)
		show_toast("Пицца доставлена (+50% сытости, -5% тильта)", "SUCCESS")
		update_ui()
	else:
		show_toast("Нет $15 на балансе для пиццы!", "ERROR")

func _on_sleep_pressed() -> void:
	perform_sleep()

func _on_pay_rent_pressed() -> void:
	game_state.pay_rent()

func _on_shop_pressed() -> void:
	shop_modal.setup(survival, game_state, news_manager)
	shop_modal.show()

func _on_wallet_pressed() -> void:
	exchange_modal.setup(game_state, survival)
	exchange_modal.show()

func _on_loan_pressed() -> void:
	loan_modal.setup(game_state)
	loan_modal.show()

func _on_mode_btn_pressed() -> void:
	mode_modal.show()

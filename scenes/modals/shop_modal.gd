class_name ShopModal
extends PanelContainer

signal item_purchased(item_type: String, item_id: int)
signal closed()

var survival: SurvivalSystem
var game_state: GameState

@onready var chair_btn: Button = $VBox/Grid/ChairItem/Btn
@onready var chair_desc: Label = $VBox/Grid/ChairItem/Desc
@onready var monitor_btn: Button = $VBox/Grid/MonitorItem/Btn
@onready var monitor_desc: Label = $VBox/Grid/MonitorItem/Desc
@onready var ups_btn: Button = $VBox/Grid/UPSItem/Btn
@onready var wallet_btn: Button = $VBox/Grid/WalletItem/Btn
@onready var cat_btn: Button = $VBox/Grid/CatItem/Btn
@onready var vip1_btn: Button = $VBox/Grid/Vip1Item/Btn
@onready var vip2_btn: Button = $VBox/Grid/Vip2Item/Btn

func setup(p_survival: SurvivalSystem, p_state: GameState, p_news: NewsManager) -> void:
	survival = p_survival
	game_state = p_state
	update_view(p_news)

func update_view(news_manager: NewsManager) -> void:
	if not survival or not game_state:
		return

	var cur_balance: float = game_state.exchange_balances.get(game_state.selected_exchange, 0.0)

	# Chair upgrade
	if survival.chair_level < SurvivalSystem.CHAIR_NAMES.size() - 1:
		var next_chair: int = survival.chair_level + 1
		var cost: float = float(SurvivalSystem.CHAIR_COSTS[next_chair])
		chair_desc.text = "Текущее: %s (-%d%%/ход)\nСледующее: %s (-%d%%/ход)" % [
			SurvivalSystem.CHAIR_NAMES[survival.chair_level],
			int(SurvivalSystem.CHAIR_DECAY_RATES[survival.chair_level]),
			SurvivalSystem.CHAIR_NAMES[next_chair],
			int(SurvivalSystem.CHAIR_DECAY_RATES[next_chair])
		]
		chair_btn.text = "Улучшить ($%.0f)" % cost
		chair_btn.disabled = cur_balance < cost
	else:
		chair_desc.text = "Максимальный уровень: %s (-3%%/ход)" % SurvivalSystem.CHAIR_NAMES[survival.chair_level]
		chair_btn.text = "Куплено"
		chair_btn.disabled = true

	# Monitor upgrade
	if survival.monitor_level < SurvivalSystem.MONITOR_NAMES.size() - 1:
		var next_mon: int = survival.monitor_level + 1
		var cost: float = float(SurvivalSystem.MONITOR_COSTS[next_mon])
		var feats: Array = ["Голые свечи", "+Объемы (Volume)", "+RSI и Толпа", "+Тепловая карта ликвидаций"]
		monitor_desc.text = "Текущий: %s\nСледующий: %s (%s)" % [
			SurvivalSystem.MONITOR_NAMES[survival.monitor_level],
			SurvivalSystem.MONITOR_NAMES[next_mon],
			feats[next_mon]
		]
		monitor_btn.text = "Улучшить ($%.0f)" % cost
		monitor_btn.disabled = cur_balance < cost
	else:
		monitor_desc.text = "Максимум: Станция из 6 мониторов (Вся аналитика открыта)"
		monitor_btn.text = "Куплено"
		monitor_btn.disabled = true

	# UPS & Fiber
	if not survival.has_ups_fiber:
		ups_btn.text = "Купить ($%.0f)" % SurvivalSystem.UPS_FIBER_COST
		ups_btn.disabled = cur_balance < SurvivalSystem.UPS_FIBER_COST
	else:
		ups_btn.text = "Установлено"
		ups_btn.disabled = true

	# Hardware Wallet
	if not survival.has_hardware_wallet:
		wallet_btn.text = "Купить ($%.0f)" % SurvivalSystem.HARDWARE_WALLET_COST
		wallet_btn.disabled = cur_balance < SurvivalSystem.HARDWARE_WALLET_COST
	else:
		wallet_btn.text = "В наличии"
		wallet_btn.disabled = true

	# Cat Pet
	if not survival.has_cat:
		cat_btn.text = "Приютить ($%.0f)" % SurvivalSystem.CAT_COST
		cat_btn.disabled = cur_balance < SurvivalSystem.CAT_COST
	else:
		cat_btn.text = "Мурчит на столе"
		cat_btn.disabled = true

	# VIP channels
	if news_manager.vip_channel_tier == 0:
		vip1_btn.disabled = cur_balance < NewsManager.VIP_TIER_COSTS[1]
		vip2_btn.disabled = cur_balance < NewsManager.VIP_TIER_COSTS[2]
		vip1_btn.text = "Подписка ($20)"
		vip2_btn.text = "Подписка ($100)"
	elif news_manager.vip_channel_tier == 1:
		vip1_btn.text = "Активна"
		vip1_btn.disabled = true
		vip2_btn.disabled = cur_balance < NewsManager.VIP_TIER_COSTS[2]
	elif news_manager.vip_channel_tier == 2:
		vip1_btn.disabled = true
		vip2_btn.text = "Активна"
		vip2_btn.disabled = true

func _on_chair_btn_pressed() -> void:
	var next_chair: int = survival.chair_level + 1
	var cost: float = float(SurvivalSystem.CHAIR_COSTS[next_chair])
	if game_state.exchange_balances[game_state.selected_exchange] >= cost:
		game_state.exchange_balances[game_state.selected_exchange] -= cost
		survival.chair_level = next_chair
		item_purchased.emit("CHAIR", next_chair)

func _on_monitor_btn_pressed() -> void:
	var next_mon: int = survival.monitor_level + 1
	var cost: float = float(SurvivalSystem.MONITOR_COSTS[next_mon])
	if game_state.exchange_balances[game_state.selected_exchange] >= cost:
		game_state.exchange_balances[game_state.selected_exchange] -= cost
		survival.monitor_level = next_mon
		item_purchased.emit("MONITOR", next_mon)

func _on_ups_btn_pressed() -> void:
	var cost: float = SurvivalSystem.UPS_FIBER_COST
	if game_state.exchange_balances[game_state.selected_exchange] >= cost:
		game_state.exchange_balances[game_state.selected_exchange] -= cost
		survival.has_ups_fiber = true
		item_purchased.emit("UPS", 1)

func _on_wallet_btn_pressed() -> void:
	var cost: float = SurvivalSystem.HARDWARE_WALLET_COST
	if game_state.exchange_balances[game_state.selected_exchange] >= cost:
		game_state.exchange_balances[game_state.selected_exchange] -= cost
		survival.has_hardware_wallet = true
		item_purchased.emit("WALLET", 1)

func _on_cat_btn_pressed() -> void:
	var cost: float = SurvivalSystem.CAT_COST
	if game_state.exchange_balances[game_state.selected_exchange] >= cost:
		game_state.exchange_balances[game_state.selected_exchange] -= cost
		survival.has_cat = true
		item_purchased.emit("CAT", 1)

func _on_close_btn_pressed() -> void:
	hide()
	closed.emit()

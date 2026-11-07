class_name NewsManager
extends RefCounted

signal news_broadcasted(item: Dictionary)

# VIP Channel subscription status:
# 0 = None
# 1 = Cheap Telegram Signal Channel ($20/week, often false signals / dump on crowd)
# 2 = Elite Whale VIP Club ($100/week, gives reliable advance warning for next turn)
var vip_channel_tier: int = 0
const VIP_TIER_NAMES: Array = ["Нет", "Крипто-Сигналы 1000x ($20)", "Whale Alpha Club VIP ($100)"]
const VIP_TIER_COSTS: Array = [0.0, 20.0, 100.0]

# Pre-computed insider hint for the upcoming turn (from VIP channel)
var upcoming_market_event: Dictionary = {}

# News pool definitions according to GDD
# Type: MARKET (moves candle), PLATFORM (bans/fees), LIFESTYLE / MISC
const MARKET_EVENTS: Array = [
	{
		"id": "ELON_TWEET",
		"title": "Илон сменил аватарку на собаку!",
		"desc": "Мемкоины взлетают, рынок охвачен безумием розничных инвесторов.",
		"type": "MARKET",
		"impulse": 0.08,
		"squeeze": 1.4,
		"impact_text": "ПАМП +8%"
	},
	{
		"id": "BRIDGE_HACK",
		"title": "Хакеры взломали межсетевой мост!",
		"desc": "Похищено $120M, паника в секторе DeFi, волна распродаж.",
		"type": "MARKET",
		"impulse": -0.09,
		"squeeze": 1.5,
		"impact_text": "ДАМП -9%"
	},
	{
		"id": "FED_RATE",
		"title": "Заседание ФРС по ключевой ставке!",
		"desc": "Колоссальная волатильность в обе стороны. Бритва для шортистов и лонгистов.",
		"type": "MARKET",
		"impulse": 0.01,
		"squeeze": 2.5, # massive wicks in both directions
		"impact_text": "ВЕРТОЛЕТ / СКВИЗ"
	},
	{
		"id": "ETF_INFLOW",
		"title": "Рекордный приток средств в спотовые ETF!",
		"desc": "Институционалы выкупают предложение стаканов с невиданной силой.",
		"type": "MARKET",
		"impulse": 0.06,
		"squeeze": 1.2,
		"impact_text": "ПАМП +6%"
	},
	{
		"id": "REGULATORY_CRACKDOWN",
		"title": "Регулятор подал иск против криптопроектов!",
		"desc": "Медведи ликуют, панические ордера валят рынок.",
		"type": "MARKET",
		"impulse": -0.07,
		"squeeze": 1.3,
		"impact_text": "ДАМП -7%"
	}
]

const PLATFORM_EVENTS: Array = [
	{
		"id": "PUMPBIT_FREEZE",
		"title": "Биржа PumpBit приостановила выводы на аудит!",
		"desc": "Внезапная проверка безопасности. Вывод и торговля заморожены.",
		"type": "PLATFORM",
		"target_exchange": "PumpBit",
		"lock_turns": 4
	},
	{
		"id": "DEX_GAS_SPIKE",
		"title": "Сеть перегружена мемкоинами — газ вырос в 4 раза!",
		"desc": "Комиссии за своп на UniSwamp подскочили до небес.",
		"type": "PLATFORM",
		"target_exchange": "UniSwamp",
		"gas_spike": true
	},
	{
		"id": "BANANANCE_MAINTENANCE",
		"title": "Bananance объявила внеплановое техобслуживание!",
		"desc": "Аккаунт временно недоступен для ордеров на 1 ход.",
		"type": "PLATFORM",
		"target_exchange": "Bananance",
		"lock_turns": 1
	}
]

# History log of broadcasted news
var news_history: Array = []

func reset() -> void:
	vip_channel_tier = 0
	upcoming_market_event.clear()
	news_history.clear()

# Generates or prepares next step events
# Called before advancing market turn
func prepare_turn_events(news_frequency: float, bans_enabled: bool) -> Dictionary:
	var roll: float = randf()
	var selected_event: Dictionary = {}

	if roll < news_frequency:
		# Decide whether market event or platform event
		if bans_enabled and randf() < 0.25:
			# Platform event
			var pe_idx: int = randi() % PLATFORM_EVENTS.size()
			selected_event = PLATFORM_EVENTS[pe_idx].duplicate()
		else:
			# Market event
			var me_idx: int = randi() % MARKET_EVENTS.size()
			selected_event = MARKET_EVENTS[me_idx].duplicate()

	upcoming_market_event = selected_event
	return selected_event

# Generates VIP channel leak/hint based on tier
func get_vip_insider_hint() -> String:
	if vip_channel_tier == 0:
		return ""

	if vip_channel_tier == 1:
		# Cheap signal channel: 60% chance to give misleading / inverted signal
		if randf() < 0.60:
			var fake_signals: Array = [
				"🚨 ИНСАЙД: Срочно в LONG на все плечи! Ракета заправлена!",
				"📉 СИГНАЛ: Шортим дно! Крупный кит сливает 50,000 монет!",
				"💎 СЕКРЕТНЫЙ ЧАТ: Памп через 10 минут! Не будьте хомяками, покупайте!"
			]
			return "[Сигналы 1000x]: " + fake_signals[randi() % fake_signals.size()]
		else:
			if not upcoming_market_event.is_empty() and upcoming_market_event.get("type") == "MARKET":
				return "[Сигналы 1000x]: Инсайд подтвержден: " + upcoming_market_event.get("title", "")
			return "[Сигналы 1000x]: Рынок спокоен, закупайтесь лесенкой."

	elif vip_channel_tier == 2:
		# Elite Whale VIP: 85% accurate early intelligence
		if not upcoming_market_event.is_empty() and upcoming_market_event.get("type") == "MARKET":
			return "[Whale Alpha Club]: ⚠️ Внимание членам клуба: ожидается %s! Рекомендуем скорректировать позиции." % upcoming_market_event.get("impact_text", "движение")
		else:
			return "[Whale Alpha Club]: На рынке штиль. Маркетмейкер копит ликвидность."

	return ""

# Broadcasts and logs event
func broadcast_event(event: Dictionary, current_time_str: String) -> void:
	if event.is_empty():
		return
	var item: Dictionary = {
		"time": current_time_str,
		"title": event.get("title", "Новости"),
		"desc": event.get("desc", ""),
		"type": event.get("type", "MARKET"),
		"impact_text": event.get("impact_text", "")
	}
	news_history.push_front(item)
	if news_history.size() > 50:
		news_history.pop_back()
	news_broadcasted.emit(item)

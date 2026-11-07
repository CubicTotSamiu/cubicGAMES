class_name SurvivalSystem
extends RefCounted

signal stats_changed()
signal collapsed()
signal cat_action(action_text: String)

# Three core survival bars (0% to 100%)
var energy: float = 100.0   # Бодрость
var hunger: float = 100.0   # Сытость
var tilt: float = 0.0       # Тильт / Стресс (0 = zen, 100 = full rage/breakdown)

# Base decay rates per awake turn (4h)
var base_energy_decay: float = 12.0
var base_hunger_decay: float = 10.0

# Upgrades
# Chairs: reduces energy burn per turn
# 0 = Kitchen stool (-12% energy)
# 1 = Used office chair (-9% energy)
# 2 = Gaming chair (-6% energy)
# 3 = Herman Miller throne (-3% energy)
var chair_level: int = 0
const CHAIR_NAMES: Array = [
	"Кухонная табуретка",
	"Офисное кресло б/у",
	"Геймерский ковш",
	"Эргономичный трон Herman Miller"
]
const CHAIR_COSTS: Array = [0, 80, 250, 800]
const CHAIR_DECAY_RATES: Array = [12.0, 9.0, 6.0, 3.0]

# Monitors: unlocks analytics
# 0 = Old CRT (bare candles)
# 1 = Widescreen (volume histogram)
# 2 = Dual Monitors (RSI + Crowd sentiment)
# 3 = 6-Monitor Station (Liquidation Heatmap)
var monitor_level: int = 0
const MONITOR_NAMES: Array = [
	"Старый монитор CRT",
	"Широкоформатный экран",
	"Два монитора на кронштейне",
	"Станция из 6 мониторов"
]
const MONITOR_COSTS: Array = [0, 150, 400, 1200]

# Hardware & Connectivity
# Fiber + UPS: removes slippage and protects against city blackouts
var has_ups_fiber: bool = false
const UPS_FIBER_COST: float = 350.0

# Cold Wallet Hardware device (Ledger)
var has_hardware_wallet: bool = false
const HARDWARE_WALLET_COST: float = 120.0

# Pet: Orange Cat
# Passively reduces tilt by 5% each turn
# 1% chance to jump on desk and close position
var has_cat: bool = false
const CAT_COST: float = 100.0

# Food definitions
# Type 0: Doshirak / Instant noodles ($5): +25% Hunger, +5% Tilt
# Type 1: Shawarma / Pizza ($15): +50% Hunger, -5% Tilt
# Type 2: Restaurant ($50): +100% Hunger, -25% Tilt, skips 1 turn
const FOOD_DOSHIRAK: Dictionary = {
	"id": "DOSHIRAK",
	"name": "Лапша быстрого приготовления",
	"cost": 5.0,
	"hunger": 25.0,
	"tilt": 5.0,
	"skip_turns": 0
}
const FOOD_PIZZA: Dictionary = {
	"id": "PIZZA",
	"name": "Доставка шаурмы / пиццы",
	"cost": 15.0,
	"hunger": 50.0,
	"tilt": -5.0,
	"skip_turns": 0
}
const FOOD_RESTAURANT: Dictionary = {
	"id": "RESTAURANT",
	"name": "Поход в ресторан",
	"cost": 50.0,
	"hunger": 100.0,
	"tilt": -25.0,
	"skip_turns": 1
}

# Reset / Init
func reset() -> void:
	energy = 100.0
	hunger = 100.0
	tilt = 0.0
	chair_level = 0
	monitor_level = 0
	has_ups_fiber = false
	has_hardware_wallet = false
	has_cat = false

# Process survival tick for 1 normal turn (4h)
# Returns true if player collapsed from exhaustion
func tick_turn() -> bool:
	# Energy decay
	var decay: float = CHAIR_DECAY_RATES[chair_level]
	energy = max(0.0, energy - decay)

	# Hunger decay
	hunger = max(0.0, hunger - base_hunger_decay)

	# Starvation penalty adds tilt
	if hunger <= 0.0:
		tilt = min(100.0, tilt + 10.0)

	# Cat passive tilt relief
	if has_cat:
		tilt = max(0.0, tilt - 5.0)

	# Check collapse at 0% energy
	if energy <= 0.0:
		collapsed.emit()
		return true

	stats_changed.emit()
	return false

# Sleep action: skips 2 turns (8 hours), restores +70% energy
func perform_sleep() -> void:
	energy = min(100.0, energy + 70.0)
	# Hunger still drops during sleep (2 turns worth)
	hunger = max(0.0, hunger - (base_hunger_decay * 2.0))
	# Tilt relaxes during good rest
	tilt = max(0.0, tilt - 10.0)
	stats_changed.emit()

# Forced collapse sleep (when reaching 0% energy):
# Skips 3 turns (12 hours) + restores +60% energy, hunger down by 3 turns, adds tilt
func handle_forced_collapse() -> void:
	energy = 60.0
	hunger = max(0.0, hunger - (base_hunger_decay * 3.0))
	tilt = min(100.0, tilt + 20.0)
	stats_changed.emit()

# Eat food
func eat_food(food_data: Dictionary) -> void:
	hunger = min(100.0, hunger + float(food_data.get("hunger", 0.0)))
	tilt = clamp(tilt + float(food_data.get("tilt", 0.0)), 0.0, 100.0)
	stats_changed.emit()

# Modify tilt (e.g. from Stop Loss or Liquidation)
func add_tilt(delta: float) -> void:
	tilt = clamp(tilt + delta, 0.0, 100.0)
	stats_changed.emit()

# Check if tilt causes "Degenerate breakdown" (Лудоманский срыв)
# At Tilt > 75%, 20% chance to force max leverage or drop SL
func should_trigger_tilt_breakdown() -> bool:
	if tilt > 75.0:
		return randf() < 0.20
	return false

# Check if cat jumps on keyboard and closes trade (1% chance per turn if cat owned)
func check_cat_keyboard_incident() -> bool:
	if has_cat and randf() < 0.01:
		cat_action.emit("Рыжий кот прыгнул на клавиатуру и нажал кнопку закрытия сделки по рынку!")
		return true
	return false

# Slippage calculation:
# Standard slippage is 0.5% (0.005) on CEX, 1.5% (0.015) on DEX.
# If UPS + Fiber owned, slippage is 0.0% (except on DEX where base is reduced).
func get_effective_slippage(is_dex: bool) -> float:
	if has_ups_fiber:
		return 0.002 if is_dex else 0.0
	else:
		return 0.015 if is_dex else 0.005

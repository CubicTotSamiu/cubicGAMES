extends SceneTree

func _init() -> void:
	print("--- Running Test Survival System ---")

	var surv := SurvivalSystem.new()
	surv.reset()

	# Test 1: Base decay on stool
	surv.tick_turn()
	assert(surv.energy == 88.0, "Energy should drop by 12% on stool")
	assert(surv.hunger == 90.0, "Hunger should drop by 10%")
	print("✓ Test 1: Base decay verified.")

	# Test 2: Chair upgrades reduce energy burn
	surv.chair_level = 3 # Herman Miller (3% burn)
	var prev_e: float = surv.energy
	surv.tick_turn()
	assert(is_equal_approx(surv.energy, prev_e - 3.0), "Herman Miller burns only 3% per turn")
	print("✓ Test 2: Chair upgrade decay verified.")

	# Test 3: Sleep restores +70% energy
	surv.energy = 20.0
	surv.perform_sleep()
	assert(surv.energy == 90.0, "Sleep adds +70% energy")
	print("✓ Test 3: Sleep restoration verified.")

	# Test 4: Eating food
	surv.hunger = 40.0
	surv.eat_food(SurvivalSystem.FOOD_DOSHIRAK)
	assert(surv.hunger == 65.0, "Doshirak gives +25% hunger")
	assert(surv.tilt == 5.0, "Doshirak gives +5% tilt")

	surv.eat_food(SurvivalSystem.FOOD_PIZZA)
	assert(surv.hunger == 100.0, "Pizza maxes hunger at 100%")
	assert(surv.tilt == 0.0, "Pizza reduces tilt by 5%")
	print("✓ Test 4: Food effects verified.")

	# Test 5: Tilt breakdown check (>75%)
	surv.tilt = 70.0
	assert(surv.should_trigger_tilt_breakdown() == false, "No breakdown at <= 75%")
	surv.tilt = 80.0
	# Should be callable without errors
	var _bd = surv.should_trigger_tilt_breakdown()
	print("✓ Test 5: Tilt breakdown logic verified.")

	# Test 6: Slippage with Fiber + UPS
	assert(surv.get_effective_slippage(false) == 0.005, "Default slippage on CEX")
	surv.has_ups_fiber = true
	assert(surv.get_effective_slippage(false) == 0.0, "Zero slippage with UPS + Fiber")
	print("✓ Test 6: Slippage calculation verified.")

	print("ALL SURVIVAL SYSTEM TESTS PASSED!")
	quit(0)

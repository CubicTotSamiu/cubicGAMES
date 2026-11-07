extends SceneTree

var dashboard: Dashboard
var tested: bool = false

func _initialize() -> void:
	print("===========================================")
	print("  RUNNING TRUE TRADER INTEGRATION TESTS    ")
	print("===========================================")

	var dash_scene: PackedScene = load("res://scenes/dashboard.tscn")
	assert(dash_scene != null, "Dashboard scene must load")

	dashboard = dash_scene.instantiate()
	root.add_child(dashboard)

func _process(_delta: float) -> bool:
	if tested or dashboard == null or dashboard.game_state == null:
		return false

	tested = true
	run_tests()
	quit(0)
	return true

func run_tests() -> void:
	print("Testing Dashboard initialization in Realism mode...")
	assert(dashboard.game_state != null, "game_state must be initialized")
	assert(dashboard.game_state.current_mode == GameState.MODE_REALISM, "Default mode should be Realism")
	assert(dashboard.game_state.get_net_worth() == 1000.0, "Starting net worth should be 1000")
	assert(dashboard.survival.energy == 100.0, "Full energy on start")
	assert(dashboard.survival.hunger == 100.0, "Full hunger on start")
	assert(dashboard.survival.tilt == 0.0, "Zero tilt on start")
	print("✓ Dashboard init passed.")

	# Test trade lifecycle: Open Long -> Advance Turn -> Check PnL -> Close Position
	print("Testing Trade lifecycle...")
	dashboard.margin_spin.value = 200.0
	dashboard._set_leverage(10)
	dashboard.open_trade("LONG")
	assert(not dashboard.current_position.is_empty(), "Position should be open")
	assert(dashboard.current_position.margin == 200.0, "Margin should be 200")
	assert(dashboard.current_position.leverage == 10, "Leverage should be 10")
	assert(dashboard.game_state.exchange_balances[GameState.EX_BANANANCE] == 800.0, "Margin deducted from exchange")

	# Advance 1 step
	var initial_turn: int = dashboard.game_state.current_turn
	dashboard.advance_step()
	assert(dashboard.game_state.current_turn == initial_turn + 1, "Turn incremented")
	assert(dashboard.survival.energy < 100.0, "Energy decayed")
	assert(dashboard.survival.hunger < 100.0, "Hunger decayed")
	print("✓ Trade execution and turn advancement passed.")

	# Close position if still active
	if not dashboard.current_position.is_empty():
		dashboard.close_current_position("Manual close test")
		assert(dashboard.current_position.is_empty(), "Position closed")
	print("✓ Position close passed.")

	# Test Eating
	print("Testing Survival actions (Eating & Sleep)...")
	var prev_hunger: float = dashboard.survival.hunger
	dashboard._on_pizza_pressed()
	assert(dashboard.survival.hunger > prev_hunger, "Hunger restored by pizza")

	# Test Sleep (skips 2 turns = 8 hours)
	var pre_sleep_turn: int = dashboard.game_state.current_turn
	dashboard.survival.energy = 30.0
	dashboard.perform_sleep()
	assert(dashboard.survival.energy > 30.0, "Sleep restored energy")
	assert(dashboard.game_state.current_turn == pre_sleep_turn + 2, "Sleep advanced 2 turns")
	print("✓ Survival actions passed.")

	# Test Shop Purchases
	print("Testing Shop upgrades...")
	dashboard.shop_modal.setup(dashboard.survival, dashboard.game_state, dashboard.news_manager)
	dashboard.game_state.exchange_balances[GameState.EX_BANANANCE] = 5000.0
	dashboard.shop_modal._on_chair_btn_pressed()
	assert(dashboard.survival.chair_level == 1, "Chair upgraded to office chair")
	dashboard.shop_modal._on_monitor_btn_pressed()
	assert(dashboard.survival.monitor_level == 1, "Monitor upgraded to widescreen")
	dashboard.shop_modal._on_ups_btn_pressed()
	assert(dashboard.survival.has_ups_fiber == true, "UPS & Fiber purchased")
	dashboard.shop_modal._on_cat_btn_pressed()
	assert(dashboard.survival.has_cat == true, "Orange Cat acquired")
	print("✓ Shop purchases passed.")

	# Test Loans
	print("Testing Loan modal...")
	dashboard.loan_modal.setup(dashboard.game_state)
	var pre_debt: float = dashboard.game_state.total_loan_debt
	dashboard.loan_modal._on_take_bank_loan_pressed()
	assert(dashboard.game_state.total_loan_debt == pre_debt + 500.0, "Bank loan added to debt")
	print("✓ Loans passed.")

	# Test Exchange Transfers
	print("Testing Exchange modal...")
	dashboard.exchange_modal.setup(dashboard.game_state, dashboard.survival)
	var ban_before: float = dashboard.game_state.exchange_balances[GameState.EX_BANANANCE]
	var pump_before: float = dashboard.game_state.exchange_balances[GameState.EX_PUMPBIT]
	dashboard.game_state.transfer_funds(GameState.EX_BANANANCE, GameState.EX_PUMPBIT, 500.0)
	assert(dashboard.game_state.exchange_balances[GameState.EX_BANANANCE] == ban_before - 500.0, "Bananance deducted")
	assert(dashboard.game_state.exchange_balances[GameState.EX_PUMPBIT] == pump_before + 500.0, "PumpBit credited")
	print("✓ Exchange transfers passed.")

	# Test Casual Mode Switch
	print("Testing Mode switching...")
	dashboard.start_new_game(GameState.MODE_CASUAL, {})
	assert(dashboard.game_state.current_mode == GameState.MODE_CASUAL, "Switched to Casual")
	assert(dashboard.game_state.survival_enabled == false, "Survival disabled in casual")
	assert(dashboard.game_state.get_net_worth() == 100.0, "Casual starting net worth is $100")
	print("✓ Casual mode switch passed.")

	# Test Custom Sandbox Mode
	dashboard.start_new_game(GameState.MODE_CUSTOM, {
		"start_balance": 5000.0,
		"target_balance": 50000.0,
		"survival_enabled": true,
		"bans_enabled": false
	})
	assert(dashboard.game_state.current_mode == GameState.MODE_CUSTOM, "Switched to Custom")
	assert(dashboard.game_state.get_net_worth() == 5000.0, "Custom starting balance $5000")
	assert(dashboard.game_state.win_target_balance == 50000.0, "Custom target $50000")
	assert(dashboard.game_state.bans_enabled == false, "Custom bans disabled")
	print("✓ Custom mode setup passed.")

	# Test Victory Trigger
	dashboard.game_state.exchange_balances[GameState.EX_BANANANCE] = 60000.0
	dashboard.game_state.check_win_loss_conditions()
	assert(dashboard.game_state.is_game_over == true, "Game Over triggered")
	assert(dashboard.game_state.is_victory == true, "Victory state recorded")
	print("✓ Victory condition passed.")

	print("===========================================")
	print("  ALL INTEGRATION TESTS PASSED PERFECTLY!  ")
	print("===========================================")

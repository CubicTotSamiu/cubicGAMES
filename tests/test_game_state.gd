extends SceneTree

func _init() -> void:
	print("--- Running Test Game State ---")

	# Test 1: Modes initialization
	var state := GameState.new()
	state.init_mode(GameState.MODE_CASUAL)
	assert(state.win_target_balance == 1000.0, "Casual target is 1000")
	assert(state.exchange_balances[GameState.EX_BANANANCE] == 100.0, "Casual start is 100")
	assert(state.survival_enabled == false, "Casual survival should be disabled")
	print("✓ Test 1: Casual mode init passed.")

	state.init_mode(GameState.MODE_REALISM)
	assert(state.win_target_balance == 10000.0, "Realism target is 10000")
	assert(state.exchange_balances[GameState.EX_BANANANCE] == 1000.0, "Realism start is 1000")
	assert(state.survival_enabled == true, "Realism survival should be enabled")
	print("✓ Test 2: Realism mode init passed.")

	# Test 3: Time & Turn progression
	# 6 turns = 1 day
	for i in range(6):
		state.advance_turn_step()
	assert(state.get_current_day() == 2, "6 turns should advance to Day 2")
	assert(state.get_current_hour() == 0, "6 turns should wrap to 00:00")
	print("✓ Test 3: Time and turns passed.")

	# Test 4: Exchange transfers and Cold Wallet delay
	var success_direct: bool = state.transfer_funds(GameState.EX_BANANANCE, GameState.EX_PUMPBIT, 200.0)
	assert(success_direct, "Direct transfer should succeed")
	assert(state.exchange_balances[GameState.EX_BANANANCE] == 800.0, "Bananance deducted")
	assert(state.exchange_balances[GameState.EX_PUMPBIT] == 200.0, "PumpBit credited")
	assert(state.pumpbit_bonus == 40.0, "20% bonus added to pumpbit_bonus")

	# Transfer to Cold Wallet (takes 1 turn delay)
	var success_cold: bool = state.transfer_funds(GameState.EX_BANANANCE, GameState.EX_COLDWALLET, 300.0)
	assert(success_cold, "Cold wallet transfer initiated")
	assert(state.exchange_balances[GameState.EX_COLDWALLET] == 0.0, "Not credited immediately")
	assert(state.pending_transfers.size() == 1, "Pending transfer queued")

	state.advance_turn_step()
	assert(state.exchange_balances[GameState.EX_COLDWALLET] == 300.0, "Credited after 1 turn")
	assert(state.pending_transfers.is_empty(), "Pending queue cleared")
	print("✓ Test 4: Transfer logic passed.")

	# Test 5: Loans & Overdue calculation
	state.take_loan(500.0, 0.10) # 10% daily rate
	assert(state.active_loans.size() == 1, "Loan taken")
	assert(state.total_loan_debt == 500.0, "Debt is 500")

	# Advance 6 turns (1 day) to trigger daily interest
	for i in range(6):
		state.advance_turn_step()
	assert(is_equal_approx(state.total_loan_debt, 550.0), "Loan debt should accrue 10% interest after 1 day")
	print("✓ Test 5: Loans and interest passed.")

	print("ALL GAME STATE TESTS PASSED!")
	quit(0)

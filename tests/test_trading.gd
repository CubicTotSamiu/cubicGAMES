extends SceneTree

func _init() -> void:
	print("--- Running Test Trading Engine ---")

	# Test 1: Liquidation Price Calculations
	var long_liq: float = TradingEngine.calculate_liquidation_price(100.0, "LONG", 10)
	assert(is_equal_approx(long_liq, 90.0), "LONG 10x liq at 100 should be 90")

	var short_liq: float = TradingEngine.calculate_liquidation_price(100.0, "SHORT", 10)
	assert(is_equal_approx(short_liq, 110.0), "SHORT 10x liq at 100 should be 110")

	var x100_long_liq: float = TradingEngine.calculate_liquidation_price(100.0, "LONG", 100)
	assert(is_equal_approx(x100_long_liq, 99.0), "LONG 100x liq at 100 should be 99")
	print("✓ Test 1: Liquidation calculation passed.")

	# Test 2: PnL calculation
	var pos: Dictionary = {
		"type": "LONG",
		"margin": 100.0,
		"leverage": 10,
		"entry_price": 100.0
	}
	var pnl_dict: Dictionary = TradingEngine.calculate_pnl(pos, 105.0)
	assert(is_equal_approx(pnl_dict.pnl, 50.0), "10x Long +5% price change should result in +$50 PnL")
	assert(is_equal_approx(pnl_dict.roe, 50.0), "ROE should be +50%")
	print("✓ Test 2: PnL calculation passed.")

	# Test 3: Priority Check - Liquidation beats Stop Loss and Take Profit
	# Scenario: Candle has extreme wicks that cross TP, SL, and Liq.
	# High = 120 (crosses TP at 115), Low = 85 (crosses SL at 95 and Liq at 90).
	var candle_extreme: Dictionary = {
		"open": 100.0,
		"high": 120.0,
		"low": 85.0,
		"close": 110.0,
		"volume": 200.0
	}
	var pos_long_test: Dictionary = {
		"type": "LONG",
		"margin": 100.0,
		"leverage": 10,
		"entry_price": 100.0,
		"liquidation_price": 90.0,
		"stop_loss": 95.0,
		"take_profit": 115.0
	}
	var res_liq: Dictionary = TradingEngine.evaluate_candle_for_position(candle_extreme, pos_long_test)
	assert(res_liq.status == "LIQUIDATED", "Liquidation must have highest priority over SL and TP!")
	assert(res_liq.pnl == -100.0, "Margin wiped on liquidation")
	print("✓ Test 3: Liquidation highest priority passed.")

	# Test 4: Stop Loss beats Take Profit if low touches SL and high touches TP
	var candle_sl_tp: Dictionary = {
		"open": 100.0,
		"high": 120.0, # touches TP at 115
		"low": 93.0,   # touches SL at 95, but does NOT touch Liq at 90
		"close": 110.0
	}
	var res_sl: Dictionary = TradingEngine.evaluate_candle_for_position(candle_sl_tp, pos_long_test)
	assert(res_sl.status == "STOP_LOSS", "Stop Loss must take priority over Take Profit in worst-case scenario")
	print("✓ Test 4: Stop Loss priority over Take Profit passed.")

	# Test 5: Take Profit triggers if only TP touched
	var candle_tp: Dictionary = {
		"open": 100.0,
		"high": 116.0,
		"low": 98.0,
		"close": 112.0
	}
	var res_tp: Dictionary = TradingEngine.evaluate_candle_for_position(candle_tp, pos_long_test)
	assert(res_tp.status == "TAKE_PROFIT", "Take Profit should trigger")
	assert(res_tp.pnl > 0.0, "Profit must be positive")
	print("✓ Test 5: Take Profit execution passed.")

	# Test 6: Candle generator
	var candle_gen: Dictionary = TradingEngine.generate_next_candle(100.0, 0.02, 0.08, 1.5, 1, "Elon Tweet")
	assert(candle_gen.open == 100.0, "Open should equal previous close")
	assert(candle_gen.high >= max(candle_gen.open, candle_gen.close), "High >= max(O, C)")
	assert(candle_gen.low <= min(candle_gen.open, candle_gen.close), "Low <= min(O, C)")
	print("✓ Test 6: Candle generator structure valid.")

	print("ALL TRADING ENGINE TESTS PASSED!")
	quit(0)

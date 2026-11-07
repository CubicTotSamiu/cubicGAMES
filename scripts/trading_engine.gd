class_name TradingEngine
extends RefCounted

# Structure of a candle:
# {
#   "open": float,
#   "high": float,
#   "low": float,
#   "close": float,
#   "volume": float,
#   "turn": int,
#   "event_label": String
# }

# Structure of an active position:
# {
#   "type": "LONG" | "SHORT",
#   "margin": float,
#   "leverage": int,
#   "entry_price": float,
#   "liquidation_price": float,
#   "stop_loss": float, # 0.0 means not set
#   "take_profit": float, # 0.0 means not set
#   "exchange": String,
#   "coin": String
# }

# Calculate liquidation price according to GDD:
# For LONG: Liq = Entry * (1 - 1/Leverage)
# For SHORT: Liq = Entry * (1 + 1/Leverage)
static func calculate_liquidation_price(entry_price: float, position_type: String, leverage: int) -> float:
	if leverage <= 0:
		leverage = 1
	var margin_ratio: float = 1.0 / float(leverage)
	if position_type == "LONG":
		var liq: float = entry_price * (1.0 - margin_ratio)
		return max(0.0, liq)
	else: # SHORT
		return entry_price * (1.0 + margin_ratio)

# Calculate Unrealized PnL:
# Size in asset = (margin * leverage) / entry_price
# Long PnL = (current_price - entry_price) * size
# Short PnL = (entry_price - current_price) * size
static func calculate_pnl(position: Dictionary, current_price: float) -> Dictionary:
	if position.is_empty():
		return {"pnl": 0.0, "roe": 0.0}

	var margin: float = float(position.get("margin", 0.0))
	var leverage: int = int(position.get("leverage", 1))
	var entry_price: float = float(position.get("entry_price", current_price))
	var pos_type: String = String(position.get("type", "LONG"))

	if entry_price <= 0.0 or margin <= 0.0:
		return {"pnl": 0.0, "roe": 0.0}

	var notional: float = margin * float(leverage)
	var price_change_ratio: float = (current_price - entry_price) / entry_price
	if pos_type == "SHORT":
		price_change_ratio = -price_change_ratio

	var pnl: float = notional * price_change_ratio
	var roe: float = (pnl / margin) * 100.0

	return {"pnl": pnl, "roe": roe}

# Generate next candle from previous close, volatility, and optional news impulse:
# - base_volatility: e.g. 0.02 (±2%)
# - news_impulse: percentage change to apply, e.g. +0.08 (+8%) or -0.10 (-10%)
# - squeeze_factor: multiplier for wicks / shadows (High & Low extension)
static func generate_next_candle(prev_close: float, base_volatility: float = 0.02, news_impulse: float = 0.0, squeeze_factor: float = 1.0, turn_idx: int = 1, event_label: String = "") -> Dictionary:
	var open_price: float = prev_close

	# Random walk percentage between -base_volatility and +base_volatility
	var random_delta: float = randf_range(-base_volatility, base_volatility)
	var total_pct_change: float = random_delta + news_impulse

	var target_close: float = open_price * (1.0 + total_pct_change)
	target_close = max(0.01, target_close)

	# Compute wick extensions
	# Shadow range expands with squeeze_factor and base volatility
	var wick_padding: float = abs(target_close - open_price) * 0.4 + (open_price * base_volatility * 0.5)
	wick_padding *= max(1.0, squeeze_factor)

	var high_wick: float = randf_range(0.1, 1.0) * wick_padding
	var low_wick: float = randf_range(0.1, 1.0) * wick_padding

	var high_price: float = max(open_price, target_close) + high_wick
	var low_price: float = min(open_price, target_close) - low_wick
	low_price = max(0.01, low_price)

	# Volume: proportional to price movement and squeeze
	var base_vol: float = randf_range(100.0, 500.0)
	var vol_mult: float = (1.0 + abs(total_pct_change) * 10.0) * squeeze_factor
	var volume: float = base_vol * vol_mult

	return {
		"open": open_price,
		"high": high_price,
		"low": low_price,
		"close": target_close,
		"volume": volume,
		"turn": turn_idx,
		"event_label": event_label
	}

# Evaluate position outcomes inside a candle based on strict GDD order:
# 1. Liquidation: If candle shadow crosses liquidation price -> position wiped, return margin lost
# 2. Stop Loss: If candle shadow crosses SL -> closed at SL (with slippage)
# 3. Take Profit: If candle shadow crosses TP -> closed at TP
# Slippage factor: e.g. 0.005 (0.5% extra loss on stop trigger)
static func evaluate_candle_for_position(candle: Dictionary, position: Dictionary, slippage_factor: float = 0.0) -> Dictionary:
	if position.is_empty():
		return {"status": "NO_POSITION"}

	var pos_type: String = String(position.get("type", "LONG"))
	var margin: float = float(position.get("margin", 0.0))
	var leverage: int = int(position.get("leverage", 1))
	var entry_price: float = float(position.get("entry_price", 0.0))
	var liq_price: float = float(position.get("liquidation_price", 0.0))
	var sl: float = float(position.get("stop_loss", 0.0))
	var tp: float = float(position.get("take_profit", 0.0))

	var high: float = float(candle.get("high", 0.0))
	var low: float = float(candle.get("low", 0.0))
	var close_p: float = float(candle.get("close", 0.0))

	# 1. LIQUIDATION CHECK FIRST (Worst-case priority)
	if pos_type == "LONG":
		if low <= liq_price:
			return {
				"status": "LIQUIDATED",
				"reason": "Price breached liquidation level ($%.2f)" % liq_price,
				"exit_price": liq_price,
				"pnl": -margin,
				"tilt_delta": 40.0
			}
	else: # SHORT
		if high >= liq_price:
			return {
				"status": "LIQUIDATED",
				"reason": "Price breached liquidation level ($%.2f)" % liq_price,
				"exit_price": liq_price,
				"pnl": -margin,
				"tilt_delta": 40.0
			}

	# 2. STOP LOSS CHECK SECOND
	if sl > 0.0:
		if pos_type == "LONG" and low <= sl:
			var exit_price: float = sl * (1.0 - slippage_factor)
			var pnl_dict: Dictionary = calculate_pnl_at_price(pos_type, margin, leverage, entry_price, exit_price)
			return {
				"status": "STOP_LOSS",
				"reason": "Stop loss triggered at $%.2f" % exit_price,
				"exit_price": exit_price,
				"pnl": pnl_dict.pnl,
				"tilt_delta": 15.0
			}
		elif pos_type == "SHORT" and high >= sl:
			var exit_price: float = sl * (1.0 + slippage_factor)
			var pnl_dict: Dictionary = calculate_pnl_at_price(pos_type, margin, leverage, entry_price, exit_price)
			return {
				"status": "STOP_LOSS",
				"reason": "Stop loss triggered at $%.2f" % exit_price,
				"exit_price": exit_price,
				"pnl": pnl_dict.pnl,
				"tilt_delta": 15.0
			}

	# 3. TAKE PROFIT CHECK THIRD
	if tp > 0.0:
		if pos_type == "LONG" and high >= tp:
			var exit_price: float = tp
			var pnl_dict: Dictionary = calculate_pnl_at_price(pos_type, margin, leverage, entry_price, exit_price)
			return {
				"status": "TAKE_PROFIT",
				"reason": "Take profit triggered at $%.2f" % exit_price,
				"exit_price": exit_price,
				"pnl": pnl_dict.pnl,
				"tilt_delta": -15.0
			}
		elif pos_type == "SHORT" and low <= tp:
			var exit_price: float = tp
			var pnl_dict: Dictionary = calculate_pnl_at_price(pos_type, margin, leverage, entry_price, exit_price)
			return {
				"status": "TAKE_PROFIT",
				"reason": "Take profit triggered at $%.2f" % exit_price,
				"exit_price": exit_price,
				"pnl": pnl_dict.pnl,
				"tilt_delta": -15.0
			}

	# Position remains open
	var current_pnl: Dictionary = calculate_pnl_at_price(pos_type, margin, leverage, entry_price, close_p)
	return {
		"status": "ACTIVE",
		"exit_price": close_p,
		"pnl": current_pnl.pnl,
		"roe": current_pnl.roe,
		"tilt_delta": 0.0
	}

static func calculate_pnl_at_price(pos_type: String, margin: float, leverage: int, entry_price: float, exit_price: float) -> Dictionary:
	var notional: float = margin * float(leverage)
	var price_change_ratio: float = (exit_price - entry_price) / entry_price
	if pos_type == "SHORT":
		price_change_ratio = -price_change_ratio
	var pnl: float = notional * price_change_ratio
	# Clamp loss to maximum margin
	if pnl < -margin:
		pnl = -margin
	var roe: float = (pnl / margin) * 100.0
	return {"pnl": pnl, "roe": roe}

# Helper to compute technical indicators like RSI and Heatmap
static func calculate_rsi(candles: Array, period: int = 14) -> float:
	if candles.size() < period + 1:
		return 50.0 # Neutral default

	var gains: float = 0.0
	var losses: float = 0.0

	var start_idx: int = candles.size() - period
	for i in range(start_idx, candles.size()):
		var change: float = candles[i].close - candles[i-1].close
		if change > 0.0:
			gains += change
		else:
			losses += abs(change)

	if losses == 0.0:
		return 100.0
	if gains == 0.0:
		return 0.0

	var rs: float = (gains / float(period)) / (losses / float(period))
	return 100.0 - (100.0 / (1.0 + rs))

# Calculate Liquidation Heatmap Zone:
# Predicts magnet zone where liquidations cluster (nearby support/resistance)
static func get_liquidation_heatmap_zone(candles: Array, current_price: float) -> Dictionary:
	if candles.is_empty():
		return {"target_price": current_price, "intensity": 0.5, "direction": "UP"}

	var min_p: float = current_price
	var max_p: float = current_price
	var recent_candles: Array = candles.slice(max(0, candles.size() - 20))
	for c in recent_candles:
		if c.high > max_p:
			max_p = c.high
		if c.low < min_p:
			min_p = c.low

	# If price is closer to max_p, magnet might pull up to squeeze shorts; else down to dump longs
	var dist_high: float = max_p - current_price
	var dist_low: float = current_price - min_p

	if dist_high < dist_low and dist_high > 0.0:
		return {
			"target_price": max_p,
			"intensity": 0.8,
			"direction": "UP",
			"label": "Short Squeeze Cluster"
		}
	else:
		return {
			"target_price": min_p,
			"intensity": 0.8,
			"direction": "DOWN",
			"label": "Long Flush Cluster"
		}

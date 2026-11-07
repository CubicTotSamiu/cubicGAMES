class_name CandlestickChart
extends Control

# Data source
var candles: Array = []
var active_position: Dictionary = {}

# Indicator visibility flags (unlocked by monitors)
var show_volume: bool = false
var show_rsi: bool = false
var show_heatmap: bool = false

# Visual styling
const COLOR_BG: Color = Color(0.06, 0.07, 0.09, 1.0)
const COLOR_GRID: Color = Color(0.14, 0.16, 0.20, 0.6)
const COLOR_GREEN_BULL: Color = Color(0.0, 0.9, 0.46, 1.0) # #00e676
const COLOR_RED_BEAR: Color = Color(1.0, 0.2, 0.4, 1.0)    # #ff3366
const COLOR_ENTRY_LINE: Color = Color(0.0, 0.82, 1.0, 0.9) # Cyan
const COLOR_TP_LINE: Color = Color(0.1, 0.95, 0.5, 0.9)    # Bright Green
const COLOR_SL_LINE: Color = Color(1.0, 0.4, 0.2, 0.9)    # Orange-Red
const COLOR_LIQ_LINE: Color = Color(1.0, 0.05, 0.2, 0.95)  # Crimson Red
const COLOR_HEATMAP_GLOW: Color = Color(1.0, 0.84, 0.0, 0.25) # Gold glow
const COLOR_RSI_LINE: Color = Color(0.8, 0.5, 1.0, 1.0)    # Purple/Lavender
const COLOR_TEXT: Color = Color(0.85, 0.88, 0.92, 1.0)

var font: Font

func _ready() -> void:
	font = ThemeDB.fallback_font

func set_chart_data(p_candles: Array, p_position: Dictionary, monitor_level: int) -> void:
	candles = p_candles
	active_position = p_position

	# Unlock indicators based on monitor level
	show_volume = monitor_level >= 1
	show_rsi = monitor_level >= 2
	show_heatmap = monitor_level >= 3

	queue_redraw()

func _draw() -> void:
	var total_w: float = size.x
	var total_h: float = size.y

	if total_w <= 10.0 or total_h <= 10.0:
		return

	# Draw background
	draw_rect(Rect2(0, 0, total_w, total_h), COLOR_BG)

	if candles.is_empty():
		draw_string(font, Vector2(total_w * 0.4, total_h * 0.5), "Ожидание данных рынка...", HORIZONTAL_ALIGNMENT_CENTER, -1, 14, COLOR_TEXT)
		return

	# Layout geometry
	# Sub-chart heights
	var rsi_height: float = 60.0 if show_rsi else 0.0
	var vol_height: float = 50.0 if show_volume else 0.0
	var margin_bottom: float = 24.0 # Time labels
	var margin_right: float = 75.0  # Price axis labels

	var chart_x: float = 10.0
	var chart_y: float = 20.0
	var chart_w: float = total_w - margin_right - chart_x
	var chart_h: float = total_h - chart_y - margin_bottom - vol_height - rsi_height

	if chart_w <= 10.0 or chart_h <= 10.0:
		return

	# Determine visible candle count
	var max_visible_candles: int = 35
	var start_idx: int = max(0, candles.size() - max_visible_candles)
	var visible_candles: Array = candles.slice(start_idx)
	var candle_count: int = visible_candles.size()

	if candle_count == 0:
		return

	# Find Price Min & Max
	var min_price: float = INF
	var max_price: float = -INF
	var max_volume: float = 1.0

	for c in visible_candles:
		if c.low < min_price:
			min_price = c.low
		if c.high > max_price:
			max_price = c.high
		if c.volume > max_volume:
			max_volume = c.volume

	# Include position target lines in price bounds so lines don't get clipped
	if not active_position.is_empty():
		var ep: float = float(active_position.get("entry_price", 0.0))
		var lp: float = float(active_position.get("liquidation_price", 0.0))
		var sl: float = float(active_position.get("stop_loss", 0.0))
		var tp: float = float(active_position.get("take_profit", 0.0))

		for p in [ep, lp, sl, tp]:
			if p > 0.0:
				if p < min_price:
					min_price = p
				if p > max_price:
					max_price = p

	# Add padding
	var price_span: float = max_price - min_price
	if price_span <= 0.0001:
		price_span = 1.0
	min_price -= price_span * 0.08
	max_price += price_span * 0.08
	price_span = max_price - min_price

	# Helper: Price to Y coordinate
	var price_to_y = func(p: float) -> float:
		var normalized: float = (p - min_price) / price_span
		return chart_y + chart_h - (normalized * chart_h)

	# Draw Horizontal Price Grid Lines
	var grid_steps: int = 5
	for i in range(grid_steps + 1):
		var grid_ratio: float = float(i) / float(grid_steps)
		var grid_y: float = chart_y + (chart_h * grid_ratio)
		var grid_price: float = max_price - (price_span * grid_ratio)

		draw_line(Vector2(chart_x, grid_y), Vector2(chart_x + chart_w, grid_y), COLOR_GRID, 1.0)
		var p_label: String = "$%.2f" % grid_price if grid_price < 100.0 else "$%.0f" % grid_price
		draw_string(font, Vector2(chart_x + chart_w + 6, grid_y + 4), p_label, HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(0.6, 0.65, 0.7))

	# Draw Liquidation Heatmap Zone if unlocked
	if show_heatmap:
		var heatmap: Dictionary = TradingEngine.get_liquidation_heatmap_zone(candles, candles.back().close)
		var target_p: float = float(heatmap.target_price)
		var h_y: float = price_to_y.call(target_p)
		var glow_rect := Rect2(chart_x, h_y - 12, chart_w, 24)
		draw_rect(glow_rect, COLOR_HEATMAP_GLOW)
		draw_string(font, Vector2(chart_x + 10, h_y + 4), "🔥 ТЕПЛОВАЯ КАРТА: " + heatmap.label, HORIZONTAL_ALIGNMENT_LEFT, -1, 11, Color(1, 0.8, 0.2))

	# Candle geometry
	var slot_width: float = chart_w / float(candle_count)
	var body_width: float = max(3.0, slot_width * 0.7)

	for i in range(candle_count):
		var c: Dictionary = visible_candles[i]
		var cx: float = chart_x + (float(i) + 0.5) * slot_width

		var open_y: float = price_to_y.call(c.open)
		var close_y: float = price_to_y.call(c.close)
		var high_y: float = price_to_y.call(c.high)
		var low_y: float = price_to_y.call(c.low)

		var is_bullish: bool = c.close >= c.open
		var candle_color: Color = COLOR_GREEN_BULL if is_bullish else COLOR_RED_BEAR

		# Draw Wicks (High to Low)
		draw_line(Vector2(cx, high_y), Vector2(cx, low_y), candle_color, 1.5)

		# Draw Candle Body
		var body_top: float = min(open_y, close_y)
		var body_height: float = max(2.0, abs(close_y - open_y))
		var body_rect := Rect2(cx - body_width * 0.5, body_top, body_width, body_height)
		draw_rect(body_rect, candle_color)

		# Draw event star marker if candle had news
		if c.get("event_label", "") != "":
			draw_circle(Vector2(cx, high_y - 8), 3.0, Color(1, 0.9, 0.2))

	# Draw Position Overlays (Entry, TP, SL, Liq)
	if not active_position.is_empty():
		var ep: float = float(active_position.get("entry_price", 0.0))
		var lp: float = float(active_position.get("liquidation_price", 0.0))
		var sl: float = float(active_position.get("stop_loss", 0.0))
		var tp: float = float(active_position.get("take_profit", 0.0))
		var pos_type: String = String(active_position.get("type", "LONG"))

		# Entry Line
		if ep > 0.0:
			var ey: float = price_to_y.call(ep)
			draw_line(Vector2(chart_x, ey), Vector2(chart_x + chart_w, ey), COLOR_ENTRY_LINE, 1.5)
			draw_string(font, Vector2(chart_x + 8, ey - 4), "ВХОД %s @ $%.2f" % [pos_type, ep], HORIZONTAL_ALIGNMENT_LEFT, -1, 10, COLOR_ENTRY_LINE)

		# Liquidation Line
		if lp > 0.0:
			var ly: float = price_to_y.call(lp)
			draw_line(Vector2(chart_x, ly), Vector2(chart_x + chart_w, ly), COLOR_LIQ_LINE, 2.0)
			draw_string(font, Vector2(chart_x + chart_w - 180, ly - 4), "💀 ЛИКВИДАЦИЯ @ $%.2f" % lp, HORIZONTAL_ALIGNMENT_LEFT, -1, 10, COLOR_LIQ_LINE)

		# Stop Loss Line
		if sl > 0.0:
			var sy: float = price_to_y.call(sl)
			draw_line(Vector2(chart_x, sy), Vector2(chart_x + chart_w, sy), COLOR_SL_LINE, 1.5)
			draw_string(font, Vector2(chart_x + 8, sy - 4), "🛑 СТОП-ЛОСС @ $%.2f" % sl, HORIZONTAL_ALIGNMENT_LEFT, -1, 10, COLOR_SL_LINE)

		# Take Profit Line
		if tp > 0.0:
			var ty: float = price_to_y.call(tp)
			draw_line(Vector2(chart_x, ty), Vector2(chart_x + chart_w, ty), COLOR_TP_LINE, 1.5)
			draw_string(font, Vector2(chart_x + 8, ty - 4), "🎯 ТЕЙК-ПРОФИТ @ $%.2f" % tp, HORIZONTAL_ALIGNMENT_LEFT, -1, 10, COLOR_TP_LINE)

	# Current Price Tracker on right axis
	var last_candle: Dictionary = visible_candles.back()
	var cur_p: float = last_candle.close
	var cur_y: float = price_to_y.call(cur_p)
	var cur_col: Color = COLOR_GREEN_BULL if last_candle.close >= last_candle.open else COLOR_RED_BEAR

	draw_line(Vector2(chart_x, cur_y), Vector2(chart_x + chart_w + 6, cur_y), cur_col, 1.0)
	var cur_tag_rect := Rect2(chart_x + chart_w + 6, cur_y - 9, 64, 18)
	draw_rect(cur_tag_rect, cur_col)
	var cur_text: String = "$%.2f" % cur_p if cur_p < 100.0 else "$%.0f" % cur_p
	draw_string(font, Vector2(chart_x + chart_w + 10, cur_y + 4), cur_text, HORIZONTAL_ALIGNMENT_LEFT, -1, 11, Color(0.05, 0.05, 0.05))

	# Draw Volume Histogram Sub-chart if unlocked
	var cur_sub_y: float = chart_y + chart_h + 8.0
	if show_volume:
		draw_rect(Rect2(chart_x, cur_sub_y, chart_w, vol_height), Color(0.05, 0.06, 0.07, 0.8))
		draw_string(font, Vector2(chart_x + 6, cur_sub_y + 12), "ОБЪЕМЫ (VOL)", HORIZONTAL_ALIGNMENT_LEFT, -1, 9, Color(0.5, 0.55, 0.6))

		for i in range(candle_count):
			var c: Dictionary = visible_candles[i]
			var cx: float = chart_x + (float(i) + 0.5) * slot_width
			var v_height: float = (c.volume / max_volume) * (vol_height - 14.0)
			var is_bull: bool = c.close >= c.open
			var v_color: Color = Color(0.0, 0.7, 0.35, 0.7) if is_bull else Color(0.8, 0.2, 0.3, 0.7)
			draw_rect(Rect2(cx - body_width * 0.5, cur_sub_y + vol_height - v_height, body_width, v_height), v_color)

		cur_sub_y += vol_height + 6.0

	# Draw RSI Sub-chart if unlocked
	if show_rsi:
		draw_rect(Rect2(chart_x, cur_sub_y, chart_w, rsi_height), Color(0.05, 0.06, 0.07, 0.8))
		var cur_rsi: float = TradingEngine.calculate_rsi(candles, 14)
		draw_string(font, Vector2(chart_x + 6, cur_sub_y + 12), "RSI (14): %.1f | Толпа: 62%% Лонги / 38%% Шорты" % cur_rsi, HORIZONTAL_ALIGNMENT_LEFT, -1, 9, Color(0.7, 0.5, 0.9))

		# Draw 70 (Overbought) and 30 (Oversold) lines
		var rsi_to_y = func(val: float) -> float:
			return cur_sub_y + rsi_height - ((val / 100.0) * (rsi_height - 12.0)) - 6.0

		var rsi_70_y: float = rsi_to_y.call(70.0)
		var rsi_30_y: float = rsi_to_y.call(30.0)
		draw_line(Vector2(chart_x, rsi_70_y), Vector2(chart_x + chart_w, rsi_70_y), Color(0.8, 0.3, 0.3, 0.5), 1.0)
		draw_line(Vector2(chart_x, rsi_30_y), Vector2(chart_x + chart_w, rsi_30_y), Color(0.3, 0.8, 0.3, 0.5), 1.0)

		# Draw RSI Polyline across visible candles
		var rsi_points: PackedVector2Array = []
		for i in range(candle_count):
			var sub_c: Array = candles.slice(0, start_idx + i + 1)
			var pt_rsi: float = TradingEngine.calculate_rsi(sub_c, 14)
			var cx: float = chart_x + (float(i) + 0.5) * slot_width
			rsi_points.append(Vector2(cx, rsi_to_y.call(pt_rsi)))

		if rsi_points.size() > 1:
			draw_polyline(rsi_points, COLOR_RSI_LINE, 1.5, true)

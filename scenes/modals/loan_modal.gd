class_name LoanModal
extends PanelContainer

signal closed()

var game_state: GameState

@onready var debt_label: Label = $VBox/DebtLabel
@onready var loan_list_box: VBoxContainer = $VBox/LoanList
@onready var info_label: Label = $VBox/InfoLabel

func setup(p_state: GameState) -> void:
	game_state = p_state
	update_view()

func update_view() -> void:
	if not game_state:
		return

	debt_label.text = "Текущий суммарный долг: $%.2f" % game_state.total_loan_debt

	# Clear old list
	for child in loan_list_box.get_children():
		child.queue_free()

	if game_state.active_loans.is_empty():
		var empty_lbl := Label.new()
		empty_lbl.text = "У вас нет активных займов."
		empty_lbl.add_theme_color_override("font_color", Color(0.5, 0.8, 0.5))
		loan_list_box.add_child(empty_lbl)
	else:
		for i in range(game_state.active_loans.size()):
			var loan: Dictionary = game_state.active_loans[i]
			var row := HBoxContainer.new()

			var desc := Label.new()
			desc.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			desc.text = "Займ #%d: $%.2f (Ставка: %d%%/день, дней: %d)" % [
				i + 1,
				loan.amount,
				int(loan.daily_interest_rate * 100.0),
				loan.days_overdue
			]
			row.add_child(desc)

			var repay_btn := Button.new()
			repay_btn.text = "Погасить"
			var cur_bal: float = game_state.exchange_balances.get(game_state.selected_exchange, 0.0)
			repay_btn.disabled = cur_bal < loan.amount
			var loan_idx: int = i
			repay_btn.pressed.connect(func():
				_on_repay_pressed(loan_idx)
			)
			row.add_child(repay_btn)

			loan_list_box.add_child(row)

func _on_repay_pressed(idx: int) -> void:
	var ok: bool = game_state.repay_loan(idx)
	if ok:
		info_label.text = "Кредит успешно погашен!"
		update_view()
	else:
		info_label.text = "Недостаточно средств на выбранной бирже для погашения!"

func _on_take_bank_loan_pressed() -> void:
	# Bank loan: $500 at 3% daily
	game_state.take_loan(500.0, 0.03)
	info_label.text = "Взят банковский кредит $500 под 3%/день."
	update_view()

func _on_take_micro_loan_pressed() -> void:
	# Microloan: $100 at 8% daily (instant liquidity for margin call survival)
	game_state.take_loan(100.0, 0.08)
	info_label.text = "Взят микрозайм $100 под 8%/день."
	update_view()

func _on_close_btn_pressed() -> void:
	hide()
	closed.emit()

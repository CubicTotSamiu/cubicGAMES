class_name ModeSelectModal
extends PanelContainer

signal mode_selected(mode: String, custom_params: Dictionary)

@onready var casual_btn: Button = $VBox/ModesContainer/CasualBox/Btn
@onready var realism_btn: Button = $VBox/ModesContainer/RealismBox/Btn
@onready var custom_btn: Button = $VBox/ModesContainer/CustomBox/Btn

@onready var custom_settings: VBoxContainer = $VBox/CustomSettings
@onready var start_bal_spin: SpinBox = $VBox/CustomSettings/Grid/StartBalSpin
@onready var target_bal_spin: SpinBox = $VBox/CustomSettings/Grid/TargetBalSpin
@onready var survival_check: CheckBox = $VBox/CustomSettings/Grid/SurvivalCheck
@onready var bans_check: CheckBox = $VBox/CustomSettings/Grid/BansCheck
@onready var start_custom_btn: Button = $VBox/CustomSettings/StartCustomBtn

func _ready() -> void:
	custom_settings.hide()

func _on_casual_pressed() -> void:
	mode_selected.emit(GameState.MODE_CASUAL, {})
	hide()

func _on_realism_pressed() -> void:
	mode_selected.emit(GameState.MODE_REALISM, {})
	hide()

func _on_custom_pressed() -> void:
	custom_settings.visible = !custom_settings.visible

func _on_start_custom_pressed() -> void:
	var params: Dictionary = {
		"start_balance": start_bal_spin.value,
		"target_balance": target_bal_spin.value,
		"survival_enabled": survival_check.button_pressed,
		"bans_enabled": bans_check.button_pressed,
		"news_frequency": 0.4,
		"market_volatility": 0.02
	}
	mode_selected.emit(GameState.MODE_CUSTOM, params)
	hide()

extends SceneTree

func _init() -> void:
	print("--- Running Test News Manager ---")

	var nm := NewsManager.new()
	nm.reset()

	# Test 1: Event preparation with 100% frequency
	var ev: Dictionary = nm.prepare_turn_events(1.0, true)
	assert(not ev.is_empty(), "Event should be selected with 100% frequency")
	assert(ev.has("title"), "Event must have title")
	print("✓ Test 1: Event preparation verified.")

	# Test 2: VIP Hints
	assert(nm.get_vip_insider_hint() == "", "No hint when tier is 0")
	nm.vip_channel_tier = 1
	var hint1: String = nm.get_vip_insider_hint()
	assert(hint1.begins_with("[Сигналы 1000x]"), "Cheap channel prefix")

	nm.vip_channel_tier = 2
	var hint2: String = nm.get_vip_insider_hint()
	assert(hint2.begins_with("[Whale Alpha Club]"), "Elite VIP prefix")
	print("✓ Test 2: VIP signals verified.")

	# Test 3: Broadcast history
	nm.broadcast_event(ev, "День 1 | 04:00")
	assert(nm.news_history.size() == 1, "News recorded in history")
	assert(nm.news_history[0].time == "День 1 | 04:00", "Time formatted correctly")
	print("✓ Test 3: Broadcast history verified.")

	print("ALL NEWS MANAGER TESTS PASSED!")
	quit(0)

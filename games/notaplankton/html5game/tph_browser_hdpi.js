///
function browser_get_device_pixel_ratio() {
	return window.devicePixelRatio || 1;
}
///
function browser_stretch_canvas_ext(canvas_id, w, h) {
	var el = document.getElementById(canvas_id);
	el.style.width = w + "px";
	el.style.height = h + "px";
}
///
function browser_scrollbars_enable(z) {
	document.body.style.overflow = z ? "" : "hidden";
}
///
function hide_custom_screen() {
	var el = document.getElementById("_custom_screen1");
	if (el) {
		document.getElementById("_custom_screen1").style.display = "none";
	}
	//document.getElementById("_custom_logo1").style.display = "none";
}
///
function custom_vibration() {
	navigator.vibrate(100);
}
///
function custom_vibration_win() {
	navigator.vibrate([100, 100, 100, 100, 300]);
}
///
function onPageHidden() {
	if (window.gml_Script_gmcallback_pause_game_audio) {
		window.gml_Script_gmcallback_pause_game_audio();
	}
}

function onPageVisible() {
	if (window.gml_Script_gmcallback_resume_game_audio) {
		window.gml_Script_gmcallback_resume_game_audio();
	}
}

document.addEventListener("visibilitychange", function () {
	if (document.hidden) {
		onPageHidden();
	} else {
		onPageVisible();
	}
});

window.addEventListener("pagehide", onPageHidden);
window.addEventListener("pageshow", onPageVisible);

function _custom_screen_add() {
    var _custom_screen = document.createElement("div");
    document.body.appendChild(_custom_screen);
    _custom_screen.id = "_custom_screen1";
    document.getElementById("_custom_screen1").style.left = "0";
    document.getElementById("_custom_screen1").style.top = "0";
    document.getElementById("_custom_screen1").style.width = "100%";
    document.getElementById("_custom_screen1").style.height = "100%";
    document.getElementById("_custom_screen1").style.position = "absolute";
    document.getElementById("_custom_screen1").style.backgroundColor = "#000000";
    document.getElementById("_custom_screen1").style.zIndex = "99999999";
    /*setTimeout(function() {
        _custom_screen.parentNode.removeChild(_custom_screen);
    }, 30000000);*/
}
///

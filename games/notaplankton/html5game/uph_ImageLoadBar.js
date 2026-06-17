var inst = { };
function drawRoundedRect(ctx, x, y, width, height, radius, gradientColors) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    // Создание линейного градиента
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradientColors.forEach((colorStop) => {
        gradient.addColorStop(colorStop.position, colorStop.color);
    });

    ctx.fillStyle = gradient; // Устанавливаем градиент как заливку
    ctx.fill();
}
function ImageLoadBar_hook(ctx, width, height, total, current, image) {
	document.body.style.backgroundColor = "#000000";
	function getv(s) {
		if (window.gml_Script_gmcallback_imgloadbar) {
			return window.gml_Script_gmcallback_imgloadbar(inst, null,
				s, current, total,
				width, height, image ? image.width : 0, image ? image.height : 0)
		} else return undefined;
	}
	function getf(s, d) {
		var r = getv(s);
		return typeof(r) == "number" ? r : d;
	}
	function getw(s, d) {
		var r = getv(s);
		return r && r.constructor == Array ? r : d;
	}
	function getc(s, d) {
		var r = getv(s);
		if (typeof(r) == "number") {
			r = r.toString(16);
			while (r.length < 6) r = "0" + r;
			return "#" + r;
		} else if (typeof(r) == "string") {
			return r;
		} else return d;
	}
	var backgroundColor = getc("background_color", "#FFFFFF");
	var barBackgroundColor = getc("bar_background_color", "#FFFFFF");
	var barForegroundColor = getc("bar_foreground_color", "#242238");
	var barBorderColor = getc("bar_border_color", "#242238");
	var _temp_barWidth;
	if (document.documentElement.clientWidth > document.documentElement.clientHeight) {
		_temp_barWidth = image.width * (document.documentElement.clientHeight / 640) * 0.4;
	} else {
		_temp_barWidth = document.documentElement.clientWidth * 0.4;
	}
	var barWidth = getf("bar_width", _temp_barWidth);
	var barHeight = getf("bar_height", 20);
	var barBorderWidth = getf("bar_border_width", 2);
	var barOffset = getf("bar_offset", 10);
	var back_width = getf("back_width", 0);
	var back_height = getf("back_height", 0);
	
	ctx.fillStyle = backgroundColor;
	ctx.fillRect(0, 0, width, height);
	
	var totalHeight, barTop;
	
	barTop = (height - barHeight) >> 1;
		
	var barLeft = (width - barWidth) >> 1;
	
	// обводка
	drawRoundedRect(ctx, barLeft, barTop, barWidth, barHeight, 10, [
		{ position: 0, color: '#29943D' },
		{ position: 1, color: '#29943D' }
	]);
	
	var barInnerLeft = barLeft + barBorderWidth;
	var barInnerTop = barTop + barBorderWidth;
	var barInnerWidth = barWidth - barBorderWidth * 2;
	var barInnerHeight = barHeight - barBorderWidth * 2;
	
	// пустая
	drawRoundedRect(ctx, barInnerLeft, barInnerTop, barInnerWidth, barInnerHeight, 8, [
		{ position: 0, color: '#F6FF52' },
		{ position: 1, color: '#F6FF52' }
	]);
	
	var barLoadedWidth = Math.round(barInnerWidth * current / total);
	
	// заливка
	drawRoundedRect(ctx, barInnerLeft, barInnerTop, barLoadedWidth, barInnerHeight, 8, [
		{ position: 0, color: '#DAFE1D' },
		{ position: 1, color: '#32BB46' }
	]);
    

}
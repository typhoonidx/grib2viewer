/****************************************************
canvas.js - GRIB2の画を描くライブラリ
Copyright 2018, 台風スレ@5ch
LICENSE: 台風スレ住人であれば誰でも自由に利用ですます。（学術利用）
作成者：風太郎
*****************************************************/

var canvasWidth = 0;
var canvasData = null;
var ctx = null;


function draw() {
  /* canvas要素のノードオブジェクト */
  var canvas = document.getElementById('canvassample');
	console.log("canvas="+canvas);
  /* canvas要素の存在チェックとCanvas未対応ブラウザの対処 */
  if ( ! canvas || ! canvas.getContext ) {
    return false;
  }
  /* 2Dコンテキスト */
  var ctx = canvas.getContext('2d');
  /* 四角を描く */
  ctx.beginPath();
  ctx.moveTo(20, 20);
  ctx.lineTo(120, 20);
  ctx.lineTo(120, 120);
  ctx.lineTo(20, 120);
  ctx.closePath();
  ctx.stroke();
}


// That's how you define the value of a pixel //
function drawPixel (x, y, r, g, b, a) {
    var index = (x + y * canvasWidth) * 4;

    canvasData.data[index + 0] = r;
    canvasData.data[index + 1] = g;
    canvasData.data[index + 2] = b;
    canvasData.data[index + 3] = a;
}

// That's how you update the canvas, so that your //
// modification are taken in consideration //
function updateCanvas() {
    ctx.putImageData(canvasData, 0, 0);
}

function draw2()
{
	var canvas = document.getElementById('canvassample');
	console.log("canvas="+canvas);
	/* canvas要素の存在チェックとCanvas未対応ブラウザの対処 */
	if ( ! canvas || ! canvas.getContext ) {
		return false;
	}
 

	/* 2Dコンテキスト */
	ctx = canvas.getContext('2d');
	canvasWidth = canvas.width;
	var canvasHeight = canvas.height;
	canvasData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);


	// 点を描く
	drawPixel(1, 1, 255, 0, 0, 255);
	drawPixel(1, 2, 255, 0, 0, 255);
	drawPixel(1, 3, 255, 0, 0, 255);
	updateCanvas();
}

function draw_canvas()
{
	draw();
	draw2();


}


/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */
function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}


// カラーパレット
function get_color_scaled_value( scale )
{
	var r = 0;
	var g = 0;
	var b = 0;

/*	
	var perc = scale * (100.0 / 256.0);
	if(perc < 50) {
		r = 255;
		g = Math.round(5.1 * perc);
	}
	else {
		g = 255;
		r = Math.round(510 - 5.10 * perc);
	}
*/
/*
	// グレイスケール
	r = scale;
	g = scale;
	b = scale;
*/
/*
	// red-blue スケール
	if ( scale < 128 ) {
		r = 0;
		g = 0;
		b = scale;
	} else {
		r = scale;
		g = 0;
		b = 0;
	}
*/
	// HSL
	var h = scale / 256;
	var s = 1;
	var l = 0.5;
	[r,g,b] = hslToRgb(h,s,l);

	return [ r, g, b];
}

function drawgrib2(json,canvas_tag,men)
{
	var canvas = document.getElementById('canvassample');
	console.log("canvas="+canvas);
	/* canvas要素の存在チェックとCanvas未対応ブラウザの対処 */
	if ( ! canvas || ! canvas.getContext ) {
		return false;
	}
 

	/* 2Dコンテキスト */
	ctx = canvas.getContext('2d');
	canvasWidth = json.s3.griddef.number_of_parallel;
	var canvasHeight = json.s3.griddef.number_of_meridian;
	canvasData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);


	//var men = 2;
	if ( json.s47list[men] == undefined ) {
		return;
	}

	// 一旦全部クリア
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	var result_list = json.s47list[men].s7.result_list;
	var width = json.s3.griddef.number_of_parallel;
	console.log("width="+width);
	console.log("canvasHeight="+canvasHeight);

	// まず値のmax値を調べる
	var max = -1000;
	var min = 1000;
	for(let index = 0; index < result_list.length; index++) {
		var value = result_list[index];
		if ( max < value ) {
			max = value;
		}
		if ( min > value ) {
			min = value;
		}
	}

	console.log("max="+max);
	console.log("min="+min);
	var haba = max - min;

	var debug_prevalue = result_list[0];
	for(let index = 0; index < result_list.length; index++) {

		var value = result_list[index];

		// debug
		if ( value < 0 ) {
			var i = value;
		}
		// debug
		if ( debug_prevalue - value > 10 ) {
			if ( index % 241 != 0 ) {
				var i = value;
			}
		}
		debug_prevalue = value;


		var x = index % width;
		var y = Math.floor(index / width);
		var scale = (value + (-1 * min)) / haba * 255;
	
		if ( scale > 0x00fe ) {
			var i = scale;
		}
		
		if ( index < 10 ) {
			console.log(index+","+x+","+y+","+scale);
		}
		if ( scale < 0 || scale > 255 ) {
			console.log("ERROR:scale="+scale);
		}

		var [r, g, b] = get_color_scaled_value( scale );
	
		drawPixel(x, y, r, g, b, 255);
	}
	updateCanvas();

}



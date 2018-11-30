/****************************************************
datadecode.js - GRIB2の7節のデータを読み解くライブラリ
Copyright 2018, 台風スレ@5ch
LICENSE: 台風スレ住人であれば誰でも自由に利用ですます。（学術利用）
作成者：風太郎
*****************************************************/

class Rectangle {
  constructor(height, width) {
    this.height = height;
    this.width = width;
  }
  // ゲッター
  get area() {
    return this.calcArea();
  }
  // メソッド
  calcArea() {
    return this.height * this.width;
  }
}

// result_byteをresult_valueに変換する
// Y=(R+Xx2^E)/10^D
// ここで、X=result_byteである。
function byte2value( result_byte, R, E, D)
{
	var Y = 0.0;

	var tmp1 = Math.pow( 2, E);
	var tmp2 = Math.pow( 10, D);

	Y = (R + (result_byte * tmp1)) / tmp2;

	return Y;
}

function data_decode( buf, buf_start_pointer, len, R, E, D)
{
	var p = buf_start_pointer;
	var index = 0;
	var v = 0; // 記憶ボックス
	var vbits = 0; // vの有効なビット数
	var result_list = [];
	var orig_byte_list = [];
	var result_index = 0;
	while( index < len ) {
		var current_byte = buf[buf_start_pointer+index];
		if ( vbits == 0 ) {
			v = current_byte;
			vbits = 8;
		} else if ( vbits == 8 ) {
			// vの8bitとcurrent_byteの4bitをくっつけて12bitにする
			v = v << 4;

			//current_byteから上位4bit取り出し
			bit4 = current_byte & 0x00f0;
			bit4 = bit4 >> 4;
			result_byte_pre = v | bit4;

			// マイナス判定
/*
			tmp = result_byte_pre & 0x07ff;
			if ( tmp == result_byte_pre ) {
				// 値が同じということは上位マイナスフラグが立っていなかったということで、
				// 	この値は正であると判断できる。
				result_byte = result_byte_pre;
			} else {
				// 値が異なるということは、上位マイナスフラグが立っていたということで、
				// この値はマイナスであると判断できる。
				result_byte = tmp * -1;
			}
*/
/*
			if ( result_byte_pre & 0x800 ) {
				result_byte = (result_byte_pre & 0x7ff) * -1;
			} else {
				result_byte = result_byte_pre;
			}
			// debug
			result_byte = result_byte_pre;
*/

			// Rが-18.0ぐらいになっている
			// データ7節は全部正の値になっている
			// 例の計算式でマイナス値が算出される
			result_byte = result_byte_pre;

			result_value = byte2value( result_byte, R, E, D);
			result_list[result_index] = result_value;
			orig_byte_list[result_index] = result_byte;
			result_index ++;

			// current_byteの下位4bitをvに格納して次のループに回す	
			v = current_byte & 0x0f;
			vbits = 4;
			
		} else if ( vbits == 4 ) {
			// vの4bitとcurrent_byteの8bitをくっつけて12bitにする
			v = v << 8;

			//current_byteは8bitのままでよい
			bit8 = current_byte;
			result_byte_pre = v | bit8;

			// マイナス判定
/*
			tmp = result_byte_pre & 0x07ff;
			if ( tmp == result_byte_pre ) {
				// 値が同じということは上位マイナスフラグが立っていなかったということで、
				// 	この値は正であると判断できる。
				result_byte = result_byte_pre;
			} else {
				// 値が異なるということは、上位マイナスフラグが立っていたということで、
				// この値はマイナスであると判断できる。
				result_byte = tmp * -1;
			}
*/
/*
			if ( result_byte_pre & 0x800 ) {
				result_byte = (result_byte_pre & 0x7ff) * -1;
			} else {
				result_byte = result_byte_pre;
			}
			// debug
			result_byte = result_byte_pre;
*/

			// Rが-18.0ぐらいになっている
			// データ7節は全部正の値になっている
			// 例の計算式でマイナス値が算出される
			result_byte = result_byte_pre;



			result_value = byte2value( result_byte, R, E, D);
			result_list[result_index] = result_value;
			orig_byte_list[result_index] = result_byte;
			result_index ++;

			// 次のループに回す	
			v = 0
			vbits = 0;

		} else {
			// error
		}

		index ++;
	}
	console.log("result_index="+result_index);
	return [ orig_byte_list, result_list];
}


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


function data_decode( buf, buf_start_pointer, len)
{
	var p = buf_start_pointer;
	var index = 0;
	var v = 0; // 記憶ボックス
	var vbits = 0; // vの有効なビット数
	var result_list = [];
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
			result_list[result_index] = result_byte;
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
			result_list[result_index] = result_byte;
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
	return result_list;
}


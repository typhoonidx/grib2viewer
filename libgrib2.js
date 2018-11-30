/****************************************************
libgrib2.js - GRIB2のライブラリ
Copyright 2018, 台風スレ@5ch
LICENSE: 台風スレ住人であれば誰でも自由に利用ですます。（学術利用）
作成者：風太郎
*****************************************************/

//参考
//https://www.html5rocks.com/ja/tutorials/file/dndfiles/
// 解析結果はJSONに入れるか？
//MSMのGRIB2フォーマット仕様書
//https://www.data.jma.go.jp/add/suishin/jyouhou/pdf/500.pdf
//https://www.data.jma.go.jp/add/suishin/jyouhou/pdf/205.pdf
//JSONについて
//https://dev.classmethod.jp/etc/concrete-example-of-json/
//GRIB2フォーマット仕様書（英語）
//http://www.wmo.int/pages/prog/www/WMOCodes/Guides/GRIB/GRIB2_062006.pdf
// Template
//https://www.wmo.int/pages/prog/www/WMOCodes/WMO306_vI2/LatestVERSION/WMO306_vI2_GRIB2_Template_en.pdf
// Code Table
//http://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_doc/
//サンプルのGRIB2ファイル
//http://www.jmbsc.or.jp/jp/online/c-onlineGsample.html#sample399

// 最上位ビットが負のビット
function getGribValue( orig_value, bits)
{
	var mask = 0x7f;
	if ( bits == 8 ) {
		mask = 0x7f;
	} else if ( bits == 16 ) {
		mask = 0x7fff;
	} else if ( bits == 32 ) {
		mask = 0x7fffffff;
	}

	var tmp = orig_value & mask;
	var result_value = orig_value;
	if ( tmp == orig_value ) {
		result_value = orig_value;
	} else {
		result_value = -1 * tmp;
	}
	return result_value;
}

function getUint64(bytes, littleEndian)
{
	var low = 4, high = 0;
	if (littleEndian)
	{
		low = 0;
		high = 4;
	}

	var dv = new DataView(Uint8Array.from(bytes ).buffer);

	return (dv.getUint32(high, littleEndian) << 32) |
			dv.getUint32(low, littleEndian);
}


function getUint16( buf, start, littleEndian)
{
	var bytes = [buf[start], buf[start+1]];
	var dv = new DataView(Uint8Array.from(bytes ).buffer);
	var value= dv.getUint16(0, littleEndian);
	return value;
}
function getUint32( buf, start, littleEndian)
{
	var bytes = [buf[start], buf[start+1], buf[start+2], buf[start+3]];
	var dv = new DataView(Uint8Array.from(bytes ).buffer);
	var value= dv.getUint32(0, littleEndian);
	return value;
}
function getFloat32( buf, start, littleEndian)
{
	var bytes = [buf[start], buf[start+1], buf[start+2], buf[start+3]];
	var dv = new DataView(Uint8Array.from(bytes ).buffer);
	var value= dv.getFloat32(0, littleEndian);
	return value;
}
function getUint64( buf, start, littleEndian)
{
	var bytes = [buf[start], buf[start+1], buf[start+2], buf[start+3], buf[		start+4], buf[start+5], buf[start+6], buf[start+7]];
	var low = 4, high = 0;
	if (littleEndian)
	{
		low = 0;
		high = 4;
	}

	var dv = new DataView(Uint8Array.from(bytes ).buffer);

	var value = (dv.getUint32(high, littleEndian) << 32) |
			dv.getUint32(low, littleEndian);

	return value;
}


// Section 4-7のループ
// 終端に達した場合falseを返す
// ループ途中ならtrueを返す。
function loop47( json, buf, index, s4_pointer)
{
	json.s47list[index] = {};

	//-------------------------------------
	// Section 4: Product Definition Section、プロダクト定義節
	//-------------------------------------
	var s4 = s4_pointer;
	console.log("s4="+s4);
	json.s47list[index].s4 = {}; // Section 4 の初期化
	json.s47list[index].s4.len = getUint32( buf, s4+0, false);
	json.s47list[index].s4.number_of_section = buf[s4+4];

	json.s47list[index].s4.number_of_coord_after_tamplate = getUint16( buf, s4+5, false);
	json.s47list[index].s4.template_number = getUint16( buf, s4+7, false); 
		// =0: ある時刻のある水平面における予報、
		// =8: 連続又は不連続な時間間隔の水平面における統計値

/*
	// debug
	if ( json.s47list[index].s4.template_number != 0 &&
		json.s47list[index].s4.template_number != 8) {
		console.log("json.s47list[index].s4.template_number="+json.s47list[index].s4.template_number);
		throw new Error('終了します');
	}
*/

	if ( json.s47list[index].s4.template_number == 0 ) {

		// Template 4.0
		json.s47list[index].s4.temp40 = {};
		json.s47list[index].s4.temp40.parameter_category = buf[s4+9]; // =3: 質量	
		json.s47list[index].s4.temp40.parameter_number = buf[s4+10]; // =5: ジオポテンシャル高度 gpm

		json.s47list[index].s4.temp40.type_of_generating_process = buf[s4+11]; // =2: 予報

		json.s47list[index].s4.temp40.background_generating_process_id = buf[s4+12]; // =31: メソ数値予報
		json.s47list[index].s4.temp40.anal_or_frcst_id = buf[s4+13]; // =255: 

		json.s47list[index].s4.temp40.hour_of_obs = getUint16( buf, s4+14, false); // =0:
		json.s47list[index].s4.temp40.min_of_obs = buf[s4+16]; // =50:
		json.s47list[index].s4.temp40.id_of_unit_of_time = buf[s4+17]; // =1: hour
		json.s47list[index].s4.temp40.fcst_time = getUint32( buf, s4+18, false); // =36: 

		json.s47list[index].s4.temp40.type_of_first_fixed_surface = buf[s4+22]; // =100: 
		json.s47list[index].s4.temp40.scale_factor_of_first_fixed_surface = buf[s4+23]; // =130: 130は二進数で10000010、GRIB2では-2を意味する
		json.s47list[index].s4.temp40.scaled_value_of_first_fixed_surface = getUint32( buf, s4+24, false); // =1000: 
		json.s47list[index].s4.temp40.type_of_second_fixed_surface = buf[s4+28];
		json.s47list[index].s4.temp40.scale_factor_of_second_fixed_surface = buf[s4+29];
		json.s47list[index].s4.temp40.scaled_value_of_second_fixed_surface = getUint32( buf, s4+30, false); // 
	} else if ( json.s47list[index].s4.template_number == 1 ) {
		// Template 4.1
		json.s47list[index].s4.temp40 = {};
		json.s47list[index].s4.temp40.parameter_category = buf[s4+9]; // =3: 質量	
		json.s47list[index].s4.temp40.parameter_number = buf[s4+10]; // =5: ジオポテンシャル高度 gpm

	} else if ( json.s47list[index].s4.template_number == 8 ) {
		// Template 4.8
		json.s47list[index].s4.temp48 = {};
		json.s47list[index].s4.temp48.parameter_category = buf[s4+9]; // =3: 質量	
		json.s47list[index].s4.temp48.parameter_number = buf[s4+10]; // =5: ジオポテンシャル高度 gpm
	
		json.s47list[index].s4.temp40 = {};
		json.s47list[index].s4.temp40.parameter_category = buf[s4+9]; // =3: 質量	
		json.s47list[index].s4.temp40.parameter_number = buf[s4+10]; // =5: ジオポテンシャル高度 gpm



		json.s47list[index].s4.temp48.type_of_generating_process = buf[s4+11]; // =2: 予報

		json.s47list[index].s4.temp48.background_generating_process_id = buf[s4+12]; // =31: メソ数値予報
		json.s47list[index].s4.temp48.anal_or_frcst_id = buf[s4+13]; // =255: 

		json.s47list[index].s4.temp48.hour_of_obs = getUint16( buf, s4+14, false); // =0:
		json.s47list[index].s4.temp48.min_of_obs = buf[s4+16]; // =50:
		json.s47list[index].s4.temp48.id_of_unit_of_time = buf[s4+17]; // =1: hour
		json.s47list[index].s4.temp48.fcst_time = getUint32( buf, s4+18, false); // =36: 

		json.s47list[index].s4.temp48.type_of_first_fixed_surface = buf[s4+22]; // =100: 
		json.s47list[index].s4.temp48.scale_factor_of_first_fixed_surface = buf[s4+23]; // =130: 130は二進数で10000010、GRIB2では-2を意味する
		json.s47list[index].s4.temp48.scaled_value_of_first_fixed_surface = getUint32( buf, s4+24, false); // =1000: 
		json.s47list[index].s4.temp48.type_of_second_fixed_surface = buf[s4+28];
		json.s47list[index].s4.temp48.scale_factor_of_second_fixed_surface = buf[s4+29];
		json.s47list[index].s4.temp48.scaled_value_of_second_fixed_surface = getUint32( buf, s4+30, false); // 

	} else if ( json.s47list[index].s4.template_number == 11 ) {
		// Template 4.11
		json.s47list[index].s4.temp40 = {};
		json.s47list[index].s4.temp40.parameter_category = buf[s4+9]; // =3: 質量	
		json.s47list[index].s4.temp40.parameter_number = buf[s4+10]; // =5: ジオポテンシャル高度 gpm

	} else if (json.s47list[index].s4.template_number == 254 ) {

		// Template 4.254
		json.s47list[index].s4.temp4254 = {};
		json.s47list[index].s4.temp4254.parameter_category = buf[s4+9]; // =3: 質量	
		json.s47list[index].s4.temp4254.parameter_number = buf[s4+10]; // =5: ジオポテンシャル高度 gpm

		json.s47list[index].s4.temp40 = {};
		json.s47list[index].s4.temp40.parameter_category = buf[s4+9]; // =3: 質量	
		json.s47list[index].s4.temp40.parameter_number = buf[s4+10]; // =5: ジオポテンシャル高度 gpm

		json.s47list[index].s4.temp4254.number_of_characters = getUint32( buf, s4+11, false);

	} else {


		console.log("json.s47list[index].s4.template_number="+json.s47list[index].s4.template_number);
		//throw new Error('終了します');
	}


	//-------------------------------------
	// Section 5: Data Representation Section、資料表現節
	//-------------------------------------
	var s5 = s4 + json.s47list[index].s4.len;
	console.log("s5="+s5);
	json.s47list[index].s5 = {}; // Section 5 の初期化
	json.s47list[index].s5.len = getUint32( buf, s5+0, false);
	json.s47list[index].s5.number_of_section = buf[s5+4];

	json.s47list[index].s5.number_of_data_points = getUint32( buf, s5+5, false);
	json.s47list[index].s5.template_number = getUint16( buf, s5+9, false); // =0: 


	// Template 5.0
	json.s47list[index].s5.temp50 = {};
	//json.s47list[index].s5.temp50.ref_value = getUint32( buf, s5+11, false); // R
	json.s47list[index].s5.temp50.ref_value = getFloat32( buf, s5+11, false); // R

	// debug
	if ( json.s47list[index].s5.temp50.ref_value < 0.0 ) {
		var i = 0;
	}

	json.s47list[index].s5.temp50.bin_scale_factor = getGribValue(getUint16( buf, s5+15, false), 16); // E
	json.s47list[index].s5.temp50.dec_scale_factor = getGribValue(getUint16( buf, s5+17, false), 16); // D
	json.s47list[index].s5.temp50.number_of_bits = buf[s5+19]; // =12: 12bit
	json.s47list[index].s5.temp50.type_of_original_field_value = buf[s5+20]; // =0: 浮動小数点、=1: 整数	

	// debug
	if ( json.s47list[index].s5.temp50.number_of_bits != 12 ) {
		var i = 0;
	}
	if ( json.s47list[index].s5.temp50.type_of_original_field_value == 0 ) {
		var i = 9;
	}


	//-------------------------------------
	// Section 6: Bit-Map Section、ビットマップ節
	//-------------------------------------
	var s6 = s5 + json.s47list[index].s5.len;
	console.log("s6="+s6);
	json.s47list[index].s6 = {}; // Section 6 の初期化
	json.s47list[index].s6.len = getUint32( buf, s6+0, false);
	json.s47list[index].s6.number_of_section = buf[s6+4];

	json.s47list[index].s6.bitmap_indicator = buf[s6+5]; // =255: ビットマップを使用せず




	//-------------------------------------
	// Section 7: Data Section、データ節
	//-------------------------------------
	var s7 = s6 + json.s47list[index].s6.len;
	console.log("s7="+s7);
	json.s47list[index].s7 = {}; // Section 7 の初期化
	json.s47list[index].s7.len = getUint32( buf, s7+0, false); // =91465
	json.s47list[index].s7.number_of_section = buf[s7+4];

	var buf_start_pointer = s7+5;
	var len = json.s47list[index].s7.len;

/*
	json.s47list[index].s5.temp50.ref_value = getUint32( buf, s5+11, false); // R
	json.s47list[index].s5.temp50.bin_scale_factor = getUint16( buf, s5+15, false); // E
	json.s47list[index].s5.temp50.dec_scale_factor = getUint16( buf, s5+17, false); // D
*/
	var R = json.s47list[index].s5.temp50.ref_value;
	var E = json.s47list[index].s5.temp50.bin_scale_factor;
	var D = json.s47list[index].s5.temp50.dec_scale_factor;
	[orig_byte_list, result_list] = data_decode( buf, buf_start_pointer, len, R, E, D);

	json.s47list[index].s7.result_list = result_list;
	json.s47list[index].s7.orig_byte_list = orig_byte_list;

	return s7 + json.s47list[index].s7.len; // 次の読み込み開始位置を返す。

}

/*JSONの一例
[
  {
    "InstanceId": "i-XXXXXXXX",
    "ImageId": "ami-YYYYYYYY",
    "LaunchTime": "2015-05-28T08:30:10.000Z",
    "Tags": [
      {
        "Value": "portnoydev-emr",
        "Key": "Name"
      },
      {
        "Value": "j-ZZZZZZZZZZZZ",
        "Key": "aws:elasticmapreduce:job-flow-id"
      },
      {
        "Value": "CORE",
        "Key": "aws:elasticmapreduce:instance-group-role"
      }
    ]
  },
(略)
]
*/


/*grib2jsonの出力結果予定
[
	"grib_magicword": "GRIB",
	"reserved": "5-6",
	"grib_master_table_number": 1,
	"grib_edition_number": 2,
	"total_length": 16840897,
]	
*/
function parse( json, buf)
{

	//-------------------------------------
	// Section 0: Indicator Section
	//-------------------------------------
	var s0 = 0;

	json.s0 = {};
	json.s0.grib_magicword = String.fromCharCode( buf[0],buf[1],buf[2],buf[3]);
	json.s0.discipline = buf[6]; // =0: Meteorological products
	json.s0.grib_edition_number = buf[7]; // ==2

/*
	// 9-16バイト目: GRIBデータの長さ
	result_obj.textContent += buf[8];
	result_obj.textContent += ",";
	result_obj.textContent += buf[9];
	result_obj.textContent += ",";
	result_obj.textContent += buf[10];
	result_obj.textContent += ",";
	result_obj.textContent += buf[11];
	result_obj.textContent += ",";
	result_obj.textContent += buf[12];
	result_obj.textContent += ",";
	result_obj.textContent += buf[13];
	result_obj.textContent += ",";
	result_obj.textContent += buf[14].toString(16);
	result_obj.textContent += ",";
	result_obj.textContent += buf[15].toString(16);
	result_obj.textContent += ",";
*/
	//var bytes = [buf[8], buf[9],buf[10],buf[11],buf[12],buf[13],buf[14],buf[15]];
/*
	var dv = new DataView(Uint8Array.from(bytes ).buffer);
	var value= dv.getUint64(0, false);
	console.log(value);
*/

	json.s0.len = getUint64( buf, s0+8, false);



	//-------------------------------------
	// Section 1: Identification Section
	//-------------------------------------
	var p = 16; // 現在のファイルポインタ
	var s1 = p; // Section 1の開始ファイルポインタ
	console.log("s1="+s1);
	json.s1 = {}; // Section 1 の初期化

	json.s1.len = getUint32( buf, s1+0, false); // Section 1 の長さ
	json.s1.number_of_section = buf[s1+4];
	

	//リスト
	//http://apps.ecmwf.int/codes/grib/format/grib1/centre/0/
	// =34: RJTD, Tokyo (RSMC), Japan Meteorological Agency, 気象庁
	json.s1.id_of_center = getUint16( buf, s1+5, false);
	json.s1.id_of_subcenter = getUint16( buf, s1+7, false);

	json.s1.master_table_version = buf[s1+9]; // =2: 2003
	json.s1.local_table_version = buf[s1+10]; // =1: 
	json.s1.sig_of_reftime = buf[s1+11]; // =0: Analysis、観測値, =1:予想開始

	json.s1.year = getUint16( buf, s1+12, false);
	json.s1.month = buf[s1+14];
	json.s1.day = buf[s1+15];
	json.s1.hour = buf[s1+16];
	json.s1.minute = buf[s1+17];
	json.s1.second = buf[s1+18];

	json.s1.production_status = buf[s1+19]; // =0: Operational products
	json.s1.type = buf[s1+20]; // =1: Forecast products, =5: Control and Perturbed Forecast Products



	
	//-------------------------------------
	// Section 2: Local Use Section
	//-------------------------------------
	var s2 = s1 + json.s1.len;
	console.log("s2="+s2);
	json.s2 = {}; // Section 2 の初期化
	// 〇Section2は、まるごとない場合がある。
	if ( buf[s2+4] == 2 ) { // Section番号を見て2節か3節か判断する
		json.s2.len = getUint32( buf, s2+0, false);
		json.s2.number_of_section = buf[s2+4];
	} else {
		json.s2.len = 0;
	}



	//-------------------------------------
	// Section 3: Grid Definition Section、格子系定義節
	//-------------------------------------
	var s3 = s2 + json.s2.len;
	console.log("s3="+s3);
	json.s3 = {}; // Section 3 の初期化
	json.s3.len = getUint32( buf, s3+0, false);
	json.s3.number_of_section = buf[s3+4];

	json.s3.src_of_griddef = buf[s3+5];
	json.s3.num_of_data_points = getUint32( buf, s3+6, false); // =60973: 253×241, =2920: 73x40
	json.s3.octet11 = buf[s3+10];
	json.s3.octet12 = buf[s3+11];
	json.s3.template_number = getUint16( buf, s3+12, false);

	// Grid Definition Template
	json.s3.griddef = {};
	json.s3.griddef.shape_of_earth = buf[s3+14]; // =6: 半径6,371kmの球体と仮定した地球	

	// この間はデータ無し
	
	json.s3.griddef.number_of_parallel = getUint32( buf, s3+30, false); // 緯線に沿った格子点数
	json.s3.griddef.number_of_meridian = getUint32( buf, s3+34, false); // 経線に沿った格子点数

	console.log("json.s3.griddef.number_of_parallel="+json.s3.griddef.number_of_parallel);
	console.log("json.s3.griddef.number_of_meridian="+json.s3.griddef.number_of_meridian);


	json.s3.griddef.basic_angle = getUint32( buf, s3+38, false);
	json.s3.griddef.sub_of_basic_angle = getUint32( buf, s3+42, false);

	json.s3.griddef.lat_of_first_point = getUint32( buf, s3+46, false); // 緯度方向格子の最初の点 =47600000: 北緯47.6度
	json.s3.griddef.long_of_first_point = getUint32( buf, s3+50, false); // 緯度方向格子の最初の点 =120000000: 東経120度

	json.s3.griddef.resolution_flag = buf[s3+54]; // 0x30

	json.s3.griddef.lat_of_last_point = getUint32( buf, s3+55, false); // 緯度方向格子の最後の点 =22400000: 北緯22.4度
	json.s3.griddef.long_of_last_point = getUint32( buf, s3+59, false); // 緯度方向格子の最後の点 =150000000: 東経150度

	json.s3.griddef.i_direct_inc = getUint32( buf, s3+63, false); // i方向の増分 =125000: 0.125度, x軸方向、経度方向
	json.s3.griddef.j_direct_inc = getUint32( buf, s3+67, false); // j方向の増分 =100000: 0.1度、 y軸方向、緯度方向

	json.s3.griddef.scan_mode = buf[s3+71];


	// Section4から7はデータ分繰り返す。
	var s4 = s3 + json.s3.len;
	var index = 0; // ループindex
	var next_pointer = s4;

	json.s47list = [];
	// json.s47list[0]: 1ループ目
	// json.s47list[1]: 2ループ目
	while( next_pointer = loop47( json, buf, index, next_pointer) ) {
		console.log("next_pointer="+next_pointer);

		if ( json.s0.len < next_pointer ) {
			// ERROR
			// なにかがおかしい
			break;
		}

		index ++;

		// 終端チェック
		var str = String.fromCharCode( buf[next_pointer+0],buf[next_pointer+1],buf[next_pointer+2],buf[next_pointer+3]);
		if ( str == "7777" ) {
			break;
		}

		/*
		// debug用	
		if ( index == 2 ) {
			break;
		}
		*/
	}
	console.log("index="+index);


	// Template 7.0
	// 単純圧縮された格子点値の列



	// Section 4から7が繰り返される


	//-------------------------------------
	// Section 8: End Section
	//-------------------------------------
	var s8 = next_pointer;
	console.log("s8="+s8);
	json.s8 = {}; // Section 8 の初期化
	json.s8.end = String.fromCharCode( buf[s8+0],buf[s8+1],buf[s8+2],buf[s8+3]);



}


function get_param_string( cat, param)
{
	var str = "";
	if ( cat == 0 ) {
		str += "温度, ";
		if ( param == 0 ) {
			str += "温度K";
		}
	}
	if ( cat == 1 ) {
		str += "湿度, ";
		if ( param == 1 ) {
			str += "相対湿度%";
		}
		if ( param == 8 ) {
			str += "総降水量kgm-2";
		}
	}
	if ( cat == 2 ) {
		str += "運動量, ";
		if ( param == 2 ) {
			str += "風のu成分m/s";
		}
		if ( param == 3 ) {
			str += "風のv成分m/s";
		}
		if ( param == 8 ) {
			str += "上昇流鉛直速度（気圧）Pa/s";
		}
	}
	if ( cat == 3 ) {
		str += "質量, ";
		if ( param == 0 ) {
			str += "気圧Pa";
		}
		if ( param == 1 ) {
			str += "海面更正気圧Pa";
		}
		if ( param == 5 ) {
			str += "ポテンシャル高度gpm";
		}
	}
	if ( cat == 4 ) {
		str += "短波放射, ";
		if ( param == 7 ) {
			str += "下向き短波放射フラックスWm-w";
		}
	}
	if ( cat == 6 ) {
		str += "雲, ";
		if ( param == 1 ) {
			str += "全雲量%";
		}
		if ( param == 3 ) {
			str += "下層雲量%";
		}
		if ( param == 4 ) {
			str += "中層雲量%";
		}
		if ( param == 5 ) {
			str += "上層雲量%";
		}
	}
	return str;
}

function get_koteimen_string(
	type_of_first_fixed_surface,
	scale_factor_of_first_fixed_surface,
	scaled_value_of_first_fixed_surface)
{
	var str_koteimen = "";
	if ( type_of_first_fixed_surface == 1 ) {
		str_koteimen = "地面";
	} else if ( type_of_first_fixed_surface == 101 ) {
		str_koteimen = "平均海面";
	} else if ( type_of_first_fixed_surface == 103 ) {
		if ( scale_factor_of_first_fixed_surface == 0 ) {
			str_koteimen = "地上10m(風)";
		} else if ( scale_factor_of_first_fixed_surface == 1 ) {
			str_koteimen = "地上1.5m(気温,RH)";
		} else {
			str_koteimen = type_of_first_fixed_surface + "," + 
				scale_factor_of_first_fixed_surface + "," + 
				scaled_value_of_first_fixed_surface;
		}
	} else if ( type_of_first_fixed_surface == 100 ) {
		str_koteimen = scaled_value_of_first_fixed_surface + "hPa";
	} else {
			str_koteimen = type_of_first_fixed_surface + "," + 
				scale_factor_of_first_fixed_surface + "," + 
				scaled_value_of_first_fixed_surface;
	}
	return str_koteimen;
}


// test
function grib2_sub(file, result_obj, canvas_tag, men)
{
	var opt_startByte = 0;
	var opt_stopByte = 4;

	var start = parseInt(opt_startByte) || 0;
    var stop = file.size - 1;

    var reader = new FileReader();

    // If we use onloadend, we need to check the readyState.
    reader.onloadend = function(evt) {
		if (evt.target.readyState == FileReader.DONE) { // DONE == 2
			var data = evt.target.result;
			var buf = new Uint8Array(data);

/*
			len = buf.length;
			//alert("len="+len);
			result_obj.textContent = len;
			result_obj.textContent += ",";
			

			// 一バイト目:'G'
			var byte1 = buf[0];
			result_obj.textContent += byte1;
			result_obj.textContent += ",";

			// 2バイト目:'R'
			var byte2 = buf[1];
			result_obj.textContent += byte2;
			result_obj.textContent += ",";
*/
			var json = {};

			parse( json, buf);
	

			//-------------------------------------
			// JSONのデバッグダンプ
			//-------------------------------------
			console.log(json);

			// 7節のデータを取得したらめちゃくちゃ重くなったのでコメント化
			//result_obj.textContent = JSON.stringify(json, null, "\t");
			//result_obj.textContent += "result";

			result_obj.textContent += "json.s47list.length="+json.s47list.length;
			result_obj.textContent += "\n";

		
			// 全部出すと重いので、184個の各一つ目だけをダンプしていく
			for(let index = 0; index < json.s47list.length; index++) {
				if ( json.s47list[index].s4.temp40 == undefined ) {
					continue;
				}

				result_obj.textContent += index + ", ";

				result_obj.textContent += json.s47list[index].s4.temp40.parameter_category + ", ";
				result_obj.textContent += json.s47list[index].s4.temp40.parameter_number + ", ";

				var str = get_param_string(
					json.s47list[index].s4.temp40.parameter_category,
					json.s47list[index].s4.temp40.parameter_number);
				result_obj.textContent += str + ", ";


				var str_koteimen = get_koteimen_string(
					json.s47list[index].s4.temp40.type_of_first_fixed_surface,
					json.s47list[index].s4.temp40.scale_factor_of_first_fixed_surface,
					json.s47list[index].s4.temp40.scaled_value_of_first_fixed_surface);
				result_obj.textContent += str_koteimen;



				result_obj.textContent += "\n";

				
			}
/*
	json.s47list[index].s4.temp40.parameter_category = buf[s4+9]; // =3: 質量	
	json.s47list[index].s4.temp40.parameter_number = buf[s4+10]; // =5: ジオポテンシャル高度 gpm
*/
			drawgrib2(json,canvas_tag,men);


			$('#canvassample').mousemove(function(e) {
				var pos = findPos(this);
				var x = e.pageX - pos.x;
				var y = e.pageY - pos.y;
				var coord = "x=" + x + ", y=" + y;
				var c = this.getContext('2d');
				var p = c.getImageData(x, y, 1, 1).data; 
				var hex = "#" + ("000000" + rgbToHex(p[0], p[1], p[2])).slice(-6);
				var result_list = json.s47list[men].s7.result_list;
				var orig_byte_list = json.s47list[men].s7.orig_byte_list;
				var value = result_list[x+y*241];
				var orig = orig_byte_list[x+y*241];
				$('#status').html(coord + "<br>" + hex + "<br>" + value + "<br>" + orig);
			});


		}
    };

    var blob = file.slice(start, stop + 1);

    reader.readAsArrayBuffer(blob);



	return false;
}








/* EOF */

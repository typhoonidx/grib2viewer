/****************************************************
libgrib2.js - GRIB2のライブラリ
Copyright 2018, 台風スレ@5ch
LICENSE: 台風スレ住人であれば誰でも自由に利用ですます。（学術利用）
*****************************************************/

//参考
//https://www.html5rocks.com/ja/tutorials/file/dndfiles/
// 解析結果はJSONに入れるか？
//MSMのGRIB2フォーマット仕様書
//http://www.data.jma.go.jp/add/suishin/jyouhou/pdf/500.pdf
//JSONについて
//https://dev.classmethod.jp/etc/concrete-example-of-json/
//GRIB2フォーマット仕様書（英語）
//http://www.wmo.int/pages/prog/www/WMOCodes/Guides/GRIB/GRIB2_062006.pdf
//サンプルのGRIB2ファイル
//http://www.jmbsc.or.jp/jp/online/c-onlineGsample.html#sample399

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
	json.grib_magicword = String.fromCharCode( buf[0],buf[1],buf[2],buf[3]);
	json.discipline = buf[6]; // =0: Meteorological products
	json.grib_edition_number = buf[7]; // ==2

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
	var value = getUint64( buf, 8, false);
	console.log(value);
	json.len = value;



	//-------------------------------------
	// Section 1: Identification Section
	//-------------------------------------
	var p = 16; // 現在のファイルポインタ
	var s1 = p; // Section 1の開始ファイルポインタ
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



}




// test
function grib2_sub(file, result_obj)
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
		result_obj.textContent += JSON.stringify(json, null, "\t");
		result_obj.textContent += ",";

      }
    };

    var blob = file.slice(start, stop + 1);

    reader.readAsArrayBuffer(blob);



	return false;
}








/* EOF */

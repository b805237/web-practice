/* 
查詢語言編碼
String slot			物件插槽
String type			查詢語法類型，BQL或是SQL
String timePeriod	時間週期 = [last7Days,last24Hours,yesterday,today,weekToDate,lastWeek,monthToDate,lastMonth,yearToDate,lastYear]
*/
function TimePeriodQL(slot,type,timePeriod)
{
	var DBlanguage = "";
	
	if ( type == "BQL" )
	{
		var DBPeriod = "period=" + timePeriod;
		DBlanguage = slot + "?" + DBPeriod + "|bql:select timestamp,value";
	}
	return DBlanguage;
}

/* 
查詢語言編碼
String slot			物件插槽
String type			查詢語法類型，BQL或是SQL
String timeStart	資料起日
String timeEnd		資料迄日
*/
function TimeSectionQL(slot,type,timeStart,timeEnd)
{
	var DBlanguage = "";
	
	if ( type == "BQL" )
	{	// timeRange format is <YYYY-MM-DD><THH:MM:SS.miliseconds><timezone offset>
		// Time Section 1
		var TimeSection1 = new Date(timeStart);
		var Time1 = TimeSection1.toISOString();
		// Time Section 2
		var TimeSection2 = new Date(timeEnd);
		var Time2 = TimeSection2.toISOString();
		// DBPeriod
		var DBPeriod = "period=timeRange;start=" + Time1 + ";end=" + Time2
		DBlanguage = slot + "?" + DBPeriod + "|bql:select timestamp,value";
	}
	return DBlanguage;
}

/* 
JSON資料轉換成SQL語法
Object data			資料，JSON格式
String DBname		資料庫名稱
String action		動作，新增、修改、刪除
String primary		主鍵欄位名稱，PRIMARY KEY
*/
function JSONtoSQL(data,DBname,action,primary)
{
	var DBSQL = "";
	//alert(JSON.stringify(DBname));
	
	switch ( action )
	{	
		case "add":
			var addKeySQL = "";
			var addVauleSQL = "";
			for(var key in data)
			{
				if (!((key == primary)||(key == "grid_id")))
				{
					addKeySQL += " [" + key + "],";
					
					if ( data[key] == "" )
						addVauleSQL += "null,";
					else
						addVauleSQL += " '" + data[key] +"',";
				}
			}
			addKeySQL = addKeySQL.substring( 0,addKeySQL.length-1 );
			addVauleSQL = addVauleSQL.substring( 0,addVauleSQL.length-1 );
			DBSQL = "INSERT " + DBname + " ( " + addKeySQL + " ) VALUES ( " + addVauleSQL + " ) ";
			break;
		case "update":
			var updateSQL = "";
			var primaryValue = "";
			for(var key in data)
			{
				if (key == primary)
				{
					primaryValue = data[key];
				}
				else
				{
					if (key != "grid_id")
					{
						if ( data[key] == "" )
							updateSQL += " [" + key + "]= null,";
						else
							updateSQL += " [" + key + "]='" + data[key] +"',";
					}
				}
			}
			updateSQL = updateSQL.substring( 0,updateSQL.length-1 );
			//
			DBSQL = "UPDATE " + DBname + " SET " + updateSQL + " WHERE [" + primary + "] = '" + primaryValue + "'";
			break;
		case "delete":
			var deleteSQL = "";
			for (a=0;a<data.length;a++)
				deleteSQL += " [" + primary + "]='" + data[a] +"' or";
			deleteSQL = deleteSQL.substring( 0,deleteSQL.length-3 );
			//
			DBSQL = "DELETE FROM " + DBname + " WHERE " + deleteSQL;
			break;
	}
	return DBSQL;
}

/* 
SQL語法編碼
String SQL		SQL語法
*/
function EncodeSQL(SQL)
{
	var tempArray = new Array();
	tempArray.push(SQL);
	var temp = Base64.encode(JSON.stringify(tempArray));
	return temp;
}
/* 
檢核資料異動(修改)
Object data			Niagara回傳資料
Object system		action：異動動作，postData：異動資料，dataType：資料類型
*/
function DataChange(data,system)
{	// 動作對照
	var actionName = new Array();
    actionName["add"] = "新增";
	actionName["update"] = "修改";
    actionName["delete"] = "刪除";
	// 檢核
	var check = 1;
	// 逐筆比對
	for(var key in system.postData)
	{	// 資料類型，處理時間格式
		
		if ( system.dataType[key] == "datetime" )
		{	// 時間空白
			if ( system.postData[key] == "" )
			{
				if ( data[0][0][key] != 0 )
					check = 0;
			}
			else
			{
				var tempDate = new Date(system.postData[key]);
				if ( data[0][0][key] != Date.parse(tempDate) )
					check = 0;
			}
		}
		else
		{
			if ( data[0][0][key] != system.postData[key] )
				check = 0;
		}
	}
	//
	if ( check = 1 )
		alert("資料"+actionName[system.action]+"成功");
	else
		alert("資料"+actionName[system.action]+"失敗");
}

/*
encode and decode
*/
var Base64 = {
 
	// private property
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
 
	// public method for encoding
	encode : function (input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;
 
		input = Base64._utf8_encode(input);
 
		while (i < input.length) {
 
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);
 
			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;
 
			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}
 
			output = output +
			this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
			this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
 
		}
 
		return output;
	},
 
	// public method for decoding
	decode : function (input) {
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;
 
		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 
		while (i < input.length) {
 
			enc1 = this._keyStr.indexOf(input.charAt(i++));
			enc2 = this._keyStr.indexOf(input.charAt(i++));
			enc3 = this._keyStr.indexOf(input.charAt(i++));
			enc4 = this._keyStr.indexOf(input.charAt(i++));
 
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;
 
			output = output + String.fromCharCode(chr1);
 
			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			}
 
		}
 
		output = Base64._utf8_decode(output);
 
		return output;
 
	},
 
	// private method for UTF-8 encoding
	_utf8_encode : function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";
 
		for (var n = 0; n < string.length; n++) {
 
			var c = string.charCodeAt(n);
 
			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
 
		}
 
		return utftext;
	},
 
	// private method for UTF-8 decoding
	_utf8_decode : function (utftext) {
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0;
 
		while ( i < utftext.length ) {
 
			c = utftext.charCodeAt(i);
 
			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			}
			else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}
 
		}
 
		return string;
	}
 
}
/* 
單一Servlet回傳Data解析
Object ret				Servlet回傳Data，為JSON格式
Function callback		回傳函數，參數有三個

callback parameter
String status			回傳狀態，成功為1
String msg				回傳訊息
String data				整理過後回傳資料，格式為[Object1,Object2,...]
*/
function getSingleData(ret,callback)
{
	if ( ret != null )
	{
		if ( ret._status == 1 )
		{	// 檢核回傳資料是否為空
			if ( ret.data.length == 0 )
				callback("0","回傳資料為空",null);
			else
				callback(ret._status,ret._msg,ret.data);
		}
		else
			callback(ret._status,ret._msg,null);
	}
	else
		callback("0","回傳資料為空",null);
}

/* 
多個Servlet回傳Data解析
Object ret				Servlet回傳Data，為JSON格式
Function callback		回傳函數，參數有三個

callback parameter
String status			回傳狀態，成功為1
String msg				回傳訊息
String data				整理過後回傳資料，格式為[[Object11,Object12,...],[Object21,Object22,...],...]
*/
function getMultiData(ret,callback)
{
	var data = new Array();
	// 資料為空數目
	var dataNull = 0;
	//
	if ( ret != null )
	{
		for (var i=0; i<ret.cmds.length; i++)
		{
			if ( ret.cmds[i]._status == 1 )
			{	// 檢核回傳資料是否為空
				if ( ret.cmds[i].data.length == 0 )
					dataNull++;
				
				data.push(ret.cmds[i].data);
			}
			else
			{
				callback(ret.cmds[i]._status,ret.cmds[i]._msg,null);
				break;
			}
			// 最後一筆
			if ( i == ret.cmds.length-1 )
			{
				if ( dataNull == ret.cmds.length )
					callback("0","回傳資料為空",null);
				else
					callback(ret._status,ret._msg,data);
			}
		}
	}
	else
		callback("0","回傳資料為空",null);
}
/* 
SQL Array組成字串
因N3.8不支援JSONArray，故使用連續++分隔字串
Array sqlArray			SQL語法Array
return sqlString		SQL語法字串，["SQL1"++"SQL2"]
*/
function ArrayToString(sqlArray)
{	
    var selValue = $.map(sqlArray, function(node){
		return "\"" + node + "\"";
	});
	var temp = selValue.join("++");
	return "[" + temp + "]";
}
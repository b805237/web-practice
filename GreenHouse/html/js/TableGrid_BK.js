/*
轉換Niagara資料格式成jqGrid資料格式，並根據system set產生Grid
Object data			Niagara資料
Object systemSet	函數相關設定。id：表格ID、set：表格設定、width：表格寬度
*/
function TableGrid(data,systemSet)
{	// 資料處理轉換：時間轉換、格式轉換
	var newData = new Array();
	var dataLength = data[0].length;
	
	for(a=0;a<dataLength;a++)
	{
		var dataTemp = new Object();
		
		var temp = new Date(data[0][a].timestamp);
		dataTemp.no = a+1;
		dataTemp.timestamp = temp.customFormat( "#YYYY#-#MM#-#DD# #hhhh#:#mm#:#ss#" );
		for(b=0;b<data.length;b++)
		{
			var temp = 'value' + b;
			dataTemp[temp] = data[b][a].value.toFixed(2);
		}
		
		newData.push(dataTemp);
	}
	baja.outln(JSON.stringify(newData));
	// 表格設定
	var options = systemSet.set;
	var myGrid = $("#" + systemSet.id);
	myGrid.jqGrid(options);
	// 資料清除、設定、重讀
	myGrid.jqGrid('clearGridData');
	myGrid.jqGrid('setGridParam', {data: newData});
	myGrid.trigger('reloadGrid');
	// EXCEL功能
	if ( systemSet.excel == true )
		document.getElementById("excel").value = JSON.stringify(newData);
	// PDF功能
	if ( systemSet.pdf == true )
		document.getElementById("pdf").value = JSON.stringify(newData);
	// 表格細部設定
	// 底部導航條是否隱藏
	//$(".ui-jqgrid-pager", g.parents(".ui-jqgrid")).css("display", "none");
	// 使水平捲動軸不出現(for Chrome/IE 計算欄位寬總和誤差, Firefox 卻無問題)
	myGrid.parents(".ui-jqgrid-bdiv").css("overflow-x", "hidden");
	// 表格自寬度
	myGrid.jqGrid('setGridWidth', parseFloat(systemSet.width));
}

/*
alarm table
轉換Niagara資料格式成jqGrid資料格式，並根據system set產生Grid
Object data			Niagara資料
Object systemSet	函數相關設定。id：表格ID、set：表格設定、width：表格寬度
*/
function AlarmTableGrid(data,systemSet)
{	// 資料處理轉換：時間轉換、格式轉換
	var newData = new Array();
	var dataLength = data[0].length;
	for(a=0;a<dataLength;a++)
	{
		var dataTemp = new Object();
		// row處理
		dataTemp.no = a+1;
		
		var temp = new Date(data[0][a].startdate);
		dataTemp.startdate = temp.customFormat( "#YYYY#-#MM#-#DD# #hhhh#:#mm#:#ss#" );
		
		temp = data[0][a].enddate;
		if ( data[0][a].enddate != 0 )
		{
			temp = new Date(data[0][a].enddate);
			dataTemp.enddate = temp.customFormat( "#YYYY#-#MM#-#DD# #hhhh#:#mm#:#ss#" );
		}
		else
			dataTemp.enddate = "";
		//
		dataTemp.building = systemSet.building[data[0][a].building];
		dataTemp.floor = data[0][a].floor;
		dataTemp.system = systemSet.system[data[0][a].system];
		dataTemp.alarm_context = data[0][a].alarm_context;
		dataTemp.alarm_status = systemSet.alarm_status[data[0][a].alarm_status];
		dataTemp.confirm_status = systemSet.confirm_status[data[0][a].confirm_status];
		//
		newData.push(dataTemp);
	}
	baja.outln(JSON.stringify(newData));
	// 表格設定
	var options = systemSet.set;
	var myGrid = $("#" + systemSet.id);
	myGrid.jqGrid(options);
	// 資料清除、設定、重讀
	myGrid.jqGrid('clearGridData');
	myGrid.jqGrid('setGridParam', {data: newData});
	myGrid.trigger('reloadGrid');
	// EXCEL功能
	if ( systemSet.excel == true )
		document.getElementById("excel").value = JSON.stringify(newData);
	// PDF功能
	if ( systemSet.pdf == true )
		document.getElementById("pdf").value = JSON.stringify(newData);
	// 表格細部設定
	// 底部導航條是否隱藏
	//$(".ui-jqgrid-pager", g.parents(".ui-jqgrid")).css("display", "none");
	// 使水平捲動軸不出現(for Chrome/IE 計算欄位寬總和誤差, Firefox 卻無問題)
	myGrid.parents(".ui-jqgrid-bdiv").css("overflow-x", "hidden");
	// 表格自寬度
	myGrid.jqGrid('setGridWidth', parseFloat(systemSet.width));
}

/* 
表格設定參數
Array colTitleName		標題列名稱(中文)(除序列外)
Array titleRowCode		標題列代號(英文)(除序列外)
Array titleRowWidth		標題列寬度
Int tableHeight			表格高度
String navID			導航列ID
*/
function TableGridSet(titleRowName,titleRowCode,titleRowWidth,tableHeight,navID)
{
	var options = new Object();
	options.data = new Array();
	options.datatype = 'local';
	options.height = tableHeight;
	// 資料標題設定
	var temp = new Array();
	temp.push("");	//	序列空白
	for(a=0;a<titleRowName.length;a++)
		temp.push(titleRowName[a]);
	options.colNames = temp;
	
	temp = new Array();
	var object = new Object();
	object.name = 'no';	//	序列設定
	object.width = 15;
	object.align = 'center';
	temp.push(object);
	for(a=0;a<titleRowName.length;a++)
	{
		object = new Object();
		object.name = titleRowCode[a];
		object.width = titleRowWidth[a];
		object.align = 'center';
		temp.push(object);
	}
	options.colModel = temp;
    //
	options.autowidth = true;			//	自動調寬度
	options.gridview = true; 			//	加速顯示
	options.altRows = true;				//	條紋網格
	options.altclass= "ui-jqgrow-alt";	//	網格樣式
	//
	options.loadonce = true;			//	datatype=local 時, 加這個 true 才可本端排序/換頁
	options.shrinkToFit = true;			//	按各欄位寬設定值比例予以調整至符合總寬值
	//options.caption= "Plans"; 		//	表格收起
	//
	if (navID != null)
	{
		options.pager = '#' + navID;		//	導航列設置
		options.rowNum = 5;					//	網格記錄數
		options.rowList = [5,10,20,30];		//	網格選擇數
		options.viewrecords = true;			//	導航列觀看記錄
		// options.toppager = true;			//	導航列置頂
	}
	
	return options;
}

/*
edit room table
轉換Niagara資料格式成jqGrid資料格式，並根據system set產生Grid
Object data			Niagara資料
Object systemSet	函數相關設定。id：表格ID、set：表格設定、width：表格寬度
*/
function EditGrid(data,systemSet)
{	// 資料處理轉換：時間轉換、格式轉換
	var newData = new Array();
	var dataLength = data[0].length;
	//
	var primaryName = "";
	for(a=0;a<dataLength;a++)
	{
		var dataTemp = new Object();
		// row處理
		dataTemp.no = a+1;
		var data_type = systemSet.data_type;
		var data_code = systemSet.data_code;
		for(var key1 in data_type)
		{	// data值
			var data_value = data[0][a][key1];
			switch ( data_type[key1] )
			{	
				case "datetime":
					if ( data_value != 0 )
					{
						var temp = new Date(data_value);
						dataTemp[key1] = temp.customFormat( "#YYYY#/#MM#/#DD# #hhhh#:#mm#:#ss#" );
					}
					else
						dataTemp[key1] = "";
					break;
				case "select":
					dataTemp[key1] = data_value;
					break;
				case "key":
					primaryName = key1;
					dataTemp[key1] = data_value;
				case "text":
					dataTemp[key1] = data_value;
					break;
				default:
				　	dataTemp[key1] = data_value;
			}
		}
		//
		newData.push(dataTemp);
	}
	// 表格設定
	var options = systemSet.set;
	var myGrid = $("#" + systemSet.id);
	myGrid.jqGrid(options);
	// 資料清除、設定、重讀
	myGrid.jqGrid('clearGridData');
	myGrid.jqGrid('setGridParam', {data: newData});
	myGrid.trigger('reloadGrid');
	// EXCEL功能
	if ( systemSet.excel == true )
		document.getElementById("excel").value = JSON.stringify(newData);
	// PDF功能
	if ( systemSet.pdf == true )
		document.getElementById("pdf").value = JSON.stringify(newData);
	// 表格細部設定
	// 底部導航條是否隱藏
	//$(".ui-jqgrid-pager", g.parents(".ui-jqgrid")).css("display", "none");
	// 使水平捲動軸不出現(for Chrome/IE 計算欄位寬總和誤差, Firefox 卻無問題)
	myGrid.parents(".ui-jqgrid-bdiv").css("overflow-x", "hidden");
	// 表格自寬度
	myGrid.jqGrid('setGridWidth', parseFloat(systemSet.width));
	// add
	/*
	$("#add").click(function()
	{	// 編輯表格設定
		var addSet = new Object();
		addSet.height = 360;
		addSet.top = 100;
		addSet.left = 100;
		addSet.reloadAfterSubmit = true;
		//addSet.closeAfterAdd = true;	// 修改後關閉視窗
		// 加入 add 資料之後動作
		addSet.onclickSubmit = function(params, postData)
		{	// 修改完資料 baja.outln(JSON.stringify(postData))
			// sql語法
			var sql = JSONtoSQL(postData,systemSet.db_name,"add",primaryName);
			// 透過RDBMS，新增資料
			var DBbql = [ systemSet.slot + "|sql:" + sql ];
			NiagaraDataJson(DBbql,"DataChange",postData);
			return postData;
		};
		// 目前會重複新增資料
		myGrid.jqGrid('editGridRow',"new",addSet);
	});
	*/
	// update
	/*
	$("#update").click(function()
	{
		var gr = myGrid.jqGrid('getGridParam','selarrrow');
		if( gr.length == 1 )
		{	// 編輯表格設定
			var updateSet = new Object();
			updateSet.height = 360;
			updateSet.top = 100;
			updateSet.left = 100;
			updateSet.reloadAfterSubmit = true;
			updateSet.closeAfterEdit = true;	// 修改後關閉視窗
			updateSet.viewPagerButtons = false;	// 下頁按鈕
			// 加入 update 資料之後動作
			updateSet.onclickSubmit = function(params, postData)
			{	// 修改完資料 baja.outln(JSON.stringify(postData))
				// sql語法
				var sql = JSONtoSQL(postData,systemSet.db_name,"update",primaryName);
				// 透過RDBMS，更新資料
				var DBbql = [ systemSet.slot + "|sql:" + sql ];
				NiagaraDataJson(DBbql,"DataChange",postData);
				
				return postData;
			};
			//
			myGrid.jqGrid('editGridRow',gr);
		}
		
		else
			alert("請選取一筆資料");
	});
	*/
	// delete
	/*
	$("#myDelete").click(function()
	{
		var gr = myGrid.jqGrid('getGridParam','selarrrow');
		
		if( gr.length != 0 )
		{	// 編輯表格設定
			var deleteSet = new Object();
			deleteSet.reloadAfterSubmit = false;
			deleteSet.closeAfterEdit = true;	// 修改後關閉視窗
			// 加入 delete 資料之後動作
			deleteSet.onclickSubmit = function(params, postData)
			{	// 得到要刪除的primaryName的值
				var primaryData = new Array();
				var grData = postData.split(",");
				for (a=0;a<grData.length;a++)
				{
					var value = myGrid.jqGrid('getCell', grData[a], primaryName);
					primaryData.push(value);
				}
				// sql語法
				
				var sql = JSONtoSQL(primaryData,systemSet.db_name,"delete",primaryName);
				// 透過RDBMS，更新資料
				var DBbql = [ systemSet.slot + "|sql:" + sql ];
				NiagaraDataJson(DBbql,"DataChange",postData);
				
				return postData;
			};
			myGrid.jqGrid('delGridRow',gr,deleteSet);
		}
		else 
			alert("請選取資料");
	});
	*/
}

/* 
編輯表格設定參數
Object titleName		標題行名稱(除序列外)
Object titleWidth		標題行寬度
Object rowType			資料行類型
Object rowOptions		資料行選項

Int tableHeight			表格高度
String navID			導航列ID
*/
function EditGridSet(titleName,titleWidth,rowType,rowOptions,tableHeight,navID)
{	
	var options = new Object();
	options.data = new Array();
	options.datatype = 'local';
	options.height = tableHeight;
	// 資料標題設定
	var temp = new Array();
	temp.push("");	//	序列空白
	for(var key in titleName)
		temp.push(titleName[key]);
	options.colNames = temp;
	
	temp = new Array();
	var object = new Object();
	object.name = 'no';	//	序列設定
	object.width = 15;
	object.align = 'center';
	temp.push(object);
	for(var key in rowType)
	{
		object = new Object();
		object.name = key;
		// 判斷類型
		var tempType = "";
		if ( titleWidth[key] == 'hidden' )
			tempType = titleWidth[key];
		else
			tempType = rowType[key];
		//
		switch ( tempType )
		{	
			case "datetime":
			case "text":
				object.width = titleWidth[key];
				object.align = 'center';
				object.edittype = 'text';
				object.editable = true;	// 欄位編輯功能
				break;
			case "select":
				object.width = titleWidth[key];
				object.align = 'center';
				object.edittype = 'select';
				object.editable = true;	// 欄位編輯功能
				// 欄位選項
				var temp_value = "";
				for(var key1 in rowOptions[key])
				{	
					temp_value += key1 + ":" + rowOptions[key][key1] + ";";
				}
				object.editoptions = new Object(); 
				object.editoptions.value = temp_value.substring( 0,temp_value.length-1 );
				object.formatter = rowType[key];
				break;
			case "key":
					object.width = titleWidth[key];
					object.align = 'center';
					object.edittype = 'text';
				break;
			case "hidden":
				object.hidden = true;	// 欄位隱藏
				object.editable = true;	// 欄位編輯
				object.editrules = new Object();
				object.editrules.edithidden = false;	// 欄位編輯隱藏
				break;
			default:
				object.width = titleWidth[key];
				object.align = 'center';
				object.edittype = "text";
				// 欄位編輯功能
				object.editable = true;
		}
		//
		temp.push(object);
	}
	//alert(JSON.stringify(temp));
	options.colModel = temp;
    //
	options.autowidth = true;			//	自動調寬度
	options.gridview = true; 			//	加速顯示
	options.altRows = true;				//	條紋網格
	options.altclass= "ui-jqgrow-alt";	//	網格樣式
	//
	options.loadonce = true;			//	datatype=local 時, 加這個 true 才可本端排序/換頁
	options.shrinkToFit = true;			//	按各欄位寬設定值比例予以調整至符合總寬值
	//options.caption= "Plans"; 		//	表格收起
	//
	if (navID != null)
	{
		options.pager = '#' + navID;		//	導航列設置
		options.rowNum = 10;				//	網格記錄數
		options.rowList = [10,20,30];		//	網格選擇數
		options.viewrecords = true;			//	導航列觀看記錄
		// options.toppager = true;			//	導航列置頂
	}
	// 勾選框-多選
	options.multiselect = true;
	// 編輯-本地修改
	options.editurl = 'clientArray';
	
	return options;
}
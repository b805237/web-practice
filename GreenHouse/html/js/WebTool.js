/*
依比例縮放頁面
String id			網頁main ID
*/
// 偵測次數
var DetectScreenNumber = 0;

function ScaleBody(id)
{	var scaleRatio = 1.05;
	// 網頁大小
	var htmlWidth = $('#' + id).width();
	var htmlHeight = $('#' + id).height();
	// 電腦視窗大小
	var screenWidth = window.innerWidth;
	var screenHeight = window.innerHeight;
	// 以高為準，網頁大小 < 電腦視窗大小
	if ( htmlHeight < screenHeight )
	{
		var scaleHeight = screenHeight/htmlHeight;
		// 因應全螢幕留白
		var scaleWidth = screenWidth/htmlWidth;
		var scaleMin = Math.min(scaleHeight,scaleWidth);
		scaleRatio = Math.floor(scaleMin*9.7*100) / 1000;
		// Standard syntax
		document.getElementById(id).style.transform = "scale(" + scaleRatio + ")";
		// Code for Safari and Chrome
		document.getElementById(id).style.WebkitTransform = "scale(" + scaleRatio + ")";
		// Code for Firefox
		document.getElementById(id).style.moztransform = "scale(" + scaleRatio + ")";
		if ( scaleRatio > 2 )
		{	// 畫面放大比例超過，警告
			DetectScreenNumber++;
			if ( DetectScreenNumber % 10 == 1 )
			{
				var tempAlarm = "視窗長寬為：" + screenWidth + " x " + screenHeight + "\n" + 
								"網頁長寬為：" + htmlWidth + " x " + screenHeight + "\n" + 
								"畫面放大比例超過\n建議放大視窗或是調整解析度\n才能達到最佳的瀏覽舒適度";
				//alert(tempAlarm);
			}
		}
	}
	else
	{	// 畫面太小，警告
		DetectScreenNumber++;
		if ( DetectScreenNumber % 10 == 1 )
		{
			var tempAlarm = "視窗長寬為：" + screenWidth + " x " + screenHeight + "\n" + 
							"網頁長寬為：" + htmlWidth + " x " + screenHeight + "\n" + 
							"視窗長寬過小\n建議縮小視窗或是調整解析度\n才能達到最佳的瀏覽舒適度";
			//alert(tempAlarm);
		}
	}
	// 測試用，大小與縮放比例
	var temp = "screen=" + screenWidth + "X" + screenHeight + " html=" + htmlWidth + "X" + htmlHeight + " scale=" + scaleRatio;
	//document.getElementById( "scale-text" ).innerHTML = temp;
}

/*
PX讀取畫面
為解決PX切換畫面時，畫面會讀取不完全，以及PX轉譯為Html時，畫面會有縮放之情況。
String iframe		iframe Px ID
Int height			iframe Px 高度
Int time			讀取畫面時間(秒)
*/
function PxLoadPage(iframe,height,time)
{
	$(document).ready(function()
	{ // jQuery 方法 
		$("#" + iframe ).load(function()
		{	// px屬性
			var pxPage = document.getElementById(iframe);
			// 隱藏px畫面
			pxPage.style.visibility = "hidden";
			// 讀取畫面
			$.blockUI({ 
				message:'<h2>畫面讀取中</h2><br><h2><img src="images/page_loading.gif"></h2>',
				css: { 
		            border: 'none', 
		            padding: '10px', 
		            backgroundColor: '#fff', 
		            '-webkit-border-radius': '10px', 
		            '-moz-border-radius': '10px', 
		            //opacity: .5, 
		            color: '#000' 
	        	}
	        }); 
	        // 單位：毫秒
	        setTimeout($.unblockUI, time*1000); 
			// 重新指定px高度
			pxPage.height = height - 1;
			// 重新指定px高度，會等待1.5秒
			setTimeout(function ()
			{
				pxPage.height = height;
			},1500);
			// 顯現px畫面，會等待2.5秒
			setTimeout(function ()
			{
				pxPage.style.visibility = "visible";
			},2500);
		});
	});
}

/*
SVG物件切換風格樣式 for HJC
String SvgID		Svg物件ID
String StyleName	風格樣式
*/
function SvgStyleChange(SvgID,StyleName)
{
	var svgEmbed = document.getElementById(SvgID).getSVGDocument();
	// Svg內，要改變Style的物件
	var ItemArray = ["background","title","text","button"];
	//
	for (var i=0; i<ItemArray.length; i++)
	{
		var svgItem = svgEmbed.getElementById(ItemArray[i]);
		svgItem.setAttribute("class", StyleName + "-" + ItemArray[i]);
	}
}

function ViewportSide()
{
	 var viewportwidth;
	 var viewportheight;
	 
	 // the more standards compliant browsers (mozilla/netscape/opera/IE7) use window.innerWidth and window.innerHeight
	 
	 if (typeof window.innerWidth != 'undefined')
	 {
	      viewportwidth = window.innerWidth,
	      viewportheight = window.innerHeight
	 }
	 
	// IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)

	 else if (typeof document.documentElement != 'undefined'
	     && typeof document.documentElement.clientWidth !=
	     'undefined' && document.documentElement.clientWidth != 0)
	 {
	       viewportwidth = document.documentElement.clientWidth,
	       viewportheight = document.documentElement.clientHeight
	 }
	 
	 // older versions of IE
	 
	 else
	 {
	       viewportwidth = document.getElementsByTagName('body')[0].clientWidth,
	       viewportheight = document.getElementsByTagName('body')[0].clientHeight
	 }
//	document.write('<p>Your viewport width is '+viewportwidth+'x'+viewportheight+'</p>');
	var side = new Array();
	side.push(viewportwidth);
	side.push(viewportheight);
	
	return side;
}

// 接受參數函數
function getParameter(param)
{
	var query = window.location.search;
	var iLen = param.length;
	var iStart = query.indexOf(param);
	if (iStart == -1)
		return "";
	iStart += iLen + 1;
	var iEnd = query.indexOf("&", iStart);
	if (iEnd == -1)
		return query.substring(iStart);
	return query.substring(iStart, iEnd);
}

// 開啟視窗
function OpenLoading()
{	
	win = open("","視窗","status=no,toolbar=no,location=no,menubar=no,resizable=no,width=100,height=100");
	var ip = location.host;
	var project = "/ord/file:^HJC/garph/";
	win.document.write("處理中<br><br>");
	win.document.write("<img src='" + "https://" + ip + project + "images/loader.gif" + "'>");
}

// 關閉視窗
function CloseLoading()
{
	win.close();
}
//
function paddingLeft(str,lenght,symbol){
	if(str.length >= lenght)
	return str;
	else
	return paddingLeft(symbol+str,lenght,symbol);
}
// 時間格式轉換、自定義格式
//*** This code is copyright 2002-2016 by Gavin Kistner, !@phrogz.net
//*** It is covered under the license viewable at http://phrogz.net/JS/_ReuseLicense.txt
Date.prototype.customFormat = function(formatString){
  var YYYY,YY,MMMM,MMM,MM,M,DDDD,DDD,DD,D,hhhh,hhh,hh,h,mm,m,ss,s,ampm,AMPM,dMod,th;
  YY = ((YYYY=this.getFullYear())+"").slice(-2);
  MM = (M=this.getMonth()+1)<10?('0'+M):M;
  MMM = (MMMM=["January","February","March","April","May","June","July","August","September","October","November","December"][M-1]).substring(0,3);
  DD = (D=this.getDate())<10?('0'+D):D;
  //DDD = (DDDD=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][this.getDay()]).substring(0,3);
  DDD = (DDDD=["星期日","星期一","星期二","星期三","星期四","星期五","星期六"][this.getDay()]).substring(0,3);
  th=(D>=10&&D<=20)?'th':((dMod=D%10)==1)?'st':(dMod==2)?'nd':(dMod==3)?'rd':'th';
  formatString = formatString.replace("#YYYY#",YYYY).replace("#YY#",YY).replace("#MMMM#",MMMM).replace("#MMM#",MMM).replace("#MM#",MM).replace("#M#",M).replace("#DDDD#",DDDD).replace("#DDD#",DDD).replace("#DD#",DD).replace("#D#",D).replace("#th#",th);
  h=(hhh=this.getHours());
  if (h==0) h=24;
  if (h>12) h-=12;
  hh = h<10?('0'+h):h;
  hhhh = hhh<10?('0'+hhh):hhh;
  AMPM=(ampm=hhh<12?'AM':'PM').toUpperCase();
  mm=(m=this.getMinutes())<10?('0'+m):m;
  ss=(s=this.getSeconds())<10?('0'+s):s;
  return formatString.replace("#hhhh#",hhhh).replace("#hhh#",hhh).replace("#hh#",hh).replace("#h#",h).replace("#mm#",mm).replace("#m#",m).replace("#ss#",ss).replace("#s#",s).replace("#ampm#",ampm).replace("#AMPM#",AMPM);
};


jQuery.browser = {};
(function () {
    jQuery.browser.msie = false;
    jQuery.browser.version = 0;
    if (navigator.userAgent.match(/MSIE ([0-9]+)\./)) {
        jQuery.browser.msie = true;
        jQuery.browser.version = RegExp.$1;
    }
})();

// 按鍵&清單功能相關函數

/*
將資料放入樹狀清單設定，並呈現樹狀清單
Object data			Niagara資料
Object systemSet	函數相關設定。id：清單ID、set：清單設定、selectDevice：已選擇設備種類
data[0] = 第一層 data[1] = 第二層 data[2] = 第三層 以此類推
*/
function TreeList(data,systemSet)
{	
	var object = systemSet.set;
	var selectDevice = systemSet.selectDevice;
	
	var dataset = new Object();
	// 數據放入樹狀清單設定
	for(a=data.length-1;a>=0;a--)
	{	
		for(b=0;b<data[a].length;b++)
		{
			var temp = new Object();
			// 標題
			temp.title = data[a][b].display_name;
			// 是否為設備
			var deviceYN = true;
			var device = data[a][b].device_category;
			if ( device == 0 || device == null )
				deviceYN = false;
			else
			{	//檢查設備是否正確
				if ( !(selectDevice == 0 || selectDevice == null) )
				{
					if ( selectDevice != device )
						deviceYN = false;
				}
			}
			// 數值
			// key = key,title,deviceYN
			temp.key = data[a][b].pk_chart_id + "," + data[a][b].display_name + "," + deviceYN;
			// checkbox
			temp.checkbox= true;
			//
			var parent = data[a][b].parent_chart_id;
			var children = data[a][b].pk_chart_id;
			// 加入子層
			if ( Array.isArray(dataset[children]) == true )
				temp.children = dataset[children];
			// 以上設定放入父層
			if ( Array.isArray(dataset[parent]) == false )
			{
				dataset[parent] = new Array();
				if ( a == 0 )
					var grandfather = parent;
			}
			// 要放入節點，需符合以下條件
			// 1.要為設備
			// 2.不為設備者，需有子層
			if (!( deviceYN == false && Array.isArray(dataset[children]) == false ))
				dataset[parent].push(temp);
		}
	}
	object.source = dataset[grandfather];
	//
	$("#"+systemSet.id).fancytree(object);
	// reload
	var tree = $("#"+systemSet.id).fancytree("getTree");
	tree.reload(dataset[grandfather]);
}

/* 
樹狀清單設定
String selectText		已選擇清單文字 ID
String selectValue		已選擇清單數值 ID
Int selectMode			選擇模式1(single selection) 2 (multiple selection)
Int selectLimt			選擇數量上限
*/
function TreeListSet(selectText,selectValue,selectMode,selectLimt)
{
	var options = new Object();
	// checkbox
	options.checkbox = true;
	// 1 (single selection) 2 (multiple selection) 3 (hierarchical selection)
	options.selectMode = selectMode;
	if ( selectMode == 2 || selectMode == 3 )
	{	// 觸發動作之前
		options.beforeSelect = function(event, data)
		{
			var selNodes = data.tree.getSelectedNodes();
			if ( selNodes.length >= selectLimt &&  data.node.isSelected() == false )
			{
				alert("選擇設備已超過上限 "+selectLimt+" 個");
				return false;
			}
		};
	}
	// 選擇觸發動作
	options.select = function(event, data) 
	{	// Display list of selected nodes
	    var selNodes = data.tree.getSelectedNodes();
		// 標題
        var selTitles = $.map(selNodes, function(node){
			return node.title;
			// return "[" + node.key + "]: '" + node.title + "'";
		});
	    // 數值
        var selValues = $.map(selNodes, function(node){
        	var keyArray = node.key.split(",");
        	var temp = new Object();
        	temp.key = keyArray[0];
        	temp.title = keyArray[1];
        	temp.device = keyArray[2];
        	// 設備才能輸出
        	if ( temp.device  == "true" )
				return JSON.stringify(temp);
		});
		// 設備數量
		var selNumbers = 0;
		for (var i=0; i<selNodes.length; i++)
		{
			var keyArray = selNodes[i].key.split(",");
			if ( keyArray[2]  == "true" )
				selNumbers++;
		}
		// 
		if ( selectText != "" )
			$("#"+selectText).text("已選設備數" + selNumbers + "個");
		if ( selectValue != "" )
        	$("#"+selectValue).text("[" + selValues.join(", ") + "]");
	};
	return options;
}

// 取得特定radio的值
function radioGetValue(radioName)
{
	var form = document.getElementsByName(radioName);
	
	// 取得radio的值
	for (var i=0; i<form.length; i++)
	{
	   if (form[i].checked)
	   {
	      var language = form[i].value;
	      break;
	   }
	}
	return language;
}

// 取得特定checkbox的值
function checkboxGetValue(checkboxName)
{
	var form = document.getElementsByName(checkboxName);
	var select = new Object();
	select.name = new Array();
	select.value = new Object();
	// 取得radio的值
	for (var i=0; i<form.length; i++)
	{
	   if (form[i].checked)
	   {
	   	   var tempValue = form[i].value;
	   	   var tempName = document.getElementById(tempValue).innerHTML;
	   	   select.name.push(tempName);
	   	   select.value[tempValue] = tempName;
	   }
	}
	
	return select;
}
/*
動態產生select option
Object data			Niagara資料
Object systemSet	函數相關設定。id：select ID、text：文字說明、value：數值、default：預設選項、initial：初始選項
*/
function MakeSelectOption(data,systemSet)
{	// data長度，通常只有一維
	var dataLength = data[0].length;
	var mySelect = document.getElementById(systemSet.id);
	// 初始化，重置
	mySelect.options.length = 0;
	// 動態產生select option
	var optionNumber = 0;
	if ( dataLength == 0 )
		mySelect.options[optionNumber++] = new Option(systemSet.initial,"");
	else
	{	// 預設選項
		for(var key in systemSet.default)
			mySelect.options[optionNumber++] = new Option(systemSet.default[key],key);
		// 資料庫選項
		for(a=0;a<dataLength;a++)
			mySelect.options[(a+optionNumber)] = new Option(data[0][a][systemSet.text],data[0][a][systemSet.value]);
	}
}

/*
動態產生checkbox option
Object data			Niagara資料
Object systemSet	函數相關設定。divID：div ID、inputID：checkbox ID、text：文字說明、value：數值
*/
function MakeCheckboxOption(data,systemSet)
{	// data長度，通常只有一維
	var dataLength = data[0].length;
	var myBox = document.getElementById(systemSet.divID);
	// 初始化，資料歸零
	myBox.innerHTML = "";
	var temp = "";
	// 動態產生checkbox option
	if ( dataLength == 0 )
		temp = "查無設備資料";
	else
	{
		for(a=0;a<dataLength;a++)
			temp += "<input type='checkbox' name='"+systemSet.inputID+"' value='" + data[0][a][systemSet.value] + "'/>" + 
					"<text id='" + data[0][a][systemSet.value] + "'>" + data[0][a][systemSet.text] + "</text><br>";
	}
	myBox.innerHTML = temp;
}

/*
動態產生radio option
Object data			Niagara資料
Object systemSet	函數相關設定。divID：div ID、inputID：radio ID、text：文字說明、value：數值
*/
function MakeRadioOption(data,systemSet)
{	// data長度，通常只有一維
	var dataLength = data[0].length;
	var myBox = document.getElementById(systemSet.divID);
	// 初始化，資料歸零
	myBox.innerHTML = "";
	var temp = "";
	// 動態產生radio option
	if ( dataLength == 0 )
		temp = "查無設備資料";
	else
	{
		for(a=0;a<dataLength;a++)
			temp += "<input type='radio' name='"+systemSet.inputID+"' value='" + data[0][a][systemSet.value] + "'/>" + 
					"<text id='" + data[0][a][systemSet.value] + "'>" + data[0][a][systemSet.text] + "</text><br>";
	}
	myBox.innerHTML = temp;
}

/*
按鈕切換函數，同一群組按鈕，預設為關，觸發為開。開為獨一，其他為關。
String itemName			button群組名稱
String itemId			觸發button ID
String defaultAction	預設動作
String clickAction		觸發動作
目前先這樣，之後用函數取代
*/
function buttonSwitch(itemName,itemId,defaultAction,clickAction)
{
	var x = document.getElementsByName(itemName).length;
	var buttonId = "";
	for (var i=0; i<x; i++)
	{
		buttonId = document.getElementsByName(itemName)[i].id;
		if ( buttonId == itemId )
		{	// 觸發動作
			document.getElementById(buttonId).setAttribute("class", clickAction);
		}
		else
		{	// 預設動作
			document.getElementById(buttonId).setAttribute("class", defaultAction);
		}
	}
}

/*
input切換函數，同一群組input，預設為隱藏，觸發為呈現。呈現為獨一，其他為隱藏。
String itemName			input群組名稱
String itemId			觸發input ID
String defaultValue		預設值
*/
function inputSwitch(itemName,itemId,defaultValue)
{
	var x = document.getElementsByName(itemName).length;
	var buttonId = "";
	for (var i=0; i<x; i++)
	{
		inputId = document.getElementsByName(itemName)[i].id;
		if ( inputId == itemId )
		{	// 呈現
			document.getElementById(inputId).style.display = "";
			document.getElementById(inputId).value = defaultValue;
		}
		else
		{	// 隱藏
			document.getElementById(inputId).style.display="none";
			document.getElementById(inputId).value = "";
		}
	}
}
/*
取出object中key，依序放入array
Object obj	資料物件
return Array
*/
function objectKeys(obj) {
    var res = [];
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            res.push(key);
        }
    }
    return res;
}

/*
取出object中value，依序放入array
Object obj	資料物件
return Array
*/
function objectValues(obj) {
    var res = [];
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            res.push(obj[key]);
        }
    }
    return res;
}
/*
資料檢查

return parameter
String status			回傳狀態，成功為1
String msg				回傳訊息
Object data				回傳資料，格式為{Object1,Object2,...}
*/
function dataCheck()
{	// 取得資料
	var getData = new Object();
	getData.status = 1;
	var tempData = new Object();
	// 錯誤訊息
	var getError = new Object();
	getError.status = 0;
	// 能源類型
	var getName = "energyType";
	var element = document.getElementById(getName);
	if ( element != null )
	{
		var getValue = element.value;
		if ( getValue == "" )
		{
			alert("請選擇電、水、燃");
			return getError;
		}
		else
			tempData[getName] = getValue;
	}
	// 圖表類型
	var getName = "chartType";
	var element = document.getElementById(getName);
	if ( element != null )
	{
		var getValue = element.value;
		if ( getValue == "" )
		{
			alert("請選擇柱、折");
			return getError;
		}
		else
			tempData[getName] = getValue;
	}
	// 日期類型
	var getName = "dateType";
	var element = document.getElementById(getName);
	if ( element != null )
	{
		var getValue = element.value;
		if ( getValue == "" )
		{
			alert("請選擇日、月、年");
			return getError;
		}
		else
			tempData[getName] = getValue;
	}
	// 設備
	var getName = "deviceType";
	var element = document.getElementById(getName);
	if ( element != null )
	{
		var getValue = element.value;
		if ( getValue == "" )
		{
			alert("請選擇設備");
			return getError;
		}
		else
			tempData[getName] = getValue;
	}
	// 設備種類
	var getName = "deviceCategory";
	var element = document.getElementById(getName);
	if ( element != null )
	{
		var getValue = element.value;
		if ( getValue == "" )
		{
			alert("請選擇設備種類");
			return getError;
		}
		else
			tempData[getName] = getValue;
	}
	// 特別處理
	var tempDateType = document.getElementById("dateType");
	if ( tempDateType != null )
		tempDateType = document.getElementById("dateType").value;
	else
		tempDateType = "all";
	//
	var DateSection = new Array();
	DateSection["all"] = "myTimeSection";
	DateSection["day"] = "myDaySection";
	DateSection["month"] = "myMonthSection";
	DateSection["year"] = "myYearSection";
	// 日期1
	var getName = "TimeSection1";
	var element = document.getElementById(DateSection[tempDateType]+"1");
	if ( element != null )
	{
		var getValue = element.value;
		if ( getValue == "" )
		{
			alert("請選擇日期");
			return getError;
		}
		else
			tempData[getName] = getValue;
	}
	// 日期2
	var getName = "TimeSection2";
	var element = document.getElementById(DateSection[tempDateType]+"2");
	if ( element != null )
	{
		var getValue = element.value;
		if ( getValue == "" )
		{
			alert("請選擇日期");
			return getError;
		}
		else
			tempData[getName] = getValue;
	}
	getData.data = tempData;
	// 日期比較
	var element1 = document.getElementById(DateSection[tempDateType]+"1");
	var element2 = document.getElementById(DateSection[tempDateType]+"2");
	if ( element1 != null && element2 != null )
	{
		var getValue1 = element1.value;
		var getValue2 = element2.value;
		if ( getValue1 > getValue2 )
		{
			alert("開始日期不能大於結束日期");
			return getError;
		}
	}
	//
	return getData;
}
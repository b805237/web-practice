/*
將資料放入折線圖設定參數，並呈現折線圖
Object data			Niagara資料
Object systemSet	函數相關設定。id：圖表ID、set：圖表設定
*/
function LineChart(data,systemSet)
{	
	var myChart = echarts.init(document.getElementById(systemSet.id),"macarons");
	var object = systemSet.set;
	// 數據放入折線圖設定
	for(a=0;a<data.length;a++)
	{
		var dataset = new Array();
		for(b=0;b<data[a].length;b++)
		{
			var temp = new Array();
			temp.push(dateFoematISO(data[a][b].date));
			temp.push(data[a][b].value);
			dataset.push(temp);
		}
		object.series[a].data = dataset;
	}
	// 折線圖顯現
	myChart.setOption(object);
	// 計數歸零反應修正
	allUnSelected(myChart);
}

/* 
折線圖設定參數
Array datanameset		資料名稱
String title			圖標題
String xname			x軸名稱
String yname			y軸名稱
String yunit			y軸單位
*/
function LineChartSet(datanameset,title,xname,yname,yunit,alarm)
{
	var options = new Object();
	// 資料
	options.series = new Array();
	for(i=0 ; i<datanameset.length ; i++)
	{
		options.series[i] = new Object();
		options.series[i].name = datanameset[i];
		options.series[i].type = "line";
		options.series[i].data = new Array();
		options.series[i].smooth = true;
		options.series[i].symbolSize= 1;
		// 單調性
		options.series[i].smoothMonotone = 'x';
		// 標線 - 平均值
		/*
		options.series[i].markLine = new Object();
		options.series[i].markLine.data = new Array();
		options.series[i].markLine.data[0] = new Object();
		options.series[i].markLine.data[0].type = 'average';
		options.series[i].markLine.data[0].name = '平均值';*/
		// 標線 - 警告線
		if (alarm != null)
		{
			options.series[i].markLine.data[1] = new Object();
			options.series[i].markLine.data[1].name = '警告';
			options.series[i].markLine.data[1].yAxis = alarm;
			options.series[i].markLine.data[1].lineStyle = new Object();
			options.series[i].markLine.data[1].lineStyle.normal = new Object();
			options.series[i].markLine.data[1].lineStyle.normal.color = 'rgb(227, 23, 13)';
		}
	}
   	// 折線圖標題
   	options.title = new Object();
   	options.title.textStyle = new Object();
   	options.title.textStyle.color = "#1e6e8c";
   	options.title.textStyle.fontSize = 16;	// 字體大小
   	options.title.text = title;
   	options.title.x = 'center';
   	// 圖例組件
   	options.legend = new Object();
   	options.legend.type = 'scroll';
   	options.legend.top = 'bottom';
   	options.legend.data = datanameset;
   	// x軸
   	options.xAxis = new Object();
   	options.xAxis.name = xname;
   	options.xAxis.type = 'time';
   	options.xAxis.scale = true;
	
   	options.xAxis.axisLabel = new Object();
   	options.xAxis.axisLabel.formatter = function (value, index) 
   	{	// 格式化成月/日，只在第一个刻度或是增加值顯示年份
	    var date = new Date(value);
	    var val = date.customFormat("#hhhh#");
	  //  if (index === 0) 
	  //      val = date.customFormat("#YYYY#") + "\n" + val;
	    return val;
	};
	
	// y軸
   	options.yAxis = new Object();
	options.yAxis.name = yname + " " + yunit;
	options.yAxis.scale = false;
	options.yAxis.axisLabel = new Object();
	options.yAxis.axisLabel.formatter = '{value}';
	/*
	options.dataZoom = new Object();
	options.dataZoom.id= 'dataZoomX';
	options.dataZoom.type= 'slider';
	options.dataZoom.xAxisIndex = 0;
	options.dataZoom.filterMode='empty';
	options.dataZoom.bottom='bottom';
	*/
	// 提示框
	options.tooltip = new Object();
	options.tooltip.trigger = 'axis';
	options.tooltip.axisPointer = new Object();
	options.tooltip.axisPointer.animation = false;
	options.tooltip.confine = true;
	options.tooltip.formatter = function (params) 
	{
		var res = "";
		for (var i = 0, l = params.length; i < l; i++) 
		{ // color Span
			var colorSpan = "<span style='display:inline-block;margin-right:5px;border-radius:10px;width:9px;height:9px;background-color:" + params[i].color + "'></span>";
			
			if ( i == 0 )
				res = params[i].value[0];
			res += '<br/>' +  colorSpan + params[i].seriesName + ' : ' + params[i].value[1];
		}
		return res;
	};
	// 工具欄
	options.toolbox = new Object();
	options.toolbox.show = true;
	options.toolbox.right = '5%';
	options.toolbox.feature = new Object();
	// 區域縮放
	options.toolbox.feature.dataZoom = new Object();
	options.toolbox.feature.dataZoom.yAxisIndex = 'none';
	// 資料檢視
	//options.toolbox.feature.dataView = new Object();
	//options.toolbox.feature.dataView.readOnly = false;
	// 另存圖片
	options.toolbox.feature.saveAsImage = new Object();
	//
	return options;
}
/*
將資料放入折線圖設定參數，並呈現折線圖，烏來案
Object data			Niagara資料
Object systemSet	函數相關設定。id：圖表ID、set：圖表設定

function UlayPowerLineChart(data,systemSet)
{	
	var myChart = echarts.init(document.getElementById(systemSet.id));
	var object = systemSet.set;
	// 數據放入折線圖設定
	for(a=0;a<data.length;a++)
	{
		var dataset = new Array();
		for(b=0;b<data[a].length;b++)
		{
			var temp = new Array();
			temp.push(data[a][b].timestamp);
			temp.push(data[a][b].value);
			dataset.push(temp);
		}
		object.series[a].data = dataset;
	}
	// 折線圖顯現
	myChart.setOption(object);
	// 計數歸零反應修正
	allUnSelected(myChart);
}
*/
/* 
折線圖設定參數，烏來案
Array dataNameSet		資料名稱
Array dataAxisSet		資料名稱單位
String title			圖標題
String xName			x軸名稱
String y1Name			y軸1名稱
String y1Unit			y軸1單位
String y2Name			y軸2名稱
String y2Unit			y軸2單位

function UlayPowerLineChartSet(dataNameSet,dataAxisSet,title,xName,y1Name,y1Unit,y2Name,y2Unit)
{
	var options = new Object();
	// 圖表設定
	options.grid = new Object();
	options.grid.top = 100;
	// 資料
	options.series = new Array();
	for(i=0 ; i<dataNameSet.length ; i++)
	{
		options.series[i] = new Object();
		options.series[i].name = dataNameSet[i];
		options.series[i].type = "line";
		options.series[i].data = new Array();
		options.series[i].smooth = true;
		options.series[i].symbolSize = 1;
		// 資料對齊軸
		options.series[i].yAxisIndex = dataAxisSet[i];
		// 單調性
		options.series[i].smoothMonotone = 'x';
	}
   	// 折線圖標題
   	options.title = new Object();
   	options.title.text = title;
   	options.title.x = 'center';
   	// 圖例組件
   	options.legend = new Object();
   	options.legend.top = 'top';
   	options.legend.data = dataNameSet;
   	options.legend.width = 800;
   	// x軸
   	options.xAxis = new Object();
   	options.xAxis.name = xName;
   	options.xAxis.type = 'time';
   	options.xAxis.scale = true;
   	// y軸
   	options.yAxis = new Array();
	// 第一y軸
   	options.yAxis[0] = new Object();
	options.yAxis[0].name = y1Name + " " + y1Unit;
	options.yAxis[0].scale = true;
	options.yAxis[0].axisLabel = new Object();
	options.yAxis[0].axisLabel.formatter = '{value}';
	// 第二y軸
   	options.yAxis[1] = new Object();
	options.yAxis[1].name = y2Name + " " + y2Unit;
	options.yAxis[1].scale = true;
	options.yAxis[1].axisLabel = new Object();
	options.yAxis[1].axisLabel.formatter = '{value}';
	// 提示框
	options.tooltip = new Object();
	options.tooltip.trigger = 'axis';
	options.tooltip.axisPointer = new Object();
	options.tooltip.axisPointer.animation = false;
	options.tooltip.confine = true;
	// 工具欄
	options.toolbox = new Object();
	options.toolbox.show = true;
	options.toolbox.right = '5%';
	options.toolbox.feature = new Object();
	// 區域縮放
	options.toolbox.feature.dataZoom = new Object();
	options.toolbox.feature.dataZoom.yAxisIndex = 'none';
	// 資料檢視
	options.toolbox.feature.dataView = new Object();
	options.toolbox.feature.dataView.readOnly = false;
	// 另存圖片
	options.toolbox.feature.saveAsImage = new Object();
	//
	return options;
}
*/
/*
將資料放入圖表設定參數，並呈現單一同期比較圖
Object data			Niagara資料
Object systemSet	函數相關設定。id：圖表ID、set：圖表設定、table：表格呈現、period：日期類型、devicename：設備名稱

function SinglePeriodComparisonChart(data,systemSet)
{	
	var myChart = echarts.init(document.getElementById(systemSet.id),"macarons");
	var object = systemSet.set;
	// 數據放入折線圖設定
	for(a=0;a<data.length;a++)
	{
		var dataset = new Array("null");
		for(b=0;b<data[a].length;b++)
		{
			var temp = data[a][b].value;
			if ( temp == 0 )
				dataset[b] = "null";
			else
				dataset[b] = temp;
		}
		object.series[a].data = dataset;
	}
	// 圖表顯現
	myChart.setOption(object);
	// 計數歸零反應修正
	allUnSelected(myChart);
	// 表格數據呈現
	if ( ( systemSet.tableid != "" ) || ( systemSet.tableid != null ) )
	{	// 初始化表格
		// 表格呈現
		document.getElementById(systemSet.tableid).style.display = "";
		// 設備名稱
		document.getElementById( "device" ).innerHTML = systemSet.devicename;
		for(c=0;c<3;c++)
			document.getElementById( "title" + c ).innerHTML = "";
		for(c=0;c<3;c++)
			document.getElementById( "value" + c ).innerHTML = "-";
		for(c=1;c<3;c++)
		{
			document.getElementById( "increase" + c ).innerHTML = "-";
			document.getElementById( "rate" + c ).innerHTML = "-";
		}
		if ( systemSet.period == "year" )
		{
			document.getElementById( "row1" ).innerHTML = "同比";
			document.getElementById( "row2" ).innerHTML = "环比";
		}
		
		else
		{
			document.getElementById( "row1" ).innerHTML = "环比";
			document.getElementById( "row2" ).innerHTML = "同比";
		}
		// 本期數
		var thisperiod = 0;
		for(c=0;c<object.series.length;c++)
		{	// 標題
			document.getElementById( "title" + c ).innerHTML = object.series[c].name;
			// 數據
			var tempvalue = object.series[c].data[0];
			if ( tempvalue != "null" )
				document.getElementById( "value" + c ).innerHTML = tempvalue;
			// 增減額與增減比
			if ( c == 0 )
			{
				if ( tempvalue != "null" )
					thisperiod = parseFloat(tempvalue);
			}
			else
			{
				if ( tempvalue != "null" )
				{
					var increase = thisperiod - parseFloat(tempvalue);
					document.getElementById( "increase" + c ).innerHTML = increase.toFixed(2);
					var rate = 100 * increase / parseFloat(tempvalue);
					document.getElementById( "rate" + c ).innerHTML = rate.toFixed(2) + "%";
				}
			}
		}
	}
}
*/

/* 
單一同期比較圖設定參數
Array datanameset		資料名稱
String title			圖標題
Array xname				x軸名稱
String yname			y軸名稱
String yunit			y軸單位

function SinglePeriodComparisonChartSet(datanameset,title,xname,yname,yunit)
{
	var options = new Object();
	// 資料
	options.series = new Array();
	for(i=0 ; i<datanameset.length ; i++)
	{
		options.series[i] = new Object();
		options.series[i].name = datanameset[i];
		options.series[i].type = 'bar';
		options.series[i].data = new Array();
	}
   	// 圖表標題
   	options.title = new Object();
   	options.title.text = title;
   	options.title.x = 'center';
   	// 圖例組件
   	options.legend = new Object();
   	options.legend.top = 'bottom';
   	options.legend.data = datanameset;
   	// x軸
   	options.xAxis = new Object();
   	options.xAxis.type = 'category';
   	options.xAxis.data = xname;
	// y軸
   	options.yAxis = new Object();
   	options.yAxis.min = 0;
	options.yAxis.name = yname + " " + yunit;
	options.yAxis.scale = true;
	options.yAxis.axisLabel = new Object();
	options.yAxis.axisLabel.formatter = '{value}';
	// 提示框
	options.tooltip = new Object();
	options.tooltip.trigger = 'axis';
	options.tooltip.axisPointer = new Object();
	options.tooltip.axisPointer.type = 'shadow';
	options.tooltip.confine = true;
	// 工具欄
	options.toolbox = new Object();
	options.toolbox.show = true;
	options.toolbox.right = '5%';
	options.toolbox.feature = new Object();
	// 區域縮放
	options.toolbox.feature.dataZoom = new Object();
	options.toolbox.feature.dataZoom.yAxisIndex = 'none';
	// 資料檢視
	options.toolbox.feature.dataView = new Object();
	options.toolbox.feature.dataView.readOnly = false;
	// 另存圖片
	options.toolbox.feature.saveAsImage = new Object();
	//
	return options;
}
*/
/*
將資料放入圖表設定參數，並呈現同期比較圖
Object data			Niagara資料
Object systemSet	函數相關設定。id：圖表ID、set：圖表設定、period：資料週期
*/
function PeriodComparisonChart(data,systemSet)
{	
	var myChart = echarts.init(document.getElementById(systemSet.id),"macarons");
	var object = systemSet.set;
	// x軸放入圖表設定
   	switch (systemSet.period)
   	{	// 決定x軸個數
   		case "year":
			var periodNumber = 12;
			var periodFirst = 1;
			break;
   		case "month":
			var periodNumber = 31;
			var periodFirst = 1;
			break;
		case "week":
			var periodNumber = 7;
			var periodFirst = 1;
			break;
   		case "day":
			var periodNumber = 24;
			var periodFirst = 0;
			break;
   	}
	var xdata = new Array();
   	for(i=0 ; i<periodNumber ; i++)
		xdata.push(periodFirst + i);
	object.xAxis.data = xdata;
	// 數據放入圖表設定
	for(a=0;a<data.length;a++)
	{
		var dataset = new Array();
		var count = 0;
		for(b=0 ; b<periodNumber ; b++)
		{	// periodNumber會比對unit，有資料就放入，無資料就空值
			var temp = null;
			if ( count < data[a].length )
			{
				if ( b == ( parseInt(data[a][count].unit) - periodFirst ) )
				{
					temp = data[a][count].value;
					count++;
				}
			}
			dataset.push(temp);
		}
		object.series[a].data = dataset;
	}
	//baja.outln(JSON.stringify(data));
	// 圖表顯現
	myChart.setOption(object);
	// 計數歸零反應修正
	allUnSelected(myChart);
}

/* 
同期比較圖設定參數
Array datanameset		資料名稱
String title			圖標題
String yname			y軸名稱
String yunit			y軸單位
*/
function PeriodComparisonChartSet(datanameset,type,title,yname,yunit)
{
	var options = new Object();
	// 資料
	options.series = new Array();
	for(i=0 ; i<datanameset.length ; i++)
	{

		options.series[i] = new Object();
		options.series[i].name = datanameset[i];
		options.series[i].type = type;
		options.series[i].data = new Array();

	}
   	// 圖表標題
   	options.title = new Object();
   	options.title.textStyle = new Object();
   	options.title.textStyle.color = "#1e6e8c";
   	options.title.text = title;
   	options.title.x = 'center';
   	// 圖例組件
   	options.legend = new Object();
   	options.legend.type = 'scroll';
   	options.legend.top = 'bottom';
   	options.legend.data = datanameset;
   	// x軸
   	options.xAxis = new Object();
   	options.xAxis.type = 'category';
   	options.xAxis.data = new Array();
	// y軸
   	options.yAxis = new Object();
	options.yAxis.name = yname + " " + yunit;
	options.yAxis.scale = true;
	options.yAxis.min = 0;
	options.yAxis.axisLabel = new Object();
	// 格式化
	options.yAxis.axisLabel.formatter = 
	function (value, index) 
	{	// 數據超過1000
		if ( value >= 1000 )
			return (value/1000) + "k";
	    else
	    	return value;
	};
	// grid
   	options.grid = new Object();
   	options.grid.left = '12.5%' ;
   	options.grid.right = '2.5%' ;
	// 提示框
	options.tooltip = new Object();
	options.tooltip.trigger = 'axis';
	options.tooltip.axisPointer = new Object();
	options.tooltip.axisPointer.type = 'shadow';
	options.tooltip.confine = true;
	// 工具欄
	options.toolbox = new Object();
	options.toolbox.show = true;
	options.toolbox.right = '5%';
	options.toolbox.feature = new Object();
	// 區域縮放
	options.toolbox.feature.dataZoom = new Object();
	options.toolbox.feature.dataZoom.yAxisIndex = 'none';
	// 資料檢視
	//options.toolbox.feature.dataView = new Object();
	//options.toolbox.feature.dataView.readOnly = false;
	// 另存圖片
	options.toolbox.feature.saveAsImage = new Object();
	//
	return options;
}

/*
將資料放入圖表設定參數，並呈現裝置比較圖
Object data			Niagara資料
Object systemSet	函數相關設定。id：圖表ID、set：圖表設定、period：資料週期
*/
function DeviceComparisonChart(data,systemSet)
{	
	var myChart = echarts.init(document.getElementById(systemSet.id),"macarons");
	var object = systemSet.set;
	// x軸放入圖表設定
   	switch (systemSet.period)
   	{	// 決定x軸個數
   		case "year":
			var periodNumber = 12;
			var periodFirst = 1;
			break;
   		case "month":
			var periodNumber = 31;
			var periodFirst = 1;
			break;
		case "week":
			var periodNumber = 7;
			var periodFirst = 0;
			break;
   		case "day":
			var periodNumber = 24;
			var periodFirst = 0;
			break;
   	}
	var xdata = new Array();
   	for(i=0 ; i<periodNumber ; i++)
		xdata.push(periodFirst + i);
	object.xAxis.data = xdata;
	// 數據放入圖表設定
	for(a=0;a<data.length;a++)
	{
		var dataset = new Array();
		var count = 0;
		for(b=0 ; b<periodNumber ; b++)
		{	// periodNumber會比對unit，有資料就放入，無資料就空值
			var temp = "";
			if ( count < data[a].length )
			{
				if ( b == ( parseInt(data[a][count].unit) - periodFirst ) )
				{
					temp = data[a][count].value;
					count++;
				}
			}
			dataset.push(temp);
		}
		object.series[a].data = dataset;
	}
	//baja.outln(JSON.stringify(data));
	// 圖表顯現
	myChart.setOption(object);
	// 計數歸零反應修正
	allUnSelected(myChart);
}

/* 
設備比較圖設定參數
Array datanameset		資料名稱
String title			圖標題
String xname			x軸名稱
String yname			y軸名稱
String yunit			y軸單位
*/
function DeviceComparisonChartSet(datanameset,title,xname,yname,yunit)
{
	var options = new Object();
	// 資料
	options.series = new Array();
	for(i=0 ; i<datanameset.length ; i++)
	{
		options.series[i] = new Object();
		options.series[i].name = datanameset[i];
		options.series[i].type = 'bar';
		options.series[i].data = new Array();
	}
   	// 圖表標題
   	options.title = new Object();
   	options.title.text = title;
   	options.title.x = 'center';
   	// 圖例組件
   	options.legend = new Object();
   	options.legend.type = 'scroll';
   	options.legend.top = 'bottom';
   	options.legend.data = datanameset;
   	// x軸
   	options.xAxis = new Object();
   	options.xAxis.type = 'category';
   	options.xAxis.data = new Array();
	// y軸
   	options.yAxis = new Object();
	options.yAxis.name = yname + " " + yunit;
	options.yAxis.scale = true;
	options.yAxis.min = 0;
	options.yAxis.axisLabel = new Object();
	options.yAxis.axisLabel.formatter = '{value}';
	// 提示框
	options.tooltip = new Object();
	options.tooltip.trigger = 'axis';
	options.tooltip.axisPointer = new Object();
	options.tooltip.axisPointer.type = 'shadow';
	// 工具欄
	options.toolbox = new Object();
	options.toolbox.show = true;
	options.toolbox.right = '5%';
	options.toolbox.feature = new Object();
	// 區域縮放
	options.toolbox.feature.dataZoom = new Object();
	options.toolbox.feature.dataZoom.yAxisIndex = 'none';
	// 資料檢視
	//options.toolbox.feature.dataView = new Object();
	//options.toolbox.feature.dataView.readOnly = false;
	// 另存圖片
	options.toolbox.feature.saveAsImage = new Object();
	//
	return options;
}

/*
將資料放入圖表設定參數，並呈現圓餅圖
Object data			Niagara資料
Object systemSet	函數相關設定

String id			圖表ID
Object set			圖表設定
Object item			分項項目
*/
function PieChart(data,systemSet)
{	
	var myChart = echarts.init(document.getElementById(systemSet.id),"macarons");
	// 分項項目
	var object = systemSet.set;
	var item = systemSet.item;
	// 數據放入圖表設定
	for(a=0;a<data.length;a++)
	{
		var dataset = new Array();
		// 依照item順序放值，不存在需放入null，每個item都需對應到值(包含零 or null)
		// 為避免資料庫中間有不連續資料(如只有item1,2,4)，需用loop檢查
		for(var key in item)
		{	// 暫存值
			var temp = new Object();
			temp.name = item[key];
			temp.value = null;
			// loop檢查
			for(b=0;b<data[a].length;b++)
			{	// item順序要與unit符合
				if ( data[a][b].unit == key )
				{
					temp.value = data[a][b].value;
					break;
				}
			}
			dataset.push(temp);
		}
		object.series[a].data = dataset;
	}
	// 折線圖顯現
	myChart.setOption(object);
	// 計數歸零反應修正
	allUnSelected(myChart);
}

/* 
圓餅圖設定參數
String title			圖標題
String unit				資料單位
Array item				分項項目
*/
function PieChartSet(title,unit,item)
{
	var options = new Object();
	// 資料
	options.series = new Array();
	options.series[0] = new Object();
	options.series[0].name = title;
	options.series[0].type = "pie";
	options.series[0].data = new Array();
	// 圓餅半徑
	options.series[0].radius = '55%';
	// 圓餅位置
	options.series[0].center = ['50%', '60%'];
	// 風格
	options.series[0].itemStyle = new Object();
	options.series[0].itemStyle.normal = new Object();
	// 標籤
	options.series[0].itemStyle.normal.label = new Object();
	options.series[0].itemStyle.normal.label.show = true;
	//options.series[0].itemStyle.normal.label.formatter = '{b} : {c}' + unit + '({d}%)';
	options.series[0].itemStyle.normal.labelLine = new Object();
	options.series[0].itemStyle.normal.labelLine.show = true;
   	// 折線圖標題
   	options.title = new Object();
   	options.title.textStyle = new Object();
   	options.title.textStyle.color = "#1e6e8c";
   	options.title.text = title;
   	options.title.x = 'center';
   	// 圖例組件
   	options.legend = new Object();
   	options.legend.type = 'scroll';
   	options.legend.left = 'left';
   	options.legend.orient = 'vertical',
   	options.legend.data = item;
	// 提示框
	options.tooltip = new Object();
	options.tooltip.trigger = 'item';
	options.tooltip.formatter = '{a} <br/>{b} : {c}' + unit + '({d}%)';
	options.tooltip.confine = true;
	// 工具欄
	options.toolbox = new Object();
	options.toolbox.show = true;
	options.toolbox.right = '5%';
	options.toolbox.feature = new Object();
	// 資料檢視
	//options.toolbox.feature.dataView = new Object();
	//options.toolbox.feature.dataView.readOnly = false;
	// 另存圖片
	options.toolbox.feature.saveAsImage = new Object();
	//
	return options;
}

/* 
環形圖設定參數(圓餅圖一種)
String title			圖標題
String unit				資料單位
Array item				分項項目
*/
function RingChartSet(title,unit,item)
{
	var options = new Object();
	// 資料
	options.series = new Array();
	options.series[0] = new Object();
	options.series[0].name = title;
	options.series[0].type = "pie";
	options.series[0].data = new Array();
	// 圓餅半徑(環形)
	options.series[0].radius = ['40%', '60%'];
	// 圓餅位置
	options.series[0].center = ['50%', '60%'];
	// 防止標籤重疊策略
	options.series[0].avoidLabelOverlap = false;
	// 標籤(中間)
	options.series[0].label = new Object();
	options.series[0].label.normal = new Object();
	options.series[0].label.normal.show = false;
	options.series[0].label.normal.position = 'center';
	
	options.series[0].label.emphasis = new Object();
	options.series[0].label.emphasis.show = true;
	options.series[0].label.emphasis.textStyle = new Object();
	options.series[0].label.emphasis.textStyle.fontSize = '15';
	options.series[0].label.emphasis.textStyle.fontWeight = 'bold';
	// 標線
	options.series[0].labelLine = new Object();
	options.series[0].labelLine.normal = new Object();
	options.series[0].labelLine.normal.show = false;
   	// 折線圖標題
   	options.title = new Object();
   	options.title.textStyle = new Object();
   	options.title.textStyle.color = "#1e6e8c";
   	options.title.text = title;
   	options.title.x = 'center';
   	// 圖例組件
   	options.legend = new Object();
   	options.legend.type = 'scroll';
   	options.legend.x = 'left';
   	options.legend.top = '25%';
   	options.legend.orient = 'vertical',
   	options.legend.data = item;
	// 提示框
	options.tooltip = new Object();
	options.tooltip.trigger = 'item';
	options.tooltip.formatter = '{a} <br/>{b} : {c}' + unit + '({d}%)';
	options.tooltip.confine = true;
	// 工具欄
	options.toolbox = new Object();
	options.toolbox.show = true;
	options.toolbox.right = '5%';
	options.toolbox.feature = new Object();
	// 資料檢視
	//options.toolbox.feature.dataView = new Object();
	//options.toolbox.feature.dataView.readOnly = false;
	// 另存圖片
	options.toolbox.feature.saveAsImage = new Object();
	//
	return options;
}

/* 
多個(時間週期)圓餅圖設定參數
Array title			圖標題
String unit			資料單位
Array item			分項項目
*/
function ItemPieChartSet(title,unit,item)
{
	var options = new Object();
	// 資料
	options.series = new Array();
	// 標題
   	options.title = new Array();
	for(i=0 ; i<title.length ; i++)
	{
		options.series[i] = new Object();
		options.series[i].name = title[i];
		options.series[i].type = "pie";
		options.series[i].data = new Array();
		// 圓餅半徑
		options.series[i].radius = '35%';
		// 圓餅位置
		var x = (100/(title.length+1))*(i+1);
		options.series[i].center = [ x +'%', '50%'];
		// 風格
		options.series[i].itemStyle = new Object();
		options.series[i].itemStyle.normal = new Object();
		// 標籤
		options.series[i].itemStyle.normal.label = new Object();
		options.series[i].itemStyle.normal.label.show = true;
		//options.series[0].itemStyle.normal.label.formatter = '{b} : {c}' + unit + '({d}%)';
		options.series[i].itemStyle.normal.labelLine = new Object();
		options.series[i].itemStyle.normal.labelLine.show = true;
		// 標題
		options.title[i] = new Object();
	   	options.title[i].text = title[i];
	   	options.title[i].x = x +'%';
	   	options.title[i].textAlign = 'center';
	   	options.title[i].textStyle = new Object();
	   	options.title[i].textStyle.fontSize = 14;	// 字體大小
   		options.title[i].textStyle.color = "#1e6e8c";
	}
   	// 圖例組件
   	options.legend = new Object();
   	options.legend.type = 'scroll';
   	options.legend.left = 'left';
   	options.legend.top = 'middle';
   	options.legend.orient = 'vertical',
   	options.legend.data = item;
	// 提示框
	options.tooltip = new Object();
	options.tooltip.trigger = 'item';
	options.tooltip.formatter = '{a} <br/>{b} : {c}' + unit + '({d}%)';
	options.tooltip.confine = true;
	// 工具欄
	options.toolbox = new Object();
	options.toolbox.show = true;
	options.toolbox.right = '5%';
	options.toolbox.feature = new Object();
	// 資料檢視
	//options.toolbox.feature.dataView = new Object();
	//options.toolbox.feature.dataView.readOnly = false;
	// 另存圖片
	options.toolbox.feature.saveAsImage = new Object();
	//
	return options;
}

/*
將資料放入儀表板設定參數，並呈現儀表板
String data			Niagara資料(單項)
Object systemSet	函數相關設定。chart：圖表ID設置、set：圖表設定、dataname：讀出資料
*/
function Dashboard(data,systemSet)
{
	var object = systemSet.set;
    object.series[0].data[0].value = data;
    systemSet.chart.setOption(object, true);
}

/* 
儀表板設定參數
String title			圖標題
String unit				資料單位
Array interval			資料單位
*/
function DashboardSet(title,unit,interval)
{
	var options = new Object();
	// 資料
	options.series = new Array();
	options.series[0] = new Object();
	options.series[0].name = title;
	options.series[0].type = 'gauge';
	// 半徑
	options.series[0].radius = '90%';
	// 刻度區間
	options.series[0].min = interval[0];
	options.series[0].max = interval[1];
	// 詳情
	options.series[0].detail = new Object();
	options.series[0].detail.offsetCenter =  [0, '85%'];
	options.series[0].detail.formatter = '{value} ' + unit;
	options.series[0].detail.textStyle = new Object();
	options.series[0].detail.textStyle.fontSize = 20;
	// 刻度線
	options.series[0].axisLine = new Object();
	options.series[0].axisLine.lineStyle = new Object();
	options.series[0].axisLine.lineStyle.width = 10;
	// 刻度(小)
	options.series[0].axisTick = new Object();
	options.series[0].axisTick.length = 5;
	// 刻度(大)
	options.series[0].splitLine = new Object();
	options.series[0].splitLine.length = 10;
	// 儀表板只有一個值
	options.series[0].data = new Array();
	options.series[0].data[0] = new Object();
	options.series[0].data[0].name = title;
	// 提示框
	options.tooltip = new Object();
	options.tooltip.formatter = "{b} : {c} " + unit;
	options.tooltip.confine = true;
	// 工具欄
	options.toolbox = new Object();
	options.toolbox.show = true;
	options.toolbox.right = '5%';
	options.toolbox.feature = new Object();
	// 另存圖片
	options.toolbox.feature.saveAsImage = new Object();
	//
	return options;
}

/*
將資料放入柱狀圖設定參數，並呈現柱狀圖，X軸為日期單位
Object data			Niagara資料
Object systemSet	函數相關設定。id：圖表ID、set：圖表設定
*/
function BarChart(data,systemSet)
{	
	var myChart = echarts.init(document.getElementById(systemSet.id),"macarons");
	var object = systemSet.set;
	// X軸坐標-全部集合
	var xAxis = new Array();
	for(a=0;a<data.length;a++)
	{
		for(b=0;b<data[a].length;b++)
		{
			if ( xAxis.indexOf(data[a][b].date) == -1 )
				xAxis.push(data[a][b].date);
		}
	}
	// X軸坐標-排序
	xAxis = xAxis.sort();
	// X軸坐標放入柱狀圖設定
	object.xAxis.data = xAxis;
	// 數據放入柱狀圖設定
	for(a=0;a<data.length;a++)
	{
		var dataset = new Array(xAxis.length);
		for(b=0;b<data[a].length;b++)
		{	// 根據date相對於X軸坐標位置，value也會放再相對應位置
			var position = xAxis.indexOf(data[a][b].date);
			dataset[position] = data[a][b].value;
		}
		object.series[a].data = dataset;
	}
	// 折線圖顯現
	myChart.setOption(object);
	// 計數歸零反應修正
	allUnSelected(myChart);
}

/* 
柱狀圖設定參數
Array datanameset		資料名稱
String title			圖標題
String xname			x軸名稱
String yname			y軸名稱
String yunit			y軸單位
*/
function BarChartSet(datanameset,title,xname,yname,yunit)
{
	var options = new Object();
	// 資料
	options.series = new Array();
	for(i=0 ; i<datanameset.length ; i++)
	{
		options.series[i] = new Object();
		options.series[i].name = datanameset[i];
		options.series[i].type = "bar";
		options.series[i].barMaxWidth = 20;
		options.series[i].data = new Array();
	}
   	// 柱狀圖標題
   	options.title = new Object();
   	options.title.textStyle = new Object();
   	options.title.textStyle.color = "#1e6e8c";
   	options.title.textStyle.fontSize = 16;	// 字體大小
   	options.title.text = title;
   	options.title.x = 'center';
   	// 圖例組件
   	options.legend = new Object();
   	options.legend.type = 'scroll';
   	options.legend.top = 'bottom';
   	options.legend.data = datanameset;
   	// x軸
   	options.xAxis = new Object();
   	options.xAxis.name = xname;
   	options.xAxis.type = 'category';
	options.xAxis.data = new Object();
	// y軸
   	options.yAxis = new Object();
	options.yAxis.name = yname + " " + yunit;
	options.yAxis.scale = true;
	options.yAxis.min = 0;
	options.yAxis.axisLabel = new Object();
	options.yAxis.axisLabel.formatter = '{value}';
	// 提示框
	options.tooltip = new Object();
	options.tooltip.trigger = 'axis';
	options.tooltip.axisPointer = new Object();
	options.tooltip.axisPointer.animation = false;
	options.tooltip.confine = true;
	// 工具欄
	options.toolbox = new Object();
	options.toolbox.show = true;
	options.toolbox.right = '5%';
	options.toolbox.feature = new Object();
	// 區域縮放
	options.toolbox.feature.dataZoom = new Object();
	options.toolbox.feature.dataZoom.yAxisIndex = 'none';
	// 資料檢視
	//options.toolbox.feature.dataView = new Object();
	//options.toolbox.feature.dataView.readOnly = false;
	// 另存圖片
	options.toolbox.feature.saveAsImage = new Object();
	//
	return options;
}

/*
將資料放入柱狀圖設定參數，並呈現柱狀圖，X軸為分項，資料組別為時間週期
Object data			Niagara資料
Object systemSet	函數相關設定

String id			圖表ID
Object set			圖表設定
Object item			分項項目=X軸坐標
*/
function ItemBarChart(data,systemSet)
{	
	var myChart = echarts.init(document.getElementById(systemSet.id),"macarons");
	// 分項項目(X軸坐標)放入柱狀圖設定
	var object = systemSet.set;
	var item = systemSet.item;
	object.xAxis.data = objectValues(item);	// X軸坐標
	// 數據放入柱狀圖設定
	for(a=0;a<data.length;a++)
	{
		var dataset = new Array();
		// 依照item順序放值，不存在需放入null，每個item都需對應到值(包含零 or null)
		// 為避免資料庫中間有不連續資料(如只有item1,2,4)，需用loop檢查
		for(var key in item)
		{	// 暫存值
			var temp = null;
			// loop檢查
			for(b=0;b<data[a].length;b++)
			{	// item key要與unit符合
				if ( data[a][b].unit == key )
				{
					temp = data[a][b].value;
					break;
				}
			}
			dataset.push(temp);
		}
		object.series[a].data = dataset;
	}
	// 折線圖顯現
	myChart.setOption(object);
	// 計數歸零反應修正
	allUnSelected(myChart);
}

/*
單一周期柱狀圖
將資料放入柱狀圖設定參數，並呈現柱狀圖，資料組別為unit，數值為value
Object data			Niagara資料
Object systemSet	函數相關設定。id：圖表ID、set：圖表設定
*/
function SinglePeriodBarChart(data,systemSet)
{	
	var myChart = echarts.init(document.getElementById(systemSet.id),"macarons");
	// 數據放入柱狀圖設定
	var object = systemSet.set;
	var dataLength = data[0].length;
	for(a=0;a<dataLength;a++)
	{	// 資料
		object.series[a].name = data[0][a].unit;
		object.series[a].data.push(parseFloat(data[0][a].value).toFixed(2));
		// 圖例組件
		object.legend.data.push(data[0][a].unit);
	}
	// 折線圖顯現
	//baja.outln(JSON.stringify(object));
	myChart.setOption(object);
	// 計數歸零反應修正
	allUnSelected(myChart);
}

/* 
單一周期柱狀圖
柱狀圖設定參數
Int datanumber		資料個數
String title		圖標題
String xname		x軸資料名稱
String yname		y軸名稱
String yunit		y軸單位
*/
function SinglePeriodBarChartSet(datanumber,title,xname,yname,yunit)
{
	var options = new Object();
	// 資料
	options.series = new Array();
	for(i=0 ; i<datanumber ; i++)
	{
		options.series[i] = new Object();
		options.series[i].name = "";
		options.series[i].type = "bar";
		options.series[i].barMaxWidth = 20;
		options.series[i].data = new Array();
	}
   	// 柱狀圖標題
   	options.title = new Object();
   	options.title.textStyle = new Object();
   	options.title.textStyle.color = "#1e6e8c";
//  options.title.textStyle.fontSize = 16;	// 字體大小
   	options.title.text = title;
   	options.title.x = 'center';
   	// 圖例組件
   	options.legend = new Object();
   	options.legend.type = 'scroll';
   	options.legend.top = 'bottom';
   	options.legend.data = new Array();
   	// x軸
   	options.xAxis = new Object();
   	options.xAxis.type = 'category';
	options.xAxis.data = [xname];
	// y軸
   	options.yAxis = new Object();
	options.yAxis.name = yname + " " + yunit;
	options.yAxis.scale = true;
	options.yAxis.min = 0;
	options.yAxis.axisLabel = new Object();
	options.yAxis.axisLabel.formatter = '{value}';
	// 提示框
	options.tooltip = new Object();
	options.tooltip.trigger = 'axis';
	options.tooltip.axisPointer = new Object();
	options.tooltip.axisPointer.animation = false;
	options.tooltip.confine = true;
	// 工具欄
	options.toolbox = new Object();
	options.toolbox.show = true;
	options.toolbox.right = '5%';
	options.toolbox.feature = new Object();
	// 區域縮放
	options.toolbox.feature.dataZoom = new Object();
	options.toolbox.feature.dataZoom.yAxisIndex = 'none';
	// 資料檢視
	//options.toolbox.feature.dataView = new Object();
	//options.toolbox.feature.dataView.readOnly = false;
	// 另存圖片
	options.toolbox.feature.saveAsImage = new Object();
	//
	return options;
}


/*
將資料乘上係數後，放入堆疊柱狀圖設定參數，並呈現柱狀圖，X軸為日期單位
Object data			Niagara資料
Object systemSet	函數相關設定

String id			圖表ID
Object set			圖表設定
Object item			分項項目
Object coef			分項係數名稱
*/
function CoefStackBarChart(data,systemSet)
{	
	var myChart = echarts.init(document.getElementById(systemSet.id),"macarons");
	// 分項係數名稱
	var coef = systemSet.coef;
	// 分項項目
	var object = systemSet.set;
	var item = systemSet.item;
	// 資料分項
	// 依照item順序放值，不存在需放入null，每個item都需對應到值(包含零 or null)
	// 為避免資料庫中間有不連續資料(如只有item1,2,4)，需用loop檢查
	var datagroup = new Array();	// item資料
	for(var key in item)
	{
		var dataset = new Array();
		for(a=0;a<data.length;a++)
		{	// 暫存值
			var temp = null;
			// loop檢查
			for(b=0;b<data[a].length;b++)
			{	// item key要與unit符合
				if ( data[a][b].unit == key )
				{
					temp = (data[a][b].value)*(data[a][b][coef[key]]);
					temp = temp.toFixed(2);
					break;
				}
			}
			dataset.push(temp);
		}
		datagroup.push(dataset);
	}
	// 數據放入圖表設定
	var dataLength = object.series.length;
	for(a=0;a<dataLength;a++)
		object.series[a].data = datagroup[a];
	// 折線圖顯現
	myChart.setOption(object);
	// 計數歸零反應修正
	allUnSelected(myChart);
}

/* 
堆疊柱狀圖設定參數
Array datanameset		資料名稱
String title			圖標題
String stackname		堆疊名稱
Array xname				x軸資料名稱
String yname			y軸名稱
String yunit			y軸單位
*/
function StackBarChartSet(datanameset,title,stackname,xname,yname,yunit)
{
	var options = new Object();
	// 資料
	options.series = new Array();
	for(i=0 ; i<datanameset.length ; i++)
	{
		options.series[i] = new Object();
		options.series[i].name = datanameset[i];
		options.series[i].type = "bar";
		options.series[i].stack = stackname;
		options.series[i].barMaxWidth = 70;
		options.series[i].data = new Array();
		// 標籤
		options.series[i].label = new Object();
		options.series[i].label.normal = new Object();
		options.series[i].label.normal.show = true;
		options.series[i].label.normal.position = 'insideRight';
		options.series[i].label.normal.textStyle = new Object();
		options.series[i].label.normal.textStyle.color = "#000";
	}
   	// 柱狀圖標題
   	options.title = new Object();
   	options.title.textStyle = new Object();
   	options.title.textStyle.color = "#1e6e8c";
   	options.title.textStyle.fontSize = 16;	// 字體大小
   	options.title.text = title;
   	options.title.x = 'center';
   	// 圖例組件
   	options.legend = new Object();
   	options.legend.type = 'scroll';
   	options.legend.top = 'bottom';
   	options.legend.data = datanameset;
   	// x軸
   	options.xAxis = new Object();
   	options.xAxis.type = 'category';
	options.xAxis.data = xname;
	// y軸
   	options.yAxis = new Object();
	options.yAxis.name = yname + " " + yunit;
	options.yAxis.scale = true;
	options.yAxis.min = 0;
	options.yAxis.axisLabel = new Object();
	//options.yAxis.axisLabel.formatter = '{value}';
	// 格式化
	options.yAxis.axisLabel.formatter = 
	function (value, index) 
	{	// 數據超過1000
		if ( value >= 1000 )
			return (value/1000) + "k";
	    else
	    	return value;
	};
	
	
	// 提示框
	options.tooltip = new Object();
	options.tooltip.trigger = 'axis';
	options.tooltip.axisPointer = new Object();
	options.tooltip.axisPointer.animation = false;
	options.tooltip.confine = true;
	// 工具欄
	options.toolbox = new Object();
	options.toolbox.show = true;
	options.toolbox.right = '5%';
	options.toolbox.feature = new Object();
	// 區域縮放
	//options.toolbox.feature.dataZoom = new Object();
	//options.toolbox.feature.dataZoom.yAxisIndex = 'none';
	// 資料檢視
	//options.toolbox.feature.dataView = new Object();
	//options.toolbox.feature.dataView.readOnly = false;
	// 另存圖片
	options.toolbox.feature.saveAsImage = new Object();
	//
	return options;
}

/* 
計數歸零反應修正，歸零後會返回全選
Object myChart		圖表元件
*/
function allUnSelected(myChart)
{
	myChart.on('legendselectchanged', function(obj) {
		var selected = obj.selected;
		var legend = obj.name;
		if (selected != undefined)
		{	// 選擇計數
			var selectedCount = 0;
			for ( name in selected )
			{	
		    	if (!selected.hasOwnProperty(name))
		        	continue;
				if (selected[name] == true)
		        	++selectedCount;
		    }
		    
		    if ( selectedCount == 0 )
		    {	// 全選
		    	legend = [];
		    	for ( name in selected)
		    		if (selected.hasOwnProperty(name))
		        		legend.push({name: name});
				// 圖表反應
				myChart.dispatchAction({
		    	type: 'legendSelect',
		    	batch: legend
		    	});
		    }
		}
	});
}


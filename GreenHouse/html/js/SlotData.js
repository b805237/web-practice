/*
將Slot資料，放入SVG text內文中
String data			Niagara Slot資料
Object systemSet	函數相關設定。svgid：SVG ID、itemid：SVG ITEM ID
*/
function SlotData2SVG(data,systemSet)
{	
	var svgEmbed = document.getElementById(systemSet.svgid).getSVGDocument();
	var svgItem = svgEmbed.getElementById(systemSet.itemid);
	svgItem.textContent = data;
}

//改SVG Image
function Slot2SVG(data,systemSet)
{	
	var svgEmbed = document.getElementById(systemSet.svgid).getSVGDocument();
	//alert(data);
	var svgItem = svgEmbed.getElementById("areaImage");
	svgItem.setAttribute("xlink:href" ,data);

}



/*
透過Slot數值，控制SVG item 顯現或隱藏
String data			Niagara Slot資料
Object systemSet	函數相關設定。svgid：SVG ID、itemid：SVG ITEM ID
*/
function SlotVisibility2SVG(data,systemSet)
{	
	var svgEmbed = document.getElementById(systemSet.svgid).getSVGDocument();
	var svgItem = svgEmbed.getElementById(systemSet.itemid);
	// true：顯現；false：隱藏
	if ( data == "false" )
		svgItem.style.visibility = "hidden";
	else{
		svgItem.style.visibility = "visible";
	}
}

/*
將Slot資料，放入HTML text內文中
String data			Niagara Slot資料
Object systemSet	函數相關設定。htmlid：HTML ID
*/
function SlotData2HTML(data,systemSet)
{	
	document.getElementById(systemSet.htmlid).innerHTML= data;
}

/*
將Slot資料，放入HTML text內文中
String data			Niagara Slot資料
Object systemSet	函數相關設定。htmlid：HTML ID
*/
function SlotData2HTMLValue(data,systemSet)
{	
	document.getElementById(systemSet.htmlid).value= data;
	
}




/*
將Slot資料，放入SVG text內文中
功能為呈現Alarm Number。等於零，隱藏SVG：大於零，呈現數據：大於99，呈現99+
String data			Niagara Slot資料
Object systemSet	函數相關設定。svgid：SVG ID、itemid：SVG ITEM ID
*/
function SlotAlarmNumber2SVG(data,systemSet)
{	
	var svgObject = document.getElementById(systemSet.svgid);
	var svgEmbed = svgObject.getSVGDocument();
	var svgItem = svgEmbed.getElementById(systemSet.itemid);
	// 
	if ( data > 0 )
	{
		svgObject.style.visibility = "visible";
		if ( data > 99 )
			svgItem.textContent = "99+";
		else
			svgItem.textContent = paddingLeft(data,3," ");
	}
	else
		svgObject.style.visibility = "hidden";
}
//for農博暫時展示
function SlotData2HTMLGH(data,systemSet)
{	
	document.getElementById(systemSet.htmlid).innerHTML= data;
	
	
		//圖表設置
		var dataName1 = ["日照時數"];
		var system1 = new Object();
		system1.id = "container1";
		var title1 = "近七日日照時數";
		var xName1 = ""
		var yName1 = "小時";
		var yUnit1 = "";
		var markLine = document.getElementById("sun").innerHTML;
		//alert(document.getElementById("sun").innerHTML);
		system1.set = BarChartSet22(dataName1,title1,xName1,yName1,yUnit1,markLine);
		var DBSql1 = new Array();
		var sql1 = "SELECT fk_device_id as device,rawdata_date as date,value as value FROM tems_test5  where  fk_device_id = 'TestValue'  and  ( rawdata_date between '20171229' and '20180105' )  order by date";
		DBSql1.push(sql1);
		var cmdSQL2 = document.getElementById("cmd");
			cmdSQL2.value = JSON.stringify(DBSql1);
			postForJSON('/tatungService/dbCmd/queryMultiData', formToMap('formSQL'), function (ret) 
			{	
			
				//alert(JSON.stringify(ret));
				getMultiData(ret,function (status,msg,data)
				{
					if ( status == 1 )
					{	
						//alert(JSON.stringify(data));
						
						// 成功，呈現畫面
						BarChart22(data,system1);
					}
					else
					{	// 失敗
						alert("能耗查询，建置失败\n原因："+msg);
					}
				});
			});
			
		
}




function SlotDataHTMLValue2(data,systemSet)
{	
	document.getElementById(systemSet.htmlid).value = data;
	SlotData2SVG(data,systemSet);
}




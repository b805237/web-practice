// 右側看版-各欄位資料


// 看板Slot設置		
var SlotDataArray = new Array(17);
var SlotUnitArray = new Array(17);
var SlotItemArray = new Array(17);
var boardCount = 6;

// 看板項目+值+單位設置
for(var i=0 ;i<SlotDataArray.length ; i++){
	//第一區
	var system = new Object();
	var areaImage = "station:|slot:/GH/RightBar/aImage/out/value";
	SlotDataArray[i] = "station:|slot:/GH/RightBar/a"+(i+1)+"/out/value";
	system.dataname = "out";
	system.svgid = 'board-img-01';
	system.itemid = "value" + (i+1);
	var system_unit = new Object();
	SlotUnitArray[i] = "station:|slot:/GH/RightBar/a"+(i+1)+"_unit/out/value";
	system_unit.dataname = system.dataname;
	system_unit.svgid = system.svgid;
	system_unit.itemid = "unit" + (i+1);
	var system_item = new Object();
	SlotItemArray[i] = "station:|slot:/GH/RightBar/a"+(i+1)+"_item/out/value";
	system_item.dataname = system.dataname;
	system_item.svgid = system.svgid;
	system_item.itemid = "item" + (i+1);
	// 塞Slot 資料
	NiagaraSlotData(SlotDataArray[i],"SlotData2SVG",system);
	NiagaraSlotData(areaImage,"Slot2SVG",system);
	NiagaraSlotData(SlotUnitArray[i],"SlotData2SVG",system_unit);
	NiagaraSlotData(SlotItemArray[i],"SlotData2SVG",system_item);
	//第二區
	var system2 = new Object();
	var areaImage = "station:|slot:/GH/RightBar/bImage/out/value";
	SlotDataArray[i] = "station:|slot:/GH/RightBar/b"+(i+1)+"/out/value";
	system2.dataname = "out";
	system2.svgid = 'board-img-02';
	system2.itemid = "value" + (i+1);
	var system2_unit = new Object();
	SlotUnitArray[i] = "station:|slot:/GH/RightBar/b"+(i+1)+"_unit/out/value";
	system2_unit.dataname = system2.dataname;
	system2_unit.svgid = system2.svgid;
	system2_unit.itemid = "unit" + (i+1);
	var system2_item = new Object();
	SlotItemArray[i] = "station:|slot:/GH/RightBar/b"+(i+1)+"_item/out/value";
	system2_item.dataname = system2.dataname;
	system2_item.svgid = system2.svgid;
	system2_item.itemid = "item" + (i+1);
	// 塞Slot 資料
	NiagaraSlotData(SlotDataArray[i],"SlotData2SVG",system2);
	NiagaraSlotData(areaImage,"Slot2SVG",system2);
	NiagaraSlotData(SlotUnitArray[i],"SlotData2SVG",system2_unit);
	NiagaraSlotData(SlotItemArray[i],"SlotData2SVG",system2_item);
	//第三區
	var system3 = new Object();
	var areaImage = "station:|slot:/GH/RightBar/cImage/out/value";
	SlotDataArray[i] = "station:|slot:/GH/RightBar/c"+(i+1)+"/out/value";
	system3.dataname = "out";
	system3.svgid = 'board-img-03';
	system3.itemid = "value" + (i+1);
	var system3_unit = new Object();
	SlotUnitArray[i] = "station:|slot:/GH/RightBar/c"+(i+1)+"_unit/out/value";
	system3_unit.dataname = system3.dataname;
	system3_unit.svgid = system3.svgid;
	system3_unit.itemid = "unit" + (i+1);
	var system3_item = new Object();
	SlotItemArray[i] = "station:|slot:/GH/RightBar/c"+(i+1)+"_item/out/value";
	system3_item.dataname = system3.dataname;
	system3_item.svgid = system3.svgid;
	system3_item.itemid = "item" + (i+1);
	// 塞Slot 資料
	NiagaraSlotData(SlotDataArray[i],"SlotData2SVG",system3);
	NiagaraSlotData(areaImage,"Slot2SVG",system3);
	NiagaraSlotData(SlotUnitArray[i],"SlotData2SVG",system3_unit);
	NiagaraSlotData(SlotItemArray[i],"SlotData2SVG",system3_item);
	//第四區
	var system4 = new Object();
	var areaImage = "station:|slot:/GH/RightBar/dImage/out/value";
	SlotDataArray[i] = "station:|slot:/GH/RightBar/d"+(i+1)+"/out/value";
	system4.dataname = "out";
	system4.svgid = 'board-img-04';
	system4.itemid = "value" + (i+1);
	var system4_unit = new Object();
	SlotUnitArray[i] = "station:|slot:/GH/RightBar/d"+(i+1)+"_unit/out/value";
	system4_unit.dataname = system4.dataname;
	system4_unit.svgid = system4.svgid;
	system4_unit.itemid = "unit" + (i+1);
	var system4_item = new Object();
	SlotItemArray[i] = "station:|slot:/GH/RightBar/d"+(i+1)+"_item/out/value";
	system4_item.dataname = system4.dataname;
	system4_item.svgid = system4.svgid;
	system4_item.itemid = "item" + (i+1);
	// 塞Slot 資料
	NiagaraSlotData(SlotDataArray[i],"SlotData2SVG",system4);
	NiagaraSlotData(areaImage,"Slot2SVG",system4);
	NiagaraSlotData(SlotUnitArray[i],"SlotData2SVG",system4_unit);
	NiagaraSlotData(SlotItemArray[i],"SlotData2SVG",system4_item);
	//第五區
	var system5 = new Object();
	var areaImage = "station:|slot:/GH/RightBar/eImage/out/value";
	SlotDataArray[i] = "station:|slot:/GH/RightBar/e"+(i+1)+"/out/value";
	system5.dataname = "out";
	system5.svgid = 'board-img-05';
	system5.itemid = "value" + (i+1);
	var system5_unit = new Object();
	SlotUnitArray[i] = "station:|slot:/GH/RightBar/e"+(i+1)+"_unit/out/value";
	system5_unit.dataname = system5.dataname;
	system5_unit.svgid = system5.svgid;
	system5_unit.itemid = "unit" + (i+1);
	var system5_item = new Object();
	SlotItemArray[i] = "station:|slot:/GH/RightBar/e"+(i+1)+"_item/out/value";
	system5_item.dataname = system5.dataname;
	system5_item.svgid = system5.svgid;
	system5_item.itemid = "item" + (i+1);
	// 塞Slot 資料
	NiagaraSlotData(SlotDataArray[i],"SlotData2SVG",system5);
	NiagaraSlotData(areaImage,"Slot2SVG",system5);
	NiagaraSlotData(SlotUnitArray[i],"SlotData2SVG",system5_unit);
	NiagaraSlotData(SlotItemArray[i],"SlotData2SVG",system5_item);
	//第六區
	var system6 = new Object();
	var areaImage = "station:|slot:/GH/RightBar/fImage/out/value";
	SlotDataArray[i] = "station:|slot:/GH/RightBar/f"+(i+1)+"/out/value";
	system6.dataname = "out";
	system6.svgid = 'board-img-06';
	system6.itemid = "value" + (i+1);
	var system6_unit = new Object();
	SlotUnitArray[i] = "station:|slot:/GH/RightBar/f"+(i+1)+"_unit/out/value";
	system6_unit.dataname = system6.dataname;
	system6_unit.svgid = system6.svgid;
	system6_unit.itemid = "unit" + (i+1);
	var system6_item = new Object();
	SlotItemArray[i] = "station:|slot:/GH/RightBar/f"+(i+1)+"_item/out/value";
	system6_item.dataname = system6.dataname;
	system6_item.svgid = system6.svgid;
	system6_item.itemid = "item" + (i+1);
	// 塞Slot 資料
	NiagaraSlotData(SlotDataArray[i],"SlotData2SVG",system6);
	NiagaraSlotData(areaImage,"Slot2SVG",system6);
	NiagaraSlotData(SlotUnitArray[i],"SlotData2SVG",system6_unit);
	NiagaraSlotData(SlotItemArray[i],"SlotData2SVG",system6_item);
}

// 資訊看版-日期
// Slot 設定
var SlotDateArray = [	"station:|slot:/GH/YMD/out/value", 
						"station:|slot:/GH/SWD/out/value", 
						"station:|slot:/GH/AMPMS/out/value", 
						"local:|fox:|station:|slot:/GH/time/out/value"];
// SVG 欄位名稱
var SvgDateArray = [ "date", "weekday", "apm", "time" ];

// Slot讀值
for (i=0;i<SvgDateArray.length;i++)
{	
	var system1 = new Object();
		system1.dataname = "out";
		system1.svgid = 'board-img-01';
	var system2 = new Object();
		system2.dataname = "out";
		system2.svgid = 'board-img-02';
	var system3 = new Object();
		system3.dataname = "out";
		system3.svgid = 'board-img-03';
	var system4 = new Object();
		system4.dataname = "out";
		system4.svgid = 'board-img-04';
	var system5 = new Object();
		system5.dataname = "out";
		system5.svgid = 'board-img-05';
	var system6 = new Object();
		system6.dataname = "out";
		system6.svgid = 'board-img-06';
	
	system1.itemid = SvgDateArray[i];
	system2.itemid = SvgDateArray[i];
	system3.itemid = SvgDateArray[i];
	system4.itemid = SvgDateArray[i];
	system5.itemid = SvgDateArray[i];
	system6.itemid = SvgDateArray[i];
	// 塞Slot 資料
	NiagaraSlotData(SlotDateArray[i],"SlotData2SVG",system1);
	NiagaraSlotData(SlotDateArray[i],"SlotData2SVG",system2);
	NiagaraSlotData(SlotDateArray[i],"SlotData2SVG",system3);
	NiagaraSlotData(SlotDateArray[i],"SlotData2SVG",system4);
	NiagaraSlotData(SlotDateArray[i],"SlotData2SVG",system5);
	NiagaraSlotData(SlotDateArray[i],"SlotData2SVG",system6);
}

   //Topbar Alarm數量
var system5 = new Object();
system5.dataname = "out";
system5.svgid = "alarmNumber";
system5.itemid = "alarm_number";
var system6 = new Object();
system6.dataname = "out";
system6.svgid = "alarmNumber2";
system6.itemid = "alarm_number";
var deviceAlarm = new Object();
deviceAlarm.dataname = "out";
deviceAlarm.svgid = "deviceAlarm";
deviceAlarm.itemid = "test";
var limitAlarm = new Object();
limitAlarm.dataname = "out";
limitAlarm.svgid = "limitAlarm";
limitAlarm.itemid = "test";

var SlotAlarmDataArray = "station:|slot:/Services/AlarmService/GreenHouseAlarmCount/out/value";
var SlotAlarmDataArray2 = "station:|slot:/Services/AlarmService/DeviceDownAlarmCount/out/value";
//塞資料
NiagaraSlotData(SlotAlarmDataArray2, "SlotAlarmNumber2SVG",deviceAlarm);
NiagaraSlotData(SlotAlarmDataArray, "SlotAlarmNumber2SVG",limitAlarm);
NiagaraSlotData(SlotAlarmDataArray, "SlotAlarmNumber2SVG", system5);
NiagaraSlotData(SlotAlarmDataArray2, "SlotAlarmNumber2SVG", system6);

   //右側看板區域名稱設置
var nameSystem1 = new Object();
nameSystem1.dataname = "out";
nameSystem1.itemid = "areaName";
nameSystem1.svgid="board-img-01";
var nameSystem2 = new Object();
nameSystem2.dataname = "out";
nameSystem2.itemid = "areaName";
nameSystem2.svgid="board-img-02";
var nameSystem3 = new Object();
nameSystem3.dataname = "out";
nameSystem3.itemid = "areaName";
nameSystem3.svgid="board-img-03";
var nameSystem4 = new Object();
nameSystem4.dataname = "out";
nameSystem4.itemid = "areaName";
nameSystem4.svgid="board-img-04";
var nameSystem5 = new Object();
nameSystem5.dataname = "out";
nameSystem5.itemid = "areaName";
nameSystem5.svgid="board-img-05";
var nameSystem6 = new Object();
nameSystem6.dataname = "out";
nameSystem6.itemid = "areaName";
nameSystem6.svgid="board-img-06";

var areaName1 = "station:|slot:/GH/RightBar/a_areaName/out/value";
var areaName2 = "station:|slot:/GH/RightBar/b_areaName/out/value";
var areaName3 = "station:|slot:/GH/RightBar/c_areaName/out/value";
var areaName4 = "station:|slot:/GH/RightBar/d_areaName/out/value";
var areaName5 = "station:|slot:/GH/RightBar/e_areaName/out/value";
var areaName6 = "station:|slot:/GH/RightBar/f_areaName/out/value";
var areaName = ["station:|slot:/GH/RightBar/a_areaName/out/value" , "station:|slot:/GH/RightBar/b_areaName/out/value",
				"station:|slot:/GH/RightBar/c_areaName/out/value" , "station:|slot:/GH/RightBar/d_areaName/out/value",
				"station:|slot:/GH/RightBar/e_areaName/out/value" , "station:|slot:/GH/RightBar/f_areaName/out/value"];
				
NiagaraSlotData(areaName1,"SlotData2SVG",nameSystem1);
NiagaraSlotData(areaName2,"SlotData2SVG",nameSystem2);
NiagaraSlotData(areaName3,"SlotData2SVG",nameSystem3);
NiagaraSlotData(areaName4,"SlotData2SVG",nameSystem4);
NiagaraSlotData(areaName5,"SlotData2SVG",nameSystem5);
NiagaraSlotData(areaName6,"SlotData2SVG",nameSystem6);

	//即時資訊二階功能項設置
//li02
var li02_Item = new Object();
li02_Item.htmlid = "li02Temp";


var li02_01Item_n = new Object();
li02_01Item_n.dataname = "out";
li02_01Item_n.itemid = "itemName";
li02_01Item_n.svgid = "li02_01_n";
li02_01Item_n.htmlid = "li02_01Temp";
var li02_01Item_c = new Object();
li02_01Item_c.dataname = "out";
li02_01Item_c.itemid = "itemName";
li02_01Item_c.svgid = "li02_01_c";
li02_01Item_c.htmlid = "li02_01Temp";
var li02_02Item_n = new Object();
li02_02Item_n.dataname = "out";
li02_02Item_n.itemid = "itemName";
li02_02Item_n.svgid = "li02_02_n";
li02_02Item_n.htmlid = "li02_02Temp";
var li02_02Item_c = new Object();
li02_02Item_c.dataname = "out";
li02_02Item_c.itemid = "itemName";
li02_02Item_c.svgid = "li02_02_c";
li02_02Item_c.htmlid = "li02_02Temp";
var li02_03Item_n = new Object();
li02_03Item_n.dataname = "out";
li02_03Item_n.itemid = "itemName";
li02_03Item_n.svgid = "li02_03_n";
li02_03Item_n.htmlid = "li02_03Temp";
var li02_03Item_c = new Object();
li02_03Item_c.dataname = "out";
li02_03Item_c.itemid = "itemName";
li02_03Item_c.svgid = "li02_03_c";
li02_03Item_c.htmlid = "li02_03Temp";
var li02_04Item_n = new Object();
li02_04Item_n.dataname = "out";
li02_04Item_n.itemid = "itemName";
li02_04Item_n.svgid = "li02_04_n";
li02_04Item_n.htmlid = "li02_04Temp";
var li02_04Item_c = new Object();
li02_04Item_c.dataname = "out";
li02_04Item_c.itemid = "itemName";
li02_04Item_c.svgid = "li02_04_c";
li02_04Item_c.htmlid = "li02_04Temp";
var li02_05Item_n = new Object();
li02_05Item_n.dataname = "out";
li02_05Item_n.itemid = "itemName";
li02_05Item_n.svgid = "li02_05_n";
li02_05Item_n.htmlid = "li02_05Temp";
var li02_05Item_c = new Object();
li02_05Item_c.dataname = "out";
li02_05Item_c.itemid = "itemName";
li02_05Item_c.svgid = "li02_05_c";
li02_05Item_c.htmlid = "li02_05Temp";
var li02_06Item_n = new Object();
li02_06Item_n.dataname = "out";
li02_06Item_n.itemid = "itemName";
li02_06Item_n.svgid = "li02_06_n";
li02_06Item_n.htmlid = "li02_06Temp";
var li02_06Item_c = new Object();
li02_06Item_c.dataname = "out";
li02_06Item_c.itemid = "itemName";
li02_06Item_c.svgid = "li02_06_c";
li02_06Item_c.htmlid = "li02_06Temp";
	//塞資料
NiagaraSlotData(areaName1,"SlotDataHTMLValue2",li02_01Item_n);
NiagaraSlotData(areaName2,"SlotDataHTMLValue2",li02_02Item_n);
NiagaraSlotData(areaName3,"SlotDataHTMLValue2",li02_03Item_n);
NiagaraSlotData(areaName4,"SlotDataHTMLValue2",li02_04Item_n);
NiagaraSlotData(areaName5,"SlotDataHTMLValue2",li02_05Item_n);
NiagaraSlotData(areaName6,"SlotDataHTMLValue2",li02_06Item_n);
NiagaraSlotData(areaName1,"SlotDataHTMLValue2",li02_01Item_c);
NiagaraSlotData(areaName2,"SlotDataHTMLValue2",li02_02Item_c);
NiagaraSlotData(areaName3,"SlotDataHTMLValue2",li02_03Item_c);
NiagaraSlotData(areaName4,"SlotDataHTMLValue2",li02_04Item_c);
NiagaraSlotData(areaName5,"SlotDataHTMLValue2",li02_05Item_c);
NiagaraSlotData(areaName6,"SlotDataHTMLValue2",li02_06Item_c);









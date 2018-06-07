/*
將日期格式化為YYYY/MM/DD
Date date	日期
*/
function dateFormat(date)
{
	var temp = date.getFullYear() + "/" + (date.getMonth()+1) + "/" + date.getDate();
	return temp;
}

/*
下月日期，格式為YYYY/MM/DD
Date date	日期
*/
function NextMonthDate(date)
{
	var temp = date.getFullYear() + "/" + (date.getMonth()+2) + "/" + date.getDate();
	return temp;
}

/*
this 本期資料
previous 上期資料(環比)
last 上次同期資料(同比)

日環比 上一日
日同比 去年同日
月環比 上一月
月同比 去年同月

將日期傳入，回傳『環比』與『同比』日期
String date		日期
String period	周期

return	Array[{period:當期,date:日期},{period:環比,date:日期},{period:同比,date:日期}}] or Array[{period:當期,date:日期},{period:同比,date:日期}}]
*/
function datePeriodComparison(date,period)
{	
	var PeriodDate = new Array();
	switch (period)
	{
		case "day":
			// 本期資料(今天)
			var today = new Date(date);
			var temp = new Object();
			temp.period = "當期";
			temp.date = today.customFormat("#YYYY##MM##DD#");
			PeriodDate.push(temp);
			// 上期資料(上一日)
			var previous = new Date(date);
			previous.setDate(previous.getDate()-1);
			var temp = new Object();
			temp.period = "環比";
			temp.date = previous.customFormat("#YYYY##MM##DD#");
			PeriodDate.push(temp);
			// 上次同期資料(去年同天)
			var last = new Date(date);
			last.setYear(previous.getFullYear()-1);
			var temp = new Object();
			temp.period = "同比";
			temp.date = last.customFormat("#YYYY##MM##DD#");
			PeriodDate.push(temp);
		break;
		
		case "month":
			// 本期資料(本月)
			var month = new Date(date);
			var temp = new Object();
			temp.period = "當期";
			temp.date = month.customFormat("#YYYY##MM#");
			PeriodDate.push(temp);
			// 上期資料(上月)
			var previous = new Date(date);
			previous.setMonth(previous.getMonth()-1);
			var temp = new Object();
			temp.period = "環比";
			temp.date = previous.customFormat("#YYYY##MM#");
			PeriodDate.push(temp);
			// 上次同期資料(去年同月)
			var last = new Date(date);
			last.setYear(previous.getFullYear()-1);
			var temp = new Object();
			temp.period = "同比";
			temp.date = last.customFormat("#YYYY##MM#");
			PeriodDate.push(temp);
		break;
		
		case "year":
			// 本期資料(本年)
			var year = new Date(date);
			var temp = new Object();
			temp.period = "當期";
			temp.date = String(year.getFullYear());
			PeriodDate.push(temp);
			// 上期資料(上年)
			var previous = new Date(date);
			var temp = new Object();
			temp.period = "同比";
			temp.date = String(previous.getFullYear()-1);
			PeriodDate.push(temp);
		break;
	}
	
	return PeriodDate;
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

/*
Niagara時間格式轉換成millionSeconds
*/
function parseAbsTime(t)
{
	var date = t.getDate();
	var time = t.getTime();
	var string = date.getYear()+"/"+(date.getMonth().getOrdinal()+1)+"/"+date.getDay()+" "+time.getHour()+":"+time.getMinute()+":"+time.getSecond();
	return Date.parse(string);
}

/*
時間字串yyyymmdd轉換成yyyy-mm-dd
*/
function dateFoematISO(dataString)
{
	var temp = "";
	var dataLength = dataString.length;
	if ( dataLength == 8 )
		temp = dataString.substr(0,4) + "-" + dataString.substr(4,2) + "-" + dataString.substr(6,2);
	else if ( dataLength == 6 )
		temp = dataString.substr(0,4) + "-" + dataString.substr(4,2);
	else
		temp = dataString;
	return temp;
}
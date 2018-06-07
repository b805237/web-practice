// 文件載入後，啟動函數
$(document).ready(function(){ 
	// 日期＋時間
    var opt_time =
    {	// 以下為日期選擇器部分
		dayNames:["星期日","星期一","星期二","星期三","星期四","星期五","星期六"],
		dayNamesMin:["日","一","二","三","四","五","六"],
		monthNames:["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"],
		monthNamesShort:["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"],
		prevText:"上月",
		nextText:"次月",
		weekHeader:"週",
		changeMonth: true,
		changeYear: true,
		showMonthAfterYear:true,
		dateFormat:"yy/mm/dd",
		//以下為時間選擇器部分
		timeOnlyTitle:"選擇時分秒",
		timeText:"時間",
		hourText:"時",
		minuteText:"分",
		secondText:"秒",
		millisecText:"毫秒",
		timezoneText:"時區",
		currentText:"現在時間",
		closeText:"確定",
		amNames:["上午","AM","A"],
		pmNames:["下午","PM","P"],
		showSecond:true,
		timeFormat:"HH:mm:ss"
	};
	// 日期-年月日
    var opt_date =
    {	// 以下為日期選擇器部分
		dayNames:["星期日","星期一","星期二","星期三","星期四","星期五","星期六"],
		dayNamesMin:["日","一","二","三","四","五","六"],
		monthNames:["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"],
		monthNamesShort:["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"],
		prevText:"上月",
		nextText:"次月",
		weekHeader:"週",
		changeMonth: true,
		changeYear: true,
		showMonthAfterYear:true,
//		showButtonPanel: true,
		dateFormat:"yymmdd",
		closeText:"確定",
		currentText:"本日"
	};
    // 日期-年月
	var opt_month =
	{	// 以下為日期選擇器部分
		monthNames:["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"],
		monthNamesShort:["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"],
		changeMonth: true,
		changeYear: true,
		showMonthAfterYear:true,
//		showButtonPanel: true,
		dateFormat:"yymm",
		closeText:"確定",
		currentText:"本月",
		beforeShow: function(dateText, inst) { 
			var thisData = $(this).val();
			var year = thisData.slice(0,4);
			var month = thisData.slice(4,6);
			month = parseInt(month) - 1;
			$(this).datepicker('option', 'defaultDate', new Date(year, month, 1));
			$(this).datepicker('setDate', new Date(year, month, 1));
			// remove
			$(this).datepicker().focus(function() {
	        	$('.ui-datepicker-calendar').css("display", "none");		// remove day
	        	$(".ui-datepicker-prev, .ui-datepicker-next").remove();		// remove prev next
	      	});
		},
        onChangeMonthYear: function(dateText, inst) { 
            var month = $("#ui-datepicker-div .ui-datepicker-month :selected").val();
            var year = $("#ui-datepicker-div .ui-datepicker-year :selected").val();
			// 給值方式，for chrome
			month = parseInt(month) + 1;
			$(this).val((month < 10 ? year+'0'+month : year+month));
//          $(this).datepicker('setDate', new Date(year, month, 1));
		},
        onClose: function(dateText, inst) { 
            var month = $("#ui-datepicker-div .ui-datepicker-month :selected").val();
            var year = $("#ui-datepicker-div .ui-datepicker-year :selected").val();
			// 給值方式，for chrome
			month = parseInt(month) + 1;
			$(this).val((month < 10 ? year+'0'+month : year+month));
//          $(this).datepicker('setDate', new Date(year, month, 1));
		}
	};
	// 日期-年
	var opt_year =
	{	// 以下為日期選擇器部分
		changeYear: true,
		showMonthAfterYear:true,
		dateFormat:"yy",
		closeText:"確定",
		currentText:"本年度",
		beforeShow: function(dateText, inst) { 
			var year = $(this).val();
			$(this).datepicker('option', 'defaultDate', new Date(year, 0, 1));
			$(this).datepicker('setDate', new Date(year, 0, 1));
			// remove
			$(this).datepicker().focus(function() {
			        	$('.ui-datepicker-calendar').css("display", "none");		// remove day
						$(".ui-datepicker-month").hide();							// remove month
			        	$(".ui-datepicker-prev, .ui-datepicker-next").remove();		// remove prev next
	      	});
		},
        onChangeMonthYear: function(dateText, inst) { 
	        var year = $("#ui-datepicker-div .ui-datepicker-year :selected").val();
	        // 給值方式，for chrome
	        $(this).val(year);
//	       	$(this).datepicker('setDate', new Date(year, 1));
		},
        onClose: function(dateText, inst) { 
	        var year = $("#ui-datepicker-div .ui-datepicker-year :selected").val();
	        // 給值方式，for chrome
	        $(this).val(year);
//	       	$(this).datepicker('setDate', new Date(year, 1));
		}
	};
	// 物件放入設定
	CalendarSet("myTimeSection1",opt_time,"time");
    CalendarSet("myTimeSection2",opt_time,"time");
    CalendarSet("myEditTimeSection1",opt_time,"time");
    CalendarSet("myEditTimeSection2",opt_time,"time");
    
    //
	CalendarSet("myDaySection1",opt_date,"day");
  	CalendarSet("myMonthSection1",opt_month,"month");
  	CalendarSet("myYearSection1",opt_year,"year");
	CalendarSet("myDaySection2",opt_date,"day");
  	CalendarSet("myMonthSection2",opt_month,"month");
  	CalendarSet("myYearSection2",opt_year,"year");
  	
});

/*
日期設定工具，將日期工具放入已存在物件中
String id		物件ID
String opt		日期工具設定
String type		日期工具類型
*/
function CalendarSet(id,opt,type)
{	// 物件
	var elementId = document.getElementById(id);
	// 是否存在
	if ( elementId != null )
	{	// 日期工具類型
		switch (type)
		{
			case "time":
				$("#"+id).datetimepicker(opt);
			break;
			
			case "day":
				$("#"+id).datepicker(opt);
			break;
			
			case "month":
				$("#"+id).datepicker(opt);
				// remove
				$(function() {
					$("#"+id).datepicker().focus(function() {
			        	$('.ui-datepicker-calendar').css("display", "none");		// remove day
			        	$(".ui-datepicker-prev, .ui-datepicker-next").remove();		// remove prev next
			      	});
			  	});
			break;
			
			case "year":
				$("#"+id).datepicker(opt);
				// remove
				$(function() {
					$("#"+id).datepicker().focus(function() {
			        	$('.ui-datepicker-calendar').css("display", "none");		// remove day
						$(".ui-datepicker-month").hide();							// remove month
			        	$(".ui-datepicker-prev, .ui-datepicker-next").remove();		// remove prev next
			      	});
			  	});
			break;
		}
	}
}

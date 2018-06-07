
function AlarmDate(DateType)
{	
	var searchTime = parseDBFormat(DateType);
	
	//Bql language.
	var DBbsql = "alarm:/Services/AlarmService/ConsoleRecipient_PDP.routeAlarm |bql:select * where alarmClass='defaultAlarmClass'"
				 + " and timestamp " + searchTime + " order by timestamp desc";

	var tableColumn = new Array();
	var getColumn = new Array();
	var tableSource = new Array();
	var nameSource = new Array();
	var tableTemp = new Array();
	
	// Get value from Niagara
	baja.Ord.make(DBbsql).get({
		ok : function(result) {
			result.cursor({
				before : function() {
					// Get column name
					for (var i = 0; i < result["$collData"].cols.length; i++) {
						tableColumn.push(result["$collData"].cols[i].dn);
						getColumn.push(result["$collData"].cols[i].n);
					}
				},
				
				each : function() {
					// Get value from each column. 
					for (var i = 0; i < getColumn.length; i++) {
						//Change the column's value from source name of alarm data.
						if ('source' == getColumn[i]) {
							var sourcename = JSON.stringify(this.get("alarmData"));
							var jsonSource = JSON.parse(sourcename);
							tableSource.push(jsonSource.$map.$map.sourceName);
						} else {
							tableSource.push(this.get(getColumn[i]));
						}
					}
				},

				after : function() {
					// Create table tag
					var elm = document.getElementById('table');
					var table = [ '<table id="AlarmTable" class="display" cellspacing="0" width="100%">' ];

					// Create th tag
					table.push('<thead id="AlarmThead"><tr id="column">');
					for (var column = 0; column < tableColumn.length; column++) {
						table.push('<th height="0px">' + tableColumn[column] + '</th>');
					}

					table.push('</tr></thead>');
					table.push('<tbody>');

					// insert value to each tr,td.
					var number = 0;
					while( tableSource.length != 0 ) {
						//Get first value from tableSource and into temp array.
						for (var i = 0; i < getColumn.length; i++) {
							tableTemp.push(tableSource[i]);
						}
						

						var ackedCount = 0;
						var unackedCount = 0;
						var delTmp = new Array();

						//Count ack times.
						for (var check = 0; check < tableSource.length; check += getColumn.length) {
							if (tableTemp[5] == tableSource[check + 5]) {
								if (tableSource[check + 3] == 'Acked') {
									ackedCount++;
									delTmp.push(check);
								} else if (tableSource[check + 3] == 'Unacked') {
									unackedCount++;
									delTmp.push(check);
								}
							}
						}

						//Delete was checked the value avoid duplicate check.
						if (delTmp.length > 0) {
							for (var del = delTmp.length - 1　; del >= 0; del--) {
								tableSource.splice(delTmp[del],14);
							}
						}
						
						//Reset array of deleteTemp.
						delTmp.length = 0;
						
						if( unackedCount != 0 ){
							table.push('<tr id="source' + number +'">');

							//Push table
							for (var i = 0; i < getColumn.length; i++) {
								if ('timestamp' == getColumn[i] || 'normalTime' == getColumn[i]	|| 'lastUpdate' == getColumn[i]) {
									table.push('<td style="position:relative ; background:#FFFFFF;" >' + parseTime(tableTemp[i])	+ '</td>');
								} else if ('ackState' == getColumn[i]) {
									table.push('<td style="position:relative ; background:#FFFFFF;" >' + ackedCount + ' Acked / ' + unackedCount + ' Unacked');
								} else {
									table.push('<td style="position:relative ; background:#FFFFFF;" >' + tableTemp[i] + '</td>');
								}
							}
							table.push('</tr>');
						}
						number++;
						//Reset array of value temp.
						tableTemp.length = 0;
					}
					table.push('</tbody>');
					elm.innerHTML = table.join('');

		var AlarmTableModel = $('#AlarmTable').DataTable({ 
									"aaSorting": [[0,'desc']],//初始排序欄位
									"scrollY": false,
									"scrollX": true,
									"scrollY": 100,
									"paging":   false, // 分頁開關
									 "scrollCollapse": true, //垂直滚动条
									"jQueryUI": true,
									"ordering": true, //排序功能
									"bAutoWidth": false,//是否要自動欄寬
									"bLengthChange": false ,// 選擇一次顯示多少筆資料	
									"fixedHeader": true,//用戶滾動瀏覽表時，該元素將自己固定在窗口的頂部或底部
									"colReorder": true,
									'buttons': ["copy",{
																		'extend': 'csv',
																		'text': 'Csv',
																		'bom': true,
																		'filename': 'AlarmTabel',
																		'header':true, //表頭是否應包含在導出的數據中
																		'footer': false, //腳註是否應包含在導出的數據中。
																		'exportOptions': {
																		'modifier': {
																				'page': 'current',
																				'search': 'none'
																			}
																		}
																	}, "excel","print"],
									"sDom": '<"top">Jtr<"bottom"B><i"clear">',
									"responsive": true, //自動優化不同屏幕尺寸的表格佈局
									"language": {		//國際化 Chinese
														"processing":   "處理中...",
														"loadingRecords": "載入中...",
														"lengthMenu":   "顯示 _MENU_ 項結果",
														"zeroRecords":  "沒有符合的結果",
														"info":         "顯示第 _START_ 至 _END_ 項結果，共 _TOTAL_ 項",
														"infoEmpty":    "顯示第 0 至 0 項結果，共 0 項",
														"infoFiltered": "(從 _MAX_ 項結果中過濾)",
														"infoPostFix":  "",
														"search":       "模糊搜尋:",
														"paginate": {
															"first":    "第一頁",
															"previous": "上一頁",
															"next":     "下一頁",
															"last":     "最後一頁"
														},
														"aria": {
															"sortAscending":  ": 升冪排列",
															"sortDescending": ": 降冪排列"
														}
										}
								});
					 
					$(document).ready(function() {
						$(".showcol").after('<ul class="showul" style=" list-style:none;display:none; position:absolute; background:#FFFFFF; border:1px solid #ccc;  width:150px; padding-left: 0px; " >');
						for( var ColumnData =0 ; ColumnData < tableColumn.length ;  ColumnData++){
								$(".showul").append( '<li><input type="checkbox"  class="toggle-vis"  checked="checked" data-column="'+ColumnData+'">'+tableColumn[ColumnData]+'</li>' );
							};
					});
					 
					 
					 
					//欄位選取預設
					 $('input.toggle-vis').ready(
					 function () {
							AlarmTableModel.column( 1 ).visible( false );
							AlarmTableModel.column( 4).visible( false );
							AlarmTableModel.column( 7).visible( false );
							AlarmTableModel.column( 9).visible( false );
							AlarmTableModel.column( 11).visible( false );
							AlarmTableModel.column( 12).visible( false );
					 });
					 
					//欄位顯示選取單
					$('input.toggle-vis').on('click',function(e) {
						// Get the column API object
						var column = AlarmTableModel.column($(this).attr('data-column'));
						// Toggle the visibility
						column.visible(!column.visible());
					});

					$('.showcol').click(function() {
						$('.showul').toggle();
					});

					//搜尋時間下拉式選單
					$('.TimeDropDownMenuButton').click(function() {
						$('.TimeDropDownMenu').toggle();
					});
				},
			// 取值個數
			limit : 500
			});
		}
	});
}

//Conversion format of date.
function parseTime(time) {
	var date = time.getDate();
	var time = time.getTime();

	if(date.getYear() > 1970 ){
		var month = [ "一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月",
				"十月", "十一月", "十二月" ];

		var String = date.getYear() + "-" + month[date.getMonth().getOrdinal()]
				+ "-" + ('0' + date.getDay()).substr(-2) + " "
				+ ('0' + time.getHour()).substr(-2) + ":"
				+ ('0' + time.getMinute()).substr(-2) + ":"
				+ ('0' + time.getSecond()).substr(-2);
		var clock;

		if (time.getHour() < 12) {
			clock = " AM TST";
		} else {
			clock = " PM TST";
		}
		return String + clock;
	}else{
		return "null";
	}
}


//Conversion DB need format of date.
function parseDBFormat(DateType)
{
	//Get now time and format of time. EX: '2017-06-01T16:40:06.487+08:00'
	var date = new Date();
	//It's seconds of each day.
	var secDay = 86400000;
	var Time;
	
	switch(DateType){
		//Default time after 4hours.
		case 'timerange':
			var newDate = new Date(date - 14400000);
			Time = HourTime(newDate);
			break;
		
		case 'today':
			Time = OneData(date);
			break;
			
		case 'last24hours':
			var newDate = new Date(date - secDay);
			Time = HourTime(newDate);
			break;
		
		case 'yesterday':
			var newDate = new Date(date - secDay);
			Time = RangeDate(newDate,newDate);
			break;
		
		case 'weektodate':
			var newDate = new Date(date - date.getDay() * secDay);
			Time = OneData(newDate);
			break;
		
		case 'lastweek':
			var startDate = new Date((date - date.getDay() * secDay) - secDay * 7);
			var endDate = new Date((date - date.getDay() * secDay) - secDay);
			Time = RangeDate(startDate,endDate);
			break;
		
		case 'last7days':
			var newDate = new Date(date - secDay * 7);
			Time = OneData(newDate);
			break;
		
		case 'monthtodate':
			var newDate = new Date(date.getFullYear(),date.getMonth(),1);
			Time = OneData(newDate);
			break;
		
		case 'lastmonth':
			var theMonth = new Date(date.getFullYear(),date.getMonth(),1);
			var startDate = new Date(theMonth.getFullYear(), theMonth.getMonth() - 1 , 1); 
			var endDate = new Date(theMonth - secDay); 
			Time = RangeDate(startDate,endDate);
			break;
		
		case 'yeartodate':
			var newDate = new Date(date.getFullYear(),0);
			Time =  OneData(newDate);
			break;
		
		case 'lastyear':
			var theYear = new Date(date.getFullYear(),0);
			var startDate = new Date(date.getFullYear() -1,0); 
			var endDate = new Date(theYear - 1); 
			Time = RangeDate(startDate,endDate);
			break;
	}
 	return Time;
}

//For default and last 24 hours 
function HourTime(newDate){
	var condition = " >= '"  + newDate.getFullYear() + "-" + ('0'+ (newDate.getMonth() + 1 )).substr(-2) + "-" + ('0' + newDate.getDate()).substr(-2) 
							 + "T" + ('0' + newDate.getHours()).substr(-2) + ":" + ('0' + newDate.getMinutes()).substr(-2) + ":" 
							 + ('0' + newDate.getSeconds()).substr(-2) + '.' + ('00' + newDate.getMilliseconds()).substr(-3) + "+08:00'";
	return condition;
}

//For begin some day to today.
function OneData(date){
	var condition = " >= '"  + date.getFullYear() + "-" + ('0'+ (date.getMonth() + 1 )).substr(-2) + "-" + ('0' + date.getDate()).substr(-2) 
							 + "T00:00:00.000+08:00'";
	return condition;
}

//For use a range times.
function RangeDate(startDate,endDate){
	var condition = " >= '"  + startDate.getFullYear() + "-" + ('0'+ (startDate.getMonth() + 1 )).substr(-2) + "-" + ('0' + startDate.getDate()).substr(-2) 
							 + "T00:00:00.000+08:00' and timestamp <= '" + endDate.getFullYear() + "-" + ('0'+ (endDate.getMonth() + 1 )).substr(-2) + "-" + ('0' 
							 + endDate.getDate()).substr(-2) + "T23:59:59.999+08:00'";
	return condition;
}
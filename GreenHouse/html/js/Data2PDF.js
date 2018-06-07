/*
輸出PDF功能
Array PDFcontent	PDF列印內文
String FileName		檔案名稱
*/
function PDFObject(PDFcontent,FileName)
{	// 處理視窗
	OpenLoading();
	// 中文字體設定
	pdfMake.fonts = new Object();
	pdfMake.fonts.kaiu = new Object();
	pdfMake.fonts.kaiu.normal = 'kaiu.ttf';
	pdfMake.fonts.kaiu.bold = 'kaiu.ttf';
	pdfMake.fonts.kaiu.italics = 'kaiu.ttf';
	pdfMake.fonts.kaiu.bolditalics = 'kaiu.ttf';
	// 列印內容設定
	var docDefinition = new Object();
	// 內文，需排版
	docDefinition.content = PDFcontent;
	// 內文表格設定
	docDefinition.styles = new Object();
	docDefinition.styles.tableExample = new Object();
	docDefinition.styles.tableExample.margin = [0, 5, 0, 15];
	docDefinition.styles.tableExample.fontSize = 14;
	docDefinition.styles.tableExample.color = '#444';
	docDefinition.styles.tableHeader = new Object();
	docDefinition.styles.tableHeader.bold = true;
	docDefinition.styles.tableHeader.fontSize = 14;
	docDefinition.styles.tableHeader.color = 'black';
	// 內文字型設定
	docDefinition.defaultStyle = new Object();
	docDefinition.defaultStyle.font = 'kaiu';
	// 列印紙張、方向設定
	docDefinition.pageSize = 'A4';
	docDefinition.pageOrientation = 'portrait';
	// Generate a file name
    var MyFileName = "MyReport_";
    // this will remove the blank-spaces from the title and replace it with an underscore
    MyFileName += FileName.replace(/ /g,"_");
    // download the PDF
	pdfMake.createPdf(docDefinition).download(MyFileName + ".pdf");
	// 結束處理視窗
	CloseLoading();
}
/*
DataGroup轉換成PDF
Array DBbsqlArray		Niagara DB名稱＆bql array
Array DataNameArray		資料名稱
String FileName			檔案名稱
*/
function DataGroup2Pdf(DBbsqlArray,DataNameArray,FileName)
{
	// datagroup = Array[][][]
	// dataset = Array[data]
	// data = [時間,數值]
	
	// 多數據處理
	var datagroup = new Array();
	var dataset = new Array();
	// 處理視窗
	OpenLoading();
	// 迴圈，處理資料
	for (i=0;i<DBbsqlArray.length;i++)
	{	
		//alert(DBbsqlArray[i]);
		//alert(DataNameArray[i]);
		baja.Ord.make(DBbsqlArray[i]).get({
			ok: function (result){
				result.cursor({
				    before: function (){
				      	// 取值後，初始化
						dataset = new Array();
				    },
				    each: function (){
				      	// 取值，Called for each item in the Cursor...
						var time = this.get("timestamp");
				      	var value = this.get("value");
						var data = new Array();
						data.push(parseAbsTime(time));
						data.push(parseFloat(value).toFixed(2));
						//
						dataset.push(data);
				    },
					after: function () {
						// 取完值後，放入datagroup
						datagroup.push(dataset);
						if (i == datagroup.length)
						{	// 單一資料筆數,93
							var DataNumber = datagroup[0].length-1;
							// 表格列數、行數
							var TableRow = 12;
							var TableColumn = datagroup.length;
							// 初始化資料
							var InputDataNumber = 0;
							var TableNumber = 0;
							var RowStart = 0;
							var RowEnd = 0;
							// 表格內文
							var content = new Array();
							while (RowEnd < DataNumber)
							{
								content[TableNumber] = new Object();
								// 換頁功能
								// content[TableNumber].pageBreak = 'before';
								content[TableNumber].style = "tableExample";
								content[TableNumber].table = new Object();
								// content[TableNumber].table.headerRows = 1;
								content[TableNumber].table.body = new Array();
								// 列數起始值
								RowStart = RowEnd;
								// 第零列第一行，日期
								content[TableNumber].table.body[0] = new Array();
								var BodyTemp = new Object();
								BodyTemp.style = 'tableHeader';
								BodyTemp.text = millionSeconds2Date(datagroup[0][RowEnd][0],"date");
								content[TableNumber].table.body[0].push(BodyTemp);
								// 第零列，時間
								var TableRowTemp = 0;
								var LastTimeTemp = new Date(datagroup[0][RowEnd][0]);
								while (TableRowTemp < TableRow)
								{
									var TimeTemp = new Date(datagroup[0][RowEnd][0]);
									// 同天不換Table，不同天強迫換Table，結束強迫換Table
									if ( (LastTimeTemp.getDate() == TimeTemp.getDate()) && (RowEnd < DataNumber))
									{	// 同天不換Table
										BodyTemp = new Object();
										BodyTemp.style = 'tableHeader';
										BodyTemp.text = millionSeconds2Date(datagroup[0][RowEnd][0],"time");
										//
										content[TableNumber].table.body[0].push(BodyTemp);
										LastTimeTemp = new Date(datagroup[0][RowEnd][0]);
										TableRowTemp++;
										RowEnd++;
									}
									else
									{	// 不同天強迫換Table，結束強迫換Table
										TableRowTemp = TableRow;
									}
								}
								// 資料
								for(c=0;c < DataNameArray.length;c++)
								{	// 資料名稱
									content[TableNumber].table.body[c+1] = new Array();
									content[TableNumber].table.body[c+1].push(DB_name[DataNameArray[c]]);
									for (b = RowStart; b < RowEnd; b++)
									{	// 資料數值
										content[TableNumber].table.body[c+1].push(datagroup[c][b][1]);
									}
								}
								TableNumber++;
							}
							// 產生PDF
							PDFObject(content,FileName);
							// 結束處理視窗
							CloseLoading();
						}
					},
					// 取值個數
		    		limit: 10000
	    		});
	    	}
		});
	}
}
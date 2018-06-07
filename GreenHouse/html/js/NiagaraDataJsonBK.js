/*
透過Niagara讀取資料庫，並將資料轉換成Json格式
StringArray DBSql	Niagara內部資料庫bql語法、外部資料庫sql語法
String FunName		呼叫之函數名稱、將data用Json傳入處理
Object FunSet		呼叫之函數相關設定，請用Object儲存傳入函數處理

注意：baja.Ord.make在處理外部資料庫多筆查詢時，資料傳遞為非同步，回傳資料順序會亂。
解決方式：會先比對result中所帶的查詢參數，得到serial numbers，按照順序將資料放入json中
*/
function NiagaraDataJson(DBSql,FunName,FunSet)
{	// 資料
	var data = new Array();
	var column;
	var columnName;
	var columnType;
	var serialNumber;
	var rowNumber = 0;
	var pushNumber = 0;
	// 迴圈，處理資料
	for (i=0;i<DBSql.length;i++)
	{	// Niagara取值
		baja.Ord.make(DBSql[i]).get({
			ok: function (result){
				result.cursor({
				    before: function (){
				    	// 取值前，初始化row個數
				    	rowNumber = 0;
						// 取值前，初始化column
						column = new Array();
						columnName = new Array();
						columnType = new Array();
						// result的查詢參數
						var resultRequest = result.$tableData.req.o;
						// 比對DBSql，取得serial numbers
						for (a=0;a<DBSql.length;a++)
						{
							if ( DBSql[a] == resultRequest )
							{
								serialNumber = a;
								break;
							}
						}
						// 取得資料的columns name and type
						baja.iterate(result.getColumns(), function (c){
							columnName.push(c.getName());
							columnType.push(c.getType());
						});
				    },
				    each: function (){
				      	// 取值，Called for each item in the Cursor...
				      	var row = new Object();
				      	rowNumber++;
				      	row.no = rowNumber;
				      	for (j=0;j<result.getColumns().length;j++)
				      	{
				      		if (columnType[j] == "baja:AbsTime")
				      			row[columnName[j]] = parseAbsTime(this.get(columnName[j]));
				      		else
				      			row[columnName[j]] = this.get(columnName[j]);
				      	}
						//
				      	column.push(row);
				    },
					after: function (){
						data[serialNumber] = column;
						pushNumber++;
						if (DBSql.length == pushNumber)
						{	// 輸出JSON
							//baja.outln(JSON.stringify(data));
							// 將資料傳入函數中處理
							window[FunName](data,FunSet);
						}
					},
					// 取值個數
		    		limit: 1000
	    		});
	    	}
		});
	}
}

/*
讀取Niagara中Slot的數值，並依相關函數處理數值
String Slot			Niagara內部slot位置
String FunName		呼叫之函數名稱
Object FunSet		呼叫之函數相關設定，請用Object儲存傳入函數處理。FunSet.dataname為要讀出的資料
*/
function NiagaraSlotData(Slot,FunName,FunSet)
{
	baja.started(function() {
		var sub = new baja.Subscriber();
		// 數值改變時會讀值
		sub.attach("changed", function(prop, cx) {
			// 讀值資料名稱
        	var name = prop.getName();
        	// 初始值(proxyExt) OR 輸出資料(out)才會輸出
 			if ( ( name == "proxyExt" ) || ( name == FunSet.dataname ) )
 			{	// 資料為value + " " + {ok}
 				var valueString = this.getOutDisplay();
 				var dataArray = new Array();
 				dataArray = valueString.split(" ");
				window[FunName](dataArray[0],FunSet);
			}
		});
		baja.Ord.make(Slot).get({subscriber: sub});
	})
}

/*
test
*/

function NiagaraDataChange(DBSql)
{	// 資料
	baja.outln(JSON.stringify(DBSql));

	baja.Ord.make(DBSql).get({
	
	ok: function (result) {
		// Iterate through all of the Columns
			baja.iterate(result.getColumns(), function (c) {
				baja.outln("Column display name: " + c.getDisplayName());
			});
		},
	cursor: {
		before: function () {
			//baja.outln(this.get("fk_chart_id"));
	    	},
	    after: function () {
			//baja.outln("Called just after iterating through the Cursor");
	    	},
	    each: function () {
			baja.outln(this.get("fk_chart_id"));
	    	},
	    limit: 15 // Specify optional limit on the number of records (defaults to 10)
		}
	});

}
/*
JSON轉換成CSV

原始程式 		http://jsfiddle.net/hybrid13i/JXrwM/
視窗切換		https://code.ciphertrick.com/2014/12/07/download-json-data-in-csv-format-cross-browser-support/
ie10開啟方式	http://www.cnblogs.com/dojo-lzz/p/4837041.html

Array JSONData			資料，格式要為[{object1},{object2},...]
String ReportTitle		文件標題
Boolean ShowLabel
Object LabelTitle		資料標籤
*/
function JSONToCSVConvertor(JSONData, ReportTitle, ShowLabel, LabelTitle) {
    //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
    var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
    
    var CSV = '';    
    //Set Report title in first row or line
    
    CSV += ReportTitle + '\r\n\n';

    //This condition will generate the Label/Header
    if (ShowLabel) {
        var row = "";
        
        //This loop will extract the label from 1st index of on array
        for (var index in arrData[0]) {
			//Now convert each value to string and comma-seprated
            if ( LabelTitle[index] != null)
            	row += LabelTitle[index] + ',';
            else
            	row += index + ',';
        }

        row = row.slice(0, -1);
        
        //append Label row with line break
        CSV += row + '\r\n';
    }
    
    //1st loop is to extract each row
    for (var i = 0; i < arrData.length; i++) {
        var row = "";
        
        //2nd loop will extract each column and convert it in string comma-seprated
        for (var index in arrData[i]) {
            row += '"' + arrData[i][index] + '",';
        }

        row.slice(0, row.length - 1);
        
        //add a line break after each row
        CSV += row + '\r\n';
    }

    if (CSV == '') {
        alert("Invalid data");
        return;
    }
    
    //Generate a file name
    var fileName = "MyReport_";
    //this will remove the blank-spaces from the title and replace it with an underscore
    fileName += ReportTitle.replace(/ /g,"_");
    
    if(msieversion())
    {	// IE
    	var BOM = "\uFEFF";
	    var csvData = new Blob([BOM + CSV], { type: 'text/csv' });
	    navigator.msSaveBlob(csvData, fileName + ".csv");
	} 
	else
	{	// Firebox
		// Initialize file format you want csv or xls
		var BOM = "\uFEFF";
	    var uri = 'data:text/csv;charset=utf-8,' + BOM + encodeURIComponent(CSV);
	    // Now the little tricky part.
	    // you can use either>> window.open(uri);
	    // but this will not work in some browsers
	    // or you will not get the correct file extension
	    //this trick will generate a temp <a /> tag
	    var link = document.createElement("a");
	    link.href = uri;
	    //set the visibility hidden so it will not effect on your web-layout
	    link.style = "visibility:hidden";
	    link.download = fileName + ".csv";
	    //this part will append the anchor tag and remove it after automatic click
	    document.body.appendChild(link);
	    link.click();
	    document.body.removeChild(link);
	}
}

// 判斷瀏覽器種類
function msieversion() {
	var ua = window.navigator.userAgent; 
	var msie = ua.indexOf("MSIE"); 
	if (msie != -1 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) // If Internet Explorer, return version number 
	{
		return true;
	} else { // If another browser, 
		return false;
	}
	return false; 
}
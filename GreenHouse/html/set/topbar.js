// topbar網頁聯結設定
//-------------------------------------------------------------------------------------------------------------------------------------
/*
menu01
	li01(btn01)
		menu02
			li01_01(btn01_01)
			li01_02(btn01_02)
				menu03
					li01_02_01(btn01_01_01)
					li01_02_02(btn01_01_02)
	li02(btn02)
		menu02
			li02_01(btn02_01)
			li02_02(btn02_02)
				menu03
					li02_01_01(btn02_01_01)
					li02_01_02(btn02_01_02)
			li02_02(btn02_02)				
	li03(btn03)		
*/
// Server IP
var ip = location.host;
// Project Location
var project = '/ord/file:^GreenHouse/html/';
var projectPX = '/ord/file:^GreenHouse/px/';
var projectEn = '/ord/file:^GreenHouse/htmlEn/';
var projectEnPX = '/ord/file:^GreenHouse/px/';
var totalMenuLv = 3;
var lastHash;
function menuInit() {

	// 透過genToolBar.js產生menuStr
	//var menuStr = '[{"xtype":"hyperLink","mainContentUrl":"/ord/file:^TSHS/px/RI/A4_2F/A4_2F.px","children":[]},{"xtype":"menuItem","mainContentUrl":"#li02_01","children":[{"xtype":"menuItem","mainContentUrl":"/ord/file:^TSHS/html/Consumption1Main.html","children":[]},{"xtype":"menuItem","mainContentUrl":"/ord/file:^TSHS/html/Consumption3Main.html","children":[]},{"xtype":"menuItem","mainContentUrl":"/ord/file:^TSHS/html/Consumption4Main.html","children":[]}]},{"xtype":"menuItem","mainContentUrl":"/ord/file:^TSHS/html/RawdataMain.html","children":[]},{"xtype":"hyperLink","mainContentUrl":"/ord/file:^TSHS/px/FS/UM/UM.px","children":[]},{"xtype":"hyperLink","mainContentUrl":"/ord/file:^TSHS/px/schedule/AirCondition/AC_A4_2F.px","children":[]},{"xtype":"hyperLink","mainContentUrl":"/ord/file:^TSHS/px/RbConnectAbnormal/RCA.px","children":[]},{"xtype":"hyperLink","mainContentUrl":"/ord/file:^TSHS/px/MT/MT.px","children":[]}]';
	var menuList = getMenuList();

	var menuUl01 = $('#menu01');

	// 建立MENU物件
	if (menuList.length != 0) {
		for (var i = 0; i < menuList.length; i++) {

			var menuData = menuList[i];
			var itemIdx = padLeft(((i + 1) + ''), 2, '0');

			var mLi = $(document.createElement('li')).attr('id', 'li' + itemIdx).data(menuData);
			var mA = $(document.createElement('a')).attr('href', '#');
			var mImg = $(document.createElement('img')).attr('src', project + 'images/menu/btn' + itemIdx + '_normal.svg');
			mLi.append(mA.append(mImg));
			menuUl01.append(mLi);

			// 註冊點擊事件
			mLi.click(function () {
				menuOnClick($(this));
				return false;	//保留#hash
			});
		}
		// home and logout
		var elementIdHref = new Object();
		
		elementIdHref["0"] = project + "Main.html#li01";
		elementIdHref["home"] = project + "Main.html#li01";
		elementIdHref["chinese"] = project + "Main.html#li01";
		elementIdHref["english"] = projectEn + "Main.html#li01";
		
		elementIdHref["out"] = "http://" + location.host + "/logout";
		for (var key in elementIdHref) {
			var elementId = document.getElementById(key);
			if (elementId != null)
				elementId.href = elementIdHref[key]
		}
		// hash為空白，會自動轉至首頁
		if( window.location.hash == null || window.location.hash == "" )
			window.location.hash = "#li01";
		
		// 載入時如有hash則點選之。EX：#li01_01
		if ("onhashchange" in window) {
			createCascadeMenu(window.location.hash.substring(1));
			lastHash = window.location.hash.substring(1);
		}

		// 當hash值變更時，根據hash值建立MenuItem
		window.onhashchange = function () {
			document.body.scrollTop = 0;
			currentHash = window.location.hash.substring(1);
			if (lastHash != currentHash)
				createCascadeMenu(currentHash);
			lastHash = currentHash;
		}
	}
}

// 註冊點選menuItem事件
function menuOnClick(mLi) {
	var xtype = mLi.data().xtype;
	if (xtype === 'hyperLink') {	// redirect
		window.location.href = mLi.data().mainContentUrl;
	}
	else if (xtype === 'menuItem') {

		if (!isEmpy(mLi.data().mainContentUrl)) {

			// 修改hash觸發onhashchange
			var url = mLi.data().mainContentUrl;
			if ('#' == url.substr(0, 1))
				window.location.hash = url.substr(1);
			else
				window.location.hash = mLi.attr('id');
		}
	}
}

// 根據id連動建立MenuItem
function createCascadeMenu(li) {
	if ( li == "home")
	{	// 載入MainContent，iframe不可影響上下頁歷史紀錄故使用location.replace
		document.getElementById('iframe01').contentWindow.location.replace(project + 'Dashboard.html');
		document.getElementById('iframe01').height = "555";
		// MainContent滾動條隱藏
		document.getElementById('iframe01').scrolling = "no";
		//document.getElementById('iframe01').setAttribute('scrolling', 'no');
		// side-bar隱藏
		document.getElementById('side-bar').style.display = "none";
		// Board高度與Style
		document.getElementById("board-body").setAttribute("style", "margin-top:5px;");
		// 將與mLi同階的所有Btn Image Reset
		var mLi = $('#li01');
		var images = mLi.parent().find('img');
		for (var m = 0; m < images.length; m++) {
			$(images[m]).attr('src', $(images[m]).attr('src').replace('click', 'normal'));
		}
	}
	
	else
	{
		var liArray = li.split('_');	//["li02", "01"]
		for (var i = 0; i < liArray.length; i++) {
			if (i == 0) {
				liName = liArray[i];
			} else {
				liName += "_" + liArray[i]
			}
			var mLi = $('#' + liName);
			createMenuItem(mLi);
		}
		
		
		
		// 載入MainContent，iframe不可影響上下頁歷史紀錄故使用location.replace
		document.getElementById('iframe01').contentWindow.location.replace($('#' + li).data().mainContentUrl);
		// side-bar呈現
		if(li == "li01"){
			//document.getElementById('side-bar').style.display = "none";
			document.getElementById('Test').style.height = "0"
			document.getElementById("board-body").setAttribute("style", "margin-top:1px;");
			document.getElementById('iframe01').height = "555";
			document.getElementById('iframe01').width = "999";
		}else{
			//document.getElementById('side-bar').style.display = "";
			document.getElementById('Test').style.height = "32"
			// Board高度與Style
			document.getElementById("board-body").setAttribute("style", "margin-top:-5px;");
			// 載入MainContent高度
			document.getElementById('iframe01').height = "600";
			document.getElementById('iframe01').width = "1000";
			
		}
		//二階功能項位置由已選取之一階功能向下延伸
		switch (li)
		{	// 呈現
			case "li02_01":
			case "li02_02":
			case "li02_03":
			case "li02_04":
			case "li02_05":
			case "li02_06":
				//alert(li);
				document.getElementById('menu02d').className = "li02-btn";
				
				//alert(document.getElementById('menu02d').className);
				break;
				
			case "li03_01":
			case "li03_02":
			case "li03_03":
			case "li03_04":
			case "li03_05":
			case "li03_06":
			case "li03_07":
			case "li03_08":
				//alert(li);
				document.getElementById('menu02d').className = "li03-btn";
				//alert(document.getElementById('menu02d').className);
				break;
			case "li06_01":
			case "li06_02":
			case "li06_03":
			case "li06_04":
			case "li06_05":
				//alert(li);
				document.getElementById('menu02d').className = "li06-btn";
				//alert(document.getElementById('menu02d').className);
				break;
			case "li07_01":
			case "li07_02":
			case "li07_03":
				//alert(li);
				document.getElementById('menu02d').className = "li07-btn";
				//alert(document.getElementById('menu02d').className);
				break;
			
			default:
				document.getElementById('menu02d').style.display = "";
		}
		
		switch (li)
		{	// 呈現
			case "li02_01":
			case "li02_02":
			case "li02_03":
			case "li02_04":
			case "li02_05":
			case "li02_06":

				refresh_li02(li);
				break;
			default:
				document.getElementById("li02_01_n").style.visibility="hidden";
				document.getElementById("li02_01_c").style.visibility="hidden";
				document.getElementById("li02_02_n").style.visibility="hidden";
				document.getElementById("li02_02_c").style.visibility="hidden";
				document.getElementById("li02_03_n").style.visibility="hidden";
				document.getElementById("li02_03_c").style.visibility="hidden";
				document.getElementById("li02_04_n").style.visibility="hidden";
				document.getElementById("li02_04_c").style.visibility="hidden";
				document.getElementById("li02_05_n").style.visibility="hidden";
				document.getElementById("li02_05_c").style.visibility="hidden";
				document.getElementById("li02_06_n").style.visibility="hidden";
				document.getElementById("li02_06_c").style.visibility="hidden";
		}
				
	}
}
//把Main.html的input元件Value塞進svg
function refresh_li02(li){
	
	
	setli02(li);
	var svgEmbedArray = [document.getElementById("li02_01_n").getSVGDocument() , document.getElementById("li02_01_c").getSVGDocument(),
						 document.getElementById("li02_02_n").getSVGDocument() , document.getElementById("li02_02_c").getSVGDocument(),
						 document.getElementById("li02_03_n").getSVGDocument() , document.getElementById("li02_03_c").getSVGDocument(),
						 document.getElementById("li02_04_n").getSVGDocument() , document.getElementById("li02_04_c").getSVGDocument(),
						 document.getElementById("li02_05_n").getSVGDocument() , document.getElementById("li02_05_c").getSVGDocument(),
						 document.getElementById("li02_06_n").getSVGDocument() , document.getElementById("li02_06_c").getSVGDocument()];
	var svgItemArray = new Array();
	for(var i=0; i<svgEmbedArray.length ;i++){
		svgItemArray[i] = svgEmbedArray[i].getElementById("itemName");
		switch(i){
			case 0:
			case 1:
				svgItemArray[i].textContent =  document.getElementById("li02_01Temp").value;
				break;
			case 2:
			case 3:
				svgItemArray[i].textContent =  document.getElementById("li02_02Temp").value;
				break;
			case 4:
			case 5:
				svgItemArray[i].textContent =  document.getElementById("li02_03Temp").value;
				break;
			case 6:
			case 7:
				svgItemArray[i].textContent =  document.getElementById("li02_04Temp").value;
				break;
			case 8:
			case 9:
				svgItemArray[i].textContent =  document.getElementById("li02_05Temp").value;
				break;
			case 10:
			case 11:
				svgItemArray[i].textContent =  document.getElementById("li02_06Temp").value;
				break;
		}
	}
}
//切回li02時顯示Click按鈕
function setli02(li_click){

	document.getElementById("li02_01_n").style.visibility="visible";
	document.getElementById("li02_02_n").style.visibility="visible";
	document.getElementById("li02_03_n").style.visibility="visible";
	document.getElementById("li02_04_n").style.visibility="visible";
	document.getElementById("li02_05_n").style.visibility="visible";
	document.getElementById("li02_06_n").style.visibility="visible";
	document.getElementById("li02_01_c").style.visibility="hidden";
	document.getElementById("li02_02_c").style.visibility="hidden";
	document.getElementById("li02_03_c").style.visibility="hidden";
	document.getElementById("li02_04_c").style.visibility="hidden";
	document.getElementById("li02_05_c").style.visibility="hidden";
	document.getElementById("li02_06_c").style.visibility="hidden";
	document.getElementById(li_click+"_c").style.visibility="visible";
	document.getElementById(li_click+"_n").style.visibility="hidden";

}
function createMenuItem(mLi) {
	var currentMenuLv = parseInt(mLi.parent().attr('id').substr(4, 6));	// 點擊的menuItem階層
	var currentMenuIdx = parseInt(mLi.attr('id').substr(mLi.attr('id').length - 2, mLi.attr('id').length));	//  倒數兩個字元為idx

	// 將與mLi同階的所有Btn Image Reset
	var images = mLi.parent().find('img');
	for (var m = 0; m < images.length; m++) {
		$(images[m]).attr('src', $(images[m]).attr('src').replace('click', 'normal'));
	}

	// 將自己的Btn Img設為click
	mLi.find('img').attr('src', mLi.find('img').attr('src').replace('normal', 'click'));
	
	// mainContentUrl路徑呈現
	var url = mLi.data().mainContentUrl
	url = url.substring(5);
	document.getElementById( "url-text" ).innerHTML = url;

	// 清除其下現有各層child menuItem
	for (var m = currentMenuLv + 1; m <= totalMenuLv; m++) {
		$('#menu' + padLeft((m + ''), 2, '0')).empty();
	}

	// 建立children物件
	var children = mLi.data().children;
	if (children.length != 0) {
		var childMeunUl = $('#menu' + padLeft(((currentMenuLv + 1) + ''), 2, '0'));
		// 切換sidebar2(id=menu03Style)格式
		//
		for (var i = 0; i < children.length; i++) {
			var menuData = children[i];
			var itemId = mLi.attr('id') + '_' + padLeft(((i + 1) + ''), 2, '0');
			var cmLi = $(document.createElement('li')).attr('id', itemId).data(menuData);
			var cmA = $(document.createElement('a')).attr('href', '#');
			//var cmImg = $(document.createElement('img')).attr('src', project + 'images/menu/' + itemId.replace('li', 'btn') + '_normal.svg');
			var cmImg = $(document.createElement('img'));
			cmImg.attr('src', project + 'images/menu/' + itemId.replace('li', 'btn') + '_normal.svg');
		//	cmImg.attr('height', '25');
		//	cmImg.attr('width', '99');
			
			cmLi.append(cmA.append(cmImg));
			childMeunUl.append(cmLi);
			
			// 註冊點擊事件
			cmLi.click(function () {
				menuOnClick($(this));
				return false;
			});
		}
	}
}


function getMenuList() {

	var items = [];
	// Li01
	var li01 = {};
	li01.xtype = 'menuItem';
	li01.mainContentUrl = project + 'Dashboard.html';
	li01.children = [];
	items.push(li01);
	// Li02
	var li02 = {};
	var li02Children = [];
	li02.xtype = 'menuItem';
	li02.mainContentUrl = '#li02_01';
	li02.children = li02Children;
	{	// Li02_01
		var li02_01 = {};
		li02_01.xtype = 'menuItem';
		li02_01.mainContentUrl = project + 'Monitor_a.html';
		li02_01.children = [];
		li02Children.push(li02_01);
		// Li02_02
		var li02_02 = {};
		li02_02.xtype = 'menuItem';
		li02_02.mainContentUrl = project + 'Monitor_b.html';
		li02_02.children = [];
		li02Children.push(li02_02);
		
		var li02_03 = {};
		li02_03.xtype = 'menuItem';
		li02_03.mainContentUrl =  project + 'Monitor_c.html';
		li02_03.children = [];
		li02Children.push(li02_03);
		
		var li02_04 = {};
		li02_04.xtype = 'menuItem';
		li02_04.mainContentUrl = project + 'Monitor_d.html';
		li02_04.children = [];
		li02Children.push(li02_04);
		
		var li02_05 = {};
		li02_05.xtype = 'menuItem';
		li02_05.mainContentUrl = project + 'Monitor_e.html';
		li02_05.children = [];
		li02Children.push(li02_05);
		
		var li02_06 = {};
		li02_06.xtype = 'menuItem';
		li02_06.mainContentUrl = project + 'Monitor_f.html';
		li02_06.children = [];
		li02Children.push(li02_06);
	}
	items.push(li02);
	// Li03
	var li03 = {};
	var li03Children = [];
	li03.xtype = 'menuItem';
	li03.mainContentUrl = '#li03_01';
	li03.children = li03Children;
	{	// Li03_01
		var li03_01 = {};
		li03_01.xtype = 'menuItem';
		li03_01.mainContentUrl = projectPX + 'b/Control_S_1_Main.px';
		li03_01.children = [];
		li03Children.push(li03_01);
		
		var li03_02 = {};
		li03_02.xtype = 'menuItem';
		li03_02.mainContentUrl = projectPX + 'b/Control_S_2_Main.px';
		li03_02.children = [];
		li03Children.push(li03_02);
		
		var li03_03 = {};
		li03_03.xtype = 'menuItem';
		li03_03.mainContentUrl = projectPX + 'b/Control_S_3_Main.px';
		li03_03.children = [];
		li03Children.push(li03_03);
		
		var li03_04 = {};
		li03_04.xtype = 'menuItem';
		li03_04.mainContentUrl = projectPX + 'b/Control_S_4_Main1.px';
		li03_04.children = [];
		li03Children.push(li03_04);
		
		
		var li03_05 = {};
		li03_05.xtype = 'menuItem';
		li03_05.mainContentUrl = projectPX + 'b/Control_S_5_Main1.px';
		li03_05.children = [];
		li03Children.push(li03_05);
		
		var li03_06 = {};
		li03_06.xtype = 'menuItem';
		li03_06.mainContentUrl = projectPX + 'b/Control_S_6_Main1.px';
		li03_06.children = [];
		li03Children.push(li03_06);
	}
	items.push(li03);
	// Li04
	var li04 = {};
	li04.children = [];
	li04.xtype = 'menuItem';
	li04.mainContentUrl = project + 'Rawdata.html';
	items.push(li04);
	// Li05
	var li05 = {};
	li05.children = [];
	li05.xtype = 'menuItem';
	li05.mainContentUrl = project + 'Consumption.html';
	items.push(li05);
	
	// Li06
	var li06 = {};
	var li06Children = [];
	li06.xtype = 'menuItem';
	li06.mainContentUrl = '#li06_01';
	li06.children = li06Children;
	{	// li06_01
		var li06_01 = {};
		li06_01.xtype = 'menuItem';
		li06_01.mainContentUrl = projectPX + 'g/DeviceList.px';
		li06_01.children = [];
		li06Children.push(li06_01);
	
		var li06_02 = {};
		li06_02.xtype = 'menuItem';
		li06_02.mainContentUrl = projectPX + 'g/RightBarSet.px';
		li06_02.children = [];
		li06Children.push(li06_02);
		
		var li06_03 = {};
		li06_03.xtype = 'menuItem';
		li06_03.mainContentUrl = projectPX + 'g/G1_main.px';
		li06_03.children = [];
		li06Children.push(li06_03);
		
		var li06_04 = {};
		li06_04.xtype = 'menuItem';
		li06_04.mainContentUrl = projectPX + 'g/G2_main.px';
		li06_04.children = [];
		li06Children.push(li06_04);
		
		var li06_05 = {};
		li06_05.xtype = 'menuItem';
		li06_05.mainContentUrl = projectPX + 'g/G3_main.px';
		li06_05.children = [];
		li06Children.push(li06_05);
	}
	items.push(li06);
	// Li07
	var li07 = {};
	var li07Children = [];
	li07.xtype = 'menuItem';
	li07.mainContentUrl = '#li07_01';
	li07.children = li07Children;
	{	
		var li07_01 = {};
		li07_01.xtype = 'menuItem';
		li07_01.mainContentUrl = project + 'AlarmMain2.html';
		li07_01.children = [];
		li07Children.push(li07_01);
		
		var li07_02 = {};
		li07_02.xtype = 'menuItem';
		li07_02.mainContentUrl = projectPX + 'f/Alarm_Setting_main.px';
		li07_02.children = [];
		li07Children.push(li07_02);
	}
	items.push(li07);
	
	// Li08
	var li08 = {};
	li08.xtype = 'menuItem';
	li08.mainContentUrl = projectPX + 'h/Manage_main.px';
	li08.children = [];
	items.push(li08);

	return items;
}
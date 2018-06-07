// $.getScript("http://malsup.github.io/jquery.blockUI.js", function () {
// });


var jqObj = function (id) {
    var o = id;
    if (o && o.jquery)
        return o;
    if (typeof (o) == "string") {
        var e = $("#" + o); //先視為 id
        //if(e.length == 0)
        //	e = $(eval(o)); //視為 element DOM 完整敘述(會出錯)
        return e;
    }
    return $(o); //視為 HTML Element
}

var _ckJQ = function () {
    if (!jQuery)
        alert("jQuery not imported");
}

//------------------------------- 字串、數字工具 -------------------------------//
/**
 * 判斷傳入字串是否為空(null、undefined、'')
 * @param s (string) 要判斷的字串
 * @return boolean
 */
function isEmpy(s) {
    if (s)
        return false;
    else
        return true;
}

//左補指定字元
function padLeft(str, len, ch) {
    ch = ch ? ch : '.';
    len = len - str.length + 1;
    return len > 0 ?
        new Array(len).join(ch) + str : str;
}

//千分位轉回一般數字
function revertNum(arg) {
    if (arg == '')
        return 0;
    arg = arg.toString();
    var dot = arg.split('.');
    if (dot.length > 1)
        return parseFloat(arg.replace(/[\,]/g, ''));
    else
        return parseInt(arg.replace(/[\,]/g, ''));
}

/**
* http://8st.blogspot.tw/2012/10/jsbug.html
* JS運算到double，小數運算會不合需求
*/
//相加
function numAdd(arg1, arg2) {
    //return revertNum(arg1) + revertNum(arg2);

    arg1 = revertNum(arg1).toString();
    arg2 = revertNum(arg2).toString();
    var r1, r2, m, c;
    try { r1 = arg1.toString().split(".")[1].length } catch (e) { r1 = 0 }
    try { r2 = arg2.toString().split(".")[1].length } catch (e) { r2 = 0 }
    c = Math.abs(r1 - r2);
    m = Math.pow(10, Math.max(r1, r2))
    if (c > 0) {
        var cm = Math.pow(10, c);
        if (r1 > r2) {
            arg1 = Number(arg1.toString().replace(".", ""));
            arg2 = Number(arg2.toString().replace(".", "")) * cm;
        }
        else {
            arg1 = Number(arg1.toString().replace(".", "")) * cm;
            arg2 = Number(arg2.toString().replace(".", ""));
        }
    }
    else {
        arg1 = Number(arg1.toString().replace(".", ""));
        arg2 = Number(arg2.toString().replace(".", ""));
    }
    return (arg1 + arg2) / m
}

//相減
function numSub(arg1, arg2) {
    //return revertNum(arg1) - revertNum(arg2);

    arg1 = revertNum(arg1).toString();
    arg2 = revertNum(arg2).toString();
    var r1, r2, m, n;
    try { r1 = arg1.toString().split(".")[1].length } catch (e) { r1 = 0 }
    try { r2 = arg2.toString().split(".")[1].length } catch (e) { r2 = 0 }
    m = Math.pow(10, Math.max(r1, r2));
    //last modify by deeka
    //動態控制精度長度
    n = (r1 >= r2) ? r1 : r2;
    return Number(((arg1 * m - arg2 * m) / m).toFixed(n));
}

//相乘
function numMul(arg1, arg2) {
    //return revertNum(arg1) * revertNum(arg2);

    arg1 = revertNum(arg1).toString();
    arg2 = revertNum(arg2).toString();
    var m = 0, s1 = arg1.toString(), s2 = arg2.toString();
    try { m += s1.split(".")[1].length } catch (e) { }
    try { m += s2.split(".")[1].length } catch (e) { }
    return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m)
}

//相除
function numDiv(arg1, arg2) {
    if (arg2 != 0)
        return revertNum(arg1) / revertNum(arg2);
    else
        return 0;
}

//四捨五入至小數點第X位
function numRound(val, digits) {
    if (digits == undefined || digits == 0) {
        return Math.round(val);
    } else {
        val = revertNum(val + '');
        return Math.round(val * Math.pow(10, digits)) / Math.pow(10, digits);
    }
}

//無條件捨去至小數點第X位
function numFloor(val, precision) {
    if (precision == undefined || precision == 0) {
        return Math.floor(val);
    }
    else {
        val = revertNum(val + '');
        return (Math.floor(val * (Math.pow(10, precision)))) / (Math.pow(10, precision));
    }
}

//------------------------------- form -------------------------------//

function formToMap(formId, target) {
    _ckJQ();
    var f = jqObj(formId);
    if (!f[0])
        return {};
    var t, v, n, m = !target ? {} : target;
    $(":input", f).each(function (i, e) {
        t = e.type;
        n = e.name;
        if (n == null || n.length == 0)
            return true; //continue
        if (t == "text" || t == "hidden" || t == "textarea" || t == "password" || t == "range" ||
            t == "number" || t == "email" || t == "tel" || t == "select-one") {
            m[n] = e.value;
        } else if (t == "select-multiple") { //一定得出陣列
            m[n] = ((v = $(e).val()) == null) ? [] : v;
        } else if (t == "radio") { //可能無值
            if (e.checked)
                m[n] = e.value;
        } else if (t == "checkbox") { //一定得出陣列
            if (!(v = m[n]))
                m[n] = v = [];
            if (e.checked)
                m[n][v.length] = e.value;
        } else { //其他只好丢給 jQuery
            m[n] = $(e).val();
        }
    });
    return m;
}

function mapToForm(map, formId) {
    _ckJQ();
    var f = jqObj(formId);
    $(":input", f).each(function (i, e) {
        var name = e.name; //因應 radio 與 checkbox 型態, element id 不可重覆, 故使用 element name 取 input element
        var t, ee, v, v2; //v2:非陣列, v:可能是陣列也可能不是
        if (name != "" && (v = map[name]) != undefined) {
            t = e.type;
            if ($.isArray(v)) {
                v = ensureStrArr(v); //確保全部成員為 string 型態, null 成員以 "" 表示
                v2 = (v.length == 0) ? "" : v[0];
            } else {
                v2 = (v == null) ? "" : v.toString();
            }

            if (t == "text" || t == "hidden" || t == "textarea" || t == "password" || t == "range" ||
                t == "number" || t == "email" || t == "tel") { //text input
                e.value = v2;
            } else if (t == "radio") { //redio button
                e.checked = (v2 == e.value);
            } else if (t == "checkbox") { //checkbox button
                e.checked = ($.inArray(e.value, v) != -1); //目前的 jQuery 中, 如果 v 為 "x,y,z..." 型式的字串, 也能被 $.inArray() 當成 js 陣列處理
            } else if (t == "select-one") {
                e.value = v2;
            } else if (t == "select-multiple") {
                $(e).val(v);
            }
        }
    });
}

//------------------------------- Message -------------------------------//

function taAlert(msg, msgType, callback) {
    if (isEmpy(msg))
        return;

    alert(msg);
}

//------------------------------- Ajax -------------------------------//
/**
 * Ajax Post
 * @param url  (string) post網址
 * @param args  (string) post參數
 * @param onSuccessful (function) 成功後的callback function
 * @param onJSONResponseError (function) 失敗後的callback function
 */
function postForJSON(url, args, onSuccessful, onJSONResponseError) {

    $.ajax({
        type: 'POST',
        dataType: 'json',
        url: url,
        data: args,
        beforeSend: function () {
            // $.blockUI();
        },
        complete: function () {
            // $.unblockUI();
        },
        success: onSuccessful,
        error: function (ret) {
            taAlert(eval(ret));
        }
    });
}

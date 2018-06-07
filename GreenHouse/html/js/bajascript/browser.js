//
// Copyright 2012, Tridium, Inc. All Rights Reserved.
//

/**
 * Hooks for running BajaScript inside of a browser.
 *
 * @author Logan Byam
 * @version 1.0.0.0
 */

/*jslint browser: true, white: true, plusplus: true, nomen: true */
/*global baja, ActiveXObject*/ 
(function browser() {
  "use strict";
  
  ////////////////////////////////////////////////////////////////
  // DOM Ready
  //////////////////////////////////////////////////////////////// 
  
  var domReadyTimer,
      domReadyCallbacks,
      domIsReady;
      
  if (!baja.comm) {
    throw new Error("comm.js required");
  }
  
  /**
   * Waits for the DOM to be initialized and then executes a callback.
   * 
   * @name baja.browser.comm.domReady
   * @function
   * @private
   * @inner
   *
   * @param {Function} func a function to be executed once the DOM is ready.
   */
  function domReady(func) {
    // isDOMReady function
    var isDOMReady = function () {
      if (domIsReady) {
        return false;
      }
      
      if (document && 
          document.getElementsByTagName && 
          document.getElementById && 
          document.body) {
        clearInterval(domReadyTimer);
        domReadyTimer = null;
        
        var i;
        for (i = 0; i < domReadyCallbacks.length; ++i) {
          domReadyCallbacks[i]();
        }
        
        domReadyCallbacks = null;
        domIsReady = true;
      }
    };
  
    // If already ready then invoke and return
    if (domIsReady) {
      func();
      return;
    }

    if (typeof domReadyTimer === "number") {
      // Register this callback if we need too
      domReadyCallbacks.push(func);
    }    
    else {
      // Register for dom ready events
      if (document && document.addEventListener) {
        document.addEventListener("DOMContentLoaded", isDOMReady, false);
      }
      else {
        window.onload = isDOMReady;
      }
      
      domReadyCallbacks = [func];
      
      // Use a timer as a fallback just in case!
      domReadyTimer = setInterval(isDOMReady, 13);
    }
  }
  
  /**
   * This namespace is for documentation purposes only and will not actually
   * be available to Bajascript apps. It details enhancements/decorations
   * applied to functions in <code>baja.comm</code> when Bajascript is deployed
   * to a web browser environment.
   * 
   * @namespace
   * @name baja.browser.comm
   */
  (function comm() {
    // Ensure the started callbacks only happen once the DOM is fully loaded.
    var doStart = baja.comm.start;
    
    /**
     * In a browser, <code>baja.comm.start</code> will wait for the DOM to be
     * ready (as well as for communications to the station be established)
     * before executing its callback.
     * 
     * @name baja.browser.comm.start
     * @function
     * @private
     * @inner
     */
    baja.comm.start = function start(obj) {
      var started = obj.started || baja.ok;
      obj.started = function () {
        domReady(started);
      };
      doStart(obj);
    };
    
    /**
     * In a browser, <code>baja.comm.reconnect</code> will simply reload the
     * browser page.
     *
     * @name baja.browser.comm.reconnect
     * @function
     * @private
     * @inner
     */
    baja.comm.reconnect = function reconnect() {
      // Delay the reconnection slightly - just incase there's a problem and this triggers another refresh!
      baja.clock.schedule(function () {
        // If we can get to the login page then attempt a reconnection...
        // Reconnect by refreshing the page...
        if (location && location.reload) {
          location.reload(/*forceget*/false);
        }
      }, 2500);
    };
    
    ////////////////////////////////////////////////////////////////
    // HTTP Comms
    //////////////////////////////////////////////////////////////// 
    
    /**
     * An Http Error.
     * <p>
     * A HTTP Error happens as a result of problem with HTTP communcation.
     * 
     * @class
     * @private
     * @param {XmlHttpRequest} x the object used for comms.
     */
    baja.comm.HttpError = function (x) {
      var t = x.responseText || "Session disconnected",
          status = x.status;
      
      this.name = "HttpError";
      this.message = t + " err: " + x.status;
      this.status = status;
      
      // Indicate to delay any reconnection if a 404 or no status is returned.
      this.delayReconnect = (!status || status === 404);
      
    }.$extend(baja.comm.ServerError);
    
    /**
     * Make an HTTP connection using XMLHttpRequest or its MS equivalents.
     *
     * @name baja.browser.comm.sendHttp
     * @function
     * @private
     * @inner
     *
     * @param {String} method  the method to use (i.e. 'post' or 'get').
     * @param {String} uri  the URI used in the connection.
     * @param {Boolean} async  boolean flag indicating if this is an asynchronous or synchronous call.
     * @param {Object} callback  this object must have 'ok' and 'fail' functions.
     * @param {String} [body]  the body of the HTTP POST.
     * @param {String} [contentType]  the Content Type for an HTTP POST.
     */
    function sendHttp(method, uri, async, callback, body, contentType) {  
      // TODO: Do we need to handle timeouts? Or just rely on the browser failing?
      var x = null,
          handler,
          ie = false; // Are we Internet Explorer?
      
      // HTTP Callback Handler
      handler = function () {    
        var st;  // Status

        if (x.readyState === 4) {
          try {
            st = parseInt(x.status, 10);
            
            if (st !== 200 && !baja.isStopping()) {
              callback.fail(new baja.comm.HttpError(x));
            }
            else {
              // HTTP 200 ok
              callback.ok(x.responseText);
            }
          }
          catch (error) {
            callback.fail(error);
          }
          finally {
            // Request is now dealt with so clean up here
            x.onreadystatechange = baja.ok;
            x = null;
          }
        }
      };
          
      // Make AJAX network call
      try {     
                 
        // Create XMLHttpRequest
        try { 
          x = new XMLHttpRequest(); 
        }
        catch (e) {
          try {
            x = new ActiveXObject("Msxml2.XMLHTTP");
            ie = true;
          }
          catch (e2) {
            try {
              x = new ActiveXObject("Microsoft.XMLHTTP");
              ie = true;
            }
            catch (e3) {
              // No XMLHttpAvailable?
              throw new Error("Failed to create XMLHttpRequest: " + e3);
            }
          }
        }
              
        x.open(method, uri, async);     

        if (contentType) {      
          x.setRequestHeader("Content-Type", contentType);
        }
        
        // Set HTTP Headers  
        if (ie === undefined) {
          x.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT");
        }
                    
        if (async) {
          // Set callback handler
          x.onreadystatechange = handler;
        }
        
        // Send body
        x.send(body);  
      }
      catch (error) {
        callback.fail(error);
        return;
      }
      
      if (!async && x !== null) {
        // If synchronous then just invoke the handler
        // Please note: this is outside of the above exception handler because we
        // don't want to catch any exceptions generated by the handler
        handler.call(x);
      }
    }
    
    /**
     * In a browser, <code>baja.comm.BoxFrame#send</code> will delegate to
     * <code>baja.browser.comm.sendHttp</code>.
     * 
     * @private
     * @inner
     * @ignore
     */
    baja.comm.BoxFrame.prototype.send = function (async, callback) {
      // Make the HTTP POST to the BOX Servlet
      sendHttp("post", 
               "/box/", 
               async, 
               callback, 
               this.toString(), 
               "application/json");
    };
  }());
    
  /**
   * This namespace is for documentation purposes only and will not actually
   * be available to Bajascript apps. It details enhancements/decorations
   * applied to functions in <code>baja</code> when Bajascript is deployed
   * to a web browser environment.
   * 
   * @namespace
   * @name baja.browser
   */
  (function sysUtil() {
    var _outln = baja.outln,
        _clearOut = baja.clearOut,
        _error = baja.error;
        
    /**
     * In a browser, <code>baja.outln</code> will (in addition to calling
     * <code>bajaJsPrint()</code>) look for a <code>&lt;pre&gt;</code> element 
     * with ID <code>bajaScriptOut</code> and append the message to that 
     * element as well.
     * 
     * @name baja.browser.outln
     * @function
     * @private
     * @inner
     */
    baja.outln = function (msg) {
      // If BajaScript has stopped then don't output anything else...
      if (baja.isStopping()) {
        return this;
      }
    
      var bajaScriptOut, 
          escapedMsg;
      
      msg += "\n";
      
      if (document && document.getElementById) {
        bajaScriptOut = document.getElementById("bajaScriptOut");
        if (bajaScriptOut !== null) {  
          escapedMsg = msg.toString();
          escapedMsg = msg.replace(/</g, "(").replace(/>/g, ")");
                    
          // Should work around IE for ignoring newlines in 'pre' and 'textarea' elements
          escapedMsg = escapedMsg.replace(/\n/g, "\r\n");
          bajaScriptOut.appendChild(document.createTextNode(escapedMsg));
        }
      }
  
      // If available, attempt to write out to Chrome's JavaScript window
      if (window.console && window.console.log) {
        window.console.log(msg);
      }
      
      return _outln.call(this, msg);
    };
    
    /**
     * In a browser, <code>baja.clearOut</code> will look for a
     * <code>&lt;pre&gt;</code> element with ID <code>bajaScriptOut</code> and
     * wipe all text from it.
     * 
     * @name baja.browser.clearOut
     * @function
     * @private
     * @inner
     */
    baja.clearOut = function () {
      if (document && document.getElementById) {
        var elem = document.getElementById("bajaScriptOut");
        if (elem !== null) {
          elem.innerHTML = "";
        }
      }
      
      return _clearOut.apply(this, arguments);
    };
    
    /**
     * In a browser, <code>baja.error</code> will (in addition to calling
     * <code>baja.outln</code>) look for <code>window.console.error</code> and,
     * if it exists, pass the error message to it.
     * 
     * @name baja.browser.error
     * @function
     * @private
     * @inner
     */
    baja.error = function (msg) {
      if (baja.isStopping()) {
        return this;
      }
    
      // If available, attempt to write out to Chrome's JavaScript Window
      if (window.console && window.console.error) {
        window.console.error(msg);
      }
      
      return _error.apply(this, arguments);
    };
  }());
  
  
  /**
   * This namespace is for documentation purposes only and will not actually
   * be available to Bajascript Apps. It details enhancements/decorations
   * applied to functions in <code>baja.registry</code> when Bajascript is 
   * deployed to a web browser environment.
   * 
   * @namespace
   * @name baja.browser.registry
   */
  (function sysRegistry() { 
    var webStorageKeyName = "bajaScriptReg";
  
    /**
     * In a browser, this overrides <code>baja.registry.clearStorage</code>
     * and will clear the web storage content (if the browser supports web storage).
     * 
     * @name baja.browser.registry.clearStorage
     * @function
     * @private
     * @inner
     */
    baja.registry.clearStorage = function () { 
      if (window.localStorage) {
        // Always access local storage in try/catch...
        try {
          window.localStorage.removeItem(webStorageKeyName);
        }
        catch (ignore) {}
      }
    };
    
    /**
     * In a browser, this overrides <code>baja.registry.saveToStorage</code>
     * and will write its contents to web storage (if the browser supports web storage).
     * 
     * @name baja.browser.registry.save
     * @function
     * @private
     * @inner
     * 
     * @param {Object} regStorage the BajaScript registry information to store
     */
    baja.registry.saveToStorage = function (regStorage) {
      // If available, save any cached registry information to web storage   
      if (regStorage && window.localStorage) {
        // Always access local storage in try/catch...
        try {
          window.localStorage.setItem(webStorageKeyName, JSON.stringify(regStorage));
        }
        catch (ignore) {
          baja.registry.clearStorage();
        }
      }
    };
    
    /**
     * In a browser, this overrides <code>baja.registry.loadFromStorage</code> 
     * and will attempt to read any registry information previously stored in web storage
     * (if the browser supports web storage).
     * 
     * @name baja.browser.registry.loadFromStorage
     * @function
     * @private
     * @inner
     */
    baja.registry.loadFromStorage = function () {   
      var regStorage = null;
      if (window.localStorage) {
        // Always access local storage in try/catch...
        try {
          regStorage = window.localStorage.getItem(webStorageKeyName);
          
          // If we have data then parse it
          if (regStorage) {
            regStorage = JSON.parse(regStorage);
          }
        }
        catch (ignore) {
          baja.registry.clearStorage();
        }  
      }
      return regStorage;      
    };
  }());
}());
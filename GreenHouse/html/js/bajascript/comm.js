//
// Copyright 2010, Tridium, Inc. All Rights Reserved.
//

/**
 * Network Communications for BajaScript.
 *
 * @author Gareth Johnson
 * @version 1.0.0.0
 */

//JsLint options (see http://www.jslint.com )
/*jslint rhino: true, onevar: false, plusplus: true, white: true, undef: false, nomen: false, eqeqeq: true,
bitwise: true, regexp: true, newcap: true, immed: true, strict: false, indent: 2, vars: true, continue: true */

// Globals for JsLint to ignore 
/*global baja, JSON, BaseBajaObj, clearInterval, setInterval*/ 
 
(function comm(baja, BaseBajaObj) {

  // Use ECMAScript 5 Strict Mode
  "use strict";
  
  // Create local for improved minification
  var strictArg = baja.strictArg,
      bajaDef = baja.def,
      Callback;
  
  /**
   * @namespace Baja Communications
   */
  baja.comm = new BaseBajaObj();

  ////////////////////////////////////////////////////////////////
  // Comms
  //////////////////////////////////////////////////////////////// 
  
  var requestIdCounter = 0, // Number used for generate unique response ids in BOX Messages
      pollRate = 2500, // Rate at which the Server Session is polled for events
      serverSession = null, // The main server session
      pollTicket = baja.clock.expiredTicket, // The ticket used to poll for events in the comms layer
      eventHandlers = {}, // Server Session event handlers
      commFail = function (err) {   // Comm fail handler
        baja.outln("Comms failed: " + err.name);
        if (!err.noReconnect) {
          baja.outln("Attempting reconnect...");
        }
      };
  
  /**
   * Set the comm fail function that gets called when the 
   * communications layer of BajaScript fails. 
   *
   * @name baja.comm.setCommFailCallback
   * @function
   *
   * @param func the comm fail error
   */
  baja.comm.setCommFailCallback = function (func) {
    strictArg(func, Function);
    commFail = func;
  };
  
  /**
   * Attempts a reconnection
   *
   * @private
   */
  baja.comm.reconnect = function () {
    throw new Error("baja.comm.reconnect not implemented");
  };
  
  function serverCommFail(err) {
    // If BajaScript has stopped then don't try to reconnect...
    if (baja.isStopping()) {
      return;
    }
  
    // Nullify the server session as this is no longer valid...
    serverSession = null;
  
    try {
      // Signal that comms have failed
      commFail(err);
    }
    catch (ignore) {}
    
    // Stop any further polling...
    pollTicket.cancel();
            
    function detectServer() {      
      var cb = new Callback(function ok() {
        // If we can get a connection then reconnect
        baja.comm.reconnect();
      },
      function fail(err) {
        if (!err.noReconnect) {
          // If the BOX Service is unavailable or we can't connect at all then schedule another
          // server test to detect when it comes back online...
          if (err.delayReconnect) {   
            // Schedule another test to try and detect the Server since we've got nothing back...
            baja.clock.schedule(detectServer, 1000);  
          }
          else {
            // If we've got some sort of status code back then the server could be there
            // so best attempt a refresh          
            baja.comm.reconnect();
          }
        }
      });
      
      cb.addReq("sys", "hello", {});
      cb.commit();
    }
    
    // Unless specified otherwise, attempt a reconnect...
    if (!err.noReconnect) {
      detectServer(); 
    }
  }
  
  ////////////////////////////////////////////////////////////////
  // BOX
  ////////////////////////////////////////////////////////////////
    
  // BOX - Baja Object eXchange
  // Define Communications layer
  
  /*
  // A BOX frame
  var boxFrame = {
    "p": "box", // Protocol
    "d": "stationName" // Destination (if blank, null or undefined, it's for the locally connected host/station)
    "v": 1,     // Version
    "m": [ {    // A frame contains an array of messages
        // The body of each message (response must have some order and number for each message)
        {
          "r": 0,      // Response id (used to associate requests with responses). Used when HTTP isn't. -1 === unsolicited.
          "t": "rt",   // Type (rt=request, rp=response, e=response error, u=unsolicited, )
          "c": "sys",      // Channel (pluggable comms model)
          "k": "getTypes", // Key in Channel
          "b": {           // Message body
          }  
        }
      }
    ]
  };
  */

  var defaultErrorMessage = "Default Message";
  
  /**
   * A Server Error.
   * 
   * @class
   * @private
   * @extends Error
   * @param [message] the error message
   */
  baja.comm.ServerError = function (message) {
    this.name = "ServerError";
    this.message = message || defaultErrorMessage;
  }.$extend(Error);
  
  /**
   * A BOX Error.
   * <p>
   * A BOX Error is one that originated from the Server using the BOX protocol.
   * 
   * @class
   * @private
   * @extends baja.comm.ServerError
   * @param [errorType] the type of error
   * @param [message] the error message
   */
  baja.comm.BoxError = function (errorType, message) {
    this.name = errorType;
    this.message = message || defaultErrorMessage;
  }.$extend(baja.comm.ServerError);
  
  /**
   * A BOX frame to be stringified and sent up to the station.
   * 
   * @class
   * @name baja.comm.BoxFrame
   * @private
   * @param {Array} messageQueue a queue of BOX messages.
   */
  baja.comm.BoxFrame = function (messageQueue) {
    var msgs = [],
        i;
    
    for (i = 0; i < messageQueue.length; ++i) {
      if (messageQueue[i].m) {
        msgs.push(messageQueue[i].m);
      }
    }
        
    this.$body = {
        p: 'box', // protocol
        v: 1,     // version
        m: msgs   // messages (actual messages from a MessageQueue - no callbacks)
    };
  };
  
  /**
   * Returns a JSON-stringified representation of this BOX frame, ready to be
   * sent up to the station as-is.
   *
   * @returns {String} a string representation of this BOX frame in a format
   * expected by the BOX servlet on the station.
   */
  baja.comm.BoxFrame.prototype.toString = function () {
    return JSON.stringify(this.$body);
  };
  
  /**
   * Checks to see if this frame has no actual messages to send.
   *
   * @returns {Boolean} true if this frame has no messages.
   */
  baja.comm.BoxFrame.prototype.isEmpty = function () {
    return this.$body.m.length === 0;
  };
  
  /**
   * Sends this frame up to the station. This is an override hook and MUST be
   * implemented by a utility class; e.g. <code>browser.js</code> will
   * implement this by using XMLHttpRequest to send this frame to the station
   * via POST. This function will be called from 
   * <code>baja.comm.Batch#doCommit</code> so any batch properties on the
   * callback object do not need to be taken into account - just ok/fail.
   * 
   *
   * @param {Boolean} async true if this frame should be sent asynchronously.
   * @param {baja.comm.Batch|baja.comm.Callback|Object} callback an object
   * containing ok/fail callbacks.
   */
  baja.comm.BoxFrame.prototype.send = function (async, callback) {
    throw new Error("baja.comm.BoxFrame#send not implemented");
  };
     
  /**
   * @class Batch Network Call Capturing.
   * <p>
   * A Batch object can be used to batch up a number of network calls into 
   * one network call. It's used for network efficient remote programming in
   * BajaScript.
   * <p>
   * When specified, a batch object is typically an optional argument in a method
   * that could make a network call.
   * <pre>
   *   var b = new baja.comm.Batch();
   *   
   *   // Invoke a number of Component Actions in one network call...
   *   myComp.foo({batch: b});
   *   myComp2.foo2({batch: b});
   *
   *   // Make a single network call that will invoke both Actions in one go...
   *   b.commit();
   * </pre>
   *
   * @name baja.comm.Batch
   * @extends BaseBajaObj
   */
  baja.comm.Batch = function () {
    this.$queue = [];
    this.$committed = false;
    this.$async = true;
  }.$extend(BaseBajaObj);
      
  /**
   * Add a BOX request message to the Batch Buffer.
   * <p>
   * This method is used internally by BajaScript.
   *
   * @private
   *
   * @param {String} channel  the BOX Channel name.
   * @param {String} key  the BOX key in the Channel.
   * @param {Object} body  the object that will be encoded to JSON set over the network.
   * @param {baja.comm.Callback} callback  the callback. 'ok' or 'fail' is called on this object once network operations have completed.
   */
  baja.comm.Batch.prototype.addReq = function (channel, key, body, callback) {
    if (this.$committed) {
      throw new Error("Cannot add request to a commited Batch!");
    }
            
    var m = { r:  requestIdCounter++,
              t:  "rt",
              c:  channel,
              k:  key,
              b:  body };
                    
    // Add messages
    this.$queue.push({m: m, cb: callback });
  };
  
  /**
   * Add a Callback.
   * <p>
   * This adds a callback into the batch queue without a message to be sent. This is useful if a callback
   * needs to be made halfway through batch processing.
   * <p>
   * Please note, this is a private method that's only recommended for use by Tridium developers!
   *
   * @private
   *
   * @param {Function} [ok]  the ok callback.
   * @param {Function} [fail] the fail callback.
   */
  baja.comm.Batch.prototype.addCallback = function (ok, fail) {
    if (this.$committed) {
      throw new Error("Cannot add callback to a commited Batch!");
    }
      
    // Add callback to outgoing messages
    this.$queue.push({m: null, cb: new Callback(ok, fail)});
  };
  
  function batchOk(batch, i, resp) {
    // Bail if there's nothing more in the queue
    if (i >= batch.$queue.length) {
      return;
    }
    
    var respMsg = null,
        m = batch.$queue[i].m,   // Message
        cb = batch.$queue[i].cb, // Callback
        j,
        boxError;
    
    try {
      /**
       * @ignore - When ok or fail has been called on this callback, process the next item in the queue
       */
      cb.$batchNext = function () {
        cb.$batchNext = baja.noop;
        batchOk(batch, ++i, resp);
      };      
      
      // For callbacks that didn't have messages just call the ok handler
      if (!m) {
        try {
          cb.ok();
          return;
        }
        catch (notFoundErr) {
          cb.fail(notFoundErr); 
        }
      }
      
      // Skip messages that weren't requests
      if (m.t !== "rt") {
        cb.ok();
        return;
      }
      
      // For messages that were requests, attempt to match a response
      for (j = 0 ; j < resp.m.length; ++j) {
        // Match up the request number      
        if (resp.m[j].r === m.r) {
          respMsg = resp.m[j];
          break;
        }
      }
    
      // Process message if found
      if (respMsg !== null) {
        if (respMsg.t === "rp") {
          // If we have a valid response then make the ok callback
          try {
            cb.ok(respMsg.b);
          }
          catch (okErr) {
            cb.fail(okErr); 
          }
        }
        else if (respMsg.t === "e") {
          boxError = new baja.comm.BoxError(respMsg.et, respMsg.b);
          
          // Indicates the comms have completely failed...
          if (respMsg.cf) {
            // If the comms have failed then don't bother trying to reconnect
            boxError.noReconnect = true;
            
            // Flag up some more information about the BOX Error
            boxError.sessionLimit = respMsg.et === "BoxSessionLimitError";
            boxError.fatalFault = respMsg.et === "BoxFatalFaultError";
            boxError.nonOperational = respMsg.et === "BoxNonOperationalError";
            
            serverCommFail(boxError);
          }
          
          // If we have a response error then make the fail callback
          cb.fail(boxError);
        }
        else {
          cb.fail(new Error("Fatal error reading BOX Frame: " + JSON.stringify(resp)));
        }
      }
      else {
        // If a response can't be found then invoke then invoke the failure callback
        cb.fail(new Error("BOX Error: response not found for request: " + JSON.stringify(m)));
      }
    }
    catch (failError) {
      baja.error(failError);
    }
  }
  
  function batchFail(batch, i, err) {
    // Bail if there's nothing more in the queue
    if (i >= batch.$queue.length) {
      return;
    }
    
    var cb = batch.$queue[i].cb;
    
    try {
      /**
       * @ignore - When ok or fail has been called on this callback, process the next item in the queue
       */
      cb.$batchNext = function () {
        cb.$batchNext = baja.noop;
        batchFail(batch, ++i, err);
      };
      
      cb.fail(err);
    }
    catch (failError) {
      baja.error(failError);
    }
  }
  
  /**
   * Performs the actual commit work for the <code>commit</code> and
   * <code>commitSync</code> functions. Checks to see if this batch's queue
   * contains any actual BOX messages that need to be sent to the station. 
   * If not, it simply calls all the <code>ok</code> callbacks the queue
   * contains. If there are messages to send, it assembles them into a
   * <code>baja.comm.BoxFrame</code> and sends them up.
   *
   * @name baja.comm.Batch-doCommit
   * @function
   * 
   * @private
   * @inner
   *
   * @param {Boolean} async determines whether to send the frame to the station
   * asynchronously (only applicable if there are actual messages to send).
   */
  var doCommit = function (async) {
    // If BajaScript has fully stopped then don't send anymore comms requests...
    if (baja.isStopped()) {
      return;
    }
  
    if (this.$committed) {
      throw new Error("Cannot commit batch that's already committed!");
    }
  
    this.$committed = true;
    this.$async = async;
  
    var i,
        queue = this.$queue,
        frame = new baja.comm.BoxFrame(queue);             
    
    // If there aren't any messages to send then bail...
    if (frame.isEmpty()) {
      batchOk(this, 0); 
    } 
    else {
      frame.send(async, this);
    }
  };
  
  /**
   * Adds all messages to a frame and makes a synchronous network call.
   * <p>
   * It's always preferable to make an asynchronous network call. Otherwise
   * any page will appear to block. However, there are some occassions where 
   * synchronous network calls are necessary. This method can be used to make 
   * these network calls.
   * 
   * @see baja.comm.Batch#commit
   */
  baja.comm.Batch.prototype.commitSync = function () {
    doCommit.call(this, /*async*/false);
  };
    
  /**
   * Makes a Batch asynchronous network call. This should 
   * <strong>always</strong> be used in preference to 
   * {@link baja.comm.Batch#commitSync}.
   */
  baja.comm.Batch.prototype.commit = function () {
    doCommit.call(this, /*async*/true);
  };
  
  /**
   * Return a copy of the Batch's messages array.
   *
   * @private
   *
   * @returns a copy of the Batch's Messages array.
   */
  baja.comm.Batch.prototype.getMessages = function () {
    return this.$queue.slice(0);
  };  
  
  /**
   * Ok callback made one network call has successfully completed.
   * <p>
   * This gets invoked when the network call has completed successfully and a response has
   * been received.
   *
   * @private
   *
   * @param {String} resp  the response text.
   * @throws Error if a failure occurs.
   */
 baja.comm.Batch.prototype.ok = function (resp) { 
    // Bail if the BajaScript engine has fully stopped
    if (baja.isStopped()) {
      return;
    }
  
    // Decode the JSON
    resp = JSON.parse(resp);
   
    if (resp.p !== "box") {
      this.fail("Invalid BOX Frame. Protocol is not BOX");
      return;
    }
    
    // Process the response
    batchOk(this,  0, resp); 
  };
  
  /**
   * Fail is called if one of the batched calls fails.
   *
   * @private
   *
   * @param err  the cause of the error.
   */
  baja.comm.Batch.prototype.fail = function (err) { 
    // Bail if the BajaScript engine has fully stopped
    if (baja.isStopping()) {
      return;
    }  
    
    // Fail all messages with error since the batch message itself failed
    batchFail(this, 0, err); 
  };
        
  /**
   * Return true if this Batch object has no messages to send.
   *
   * @private
   *
   * @returns {Boolean}
   */
  baja.comm.Batch.prototype.isEmpty = function () {
    return this.$queue.length === 0;
  };
  
  /**
   * Return true if this Batch has already been committed.
   *
   * @private
   *
   * @returns {Boolean}
   */
  baja.comm.Batch.prototype.isCommitted = function () {
    return this.$committed;
  };
  
  /**
   * Return true if this Batch was committed asynchronously.
   * <p>
   * If the batch is not committed yet, this will return true.
   *
   * @private
   *
   * @returns {Boolean}
   */
  baja.comm.Batch.prototype.isAsync = function () {
    return this.$async;
  };
    
  ////////////////////////////////////////////////////////////////
  // Callback
  //////////////////////////////////////////////////////////////// 
      
  /**
   * @class Network Callback.
   * <p>
   * A Callback object has ok and fail methods. It is used to make a comms call in
   * BajaScript. When a comms call is made, additional callbacks may be needed to
   * process the incoming data before calling the original ok or fail callbacks are 
   * executed. Therefore, extra help functions have been added to this object
   * to for convenience.
   * <p>
   * This method should only be used internally by BajaScript. It should never appear
   * in the public API.
   *
   * @name baja.comm.Callback
   * @extends BaseBajaObj
   * @private
   */  
  baja.comm.Callback = function (ok, fail, batch) {
    var that = this;
    baja.comm.Callback.$super.apply(that, arguments);
   
    ok = ok || baja.ok;
    fail = fail || baja.fail;
    
    that.$batch = batch || new baja.comm.Batch();
    that.$batchNext = baja.noop;
    
    that.ok = function () {
      // Invoke user's ok callback and then make a batch callback
      try {
        ok.apply(this, arguments);
      }
      finally {
        that.$batchNext();
      }
    };
    
    that.fail = function () {
      // Invoke the user's fail callback and then make a batch callback
      try {
        fail.apply(this, arguments);
      }
      finally {
        that.$batchNext();
      }
    };
        
    // Make a note of whether the batch was originally defined
    that.$orgBatchDef = typeof batch === "object";           
  }.$extend(BaseBajaObj);
    
  /**
   * Add an 'ok' callback.
   * <p> 
   * When calling some BajaScript that causes a network call, there will be other callbacks
   * that need to be processed before the original 'user' callbacks are invoked. Therefore,
   * 'addOk' and 'addFail' can be used to chain up extra Callbacks if needed.
   * <pre>
   *   // Create a callback object with user's original ok and fail function callbacks...
   *   var cb = new baja.comm.Callback(ok, fail, batch);
   *
   *   // Add an intermediate callback...
   *   cb.addOk(function (ok, fail, resp) {
   *     // Process the response 'resp' object...
   *     var val = processResponse(resp);
   *     
   *     // Now call 'ok' callback passed in with processed response...
   *     ok(val);
   *   });
   * </pre>
   * <p>
   * Please note, that when adding an intermediate calllback, the 'ok' or 'fail' method passed
   * in <strong>must</strong> be called at some point.
   * <p>
   * This method is also extremely useful for intermediate callbacks that need to make other asynchronous
   * network calls before calling the user's original 'ok' or 'fail' callback functions.
   *
   * @private
   *
   * @see baja.comm.Callback#fail
   *
   * @param {Function} newOk  the callback Function. This function must accept three
   *                          arguments including the current ok and fail function as well
   *                          as any arguments specific to the callback function.
   *                          By convention, the 'ok' or 'fail' functions passed in must be called
   *                          after the new callback has finished.
   */
  baja.comm.Callback.prototype.addOk = function (newOk) {
  
    // Make a reference to the current ok and fail callback functions
    var currentOk = this.ok,
        currentFail = this.fail;
    
    // Create a new 'ok' callback closure. When invoked, the new 'ok' function will be called
    // with the previous 'ok' and 'fail' functions passed in as arguments to the beginning of
    // the function. By convention, the new callback ok function should invoke the 'ok' function
    // passed into it as an argument (or fail if there is a problem with the data).
    this.ok = function () {
      var args = Array.prototype.slice.call(arguments);
      args.splice(0, 0, currentOk, currentFail);
      newOk.apply(this, args);
    };
  };
  
  /**
   * Add a 'fail' callback.
   * <p> 
   * When calling some BajaScript that causes a network call, there will be other callbacks
   * that need to be processed before the original 'user' callbacks are invoked. Therefore,
   * 'addOk' and 'addFail' can be used to chain up extra Callbacks if needed.
   * <pre>
   *   // Create a callback object with user's original ok and fail function callbacks...
   *   var cb = new baja.comm.Callback(ok, fail, batch);
   *
   *   // Add an intermediate callback...
   *   cb.addFail(function (ok, fail, err) {
   *     // Process the error messages before calling the original 'fail' callback...
   *     var niceMsg = processError(err);
   *     
   *     // Now call 'fail' callback passed in with processed error message...
   *     fail(niceMsg);
   *   });
   * </pre>
   * <p>
   * Please note, that when adding an intermediate calllback, the 'ok' or 'fail' method passed
   * in <strong>must</strong> be called at some point.
   * 
   * @private
   *
   * @see baja.comm.Callback#fail
   *
   * @param {Function} newFail  the callback Function. This function must accept three
   *                            arguments including the current ok and fail function as well
   *                            as any arguments specific to the callback function.
   *                            By convention, the 'ok' or 'fail' functions passed in must be called
   *                            after the new callback has finished.
   */
  baja.comm.Callback.prototype.addFail = function (newFail) {
    var currentOk = this.ok,
        currentFail = this.fail;
    this.fail = function () {
      var args = Array.prototype.slice.call(arguments);
      args.splice(0, 0, currentOk, currentFail);
      newFail.apply(this, args);
    };
  };
  
  /**
   * Return true if the batch object was originally defined when the batch was created.
   * 
   * @private
   *
   * @returns {Boolean}
   */   
  baja.comm.Callback.prototype.isOrgBatchDef = function () {
    return this.$orgBatchDef;
  };
  
  /**
   * Add a request to the callback's batch object.
   * 
   * @private
   *
   * @see baja.comm.Batch#addReq
   *
   * @param {String} channel
   * @param {String} key
   * @param body
   */   
  baja.comm.Callback.prototype.addReq = function (channel, key, body) {    
    this.$batch.addReq(channel, key, body, this);
  };
    
  /**
   * If a Batch object was originally passed in when this object was
   * created then commit the Batch. Otherwise do nothing. 
   * <p>
   * Therefore, if a Batch was originally passed into this Callback
   * object, it is assumed the caller will invoke the Batch commit method
   * when appropriate (i.e. they've batched up all of the network requests
   * that are going to be made).
   *
   * @private
   *
   * @see baja.comm.Batch#commit
   * @see baja.comm.Callback#isOrgBatchDef
   */
  baja.comm.Callback.prototype.autoCommit = function () {
    // If there was a batch object originally defined then don't commit
    // as the batch will be committed elsewhere
    if (!this.isOrgBatchDef()) {
      this.commit();
    }
  };
  
  /**
   * Commit the this object's Batch
   * <p>
   * This asynchronously makes a network call
   * 
   * @private
   *
   * @see baja.comm.Batch#commit
   */
  baja.comm.Callback.prototype.commit = function () {    
    this.$batch.commit();
  };
  
  /** 
   * Return this object's batch object
   *
   * @private
   *
   * @returns {baja.comm.Batch}
   */
  baja.comm.Callback.prototype.getBatch = function () {    
    return this.$batch;
  };
  
  /**
   * Synchronously commit this object's batch
   * <p> 
   * Please note that {@link baja.comm.Commit#commit} should always be used
   * in preference as this will result in a synchronous network call that 
   * will block everything else.
   * 
   * @private
   *
   * @see baja.comm.Callback#commit
   */
  baja.comm.Callback.prototype.commitSync = function () {    
    this.$batch.commitSync();
  };
  
  Callback = baja.comm.Callback;
      
  ////////////////////////////////////////////////////////////////
  // Server Session
  //////////////////////////////////////////////////////////////// 
    
  /**
   * @class ServerSession implementation used for polling Server data.
   *
   * @name ServerSession
   * @private
   * @inner
   */
  var ServerSession = function (id) {
    this.$id = id;
  };
  
  /**
   * Add a ServerSession make network request.
   *
   * @private
   */
  ServerSession.make = function (cb) {
    cb.addReq("ssession", "make", {});
  };
        
  /**
   * Add a request to the SessionSession object.
   *
   * @private
   *
   * @param {String} key
   * @param {baja.comm.Callback} cb
   */
  ServerSession.prototype.addReq = function (key, cb) {
    return ServerSession.addReq(key, cb, { id: this.$id });
  };
  
  /**
   * Add a request to the SessionSession object.
   *
   * @private
   *
   * @param {String} key
   * @param {baja.comm.Callback} cb
   * @param arg call argument.
   */
  ServerSession.addReq = function (key, cb, arg) {
    cb.addReq("ssession", key, arg);
    return arg;
  };
  
  /**
   * Add an event handler for an eventHandlerId to this ServerSession.
   * <p>
   * This is used to listen to events from the ServerSession.
   *
   * @private
   *
   * @param {String} eventHandlerId
   * @param {Function} eventHandler
   */
  ServerSession.addEventHandler = function (eventHandlerId, eventHandler) {
    eventHandlers[eventHandlerId] = eventHandler;
  };
  
  /**
   * Remove an event handler from the ServerSession.
   *
   * @private
   *
   * @param {String} eventHandlerId
   */
  ServerSession.removeEventHandler = function (eventHandlerId) {
    if (eventHandlers.hasOwnProperty(eventHandlerId)) {
      delete eventHandlers[eventHandlerId];
    }
  };
  
  /**
   * Return an event handler via its eventHandlerId.
   *
   * @private
   *
   * @param {String} eventHandlerId
   * @returns {Function} event handler or null if cannot be found.
   */
  ServerSession.findEventHandler = function (eventHandlerId) {
    return eventHandlers.hasOwnProperty(eventHandlerId) ? eventHandlers[eventHandlerId] : null;
  };
  
  ////////////////////////////////////////////////////////////////
  // Server Session Comms Calls
  //////////////////////////////////////////////////////////////// 
                    
  /**  
   * Makes the ServerSession.
   *
   * @private
   *
   * @param {baja.comm.Callback} cb
   */
  baja.comm.makeServerSession = function (cb) {
    
    // Add intermediate callbacks
    cb.addOk(function (ok, fail, id) {    
      try {        
        serverSession = new ServerSession(id);
        ok();
      }
      finally {
        pollTicket = baja.clock.schedule(baja.comm.poll, pollRate);
      }
    });
    
    cb.addFail(function (ok, fail, err) {
      try {
        fail(err);
      }
      finally {
        serverCommFail(err);
      }
    });
    
    // Make the ServerSession
    ServerSession.make(cb); 
    
    // commit if we can
    cb.autoCommit();        
  };
  
  /**
   * Make a Server Session Handler on the Server.
   * <p>
   * A Server Session represents the session between a BajaScript Client and the Server. Components can be created
   * and mounted under the Server's Server Session. These are called Server Session Handler Components. Server Session Handler Components
   * provide an architecture for Session based Components that can receive requests and responses. A Server Session Handler
   * can also dispatch events to a BajaScript client for further processing. A good example of a Server Session Handler
   * is the local Component Space BajaScript is connected too. The Server Session Handler API represents a useful
   * abstract layer for other Space subsystems to be plugged into (i.e. Virtual Component Spaces).
   * <p>
   * Currently, the Server Session API is considered to be private and should only be used by Tridium framework developers.
   *
   * @private
   * 
   * @param {String} serverHandlerId  a unique String that will identify the Server Session Handler under the Server Session.
   * @param {String} serverHandlerTypeSpec  the type spec (moduleName:typeName) of the Server Session Handler that will be mounted
   *                                        under the Server Session.
   * @param serverHandlerArg an initial argument to be passed into the Server Session Handler when it's created. This argument will be
   *                         encoded to standard JSON.
   * @param {Function} eventHandler an event handler callback function that will be called when any events are dispatched from the 
   *                                  Server Session Handler.
   * @param {baja.comm.Callback} cb the callback handler.
   * @param {Boolean} [makeInBatch] set to true if the batch being used has the make present (hence the server session creation
   *                                is part of this network call.
   */
  baja.comm.makeServerHandler = function (serverHandlerId, serverHandlerTypeSpec, serverHandlerArg, eventHandler, cb, makeInBatch) {         
    var arg;
        
    // If ServerSession isn't available then throw the appropriate error
    if (!serverSession) {
      // If this flag is true then the Server Session creation is part of this network request
      // hence the server session id will be picked up in the Server via the BoxContext
      if (makeInBatch) {
        arg = ServerSession.addReq("makessc", cb, {});
      }
      else {
        throw new Error("ServerSession not currently available!");
      }
    } 
    else {
      arg = serverSession.addReq("makessc", cb);
    }    
          
    ServerSession.addEventHandler(serverHandlerId, eventHandler);
        
    // Fill out other arguments
    arg.scid = serverHandlerId;
    arg.scts = serverHandlerTypeSpec;
    arg.scarg = serverHandlerArg;
    
    // commit if we can
    cb.autoCommit();    
  };  
  
  /**
   * Remove a Server Session Handler from the Server.
   * 
   * @private
   *
   * @see baja.comm.makeServerHandler
   *
   * @param {String} serverHandlerId the id of the Server Session Handler to remove from the Server.
   * @param {baja.comm.Callback} the callback handler.
   */
  baja.comm.removeServerHandler = function (serverHandlerId, cb) {   
    // If ServerSession isn't available then throw the appropriate error
    if (!serverSession) {
      throw new Error("ServerSession not currently available!");
    }

    ServerSession.removeEventHandler(serverHandlerId);
        
    // Make Server Session Request
    var arg = serverSession.addReq("removessc", cb);
    
    // Fill out other arguments
    arg.scid = serverHandlerId;
    
    // commit if we can
    cb.autoCommit();    
  };
  
  /**
   * Make an RPC call to the Server Session Handler on the Server.
   * 
   * @private
   *
   * @see baja.comm.makeServerHandler
   *
   * @param {String} serverHandlerId the id of the Server Session Handler.
   * @param {String} serverHandlerKey the key of the request handler to invoke on the Server Session Handler.
   * @param serverHandlerArg the argument to pass into the request handler invoked on the Server Session Handler.
   *                         This argument is encoded to JSON.
   * @param {baja.comm.Callback} cb the callback handler.
   * @param {Boolean} [makeInBatch] set to true if the batch being used has the make present (hence the server session creation
   *                                is part of this network call).
   */  
  baja.comm.serverHandlerCall = function (serverHandlerId, serverHandlerKey, serverHandlerArg, cb, makeInBatch) {   
    var arg;
  
    // If ServerSession isn't available then it's request make be in this batch so
    // allow it anyway
    if (!serverSession) {
      // If this flag is true then the Server Session creation is part of this network request
      // hence the server session id will be picked up in the Server via the BoxContext
      if (makeInBatch) {
        arg = ServerSession.addReq("callssc", cb, {});
      }
      else {
        throw new Error("ServerSession not currently available!");
      }
    }
    else {
      arg = serverSession.addReq("callssc", cb);
    }
            
    // Fill out other arguments
    arg.scid = serverHandlerId;
    arg.sck = serverHandlerKey;
    arg.scarg = serverHandlerArg;
    
    // commit if we can
    cb.autoCommit(); 
  };  
  
  ////////////////////////////////////////////////////////////////
  // Server Session Event Polling
  //////////////////////////////////////////////////////////////// 
    
  /**  
   * Polls the ServerSession for Changes.
   *
   * @private
   *
   * @param {Object} [cb]  callback
   */
  baja.comm.poll = function (cb) {
  
    // Cancel any existing poll timers
    pollTicket.cancel();
    
    // Bail if we're stopping
    if (baja.isStopping()) {
      return;
    }
    
    // Flag indicating whether this was called from the poll timer
    var fromTimer = false;
    
    // Ensure we have a callback
    if (!cb) {
      cb = new Callback(baja.ok, function fail(err) {
        baja.error(err);
      });
      fromTimer = true;
    }
         
    // Convience for scheduling next poll
    function sch() {
      if (serverSession) {
        pollTicket.cancel();
        pollTicket = baja.clock.schedule(baja.comm.poll, pollRate);
      }
    }
    
    // Bail if we haven't got a serverSession
    if (!serverSession) {
      throw new Error("No Server Session available");
    }
    
    cb.addOk(function (ok, fail, resp) {  
      // Bail if we're stopping
      if (baja.isStopping()) {
        return;
      }

      var newOk = function () {      
        try { 
          var i;        
          for (i = 0; i < resp.length; ++i) {
            // Look up the event handler using the Server Side Component Id
            var handler = ServerSession.findEventHandler(resp[i].scid);
            if (typeof handler === "function") {
              // Handle the events
              handler(resp[i].evs);  
            }
          }
          
          ok();
        }
        finally {
          sch();
        }
      };
      
      var newFail = function (err) {      
        try {
          fail(err);
        }
        finally {
          sch();
        }
      };
     
      // Pre-emptively scan the BSON for Types that don't exist yet or have Contracts loaded
      // and request them in one network call            
      var unknownTypes = baja.bson.scanForUnknownTypes(resp);            
      if (unknownTypes.length > 0) {
        var importBatch = new baja.comm.Batch();
        baja.importTypes({
          "typeSpecs": unknownTypes, 
          "ok": newOk, 
          "fail": newFail,
          "batch": importBatch
        });
                    
        if (fromTimer) {
          // If this was called from a timer then we can commit asynchonously.  
          importBatch.commit();
        }
        else {
          // If this was called from a direct invocation (i.e. a Space Sync) then it must 
          // run synchronously so it doesn't cause any problems with the batch end callback. 
          importBatch.commitSync();
        }
      }
      else {
        newOk();
      }
    });
     
    cb.addFail(function (ok, fail, err) {
      // TODO: Could make this more robust by explicity checking for server id not existing?
      if (fromTimer) {
        // Delay raising this error by a second (just in case we're trying to shutdown at the time)...
        baja.clock.schedule(function () {
          // If there's an error from a timer poll then something must have screwed up 
          // really badly...
          try {
            fail(err);
          }
          finally {
            serverCommFail(err);
          }
        }, 1000);
      }
      else {
        // If not from a timer then just fail as normal
        fail(err);
      }
    });
    
    serverSession.addReq("pollchgs", cb);
    
    // Commit if we're able too
    cb.autoCommit();
  };
  
  ////////////////////////////////////////////////////////////////
  // Comms Start and Stop
  //////////////////////////////////////////////////////////////// 
    
  /**
   * Start the Comms Engine.
   * <p>
   * This is called to start BajaScript.
   *
   * @private
   *
   * @param {Object} obj the Object Literal for the method's arguments.
   * @param {Function} [obj.started] function called once BajaScript has started.
   * @param {Array} [obj.typeSpecs] an array of type specs (moduleName:typeName) to import
   *                                on start up. This will import both Type and Contract information.
   * @param {Function} [obj.commFail] function called if the BOX communications fail.
   * @param {Boolean} [obj.navFile] if true, this will load the nav file for the user on start up.
   */ 
  baja.comm.start = function (obj) {          
    var started = obj.started || baja.ok,
        typeSpecs = obj.typeSpecs || [],
        batch = new baja.comm.Batch();

    commFail = obj.commFail || commFail;
    
    // Get the System Properties...
    var propsCb = new Callback(function ok(props) {     
      baja.initFromSysProps(props);
    },
    baja.fail, batch);
    propsCb.addReq("sys", "props", {});
        
    // Make sure we get the Contract for the root of the Station
    if (!typeSpecs.contains("baja:Station")) {
      typeSpecs.push("baja:Station");
    }
    if (!typeSpecs.contains("baja:Link")) {
      typeSpecs.push("baja:Link");
    }
    if (!typeSpecs.contains("baja:StatusValue")) {
      typeSpecs.push("baja:StatusValue");
    }
        
    // If specified, load the Nav File on start up
    if (obj.navFile) {
      baja.nav.navfile.load({batch: batch});
    }
    
    // Import all of the requested Type Specification
    baja.importTypes({
      "typeSpecs": typeSpecs, 
      "ok": baja.ok, 
      "fail": baja.fail, 
      "batch": batch
    });
    
    // Make the ServerSession
    baja.comm.makeServerSession(new Callback(baja.ok, baja.fail, batch)); 
    
    // Once we have a ServerSession, we can start off our connection to
    // to the local Component Space
    baja.station.init(batch); 
    
    // Call this once everything has finished
    batch.addCallback(started);
    
    // Commit all comms messages in one request
    batch.commit(); 
  };
  
  /**
   * Stop the Comms Engine.
   *
   * @private
   *
   * @param {Object} obj the Object Literal for the method's arguments.
   * @param {Function} [obj.stopped]  function to invoke after the comms have stopped.
   * @param {Function} [obj.preStop] function to invoke just before the comms have stopped.
   */
  baja.comm.stop = function (obj) {  
    var postStopFunc = obj.stopped || baja.ok;
      
    // Cancel the Ticket
    pollTicket.cancel();
    
    // Delete the ServerSession if it exists
    if (serverSession) {
      var cb = new Callback(postStopFunc, baja.ok);
      serverSession.addReq("del", cb);
      cb.commitSync();
      
      serverSession = null;
    }
          
      // TODO: Need to unsubscribe Components
  };        
    
  ////////////////////////////////////////////////////////////////
  // Registry Channel Comms
  //////////////////////////////////////////////////////////////// 
  
  /** 
   * Makes a network call for loading Type information.
   *
   * @private
   *
   * @param {String|Array} types  the TypeSpecs needed to be resolved.
   * @param {Boolean} encodeContracts encode Contracts for the given Types.
   * @param {baja.comm.Callback} cb callback handler. If the callback had a
   *                             batch object originally defined then the network call
   *                             will be made.
   * @param {Boolean} async true if this network should be made asynchronously.
   */
  baja.comm.loadTypes = function (types, encodeContracts, cb, async) {        
    if (typeof types === "string") {
      types = [types];
    }
          
    // Add a request message to the Builder
    cb.addReq("reg", "loadTypes", { t: types, ec: encodeContracts });
    
    if (!cb.isOrgBatchDef()) {
      if (async) {
        cb.commit();
      }
      else {
        cb.commitSync();
      }
    }
  };
  
  /** 
   * Makes a network call for loading Contract information.
   *
   * @private
   *
   * @param {String} typeSpec  the TypeSpec the Contract information is going to be fetched for.
   * @param {baja.comm.Callback} cb callback handler. If the callback had a
   *                             batch object originally defined then the network call
   *                             will be made.
   * @param {Boolean} async true if this network should be made asynchronously.
   */
  baja.comm.loadContract = function (typeSpec, cb, async) {            
      
    // Add a request message to the Builder
    cb.addReq("reg", "loadContract", typeSpec);
    
    if (!cb.isOrgBatchDef()) {
      if (async) {
        cb.commit();
      }
      else {
        cb.commitSync();
      }
    }
  };
  
  /** 
   * Makes a network call for getting concrete Type information.
   *
   * @private
   *
   * @param {String} typeSpec  the TypeSpec used for querying the concrete types.
   * @param {baja.comm.Callback} cb the callback handler. If the callback had a
   *                                batch object originally defined then the network call
   *                                will be made.
   */
  baja.comm.getConcreteTypes = function (typeSpec, cb) {            
      
    // Add a request message to the Builder
    cb.addReq("reg", "getConcreteTypes", typeSpec);
    
    // Commit if we're able too...
    cb.autoCommit();
  };

  ////////////////////////////////////////////////////////////////
  // ORD Channel Comms
  ////////////////////////////////////////////////////////////////
  
  /** 
   * Resolve an ORD.
   *
   * @private
   *
   * @param {baja.Ord} ord  the ORD to be resolved.
   * @param object  base Object.
   * @param {Object} cb  the callback handler.
   * @param {Object} options Object Literal options.
   */
  baja.comm.resolve = function (ord, object, cb, options) {             
            
    var bd = { // ORD Resolve Message Body
      o: ord.toString(), // ORD
      bo: object.getNavOrd().toString() // Base ORD
    };
    
    var cursor = options.cursor;
    
    // If cursor options are defined then use them...
    if (cursor) {
      bd.c = {
        of: cursor.offset,
        lm: cursor.limit 
      };
    }
          
    // Add Request Message
    cb.addReq("ord", "resolve", bd);
    
    // Commit if we're able too
    cb.autoCommit();
  }; 
  
  /** 
   * Resolve Cursor data for a Collection (or Table).
   *
   * @private
   *
   * @param {Object} bd  the body of the Comms message.
   * @param {baja.comm.Callback} cb  the callback handler.
   * @param {Object} options Object Literal options.
   */
  baja.comm.cursor = function (bd, cb, options) {
    bd.of = options.offset;
    bd.lm = options.limit;
      
    // Add Request Message
    cb.addReq("ord", "cursor", bd);
    
    // Commit if we're able too
    cb.autoCommit();
  }; 

  ////////////////////////////////////////////////////////////////
  // Sys Channel Comms
  ////////////////////////////////////////////////////////////////  
  
  /** 
   * Makes a network call loading Lexicon information.
   *
   * @private
   *
   * @param {String} module the module name of the lexicon.
   * @param {baja.comm.Callback} cb callback handler. If the callback had a
   *                             batch object originally defined then the network call
   *                             will be made.
   * @param {Boolean} async true if this network should be made asynchronously.
   */
  baja.comm.lex = function (module, cb, async) {            
      
    // Add a request message to the Builder
    cb.addReq("sys", "lex", module);
    
    if (!cb.isOrgBatchDef()) {
      if (async) {
        cb.commit();
      }
      else {
        cb.commitSync();
      }
    }
  };
  
  /** 
   * Makes a network call for the nav file.
   *
   * @private
   *
   * @param {baja.comm.Callback} cb callback handler. If the callback had a
   *                             batch object originally defined then the network call
   *                             will be made.
   */
  baja.comm.navFile = function (cb) {            
    // Add a request message to the Builder
    cb.addReq("sys", "navFile", {});
    
    // commit if we can
    cb.autoCommit();
  };
  
  /** 
   * Make a network call with the specified error. This will Log the error
   * in the Server.
   *
   * @private
   *
   * @param {String} error the error message to be logged in the Server.
   */
  baja.comm.error = function (error) {   
    // Make a network call but don't report back any errors if this doesn't work
    var cb = new Callback(baja.ok, baja.ok);
    
    // Add a request message to the Builder
    cb.addReq("sys", "error", error);
    
    // commit if we can
    cb.commit();
  };
  
}(baja, BaseBajaObj));
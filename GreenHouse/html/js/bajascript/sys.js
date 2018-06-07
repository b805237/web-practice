/**
 * @license Copyright 2010, Tridium, Inc. All Rights Reserved.
 */

/**
 * Core System Architecture for BajaScript including Type and Registry System.
 *
 * @author Gareth Johnson
 * @version 1.0.0.0
 */

//JsLint options (see http://www.jslint.com)
/*jslint rhino: true, onevar: false, plusplus: true, white: true, undef: false, nomen: false, 
  eqeqeq: true, bitwise: true, regexp: false, newcap: true, immed: true, strict: false, 
  indent: 2, vars: true, continue: true */

/*global setTimeout, clearTimeout, setInterval, clearInterval, bajaJsPrint*/ 

/**
 * @class BaseBajaObj
 * <p>
 * The base class for all BajaScript Objects.
 */
var BaseBajaObj = function () {
  "use strict";
};

/**
 * @namespace the core BajaScript namespace.
 */
var baja = new BaseBajaObj();

////////////////////////////////////////////////////////////////
// Very common/generic methods
//////////////////////////////////////////////////////////////// 

(function common(baja, BaseBajaObj) {
  // Use ECMAScript 5 Strict Mode
  "use strict";
      
  /**
   * Indicates whether some other object is equal to this one.
   *
   * @param {Object} obj the reference object with which to compare.
   *
   * @returns {Boolean} true if this object is the same as the obj argument; false otherwise.
   */
  BaseBajaObj.prototype.equals = function (obj) {
    return this === obj;
  };

  /**
   * Return the inner value of object.
   * <p>
   * By default the object's instance is returned.
   *
   * @returns the inner value of the object or just the object's instance.
   */
  BaseBajaObj.prototype.valueOf = function () {
    return this;
  };

  ////////////////////////////////////////////////////////////////
  // Extra Function Methods
  //////////////////////////////////////////////////////////////// 

  /**
   * Extends an Object by setting up the prototype chain.
   * <p>
   * This method can have a Function or Object passed in as an argument.
   * If a Function is passed in, 'new' will be called on it to create an Object.
   * The new Object will then be set on the target Function's prototype.
   *
   * @param {Function|Object}  Parent  
   * @returns {Function}  the instance Function.
   */
  Function.prototype.$extend = function (Parent) {
    // So the 'super' class can be tracked, a '$super' property is
    // created and attached to the Function instance
    if (typeof Parent === 'function') {
      this.prototype = new Parent();
      this.$super = Parent;
    }
    else {
      this.prototype = Parent;
      this.$super = Parent.constructor;
    }
    this.prototype.constructor = this;
    return this;
  };

  ////////////////////////////////////////////////////////////////
  // Extra Array Methods
  //////////////////////////////////////////////////////////////// 

  if (typeof Array.prototype.contains !== "function") {
    if (typeof Array.prototype.indexOf === "function") {
      /** 
       * @ignore - get JsDoc to ignore this symbols so it's not picked up accidently.
       */
      Array.prototype.contains = function (o) {
        return this.indexOf(o) > -1;
      };
    }
    else {
      Array.prototype.contains = function (o) {
        var i;
        for (i = 0; i < this.length; i++) {
          if (this[i] === o) {
            return true;
          }
        }
        return false;
      };
    }
  }
 
}(baja, BaseBajaObj));

////////////////////////////////////////////////////////////////
// BajaScript
//////////////////////////////////////////////////////////////// 

(function bajaNamespace(baja, BaseBajaObj) {
  // Use ECMAScript 5 Strict Mode
  "use strict";
  
  ////////////////////////////////////////////////////////////////
  // Baja
  //////////////////////////////////////////////////////////////// 
  
  /**
   * BajaScript's version number (maj.min.build.patch).
   */
  baja.version = "1.0.0.0";
  
  var bsLexicons = {},           // BajaScript Lexicons
      bsRegStorage = null,       // BajaScript Registry Storage
      bsClockTimeouts = {},      // BajaScript ticket timeouts
      bsClockIntervals = {};     // BajaScript ticket intervals

  ////////////////////////////////////////////////////////////////
  // Debug
  //////////////////////////////////////////////////////////////// 

  (function debug() {
  
    /**
     * Print a message to BajaScript's debug output followed by a newline. 
     * By default just looks for a <code>bajaJsPrint</code> global function and 
     * passes the message to that.
     *
     * @param {String} msg  the message to output.
     * 
     * @returns baja
     */
    baja.outln = function (msg) {
      // If BajaScript has stopped then don't output anything else...
      if (baja.isStopping()) {
        return this;
      }
      
      if (typeof bajaJsPrint === "function") {
        bajaJsPrint(msg);
      }
      return this;
    };
    
    /**
     * Attempt to clear BajaScript's debug output.
     * 
     * @returns baja
     */
    baja.clearOut = function () {
      return this;
    };
       
    /**
     * Print out the error to the specified line printer function. This gets called
     * by the default error handler.
     * 
     * @name baja.printError
     * @private
     * @inner
     * 
     * @see baja.error
     * 
     * @param {Error} e the error to be printed.
     * @param {Function} print the print function to be called each time a line of 
     *                         the error is to be printed out.
     */
    function printError(e, print) {      
      var errorMsg = e.name + ": ";
      
      // Some JavaScript engines give errors a nice full stack trace...
      if (e.stack) {
        
        if (e.message && 
            typeof e.stack === "string" &&
            e.stack.indexOf(errorMsg + e.message) !== 0) {
          print(errorMsg + e.message);
        }

        print(e.stack);
        return;
      }
  
      if (e.message) {
        print(errorMsg + e.message);
      }
      else {
        print(errorMsg + e);
      }
  
      // Add a try/catch just in case because ECMAScript 5 disallows access to the callee and caller
      try {
        // Cater for IE and Safari and try to print out a pseudo stack trace...
        var func,
            fn,
            args = arguments, 
            stackSize = 0, 
            maxStack = baja.stackTraceLimit || 20,
            maxFuncLength = 200;
            
        if (args.callee && args.callee.caller) {
          func = args.callee.caller;
          while (typeof func === "function" && stackSize < maxStack) {
            fn = func.name;
            if (!fn) {
              // Attempt to format the function into some sort of stack trace...
              fn = func.toString().replace(/[\r\n]/g, " ");
              
              // Don't allow the string to get too big...
              if (fn.length > maxFuncLength) {
                fn = fn.substring(0, maxFuncLength) + "...";
              }
            }

            print(" at " + fn);
            func = func.caller;
            stackSize++;
          }
          if (stackSize >= maxStack) {
            print("Stack trace limit exceeded (" + maxStack + ")");
          }
        }
      }
      catch (ignore) {
      }
    }
  
    /**
     * Print an error message in BajaScript's debug output. In IE/Safari the
     * length of the stack trace will be limited to 20 records - you can
     * change this by setting <code>baja.stackTraceLimit</code>.
     * <p>
     * By default, this method calls {@link baja.printError} using 
     * {@link baja.outln} as the printer function.
     *
     * @param e  the error to output.
     * 
     * @returns baja
     */    
    baja.error = function (e) {
      if (baja.isStopping()) {
        return this;
      }
    
      // Make sure we have an Error object
      e = e instanceof Error ? e : new Error(e);
      
      // Print the error out using baja.outln. 
      printError(e, baja.outln);
      
      // If this isn't a Server error then attempt to also log it in the Server (if specified)
      if (baja.isStarted() && 
          baja.isLogClientErrorsInServer() && 
          e && !(e instanceof baja.comm.ServerError)) {
        var error = "";
        printError(e, function (line) {
          error += line + "\n";
        });  
        
        // Make the network call to log the error
        baja.comm.error(error);
      }
      
      return this;
    };
    
    baja.stackTraceLimit = 20;
  }());
  
  ////////////////////////////////////////////////////////////////
  // Baja Util
  //////////////////////////////////////////////////////////////// 
  
  /**
   * The global default fail callback function.
   * <p>
   * Throughout BajaScript there are places where network calls may be made. In one of these cases,
   * a developer has the option of specifying a 'fail' callback. If the fail callback isn't specifed
   * by the developer, it will default back to this function.
   * 
   * @see baja.ok
   */
  baja.fail = function (err) {        
    // Output error to the BajaScript Console...
    err = err || new Error();
    baja.error(err instanceof Error ? err : new Error(err));
  };
  
  /**
   * The global default ok callback function.
   * <p>
   * Throughout BajaScript there are places where network calls may be made. In one of these cases,
   * a developer has the option of specifying an 'ok' callback. If the ok callback isn't specifed
   * by the developer, it will default back to this function.
   *
   * @see baja.fail
   */
  baja.ok = function () {
  };
  
  /**
   * A function that does nothing (noop = no-operation).
   *
   * @name baja.noop
   * @function
   */
  baja.noop = baja.ok;
      
  /**
   * @class Lexicon is a map of name/value pairs for a specific locale.
   *
   * @see baja.lex
   *
   * @name Lexicon
   * @extends BaseBajaObj
   * @inner
   * @public
   */   
  var Lexicon = function (moduleName, data) {  
    baja.strictAllArgs([moduleName, data], [String, Object]);
    this.$moduleName = moduleName;
    this.$data = data;
  }.$extend(BaseBajaObj);

  /**
   * Return a value from the Lexicon for a given key.
   * <p>
   * The argument for this method can be either a String key or an Object Literal.
   *
   * @see baja.lex
   *
   * @param {Object|String} obj the Object Literal that contains the method's arguments or a String key.
   * @param {String} obj.key the key to look up.
   * @param {String} obj.def the default value to return if the key can't be found.
   *                         By default this is null.
   * @param {Array|String} obj.args arguments used for String formatting.
   * 
   * @returns {String} the value for the Lexicon or return def if can't be found.
   */
  Lexicon.prototype.get = function (obj) {
    obj = baja.objectify(obj, "key");
    obj.def = baja.def(obj.def, null);

    var val = this.$data.hasOwnProperty(obj.key) ? this.$data[obj.key] : obj.def;

    // TODO: Niagara uses Java's MessageFormat that does more than this. For now we'll stick
    // with this use case as this should cover everything.

    // If we have some message formatting arguments them use them
    if (obj.args && typeof val === "string") {
      var args = obj.args;
      if (args.constructor !== Array) {
        args = [args];
      }

      // Replace {number} with value from args
      var regex = /\{[0-9]+\}/g;
      val = val.replace(regex, function (entry) {
        var i = parseInt(entry.substring(1, entry.length - 1), 10);
        return args[i] !== undefined ? args[i] : entry;
      });
    }

    return val;
  };

  /**
   * Return the Lexicon's module name.
   *
   * @returns {String}
   */
  Lexicon.prototype.getModuleName = function () {
    return this.$moduleName;
  };
  
  (function util() {
  
    /**
     * Strict Argument Check.
     * <p>
     * Checks a given argument to ensure it's not undefined. If a Constructor is specified
     * then it matches the argument's Constructor against it.
     * <pre>
     * // Example...
     * baja.strictArg(arg1, String);
     * </pre>
     * <p>
     * The second argument can also be a String TypeSpec or a Type Object. This will ensure the 
     * argument has the correct TypeSpec.
     * <pre>
     * // Example...
     * baja.strictArg(arg1, "control:NumericWritable");
     * 
     * ...or...
     *
     * baja.strictArg(arg1, baja.lt("control:NumericWritable")); 
     * </pre>
     *
     * @private
     * 
     * @param arg  the argument being tested.
     * @param {Function|String|Type} [ctor]  optional Constructor function used to test the argument against. Can also be 
     *                                       a String TypeSpec or a Type Object.
     * @param {String} [errMsg] optional message to specify if argument check fails.
     * @returns arg
     */
    baja.strictArg = function (arg, ctor, errMsg) {
      if (arg === undefined) {
        if (errMsg) {
          throw new Error(errMsg);
        } else {
          var err = "Invalid argument (undefined)";
          if (ctor) {
            err += ". Expected " + ctor.name;
          }      
          throw new Error(err);
        }
      }
      // Null arguments are acceptable (just like Java)
      else if (arg === null) {
        return arg;
      }
  
      // Bail any type checking if we don't have a valid Constructor
      if (ctor === undefined || ctor === null) {
        return arg;
      }
      
      var typeOfCtor = typeof ctor;
      
      // Do the type check
      if (typeOfCtor === "function" && (arg.constructor === ctor || arg instanceof ctor)) {
        return arg;
      }
  
      // Handle if the ctor is a TypeSpec (String TypeSpec or Type Object)...
      var type;
      if (typeOfCtor === "string" || typeOfCtor === "object") {
        type = baja.lt(ctor);
        if (!baja.hasType(arg)) {
          throw new Error("Invalid argument. Expected Type: " + type);
        }
        if (!arg.getType().is(type)) {
          throw new Error("Invalid argument. Type " + arg.getType() + " is not expected Type: " + type);
        }
        return arg;
      }
    
      // Ensure we have a valid names for the Constructors...
      var nm = ctor.name;
      if (!nm && ctor.$name) {
        nm = ctor.$name;
      }
  
      var cnm = arg.constructor.name;
      if (!cnm && arg.constructor.$name) {
        cnm = arg.constructor.$name;
      }
  
      throw new Error("Invalid argument type. Expected " + nm + ", received " + cnm + " instead");
    };
      
    /**
     * Strict Arguments Check.
     * <p>
     * Checks all of the given arguments to ensure they're not undefined. An array of Constructors
     * is passed in to ensure they match the argument's Constructors.
     * <pre>
     * // Example...
     * baja.strictAllArgs([arg1, arg2], [String, Number]);
     * </pre>
     * Please note, the Constructors array can also hold a Type used for comparison 
     * (in the form of either a String or Type).
     *
     * @private
     *
     * @see baja.strictArg
     *
     * @param {Array} args  an array of arguments being tested.
     * @param {Array} ctors  an array of Constructors being used to test against the arguments.
     */
    baja.strictAllArgs = function (args, ctors) {
      if (ctors.length !== args.length) {
        throw new Error("Invalid number of arguments. Expected " + ctors.length +
            ", received " + args.length + " instead.");
      }
      
      var i;
      for (i = 0; i < args.length; i++) {
        baja.strictArg(args[i], ctors[i]);
      }
    };
              
    /**
     * Define a default value for possibly undefined variables.
     *
     * @private
     *
     * @param val the value to be tested.
     * @param defVal the default value to be returned if the value is undefined.
     * @returns the default value if the value is undefined.
     */
    baja.def = function (val, defVal) {
      return val === undefined ? defVal : val;
    };
    
    // Create local for improved minification
    var strictArg = baja.strictArg,
        strictAllArgs = baja.strictAllArgs,
        bajaDef = baja.def;
  
    /**
     * A general utility method that tries to prevents a function from running
     * more often than the specified interval. Due to the vagaries of Javascript 
     * time management you may see the occasional drop of a few milliseconds but 
     * on the whole execution of the given function should not be permitted more
     * than once in the specified interval.
     * 
     * <p>If the function is called before the interval is up, it will still be
     * executed once the remainder of the interval elapses - it will not be
     * cancelled.
     * 
     * <p>However, if the function is called <i>multiple times</i> before the 
     * interval has elapsed, only the <i>last</i>function call will execute -
     * calls prior to that one will be cancelled.
     * 
     * <p>The function passed in will be run <i>asynchronously</i> via
     * <code>setTimeout()</code>, so if you wish to process the results of the
     * function call, you must do so via callback.
     *  
     * @param {Function} func a function to be executed - must take no parameters
     * and may optionally return a value.
     * @param {Object} obj an object literal with additional parameters -
     * also, passing a Number in as the second parameter will use that as
     * <code>obj.interval</code> and the other params will be ignored/false.
     * @param {Number} [obj.interval] the interval in milliseconds - the 
     * function will be prevented from executing more often than this (if 
     * omitted, 100ms).
     * @param {Function} [obj.ok] an optional callback function that will
     * handle the return value from the throttled function.
     * @param {Function} [obj.fail] an optional fail callback function that 
     * will be called if the function throws any exceptions.
     * @param {Boolean} [obj.drop] if drop is set to true, then additional
     * function invocations that occur before the interval is up will be simply
     * ignored rather than queued to execute at the end of the interval period.
     * @returns {Function} a throttled function that can be executed the same
     * way as the original function.
     */
    baja.throttle = function (func, obj) {
      obj = baja.objectify(obj, 'interval');
  
      var interval = obj.interval || 100,
      ok = obj.ok || baja.ok,
      fail = obj.fail || baja.fail,
      drop = obj.drop;
  
      var mustWaitUntil = 0,
      waitingForTicket = baja.clock.expiredTicket;
  
      function getTimeToWait() {
        var now = baja.clock.ticks(),
        timeToWait = mustWaitUntil - now;
        if (timeToWait <= 0) {
          mustWaitUntil = now + interval;
        }
        return timeToWait;
      }
  
      return function () {
        var that = this,
        args = Array.prototype.slice.call(arguments),
        funcToRun,
        timeToWait = getTimeToWait();
  
        if ((timeToWait > 0) && drop) {
          return;
        }
  
        funcToRun = function () {
          try {
            ok(func.apply(that, args));
          }
          catch (err) {
            fail(err);
          }
          finally {
            // once the function is done executing, always reset the next time it
            // will be allowed to execute again
            getTimeToWait();
          }
        };
  
        // don't allow function executions to pile up - only have one waiting at a time
        waitingForTicket.cancel();
  
        if (timeToWait <= 0) {
          baja.runAsync(funcToRun);
        } 
        else if (!drop) {
          waitingForTicket = baja.clock.schedule(funcToRun, timeToWait);
        }
      };
    };
  
    /**
     * Test an Object to see if it's a Baja Object and has the 'getType' function.
     * <p>
     * Please note: this test excludes objects that may extend baja.Slot.
     *
     * @param {Object} obj  the Object to be tested.
     * @param {String} [type] the type or (String type specification - module:typeName) to test object against. 
     *                            Please note, Type.is(...) is used and not equals.
     *
     * @returns {Boolean} true if the given Object is a proper BajaScript Object
     */
    baja.hasType = function (obj, type) {
      if (obj === null || obj === undefined) {
        return false;
      }
      if (obj && typeof obj === "object" && obj instanceof baja.Slot) {
        return false;
      }
  
      if (typeof obj.getType === "function") {
        if (type) {
          return obj.getType().is(type);
        }
        return true;
      }
      else {
        return false;
      }
    };
  
    /**
     * This is a conveniance method used for working with functions that take 
     * an Object Literal as an argument.
     * <p>
     * This method always ensures an Object is returned so its properties can be
     * further validated.
     * <p>
     * In some cases, the function may take an object literal or a single argument.
     * If the function can take a single argument that isn't an Object literal, then 
     * the 'propName' can be specified. If this is specified, an Object is created and
     * the value is assigned to the Object with the specified property name.
     * <pre>
     *   // For example, this function can take an Object literal or a Number
     *   function foo(obj) {
     *     obj = baja.objectify(obj, "num");
     *     
     *     // 'obj' will always point to an Object. We can now test and work with 'num'...
     *     baja.strictArg(obj.num, Number);
     *   }
     *
     *   // Both method invocations are valid...
     *   foo(23.4); 
     *   foo({num: 23.4});
     * </pre>
     *
     * @private
     *
     * @param obj  the Object literal or a value to be added onto an Object if propName is specified.
     * @param {String} [propName]  if the object isn't an Object, an Object is created and the value is assigned
     *                             to the object with this property name.
     *
     * @returns {Object} an Object
     */
    baja.objectify = function (obj, propName) {
      if (!(obj === undefined || obj === null)) {
        if (obj.constructor === Object) {
          return obj;
        }
        else if (typeof propName === "string") {
          var o = {};
          o[propName] = obj;
          return o;
        }
      }
      return {};
    };
    
    /**
     * Returns a Lexicon Object for a given module. The locale will be whatever the current
     * user is set too.
     * <p>
     * Please note, if BajaScript has Web Storage enabled, the Lexicon will be permanently cached.
     * <p>
     * If the Lexicon for the given module isn't loaded then a network call will be made.
     * <pre>
     *   // Get a value from a Lexicon. A synchronous network call will be made if the Lexicon
     *   // isn't available locally.
     *   baja.lex("bajaui").get("dialog.ok");
     *
     *   // Get a value from a Lexicon. An asynchronous network call will be made if the Lexicon
     *   // isn't available locally.
     *   baja.lex({
     *     module: "bajaui",
     *     ok: function (lex) {
     *       lex.get("dialog.ok");
     *     }
     *   });
     * </pre>
     *
     * @see Lexicon
     *
     * @returns {Object}
     */
    baja.lex = function (obj) {
      obj = baja.objectify(obj, "module");
      
      var module = obj.module,
          cb = new baja.comm.Callback(obj.ok, obj.fail, obj.batch),
          lx;
  
      // If already loaded then return the lexicon
      if (bsLexicons.hasOwnProperty(module)) {
        lx = bsLexicons[module];
        cb.ok(lx);
        return lx;
      }
  
      // If the original ok handler wasn't defined then make a synchronous network call
      var async = typeof obj.ok === "function";
  
      // Make a network call to get the lexicon
      try {
  
        // Add intermediate callback
        cb.addOk(function (ok, fail, lexData) {      
          // If available, store this in web storage
          if (bsRegStorage) {
            bsRegStorage.lexicons[module] = lexData;
          }
  
          // Create the Lexicon and add it to our cached list
          lx = new Lexicon(module, lexData);
          bsLexicons[module] = lx;
          ok(lx);
        });
  
        baja.comm.lex(module, cb, async);
      }
      catch (err) {
        cb.fail(err);
      }
  
      return lx;
    };
    
    /**
     * Run the specified Function asynchronously.
     *
     * @param {Function} fn  the Function to run asynchronously.
     */
    baja.runAsync = function (fn) {
      baja.clock.schedule(fn, 0);
    };
  
    (function iterate() {
      function iterateArray(arr, start, end, func) {
        var i, result;
  
        for (i = start; i < end; i++) {
          result = func(arr[i], i);
          if (result !== undefined) {
            return result;
          }
        }
      }
  
      function iterateCustomNext(obj, func, nextFunc) {
        while (obj) {
          var result = func(obj);
          if (result !== undefined) {
            return result;
          } else {
            obj = nextFunc(obj);
          }
        }
      }
  
      function iterateJsProperties(obj, func) {
        var name, result;
        for (name in obj) {
          if (obj.hasOwnProperty(name)) {
            result = func(obj[name], name);
            if (result !== undefined) {
              return result;
            }
          }
        }
      }
  
      function iterateByIndex(start, end, func) {
        var i, result;
  
        for (i = start; i < end; i++) {
          result = func(i);
          if (result !== undefined) {
            return result;
          }
        }
      }
  
      /**
       * A iteration general utility method that performs the given function on every JavaScript 
       * property in the given cursor or Javascript array. This function can be called 
       * with a variety of parameter configurations.
       * <pre>
       * baja.iterate(array, function (arrayElement, arrayIndex))
       * 
       * baja.iterate(array, startIndex, function (arrayElement, arrayIndex))
       * 
       * baja.iterate(array, startIndex, endIndex, function (arrayElement, arrayIndex))
       * 
       * baja.iterate(numberOfTimesToIterate, function (index))
       * 
       * baja.iterate(iterationStartIndex, iterationEndIndex, function (index))
       *
       * baja.iterate(object, function (objectJsProperty, objectJsPropertyName))
       * 
       * baja.iterate(object, function doIterate(object), function getNext(object))
       * </pre>
       * 
       * <p><code>iterate()</code> is compatible with arrays, but <i>not</i> with
       * <code>arguments</code> objects - pass in
       * <code>Array.prototype.slice.call(arguments)</code> instead.
       *
       * <p>In the last case with the <code>doIterate</code> and 
       * <code>getNext</code> functions, <code>doIterate</code> performs the
       * iterative action on the object, and <code>getNext</code> returns the
       * next object to iterate (this will be passed directly back into
       * <code>doIterate</code>). This is handy for walking up prototype chains,
       * supertype chains, component hierarchies, etc.
       * 
       * <p>In all cases, if the function being executed ever returns a value
       * other than <code>undefined</code>, iteration will be stopped at that 
       * point and <code>iterate()</code> will return that value.
       * 
       * <p>For invocations of <code>iterate()</code> that include start or end
       * indexes, note that start indexes are inclusive and end indexes are
       * exclusive (e.g. <code>iterate(2, 5, function (i) { baja.outln(i); })</code>
       * would print <code>2,3,4</code>).
       * 
       * @returns any non-undefined value that's returned from any function 
       * or Cursor.
       */
      baja.iterate = function () {
        var args = arguments,
        arg0 = args[0],
        arg1 = args[1],
        arg2 = args[2],
        arg3 = args[3],
        typeString = Object.prototype.toString.call(arg0);
  
        if (arg0 === undefined || arg0 === null) {
          throw new Error("undefined passed to baja.iterate()");
        }
  
        if (typeString === '[object Array]') {
          switch (arguments.length) {
          case 2: //iterate(array, function (arrayElement, arrayIndex))
            return iterateArray(arg0, 0, arg0.length, arg1);
  
          case 3: //iterate(array, startIndex, function (arrayElement, arrayIndex))
            return iterateArray(arg0, arg1, arg0.length, arg2);
  
          case 4: //iterate(array, startIndex, endIndex, function (arrayElement, arrayIndex))
            return iterateArray(arg0, arg1, arg2, arg3);
          } 
        } 
        else if (typeString === '[object Object]') {   
          if (arg0 instanceof baja.Cursor) {
            //bajaScriptCursor.each(function ())
            return arg0.each(arg1);
          }      
          else if (typeof arg2 === 'function') {
            //iterate(object, function doIterate(object), function getNext(object))
            return iterateCustomNext(arg0, arg1, arg2);
          } 
          else {
            //iterate(object, function (objectJsProperty, objectJsPropertyName))
            return iterateJsProperties(arg0, arg1);
          }
        }   
        else if (typeString === '[object Number]') {
          if (typeof arg1 === 'number') {
            //iterate(iterationStartIndex, iterationEndIndex, function (index))
            return iterateByIndex(arg0, arg1, arg2);
  
          } 
          else {
            //iterate(numberOfTimesToIterate, function (index))
            return iterateByIndex(0, arg0, arg1);
          }
        } else if (typeString === '[object Arguments]') {
          throw new Error("Arguments object not iterable (pass through " + 
          "Array.prototype.slice first)");
        }
  
        throw new Error(arg0 + " is not iterable");
      };
    }());
        
    ////////////////////////////////////////////////////////////////
    // Ordered Map and Cursor - used as basis for ComplexSlotMap
    //////////////////////////////////////////////////////////////// 
    
    var notImplementedStr = "Not implemented";
    
    /** 
     * @class A generic cursor used for iteration.
     */
    baja.Cursor = function () {
    };
        
    /**
     * Return the current item.
     * 
     * @returns the cursor value (null if none available).
     */
    baja.Cursor.prototype.get = function () {
      throw new Error(notImplementedStr);
    };
    
    /**
     * Iterate through the Cursor and call 'each' on every item.
     * 
     * @param {Function} func function called on every iteration with the 'value' being used as an argument.
     */
    baja.Cursor.prototype.each = function (func) {
      throw new Error(notImplementedStr);
    };
    
    /** 
     * @class An asynchonrous generic cursor used for iteration.
     * <p>
     * An Async Cursor may fetch its results asynchronously (i.e. across a network).
     *
     * @extends baja.Cursor
     */
    baja.AsyncCursor = function () {
    }.$extend(baja.Cursor);
        
    /** 
     * @class A generic Synchronous cursor used for iteration.
     *
     * @extends baja.Cursor
     */
    baja.SyncCursor = function () {
    }.$extend(baja.Cursor);
    
    /**
     * Advance cursor and return true if successful.
     * 
     * @returns {Boolean}
     */
    baja.SyncCursor.prototype.next = function () {
      throw new Error(notImplementedStr);
    };
        
    /** 
     * @class A filtered cursor used for iteration.
     * <p>
     * This Cursor is a generic Cursor used for iteration in a {@link baja.OrderedMap}.
     *
     * @see baja.OrderedMap
     *
     * @name baja.FilterCursor
     * @extends baja.SyncCursor
     */
    baja.FilterCursor = function (context, orderedMap) {
      baja.FilterCursor.$super.apply(this, arguments);
      this.$context = context;
      this.$orderedMap = orderedMap;
      this.$keys = orderedMap && orderedMap.getKeys();
      this.$filter = null;
      this.$index = -1;
    }.$extend(baja.SyncCursor);

    function filterNext(cursor) {
      if (cursor.$index < cursor.$keys.length) {
        ++cursor.$index;
        return cursor.$index !== cursor.$keys.length;
      }
      else {
        return false;
      }
    }
    
    /**
     * Advance cursor and return true if successful.
     *
     * @function
     * 
     * @returns {Boolean}
     */
    baja.FilterCursor.prototype.next = function () {
      var that = this;
    
      if (!that.$filter) {
        return filterNext(this);
      }
      else {
        // If a Constructor has been passed in then keep iterating
        // until we find a matching element
        do {
          if (!filterNext(this)) {
            return false;
          }
        }
        while (!that.$filter.call(that.$context, that.get()));
        return true;
      }
    };

    /**
     * Return the current item. If this is a SlotCursor, this will
     * return a Slot.
     * 
     * @returns the cursor value (null if none available).
     */
    baja.FilterCursor.prototype.get = function () {
      var x = this.$index,
          keys = this.$keys;
      
      if (x === -1 || x >= keys.length) {
        return null;
      }
      else {
        return this.$orderedMap.get(keys[x]);
      }
    };    

    /**
     * Return the current key.
     * <p>
     * This is a private method and shouldn't be used by non-Tridium developers.
     *
     * @private
     * 
     * @returns {String} the cursor key (null if none available).
     */
    baja.FilterCursor.prototype.getKey = function () {
      var x = this.$index,
          keys = this.$keys;
      
      if (x === -1 || x >= keys.length) {
        return null;
      }
      else {
        return keys[x];
      }
    }; 

    /**
     * Return the current index
     * <p>
     * This is a private method and shouldn't be used by non-Tridium developers.
     *
     * @private
     * 
     * @returns {Number} the cursor index (null if none available).
     */
    baja.FilterCursor.prototype.getIndex = function () {
      return this.$index;
    }; 

    /**
     * Iterate through the Cursor and call 'each' on every item.
     * <p>
     * When the function is called, 'this' refers to the 'context' that
     * was passed in when the Cursor was created.
     * 
     * @param {Function} func function called on every iteration with the 'value' being used as an argument.
     *                        If this is a Slot Cursor the 'value' will be a Slot.
     */
    baja.FilterCursor.prototype.each = function (func) {
      strictArg(func, Function);

      var result;
      while (this.next()) {
        result = func.call(this.$context, this.get(), this.getIndex());

        if (result) {
          return result;
        }
      }
    };
        
    /**
     * Return true if the Cursor is completely empty (regardless of iterative state).
     *
     * @returns {Boolean}
     */
    baja.FilterCursor.prototype.isEmpty = function () {
      // Note the old cursor index
      var oldX = this.$index;
      
      // Set the cursor back to the start
      this.$index = -1;
      
      // See if we have any valid entries from the start
      var res = this.next(); 
      
      // Restore the old cursor index
      this.$index = oldX;
      
      // Return the result of our search
      return !res;
    };
        
    /**
     * Return an array of the cursor results (regardless of iterative state).
     * If this is a Slot Cursor, this will be an array of Slots.
     *
     * @returns {Array}
     */
    baja.FilterCursor.prototype.toArray = function () {
      // Note the old cursor index
      var oldX = this.$index,
          a = [];
          
      this.$index = -1;
      
      // Iterate through and fill up the array
      while (this.next()) {
        a.push(this.get());
      }
      
      // Restore the old cursor index
      this.$index = oldX;
      
      return a;
    };
    
    /**
     * Return an Object Map of keys with their corresponding values. 
     * If this is a Slot Cursor, this will be a Map of Slot names with their 
     * corresponding Slots (regardless of iterative state).
     *
     * @returns {Object}
     */  
    baja.FilterCursor.prototype.toMap = function () {
      var slots = this.toArray(),
          map = {},
          s,
          i;
      
      for (i = 0; i < slots.length; ++i) {
        s = slots[i];
        map[s.getName()] = s;
      }
              
      return map;
    };
        
    /**
     * Return the size of the cursor (regardless of iterative state).
     *
     * @returns {Number}
     */
    baja.FilterCursor.prototype.getSize = function () {
      // Note the old cursor index
      var oldX = this.$index,
          count = 0;
      
      this.$index = -1;
      
      // Iterate through and fill up the array
      while (this.next()) {
        ++count;
      }
      
      // Restore the old cursor index
      this.$index = oldX;
      
      return count;
    };
    
    /**
     * Add a filter function to the Cursor.
     *
     * @param {Function} filter used to filter the results of the Cursor.
     *                          When invoked, the first argument will be the item to filter (i.e. a Slot).
     *                          This function must return a true value for the item to be kept.                 
     * @returns {baja.FilterCursor} itself.
     */
    baja.FilterCursor.prototype.filter = function (flt) {
      if (!this.$filter) {
        this.$filter = flt;
      }
      else {
        var oldFilter = this.$filter;
        
        // Merge the filter functions together
        this.$filter = function (val) {
          return oldFilter.call(this, val) && flt.call(this, val);
        };
      }
      return this;
    };
    
    /**
     * Return the first item in the cursor (regardless of iterative state).
     * <p>
     * If this is being used as a Slot Cursor, the Slot will be returned.
     *
     * @returns first item found in the Cursor (or null if nothing found).
     */
    baja.FilterCursor.prototype.first = function () {
      // Note the old cursor index
      var oldX = this.$index,
          val = null;
          
      this.$index = -1;
      
      // Iterate through and fill up the array
      if (this.next()) {
        val = this.get();
      }
       
      // Restore the old cursor index
      this.$index = oldX;
      
      return val;
    };
    
    /**
     * Return the last item in the cursor (regardless of iterative state).
     * <p>
     * If this is being used as a Slot Cursor, the Slot will be returned.
     *
     * @returns last item found in the Cursor (or null if nothing found).
     */
    baja.FilterCursor.prototype.last = function () {
      // Note the old cursor index
      var oldX = this.$index,
          val = null,
          index = this.$keys.length - 2;

      while (val === null && index >= -1) {
        this.$index = index;
        if (this.next()) {
          val = this.get();
        }
        index = index - 2;
      }
       
      // Restore the old cursor index
      this.$index = oldX;
      
      return val;
    };     

    /**
     * @class Maintains an ordered list of key/value pairs.
     * <p>
     * This object forms the basis of a Complex's Slot Map.
     *
     * @name baja.OrderedMap
     * @extends BaseBajaObj
     * @private
     */
    baja.OrderedMap = function () {
      baja.OrderedMap.$super.apply(this, arguments);
      this.$map = {}; // Normal unordered Map
      this.$array = []; // Array for maintaining order of keys
    }.$extend(BaseBajaObj);

    /**
     * Assign the value to the Map with the given key.
     *
     * @private
     *
     * @param {String} key  the key used for the entry in the Map
     * @param val  the value used to store in the Map
     */
    baja.OrderedMap.prototype.put = function (key, val) {
      if (!this.$map.hasOwnProperty(key)) {
        this.$map[key] = val;
        this.$array.push(key);
      }
      else {
        this.$map[key] = val;
      }
    };

    /**
     * Remove a value from the map and return it.
     *
     * @private
     *
     * @param {String} key  the key used to remove the value.
     * @returns the value removed (return null if nothing is found to be removed).
     */   
    baja.OrderedMap.prototype.remove = function (key) {
      strictArg(key, String);
      var v, i;
      if (this.$map.hasOwnProperty(key)) {
        v = this.$map[key];

        // Remove the element from the Map
        delete this.$map[key];

        // Find and remove the key from the array
        for (i = 0; i < this.$array.length; ++i) {
          if (this.$array[i] === key) {
            this.$array.splice(i, 1);
            break;
          }
        }

        return v;
      }
      else {
        return null;
      }
    };  

    /**
     * Query the Map to see if it contains the key.
     *
     * @private
     * 
     * @param {String} key
     * @returns {Boolean} a boolean value indicating if the Map contains the key.
     */
    baja.OrderedMap.prototype.contains = function (key) {
      strictArg(key, String);
      return this.$map.hasOwnProperty(key);
    };

    /**
     * Return the value for the key.
     *
     * @private
     * 
     * @param {String} key
     * @returns  the value for the key (return null if key is not found in Map).
     */
    baja.OrderedMap.prototype.get = function (key) {
      if (this.$map.hasOwnProperty(key)) {
        return this.$map[key];
      }
      else {
        return null;
      }     
    };

    /**
     * Rename an entry.
     *   
     * @private
     *
     * @param {String} oldName  the name of the existing entry to be renamed.
     * @param {String} newName  the new name of the entry.
     * @returns {Boolean} true if the entry was successfully renamed.
     */
    baja.OrderedMap.prototype.rename = function (oldName, newName) { 
      strictArg(oldName, String);
      strictArg(newName, String);

      if (!this.contains(oldName)) {
        return false;
      }
      if (this.contains(newName)) {
        return false;
      }

      // Get existing entry
      var entry = this.$map[oldName];
      delete this.$map[oldName];

      // Create new entry
      this.$map[newName] = entry;

      // Update array
      var i;
      for (i = 0; i < this.$array.length; ++i) {
        if (this.$array[i] === oldName) {
          this.$array[i] = newName;
          break;
        }
      }

      return true;
    };

    /**
     * Return the key's index.
     *
     * @private
     *
     * @param {String} key
     * @returns {Number} the index for the key (return -1 if key is not found in Map).
     */
    baja.OrderedMap.prototype.getIndex = function (key) {
      strictArg(key, String);
      if (this.$map.hasOwnProperty(key)) {
        var i;
        for (i = 0; i < this.$array.length; ++i) {
          if (this.$array[i] === key) {
            return i;
          }
        }  
      }
      return -1;    
    };

    /**
     * Return the value for the index.
     *
     * @private
     *
     * @param {Number} index
     * @returns the value for the index (return null if index is not found in Map).
     */
    baja.OrderedMap.prototype.getFromIndex = function (index) {
      strictArg(index, Number);
      var key = this.$array[index];
      if (typeof key === "string") {
        return this.$map[key];
      }
      return null;   
    };

    /**
     * Return an ordered array of keys for iteration.
     * <p>
     * Please note, a copy of the internal array will be returned.
     *
     * @private
     *
     * @returns {Array} an array of keys that can be used for iteration.
     */
    baja.OrderedMap.prototype.getKeys = function () {
      // Return a copy of the array
      return this.$array.slice(0);
    };

    /**
     * Return the size of the Map.
     * 
     * @private
     *
     * @returns {Number} the size of the Map.
     */
    baja.OrderedMap.prototype.getSize = function () {
      return this.$array.length;
    };

    /**
     * Sort the Map.
     * 
     * @private
     *
     * @see Array#sort
     *
     * @param {Function} sortFunc  Function used to sort the map. This definition of the Function
     *                             should be the same as the one passed into a JavaScript Array's 
     *                             sort method.
     */
    baja.OrderedMap.prototype.sort = function (sortFunc) {
      strictArg(sortFunc, Function);
      this.$array.sort(sortFunc);
    };

    /**
     * Return a Cursor used for iteration.
     * 
     * @private
     *
     * @param context used as 'this' in iteration operations
     * @param {Function} the Constructor of the Cursor to use for the Map.
     *     
     * @returns {Cursor} Cursor used for iteration 
     */
    baja.OrderedMap.prototype.getCursor = function (context, Cursor) {
      Cursor = Cursor || baja.FilterCursor;
      return new Cursor(context, this);
    }; 
  }());
    
  // Create local for improved minification
  var strictArg = baja.strictArg,
      strictAllArgs = baja.strictAllArgs,
      bajaDef = baja.def,
      objectify = baja.objectify;
        
  ////////////////////////////////////////////////////////////////
  // Clock
  //////////////////////////////////////////////////////////////// 
  
  (function bajaClockNamespace() {
    
    /**
     * @namespace Baja Clock methods used for scheduling.
     */
    baja.clock = new BaseBajaObj();
    
    /**
     * @class Clock Ticket used when scheduling function calls in BajaScript.
     * <p>
     * This Constructor shouldn't be invoked directly.
     * 
     * @see baja.clock.schedule
     *
     * @name Ticket
     * @extends BaseBajaObj
     * @inner
     * @public
     */   
    var Ticket = function () {
      this.$id = -1;
    }.$extend(BaseBajaObj);

    /**
     * Cancel the currently scheduled Ticket.
     */
    Ticket.prototype.cancel = function () {
      clearTimeout(this.$id);
      delete bsClockTimeouts[this.$id.toString()]; 
      this.$id = -1;
    };

    /**
     * Test for ticket expiration.
     *
     * @returns {Boolean} if the scheduled Ticket is currently expired.
     */
    Ticket.prototype.isExpired = function () {
      return this.$id === -1;
    };

    /**
     * @class Clock Ticket used when scheduling periodic events in Niagara.
     * <p>
     * This Constructor shouldn't be invoked directly.
     *
     * @name IntervalTicket
     * @extends Ticket
     * @inner
     * @public
     */
    var IntervalTicket = function () {
      IntervalTicket.$super.apply(this, arguments);
    }.$extend(Ticket);

    /**
     * Cancel the currently scheduled Ticket.
     */
    IntervalTicket.prototype.cancel = function () {
      clearInterval(this.$id);
      delete bsClockIntervals[this.$id.toString()];  
      this.$id = -1;
    };

    /** 
     * Returns the number of Clock ticks on the system.
     * <p>
     * This method is typically used for profiling.
     *
     * @returns {Number} the number of Clock ticks on the system.
     */
    baja.clock.ticks = function () {
      return new Date().valueOf();
    };
    
    /**
     * An expired Ticket.
     */
    baja.clock.expiredTicket = new Ticket();

    /**
     * Schedule a one off timer.
     * <p>
     * When the callback is invoked, 'this' will refer to the Ticket instance.
     * <p>
     * If any variables need to be passed into this function then it's best to do this via 
     * JavaScript closures.
     *
     * @param {Function} func  the function to be invoked once the specified time has elapsed.
     * @param {Number} time  the number of milliseconds before the event is run.
     * @returns {Ticket} a new Ticket for the scheduled event.
     */
    baja.clock.schedule = function (func, time) {
      strictAllArgs([func, time], [Function, Number]);

      // If BajaScript has fully stopped then don't schedule anything else...
      if (baja.isStopped()) {
        return this.expiredTicket;
      }

      // Create ticket before timer so we get closure
      var t = new Ticket();
      t.$id = setTimeout(function () {     
        delete bsClockTimeouts[t.$id.toString()]; 
        t.$id = -1;    
        func.call(t);
      }, time);

      // Register the ticket so we can keep track of it
      bsClockTimeouts[t.$id.toString()] = t;

      return t;
    };

    /**
     * Schedule a periodic timer.
     * <p>
     * When the callback is invoked, 'this' will refer to the Ticket instance.
     * <p>
     * If any variables need to be passed into this function then it's best to do this via 
     * JavaScript closures.
     *
     * @param {Function} func  the function to be invoked each time the specified time has elapsed.
     * @param {Number} time  the number of milliseconds before the event is run.
     *
     * @returns {IntervalTicket} a new Ticket for the scheduled event.
     */
    baja.clock.schedulePeriodically = function (func, time) {
      strictAllArgs([func, time], [Function, Number]);

      // If BajaScript has fully stopped then don't schedule anything else...
      if (baja.isStopped()) {
        return this.expiredTicket;
      }

      // Create ticket before timer so we get closure
      var t = new IntervalTicket();
      t.$id = setInterval(function () {
        func.call(t);
      }, time);

      // Keep track of the ticket internally
      bsClockIntervals[t.$id.toString()] = t;

      return t;
    };
  }());
  
  ////////////////////////////////////////////////////////////////
  // BajsScript Start and Stop
  //////////////////////////////////////////////////////////////// 
  
  (function startAndStop() {  
    var bsStarted = false,                 // BajaScript started flag
        bsStopped = false,                 // BajaScript stopped flag
        bsStopping = false,                // BajaScript stopping flag
        bsStartedCallbacks = null,         // Started callbacks
        bsPreStopCallbacks = null,         // Stopped callbacks
        bsUserName = "",                   // BajaScript user name for current session
        bsLang = "",                       // BajaScript language for user
        bsUserHome = "station:|slot:/",    // BajaScript user home
        bsTimeFormat = "",                 // BajaScript user time format pattern
        bsLogClientErrorsInServer = false, // BajaScript log client errors in the Server
        bsPreLoadRegStorage = null;        // The pre-loaded BajaScript Registry storage
    
    /**
     * Return true if BajaScript has started.
     *
     * @returns {Boolean} started
     */
    baja.isStarted = function () {
      return bsStarted;
    };
  
    /**
     * Return true if BajaScript has stopped.
     *
     * @returns {Boolean} stopped
     */
    baja.isStopped = function () {
      return bsStopped;
    };
    
    /**
     * Return true if BajaScript has stopped or is in the process of stopping.
     *
     * @returns {Boolean} stopping
     */
    baja.isStopping = function () {
      return bsStopping;
    };
              
    /**
     * Add a function to be invoked once BajaScript has started.
     * <p>
     * If BajaScript has already started, the function will be invoked immediately.
     *
     * @param {Function} func invoked once BajaScript has started.
     */
    baja.started = function (func) {
      strictArg(func, Function);
  
      // If we're already started then return immediately
      if (bsStarted) {
        try {
          func.call(baja);
        }
        catch (err) {
          baja.error(err);
        }
        return;
      }  
      
      // If not started yet then add the function to a callback list
      if (!bsStartedCallbacks) {
        bsStartedCallbacks = [];
      }
      
      bsStartedCallbacks.push(func);
    };
  
    /**
     * Add a function to be invoked just before BajaScript is stopped.
     * <p>
     * If BajaScript has already stopped, the function will be invoked immediately.
     *
     * @param {Function} func
     */
    baja.preStop = function (func) {
      strictArg(func, Function);
  
      // If we're already started then return immediately
      if (bsStopped) {
        try {
          func.call(baja);
        }
        catch (err) {
          baja.error(err);
        }
        return;
      }
  
      // If not started yet then add the function to a callback list
      if (!bsPreStopCallbacks) {
        bsPreStopCallbacks = [];
      }
      bsPreStopCallbacks.push(func);
    };
  
    /**
     * Start BajaScript.
     * <p>
     * This must be called to start BajaScript. This will make a network call to create a Session
     * that starts BajaScript. It's recommended to call this as soon as possible.
     * <p>
     * This method takes a started function or an Object Literal for the method's arguments...
     * <pre>
     *   baja.start(function () {
     *     // Called once BajaScript has started.
     *   });
     *
     *   //...or this can be invoked via an Object Literal...
     *
     *   baja.start({
     *     started: function () {
     *       // Called when BajaScript has started. We're ready to rock and roll at this point!
     *     },
     *     commFail: function () {
     *       // Called when the BajaScript communcations engine completely fails
     *     },
     *     typeSpecs: ["control:BooleanWritable", "control:NumericWritable"] // Types and Contracts we want imported 
     *                                                                       // upfront before our Web App loads
     *   });
     * </pre>
     *
     * @see baja.started
     * @see baja.save
     * @see baja.preStop
     * @see baja.stop
     *
     * @param {Object|Function} [obj]  the Object Literal for the method's arguments or the function invoke after the comms have started.
     * @param {Function} [obj.started] function to invoke after the comms have started and (if running in a browser) the DOM is ready.
     * @param {Function} [obj.commFail] function to invoke if the comms fail.
     * @param {Array} [obj.typeSpecs] an array of type specs (moduleName:typeName) to import from the Server.
     *                                Please note, this may not be needed if the Type and Contract information
     *                                has been cached by web storage.
     * @param {Boolean} [obj.navFile] if true, this will load the nav file for the user on start up. By default, this is false.
     */ 
    baja.start = function (obj) {
      
      // Initialize Comms Engine
      obj = objectify(obj, "started");
  
      var started = obj.started;
      obj.started = function () {
        // Signal that we have started
        bsStarted = true;
  
        // Call started callbacks
        if (bsStartedCallbacks) {
          var i;
          for (i = 0; i < bsStartedCallbacks.length; ++i) {
            try {
              bsStartedCallbacks[i].call(baja);
            }
            catch (err) {
              baja.error(err);
            }
          }
          bsStartedCallbacks = null;
        }
  
        // Invoke original started function
        if (typeof started === "function") {
          try {
            started();
          }
          catch (err2) {
            baja.error(err2);
          }
        }
      };
       
      baja.comm.start(obj);
  
      // Registry the common type library
      baja.registry.register(JSON.parse(baja.$ctypes));
      delete baja.$ctypes;
      
      // Load Web Storage while the BajaScript comms engine starts.
      bsPreLoadRegStorage = baja.registry.loadFromStorage();    
      
      // If a pre-start function was passed in then invoke that here.
      if (typeof obj.preStart === "function") {
        obj.preStart();
      }
    };
    
    /**
     * Save BajaScript's Registry Storage. This is automatically called when
     * BajaScript stops.
     */
    baja.save = function () {
      // If available, save registry information to storage
      if (bsRegStorage) {
        baja.registry.saveToStorage(bsRegStorage);
      }
    };
  
    /**
     * Stop BajaScript.
     * <p>
     * This method should be called when the page running BajaScript is unloaded. This will
     * make a network call to stop BajaScript's session.
     * <p>
     * This method takes a stopped function or an Object Literal for the method's arguments...
     * <pre>
     *   baja.stop(function () {
     *     // Called once stop has completed
     *   });
     *   
     *   //...or this can be invoked via an Object Literal...
     *   
     *   baja.stop({
     *     stopped: function () {
     *       // Called once stop has completed 
     *     }
     *   });
     * </pre>
     *
     * @see baja.start
     * @see baja.started
     * @see baja.preStop
     *
     * @param {Object|Function} [obj] the Object Literal for the method's arguments or a function
     *                                to be called once BajaScript has stopped.
     * @param {Function} [obj.stopped] called once BajaScript has stopped.
     * @param {Function} [obj.preStop] called just before BajaScript has stopped.
     */
    baja.stop = function (obj) {
      try {
        // Don't allow stop to happen twice
        if (bsStopped) {
          return;
        }
        
        // Flag up that we're in the middle of stopping BajaScript...
        bsStopping = true;
        
        baja.save();
      
        obj = objectify(obj, "stopped");
  
        if (typeof obj.preStop === "function") {
          baja.preStop(obj.preStop);
        }
  
        // Call preStop callbacks
        if (bsPreStopCallbacks) {
          var i;
          for (i = 0; i < bsPreStopCallbacks.length; ++i) {
            try {
              bsPreStopCallbacks[i].call(baja);
            }
            catch (err) {
              baja.error(err);
            }
          }
          bsPreStopCallbacks = null;
        }
  
        // Stop all registered timers  
        var id;
        for (id in bsClockTimeouts) {
          if (bsClockTimeouts.hasOwnProperty(id)) {
            bsClockTimeouts[id].cancel();
          }
        }
  
        for (id in bsClockIntervals) {
          if (bsClockIntervals.hasOwnProperty(id)) {
            bsClockIntervals[id].cancel();
          }
        }
  
        // These should be empty but we'll recreate them anyway
        bsClockTimeouts = {};
        bsClockIntervals = {};
    
        // Stop Comms Engine
        baja.comm.stop(obj);
      }
      finally {
        // Signal that BajaScript has fully stopped
        bsStopped = true;
      }
    };
    
    /**
     * Returns the user name the user is currently logged in with.
     *
     * @returns {String} the user name.
     */
    baja.getUserName = function () {
      return bsUserName;
    };
  
    /**
     * Returns language code for the user.
     *
     * @returns {String} the language character code.
     */
    baja.getLanguage = function () {
      return bsLang;
    };
    
    /**
     * Return the user home.
     *
     * @returns {baja.Ord}
     */
    baja.getUserHome = function () {
      return baja.Ord.make(bsUserHome);
    };
    
    /**
     * Return the user's default time format pattern.
     *
     * @returns {String}
     */
    baja.getTimeFormatPattern = function () {
      return bsTimeFormat;
    };
    
    /**
     * Return true if any client Errors are also being logged in the Server.
     * <p>
     * Please note, since BOX and HTTP Errors are technically from the Server,
     * these do not constitute as client Errors.
     *
     * @returns {Boolean}
     */
    baja.isLogClientErrorsInServer = function () {
      return bsLogClientErrorsInServer;
    };  
    
    /**
     * Initialize BajaScript from System Properties.
     *
     * @private   
     *
     * @param {Object} props  System Properties loaded from Server.
     */
    baja.initFromSysProps = function (props) {  
      // Record system properties...
      bsUserName = props.userName;
      bsLang = props.lang;
      bsUserHome = props.userHome;
      bsTimeFormat = props.timeFormat;
      bsLogClientErrorsInServer = props.logClientErrors || false;
  
      // Bail if web storage isn't enabled    
      if (!props.enableWebStorage) {
        // Free up the reference to original loaded data
        bsPreLoadRegStorage = null;
        
        // If Storage isn't enabled then try clearing it anyway
        baja.registry.clearStorage();
        return;
      }
    
      if (bsPreLoadRegStorage) {
        // If any of this information has changed then we need to wipe the registry storage and start again...
        if (bsPreLoadRegStorage.lang !== props.lang ||
            bsPreLoadRegStorage.version !== baja.version ||
            bsPreLoadRegStorage.regLastBuildTime !== props.regLastBuildTime) 
        {
          bsPreLoadRegStorage = null;
          baja.registry.clearStorage();
        }
      }
  
      if (!bsPreLoadRegStorage) {
        bsPreLoadRegStorage = {
          "lang": props.lang,
          "version": baja.version,
          "regLastBuildTime": props.regLastBuildTime,
          "types": {},
          "lexicons": {}
        };
      }
      
      // Now we know we want to use this as the registry storage, assign it accordingly.
      bsRegStorage = bsPreLoadRegStorage;
  
      // Free up the reference to original loaded data
      bsPreLoadRegStorage = null;
      
      // Submit all Type information into the registry
      baja.registry.register(bsRegStorage.types);
      
      // Load the cached Lexicons
      var moduleName;
      for (moduleName in bsRegStorage.lexicons) {
        if (bsRegStorage.lexicons.hasOwnProperty(moduleName)) {
          bsLexicons[moduleName] = new Lexicon(moduleName, bsRegStorage.lexicons[moduleName]);
        }
      }
    };
  }()); // startAndStop
    
  ////////////////////////////////////////////////////////////////
  // Types and Registry
  //////////////////////////////////////////////////////////////// 
  
  (function registry() {
    function loadTypes(registry, typeSpecs, encodeContracts, cb, async) {
      strictAllArgs([typeSpecs, encodeContracts, cb, async], 
                    [Array, Boolean, baja.comm.Callback, Boolean]);
  
      var rts = [], // Types to request
          t, // Type
          i;
  
      // Only request Types that aren't already present in the registry
      
      for (i = 0; i < typeSpecs.length; ++i) { 
        if (registry.$types.hasOwnProperty(typeSpecs[i])) {
          t = registry.$types[typeSpecs[i]];
          if (encodeContracts && (t.isComplex() || t.isFrozenEnum()) && !t.hasContract()) {
            rts.push(typeSpecs[i]);
          }
        }
        else {
          rts.push(typeSpecs[i]);
        }
      }
  
      var ts = null;
  
      // Create inner callback    
      cb.addOk(function (ok, fail, resp) {
        ts = [];
        var i;
  
        if (resp !== undefined) {              
          // Add information to the registry and make sure registry storage is updated.
          registry.register(resp, /*updateRegStorageTypes*/true);          
        }
  
        // Get all registry information we requested
        for (i = 0; i < typeSpecs.length; ++i) {
          ts.push(registry.$types[typeSpecs[i]]);
        }
  
        ok(ts);
      });
  
      // If there are Types to request then make the network call
      if (rts.length > 0) {    
        baja.comm.loadTypes(rts, encodeContracts, cb, async);
      }
      else {
        // If we already have all of the Type information then return it
        cb.ok();
      }
  
      return ts;
    }
    
    /**
     * Return an instance from the Type.
     * <p>
     * When creating an instance of a Type, this method should always be used by preference...
     * <pre>
     *   // Create an instance of a NumericWritable Control Component...
     *   var v = baja.$("control:NumericWritable");
     * </pre>
     * <p>
     * At first this 'dollar' function looks a bit strange. However, much like other popular JavaScript libraries, this
     * function has been reserved for the most commonly used part of BajaScript; creating instances of BajaScript Objects.
     *
     * @see Type#getInstance
     *
     * @param {String} typeSpec the Type Specification.
     * @returns an instance from the Type
     * @throws {Error} if the given type spec could not be found
     */
    baja.$ = function (typeSpec) {
      // Get a fully loaded Type
      var type = baja.lt(typeSpec, /*encodeContracts*/true);
      
      if (!type) {
        throw new Error("Type '" + typeSpec + "' not found");
      }
      
      // If only the TypeSpec was specified then just create an instance of that Type
      if (arguments.length === 1) {
        return type.getInstance();
      }
      else {
        // If more arguments were specified then pass them onto to 'getInstance'
        var args = Array.prototype.slice.call(arguments);
        args.shift(); // remove the first 'typeSpec argument
        return type.getInstance.apply(type, args);
      }
    };
    
    /**
     * Load the Type and Contract information for the given TypeSpecs.
     * <p>
     * A TypeSpec is a String in the format of 'moduleName:typeName' in Niagara.
     * <p>
     * This method may perform a network call if one of the TypeSpecs can't be found locally in the
     * Registry or if a Contract needs to be retrieved.
     * <p>
     * If a network call is expected, it's recommended to pass in ok and fail callback functions that will load the Type 
     * information asynchronously.
     * <p>
     * If a number of network calls is expected to be made then a batch {@link baja.comms.Batch} object 
     * can be passed into this method along with a callback. The network call will then be 'batched' accordingly.
     * <p> 
     * The method can be invoked with an array of TypeSpecs or an Object Literal...
     * <pre>
     *   baja.importTypes(["control:NumericWritable", "control:BooleanWritable"]);
     *
     *   // ...or via an Object Literal to specify further options...
     *
     *   baja.importTypes({
     *     typeSpecs: [["control:NumericWritable", "control:BooleanWritable"]],
     *     ok: function (newlyAddedTypes) {
     *       // Called on success (if specified, network call will be asynchronous otherwise synchronous)
     *     },
     *     fail: function (err) {
     *       // Called on failure (optional)
     *     },
     *     batch: batch // If specified, network calls are batched into this object
     *   });
     * </pre>
     * <p>
     * If the types for a given Web Application are known upfront then please specify them in {@link baja#start} instead.
     *
     * @see baja.start
     *
     * @param {Object} obj  the Object Literal for the method's arguments.
     * @param {Function} [obj.ok] the ok callback. By defining this, the network call automatically becomes asynchronous.
     *                            An array of the newly added Types will be passed into this handler.
     * @param {Function} [obj.fail] the fail callback.
     * @param {baja.comm.Batch} [obj.batch] the batch Buffer. If defined, any network calls will be batched into this object.
     * @returns {Array} an array of Types if this method is invoked synchronously otherwise null.
     */
    baja.importTypes = function (obj) {
      obj = objectify(obj, "typeSpecs");
      var cb = new baja.comm.Callback(obj.ok, obj.fail, obj.batch);
      try {
        return loadTypes(baja.registry, 
                         obj.typeSpecs,
                         /*encodeContracts*/true,
                         cb,
                         /*async*/obj.ok !== undefined);
      }
      catch (err) {
        cb.fail(err);
      }
      return null;
    };
    
    /**
     * Loads and returns a Type.
     * <p>
     * This queries the BajaScript registry for a Type. If it doesn't exist
     * then as a last resort, a synchronous network call is made in an attempt
     * to retrieve the Type information.
     * <p>
     * Please note, no Contract information is retreived if a network call is made, only
     * the Type information.
     * <p>
     * If a network call is expected to be made then please try asynchronously importing the Type
     * information first via {@link baja#importTypes}.
     *
     * @see baja.importTypes
     * 
     * @param {String} typeSpec  the type spec of the type we're interested in (moduleName:typeName).
     * @param {Boolean} [encodeContracts] encode the Contract when the Type is loaded (false by default).
     * @returns {Type} the Type for the given type spec.
     * @throws error if the Type can't be found.
     */
    baja.lt = function (typeSpec, encodeContracts) {        
      if (baja.registry.$types.hasOwnProperty(typeSpec)) {
        return baja.registry.$types[typeSpec];
      }
      else {
        encodeContracts = bajaDef(encodeContracts, false);
        var cb = new baja.comm.Callback();
        try {
          var ts = loadTypes(baja.registry, 
                             [typeSpec],
                             encodeContracts,
                             cb,
                             /*async*/false);
  
          if (ts !== null) {
            return ts[0];
          }        
        }
        catch (err) {
          cb.fail(err);
        }
        return null;
      }
    };

    (function bajaRegistryNamespace() {
      // BajaScript Registry
      var bsRegistryOrdTypes = {}, 
          bsRegistrySimples = {}, 
          bsRegistryCtors = {};
      
      /**
       * @class A BajaScript Type.
       * <p>
       * This Constructor shouldn't be invoked directly.
       * <p>
       * Type is a inner class. To access a Type please use {@link baja.lt}.
       * 
       * @name Type
       * @extends BaseBajaObj
       * @inner
       * @public
       */
      var Type = function (typeSpec, 
                          superType, 
                          isAbstract, 
                          isInterface, 
                          interfaces, 
                          contract, 
                          trans, 
                          iconStr,
                          isValue,
                          isSimple,
                          isSingleton,
                          isNumber,
                          isComplex,
                          isComponent,
                          isLink,
                          isAction,
                          isTopic,
                          isFrozenEnum,
                          isOrdScheme) {
        // TODO: Never store transient Types in WebStorage
        this.$typeSpec = typeSpec;
        this.$superType = superType;
        this.$isAbstract = isAbstract;
        this.$isInterface = isInterface;    
        this.$interfaces = interfaces;     
        this.$contract = contract; 
        this.$isTransient = trans;
        this.$iconStr = iconStr;
        this.$isValue = isValue;
        this.$isSimple = isSimple;
        this.$isSingleton = isSingleton;
        this.$isNumber = isNumber;
        this.$isComplex = isComplex;
        this.$isComponent = isComponent;
        this.$isLink = isLink;
        this.$isAction = isAction;
        this.$isTopic = isTopic;
        this.$isFrozenEnum = isFrozenEnum;
        this.$isOrdScheme = isOrdScheme;
      }.$extend(BaseBajaObj);
  
      /**
       * Test for equality.
       * 
       * @param obj  value to test for equality.
       * @returns {Boolean}
       */
      Type.prototype.equals = function (obj) {
        if (obj === undefined || obj === null) {
          return false;
        } 
        if (obj.constructor !== Type) {
          return false;
        }    
        return obj.$typeSpec === this.$typeSpec;
      };
  
      /**
       * Return the Module Name for the Type.
       *
       * @returns {String} module name.
       */
      Type.prototype.getModuleName = function () { 
        return this.$typeSpec.split(":")[0];
      };
  
      /**
       * Return the Type Name for the Type.
       *
       * @returns {String} type name.
       */
      Type.prototype.getTypeName = function () { 
        return this.$typeSpec.split(":")[1];
      };
  
      /**
       * Return the full Type Specification for the Type (moduleName:typeName).
       *
       * @returns {String} type spec.
       */
      Type.prototype.getTypeSpec = function () {
        return this.$typeSpec;
      };
        
      /**
       * Return an instance of the Type.
       * <p> 
       * A Type may have an Function Constructor associated with it. If a Constructor 
       * is found with this Type, this it's used to return an instance.
       * <p>
       * If a Constructor can't be found on this Type, then the Super Types are inspected
       * and the first Constructor found is used instead. This provides an elegant 'dynamic typing'
       * mechanism whereby a Constructor is not needed for every single Type.
       * <p>
       * If the Type is a concrete Simple or Singleton, then the 'DEFAULT' Property on the
       * Constructor is returned.
       *
       * @throws if an instance of the Type can't be created (i.e. if the Type is an Interface or Abstract or no
       *         constructor can be found).
       * @returns instance of Type.
       */
      Type.prototype.getInstance = function (arg) { 
        var typeSpec = this.getTypeSpec(),
            def;
  
        if (this.$isInterface) {
          throw new Error("Cannot call 'getInstance' on an Interface Type: " + typeSpec);
        }
        if (this.$isAbstract) {
          throw new Error("Cannot call 'getInstance' on an Abstract Type: " + typeSpec);
        }
  
        // If this is a Simple then check to see if this Type as a default instance on its Constructor, if so then return it
        // If there isn't a Constructor then default to baja.DefaultSimple
        if ((this.isSimple() || this.isSingleton()) && bsRegistryCtors.hasOwnProperty(typeSpec)) {
          if (arguments.length === 0) {
            return bsRegistryCtors[typeSpec].DEFAULT;
          }
          else {
            // If there were any arguments then attempt to use then in the Simple's make method
            def = bsRegistryCtors[typeSpec].DEFAULT; 
            return def.make.apply(def, arguments);            
          }
        }
  
        // If we have a cached version of a Simple then return it. This is used since there may be 
        // DefaultSimples and FrozenEnums out there that don't have their own Constructor but are still immutable. 
        // Hence we still have an internal caching mechanism for them as a back up.
        if (bsRegistrySimples.hasOwnProperty(typeSpec)) {
          if (arguments.length === 0) {
            return bsRegistrySimples[typeSpec];
          }
          else {
            // If there are arguments specified then use them in the Simple's make method
            def = bsRegistrySimples[typeSpec];
            return def.make.apply(def, arguments);
          }
        }
  
        var t = this, // Type used in iteration
            Ct;
        
        // Go up Super types until we find a valid constructor
        while (t !== null) {   
          // Create the new Type if there's a Constructor associated with it
          if (bsRegistryCtors.hasOwnProperty(t.getTypeSpec())) {
            Ct = bsRegistryCtors[t.getTypeSpec()];
            break;
          }
          else {
            t = t.$superType;
          }
        }
  
        // Throw error if we can't decode this properly. Usually this means we need to rebuild the common type library!
        if (t === null) {
          throw new Error("Could not find JS Constructor for Type: " + typeSpec);
        }
  
        if (typeof Ct !== "function") {
          throw new Error("Fatal error, could not create instance of Type: " + typeSpec);
        }
  
        // Otherwise just default to creating a new Type
        var o = new Ct(arg);
  
        // Update the Type on the new instance if necessary
        if (typeSpec !== o.getType().getTypeSpec()) {
          var that = this;
          o.getType = function () {
            return that;
          };
        }
  
        // Apply the Contract to the new instance if there's one available.
        // This will load the default frozen Slots for the given Type
        if (this.isComplex() || this.isFrozenEnum()) {
          if (this.isComplex()) {
            // Decode Complex BSON for all of the Slots
            baja.bson.decodeComplexContract(this, o);
          }
          else if (this.isFrozenEnum()) {
            // Ensure the Contract is loaded (although for better performance it's best to do this before
            // hand using something like importTypes(...)
            if (!this.hasContract()) {
              this.loadContract();
            }
            
            // Get default ordinal for Enum and assign it to the FrozenEnum instance
            var ordinals = this.getOrdinals();
            if (ordinals.length > 0) {
              o.$ordinal = ordinals[0];
            }
          }
          
          // Also pass any start up arguments into Contract Committed
          o.contractCommitted(arg);
        }
  
        if (this.isSimple()) {
          // If this is a simple then cache the instance
          bsRegistrySimples[typeSpec] = o;
          
          // If there are arguments specified then use them with the Simple's make method
          if (arguments.length > 0) {
            o = o.make.apply(o, arguments);
          }
        }
  
        return o;
      };
  
      /**
       * Test one Type is another.
       *
       * @param {String|Type} type  this can be an instance of a Type object or a String type specification (module:typeName).
       * @returns {Boolean} true if this Type polymorphically matches the other.
       */
      Type.prototype.is = function (type) {         
        if (type.constructor === String) {
          type = baja.lt(type);
        }
  
        // Test Type against this   
        if (this.$typeSpec === type.$typeSpec) {
          return true;
        }
        
        // Can only perform this test if the type passed in is an interface 
        var i;        
        if (type.$isInterface) {     
          // Test Type against any interfaces
          for (i = 0; i < this.$interfaces.length; ++i) {
            if (this.$interfaces[i].is(type)) {
              return true;
            }
          }
        }
        else if (type.$isSimple && !this.$isSimple) {
          return false;
        }
        else if (type.$isComponent && !this.$isComponent) {
          return false;
        }
        else if (type.$isComplex && !this.$isComplex) {
          return false;
        }
    
        // Test Type against any super Types     
        if (this.$superType) {
          return this.$superType.is(type);
        }
          
        return false;       
      };
  
      /**
       * Return true if the Type is a Value.
       *
       * @returns {Boolean}
       */
      Type.prototype.isValue = function () {
        return this.$isValue;
      };
  
      /**
       * Return true if the Type is a Simple.
       *
       * @returns {Boolean}
       */
      Type.prototype.isSimple = function () {
        return this.$isSimple;
      };
  
      /**
       * Return true if the Type is a Singleton.
       *
       * @returns {Boolean}
       */
      Type.prototype.isSingleton = function () {
        return this.$isSingleton;
      };
  
      /**
       * Return true if the Type is a Number.
       *
       * @returns {Boolean}
       */
      Type.prototype.isNumber = function () {
        return this.$isNumber;
      };
  
      /**
       * Return true if the Type is a Complex.
       *
       * @returns {Boolean}
       */
      Type.prototype.isComplex = function () {
        return this.$isComplex;
      };
  
      /**
       * Return true if the Type is a Component.
       *
       * @returns {Boolean}
       */
      Type.prototype.isComponent = function () {
        return this.$isComponent;
      };
  
      /**
       * Return true if the Type is a Struct.
       *
       * @returns {Boolean}
       */
      Type.prototype.isStruct = function () {
        return this.isComplex() && !this.isComponent();
      };
  
      /**
       * Return true if the Type is a Link.
       *
       * @returns {Boolean}
       */
      Type.prototype.isLink = function () {
        return this.$isLink;
      };
  
      /**
       * Return true if the Type is a baja:Action.
       *
       * @returns {Boolean}
       */
      Type.prototype.isAction = function () {
        return this.$isAction;
      };
  
      /**
       * Return true if the Type is a baja:Topic.
       *
       * @returns {Boolean}
       */
      Type.prototype.isTopic = function () {
        return this.$isTopic;
      };
  
      /**
       * Return true if the Type is a baja:FrozenEnum.
       *
       * @returns {Boolean}
       */
      Type.prototype.isFrozenEnum = function () {
        return this.$isFrozenEnum;
      };
  
      /**
       * Return true if the Type is a baja:OrdScheme.
       *
       * @returns {Boolean}
       */
      Type.prototype.isOrdScheme = function () {
        return this.$isOrdScheme;
      };
  
      /**
       * Return the Super Type.
       *
       * @returns {Type} Super Type or null if not available
       */
      Type.prototype.getSuperType = function () {
        return this.$superType;
      };
  
      /**
       * Return an array of interfaces Types implemented by this Type.
       *
       * @returns {Array} an array of interface types (all Type)
       */
      Type.prototype.getInterfaces = function () {
        return this.$interfaces.slice(0); // Return copy of array
      };
  
      /**
       * Return true if Type is Abstract.
       *
       * @returns {Boolean}
       */
      Type.prototype.isAbstract = function () {
        return this.$isAbstract;
      };
  
      /**
       * Return true if Type is an Interface.
       *
       * @returns {Boolean}
       */
      Type.prototype.isInterface = function () {
        return this.$isInterface;
      };
  
      /**
       * Return true if Type is transient.
       *
       * @returns {Boolean}
       */
      Type.prototype.isTransient = function () {
        return this.$isTransient;
      };
  
      /**
       * Return type spec as toString (moduleName:typeName).
       *
       * @returns {String} type spec
       */
      Type.prototype.toString = function () {
        return this.getTypeSpec();
      };
  
      /**
       * Return the Contract for the Type.
       *
       * @private
       *
       * @returns Contract
       */
      Type.prototype.getContract = function () {
        return this.$contract;
      };
  
      /**
       * Return true if the Type has a Contract.
       *
       * @private
       *
       * @returns {Boolean} true if the Type has a Contract.
       */
      Type.prototype.hasContract = function () {
        return this.$contract !== null;
      };
          
      /**
       * Ensures the Contract for the given Type is loaded.
       * <p>
       * If the Contract doesn't exist and this Type is a Complex or a FrozenEnum, a network call will be made to 
       * get the Contract.
       * 
       * @private
       *
       * @param {Object} [obj]  Object Literal containing the method's arguments.
       * @param {Function} [obj.ok] ok function callback. If defined, the network call is automatically made asynchronously
       *                               otherwise the network call is synchronous.
       * @param {Function} [obj.fail] fail function callback. If the Contract fails to load, this function will be called.
       * @param {baja.comm.Batch} [obj.batch] the batch buffer. If defined, the network call will be batched into this object.
       */   
      Type.prototype.loadContract = function (obj) {
        obj = objectify(obj);
        var cb = new baja.comm.Callback(obj.ok, obj.fail, obj.batch);
  
        try {    
          // See if the Contract is already present. If not then make a network call
          if (!(this.isComplex() || this.isFrozenEnum()) ||      
              this.isInterface() || 
              this.hasContract()) {
            cb.ok();
            return;
          }
  
          // Create the Callback to update this Types Contract
          cb.addOk(function (ok, fail, contracts) {
            var c; // Contract     
            var ts = []; // TypeSpecs to request
  
            // Update the Registry with all of these Contract definitions
            for (c in contracts) {
              if (contracts.hasOwnProperty(c)) {            
                if (!baja.registry.$types.hasOwnProperty(c)) {
                  ts.push(c);
                }
              }
            }
  
            // If we need to load any types then do so via a network call
            if (ts.length > 0) {
              // TODO: At some point, allow this to be asynchronous
              loadTypes(baja.registry, 
                        ts, 
                        /*encodeContracts*/false, 
                        new baja.comm.Callback(), 
                        /*async*/false);
            }
  
            // Update the Contracts
            for (c in contracts) {
              if (contracts.hasOwnProperty(c)) {
                if (baja.registry.$types.hasOwnProperty(c)) {
                  baja.registry.$types[c].$contract = contracts[c];
  
                  // If available, save contract to web storage...
                  if (bsRegStorage && bsRegStorage.types.hasOwnProperty(c)) {
                    bsRegStorage.types[c].c = contracts[c];
                  }
                }
              }
            }
  
            ok();
          });
  
          baja.comm.loadContract(this.getTypeSpec(), cb, /*async*/obj.ok !== undefined);      
        }
        catch (err) {
          cb.fail(err);
        }
      };
  
      /**
       * Return the Types's Icon.
       * 
       * @returns {String}
       */
      Type.prototype.getIcon = function () {
        if (this.$icon) {
          return this.$icon;
        }
  
        this.$icon = this.$iconStr ? baja.Icon.DEFAULT.decodeFromString(this.$iconStr) : baja.Icon.getStdObjectIcon();
        return this.$icon;
      };
  
      ////////////////////////////////////////////////////////////////
      // Type FrozenEnum Methods
      //////////////////////////////////////////////////////////////// 
  
      function enumTypeCheck(type) {
        if (!type.isFrozenEnum()) {
          throw new Error("Type must be a FrozenEnum");
        }
        if (!type.hasContract()) {
          type.loadContract();
          if (!type.hasContract()) {
            throw new Error("Unable to load the FrozenEnum Contract");
          }
        }
      }
  
      /**
       * Returns the ordinals for a Type that maps to a FrozenEnum.
       *
       * @private
       *
       * @throws error if Type is not a FrozenEnum or if Contract can't be loaded.
       * @returns {Array} array of ordinals for frozen enum.
       */
      Type.prototype.getOrdinals = function () {
        enumTypeCheck(this);    
        var ordinals = [], i;
        for (i = 0; i < this.$contract.length; ++i) {
          ordinals.push(this.$contract[i].o);
        }
        return ordinals;
      };
  
      /**
       * Returns whether the specified ordinal exists for this FrozenEnum Type.
       *
       * @private 
       *
       * @param {Number} ordinal
       * @throws error if Type is not a FrozenEnum or if Contract can't be loaded.
       * @returns {Boolean} true if the ordinal number exists in this FrozenEnum Type.
       */   
      Type.prototype.isOrdinal = function (ordinal) {
        enumTypeCheck(this);
        var contract = this.$contract, i;
        
        // Lazily generate the byOrdinal map    
        if (this.$byOrdinal === undefined) {
          this.$byOrdinal = {};
          for (i = 0; i < contract.length; ++i) {
            this.$byOrdinal[contract[i].o] = {
              o: contract[i].o,
              t: contract[i].t,
              dt: contract[i].dt
            };
          }
        }
  
        return this.$byOrdinal.hasOwnProperty(ordinal);
      };
  
      /**
       * Returns the tag for the ordinal (this Type has to map to a FrozenEnum).
       *
       * @private 
       *
       * @param {Number} ordinal
       * @throws error if Type is not a FrozenEnum, if Contract can't be loaded or if the ordinal doesn't exist.
       * @returns {String} the tag for the ordinal.
       */ 
      Type.prototype.getTag = function (ordinal) {
        enumTypeCheck(this); 
        if (this.isOrdinal(ordinal)) {
          return this.$byOrdinal[ordinal].t;
        }
        else {
          throw new Error("No tag for ordinal: " + ordinal + " in: " + this.getTypeSpec());
        }
      };
  
      /**
       * Returns the display tag for the ordinal (this Type has to map to a FrozenEnum).
       *
       * @private 
       *
       * @param {Number} ordinal
       * @throws error if Type is not a FrozenEnum, if Contract can't be loaded or if the ordinal doesn't exist.
       * @returns {String} the display tag for the ordinal.
       */ 
      Type.prototype.getDisplayTag = function (ordinal) {
        enumTypeCheck(this); 
        if (this.isOrdinal(ordinal)) {
          return this.$byOrdinal[ordinal].dt;
        }
        else {
          throw new Error("No display tag for ordinal: " + ordinal + " in: " + this.getTypeSpec());
        }
      };
  
      /**
       * Returns whether the specified tag exists for this FrozenEnum Type.
       *
       * @private 
       *
       * @param {String} tag
       * @throws error if Type is not a FrozenEnum or if Contract can't be loaded.
       * @returns {Boolean} true if the tag exists.
       */ 
      Type.prototype.isTag = function (tag) {
        enumTypeCheck(this); 
        var contract = this.$contract, i;
        
        // Lazily generate the byTag map    
        if (this.$byTag === undefined) {
          this.$byTag = {};
          for (i = 0; i < contract.length; ++i) {
            this.$byTag[contract[i].t] = {
              o: contract[i].o,
              t: contract[i].t,
              dt: contract[i].dt
            };
          }
        }
  
        return this.$byTag.hasOwnProperty(tag);
      };
  
      /**
       * Returns the ordinal for the tag (providing the Type maps to a FrozenEnum).
       *
       * @private 
       *
       * @param {String} tag
       * @throws error if Type is not a FrozenEnum, if Contract can't be loaded or the tag doesn't exist.
       * @returns {Number} ordinal for the tag.
       */ 
      Type.prototype.tagToOrdinal = function (tag) {
        enumTypeCheck(this); 
        if (this.isTag(tag)) {
          return this.$byTag[tag].o;
        }
        else {
          throw new Error("No ordinal tag for tag: " + tag + " in: " + this.getTypeSpec());
        }
      };
  
      /**
       * Returns the EnumRange for the Type (providing the Type maps to a FrozenEnum).
       *
       * @private 
       *
       * @see baja.EnumRange
       *
       * @throws error if Type is not a FrozenEnum, if Contract can't be loaded or the tag doesn't exist.
       * @returns {baja.EnumRange} the enum range.
       */ 
      Type.prototype.getRange = function () {
        enumTypeCheck(this); 
        if (this.$range === undefined) {
          this.$range = baja.EnumRange.make(this);
        }
        return this.$range;
      };
  
      /**
       * Returns the FrozenEnum for the Type (providing the Type maps to a FrozenEnum).
       *
       * @private 
       *
       * @see baja.EnumRange
       *
       * @param {String|Number} arg  the tag or ordinal for the frozen enum to return.
       * @throws error if Type is not a FrozenEnum, if Contract can't be loaded or the tag or ordinal doesn't exist.
       * @returns {FrozenEnum} the frozen enumeration for the tag or ordinal.
       */ 
      Type.prototype.getFrozenEnum = function (arg) {
        enumTypeCheck(this); 
  
        var ordinal = 0, fe;
  
        // Set the ordinal depending on the argument...
        if (typeof arg === "string") {
          // Look up the ordinal if the tag was passed in
          ordinal = this.tagToOrdinal(arg);
        }
        else if (typeof arg === "number" && this.isOrdinal(arg)) {
          // Validate the ordinal that was passed in
          ordinal = arg;
        }
        else {
          throw new Error("Invalid argument for FrozenEnum creation");
        }
  
        // Lazily create cache of frozen enum instances
        if (this.$enums === undefined) {
          this.$enums = {};
        }
  
        // Look up enum with ordinal in simples Cache
        if (this.$enums.hasOwnProperty(ordinal)) {
          fe = this.$enums[ordinal];
        }
        else {
  
          // Create instance and set up type access
          fe = this.getInstance();
  
          // If the ordinal differs then make a clone of the object
          if (fe.getOrdinal() !== ordinal) {
            var newFe = new fe.constructor();
            newFe.getType = fe.getType;
            fe = newFe;   
            fe.$ordinal = ordinal;
          }
  
          // Cache the frozen enum in the Type
          this.$enums[ordinal] = fe;
        }
  
        return fe;
      };
  
      /**
       * Return true if this Type has a constructor directly assocated with it.
       *
       * @private 
       *
       * @returns {Boolean}
       */ 
      Type.prototype.hasConstructor = function () {
        return bsRegistryCtors.hasOwnProperty(this.$typeSpec);
      };
  
      /**
       * Type Registration.
       * <p>
       * Registers the Constructor with the given TypeSpec. This method is used to extend BajaScript and associate
       * JavaScript Objects with Niagara Types.
       * <p>
       * This method also performs checks on the given Constructor to ensure it's 
       * suitable for the given Type.
       * 
       * @private
       *
       * @param {String} typeSpec  the TypeSpec we want to register with.
       * @returns {Object}  the Object (this).
       */ 
      Function.prototype.registerType = function (typeSpec) {
        strictArg(typeSpec, String);
        if (typeof this !== "function") {
          throw new Error("Can only loadType on a Function Constructor: " + typeSpec);
        }
  
        // Register the TypeSpec with this Constructor function
        bsRegistryCtors[typeSpec] = this;
  
        // Please note, the Constructor is now lazily validated when the Type information
        // is registered with BajaScript.
  
        // Set up default type access
        var type;
        this.prototype.getType = function () {
          // Lazily load Type information
          if (!type) {
            type = baja.lt(typeSpec);
          }
          return type;
        };
  
        return this;
      };
          
      /**
       * @namespace Baja Type Registry
       * <p>
       * At the core of BajaScript is a lazily loading Type and Contract system. A Contract
       * represents a frozen slot defition for a Complex or a set of FrozenEnum ordinals, tags and display tags
       * <p>
       * The most commonly used Types are held generated into a Common Type Library that gets
       * forms part of BajaScript JavaScript library to avoid unnecessary network calls.
       */
      baja.registry = new BaseBajaObj();
      baja.registry.$types = {
        // Add very core Baja Types as these will NEVER be included into any JSON    
        "baja:Object": new Type("baja:Object", // TypeSpec
          null,          // Super Type
          true,          // Is Abstract
          false,         // Is Interface
          [],            // Interfaces
          null,          // Contract  
          false,         // Transient
          null,          // Icon 
          false,         // isValue
          false,         // isSimple
          false,         // isSingleton
          false,         // isNumber
          false,         // isComplex
          false,         // isComponent
          false,         // isLink
          false,         // isAction
          false,         // isTopic
          false,         // isFrozenEnum
          false),        // isOrdScheme
                    
  
        "baja:Interface": new Type("baja:Interface", // TypeSpec
          null,             // Super Type
          true,             // Is Abstract
          true,             // Is Interface
          [],               // Interfaces
          null,             // Contract 
          false,            // Transient  
          null,             // Icon
          false,            // isValue
          false,            // isSimple
          false,            // isSingleton
          false,            // isNumber
          false,            // isComplex
          false,            // isComponent
          false,            // isLink
          false,            // isAction
          false,            // isTopic
          false,            // isFrozenEnum
          false)            // isOrdScheme          
      };
  
      /**
       * Inspect the object structure and create Type information to add to the Registry.
       * <p>
       * This should only be invoked by Tridium developers and is normally used in a network callback.
       *
       * @private   
       *
       * @param {Object} obj  the Object structure holding the Type information.
       * @param {Boolean} [updateRegStorageTypes] if true, this will update the Registry
       *                                          storage type database. (Contracts held in the 
       *                                          registry storage database will be updated regardless
       *                                          of whether this flag is truthy or not).
       */
      baja.registry.register = function (obj, updateRegStorageTypes) { 
        if (obj === undefined) {
          return;
        }   
  
        var intType = baja.lt("baja:Interface"),
            objType = baja.lt("baja:Object"),    
            typeSpec, // Add Types to Registry database without super or interface information...
            data,
            newTypeObj = {};
  
        for (typeSpec in obj) {
          if (obj.hasOwnProperty(typeSpec)) {
            data = obj[typeSpec]; 
              
            // If the type doesn't exist in the registry then create it...
            if (!this.$types.hasOwnProperty(typeSpec)) {
              this.$types[typeSpec] = new Type(typeSpec,                // TypeSpec
                                               null,                    // Super Type
                                               data.a || false,         // Is Abstract
                                               data.i || false,         // Is Interface
                                               [],                      // Interfaces
                                               bajaDef(data.c, null),   // Contract
                                               data.t || false,         // Transient
                                               bajaDef(data.ic, null), // Icon String
                                               data.isv || false,       // isValue
                                               data.iss || false,       // isSimple
                                               data.isg || false,       // isSingleton
                                               data.isn || false,       // isNumber
                                               data.isx || false,       // isComplex
                                               data.isc || false,       // isComponent
                                               data.isl || false,       // isLink
                                               data.isa || false,       // isAction
                                               data.ist || false,       // isTopic
                                               data.ise || false,       // isFrozenEnum,
                                               data.os  || false);      // isOrdScheme
  
              // Create object with new information we're processing...
              newTypeObj[typeSpec] = data;
              
              // Update local storage if available...
              if (updateRegStorageTypes && bsRegStorage) {
                // Update web storage (providing Type isn't transient)...
                if (!data.t) {
                  bsRegStorage.types[typeSpec] = data;
                }
              }
            }
            else {              
              // If the type does exist in the registry then ensure it's contract is loaded (if there is one)
              if (data.c) {                
                this.$types[typeSpec].$contract = data.c;
                
                // If available, update contract in web storage...
                if (bsRegStorage && bsRegStorage.types.hasOwnProperty(typeSpec)) {
                  bsRegStorage.types[typeSpec].c = data.c;
                }
              }           
            }
          }
        }
  
        // Now add all super and interface information...
        var i,
            type;
        
        for (typeSpec in newTypeObj) {
          if (newTypeObj.hasOwnProperty(typeSpec)) {
            data = newTypeObj[typeSpec]; 
            type = this.$types[typeSpec];
  
            // Skip baja:Interface and baja:Object...
            if (type === intType || type === objType) {
              continue;
            }
  
            // Set up interfaces...
            if (data.it && data.it.length > 0) {
              for (i = 0; i < data.it.length; ++i) {
                type.$interfaces.push(baja.lt(data.it[i]));
              }
            }
            else if (data.i) {
              // If this is an interface then this must at least extend baja:Interface
              type.$interfaces.push(intType);
            }
  
            // Set up Super Type for non-interfaces...
            if (!data.i) {
              if (data.p) {
                type.$superType = baja.lt(data.p);
              }
              else {
                type.$superType = objType;
              }
            }     
          }
        }
  
        // Iterate through newly added Type information
        var ctor;
        for (typeSpec in newTypeObj) {
          if (newTypeObj.hasOwnProperty(typeSpec)) {
            data = newTypeObj[typeSpec]; 
            type = baja.lt(typeSpec);
  
            // Lazily do checks on Ctor information associated with Type        
            if (!type.isAbstract()) {
              if (bsRegistryCtors.hasOwnProperty(typeSpec)) {
                ctor = bsRegistryCtors[typeSpec];
  
                // Check concrete Simple Types conform
                if (type.isSimple()) {
                  if (ctor.DEFAULT === undefined) {
                    throw new Error("Concrete Simple implementations must define a DEFAULT instance argument on the Constructor: " + typeSpec);
                  }
                  if (typeof ctor.DEFAULT.make !== "function") {
                    throw new Error("Concrete Simple implementations must define a make method: " + typeSpec);
                  }
                  if (typeof ctor.DEFAULT.decodeFromString !== "function") {
                    throw new Error("Concrete Simple implementations must define a decodeFromString method: " + typeSpec);
                  }
                  if (typeof ctor.DEFAULT.encodeToString !== "function") {
                    throw new Error("Concrete Simple implementations must define a encodeToString method: " + typeSpec);
                  }
                }    
  
                // Check concrete Singletons Types conform
                if (type.isSingleton()) {
                  if (ctor.DEFAULT === undefined) {
                    throw new Error("Concrete Singletons must define a DEFAULT instance argument on the Constructor: " + typeSpec);
                  }
                }
              }
  
              // Register ORD schemes...        
              if (data.os && type.isOrdScheme()) {
                bsRegistryOrdTypes[data.os] = type;
              }
            }
          }
        }
      };
  
      /**
       * Return the Type for the given ORD scheme name.
       *
       * @private
       *
       * @param {String} schemeId  the ORD scheme name.
       * @returns the Type for the ORD Scheme (null is returned if a Type can't be found).
       */
      baja.registry.getOrdScheme = function (schemeId) {
        return bajaDef(bsRegistryOrdTypes[schemeId], null);
      };
  
      /**
       * Does the Type exist in the BajaScript registry?
       * <p>
       * This method will not result in any network calls.
       *
       * @param {String} typeSpec  the type specification to query the registry for.
       * @returns {Boolean} true if the Type exists in the BajaScript registry.
       */
      baja.registry.hasType = function (typeSpec) {
        return this.$types.hasOwnProperty(typeSpec);
      };
  
      /**
       * Same as {@link baja#lt}.
       * 
       * @name baja.registry#loadType
       * @function
       *
       * @see baja.lt
       */
      baja.registry.loadType = baja.lt;  
            
      /**
       * Same as {@link baja#importTypes}.
       * 
       * @name baja.registry.loadTypesWithContract
       * @function
       *
       * @see baja.importTypes
       */
      baja.registry.loadTypesWithContract = baja.importTypes;  
      
      /**
       * Get an array of concrete Types from the given typeInfo. This method
       * will make a network call. The type information returned in the 
       * ok handler may not necessarily have Contract information loaded. 
       * To then ensure the Contract information for Complex and FrozenEnums
       * is loaded, please use {@link baja#importTypes}.
       * <p>
       * This method takes an Object Literal as an argument.
       * <pre>
       *   baja.getConcreteTypes({
       *     type: "control:ControlPoint",
       *     ok: function (concreteTypes) {
       *       // Called on success
       *     },
       *     fail: function (err) {
       *       // Called on failure (optional)
       *     },
       *     batch: batch // If specified, network calls are batched into this object
       *   });
       * </pre>
       * 
       * @see baja.importTypes
       * @see Type
       * 
       * @param {Object} obj the Object literal for the method's arguments.
       * @param {String|Type} obj.type the type or (String type specification - module:typeName) to query the registry for.
       * @param {Function} obj.ok the ok callback. When invoked, an array of Types will be passed 
       *                          in as an argument.
       * @param {Function} [obj.fail] the fail callback.
       * @param {baja.comm.Batch} [obj.batch] the batch Buffer. If defined, the network call will be batched into this object.
       */
      baja.registry.getConcreteTypes = function (obj) {
        obj = objectify(obj);
        
        var typeSpec;
        if (obj.type) {
          typeSpec = obj.type.toString();
        }
        
        // Ensure we have these arguments
        baja.strictAllArgs([typeSpec, obj.ok], [String, Function]);
        
        var cb = new baja.comm.Callback(obj.ok, obj.fail, obj.batch);
                
        cb.addOk(function (ok, fail, resp) {    
          var types = resp.t,
              specs = resp.s;
          
          // Register all of the Type information we get back
          baja.registry.register(types, /*updateRegStorageTypes*/true);
          
          // Get all of the Type inforamtion from the BajaScript registry
          var concreteTypes = [];
          baja.iterate(specs, function (typeSpec) {
            concreteTypes.push(baja.lt(typeSpec));
          });
          
          // Make the callback with the Type information.
          ok(concreteTypes);
        });
        
        // Make the network call
        baja.comm.getConcreteTypes(typeSpec, cb);
      };
      
      /**
       * Clear the registry from permanent storage. By default, this does nothing and 
       * must be overridden in a utility library like browser.js to clear the
       * localStorage (or to a flat file in a server environment, etc).
       *  
       * @name baja.registry.clearStorage
       * @function
       * @private
       */
      baja.registry.clearStorage = function () {
        // Do nothing - override with browser-dependent localStorage hook, etc.
      };
      
      /**
       * Saves the registry to permanent storage. By default, this does nothing and 
       * must be overridden in a utility library like browser.js to save to
       * localStorage (or to a flat file in a server environment, etc).
       *  
       * @name baja.registry.saveToStorage
       * @function
       * @private
       *
       * @param {Object} regStorage the BajaScript registry information to store
       */
      baja.registry.saveToStorage = function (regStorage) {
        // Do nothing - override with browser-dependent localStorage hook, etc.
      };
      
      /**
       * Load Registry Storage information and return it.
       * By default, this does nothing and must be overriden in a utility library
       * like browser.js to load from localStorage (or from a flat file in a server
       * environment, etc).
       * 
       * @name baja.registry.loadFromStorage
       * @function
       * @private
       */
      baja.registry.loadFromStorage = function () {
        // Return null - override with browser-dependent localStorage hook, etc.,
        return null;
      };
  
    }());
  }());
    
}(baja, BaseBajaObj));
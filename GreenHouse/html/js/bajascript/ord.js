//
// Copyright 2010, Tridium, Inc. All Rights Reserved.
//

/**
 * Core Object Resolution Descriptor Architecture for BajaScript.
 *
 * @author Gareth Johnson
 * @version 1.0.0.0
 */

//JsLint options (see http://www.jslint.com )
/*jslint rhino: true, onevar: false, plusplus: true, white: true, undef: false, nomen: false, 
eqeqeq: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: false, 
indent: 2, vars: true, continue: true */

// Globals for JsLint to ignore 
/*global baja, BaseBajaObj, encodeURI, decodeURI, decodeURIComponent, encodeURIComponent*/ 
  
(function ord(baja, BaseBajaObj) {

  // Use ECMAScript 5 Strict Mode
  "use strict";
  
  // Create local for improved minification
  var strictArg = baja.strictArg,
      bajaDef = baja.def,
      objectify = baja.objectify,
      Callback = baja.comm.Callback;
    
  ////////////////////////////////////////////////////////////////
  // Local Host and Component Space
  //////////////////////////////////////////////////////////////// 
  
  /**
   * @namespace Local Host
   */
  baja.nav.localhost = baja.nav.$addChildNode(new baja.LocalHost());
  
  /**
   * @namespace local Station Component Space
   */
  baja.nav.localhost.station = baja.nav.localhost.$addChildNode(new baja.BoxComponentSpace("station", "station:", baja.nav.localhost));
  
  /**
   * Shortcut to local Station Component Space
   *
   * @see baja.nav.localhost.station
   */
  baja.station = baja.nav.localhost.station;
  
  ////////////////////////////////////////////////////////////////
  // ORD
  //////////////////////////////////////////////////////////////// 
  
  /**
   * @class ORD Query.
   * <p>
   * The base class for all OrdQuery Objects.
   *
   * @name OrdQuery
   * @private
   * @inner
   */
  var OrdQuery = function (obj) { 
    obj = obj || {};  
    this.$scheme = obj.scheme;
    this.$schemeName = obj.schemeName;
    this.$body = obj.body;
    this.$isHost = obj.isHost || false;
    this.$isSession = obj.isSession || false;
    
    // Override any functions
    var p;
    for (p in obj) {
      if (obj.hasOwnProperty(p) && typeof obj[p] === "function") {
        this[p] = obj[p];
      }
    }
  }.$extend(BaseBajaObj);
  
  /**
   * Return the ORD Scheme.
   *
   * @returns {baja.OrdScheme}
   */
  OrdQuery.prototype.getScheme = function () {
    return this.$scheme;
  };
  
  /**
   * Return the ORD Scheme name.
   *
   * @returns {String}
   */
  OrdQuery.prototype.getSchemeName = function () {
    return this.$schemeName;
  };
  
  /**
   * Return the body for the query.
   *
   * @returns {String}
   */
  OrdQuery.prototype.getBody = function () {
    return this.$body;
  };
  
  /**
   * Return a String representation of the query.
   *
   * @returns {String}
   */
  OrdQuery.prototype.toString = function () {
    return this.getSchemeName() + ":" + this.getBody();
  };
    
  /**
   * Return true if the Query is a Host.
   *
   * @returns {Boolean}
   */
  OrdQuery.prototype.isHost = function () {
    return this.$isHost;
  };
  
  /**
   * Return true if the Query is a Session.
   *
   * @returns {Boolean}
   */
  OrdQuery.prototype.isSession = function () {
    return this.$isSession;
  };
  
  /**
   * Normalize the query and return true if modified.
   *
   * @private
   *
   * @param {OrdQueryList} list
   * @param {Number} index
   *
   * @returns {Boolean}
   */
  OrdQuery.prototype.normalize = function (list, index) {
    return false;
  };
  
  /**
   * @class Cursor for an ORD Query List.
   * 
   * @name OrdQueryListCursor
   * @extends baja.SyncCursor
   * @inner
   * @public
   */
  var OrdQueryListCursor = function (list) {
    OrdQueryListCursor.$super.apply(this, arguments);
    this.$list = list;
    this.$index = -1;
  }.$extend(baja.SyncCursor);
  
  /**
   * Return true if there's another query in the Cursor.
   *
   * @returns {Boolean}
   */
  OrdQueryListCursor.prototype.hasNext = function () {
    return this.$index + 1 < this.$list.$queries.length;
  };

  /**
   * Advance the Cursor to the next query.
   *
   * @returns {Boolean} returns true if there's another query in the Cursor.
   */
  OrdQueryListCursor.prototype.next = function () {
    if (!this.hasNext()) {
      return false;
    }
    else {
      this.$index++;
      return true;
    }
  };
  
  /**
   * Return the current query from the Cursor.
   *
   * @returns the ORD Query.
   */
  OrdQueryListCursor.prototype.get = function () {
    if (this.$index === -1) {
      throw new Error("Illegal cursor index");
    }
    return this.$list.$queries[this.$index];
  };
  
  /**
   * Iterate through the Cursor and call 'each' on every item.
   * 
   * @param {Function} func function called on every iteration with the 'value' being used as an argument.
   */
  OrdQueryListCursor.prototype.each = function (func) {
    var result;
    while (this.next()) {
      result = func(this.get(), this.$index);
      if (result) {
        return result;
      }
    }
  };
  
  /**
   * Return the current index for the Cursor.
   *
   * @returns {Number}
   */
  OrdQueryListCursor.prototype.getIndex = function () {
    return this.$index;
  };
  
  /**
   * Return the current ORD String at the current index.
   *
   * @returns {String}
   */
  OrdQueryListCursor.prototype.getOrd = function () {
    return this.$list.toString(this.$index + 1);
  };
  
  /**
   * Resolve the next ORD Query.
   *
   * @param {OrdTarget} target
   * @param {Object} options
   */
  OrdQueryListCursor.prototype.resolveNext = function (target, options) {
    try {
      // Resolve the next part of the ORD scheme
      if (this.next()) {
        var query = this.get();
        query.getScheme().resolve(target, query, this, options);
      }
      // If we've finished iterating through the ORDs then
      // call the original ok callback
      else {
        options.callback.ok(target);
      }
    }
    catch (err) {
      options.callback.fail(err);
    }
  };
  
  /**
   * @class ORD Query List.
   * <p>
   * Used to hold a list of OrdQueries.
   *
   * @name baja.OrdQueryList
   * @extends BaseBajaObj
   *
   * @see OrdQuery
   *
   * @param {Array} [queries] an array of ORD queries.
   */   
  baja.OrdQueryList = function (queries) {  
    this.$queries = queries || [];
  }.$extend(BaseBajaObj);
  
  /**
   * Add an ORD Query to the List
   *
   * @param query 
   */
  baja.OrdQueryList.prototype.add = function (query) {
    this.$queries.push(query); 
    this.$hasUnknown = undefined; // reset the cached hasUnknown result
  };
  
  /**
   * Is the list empty?
   *
   * @returns {Boolean}
   */
  baja.OrdQueryList.prototype.isEmpty = function () {
    return this.$queries.length === 0;
  };
  
  /**
   * Does the list contain an unknown ORD scheme?
   *
   * @private
   *
   * @returns {Boolean}
   */
  baja.OrdQueryList.prototype.hasUnknown = function () {
    if (this.$hasUnknown !== undefined) {
      return this.$hasUnknown;
    }
  
    // Search for an unknown ORD scheme and cache the result
    var i, unknown = false;
    for (i = 0; i < this.$queries.length; ++i) {
      if (this.$queries[i].getScheme() instanceof baja.UnknownScheme) {
        unknown = true;
      }
    }
    this.$hasUnknown = unknown;
    return unknown;
  };
  
  /**
   * Returns a Cursor for use with the ORD Query List.
   *
   * @returns {OrdQueryListCursor} the Cursor for the ORD Query List.
   */
  baja.OrdQueryList.prototype.getCursor = function () {
    return new OrdQueryListCursor(this);
  };
  
  function normalizeOrdQueryList(list) {
    var i;
    for (i = 0; i < list.$queries.length; ++i) {
      if (list.$queries[i].normalize(list, i)) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Normalize the ORD Query List.
   * 
   * @private
   *
   * @returns {baja.OrdQueryList} returns itself.
   */
  baja.OrdQueryList.prototype.normalize = function () {
    // Don't try to normalize if there's unknown client ORD Schemes
    if (!this.hasUnknown()) {
      for (;;) {
        if (!normalizeOrdQueryList(this)) {
          break;
        }
      }
    }
    return this;
  };
  
  /**
   * Return String representation of the ORD Query List.
   *
   * @returns {String}
   */
  baja.OrdQueryList.prototype.toString = function (length) {
    length = bajaDef(length, this.$queries.length);
    var a = [], i;
    for (i = 0; i < length; ++i) {
      a.push(this.$queries[i].toString());
    }
    return a.join("|");
  };
  
  /**
   * Return the query object at the specified index.
   *
   * @param {Number|String} index or scheme name.
   * @returns query (or null if can't be found).
   */
  baja.OrdQueryList.prototype.get = function (index) {
    var to = typeof index,
        queries = this.$queries,
        i,
        q;
        
    if (to === "number") {
      // Get via index
      q = queries[index];
    }
    else if (to === "string") {
      // Search via scheme name
      for (i = 0; i < queries.length; ++i) {
        if (queries[i].getSchemeName() === index) {
          q = queries[i];
          break;
        }
      }
    }
    
    return q || null;
  };
    
  /**
   * Set an ORD query object at the given index.
   *
   * @param {Number} index 
   * @param query
   */
  baja.OrdQueryList.prototype.set = function (index, query) {
    if (index < 0 || index > this.$queries.length) {
      throw new Error("Invalid index (" + index + ")");
    }
    this.$queries[index] = query;
    this.$hasUnknown = undefined; // reset the cached hasUnknown result
  };
  
  /**
   * Remove the entry at the specified index and return it.
   *
   * @param {Number} index 
   * @returns query
   */
  baja.OrdQueryList.prototype.remove = function (index) {
    var query = null;
    if (index >= 0 && index < this.$queries.length) {
      query = this.$queries.splice(index, 1)[0];
      this.$hasUnknown = undefined; // reset the cached hasUnknown result    
    }
    return query;
  };
  
  /**
   * Return the size of the query list.
   * 
   * @returns {Number} size of the list.
   */
  baja.OrdQueryList.prototype.size = function () {
    return this.$queries.length;
  };
        
  /**
   * @class ORD Target.
   * <p>
   * This constructor shouldn't be invoked directly.
   *  
   * @name OrdTarget
   * @extends BaseBajaObj
   * @inner
   * @public
   *
   * @param {OrdTarget} [base]  the base ORD Target
   */
  var OrdTarget = function (base) {    
    this.base = base || null;  
    this.object = null;
    
    if (base && typeof base === "object") {
      base.next = this;
    }    
  }.$extend(BaseBajaObj);
  
  /**
   * Return the Component for the ORD Target.
   *
   * @returns {baja.Component}
   */
  OrdTarget.prototype.getComponent = function () {
    if (baja.hasType(this.container) && this.container.getType().isComponent()) {
      return this.container;
    }
    else if (baja.hasType(this.object)) {
      if (this.object.getType().isComponent()) {
        return this.object;
      }
      else if (this.object.getType().isComplex()) {
        var o = this.object.getParent();
        while (o !== null) {
          if (o.getType().isComponent()) {
            break;
          }
          o = o.getParent();
        }
        if (o !== null) {
          return o;
        }
      }
    }
    if (this.base && typeof this.base === "object") {
      return this.base.getComponent();
    }
    return null;
  };  
  
  /**
   * Return the object associated with this OrdTarget.
   * <p>
   * This method will attempt to access any resolved value from its
   * Property. If the resolved value wasn't resolved from a Property then 
   * the original resolved object is returned.
   *
   * @returns {baja.Object}
   */
  OrdTarget.prototype.getObject = function () {
    var that = this,
        parent = that.container,
        slot = that.slot,
        propertyPath = that.propertyPath,
        i,
        val;
      
    if (parent) {
      // Walk up the Property Path
      if (propertyPath) {
        if (propertyPath.length > 0) {
          val = parent;
          for (i = 0; i < propertyPath.length; ++i) {
            val = val.get(propertyPath[i]);
          } 
          return val;          
        }
      }
      // If no PropertyPath then access from the Slot
      else if (slot && slot.isProperty()) {
        return parent.get(slot);
      }
    }
    
    // By default, just return the object originally resolved
    return that.object;
  };  
    
  /**
   * @class Object Resolution Descriptor.
   * <p>
   * An ORD is how we can access Objects in the Server from BajaScript. It's 
   * similar to a URI but is much more powerful and extensible. For more
   * information, please see the Niagara developer documentation on ORDs and how
   * they're used.
   * <pre>
   *   // Resolve an ORD
   *   baja.Ord.make("station:|slot:/Folder/NumericWritable").get({
   *     ok: function () {
   *       baja.outln(this.getOutDisplay());
   *     },
   *     lease: true
   *   });
   * </pre>
   * <p>
   * If more than one ORD needs to be resolved then use a {@link baja.BatchResolve}.
   * <p>
   * This Constructor shouldn't be invoked directly. Please use the 'make' methods to create
   * an instance of an ORD.
   *
   * @see baja.Ord.make
   * @see baja.BatchResolve
   *
   * @name baja.Ord
   * @extends baja.Simple
   */   
  baja.Ord = function (ord) {
    baja.Ord.$super.apply(this, arguments);
    this.$ord = strictArg(ord, String);    
  }.$extend(baja.Simple);
  
  /**
   * Default ORD instance.
   */
  baja.Ord.DEFAULT = new baja.Ord("");
    
  /**
   * Make an ORD.
   * <p>
   * The argument can be a String, baja.Ord or an Object.
   * If an Object is passed in then if there's a base and child Property, this
   * will be used to construct the ORD (by calling 'toString' on each). Otherwise 'toString' will be called
   * on the Object for the ORD.
   * <pre>
   *   // Resolve an ORD
   *   baja.Ord.make("station:|slot:/Folder/NumericWritable").get({
   *     ok: function () {
   *       baja.outln(this.getOutDisplay());
   *     },
   *     lease: true
   *   });
   * </pre>
   *
   * @param {String|Object} ord
   * @returns {baja.Ord}
   */
  baja.Ord.make = function (ord) {
    if (arguments.length === 0) {
      return baja.Ord.DEFAULT;
    }
    
    // Handle child and base
    if (typeof ord === "object" && ord.base && ord.child) {
      ord = ord.base.toString() + "|" + ord.child.toString();
    }
    else {
      ord = ord.toString(); 
    }  
        
    // Handle URL decoding
    if (ord.match(/^\/ord/)) {
      // Remove '/ord?' or '/ord/'
      ord = ord.substring(5, ord.length);
      
      // Replace this with the pipe character
      ord = decodeURI(ord);    
    }
    
    if (ord === "" || ord === "null") {
      return baja.Ord.DEFAULT;
    }
    
    return new baja.Ord(ord);
  };
  
  /**
   * Make an ORD.
   *
   * @see baja.Ord.make
   *
   * @param {String} ord
   * @returns {baja.Ord}
   */
  baja.Ord.prototype.make = function (ord) {
    return baja.Ord.make(ord);
  };
  
  /**
   * Decode an ORD from a String.
   *
   * @param {String} str  the ORD String.
   * @returns {baja.Ord} the decoded ORD.
   */
  baja.Ord.prototype.decodeFromString = function (str) {
    return baja.Ord.make(str);
  };
  
  /**
   * Encode an ORD to a String.
   *
   * @returns {String} the ORD encoded to a String.
   */
  baja.Ord.prototype.encodeToString = function () {
    return this.$ord;
  };
  
  // Register Type
  baja.Ord.registerType("baja:Ord");
  
  /**
   * Return an String representation of the object.
   *
   * @returns {String} a String representation of an ORD.
   */
  baja.Ord.prototype.toString = function () {
    return this.$ord;
  };
  
  /**
   * Return the inner value of this Object.
   *
   * @returns {String} a String representation of an ORD.
   */
  baja.Ord.prototype.valueOf = function () {
    return this.toString();
  };
      
  /**
   * Parse an ORD to a number of ORD Query objects.
   *
   * @returns {baja.OrdQueryList} a list of ORDs to resolve.
   */
  baja.Ord.prototype.parse = function () {
    // TODO: Validate all characters are valid
    var list = new baja.OrdQueryList();
    if (this.$ord.length === 0) {
      return list; 
    }
    
    var os = this.$ord.split("|"), // ORDs
        i,
        ind,
        schemeName,
        scheme,
        body;

    for (i = 0; i < os.length; ++i) {      
      ind = os[i].indexOf(":");
      if (ind === -1) {
        throw new Error("Unable to resolve ORD: " + os[i]);
      }
        
      schemeName = os[i].substring(0, ind);
      body = os[i].substring(ind + 1, os[i].length);      
      scheme = baja.OrdScheme.lookup(schemeName);
            
      // Create the ORD scheme      
      list.add(scheme.parse(schemeName, body));
    }
    return list;
  };
     
  /**
   * Resolve an ORD.
   * <p>
   * Resolving an ORD consists of parsing and processing it to get a result. The result is an ORD Target.
   * <p>
   * Any network calls that result from processing an ORD are always asynchronous.
   * <p>
   * The resolve method requires an ok function callback or an Object Literal that contains the method's arguments...
   * <pre>
   *   baja.Ord.make("station:|slot:/").resolve(function ok(target) {
   *     // process the ORD Target
   *   });
   *
   *   //...or use an Object Literal to specify multiple arguments...
   *   
   *   baja.Ord.make("station:|slot:/").resolve({
   *     ok: function (target) {
   *       // process the ORD target
   *     },
   *     fail: function (err) {
   *       // process the failure
   *     },
   *     lease: true // ensure any resolved Components are leased before calling 'ok'
   *   });
   * </pre> 
   * <p>
   * Please note that unlike other methods that require network calls, no batch object can be specified!   
   *
   * @see OrdTarget
   * @see baja.Ord#get
   * @see baja.RelTime
   *
   * @param {Object} [obj] the Object Literal that contains the method's arguments.
   * @param {Function} [obj.ok] the ok function called once the ORD has been successfully resolved. The ORD Target is passed to this function when invoked.
   * @param {Function} [obj.fail] the fail function called if the ORD fails to resolve. An error cause is passed to this function when invoked.
   * @param [obj.base] the base Object to resolve the ORD against.
   * @param {Boolean} [obj.lease] if defined and true, any Components are temporarily subscribed.
   * @param {Number|baja.RelTime} [obj.leaseTime] the amount of time in milliseconds to lease for (lease argument must be true). As well as a Number, this can also 
   *                              a baja.RelTime. 
   * @param {baja.Subscriber} [obj.subscriber] if defined the Component is subscribed using this Subscriber.
   * @param {Object} [obj.cursor] if defined, this specifies parameters for iterating through a Cursor (providing the ORD resolves to a Collection or Table).
   *                              For more information, please see {@link baja.coll.Collection#cursor}.
   */    
  baja.Ord.prototype.resolve = function (obj) {    
    obj = objectify(obj, "ok");
    
    var base = bajaDef(obj.base, baja.nav.localhost),
        cb = obj.cb === undefined ? new Callback(obj.ok, obj.fail) : obj.cb,
        subscriber = bajaDef(obj.subscriber, null),
        lease = bajaDef(obj.lease, false), 
        leaseTime = obj.leaseTime, // If undefined, lease will use lease default
        full = bajaDef(obj.full, false),
        cursor = obj.cursor;

    // Ensure 'this' in callback is the target's Component. If it's not a Component then 
    // fallback to the resolved Object.
    cb.addOk(function (ok, fail, target) {
      var resolvedObj = target.getComponent();
      if (!resolvedObj) {
        resolvedObj = target.getObject();
      }
      if (resolvedObj !== null) {
        ok.call(resolvedObj, target);
      }
      else {
        ok(target);
      }
    });
     
    if (subscriber !== null) {
       // If we need to subscribe using a Subscriber once the Component is resolved...
      cb.addOk(function (ok, fail, target) {
        function newOk() {
          ok(target);
        }
        var comp = target.getComponent();
        if (comp !== null && comp.isMounted()) {
          subscriber.subscribe({
            "comps": [comp], 
            "ok": newOk, 
            "fail": fail,
            "importAsync": true
          });
        }
        else {
          newOk();
        }
      });
    }     
    
    if (lease) {
      // If we need to lease once the Component is resolved...
      cb.addOk(function (ok, fail, target) {
        function newOk() {
          ok(target);
        }
        var comp = target.getComponent();
        if (comp !== null && comp.isMounted()) {
          comp.lease({
            "ok": newOk, 
            "fail": fail,
            "time": leaseTime,
            "importAsync": true
          });
        }
        else {
          newOk();
        }
      });
    }
    
    try {            
      // Check the user isnt trying to batch an ORD as this isn't supported
      if (obj.batch) {
        throw new Error("Cannot batch ORD resolution");
      }
    
      var ordQueries = this.parse(); 
      if (ordQueries.isEmpty()) {
        throw new Error("Cannot resolve null ORD: " + this.toString());
      }
      
      var target = new OrdTarget();
      target.object = base;
      
      var options = {
        "full": full,
        "callback": cb,
        "queries": ordQueries,
        "ord": this,
        "cursor": cursor
      };
      
      // Normalize
      ordQueries.normalize();
            
      // If there are ORD Schemes that aren't implemented in BajaScript then we 
      // simply make a network call and resolve the ORD Server side
      if (ordQueries.hasUnknown()) {
        var newTarget = new OrdTarget(target);
               
        cb.addOk(function (ok, fail, resp) {      
          var newOk = function () {
            // Decode the result
            var t = newTarget.object = baja.bson.decodeValue(resp.o, baja.$serverDecodeContext);
            
            // Finished iterating so just make the callback
            ok(newTarget); 
            
            // If we've got a collection result cached then call 'cursor' on the Collection or Table
            if (resp.c &&
                baja.hasType(t) &&
                t.getType().is("baja:ICollection") && 
                typeof t.cursor === "function") {
              cursor.$data = resp.c;
              t.cursor(cursor);              
            }           
          };
          
          // Scan for any unknown types we don't have here and make another
          // network request if necessary 
          var unknownTypes = baja.bson.scanForUnknownTypes(resp);
          
          if (unknownTypes.length > 0) {
            var importBatch = new baja.comm.Batch();
            
            baja.importTypes({
              "typeSpecs": unknownTypes, 
              "ok": newOk, 
              "fail": fail,
              "batch": importBatch
            });
            
            // Commit synchronously if this has been resolved from a BatchResolve. 
            // It's best to do this as there's other ORDs also resolving in tandem.
            if (obj.fromBatchResolve) {
              importBatch.commitSync();
            }
            else {
              importBatch.commit();
            }
          }
          else {
            newOk();
          }       
        });
        
        // If Cursor information is defined, ensure we set some defaults
        if (options.cursor) {
          options.cursor.limit = options.cursor.limit || 10;
          options.cursor.offset = options.cursor.offset || 0;
        }
        
        // Make the network call to resolve the complete ORD Server side       
        baja.comm.resolve(this, base, cb, options); 
      }
      else {
                                
        // Resolve the ORD. Each ORD scheme must call 'resolveNext' on the cursor to process the next 
        // part of the ORD. This design has been chosen because some ORD schemes may need to make network calls.
        // If the network call is asynchronous in nature then they'll be a delay before the ORD can process further    
        ordQueries.getCursor().resolveNext(target, options);
      }
    }
    catch (err) {
      cb.fail(err);
    }
  };
     
  /**
   * Resolve the ORD and get the resolved Object from the ORD Target.
   * <p>
   * This method calls {@link baja.Ord#resolve} and calls 'get' on the ORD Target to
   * pass the object onto the ok function callback.
   * <p>
   * An Object Literal is used to to specify the method's arguments. For more information
   * on how to use this method please see {@link baja.Ord#resolve}.
   * <pre>
   *   baja.Ord.make("service:baja:UserService|slot:jack").get({
   *     ok: function (user) {
   *       // Do something with the user...
   *     },
   *     lease: true
   *   });
   * </pre>
   *
   * @see OrdTarget#resolve
   *
   * @param {Object} [object]
   * @returns the value resolved from the ORD.
   */   
  baja.Ord.prototype.get = function (obj) {
    obj = objectify(obj, "ok"); 
    
    obj.cb = new Callback(obj.ok, obj.fail);
    obj.cb.addOk(function (ok, fail, target) {
      ok.call(this, target.getObject());
    }); 
  
    this.resolve(obj);
  };
  
  /**
   * Return a normalized version of the ORD.
   *
   * @returns {baja.Ord}
   */   
  baja.Ord.prototype.normalize = function () {
    return baja.Ord.make(this.parse().normalize());
  };
    
  /**
   * Relativize is used to extract the relative portion
   * of this ord within an session:
   * <ol>
   * <li>
   * First the ord is normalized.</li>
   * <li>
   * Starting from the left to right, if any queries are
   * found which return true for isSession(), then remove
   * everything from that query to the left.</li>
   * </ol>
   *
   * @returns {baja.Ord}
   */
  baja.Ord.prototype.relativizeToSession = function () {
    var list = this.parse().normalize(),
        q,
        newList = new baja.OrdQueryList(),
        i;
        
    for (i = 0; i < list.size(); ++i) {
      q = list.get(i);
      
      if (!q.isSession() && !q.isHost()) {
        newList.add(q);
      }
    } 
    return baja.Ord.make(newList);
  };
  
  /**
   * Return the ORD as URI that can be used in a browser.
   *
   * @returns {String}
   */   
  baja.Ord.prototype.toUri = function () {
    var uri = encodeURI(this.relativizeToSession().toString());
    
    // Hack for HTTP scheme
    return uri.match(/^http/i) ? uri : ("/ord?" + uri);
  };
          
  /**
   * @class ORD Scheme.
   * <p>
   * An ORD is made up of a series of ORD Queries separated by the '|' character.
   * Each ORD Query has an ORD Scheme name (i.e. 'slot') and a body (i.e. '/Drivers/ModbusNetwork').
   *
   * @name baja.OrdScheme
   * @extends baja.Singleton
   */     
  baja.OrdScheme = function () {
    baja.OrdScheme.$super.apply(this, arguments);
  }.$extend(baja.Singleton).registerType("baja:OrdScheme"); 
  
  /**
   * All extended ORD Schemes must implement this method so an ORD can be resolved!
   *
   * @param {ORDTarget} target  the current ORD Target
   * @param {Object} query  the ORD Query used in resolving the ORD
   * @param cursor  the ORD Query List cursor used for helping to asynchronously resolve the ORD
   * @param {Object} options  options used for resolving an ORD
   */
  baja.OrdScheme.prototype.resolve = function (target, query, cursor, options) {
    throw new Error("ORD Scheme must implement resolve: " + this.getType());
  };
      
  /**
   * Return the ORD Scheme for the given scheme name.
   *
   * @returns {baja.OrdScheme}
   */
  baja.OrdScheme.lookup = function (schemeName) {
    var type = baja.registry.getOrdScheme(schemeName);
    return type && type.hasConstructor() ? type.getInstance() : baja.UnknownScheme.DEFAULT;
  };
  
  /**
   * Return an ORD Query for the scheme.
   *
   * @returns {OrdQuery}
   */
  baja.OrdScheme.prototype.parse = function (schemeName, body) {
    return new OrdQuery({
      scheme: this,
      schemeName: schemeName,
      body: body
    });
  };
  
  ////////////////////////////////////////////////////////////////
  // Unknown ORD Scheme
  //////////////////////////////////////////////////////////////// 
  
  /**
   * @class Unknown ORD Scheme. 
   * <p>
   * Some ORD Schemes are represented in BajaScript and some are not. When an ORD is resolved, 
   * the BajaScript Registry is used to see if we locally have an ORD scheme representation.
   * If all of the ORD Schemes in an ORD do have a local representation (i.e. they have JS Constructors),
   * the ORD is resolved locally. If any unknown ORD schemes are found then the entire ORD is resolved 
   * on the Server and the corresponding results are serialized and sent back down to the client.
   *
   * @name baja.UnknownScheme
   * @extends baja.OrdScheme
   * @private
   */    
  baja.UnknownScheme = function () {
    baja.UnknownScheme.$super.apply(this, arguments);
  }.$extend(baja.OrdScheme);
  
  /**
   * Default Unknown ORD Scheme instance.
   * @private
   */
  baja.UnknownScheme.DEFAULT = new baja.UnknownScheme();
  
  /**
   * Called when an ORD is resolved.
   *
   * @private
   *
   * @see baja.OrdScheme#resolve
   *
   * @param {ORDTarget} target  the current ORD Target.
   * @param {Object} query  the ORD Query used in resolving the ORD.
   * @param cursor  the ORD Query List cursor used for helping to asynchronously resolve the ORD.
   * @param {Object} options  options used for resolving an ORD.
   */
  baja.UnknownScheme.prototype.resolve = function (target, query, cursor, options) {
    
    // Fail since this should always be resolved Server side
    var newTarget = new OrdTarget(target);
    options.callback.fail("Unknown BajaScript ORD Scheme: " + query.getSchemeName());
  };
  
  ////////////////////////////////////////////////////////////////
  // Http ORD Scheme
  //////////////////////////////////////////////////////////////// 
  
  /**
   * @class HTTP ORD Scheme. 
   *
   * @name baja.HttpScheme
   * @extends baja.OrdScheme
   * @private
   */    
  baja.HttpScheme = function () {
    baja.HttpScheme.$super.apply(this, arguments);
  }.$extend(baja.OrdScheme).registerType("net:HttpScheme");
  
  /**
   * Default HTTP ORD Scheme instance.
   * @private
   */
  baja.HttpScheme.DEFAULT = new baja.HttpScheme();
  
  /**
   * Called when an ORD is resolved.
   *
   * @private
   *
   * @see baja.OrdScheme#resolve
   *
   * @param {ORDTarget} target  the current ORD Target.
   * @param {Object} query  the ORD Query used in resolving the ORD.
   * @param cursor  the ORD Query List cursor used for helping to asynchronously resolve the ORD.
   * @param {Object} options  options used for resolving an ORD.
   */
  baja.HttpScheme.prototype.resolve = function (target, query, cursor, options) {
    cursor.resolveNext(new OrdTarget(target), options);
  };
  
  function trimToStart(list, index) {
    if (index > 0) {
      var size = list.size(), i;
      for (i = 0; i < index; ++i) {
        list.remove(0);
      }
      return true;
    }
    return false;
  }
  
  /**
   * Return an ORD Query for the scheme.
   *
   * @returns {OrdQuery}
   */
  baja.HttpScheme.prototype.parse = function (schemeName, body) {
    return new OrdQuery({
      scheme: this,
      schemeName: schemeName,
      body: body,
      normalize: trimToStart
    });
  };
    
  ////////////////////////////////////////////////////////////////
  // Host Schemes
  //////////////////////////////////////////////////////////////// 
    
  /**
   * @class Local Host ORD Scheme.
   * <p>
   * This scheme resolved to the local host. The local host represents the Station BajaScript is directly connected too.
   *
   * @name baja.LocalScheme
   * @extends baja.OrdScheme
   * @private
   */    
  baja.LocalScheme = function () {
    baja.LocalScheme.$super.apply(this, arguments);
  }.$extend(baja.OrdScheme);
  
  /**
   * Default Local ORD Scheme instance.
   * @private
   */
  baja.LocalScheme.DEFAULT = new baja.LocalScheme();
  
  // Register Type
  baja.LocalScheme.registerType("baja:LocalScheme"); 

  /**
   * Called when an ORD is resolved.
   *
   * @private
   *
   * @see baja.OrdScheme#resolve
   *
   * @param {ORDTarget} target  the current ORD Target.
   * @param {Object} query  the ORD Query used in resolving the ORD.
   * @param cursor  the ORD Query List cursor used for helping to asynchronously resolve the ORD.
   * @param {Object} options  options used for resolving an ORD.
   */
  baja.LocalScheme.prototype.resolve = function (target, query, cursor, options) {
    var newTarget = new OrdTarget(target);
    newTarget.object = baja.nav.localhost;
    cursor.resolveNext(newTarget, options);
  };
  
  /**
   * Return an ORD Query for the scheme.
   *
   * @returns {OrdQuery}
   */
  baja.LocalScheme.prototype.parse = function (schemeName, body) {
    return new OrdQuery({
      scheme: this,
      schemeName: schemeName,
      body: body,
      isHost: true,
      isSession: true,
      normalize: trimToStart
    });
  };
  
  ////////////////////////////////////////////////////////////////
  // Session Schemes
  //////////////////////////////////////////////////////////////// 
    
  /**
   * @class Fox ORD Scheme.
   *
   * @name baja.FoxScheme
   * @extends baja.OrdScheme
   * @private
   */    
  baja.FoxScheme = function () {
    baja.FoxScheme.$super.apply(this, arguments);
  }.$extend(baja.OrdScheme);
  
  /**
   * Default Fox ORD Scheme instance.
   * @private
   */
  baja.FoxScheme.DEFAULT = new baja.FoxScheme();
  
  // Register Type
  baja.FoxScheme.registerType("fox:FoxScheme"); 

  /**
   * Called when an ORD is resolved.
   *
   * @private
   *
   * @see baja.OrdScheme#resolve
   *
   * @param {ORDTarget} target  the current ORD Target.
   * @param {Object} query  the ORD Query used in resolving the ORD.
   * @param cursor  the ORD Query List cursor used for helping to asynchronously resolve the ORD.
   * @param {Object} options  options used for resolving an ORD.
   */
  baja.FoxScheme.prototype.resolve = function (target, query, cursor, options) {
    var newTarget = new OrdTarget(target);
    newTarget.object = target.object;
    cursor.resolveNext(newTarget, options);
  };
  
  /**
   * Return an ORD Query for the scheme.
   *
   * @returns {OrdQuery}
   */
  baja.FoxScheme.prototype.parse = function (schemeName, body) {
    return new OrdQuery({
      scheme: this,
      schemeName: schemeName,
      body: body,
      isSession: true,
      normalize: function (list, index) {
        // Shift to host
        var i, q, modified = false;
        for (i = index - 1; i >= 0; --i) {
          q = list.get(i);
          if (!q.isHost()) {
            list.remove(i);
            modified = true;
          }
        }
        return modified;
      }
    });
  };
      
  ////////////////////////////////////////////////////////////////
  // Space Schemes
  //////////////////////////////////////////////////////////////// 
  
  /**
   * @class Station ORD Scheme.
   * <p>
   * This scheme resolves to a Station.
   *
   * @name baja.StationScheme
   * @extends baja.OrdScheme
   * @private
   */    
  baja.StationScheme = function () {
    baja.StationScheme.$super.apply(this, arguments);
  }.$extend(baja.OrdScheme); // TODO: Need to extend from SpaceScheme eventually
  
  /**
   * Default Station ORD Scheme instance.
   * @private
   */
  baja.StationScheme.DEFAULT = new baja.StationScheme();
  
  // Register Type
  baja.StationScheme.registerType("baja:StationScheme"); 
  
  /**
   * Called when an ORD is resolved.
   *
   * @private
   *
   * @see baja.OrdScheme#resolve
   *
   * @param {ORDTarget} target  the current ORD Target.
   * @param {Object} query  the ORD Query used in resolving the ORD.
   * @param cursor  the ORD Query List cursor used for helping to asynchronously resolve the ORD.
   * @param {Object} options  options used for resolving an ORD.
   */
  baja.StationScheme.prototype.resolve = function (target, query, cursor, options) {
    
    var newTarget = new OrdTarget(target);
    newTarget.object = target.object;
    
    if (!newTarget.object.getType().is("baja:ComponentSpace")) {
      newTarget.object = baja.nav.localhost.station;
    }
    
    cursor.resolveNext(newTarget, options);
  };
  
  /**
   * Return an ORD Query for the scheme.
   *
   * @returns {OrdQuery}
   */
  baja.StationScheme.prototype.parse = function (schemeName, body) {
    return new OrdQuery({
      scheme: this,
      schemeName: schemeName,
      body: body,
      normalize: function (list, index) {
        // Shift to session
        var i, q, modified = false;
        for (i = index - 1; i >= 0; --i) {
          q = list.get(i);
          if (!q.isHost() && !q.isSession()) {
            list.remove(i);
            modified = true;
          }
        }
        return modified;
      } 
    });
  };
      
  ////////////////////////////////////////////////////////////////
  // SlotPath Resolution
  //////////////////////////////////////////////////////////////// 
  
  /**
   * @class Slot ORD Scheme.
   * <p>
   * This scheme resolves a SlotPath to a Niagara Object.
   *
   * @see baja.SlotPath
   *
   * @name baja.SlotScheme
   * @extends baja.OrdScheme
   */    
  baja.SlotScheme = function () {
    baja.SlotScheme.$super.apply(this, arguments);
  }.$extend(baja.OrdScheme); // TODO: Need to extend from SpaceScheme eventually
  
  /**
   * Default Slot ORD Scheme instance.
   * @private
   */
  baja.SlotScheme.DEFAULT = new baja.SlotScheme();
  
  // Register Type
  baja.SlotScheme.registerType("baja:SlotScheme"); 

  // Empty fail function. It doesn't matter is the loads fail as the resolve without the
  // network calls will result in the fail we want
  var emptyFail = function (err) {};
  
  function slotSchemeResolve(scheme, target, query, cursor, options, netcall) {
    var newTarget = new OrdTarget(target),
        object = target.object;
    
    newTarget.slotPath = query;
    
    var slotPath = newTarget.slotPath, // SlotPath
        space = null,     // Space
        container = null; // base container
        
    netcall = bajaDef(netcall, true);
    
    // TODO: May need to make more robust if other types of Slot Paths are added
    var isVirtual = slotPath.constructor !== baja.SlotPath;
    
    // TODO: Property Container support
    
    if (object.getType().is("baja:VirtualGateway") && isVirtual) {
      space = object.getVirtualSpace();
      container = space.getRootComponent();
    }
    else if (object.getType().is("baja:ComponentSpace")) {
      space = object;
      container = object.getRootComponent();
    }    
    else if (object.getType().isComponent()) {
      space = object.getComponentSpace();
      if (slotPath.isAbsolute()) {
        container = space.getRootComponent();
      }
      else {
        container = object; 
      }
    }
    else {
      throw new Error("Slot Scheme Unsupported ORD base: " + object.getType());
    }
    
    // Hack for Virtual Space
    if (isVirtual && slotPath.getBody() === "") {
      newTarget.object = space;
      cursor.resolveNext(newTarget, options);
      return;
    }
    
    // Avoid a network call if the Component Space doesn't support callbacks
    if (netcall) {
      if (space === null) {
        netcall = false;
      }
      else {
        netcall = space.hasCallbacks();
      }
    }
    
    var value = container,
        nameAtDepth,   
        slot = null, 
        propertyPath = null, 
        depthRequestIndex = -1,
        backupDepth = slotPath.getBackupDepth(),
        k, i, j;
    
    // first walk up using backup 
    for (k = 0; k < backupDepth; ++k) {
      container = container.getType().isComponent() ? container.getParent() : null;
      value = container;
      
      if (value === null) { 
        throw new Error("Cannot walk backup depth: " + object);
      }
    }
                  
    // Walk the SlotPath
    for (i = 0; i < slotPath.depth(); ++i) {
      nameAtDepth = slotPath.nameAt(i);    
      
      if (isVirtual) {
        nameAtDepth = baja.SlotPath.escape(nameAtDepth);
      }
            
      if (value.getType().isComplex()) {          
        slot = value.getSlot(nameAtDepth);
      }
      else {
        throw new Error("Unable to resolve ORD: " + slotPath);
      }
                 
      if (slot === null) {
        if (netcall) {    
          depthRequestIndex = i;         
          break;
        }
      
        throw new Error("Unresolved ORD - unable to resolve SlotPath");
      }
      
      if (!slot.isProperty()) {
        if (i !== slotPath.depth() - 1) { // Actions and Topics must be at the final depth
          throw new Error("Unresolved ORD - Actions/Topics must be at final depth: " + slotPath); 
        }
        
        newTarget.container = container;
        newTarget.slot = slot;
        
        // Resolve the next part of the ORD and feed this target into it
        cursor.resolveNext(newTarget, options);
        return;
      }
      
      value = value.get(slot);
      
      // If we have a Component without a Handle then it's probably a value from a frozen Property
      // that's completely unloaded. In this case, we need to perform a load for this Component
      if (value.getType().isComponent() && value.$handle === null && space !== null) {
        if (netcall) {    
          depthRequestIndex = i;         
          break;
        }
      
        throw new Error("Unresolved ORD - unable to load handle for Component");
      }
      
      if (propertyPath === null && value.getType().is("baja:IPropertyContainer")) {
        container = value;
      }
      else {
        if (propertyPath === null) {
          propertyPath = [];
        }
        propertyPath.push(slot);
      }
    }
    
    // Make a network call to resolve the SlotPath
    var slotOrd,
        batch;
        
    if (netcall && depthRequestIndex > -1) {
      batch = new baja.comm.Batch();
       
      // Load ops on Slots that don't exist
      slotOrd = "slot:";
      if (slotPath.isAbsolute()) {
        slotOrd += "/";
      }
      
      var slotPathInfo = [];
      for (j = 0; j < slotPath.depth(); ++j) { 
        if (j >= depthRequestIndex) {
        
          slotPathInfo.push({
            o: slotOrd,
            sn: isVirtual ? baja.SlotPath.escape(slotPath.nameAt(j)) : slotPath.nameAt(j)
          });
        }
        
        if (j > 0) {
          slotOrd += "/";
        }        
        slotOrd += isVirtual ? baja.SlotPath.escape(slotPath.nameAt(j)) : slotPath.nameAt(j);
      }
                 
      var newOk = function () {
        // Now the network calls have all been committed, resolve this
        // Slot path without making any network calls
        scheme.resolve(target, query, cursor, options, /*network call*/false);
      };
      
      var newFail = function (err) {
        options.callback.fail(err);
      };
      
      // Attempt to load the missing Slot Path information
      space.getCallbacks().loadSlotPath(slotPathInfo,
                                        container,      
                                        new Callback(newOk, newFail, batch));
      
      batch.commit();
      return;
    }
    else if (slot === null && slotPath.depth() > 0) {
      throw new Error("Unable to resolve ORD: " + slotPath);
    }
    
    if (propertyPath === null) {
      newTarget.object = container;
    }
    else {
      // If there was a Property Path then use the first Property in the Property Path as the Slot
      slot = propertyPath[0];    
      newTarget.container = container; 
      newTarget.object = value;
      newTarget.slot = slot; 
      newTarget.propertyPath = propertyPath;
    }
    
    // Resolve the next part of the ORD and feed this target into it
    cursor.resolveNext(newTarget, options);
  }
  
  function slotSchemeResolveFull(scheme, target, query, cursor, options, netcall) {
    
    var newTarget = new OrdTarget(target),
        object = target.object;
    
    newTarget.slotPath = query;
    
    var slotPath = newTarget.slotPath, // SlotPath
        space = null,     // Space
        container = null, // base container
        isVirtual = slotPath.constructor !== baja.SlotPath;
        
    netcall = bajaDef(netcall, true);
        
    // TODO: Property Container support
    
    if (object.getType().is("baja:VirtualGateway") && isVirtual) {
      space = object.getVirtualSpace();
      container = space.getRootComponent();
    }
    else if (object.getType().is("baja:ComponentSpace")) {
      space = object;
      container = object.getRootComponent();
    }    
    else if (object.getType().isComponent()) {
      space = object.getComponentSpace();
      if (slotPath.isAbsolute()) {
        container = space.getRootComponent();
      }
      else {
        container = object; 
      }
    }
    else {
      throw new Error("Slot Scheme Unsupported ORD base: " + object.getType());
    }
    
    // Hack for Virtual Space
    if (isVirtual && slotPath.getBody() === "") {
      newTarget.object = space;
      cursor.resolveNext(newTarget, options);
      return;
    }
    
    // Avoid a network call if the Component Space doesn't support callbacks
    if (netcall) {
      if (space === null) {
        netcall = false;
      }
      else {
        netcall = space.hasCallbacks();
      }
    }
    
    var value = container, 
        nameAtDepth,    
        slot = null, 
        propertyPath = null,
        batch = new baja.comm.Batch(),
        depthRequestIndex = 0,
        backupDepth = slotPath.getBackupDepth(),
        k, i, j;
    
    // first walk up using backup 
    for (k = 0; k < backupDepth; ++k) {
      container = container.getType().isComponent() ? container.getParent() : null;
      value = container;
      
      if (value === null) { 
        throw new Error("Cannot walk backup depth: " + object);
      }
    }
            
    // Attempt to load slots on the container if needed
    if (container.getType().isComplex()) {
      container.loadSlots({
        "ok": baja.ok, 
        "fail": emptyFail, 
        "batch": batch
      });
    }
        
    if (batch.isEmpty()) {
      // Walk the SlotPath
      for (i = 0; i < slotPath.depth(); ++i) {
        nameAtDepth = slotPath.nameAt(i); 

        if (isVirtual) {
          nameAtDepth = baja.SlotPath.escape(nameAtDepth);
        }        
              
        if (value.getType().isComplex()) {
          value.loadSlots({
            "ok": baja.ok, 
            "fail": emptyFail, 
            "batch": batch
          });
          
          slot = value.getSlot(nameAtDepth);
        }
        else {
          throw new Error("Unable to resolve ORD: " + slotPath);
        }
             
        if (netcall && !batch.isEmpty()) {    
          depthRequestIndex = i;         
          break;
        }
        
        if (slot === null) {
          throw new Error("Unresolved ORD - unable to resolve SlotPath");
        }
        
        if (!slot.isProperty()) {
          if (i !== slotPath.depth() - 1) { // Actions and Topics must be at the final depth
            throw new Error("Unresolved ORD - Actions/Topics must be at final depth: " + slotPath); 
          }
          
          newTarget.container = container;
          newTarget.slot = slot;
          
          // Resolve the next part of the ORD and feed this target into it
          cursor.resolveNext(newTarget, options);
          return;
        }
        
        value = value.get(slot);
        
        // If we have a Component without a Handle then it's probably a value from a frozen Property
        // that's completely unloaded. In this case, we need to perform a load for this Component
        if (value.getType().isComponent() && value.$handle === null && space !== null) {
          if (netcall) {    
            depthRequestIndex = i;         
            break;
          }
      
          throw new Error("Unresolved ORD - unable to load handle for Component");
        }
        
        if (propertyPath === null && value.getType().is("baja:IPropertyContainer")) {
          container = value;
        }
        else {
          if (propertyPath === null) {
            propertyPath = [];
          }
          propertyPath.push(slot);
        }
      }
    }

    // Make a network call to resolve the SlotPath
    var slotOrd;
    if (!batch.isEmpty() && netcall) {
        
      // Load ops on Slots that don't exist
      slotOrd = "slot:";
      if (slotPath.isAbsolute()) {
        slotOrd += "/";
      }   
      for (j = 0; j < slotPath.depth(); ++j) {        
        if (j > 0) {
          slotOrd += "/";
        }        
        slotOrd += isVirtual ? baja.SlotPath.escape(slotPath.nameAt(j)) : slotPath.nameAt(j);
        
        if (j >= depthRequestIndex) {
          space.getCallbacks().loadSlots(slotOrd, 0, new Callback(baja.ok, emptyFail, batch));
        }
      }
      
      var newOk = function () {
        // Now the network calls have all been committed, resolve this
        // Slot path without making any network calls
        scheme.resolve(target, query, cursor, options, false);
      };
      
      var newFail = function (err) {
        options.callback.fail(err);
      };
            
      // Finally perform a poll so all of the sync ops can be processed from all the subsequent load ops
      baja.comm.poll(new Callback(newOk, newFail, batch));
      
      batch.commit();
      return;
    }
    else if (slot === null && slotPath.depth() > 0) {
      throw new Error("Unable to resolve ORD: " + slotPath);
    }
    
    if (propertyPath === null) {
      newTarget.object = container;
    }
    else {
      // If there was a Property Path then use the first Property in the Property Path as the Slot
      slot = propertyPath[0];    
      newTarget.container = container; 
      newTarget.object = value;
      newTarget.slot = slot; 
      newTarget.propertyPath = propertyPath;
    }
    
    // Resolve the next part of the ORD and feed this target into it
    cursor.resolveNext(newTarget, options);
  } 
     
  /**
   * Called when an ORD is resolved.
   *
   * @private
   *
   * @see baja.OrdScheme#resolve
   *
   * @param {ORDTarget} target  the current ORD Target.
   * @param {Object} query  the ORD Query used in resolving the ORD.
   * @param cursor  the ORD Query List cursor used for helping to asynchronously resolve the ORD.
   * @param {Object} options  options used for resolving an ORD.
   * @param {Boolean} [netcall] optional boolean to specify whether a network call should be attempted (used internally).
   */
  baja.SlotScheme.prototype.resolve = function (target, query, cursor, options, netcall) {
    if (options.full) {
      slotSchemeResolveFull(this, target, query, cursor, options, netcall);
    }
    else {
      slotSchemeResolve(this, target, query, cursor, options, netcall);
    }
  };
    
  /**
   * Return an ORD Query for the scheme.
   *
   * @returns {Object}
   */
  baja.SlotScheme.prototype.parse = function (schemeName, body) {
    return new baja.SlotPath(body);
  };

  function parseSlotPathBackup(slotPath) {
    var body = slotPath.getBody(),
        len = body.length,
        c0, c1, c2, i;
    
    for (i = 0; i < len; i += 3) {
      c0 = body.charAt(i);
      c1 = (i + 1 < len) ? body.charAt(i + 1) : -1;
      c2 = (i + 2 < len) ? body.charAt(i + 2) : "/";
      
      if (c0 !== ".") {
        return i;
      }
      
      if (c1 !== "." || c2 !== "/") {
        // Since we know c0 is a period ('.'), we can check to see
        // if that is a valid path name.  For SlotPath's, it
        // should always return false, so the SyntaxException
        // will be thrown.  But for subclasses (such as VirtualPath),
        // this may be a legal path name, so we don't want to throw
        // the Syntax Exception.
        if (slotPath.isValidPathName(c0)) {
          return i;
        }
          
        throw new Error("Expecting ../ backup");
      }
      
      slotPath.$backupDepth++;
    }
    
    return len; 
  }
  
  function parseSlotPathNames(slotPath, start) {    
    var body = slotPath.getBody(),
        len = body.length,
        n = 0, // Array index
        c, // Character
        nm,  // Name
        i;
    
    if (start >= len) {
      return;
    }
    
    if (body.charAt(len - 1) === "/") {
      throw new Error("Invalid Slot Path - Trailing Slash");
    }
    
    for (i = start; i < len; ++i) {
      c = body.charAt(i);
      
      if (c === "/") {
        if (i === start) {
          throw new Error("Invalid Slot Path - Double Slashes");
        }
        nm = body.substring(start, i);
        
        if (!slotPath.isValidPathName(nm)) {
          throw new Error("Invalid name in path");
        }
        
        slotPath.$names.push(nm);
        start = i + 1;
      }
    }
  
    nm = body.substring(start, len);
    
    if (!slotPath.isValidPathName(nm)) {
      throw new Error("Invalid name in path");
    }
  
    slotPath.$names.push(nm);
  }
     
  function parseSlotPath(slotPath) {
    slotPath.$names = [];
    slotPath.$abs = false;
    
    if (slotPath.getBody().length === 0) {
      return;
    }
    
    var s = 0, // Start
        c = slotPath.getBody().charAt(0);
        
    if (c === "/") {
      slotPath.$abs = true;
      s = 1;
    }
    else if (c === ".") {
      s = parseSlotPathBackup(slotPath);
    }
        
    parseSlotPathNames(slotPath, s);
  }
        
  /**
   * @class SlotPath.
   * <p>
   * SlotPath is used for resolving BValues using slot names.
   *
   * @name baja.SlotPath
   * @extends OrdQuery
   *
   * @param {String} body  the body of the ORD scheme
   */  
  baja.SlotPath = function (body) {
    baja.SlotPath.$super.call(this, {
      scheme: baja.SlotScheme.DEFAULT,
      schemeName: "slot",
      body: strictArg(body, String)
    });
    this.$abs = false;
    this.$names = [];
    this.$backupDepth = 0;
    parseSlotPath(this);
  }.$extend(OrdQuery);
  
  /**
   * Make a Slot Path.
   *
   * @private
   *
   * @param {Object} body  the body.
   * @returns {baja.SlotPath} the new Slot Path.
   */
  baja.SlotPath.prototype.makeSlotPath = function (body) {
    return new baja.SlotPath(body);
  };
      
  /**
   * Return the SlotPath depth.
   *
   * @returns the SlotPath depth.
   */ 
  baja.SlotPath.prototype.depth = function () {
    return this.$names.length;
  };
  
  /**
   * Return the SlotPath backup depth.
   *
   * @returns the SlotPath depth.
   */ 
  baja.SlotPath.prototype.getBackupDepth = function () {
    return this.$backupDepth;
  };
  
  /**
   * Return the name at the given depth.
   *
   * @param {Number} depth  the specified depth for the name.
   *
   * @returns {String} the name at the specified depth.
   */ 
  baja.SlotPath.prototype.nameAt = function (depth) {
    baja.strictArg(depth, Number);
    return this.$names[depth];
  };
  
  /**
   * Return true if the SlotPath is absolute.
   *
   * @returns {Boolean} true if the SlotPath is absolute.
   */ 
  baja.SlotPath.prototype.isAbsolute = function () {
    return this.$abs;
  };
            
  /**
   * Return whether the specified path name is valid.
   *
   * @param {String} pathName the path name to validate.
   *
   * @returns {Boolean} true if the slot name is valid.
   */ 
  baja.SlotPath.prototype.isValidPathName = function (pathName) {
    return baja.SlotPath.isValidName(pathName);
  };
  
  /**
   * Return whether the slot name is valid
   *
   * @param {String} nm the name to be validated.
   *
   * @returns {Boolean} true if the slot name is valid.
   */ 
  baja.SlotPath.isValidName = function (nm) {
    return (/^([a-zA-Z$]([a-zA-Z0-9_]|(\$([0-9a-fA-F]{2}))|(\$u([0-9a-fA-F]{4})))*)$/).test(nm); 
  };
  
  /**
   * Verify whether the slot name is valid.
   *
   * @param {String} nm the name to be validated.
   *
   * @throws error if the slot name isn't valid.
   */ 
  baja.SlotPath.verifyValidName = function (nm) {
    if (!baja.SlotPath.isValidName(nm)) {
      throw new Error("Illegal name for Slot: " + nm);
    }
  };
  
  // Converts a character
  function convertSlotPathChar(c) {
    var code = c.charCodeAt(0),
        hex = code.toString(16),
        buf = "$";
    
    if (code < 0x10) {
      buf += "0" + hex;
    }
    else if (code < 0x100) {
      buf += hex;
    }
    else if (code < 0x1000) {
      buf += "u0" + hex;
    }
    else {
      buf += "u" + hex;
    }
    return buf;
  }
  
  /**
   * Escape the string so it becomes a valid name for a slot.
   *
   * @see baja.SlotPath.unescape
   *
   * @param {String} str the string to be escaped.
   *
   * @returns {String} the escaped String.
   */ 
  baja.SlotPath.escape = function (str) {    
    if (str.length === 0) {
      return str;
    }
        
    // Convert first character
    var res = str.charAt(0).replace(/[^a-zA-Z]/, function (c) {
      return convertSlotPathChar(c);
    });
    
    if (str.length > 1) {   
      // Convert everything after first character
      res += str.substring(1, str.length).replace(/[^a-zA-Z0-9_]/g, function (c) {
        return convertSlotPathChar(c);
      });
    }
    
    return res;
  };
  
  /**
   * Unescape the string so all escaped characters become readable.
   *
   * @see baja.SlotPath.escape
   *
   * @param {String} str the string to be unescaped.
   *
   * @returns {String} the unescaped String.
   */ 
  baja.SlotPath.unescape = function (str) {
    if (str.length === 0) {
      return str;
    }
    
    // Convert from $xx    
    str = str.replace(/\$[0-9a-fA-F]{2}/g, function (s) {
      return String.fromCharCode(parseInt(s.substring(1, s.length), 16));
    });
    
    // Convert from $uxxxx
    str = str.replace(/\$u[0-9a-fA-F]{4}/g, function (s) {
      return String.fromCharCode(parseInt(s.substring(2, s.length), 16));
    });
    
    return str;
  };
  
  /**
   * Merge this path with the specified path.
   *
   * @param {baja.SlotPath} a
   * @returns {String} the body of the SlotPath.
   */ 
  baja.SlotPath.prototype.merge = function (a) {
    // if absolute then return a
    if (a.isAbsolute()) {
      return a.getBody();
    }

    // otherwise we have no backup or a backup 
    // contained within my path
    var s = "";
    if (this.isAbsolute()) { 
      s += "/";
    }

    // if the backup is past me
    if (a.getBackupDepth() > 0 && a.getBackupDepth() > this.depth()) {
      // can't handle backup past absolute root
      if (this.isAbsolute()) {
        throw new Error("Invalid merge " + this + " + " + a); 
      }        
      
      var backups = a.getBackupDepth() - this.depth() + this.getBackupDepth(), 
          i;
      for (i = 0; i < backups; ++i) {
        s += "../";
      }
    }
    
    // add my path minus backup
    var needSlash = false,
        x;
    for (x = 0; x < this.depth() - a.getBackupDepth(); ++x)
    {
      if (needSlash) {
        s += "/";
      }
      else {
        needSlash = true;
      }
      s += this.nameAt(x);
    }
      
    // now add relative path
    var j;
    for (j = 0; j < a.depth(); ++j) {
      if (needSlash) {
        s += '/'; 
      }
      else {
        needSlash = true;
      }
      s += a.nameAt(j);
    }
      
    return s;
  };
  
  /**
   * Normalize the ORD Query list.
   *
   * @private
   *
   * @param {baja.OrdQueryList} list  the ORD Query List.
   * @param {Number} index  the ORD Query List index.
   * @param {Boolean} return true if the list was modified.
   */
  baja.SlotPath.prototype.normalize = function (list, index) {
    var current = list.get(index),
        next = list.get(index + 1),
        modified = false;
    
    // Merge two Slot paths together
    if (next && next.getSchemeName() === current.getSchemeName()) {
    
      // Merge the slot paths together
      var currentSlotPath = this.makeSlotPath(current.getBody()),
          newSlotPath = this.makeSlotPath(currentSlotPath.merge(this.makeSlotPath(next.getBody())));
      
      // Update the OrdQueryList
      list.set(index, newSlotPath);
      
      // Remove the next item from the list
      list.remove(index + 1);
      
      modified = true;
    }
    
    return modified;
  };
      
  ////////////////////////////////////////////////////////////////
  // Handle Scheme
  ////////////////////////////////////////////////////////////////   
  
  /**
   * @class Handle ORD Scheme.
   * <p>
   * This scheme resolves a SlotPath to a handle. Each Component in a ComponentSpace has a 
   * unique handle. This is a great way to keep track of a Component regardless of whether
   * its SlotPath changes.
   *
   * @name baja.HandleScheme
   * @extends baja.OrdScheme
   * @private
   */  
  baja.HandleScheme = function () {
    baja.HandleScheme.$super.apply(this, arguments);
  }.$extend(baja.OrdScheme);
  
  /**
   * Default Handle ORD Scheme instance
   * @private
   */
  baja.HandleScheme.DEFAULT = new baja.HandleScheme();
  
  // Register Type
  baja.HandleScheme.registerType("baja:HandleScheme"); 
     
  /**
   * Called when an ORD is resolved.
   *
   * @private
   *
   * @see baja.OrdScheme#resolve
   *
   * @param {ORDTarget} target  the current ORD Target.
   * @param {Object} query  the ORD Query used in resolving the ORD.
   * @param cursor  the ORD Query List cursor used for helping to asynchronously resolve the ORD.
   * @param {Object} options  options used for resolving an ORD.
   */ 
  baja.HandleScheme.prototype.resolve = function (target, query, cursor, options) {
    
    var object = target.object,
        handle = query.getBody(),
        space;
        
    if (!baja.hasType(object)) {
      throw new Error("Not based via ComponentSpace. Invalid Object");
    }
    else if (object.getType().isComponent()) {
      space = object.getComponentSpace();
    }
    else if (object.getType().is("baja:ComponentSpace")) {
      space = object;
    }
    
    // Pick up whether the Space is null
    if (!baja.hasType(space)) {
      throw new Error("Not based via ComponentSpace");
    }
    
    var ok = function (comp) {
      var newTarget = new OrdTarget(target);
      newTarget.object = comp;
      cursor.resolveNext(newTarget, options);
    };
    
    var fail = function (err) {
      options.callback.fail(err);
    };
    
    // Resolve the handle in the Space (may make network calls if necessary)
    space.resolveByHandle({
      "handle": handle, 
      "ok": ok, 
      "fail": fail
    });
  };
  
  ////////////////////////////////////////////////////////////////
  // Service Scheme
  //////////////////////////////////////////////////////////////// 
  
  /**
   * @class Service ORD Scheme.
   * <p>
   * This scheme is used to resolve a Server running in a Station.
   *
   * @name baja.ServiceScheme
   * @extends baja.OrdScheme
   * @private
   */    
  baja.ServiceScheme = function () {
    baja.ServiceScheme.$super.apply(this, arguments);
  }.$extend(baja.OrdScheme);
  
  /**
   * Default Service Scheme instance.
   * @private
   */
  baja.ServiceScheme.DEFAULT = new baja.ServiceScheme();
  
  // Register Type
  baja.ServiceScheme.registerType("baja:ServiceScheme"); 
  
  /**
   * Called when an ORD is resolved.
   *
   * @private
   *
   * @see baja.OrdScheme#resolve
   *
   * @param {ORDTarget} target  the current ORD Target.
   * @param {Object} query  the ORD Query used in resolving the ORD.
   * @param cursor  the ORD Query List cursor used for helping to asynchronously resolve the ORD.
   * @param {Object} options  options used for resolving an ORD.
   */ 
  baja.ServiceScheme.prototype.resolve = function (target, query, cursor, options) {
    
    var object = target.object,
        typeSpec = query.getBody(),
        space;
    
    if (!baja.hasType(object)) {
      throw new Error("Not based via ComponentSpace. Invalid Object");
    }
    else if (object.getType().isComponent()) {
      space = object.getComponentSpace();
    }
    else if (object.getType().is("baja:ComponentSpace")) {
      space = object;
    }
    else if (object.getType().is("baja:ISession") && object.station) {
      space = object.station;
    }
    
    // Pick up whether the Space is null
    if (!baja.hasType(space)) {
      throw new Error("Not based via ComponentSpace");
    }
    
    var ok = function (comp) {
      var newTarget = new OrdTarget(target);
      newTarget.object = comp;
      cursor.resolveNext(newTarget, options);
    };
    
    var fail = function (err) {
      options.callback.fail(err);
    };
    
    if (space.hasCallbacks()) {
      space.getCallbacks().getService(typeSpec, new Callback(ok, fail));
    }
    else {
      throw new Error("Unable to resolve Service: " + typeSpec);
    }
  };
  
  ////////////////////////////////////////////////////////////////
  // View Scheme
  //////////////////////////////////////////////////////////////// 
  
  /**
   * @class View ORD Scheme.
   * <p>
   * This scheme is used to process View query related information.
   *
   * @name baja.ViewScheme
   * @extends baja.OrdScheme
   * @private
   */    
  baja.ViewScheme = function () {
    baja.ViewScheme.$super.apply(this, arguments);
  }.$extend(baja.OrdScheme);
  
  /**
   * Default View Scheme instance.
   * @private
   */
  baja.ViewScheme.DEFAULT = new baja.ViewScheme();
  
  // Register Type
  baja.ViewScheme.registerType("baja:ViewScheme"); 
  
  /**
   * Called when an ORD is resolved.
   *
   * @private
   *
   * @see baja.OrdScheme#resolve
   *
   * @param {ORDTarget} target  the current ORD Target.
   * @param {Object} query  the ORD Query used in resolving the ORD.
   * @param cursor  the ORD Query List cursor used for helping to asynchronously resolve the ORD.
   * @param {Object} options  options used for resolving an ORD.
   */ 
  baja.ViewScheme.prototype.resolve = function (target, query, cursor, options) { 
    // Note down the view query information onto the ORD target so it can be accessed
    target.view = {
      id: query.getViewId(),
      params: query.getParameters()
    };
    
    cursor.resolveNext(target, options);
  };
  
  /**
   * Return an ORD Query for the scheme.
   *
   * @returns {OrdQuery}
   */
  baja.ViewScheme.prototype.parse = function (schemeName, body) {
    return new baja.ViewQuery(body);
  };
  
  function parseViewQuery(body) {
    // Parse the view query (viewId?params)
    var res;
    if (body) {
      res = /^([^?]*)(?:[\?](.*))?$/.exec(body);
    }
    
    if (!res || (res && res.length < 2)) {
      throw new Error("Invalid view query: " + body);
    }
    
    // Note down the view query information onto the ORD target so it can be accessed
    var view = {
      id: res[1] || "",
      params: {}
    };
    
    // If there are some view parameters then parse them
    if (res[2]) {
      var regex = /([^=]+)\=([^;]+)\;?/g,
          params = regex.exec(res[2]);
          
      while (params) { 
        view.params[decodeURIComponent(params[1])] = decodeURIComponent(params[2]);
        params = regex.exec(res[2]);
      }
    }
    
    return view;
  }
  
  /**
   * @class ViewQuery
   * <p>
   * ViewQuery defines user agent information.
   *
   * @name baja.ViewQuery
   * @extends OrdQuery
   *
   * @param {String|Object} body the view query body or an Object Literal for 
   *                             the view id and parameters.
   * @param {String} [body.id] view id.
   * @param {Object} [body.params] view parameters (key value pairs in an Object Literal).
   */  
  baja.ViewQuery = function (body) {
    // If an Object is passed in then attempt to get id and params from object
    if (body && typeof body === "object") {
      var params = body.params || {};
    
      this.$view = {
        id: body.id || "",
        params: params
      };
    
      // Build up a new view query body String
      var i = 0;
      body = this.$view.id;
          
      baja.iterate(params, function (prop, propName) {
        if (i === 0) {
          body += "?";
        }
        else if (i > 0) {
          body += ";";
        }
        body += encodeURIComponent(propName) + "=" + encodeURIComponent(prop);
        ++i;
      });
    }
    else {
      this.$view = parseViewQuery(body);
    }
  
    baja.ViewQuery.$super.call(this, {
      scheme: baja.ViewScheme.DEFAULT,
      schemeName: "view",
      body: strictArg(body, String)
    });
  }.$extend(OrdQuery);
  
  /**
   * Normalize the query and return true if modified.
   *
   * @private
   *
   * @param {OrdQueryList} list
   * @param {Number} index
   *
   * @returns {Boolean}
   */
  baja.ViewQuery.prototype.normalize = function (list, index) {
    var modified = false;     
    if (list.get(index + 1) && 
        list.get(index + 1).getSchemeName().equals("view")) {
      // If the next scheme is the same as this one then
      list.remove(index + 1);
      modified = true;
    }      
    else if (index < list.size() - 1) {
      // Ensure view query is always the last in the list
      list.remove(index);
      modified = true;
    }
    return modified;
  };
  
  /**
   * Return the view id (this could be view type spec or the name of a Px view).
   *
   * @returns {String}
   */
  baja.ViewQuery.prototype.getViewId = function () {
    return this.$view.id;
  };
    
  /**
   * Return the view parameters as an Object Literal.
   * <p>
   * Please note, this returns a defensive copy of the parameters.
   *
   * @returns {Object} the parameters.
   */
  baja.ViewQuery.prototype.getParameters = function () {
    var o = {};
    baja.iterate(this.$view.params, function (prop, propName) {
      o[propName] = prop;
    });
    return o;
  };
  
  ////////////////////////////////////////////////////////////////
  // Batch Resolve
  //////////////////////////////////////////////////////////////// 
  
  // Enclose BatchResolve in its own anonymous function as it uses quite a lot of inner private functions
  (function batchRes() {
  
    /**
     * @class BatchResolve is used to resolve a list of ORDs together.
     * <p>
     * This method should always be used if multiple ORDs need to be resolved at the same time.
     *
     * @name baja.BatchResolve
     * @extends BaseBajaObj
     *
     * @param {Array} ords an array of ORDs to resolve. The array can be Strings or baja.Ord.
     */      
    baja.BatchResolve = function (ords) {
      baja.BatchResolve.$super.apply(this, arguments);
      strictArg(ords, Array);        
      // Ensure ORDs are normalized
      var items = [], i;
      for (i = 0; i < ords.length; ++i) {
        items.push({
          ord: baja.Ord.make(ords[i].toString()).normalize(),
          target: null
        });
      }
      this.$items = items;
      this.$groups = [];
      this.$ok = baja.ok;
      this.$fail = baja.fail;
      this.$resolved = false;
    }.$extend(BaseBajaObj);
    
    /**
     * Return the number of items in the Batch.
     *
     * @returns {Number}
     */  
    baja.BatchResolve.prototype.size = function () {
      return this.$items.length;
    };
     
    /**
     * Return the ORD at the specified index or null if the index is invalid.
     *
     * @param {Number} index
     * @returns {baja.Ord}
     */      
    baja.BatchResolve.prototype.getOrd = function (index) {
      strictArg(index, Number);
      var t = this.$items[index];
      return t ? t.ord : null;
    };
    
    /**
     * Return true if the ORD at the specified index has successfully resolved.
     *
     * @param {Number} index
     * @returns {Boolean}
     */  
    baja.BatchResolve.prototype.isResolved = function (index) {
      strictArg(index, Number);
      var t = this.$items[index];
      return t && t.target ? true : false;
    };
    
    /**
     * Return the error for a particular ORD that failed to resolve or null for no error.
     *
     * @param {Number} index
     * @returns {Error} the error or null if no error.
     */
    baja.BatchResolve.prototype.getFail = function (index) {
      strictArg(index, Number);
      var t = this.$items[index];
      return t && t.fail ? t.fail : null;
    };
    
    /**
     * Return the ORD Target at the specified index.
     * <p>
     * If the ORD failed to resolve, an error will be thrown.
     *
     * @param {Number} index
     * @returns {OrdTarget} the ORD Target
     * @throws {Error} thrown if ORD failed to resolve
     */
    baja.BatchResolve.prototype.getTarget = function (index) {
      strictArg(index, Number);
      var t = this.$items[index];
      if (t && t.target) {
        return t.target;
      }
      else {
        throw t && t.fail ? t.fail : new Error("Unresolved ORD");
      }
    };
    
    /**
     * Return an array of resolved ORD Targets.
     * <p>
     * If any of the ORDs failed to resolve, an error will be thrown.
     *
     * @returns {Array} an array of ORD Targets
     * @throws {Error} thrown if any ORDs failed to resolve
     */
    baja.BatchResolve.prototype.getTargets = function () {
      var targets = [], i;
      for (i = 0; i < this.$items.length; ++i) {
        targets.push(this.getTarget(i));
      }
      return targets;
    };
    
    /**
     * Return an array of resolved objects.
     * <p>
     * If any of the ORDs failed to resolve, an error will be thrown.
     *
     * @returns {Array} an array of objects
     * @throws {Error} thrown if any ORDs failed to resolve
     */
    baja.BatchResolve.prototype.getTargetObjects = function () {
      var objects = [], i;
      for (i = 0; i < this.$items.length; ++i) {
        objects.push(this.get(i));
      }
      return objects;
    };
    
    /**
     * Return the resolved object at the specified index.
     * <p>
     * If the ORD failed to resolve, an error will be thrown.
     *
     * @param {Number} index
     * @returns the resolved object
     * @throws {Error} thrown if the ORD failed to resolve
     */
    baja.BatchResolve.prototype.get = function (index) {
      return this.getTarget(index).getObject();
    };
    
    /**
     * For each resolved target, call the specified function.
     * <p>
     * If any ORDs failed to resolve, an error will be thrown.
     * <p>
     * When the function is called, the 'this' will be the resolved Component's target.
     * The target's object will be passed as a parameter into the function.
     *
     * @param {Function} func
     * @throws {Error} thrown if any of the ORDs failed to resolve
     */
    baja.BatchResolve.prototype.each = function (func) {
      strictArg(func, Function);
      var target,
          result, 
          i,
          obj;
      
      for (i = 0; i < this.$items.length; ++i) {
        target = this.getTarget(i);
        try {
          obj = target.getComponent();
          if (!obj) {
            obj = target.getObject();
          }
          
          result = func.call(obj, target.getObject(), i);
          if (result) {
            return result;
          }
        }
        catch (err) {
          baja.error(err);
        }
      }
    };
    
    function runSequential(funcs, cb) {
      var len = funcs.length,
          i = -1;
      
      function runNext() {
        i++;
        
        if (i === len) {
          // why no ok/fail? because one ORD failure in a batch does not stop
          // the process, it only fails that particular ORD - we move on to
          // the next step even if one ORD in our batch has failed.
          cb();
        } else {
          baja.runAsync(function () {
            funcs[i]({
              ok: runNext,
              fail: runNext
            });
          });
        }
      }
    
      runNext();
    }
    
    function endResolve(batchResolve, obj) { 
      // Called at the very end once everything has resolved
      // If there are any unresolved ORDs then fail the callback
      var failedErr, i;
      for (i = 0; i < batchResolve.$items.length; ++i) {
        if (!batchResolve.$items[i].target) {
          failedErr = batchResolve.$items[i].fail || new Error("Unresolved ORD");
          break;            
        }          
      }
      
      if (failedErr) {
        batchResolve.$fail.call(batchResolve, failedErr);
      }
      else {
        batchResolve.$ok.call(batchResolve);
      }
    }
    
    function getSubscribableComponents(batchResolve) {
      var comps = [],
          groups = batchResolve.$groups,
          items,
          target,
          i,
          j,
          c;
      
      for (i = 0; i < groups.length; i++) {
        items = groups[i].items;
        
        for (j = 0; j < items.length; j++) {
          target = items[j].target;
          
          if (target) {
            c = target.getComponent();
            
            // Only try to subscribe to components that are mounted 
            // and support subscription
            if (c && c.isMounted() && c.getComponentSpace().hasCallbacks()) {
              comps.push(c);
            }
          }
        }
      }
      
      return comps;
    }
    
    function subscribeTargets(batchResolve, obj) {    
      // If there's no lease and no subscriber then automatically commit

      var batch = new baja.comm.Batch(),
          comps = [],
          subscriber = obj.subscriber,
          lease = obj.lease;
      
      if (subscriber || lease) {
        comps = getSubscribableComponents(batchResolve);
        
        // If we can subscribe then batch up a subscription network call      
        if (comps.length > 0) {
          if (subscriber) {
            // Subscribe using Subscriber
            subscriber.subscribe({
              comps: comps,
              batch: batch
            });
          }
          
          // If leasing then lease the Components for a pre-defined period of time
          if (lease) {
            baja.Component.lease({
              comps: comps,
              time: obj.leaseTime,
              batch: batch
            });
          }
        }
      }
      
      batch.addCallback(function () {
        endResolve(batchResolve, obj);
      });

      batch.commit(); 
    }
    
    function resolveOrds(batchResolve, obj) { 
      var resolutions = [];
      
      baja.iterate(batchResolve.$items, function (item) {
        resolutions.push(function (cb) {
          if (item.unknown) {
            cb.ok();
          } else {
            item.ord.resolve({
              ok: function (target) {
                item.target = target;
                cb.ok();
              },
              fail: function (err) {
                item.fail = err;
                cb.fail(err);
              }
            });
          }
        });
      });

      runSequential(resolutions, function () {
        subscribeTargets(batchResolve, obj);
      });
    }
    
    /*
     * How deep into the component is the given slot path already loaded?
     * Gets the index at which the slot path is exhausted and we need to make
     * a network call to finish it. -1 if no network calls are needed.
     */
    function getDepthRequestIndex(comp, path) {
      var isVirtual = path instanceof baja.VirtualPath,
          nameAtDepth,
          slot,
          x;
      
      // Find out what exists and doesn't exist
      for (x = 0; x < path.depth(); ++x) {
        nameAtDepth = path.nameAt(x);
      
        if (isVirtual) {
          nameAtDepth = baja.SlotPath.escape(nameAtDepth);
        }
        
        slot = comp.getSlot(nameAtDepth);
        
        // If there's no slot present then we need to try and make a network call for it.
        if (slot === null) {
          return x;
        }
        
        // If the Slot isn't a Property then bail
        if (!slot.isProperty()) {
          return -1;
        }
        
        // If the Property isn't a Component then bail since we're only interested
        // in really loading up to a Component
        if (!slot.getType().isComponent()) {
          return -1;
        }
        
        comp = comp.get(slot);
      }
      
      return -1;
    }
    
    
    function addToRequestMap(map, path, depthRequestIndex) {
      // Load ops on Slots that don't exist
      var slotOrd = "slot:/",
          isVirtual = path instanceof baja.VirtualPath,
          fullPath,
          o,
          nameAt,
          sn,
          i,
          arg;
      
      for (i = 0; i < path.depth(); i++) {
        // If we've gone past the depth we need to request then build up the network
        // calls we need to make
        
        nameAt = path.nameAt(i);
        
        o = slotOrd;
        sn = isVirtual ? baja.SlotPath.escape(nameAt) : nameAt;

        if (i >= depthRequestIndex) {
          fullPath = o + "/" + sn;
          
          // Only request the Slot Path if it already isn't going to be requested
          if (!map.hasOwnProperty(fullPath)) {
            map[fullPath] = { o: o, sn: sn };
          }
        }
        
        if (i > 0) {
          slotOrd += "/";
        }
        
        slotOrd += sn;
      }
    }
    
    function resolveSlotPaths(batchResolve, batch, obj) { 
      var groups = batchResolve.$groups,
          group,
          items,
          comp,
          path,
          depthRequestIndex,
          slotPathInfo = [],
          slotPathInfoMap = {},
          subscribeOrds = obj.subscriber ? [] : null,
          i,
          j;
          
      for (i = 0; i < groups.length; i++) {
        group = groups[i];
        items = group.items;
        comp = group.space.getRootComponent();
        
        for (j = 0; j < items.length; j++) {
          path = items[j].slot;
          
          // Skip if no valid SlotPath is available
          if (path) {
            // Record ORD for possible subscription
            if (subscribeOrds) {
              subscribeOrds.push(path.toString());
            }
            
            depthRequestIndex = getDepthRequestIndex(comp, path);
            
            // If we've got Slots to request then do so
            if (depthRequestIndex > -1) {
              addToRequestMap(slotPathInfoMap, path, depthRequestIndex);
            }
          }
        }
      }
      
      //assemble network requests into an array for loadSlotPath
      baja.iterate(slotPathInfoMap, function (arg) {
        slotPathInfo.push(arg);
      });
      
      // Make network request if there are slot paths to load for this Space
      if (slotPathInfo.length > 0) {
        group.space.getCallbacks().loadSlotPath(slotPathInfo, 
                                                group.space, 
                                                new Callback(baja.ok, baja.fail, batch), 
                                                /*importAsync*/false);
        
        // Attempt to roll the network subscription call into
        // the Slot Path resolution to avoid another network call...
        if (subscribeOrds) {
          // Subscribe using Subscriber for the given Space
          
          // TODO: subscribing in this way is not ideal. Here we're subscribing Components before they're 
          // fully loaded into the Proxy Component Space to avoid another network call. This assumes that
          // each of these Components will fully load into the Component Space without any problems. This will
          // do for now since it's critical to customer's perceptions that BajaScript loads values quickly.
          // If any errors do occur (i.e. the values haven't loaded properly), they are flagged up using baja.error.
          obj.subscriber.$ordSubscribe({
            ords: subscribeOrds,
            space: group.space,
            batch: batch
          });
        }
      }

      batch.addCallback(function () {
        // If we've resolved the SlotPaths from each group then we can finally attempt 
        // to resolve each ORD. With a bit of luck, this will result in minimal network calls
        resolveOrds(batchResolve, obj);
      });
      
      batch.commit();
    }
        
    /*
     * If there are any handle ORDs then resolve them to their SlotPaths
     */
    function resolveHandlesToSlotPaths(batchResolve, batch, obj) {
      baja.iterate(batchResolve.$items, function (item) {
        var h = item.h,
            space = item.space;
        
        // If we've got a handle to resolve then attempt make a network call to 
        // resolve it 
        if (h && space && space.hasCallbacks() && space.findByHandle(h) === null) {
          // Batch up this network request
          space.getCallbacks().handleToPath(h, new Callback(
            function ok(slotPath) {
              item.slot = slotPath;
            },
            function fail(err) {
              item.fail = err;
            },
            batch));
        }
      });

      batch.addCallback(function () {
        // If we resolved all of the handles to SlotPaths then resolve the SlotPaths
        // Piggy back the unknown ORD resolve off the Slot Path resolve
        resolveSlotPaths(batchResolve, batchResolve.$unknownBatch || new baja.comm.Batch(), obj);
      });
      
      // Commit the batch for getting all of the handles as SlotPaths
      batch.commit();
    }
    
    function groupComponentSpaceItems(batchResolve, obj) {
      // Group Items together by Component Space
      var added, 
          item, 
          group, 
          i, 
          x;
      
      for (i = 0; i < batchResolve.$items.length; ++i) {  
        item = batchResolve.$items[i];
        added = false;   

        // Skip grouping for Spaces that don't have callbacks
        if (!item.space) {
          continue;
        }        
        if (!item.space.hasCallbacks()) {
          continue;
        }
      
        for (x = 0; x < batchResolve.$groups.length; ++x) {
          group = batchResolve.$groups[x];
         
          if (group.space.getNavOrd().toString().equals(item.spaceOrd.toString())) {
            group.items.push(item);
            added = true;
            break;      
          }        
        }
        
        // If the item isn't added then create a new group for this item
        if (!added) {
          batchResolve.$groups.push({
            space: item.space,
            items: [item]
          });     
        }      
      }
      
      // Resolve all of the Handles to SlotPaths
      resolveHandlesToSlotPaths(batchResolve, new baja.comm.Batch(), obj);
    }
      
    function resolveComponentSpaces(batchResolve, index, obj) {
      var resolutions = [];
      
      baja.iterate(batchResolve.$items, function (item) {
        var spaceOrd = item.spaceOrd;
        if (spaceOrd) {
          resolutions.push(function (cb) {
            
            var spaceOrdStr = spaceOrd.toString();
            
            // Optimization for local Station Space
            if (spaceOrdStr === 'station:' || spaceOrdStr === 'local:|station:') {
              item.space = baja.station;
              item.spaceOrd = baja.station.getNavOrd();
              return cb.ok();
            }
            
            spaceOrd.get({
              ok: function (value) {
                var s;
                
                if (value.getType().is("baja:ComponentSpace")) {
                  s = item.space = value;
                  item.spaceOrd = s.getNavOrd();
                }
                else if (this.getType().is("baja:VirtualGateway")) {
                  // Note: this may result in some network calls to mount the Virtual Component Space
                  s = item.space = this.getVirtualSpace();
                  item.spaceOrd = s.getNavOrd();
                }
                else if (this.getType().is("baja:Component")) {
                  s = item.space = this.getComponentSpace();
                  item.spaceOrd = s.getNavOrd();
                }
                
                cb.ok();
              },
              fail: function (err) {
                baja.error(err);
                cb.fail(err);
              },
              base: obj.base
            });
          });
        }
      });
      
      runSequential(resolutions, function () {
        groupComponentSpaceItems(batchResolve, obj);
      });
    }
    
    function makeAbsSlotPath(query, obj) {
      // Create an absolute SlotPath using the base if necessary
      var isVirtual = query.getSchemeName() === "virtual",
          path = isVirtual ? new baja.VirtualPath(query.getBody()) : new baja.SlotPath(query.getBody());
      
      // If the path is already absolute then use it
      if (path.isAbsolute()) {
        return path;
      }
      
      // Attempt to merge the ORD with the base to get our Absolute SlotPath
      if (obj.base.getType().isComponent() && !isVirtual) {
        var basePath = obj.base.getSlotPath();
        if (basePath !== null) {
          var newBody = basePath.merge(path);
          return isVirtual ? new baja.VirtualPath(newBody) : new baja.SlotPath(newBody);
        }
      }
      
      return null;
    }
                    
    function resolveUnknown(item, obj, batch) {
      // Make the network call to resolve the complete ORD Server side       
      var cb = new Callback(function ok(target) {
        item.target = target;
      },
      function fail(err) {
        item.fail = err;
      },
      batch); 
      
      // Batch up the unknown ORD resolution...
      item.ord.resolve({
        cb: cb,
        base: obj.base,
        fromBatchResolve: true
      });
    }
        
    function processOrds(batchResolve, obj) {
      // Find all of the Component Space ORDs
      var list,
          item, 
          cursor, 
          foundIndex, 
          q, 
          i;
           
      for (i = 0; i < batchResolve.$items.length; ++i) {
        item = batchResolve.$items[i];
        list = item.list = item.ord.parse();
        
        // If processed as unknown then skip since this ORD will be completely resolved Server Side
        if (list.hasUnknown()) {
          item.unknown = true;   
          
          // Create and cache the unknown batch object
          if (!batchResolve.$unknownBatch) {
            batchResolve.$unknownBatch = new baja.comm.Batch();
          }
          
          resolveUnknown(item, obj, batchResolve.$unknownBatch);
          continue;
        }
        
        cursor = list.getCursor();
        foundIndex = -1;
                
        // Work out the ORD just before the virtual, slot or handle scheme
        while (cursor.next()) {
          q = cursor.get();
          
          if (q.getSchemeName() === "virtual") { 
            foundIndex = cursor.getIndex(); 
            item.slot = makeAbsSlotPath(q, obj); 
            break;
          }
          else if (q.getSchemeName() === "h" && foundIndex === -1) { 
            foundIndex = cursor.getIndex(); 
            item.h = q.getBody();
          }
          else if (q.getSchemeName() === "slot" && foundIndex === -1) {
            foundIndex = cursor.getIndex(); 
            item.slot = makeAbsSlotPath(q, obj); 
          }
        }
        
        // Note down the ORD to the Space
        if (foundIndex !== -1) {
          item.spaceOrd = baja.Ord.make(list.toString(foundIndex));
          
          // If there's no ORD then just try using the base to resolve the CS.
          if (item.spaceOrd === baja.Ord.DEFAULT) {
            item.spaceOrd = obj.base.getNavOrd();
          }
        }
      }
     
      // Resolve any Space ORDs found
      resolveComponentSpaces(batchResolve, 0, obj);
    }
    
    /**
     * Batch resolve an array of ORDs.
     * <p>
     * A Batch Resolve should be used whenever more than one ORD needs to resolved.
     * <p>
     * Any network calls that result from processing an ORD are always asynchronous.
     * <p>
     * This method can only be called once per BatchResolve instance.
     * <p>
     * An Object Literal is used to supply the method's arguments. For example...
     * <pre>
     *   var r = baja.BatchResolve(["station:|slot:/Ramp", "station:|slot:/SineWave"]);
     *   var sub = new baja.Subscriber(); // Also batch subscribe all resolved Components
     *   
     *   r.resolve({
     *     ok: function () {
     *       // Get resolved objects
     *       var objs = this.getTargetObjects();
     *     },
     *     fail: function (err) {
     *       // Called if any of the ORDs fail to resolve
     *     },
     *     subscriber: sub
     *   });
     *
     *   // Or use the each method (will only be called if all ORDs resolve). Each will
     *   // be called for each target.
     *   r.resolve({
     *     each: function () {
     *       baja.outln("Resolved: " + this.toPathString());
     *     },
     *     fail: function (err) {
     *       // Called if any of the ORDs fail to resolve
     *     },
     *     subscriber: sub
     *   });
     * </pre>
     *
     * @see baja.Ord
     *
     * @param {Object} [obj] the Object Literal that contains the method's arguments.
     * @param {Function} [obj.ok] the ok function called once all of the ORDs have been successfully resolved.
     *                            When the function is called, 'this' is set to the BatchResolve object.
     * @param {Function} [obj.fail] the fail function called if any of the ORDs fail to resolve. 
     *                              The first error found is pass as an argument to this function.
     * @param [obj.base] the base Object to resolve the ORDs against. 
     * @param {baja.Subscriber} [obj.subscriber] if defined, any mounted Components are subscribed using this Subscriber.
     * @param {Boolean} [obj.lease] if defined, any resolved and mounted components are leased.
     * @param {Number|baja.RelTime} [obj.leaseTime] the lease time used for leasing Components.
     */
    baja.BatchResolve.prototype.resolve = function (obj) {
      obj = objectify(obj);
      
      var ok = obj.ok || baja.ok;
      
      // If an each function was passed in then call if everything resolves ok.
      this.$ok = function () {
        var result;
        if (typeof obj.each === "function") {
          try {
            result = this.each(obj.each);
          }
          catch (err) {
            baja.error();
          }
        }
        ok.call(this, result);
      };
      
      this.$fail = obj.fail || baja.fail;
      
      // Can only resolve once
      if (this.$resolved) {
        this.$fail.call(this, "Cannot call resolve more than once");
        return;
      }
      this.$resolved = true;
      
      // Initialize
      obj.base = bajaDef(obj.base, baja.nav.localhost);

      // Check the user isn't trying to batch an ORD as this isn't supported
      if (obj.batch) {
        this.$fail.call(this, "Cannot batch ORD resolution");
        return;
      }
        
      // Start resolution 
      if (this.$items.length > 0) {      
        processOrds(this, obj);
      }
      else {
        this.$ok.call(this);
      }
    };
 
  }()); // batchRes
         
}(baja, BaseBajaObj));
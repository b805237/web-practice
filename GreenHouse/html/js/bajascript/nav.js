//
// Copyright 2010, Tridium, Inc. All Rights Reserved.
//

/**
 * BajaScript Nav and Event Architecture.
 *
 * @author Gareth Johnson
 * @version 1.0.0.0
 */

//JsLint options (see http://www.jslint.com )
/*jslint rhino: true, onevar: false, plusplus: true, white: true, undef: false, nomen: false, eqeqeq: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: false, indent: 2, vars: true, continue: true */

// Globals for JsLint to ignore 
/*global baja, BaseBajaObj*/ 

(function event(baja) {
  // Use ECMAScript 5 Strict Mode
  "use strict";
  
  var strictArg = baja.strictArg,
      bsguid = 0;      // A unique id for assigned to event handlers
      
  /**
   * @namespace Event Handling framework.
   */
  baja.event = new BaseBajaObj();
    
  // TODO: Could probably factor this into a framework method at some point
  function isObjEmpty(obj) {
    var q;
    for (q in obj) {
      if (obj.hasOwnProperty(q)) {
        return false;
      }
    }
    return true;
  }
  
  /**
   * Attach an event handler to listen for events.
   *
   * @private
   *
   * @param {String} event handler name.
   * @param {Function} the event handler function.
   */
  var attach = function (hName, func) {
    // If an Object is passed in then scan it for handlers (hName can be an Object map)
    if (hName && typeof hName === "object") {
      var p;
      for (p in hName) {
        if (hName.hasOwnProperty(p)) {
          if (typeof hName[p] === "function") {
            this.attach(p, hName[p]);
          }
        }
      }
    }
    else {
    
      // Validate and then add a handler
      strictArg(hName, String);
      strictArg(func, Function);
      
      // Assign a unique id to this function      
      if (!func.$bsguid) {
        func.$bsguid = ++bsguid; 
      }
            
      // Lazily create handlers map
      if (this.$handlers === undefined) {
        this.$handlers = {};
      }
      
      // If separated by a space then assign the function to multiple events
      var names = hName.split(" "), i;
      
      for (i = 0; i < names.length; ++i) {     
        // Assign handler into map
        if (!this.$handlers[names[i]]) {
          this.$handlers[names[i]] = {};
        }
        
        this.$handlers[names[i]][func.$bsguid] = func;
      }
    }
  };
    
  /**
   * Detach an Event Handler.
   * <p>
   * If no arguments are used with this method then all events are removed.
   *
   * @private
   *
   * @param {String} [hName] the name of the handler to detach.
   * @param {Function} [func] the function to remove. It's recommended to supply this just in case
   *                          other scripts have added event handlers.
   */
  var detach = function (hName, func) {
    // If there are no arguments then remove all handlers...
    if (arguments.length === 0) {
      this.$handlers = undefined;
    }
  
    if (!this.$handlers) {
      return;
    }
        
    var p;
       
    // If an object is passed in then scan it for handlers 
    if (hName && typeof hName === "object") {
      if (hName.hasOwnProperty(p)) {
        if (typeof hName[p] === "function") {
          this.detach(p, hName[p]);
        }
      }
    }
    else {
      strictArg(hName, String);
      
      if (func) {
        strictArg(func, Function);
      }
      
      // If separated by a space then remove from multiple event types...
      var names = hName.split(" "),
          i;
      
      for (i = 0; i < names.length; ++i) {    
        if (!func) {
          delete this.$handlers[names[i]];
        }
        else {
          if (func.$bsguid && this.$handlers[names[i]] && this.$handlers[names[i]][func.$bsguid]) {
            delete this.$handlers[names[i]][func.$bsguid];
            
            // If there aren't any more handlers then delete the entry
            if (isObjEmpty(this.$handlers[names[i]])) {
              delete this.$handlers[names[i]];
            }
          }
        }
      }
      
      // If there are no handlers then set this back to undefined      
      if (isObjEmpty(this.$handlers)) {
        this.$handlers = undefined;
      }
    }
  };

  /**
   * Fire events for the given handler name.
   * <p>
   * Any extra arguments will be used as parameters in any invoked event handler functions.
   * <p>
   * Unlike 'getHandlers' or 'hasHandlers' this method can only invoke one event handler name at a time.
   * <p>
   * This method should only be used internally by Tridium developers.
   *
   * @private
   *
   * @param {String} hName the name of the handler.
   * @param {Function} called if any of the invoked handlers throw an error.
   * @param context the object used as the 'this' parameter in any invoked event handler.
   */
  var fireHandlers = function (hName, error, context) {
    // Bail if there are no handlers registered
    if (!this.$handlers) {
      return;
    }
    
    var p,
        handlers = this.$handlers,
        args;
    
    // Iterate through and invoke the event handlers we're after    
    if (handlers.hasOwnProperty(hName)) {    
      // Get arguments used for the event
      args = Array.prototype.slice.call(arguments);
      args.splice(0, 3); // Delete the first three arguments and use 
                         // the rest as arguments for the event handler
    
      for (p in handlers[hName]) {
        if (handlers[hName].hasOwnProperty(p)) {
          try {
            handlers[hName][p].apply(context, args);
          }
          catch(err) {
            error(err);
          }
        }
      }
    }
  };
  
  /**
   * Return an array of event handlers.
   * <p>
   * To access multiple handlers, insert a space between the handler names.
   *
   * @private
   *
   * @param {String} hName the name of the handler
   * @returns {Array}
   */
  var getHandlers = function (hName) {
    if (!this.$handlers) {
      return [];
    }
    
    var names = hName.split(" "),
        i,
        p,
        a = [],
        handlers = this.$handlers;
        
    for (i = 0; i < names.length; ++i) {
      if (handlers.hasOwnProperty(names[i])) {
        for (p in handlers[names[i]]) {
          if (handlers[names[i]].hasOwnProperty(p)) {
            a.push(handlers[names[i]][p]);
          }
        }
      }
    }
        
    return a;
  };
  
  /**
   * Return true if there any handlers registered for the given handler name.
   * <p>
   * If no handler name is specified then test to see if there are any handlers registered at all.
   * <p>
   * Multiple handlers can be tested for by using a space character between the names.
   *
   * @private
   *
   * @param {String} [hName] the name of the handler. If undefined, then see if there are any 
   *                         handlers registered at all.
   * @returns {Boolean}
   */
  var hasHandlers = function (hName) {
    // If there are no handlers then bail
    if (!this.$handlers) {
      return false;
    }
    
    // If there isn't a handler name defined then at this point we must have some handler
    if (hName === undefined) {
      return true;
    }
    
    var names = hName.split(" "),
        i;
        
    for (i = 0; i < names.length; ++i) {
      if (!this.$handlers.hasOwnProperty(names[i])) {
        return false;
      }
    }
 
    return true;
  };
 
  /**
   * Mix-in the event handlers onto the given Object.
   *
   * @private
   *
   * @param obj
   */
  baja.event.mixin = function (obj) {
    obj.attach = attach;
    obj.detach = detach;
    obj.getHandlers = getHandlers;
    obj.hasHandlers = hasHandlers;
    obj.fireHandlers = fireHandlers;
  };
    
}(baja));
 
(function nav(baja) {

  // Use ECMAScript 5 Strict Mode
  "use strict";

  var objectify = baja.objectify,
      navFileRoot,     // If undefined then we need to make a request for the Nav File Root.
      navFileMap = {};
    
  /**
   * @class NavContainer is a generic NavNode.
   *
   * @name baja.NavContainer
   * @extends baja.Object
   */
  baja.NavContainer = function (obj) {
    baja.NavContainer.$super.apply(this, arguments); 
    if (obj) {      
      this.$navName = obj.navName;
      this.$navDisplayName = obj.displayName || obj.navName;
      this.$navOrdStr = obj.ord;
      this.$navIconStr = obj.icon;
    }
  }.$extend(baja.Object).registerType("baja:NavContainer");
  
  /**
   * Return the Nav Name.
   *
   * @returns {String}
   */
  baja.NavContainer.prototype.getNavName = function () {
    return this.$navName;
  };
  
  /**
   * Return the Nav Display Name.
   * 
   * @returns {String}
   */
  baja.NavContainer.prototype.getNavDisplayName = function () {
    return this.$navDisplayName;
  };
  
  /**
   * Return the Nav Description.
   *
   * @returns {String}
   */
  baja.NavContainer.prototype.getNavDescription = function () {
    return this.$navDisplayName;
  };
  
  /**
   * Return the Nav ORD.
   *
   * @returns {baja.Ord}
   */
  baja.NavContainer.prototype.getNavOrd = function () {
    if (!this.$navOrd) {
      this.$navOrd = baja.Ord.make(this.$navOrdStr);
    }
    return this.$navOrd;
  };
  
  /**
   * Return the Nav Parent (or null if there's no parent).
   *
   * @returns nav parent
   */
  baja.NavContainer.prototype.getNavParent = function () {
    return this.$navParent || null;
  };
      
  /**
   * Access the Nav Children.
   * <p>
   * This method takes an Object Literal the method arguments or an ok function.
   * <pre>
   *   container.getNavChildren(function (kids) {
   *     // Process children
   *   });
   *   // or...
   *   container.getNavChildren({
   *     ok: function (kids) {
   *       // Process children
   *     },
   *     fail: function (err) {
   *       baja.error(err);
   *     }
   *   });
   * </pre>
   *
   * @param {Object} obj the Object Literal for the method's arguments.
   * @param {Function} obj.ok called when we have the Nav Children. An array of Nav Children is
   *                          is passed as an argument into this function.
   * @param {Function} [obj.fail] called if the function fails to complete.
   *
   * @returns {Array}
   */
  baja.NavContainer.prototype.getNavChildren = function (obj) {
    obj = objectify(obj, "ok");
    obj.ok(this.$navKids || []);
  };
  
  /**
   * Return the Nav Icon for this node.
   *
   * @returns {baja.Icon}
   */
  baja.NavContainer.prototype.getNavIcon = function () {
    if (!this.$navIcon) {
      this.$navIcon = baja.Icon.make(this.$navIconStr);
    }
    return this.$navIcon;
  };
  
  /**
   * Add a child node to this container.
   * <p>
   * Please note, this is a private method and should only be used by Tridium developers.
   *
   * @private
   *
   * @param node
   * @returns node
   */
  baja.NavContainer.prototype.$addChildNode = function (node) {
    if (!this.$navKids) {
      this.$navKids = [];
    }
    node.$navParent = this;
    this.$navKids.push(node);
    return node;
  };

  /**
   * @class NavRoot
   *
   * @inner
   * @public
   * @name NavRoot
   * @extends baja.NavContainer
   */  
  var NavRoot = function () {
    NavRoot.$super.apply(this, arguments);
  }.$extend(baja.NavContainer).registerType("baja:NavRoot");
  
  /**
   * @class The decoded NavFile Space.
   *
   * @inner
   * @public
   * @name NavFileSpace
   * @extends baja.NavContainer
   */
  var NavFileSpace = function () {
    NavFileSpace.$super.call(this, {
      navName: "navfile",
      ord: "dummy:",
      icon: "module://icons/x16/object.png"
    }); 
  }.$extend(baja.NavContainer).registerType("baja:NavFileSpace");
  
  function decodeNavJson(json) {
    if (json === null) {
      return null;
    }
  
    var node = baja.$("baja:NavFileNode", {
      navName: json.n,
      displayName: json.d,
      description: json.e,
      ord: json.o,
      icon: json.i
    });
    
    // Register in the map
    navFileMap[json.o] = node;
              
    if (json.k) {
      var i;
      for (i = 0; i < json.k.length; ++i) {
        node.$addChildNode(decodeNavJson(json.k[i]));
      }
    }
  
    return node;
  }
  
  /**
   * If the NavFile isn't already loaded, make a network call to load 
   * the NavFile across the network.
   * <p>
   * An Object Literal is used for the method's arguments.
   *
   * @param {Object} obj the Object Literal for the method's arguments.
   * @param {Function} obj.ok called once the NavFile has been loaded.
   *                          The Nav Root Node will be passed to this function when invoked.
   * @param {Function} [obj.fail] called if any errors occur.
   * @param {baja.comm.Batch} [obj.batch] if specified, this will batch any network calls.
   */
  NavFileSpace.prototype.load = function (obj) {
    obj = objectify(obj, "ok");
    
    var cb = new baja.comm.Callback(obj.ok, obj.fail, obj.batch);
    
    // If already loaded then don't bother making a network call
    if (navFileRoot !== undefined) {
      cb.ok(navFileRoot);
    }
    else {
      // Add an intermediate callback to decode the NavFile
      cb.addOk(function (ok, fail, navFileJson) {        
        // Parse NavFile JSON
        navFileRoot = decodeNavJson(navFileJson);   
        
        ok(navFileRoot);
      });
    
      baja.comm.navFile(cb);
    }
  };
  
  /**
   * Return the NavFileRoot.
   * <p>
   * If there's no NavFile specified for the user, this will return null.
   *
   * @returns nav file root node (or null if there's no specified NavFile).
   */
  NavFileSpace.prototype.getRootNode = function () {
    if (navFileRoot === undefined) {
      var batch = new baja.comm.Batch();
      this.load({batch: batch});
      batch.commitSync();
    }
    return navFileRoot || null;
  };
  
  /**
   * Look up the NavNode for the specified Nav ORD.
   *
   * @param {String|baja.Ord} the Nav ORD used to look up the Nav ORD.
   *
   * @returns Nav Node
   */
  NavFileSpace.prototype.lookup = function (ord) {
    if (!this.getRootNode()) {
      return null;
    }
    return navFileMap[ord.toString()] || null;
  };
  
  /**
   * Access the Nav Children.
   * 
   * @see baja.NavContainer#getNavChildren
   */
  NavFileSpace.prototype.getNavChildren = function (obj) {
    obj = objectify(obj, "ok");
    var root = this.getRootNode();
    if (root) {
      root.getNavChildren(obj);
    }
    else {
      obj.ok([]);
    }
  };
  
  /**
   * Return the Nav Display Name.
   * 
   * @returns {String}
   */
  NavFileSpace.prototype.getNavDisplayName = function () {
    var root = this.getRootNode();
    return root ? root.getNavDisplayName() : this.$navDisplayName;
  };
  
  /**
   * Return the Nav ORD.
   *
   * @returns {baja.Ord}
   */
  NavFileSpace.prototype.getNavOrd = function () {
    var root = this.getRootNode();
    return root ? root.getNavOrd() : NavFileSpace.$super.prototype.getNavOrd.call(this);
  };
        
  /**
   * @namespace Nav Root
   */
  baja.nav = new NavRoot({
    navName: "root",
    ord: "root:", // TODO: Implement root scheme
    icon: "module://icons/x16/planet.png"
  });
          
  /**
   * @namespace NavFileSpace
   */
  baja.nav.navfile = baja.nav.$addChildNode(new NavFileSpace());
  
  // Mix-in the event handlers for the Nav Root
  baja.event.mixin(baja.nav);
  
  // These comments are left in for the benefit of JsDoc Toolkit...
  
  /**
   * Attach an event handler to listen for navigation events.
   * <p>
   * Please note, navigation events only cover 'add', 'remove', 'renamed' and 'reordered'.
   * <p>
   * For a list of all the event handlers and some of this method's more advanced 
   * features, please see {@link baja.Subscriber#attach}.
   *
   * @function
   * @name baja.nav.attach
   *
   * @see baja.Subscriber
   * @see baja.nav.detach
   * @see baja.nav.getHandlers
   * @see baja.nav.hasHandlers
   *
   * @param {String} event handler name.
   * @param {Function} the event handler function.
   */
   
  /**
   * Detach an Event Handler.
   * <p>
   * If no arguments are used with this method then all events are removed.
   * <p>
   * For some of this method's more advanced features, please see {@link baja.Subscriber#detach}.
   *
   * @function
   * @name baja.nav.detach
   *
   * @see baja.Subscriber
   * @see baja.nav.attach
   * @see baja.nav.getHandlers
   * @see baja.nav.hasHandlers
   *
   * @param {String} [hName] the name of the handler to detach.
   * @param {Function} [func] the function to remove. It's recommended to supply this just in case
   *                          other scripts have added event handlers.
   */
        
  /**
   * Return an array of event handlers.
   * <p>
   * To access multiple handlers, insert a space between the handler names.
   *
   * @function
   * @name baja.nav.getHandlers
   *
   * @see baja.Subscriber
   * @see baja.nav.detach
   * @see baja.nav.attach
   * @see baja.nav.hasHandlers
   *
   * @param {String} hName the name of the handler
   * @returns {Array}
   */
   
  /**
   * Return true if there any handlers registered for the given handler name.
   * <p>
   * If no handler name is specified then test to see if there are any handlers registered at all.
   * <p>
   * Multiple handlers can be tested for by using a space character between the names.
   *
   * @function
   * @name baja.nav.hasHandlers
   *
   * @see baja.Subscriber
   * @see baja.Component#detach
   * @see baja.Component#attach
   * @see baja.Component#getHandlers
   *
   * @param {String} [hName] the name of the handler. If undefined, then see if there are any 
   *                         handlers registered at all.
   * @returns {Boolean}
   */

}(baja)); //nav
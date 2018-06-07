//
// Copyright 2010, Tridium, Inc. All Rights Reserved.
//

/**
 * Box Component Space Architecture for BajaScript.
 *
 * @author Gareth Johnson
 * @version 1.0.0.0
 */

//JsLint options (see http://www.jslint.com )
/*jslint rhino: true, onevar: false, plusplus: true, white: true, undef: false, nomen: false, eqeqeq: true, 
bitwise: true, regexp: true, newcap: true, immed: true, strict: false, indent: 2, vars: true, continue: true */

// Globals for JsLint to ignore 
/*global baja, syncVal, BaseBajaObj, syncSlots, syncComp*/ 
  
(function boxcs(baja) {

  // Use ECMAScript 5 Strict Mode
  "use strict";
  
  //
  // Please note, a context may a commit flag that indicates not to trap
  // the update to a network call. The serverDecode flag is used as an 
  // optimization by BajaScript's Component safety checks. It's assumed
  // any BSON decoded from the Server is probably ok and hence we
  // can short circuit some of the checks. The syncStructVals
  // flag is used exclusively by Complex 'set' to determine whether
  // any incoming struct values should be synced instead being
  // replaced outright.
  //
  
  // Create local for improved minification
  var strictArg = baja.strictArg,
      bajaDef = baja.def,
      serverDecodeContext = baja.$serverDecodeContext,
      bsonDecodeValue = baja.bson.decodeValue,
      Callback = baja.comm.Callback;
  
  ////////////////////////////////////////////////////////////////
  // SyncOps
  //////////////////////////////////////////////////////////////// 
  
  // A map of of SyncOp constructors used in decoding SyncOps
  var syncOps = {};
  
  /**
   * @class Base SyncOp.
   * <p>
   * All other SyncOps extend from this constructor.
   *
   * @name SyncOp
   * @extends BaseBajaObj
   * @inner
   * @private
   */ 
  var SyncOp = function () {
    this.$arg = null;
  }.$extend(BaseBajaObj); 
  
  // The unique identifier for the SyncOp  
  SyncOp.id = "";
  
  /**
   * Return the id for the SyncOp.
   * <p>
   * The id is used for encoding and decoding a SyncOp.
   *
   * @private
   *
   * @returns {String}
   */
  SyncOp.prototype.getId = function () {
    return this.constructor.id;
  };
    
  /**
   * Perform a syncTo network call.
   *
   * @private
   *
   * @param space the Component Space we're syncing too.
   * @param {baja.comm.Callback} cb the callback handler.
   */    
  SyncOp.prototype.syncTo = function (space, cb) {

    // Create BSON SyncOp data structure
    var sync = {
      nm: "sync",
      ver: 1.0,
      ops: [ this.$arg ]
    };
    
    // TODO: at some point, we'll want to batch up the syncTo requests and have one syncFrom request
    // for great bandwidth and efficiency. At the same time, we should also try and introduce the idea
    // of unsolicited messages that we'll subscribe too. All of the syncFrom events would then come from
    // unsolicited messages that have been registered for with a topic name. This sets us up for eventually
    // using a WebSocket instead of constant HTTP request/responses. When receiving a BOX frame with unsolicited
    // messages, the unsolicited messages should be processed first before dealing with the responses
     
    var failedCalled = false,
        syncToResp;
    
    // Only call the ok if fail hasn't been called on the syncTo handler
    cb.addOk(function (ok, fail, resp) {
      if (!failedCalled) {
        // Pass results of the committed syncOps into the result of the original callback
        ok(syncToResp);      
      }
    });
        
    var syncToCb = new Callback(baja.ok, cb.fail, cb.getBatch());
    
    syncToCb.addOk(function (ok, fail, resp) {
      // Get results of syncTo (which are the results of the committed syncOps)
      syncToResp = resp;
      ok(resp);
    });

    // Mark that fail has been called
    syncToCb.addFail(function (ok, fail, err) {
      failedCalled = true;
      fail(err);
    });
     
    // syncTo  
    baja.comm.serverHandlerCall(space.getAbsoluteOrd().toString(),
                                "syncTo",
                                sync,
                                syncToCb);  
    
    // syncFrom
    space.getCallbacks().poll(cb);                                  
  };
    
  /**
   * @class Add SyncOp.
   *
   * @name AddOp
   * @extends SyncOp
   * @inner
   * @private
   *
   * @param comp the Component the add is happening upon.
   * @param {String} slotName the name of the slot being added.
   * @param val the value for the add operation.
   * @param {Number} flags the slot facets.
   * @param {baja.Facets} facets the slot facets.
   */ 
  var AddOp = function (comp, slotName, val, flags, facets) {
    AddOp.$super.apply(this, arguments);
    
    // TODO: What about getting the name of the Property that was created 
    // from the Server???
    
    // Encode argument to a data structure
    var a = {
      nm: this.getId(),
      h: comp.getHandle(),
      b: baja.bson.encodeValue(val) // Encode the value to BSON
    };
        
    if (slotName !== null) {
      a.n = slotName;
    }  
    
    if (flags !== 0) {
      a.f = baja.Flags.encodeToString(flags);
    }
    
    if (facets !== null && facets !== baja.Facets.DEFAULT) {
      a.facets = facets.encodeToString();
    }

    this.$arg = a;    
  }.$extend(SyncOp); 
  
  AddOp.id = "a";
  syncOps[AddOp.id] = AddOp; 
  
  /**
   * Decode and commit the SyncOp.
   *
   * @private
   *
   * @param comp the Component being added too.
   * @param sp the syncOp data structure to be decoded.
   */
  AddOp.decodeAndCommit = function (comp, sp) {
    // TODO: Shouldn't need to add the 'get' check on the end of this if statement but it'll
    // have to do for now. Really the Server should keep track of what Components the client
    // has loaded instead of just firing everything down it gets!
  
    if (comp !== null && comp.get(sp.n) === null) {
      var name = bajaDef(sp.n, null),
          displayName = sp.dn,
          display = sp.b.d,
          flags = baja.Flags.decodeFromString(bajaDef(sp.f, "")),  
          fcts = baja.Facets.DEFAULT.decodeFromString(bajaDef(sp.facets, ""));
    
      // Perform Component add with Commit Context
      comp.add({
        "slot": name, 
        "value": bsonDecodeValue(sp.b, serverDecodeContext), 
        "flags": flags, 
        "facets": fcts, 
        "cx": { commit: true, displayName: displayName, display: display, serverDecode: true }
      });
    }
  };
  
  /**
   * @class Set SyncOp
   *
   * @name SetOp
   * @extends SyncOp
   * @inner
   * @private
   *
   * @param comp the Component the set is happening upon.
   * @param {Array} propPath an array of Property names for the set.
   * @param val the value being used in the set.
   */ 
  var SetOp = function (comp, propPath, val) {
    SetOp.$super.apply(this, arguments); 
    
    // Encode argument to a data structure
    var a = {
      nm: this.getId(),
      h: comp.getHandle(),
      n: propPath.reverse().join("/"),
      b: baja.bson.encodeValue(val) // Encode the value to BSON
    };
    
    this.$arg = a; 
    
  }.$extend(SyncOp); 
  
  SetOp.id = "s";
  syncOps[SetOp.id] = SetOp; 
  
  /**
   * Decode and commit the SyncOp.
   *
   * @private
   *
   * @param comp the Component the set is happening on.
   * @param sp the syncOp data structure to be decoded.
   */
  SetOp.decodeAndCommit = function (comp, sp) {  
    if (comp !== null) {  
      // Decode the value and call 'set'
      var names = sp.n.split("/"),
          displayName = sp.dn,
          display = sp.b.d,
          target = comp,
          n = null,
          i;
          
      for (i = 0; i < names.length; ++i) {
        if (n !== null) {
          target = target.get(n);
        }
        n = names[i];
      }
      
      // Set the desired target      
      target.set({
        "slot": n,
        "value": bsonDecodeValue(sp.b, serverDecodeContext), 
        "cx": { commit: true, serverDecode: true, syncStructVals: true, displayName: displayName, display: display }
      });
    }
  };
  
  /**
   * @class Remove SyncOp.
   *
   * @name RemoveOp
   * @extends SyncOp
   * @inner
   * @private
   *
   * @param comp the Component the remove is happening upon.
   * @param {baja.Slot} slot the Slot to remove from the Component.
   */ 
  var RemoveOp = function (comp, slot) {
    RemoveOp.$super.apply(this, arguments); 

    // Encode argument to a data structure
    var a = {
      nm: this.getId(),
      h: comp.getHandle(),
      n: slot.getName()
    };
    
    this.$arg = a; 
    
  }.$extend(SyncOp); 
  
  RemoveOp.id = "v";
  syncOps[RemoveOp.id] = RemoveOp; 
  
  /**
   * Decode and commit the SyncOp.
   *
   * @name RemoveOp.decodeAndCommit
   * @function
   * @private
   *
   * @param comp the Component the remove is happening on.
   * @param sp the syncOp data structure to be decoded.
   */
  RemoveOp.decodeAndCommit = function (comp, sp) {  
    if (comp !== null) {  
      var name = sp.n,
          slot = comp.getSlot(name);
      
      if (slot !== null) {
        comp.remove({
          "slot": slot, 
          "cx": { commit: true, serverDecode: true }
        });
      }
    }
  };
  
  /**
   * @class Fire Topic SyncOp.
   *
   * @name FireTopicOp
   * @extends SyncOp
   * @inner
   * @private
   *
   * @param comp the Component the Topic is being fired from.
   * @param {baja.Slot} slot the Topic Slot.
   * @param event the event to be fired (can be null).
   */ 
  var FireTopicOp = function (comp, slot, event) {
    FireTopicOp.$super.apply(this, arguments);   
    
    // Encode argument to a data structure
    var a = {
      nm: this.getId(),
      h: comp.getHandle(),
      n: slot.getName()
    };
    
    if (event !== null) {
      a.b = baja.bson.encodeValue(event); // Encode the value to BSON
    }
    
    this.$arg = a;     
  }.$extend(SyncOp); 
  
  FireTopicOp.id = "t";
  syncOps[FireTopicOp.id] = FireTopicOp; 
  
  /**
   * Decode and commit the SyncOp.
   *
   * @private
   *
   * @param comp the Component the Topic is being fired from.
   * @param sp the syncOp data structure to be decoded.
   */
  FireTopicOp.decodeAndCommit = function (comp, sp) {  
    if (comp !== null) {  
      // Decode and fire the Component event        
      // TODO: Propogate amoungst Knobs
      
      var name = sp.n,
          slot = comp.getSlot(name),
          display = "",
          event = null;
      
      if (sp.b !== undefined) {
        event = bsonDecodeValue(sp.b, serverDecodeContext);
        display = sp.b.d;
      }
      
      // Only fire this if the Topic Slot is loaded
      if (slot !== null) {
      
        // Fire the Topic on the Component
        comp.fire({
          "slot": slot, 
          "value": event, 
          "cx": { commit: true, display: display, serverDecode: true }
        }); 
      }
    }
  };
  
  /**
   * @class Load a Component's Slots SyncOp.
   *
   * @name LoadOp
   * @extends SyncOp
   * @inner
   * @private
   */
  var LoadOp = function () {
    LoadOp.$super.apply(this, arguments);   
  }.$extend(SyncOp); 
  
  LoadOp.id = "l";
  syncOps[LoadOp.id] = LoadOp; 
  
  /**
   * Decode and commit the SyncOp.
   *
   * @name LoadOp.decodeAndCommit
   * @function
   * @private
   *
   * @param comp the Component to be loaded.
   * @param sp the syncOp data structure to be decoded.
   */
  LoadOp.decodeAndCommit = function (comp, sp) {  
    if (comp !== null) {
      // Synchronize the two components together      
      syncComp(bsonDecodeValue(sp.b, serverDecodeContext), comp);    
    }
  };
  
  /**
   * @class Rename a dynamic Slot SyncOp.
   *
   * @name RenameOp
   * @extends SyncOp
   * @inner
   * @private
   *
   * @param comp the Component the Topic is being fired from.
   * @param {String} oldName the old name of the Slot.
   * @param {String} newName the new name of the Slot.
   */ 
  var RenameOp = function (comp, oldName, newName) {
    RenameOp.$super.apply(this, arguments);   
    
    // Encode argument to a data structure
    var a = {
      nm: this.getId(),
      h: comp.getHandle(),
      o: oldName,
      n: newName
    };
    
    this.$arg = a; 
    
  }.$extend(SyncOp); 
  
  RenameOp.id = "r";
  syncOps[RenameOp.id] = RenameOp; 
  
  /**
   * Decode and commit the SyncOp.
   *
   * @private
   *
   * @param comp the Component the rename will happen upon.
   * @param sp the syncOp data structure to be decoded.
   */
  RenameOp.decodeAndCommit = function (comp, sp) {  
    if (comp !== null) { 
      var name = sp.n,
          oldName = sp.o,
          displayName = sp.dn,
          display = sp.d,
          slot = comp.getSlot(oldName);
                
      if (slot !== null) {
        comp.rename({
          "slot": slot,
          "newName": name, 
          "cx": { commit: true, displayName: displayName, display: display, serverDecode: true }
        });
      }    
    }
  };
  
  /**
   * @class Reorder a Component's dynamic Slots SyncOp.
   *
   * @name ReorderOp
   * @extends SyncOp
   * @inner
   * @private
   *
   * @param comp the Component the reorder is happening on.
   * @param {Array} a String array of dynamic Property names that specifies the new order.
   */ 
  var ReorderOp = function (comp, dynamicProperties) {
    ReorderOp.$super.apply(this, arguments); 
        
    // Encode argument to a data structure
    var a = {
      nm: this.getId(),
      h: comp.getHandle(),
      o: dynamicProperties.join(";")
    };
    
    this.$arg = a; 
        
  }.$extend(SyncOp); 
  
  ReorderOp.id = "o";
  syncOps[ReorderOp.id] = ReorderOp; 
  
  /**
   * Decode and commit the SyncOp.
   *
   * @name ReorderOp.decodeAndCommit
   * @function
   * @private
   *
   * @param comp the Component the reorder will happen upon.
   * @param sp the syncOp data structure to be decoded.
   */
  ReorderOp.decodeAndCommit = function (comp, sp) {  
    if (comp !== null) { 
      var order = sp.o;     
      comp.reorder({
        "dynamicProperties": order.split(";"), 
        "cx": { commit: true, serverDecode: true }
      });
    }
  };
  
  /**
   * @class Set Slot Flags SyncOp.
   *
   * @name SetFlagsOp
   * @extends SyncOp
   * @inner
   * @private
   *
   * @param comp the Component for the slot the flags are being set upon.
   * @param {baja.Slot} slot the target slot for the flags change.
   * @param {Number} flags the new Slot flags.
   */ 
  var SetFlagsOp = function (comp, slot, flags) {
    SetFlagsOp.$super.apply(this, arguments); 

    // Encode argument to a data structure
    var a = {
      nm: this.getId(),
      h: comp.getHandle(),
      n: slot.getName(),
      f: baja.Flags.encodeToString(flags)
    };
    
    this.$arg = a; 
    
  }.$extend(SyncOp); 
  
  SetFlagsOp.id = "f";
  syncOps[SetFlagsOp.id] = SetFlagsOp; 
  
  /**
   * Decode and commit the SyncOp.
   *
   * @private
   *
   * @param comp the Component the set flags op will happen upon.
   * @param sp the syncOp data structure to be decoded.
   */
  SetFlagsOp.decodeAndCommit = function (comp, sp) {  
    if (comp !== null) { 
      var name = sp.n,
          flags = baja.Flags.decodeFromString(sp.f),     
          displayName = sp.dn,
          display = sp.d;
          
      comp.setFlags({
        "slot": name, 
        "flags": flags, 
        "cx": { commit: true, displayName: displayName, display: display, serverDecode: true }
      });
    }
  };
  
  /**
   * @class Set dynamic Slot Facets SyncOp.
   *
   * @name SetFacetsOp
   * @extends SyncOp
   * @inner
   * @private
   *
   * @param comp the Component for the slot the facets are being set upon.
   * @param {baja.Slot} slot the target dynamic slot for the facets change.
   * @param {baja.Facets} facets the new Slot facets.
   */
  var SetFacetsOp = function (comp, slot, facets) {
    SetFacetsOp.$super.apply(this, arguments); 

    // Encode argument to a data structure
    var a = {
      nm: this.getId(),
      h: comp.getHandle(),
      n: slot.getName(),
      x: facets.encodeToString()
    };
    
    this.$arg = a; 
    
  }.$extend(SyncOp); 
  
  SetFacetsOp.id = "x";
  syncOps[SetFacetsOp.id] = SetFacetsOp; 
  
  /**
   * Decode and commit the SyncOp.
   *
   * @private
   *
   * @param comp the Component the set facets op will happen upon.
   * @param sp the syncOp data structure to be decoded.
   */
  SetFacetsOp.decodeAndCommit = function (comp, sp) {  
    if (comp !== null) {
      var name = sp.n,
          fcts = baja.Facets.DEFAULT.decodeFromString(bajaDef(sp.x, "")),    
          displayName = sp.dn,
          display = sp.d;
      
      comp.setFacets({
        "slot": name, 
        "facets": fcts,
        "cx": { commit: true, displayName: displayName, display: display, serverDecode: true }
      });    
    }
  };
  
  /**
   * @class Add Knob SyncOp
   *
   * @name AddKnobOp
   * @extends SyncOp
   * @inner
   * @private
   */
  var AddKnobOp = function () {
    AddKnobOp.$super.apply(this, arguments); 
    throw new Error("Unsupported");
  }.$extend(SyncOp); 
  
  AddKnobOp.id = "k";
  syncOps[AddKnobOp.id] = AddKnobOp; 
  
  /**
   * Decode and commit the SyncOp.
   *
   * @name AddKnobOp.decodeAndCommit
   * @function
   * @private
   *
   * @param comp the Component the knob will be added too.
   * @param sp the syncOp data structure to be decoded.
   */
  AddKnobOp.decodeAndCommit = function (comp, sp) {  
    if (comp !== null) {
      comp.$fw("installKnob", baja.bson.decodeKnob(sp.nk), { commit: true, serverDecode: true });    
    }
  };
  
  /**
   * @class Remove Knob SyncOp.
   *
   * @name RemoveKnobOp
   * @extends SyncOp
   * @inner
   * @private
   */
  var RemoveKnobOp = function () {
    RemoveKnobOp.$super.apply(this, arguments); 
    throw new Error("Unsupported");
  }.$extend(SyncOp); 
  
  RemoveKnobOp.id = "j";
  syncOps[RemoveKnobOp.id] = RemoveKnobOp; 
  
  /**
   * Decode and commit the SyncOp.
   *
   * @private
   *
   * @param comp the Component the knob will be added too.
   * @param sp the syncOp data structure to be decoded.
   */
  RemoveKnobOp.decodeAndCommit = function (comp, sp) {  
    if (comp !== null) {
      comp.$fw("uninstallKnob", sp.id, sp.ss, { commit: true, serverDecode: true });    
    }
  };
           
  ////////////////////////////////////////////////////////////////
  // BOX Component Space Callbacks
  //////////////////////////////////////////////////////////////// 
  
  /**
   * @class BOX Callbacks plugs into a Component Space so it can make network calls.
   *
   * @name BoxCallbacks
   * @inner
   * @private
   */   
  var BoxCallbacks = function (space) {
    this.$space = space;
  };
  
  /**
   * Load Slots.
   *
   * @private
   *
   * @param {String} ord
   * @param {Number} depth
   * @param {baja.comm.Callback} cb
   */
  BoxCallbacks.prototype.loadSlots = function (ord, depth, cb) {    
    // Intermediate callback
    var space = this.$space;
    
    // Load Slots Argument
    var arg = { 
      o: ord,
      d: depth
    };
    
    var failedCalled = false;
    
    // Only call the ok if fail hasn't been called on the syncTo handler
    cb.addOk(function (ok, fail, resp) {
      if (!failedCalled) {
        // Pass results of the committed syncOps into the result of the original callback
        ok();      
      }
    });
        
    var loadSlotsCb = new Callback(baja.ok, cb.fail, cb.getBatch());

    // Mark that fail has been called
    loadSlotsCb.addFail(function (ok, fail, err) {
      failedCalled = true;
      fail(err);
    });
    
    // Make a call on the Server
    baja.comm.serverHandlerCall(space.getAbsoluteOrd().toString(),
                                "loadSlots",
                                arg,
                                loadSlotsCb);
    
    // Make a component space sync    
    this.poll(cb);
  };
  
  /**
   * Load Slot Path.
   *
   * @private
   *
   * @param {Array} slotPathInfo
   * @param container
   * @param {baja.comm.Callback} cb
   * @param {Boolean} [importAsync] import any extra types asynchronously (true by default).
   */
  BoxCallbacks.prototype.loadSlotPath = function (slotPathInfo, container, cb, importAsync) {
    var space = this.$space;
    
    importAsync = baja.def(importAsync, true);
    
    // Intermediate callback
    cb.addOk(function (ok, fail, resp) {
    
      var newOk = function () {  
        // Attempt to load the Slot in the Space
        space.$fw("commitSlotInfo", resp); 
        ok();
      };
      
      var newFail = function (err) {
        fail(err);
      };
      
      if (resp) {  

        // Pre-emptively scan the BSON for Types that don't exist yet or have Contracts loaded
        // and request them in one network call            
        var unknownTypes = baja.bson.scanForUnknownTypes(resp),
            importBatch = new baja.comm.Batch();
        
        if (unknownTypes.length > 0) {
          baja.importTypes({
            "typeSpecs": unknownTypes, 
            "ok": newOk, 
            "fail": newFail,
            "batch": importBatch
          });
          
          if (importAsync) {
            importBatch.commit();
          }
          else {
            importBatch.commitSync();
          }
        }
        else {
          newOk();
        }
      }
      else {
        newOk();
      }
    });
    
    // Build up the argument to send to the Server
    var arg = {
      spi: slotPathInfo,
      bo: container.getNavOrd().toString()
    };
                
    // Make a call on the Server  
    baja.comm.serverHandlerCall(space.getAbsoluteOrd().toString(),
                                "loadSlotPath",
                                arg,
                                cb);    
  };
    
  /**
   * Component Subscription.
   *
   * @private
   *
   * @param {Array} ords an array of ORDs to Components.
   * @param {Boolean} [importAsync] make any Type and Contract imports asynchronous (false by default).
   * @param {baja.comm.Callback} cb
   */
  BoxCallbacks.prototype.subscribe = function (ords, cb, importAsync) {
    strictArg(ords, Array);
    importAsync = bajaDef(importAsync, false);
        
    // Check there is something to subscribe too
    if (ords.length === 0) {
      throw new Error("Cannot Subscribe: nothing to subscribe too");
    }
                  
    // Intermediate callback
    var space = this.$space;
    cb.addOk(function (ok, fail, resp) {  
      var importOk = function () {
        // Commit the sync ops
        space.$fw("commitSyncOps", resp.e.ops);
           
        // Pass back an array of handles that were subscribed   
        ok(resp.h);  
      };

      // Pre-emptively scan the BSON for Types that don't exist yet or have Contracts loaded
      // and request them in one network call            
      var unknownTypes = baja.bson.scanForUnknownTypes(resp);            
      if (unknownTypes.length > 0) {
        var importBatch = new baja.comm.Batch();
        baja.importTypes({
          "typeSpecs": unknownTypes, 
          "ok": importOk,
          "fail": fail,
          "batch": importBatch
        });
        
        if (importAsync) {
          importBatch.commit();
        }
        else {
          importBatch.commitSync();
        }
      }
      else {
        importOk();
      }      
    });
        
    // Make a call on the Server
    baja.comm.serverHandlerCall(space.getAbsoluteOrd().toString(),
                                "sub",
                                ords,
                                cb);   
  };
  
  /**
   * Component Unsubscription.
   *
   * @private
   *
   * @param {Array} ords an array of Components to unsubscribe.
   * @param {baja.comm.Callback} cb
   */
  BoxCallbacks.prototype.unsubscribe = function (ords, cb) {
    strictArg(ords, Array);
        
    // Check there is something to subscribe too
    if (ords.length === 0) {
      throw new Error("Cannot Unsubscribe: nothing to unsubscribe too");
    }
       
    var newOk = function (comp) {
      try {
        comp.$fw("fwUnsubscribed");
      }
      catch (err) {
        baja.error(err);
      }
    };
       
    // Intermediate callback
    var space = this.$space;
    cb.addOk(function (ok, fail, resp) {               
      // Call unsubscribed callbacks
      var i;
      for (i = 0; i < ords.length; ++i) {
        baja.Ord.make(ords[i]).get({
          ok: newOk,
          base: space
        });
      }
      
      ok();      
    });
        
    // Make a call on the Server
    baja.comm.serverHandlerCall(this.$space.getAbsoluteOrd().toString(),
                                "unsub",
                                ords,
                                cb);      
  };
  
  /**
   * Invoke an Action.
   *
   * @private
   *
   * @param comp the Component the Action will be invoked upon.
   * @param {baja.Slot} the Action Slot.
   * @param val the argument for the Action (can be null).
   * @param {baja.comm.Callback} cb
   */
  BoxCallbacks.prototype.invokeAction = function (comp, action, val, cb) {
        
    // Intermediate callback
    cb.addOk(function (ok, fail, resp) {
      // Decode the value returned
      var v = null;
      if (resp !== null) {     
        // TODO: scan response for unknown Types once batch end callback is fixed     
        v = bsonDecodeValue(resp, serverDecodeContext);
      }
      ok(v);
    });
    
    var arg = {
      h: comp.getHandle(),
      a: action.getName()
    };
    
    // Encode value if available
    if (val !== null) {
      arg.b = baja.bson.encodeValue(val);
    }
    
    // Make a call on the Server Side Component  
    baja.comm.serverHandlerCall(this.$space.getAbsoluteOrd().toString(),
                                "invokeAction",
                                arg,
                                cb); 
  }; 
  
  /**
   * Get the Action Parameter Default Value.
   *
   * @private
   *
   * @param {baja.Component} comp
   * @param {baja.Action} action
   * @param {baja.comm.Callback} cb
   */
  BoxCallbacks.prototype.getActionParameterDefault = function (comp, action, cb) {    
    // Intermediate callback to decode Action parameter default
    cb.addOk(function (ok, fail, resp) {
      // TODO: What about decoding Types in bulk here?
      ok(resp === null ? null : bsonDecodeValue(resp, serverDecodeContext));
    });
  
    // Make a call to get the Action Parameter Default for this Slot
    baja.comm.serverHandlerCall(this.$space.getAbsoluteOrd().toString(),
                                "getActionParameterDefault",
                                { "h": comp.getHandle(), "a": action.getName() },
                                cb); 
  };
  
  /**
   * Invoke a Server Side Call.
   *
   * @private
   *
   * @param comp the Component for the Server Side Call.
   * @param {String} typeSpec
   * @param {String} methodName
   * @param val the argument for the Server Side Call (can be null).
   * @param {baja.comm.Callback} cb
   */
  BoxCallbacks.prototype.serverSideCall = function (comp, typeSpec, methodName, val, cb) {        
    // Add intermediate callback
    cb.addOk(function (ok, fail, resp) {
      if (resp !== null) {
        var importOk = function () {
          ok(bsonDecodeValue(resp, serverDecodeContext));
        };
      
        // Pre-emptively scan the BSON for Types that don't exist yet or have Contracts loaded
        // and request them in one network call            
        var unknownTypes = baja.bson.scanForUnknownTypes(resp);            
        if (unknownTypes.length > 0) {
          var importBatch = new baja.comm.Batch();
          baja.importTypes({
            "typeSpecs": unknownTypes, 
            "ok": importOk,
            "fail": fail,
            "batch": importBatch
          });
          
          if (cb.getBatch().isAsync()) {
            importBatch.commit();
          }
          else {
            importBatch.commitSync();
          }
        }
        else {
          importOk();
        }
      }
      else {
        ok(null);
      }
    });
    
    // Arguments    
    var arg = {
      h:  comp.getHandle(),
      ts: typeSpec,
      m:  methodName
    };
    
    // Encode value if available
    if (val !== null) {
      arg.b = baja.bson.encodeValue(val);
    }
    
    // Make a call on the Server
    baja.comm.serverHandlerCall(this.$space.getAbsoluteOrd().toString(),
                                "serverSideCall",
                                arg,
                                cb);       
  };
    
  /**
   * Poll the Server for events.
   *
   * @private
   *
   * @param {baja.comm.Callback} cb
   */  
  BoxCallbacks.prototype.poll = function (cb) {    
    baja.comm.poll(cb);
  };
  
  /**
   * Convert a handle to a Slot Path.
   *
   * @private
   *
   * @param {String} handle
   * @param {baja.comm.Callback} cb
   */
  BoxCallbacks.prototype.handleToPath = function (handle, cb) {   
    // Intermediate callback to pass in SlotPath to callback
    cb.addOk(function (ok, fail, slotPathStr) {
      ok(new baja.SlotPath(slotPathStr));
    });
  
    // Make a call on the Server Side Component to unsubscribe  
    baja.comm.serverHandlerCall(this.$space.getAbsoluteOrd().toString(),
                                "handleToPath",
                                handle,
                                cb); 
  };
  
  /**
   * Resolve a Service via its TypeSpec (moduleName:typeName).
   *
   * @private
   *
   * @param {String} typeSpec
   * @param {baja.comm.Callback} cb
   */
  BoxCallbacks.prototype.getService = function (typeSpec, cb) {
    strictArg(typeSpec, String);
    
    // Intermediate callback to resolve the SlotPath into the target Component
    var that = this;
    cb.addOk(function (ok, fail, slotPath) {
      // Resolve the SlotPath ORD
      baja.Ord.make(slotPath.toString()).get({
        "base": that.$space, 
        "ok": ok, 
        "fail": fail
      });
    });
  
    this.serviceToPath(typeSpec, cb);
  };
  
  /**
   * Resolve a Service to its SlotPath via a TypeSpec.
   *
   * @private
   *
   * @param {String} typeSpec
   * @param {baja.comm.Callback} cb
   */
  BoxCallbacks.prototype.serviceToPath = function (typeSpec, cb) {    
    // Intermediate callback to pass in SlotPath to callback
    cb.addOk(function (ok, fail, slotPathStr) {
      ok(new baja.SlotPath(slotPathStr));
    });
  
    // Make a call on the Server Side Component to unsubscribe  
    baja.comm.serverHandlerCall(this.$space.getAbsoluteOrd().toString(),
                                "serviceToPath",
                                typeSpec,
                                cb); 
  };
  
  /**
   * Make a Link.
   *
   * @private
   *
   * @param {baja.Component} source Component for the link.
   * @param {baja.Slot} sourceSlot source Slot for the link.
   * @param {baja.Component} target Component for the link.
   * @param {baja.Slot} targetSlot target Slot for the link.
   * @param {baja.comm.Callback} cb 
   */
  BoxCallbacks.prototype.makeLink = function (source, sourceSlot, target, targetSlot, cb) {     
    // Add intermediate callback
    cb.addOk(function (ok, fail, resp) {    
      // TODO: Scan response for unknown Types
      ok(bsonDecodeValue(resp, serverDecodeContext));
    });
    
    // Arguments    
    var arg = {
      s: source.getHandle(),
      ss: sourceSlot.getName(),
      t: target.getHandle(),
      ts: targetSlot.getName()
    };
        
    // Make a call on the Server
    baja.comm.serverHandlerCall(this.$space.getAbsoluteOrd().toString(),
                                "makeLink",
                                arg,
                                cb);   
  }; 
  
  /**
   * Get the Nav Children of a Component.
   *
   * @private
   *
   * @param {String} handle
   * @param {baja.comm.Callback} cb
   */
  BoxCallbacks.prototype.getNavChildren = function (handle, cb) {   
    // Intermediate callback to resolve Nav ORDs
    cb.addOk(function (ok, fail, navOrds) {
      // Resolve each of the Nav ORDs
      new baja.BatchResolve(navOrds).resolve({
        ok: function () {
          // Pass the resolved Components to the callback handler
          ok(this.getTargetObjects());
        },
        fail: fail
      });
    });
  
    // Make a call on the Server Side to get the Nav Children 
    baja.comm.serverHandlerCall(this.$space.getAbsoluteOrd().toString(),
                                "navChildren",
                                handle,
                                cb); 
  };
    
  ////////////////////////////////////////////////////////////////
  // sendToMaster SyncOps
  //////////////////////////////////////////////////////////////// 
  
  /**
   * Server Add.
   *
   * @private
   *
   * @param comp the Component being added too.
   * @param {String} slotName
   * @param val the value to be added.
   * @param {Number} flags slot flags.
   * @param {baja.Facets} facets slot facets.
   * @param {baja.comm.Callback} cb   
   */
  BoxCallbacks.prototype.add = function (comp, slotName, val, flags, facets, cb) {
    // Add intermediate callback to pass back newly added Property
    cb.addOk(function (ok, fail, resp) {
      // Attempt to get newly added Property name from server response
      var newName = slotName;
      if (resp && resp instanceof Array && resp.length > 0 && resp[0].nn) {
        newName = resp[0].nn;
      }
    
      // Please note: if the slot name had a wildcard in it, this won't work (i.e. 'test?')
      ok(comp.getSlot(newName));
    });
  
    // Send the op to the Server
    new AddOp(comp, slotName, val, flags, facets).syncTo(comp.getComponentSpace(), cb);   
  };  
  
  /**
   * Server Set.
   *
   * @private
   *
   * @param comp the Component being added too.
   * @param {Array} propPath array of Property names used for the set.
   * @param val the value for the set.
   * @param {baja.comm.Callback} cb   
   */
  BoxCallbacks.prototype.set = function (comp, propPath, val, cb) {     
    // Send the op to the Server
    new SetOp(comp, propPath, val).syncTo(comp.getComponentSpace(), cb);   
  };  
  
  /**
   * Server Remove.
   *
   * @private
   *
   * @param comp the Component being removed from.
   * @param {baja.Slot} slot the slot to be removed.
   * @param {baja.comm.Callback} cb   
   */
  BoxCallbacks.prototype.remove = function (comp, slot, cb) {     
    // Send the op to the Server
    new RemoveOp(comp, slot).syncTo(comp.getComponentSpace(), cb);   
  };  
  
  /**
   * Server Rename.
   *
   * @private
   *
   * @param comp the Component the slot is being renamed on.
   * @param {String} oldName the old name of the slot.
   * @param {String} newName the new name of the slot.
   * @param {baja.comm.Callback} cb
   */
  BoxCallbacks.prototype.rename = function (comp, oldName, newName, cb) {     
    // Send the op to the Server
    new RenameOp(comp, oldName, newName).syncTo(comp.getComponentSpace(), cb);   
  };
  
  /**
   * Server Reorder.
   *
   * @private
   *
   * @param comp the Component the dynamic slots are being reordered upon.
   * @param {Array} dynamicProperties an array of Property names that specify the new order.
   * @param {baja.comm.Callback} cb
   */
  BoxCallbacks.prototype.reorder = function (comp, dynamicProperties, cb) {     
    // Send the op to the Server
    new ReorderOp(comp, dynamicProperties).syncTo(comp.getComponentSpace(), cb);   
  };
  
  /**
   * Server Set Flags.
   *
   * @private
   *
   * @param comp the Component for the slot the flags will be set upon.
   * @param {baja.Slot} slot the slot the flags are being set upon.
   * @param {Number} flags the new slot flags.
   * @param {baja.comm.Callback} cb 
   */
  BoxCallbacks.prototype.setFlags = function (comp, slot, flags, cb) {     
    // Send the op to the Server
    new SetFlagsOp(comp, slot, flags).syncTo(comp.getComponentSpace(), cb);   
  };
  
  /**
   * Server Set Facets.
   *
   * @private
   *
   * @param comp the Component for the slot the facets will be set upon.
   * @param {baja.Slot} slot the dynamic slot the facets are being set upon.
   * @param {baja.Facets} facets the new slot facets.
   * @param {baja.comm.Callback} cb 
   */
  BoxCallbacks.prototype.setFacets = function (comp, slot, facets, cb) {     
    // Send the op to the Server
    new SetFacetsOp(comp, slot, facets).syncTo(comp.getComponentSpace(), cb);   
  };
  
  /**
   * Server Topic Fire.
   *
   * @private
   *
   * @param comp the Component the Topic will be fired from.
   * @param {baja.Slot} slot the Topic Slot.
   * @param event the Topic event (can be null).
   * @param {baja.comm.Callback} cb 
   */
  BoxCallbacks.prototype.fire = function (comp, slot, event, cb) {     
    // Send the op to the Server
    new FireTopicOp(comp, slot, event).syncTo(comp.getComponentSpace(), cb);   
  };  
  
  ////////////////////////////////////////////////////////////////
  // BOX Component Space
  //////////////////////////////////////////////////////////////// 
   
  /**
   * @class BOX Component Space.
   * <p>
   * A BOX Component Space is a Proxy Component Space that's linked to another 
   * Component Space in another host elsewhere.
   *
   * @name baja.BoxComponentSpace
   * @extends baja.ComponentSpace
   * @private
   *
   * @param {String} name
   * @param {String} ordInSession
   * @param host
   */   
  baja.BoxComponentSpace = function (name, ordInSession, host) {
    baja.BoxComponentSpace.$super.apply(this, arguments);
    this.$callbacks = new BoxCallbacks(this);
  }.$extend(baja.ComponentSpace); 
  
  /**
   * Call to initialize a Component Space.
   *
   * @private
   * 
   * @param {baja.comm.Batch} batch
   */
  baja.BoxComponentSpace.prototype.init = function (batch) {
          
    // Any events are sync ops so process then in the normal way
    var that = this;
    function eventHandler(events) {
      that.$fw("commitSyncOps", events.ops);
    }
    
    try {   
      // Make the server side Handler for this Component Space   
      baja.comm.makeServerHandler(this.getAbsoluteOrd().toString(), // The id of the Server Session Handler to be created
                                  "box:ComponentSpaceSessionHandler", // Type Spec of the Server Session Handler
                                  this.getAbsoluteOrd().toString(), // Initial argument for the Server Session Handler
                                  eventHandler,
                                  new Callback(baja.ok, baja.fail, batch),
                                  /*makeInBatch*/true);         
              
      // Load Root Component of Station
      var cb = new Callback(function ok(resp) {
      
        // Create the root of the Station
        that.$root = baja.$(resp.t);
        
        // Set the core handle of the Station
        that.$root.$handle = resp.h;
        
        // Mount the local Station root
        that.$fw("mount", that.$root);
      }, 
      baja.fail, batch);
          
      // Make a call on the Server Side Handler  
      baja.comm.serverHandlerCall(this.getAbsoluteOrd().toString(),
                                  "loadRoot",
                                  /*Server Component Arg Call*/null,
                                  cb,
                                  /*makeInBatch*/true); 
    }
    catch (err) {
      baja.fail(err);
    }
  };
  
  /**
   * Sync the Component Space.
   * <p>
   * This method will result in a network call to sync the master Space with this one.
   * <p>
   * An Object Literal is used for the method's arguments.
   *
   * @private
   *
   * @param {Object} [obj] the Object Literal for the method's arguments.
   * @param {Function} [obj.ok] the ok callback. Called once the Component Space has
   *                            been successfully synchronized with the Server.
   * @param {Function} [obj.fail] the fail callback. Called If the Component Space 
   *                              can't be synchronized.
   * @param {baja.comm.Batch} [obj.batch] if defined, any network calls will be batched into this object.
   */
  baja.BoxComponentSpace.prototype.sync = function (obj) {
    obj = baja.objectify(obj, "ok");
    var cb = new Callback(obj.ok, obj.fail, obj.batch);
    try {
      this.$callbacks.poll(cb);
    }
    catch (err) {
      cb.fail(err);
    }
  };
  
  /**
   * Find the Component via its handle (null if not found).
   * <p>
   * An Object Literal is used for the method's arguments.
   *
   * @private
   *
   * @param {Object} [obj] the Object Literal for the method's arguments.
   * @param {Function} [obj.ok] the ok callback. Called if the Component is resolved.
   *                            The Component instance will be passed to this function.
   * @param {Function} [obj.fail] the fail callback. Call if there's an error or the Component
   *                              can't be resolved.
   * @param {baja.comm.Batch} [obj.batch] if defined, any network calls will be batched into this object.
   */  
  baja.BoxComponentSpace.prototype.resolveByHandle = function (obj) {
    obj = baja.objectify(obj);
    
    var handle = obj.handle,
        cb = new Callback(obj.ok, obj.fail, obj.batch),
        that = this;
    
    try {    
      var comp = this.findByHandle(handle);    
      if (comp !== null) {
        cb.ok(comp);
      }
      else {
      
        // Intermediate callback to resolve the SlotPath into the target Component
        cb.addOk(function (ok, fail, slotPath) {
          // Resolve the SlotPath ORD
          baja.Ord.make(slotPath.toString()).get({
            "base": that,
            "ok": ok, 
            "fail": fail
          });
        });
      
        this.$callbacks.handleToPath(handle, cb);
      }
    }
    catch (err) {
      cb.fail(err);
    }
  }; 
    
  /**
   * Private fw method used by LoadOp for synchronizing two Components.
   *
   * @param from  the from Component.
   * @param to    the to Component.
   *
   * @private
   */   
  var emptyCommitCx = { commit: true, serverDecode: true, syncStructVals: true };
  function syncComp(from, to) {
  
    // Sanity check - must be same Type
    if (from.getType().getTypeSpec() !== to.getType().getTypeSpec()) {
      throw new Error("LoadOp Types differ: " + from.getType() + " - " + to.getType());
    }
    
    // Sanity check - must have same handle
    if (to.getHandle() !== from.getHandle()) {
      throw new Error("LoadOp Handle Error: " + from.getHandle() + " - " + to.getHandle());
    }
    
    // Update display name
    if (from.getPropertyInParent() !== null) {
      to.getPropertyInParent().$setDisplayName(from.getPropertyInParent().$getDisplayName());
      to.getPropertyInParent().$setDisplay(from.getPropertyInParent().$getDisplay());
    }
    
    // Map over cached permissions
    to.$fw("setPermissions", from.$permissionsStr);
    
    // If this component isn't loaded then don't try to sync its slots
    if (!from.$bPropsLoaded) {
      // TODO: Sync icon
      return;
    }
    
    // Signal the broker properties are loaded
    to.$bPropsLoaded = true;
    
    // Note down Properties before synchronization
    var pb = {}, // Properties before
        tslots = to.$map.$map, // Access internal OrderedMap instead of cursor for speed
        p;
    
    for (p in tslots) {
      if (tslots.hasOwnProperty(p) && tslots[p].isProperty()) {
        pb[p] = tslots[p];
      }
    }    
    
    var fslots = from.$map.$map, // Access internal OrderedMap for speed
        name,
        fromSlot,
        toSlot,
        fromFlags,
        fromValue,
        cx,
        reorder = false,
        reorderSlots;
    
    for (p in fslots) {
      if (fslots.hasOwnProperty(p)) {
      
        fromSlot = fslots[p];
        name = fromSlot.getName();
        toSlot = to.getSlot(name);
        fromFlags = from.getFlags(fromSlot);
        
        if (!fromSlot.isFrozen()) {
          reorderSlots = reorderSlots || [];
          reorderSlots.push(name);
        }
        
        // If to slot is not present then we need to add
        if (toSlot === null) {
        
          // TODO: Handle display String
          cx = { commit: true, serverDecode: true, displayName: fromSlot.$getDisplayName(), display: fromSlot.$getDisplay() };
                
          fromValue = from.get(name);
          if (fromValue.$parent) {
            fromValue.$parent = null; // TODO: Hack to get around any parenting problems
          }
          to.add({
            "slot": name, 
            "value": fromValue, 
            "flags": fromFlags, 
            "facets": from.getFacets(fromSlot), 
            "cx": cx
          });
          
          continue;
        }
        
        // If there's already a dynamic slot on the 'to' Component then attempt a reorder
        if (!fromSlot.isFrozen()) {
          reorder = true;
        }
              
        delete pb[name];
        
        // Set the flags if they differ
        if (fromFlags !== toSlot.getFlags()) {
          to.setFlags({
            "slot": toSlot, 
            "flags": fromFlags, 
            "cx": emptyCommitCx
          });
        }
                                        
        syncSlots(from, fromSlot, to, toSlot);
      }
    }
    
    // at this point if there were any props before that we didn't 
    // sync we need to remove them now; since they weren't found 
    // on "from" that means they have since been removed
    var removeName;
    for (removeName in pb) {
      if (pb.hasOwnProperty(removeName)) {
        to.remove({
          "slot": pb[removeName], 
          "cx": emptyCommitCx
        });
      }
    }
    
    // Sync Knobs
    var fromKnobs = from.$knobs,
        toKnobs = to.$knobs,
        installKnobs, uninstallKnobs, i, x;
        
    if (fromKnobs) {
      installKnobs = [];
    
      // Install any knobs missing from the to Component
      for (p in fromKnobs) {
        if (fromKnobs.hasOwnProperty(p)) {
          if (!toKnobs) {
            installKnobs.push(fromKnobs[p]);
          }
          else if (!toKnobs.hasOwnProperty(p)) {
            installKnobs.push(fromKnobs[p]);
          }
        }
      }
    }
    
    if (toKnobs) {
      uninstallKnobs = [];
      
      // Install any knobs missing from the to Component
      for (p in toKnobs) {
        if (toKnobs.hasOwnProperty(p)) {
          if (!fromKnobs) {
            uninstallKnobs.push(toKnobs[p]);
          }
          else if (!fromKnobs.hasOwnProperty(p)) {
            uninstallKnobs.push(toKnobs[p]);
          }
        }
      }
    }
    
    if (installKnobs) {
      for (i = 0; i < installKnobs.length; ++i) {
        to.$fw("installKnob", installKnobs[i], emptyCommitCx);
      }
    }
    
    if (uninstallKnobs) {
      for (x = 0; x < uninstallKnobs.length; ++x) {
        to.$fw("uninstallKnob", uninstallKnobs[x].getId(), uninstallKnobs[x].getSourceSlotName(), emptyCommitCx);
      }
    }
    
    // Attempt reorder
    if (reorder && reorderSlots) {
      to.reorder({
        dynamicProperties: reorderSlots,
        cx: emptyCommitCx
      });
    }    
  }
  
  /**
   * Private fw method used by LoadOp for synchronizing Slots between two Complexes
   *
   * @param from      the from Complex.
   * @param fromSlot  the from Complex Slot.
   * @param to        the to Complex.
   * @param toSlot    the to Complex Slot.
   *
   * @private
   */ 
  function syncSlots(from, fromSlot, to, toSlot) {
    // Sync the display names between the slots
    toSlot.$setDisplayName(fromSlot.$getDisplayName());
  
    // Don't sync any further if the Slot isn't a Property
    if (!fromSlot.isProperty()) {
      return;
    }
  
    // If neither of these Slots have been decoded then skip trying to sync!
    if (fromSlot.isFrozen() && 
       !fromSlot.$isValueDecoded() &&
       !toSlot.$isValueDecoded() &&
       fromSlot.getType().getTypeSpec() === toSlot.getType().getTypeSpec()) {
      return;
    }
    
    // TODO: Update display string
    syncVal(from.get(fromSlot), to, toSlot, fromSlot.$getDisplay());
  }
    
  /**
   * Private fw method used to synchronize a Property value in a Component.
   *
   * @param fromValue  the from Value.
   * @param to        the to Component.
   * @param toProp    the to Component Property.
   * @param display  the from display.
   *
   * @private
   */   
  function syncVal(fromValue, to, toProp, display) {
    
    var toValue = to.get(toProp),
        isFromValComp = fromValue.getType().isComponent();
    
    toProp.$setDisplay(display);
    // TODO: Update display string
    
    // we need to do a full replace if:
    //  - the type has changed 
    //  - the value is a simple
    //  - we need to assign component handle 
    if (fromValue.getType().getTypeSpec() !== toValue.getType().getTypeSpec() || 
        fromValue.getType().isSimple() || 
        (toValue.getType().isComponent() && toValue.getHandle() === null)) {
          
      if (fromValue.$parent) {
        fromValue.$parent = null; // TODO: Hack to get around the fact that we haven't implemented newCopy yet
      }     
      
      // TODO: What about display name and display getting passed through here?
      to.set({
        "slot": toProp,
        "value": fromValue,  
        "cx": emptyCommitCx
      });      
      return;
    }
    
    // Do a full sync if this is a Component
    if (isFromValComp) {
      syncComp(fromValue, toValue);
      return;
    }
    
    // Otherwise this is a Struct so do a sync in place
    var fslots = fromValue.$map.$map, // Use internal OrderedMap instead of Cursors for speed
        nextFromProp, // From Property
        p;
    
    for (p in fslots) {
      if (fslots.hasOwnProperty(p)) {
        nextFromProp = fslots[p];
        syncSlots(fromValue, nextFromProp, toValue, toValue.getSlot(nextFromProp.getName()));
      }
    }
  }
                 
  /**
   * Commit Slots to the Component Space.
   *
   * @param {Array} slotInfo.
   *
   * @private
   */
  var commitSlotInfo = function (slotInfo) {
    var comp, cx, newVal, slot, bson, i;
    
    for (i = 0; i < slotInfo.length; ++i) {
  
      bson = slotInfo[i];
      
      // Attempt to find the Component
      comp = this.findByHandle(bson.h);
            
      // Only load a singular Slot if the Component isn't already loaded
      // TODO: Ensure we sync with master before loadSlot is processed in
      // ORD resolution
      if (comp !== null && !comp.$bPropsLoaded) {
      
        // What about mounting a Component???
      
        // Decode the Value
        newVal = bsonDecodeValue(bson.v, serverDecodeContext);
        
        // Force any Component to be stubbed
        if (newVal.getType().isComponent()) {
          newVal.$bPropsLoaded = false;
        }
      
        cx = { commit: true, serverDecode: true };
        
        // Add the display name if we've got one
        if (bson.dn) {    
          cx.displayName = bson.dn; 
        }
        
        // Add the display string if we've got one
        if (bson.d) {    
          cx.display = bson.d; 
        }
              
        // TODO: What if the Component is already fully loaded?
      
        // Does the Slot currently exist?
        slot = comp.getSlot(bson.n);
        if (slot === null) {
        
          // Add the Slot if it doesn't currently exist
          comp.add({
            "slot": bson.n, 
            "value": newVal, 
            "flags": baja.Flags.decodeFromString(bajaDef(bson.f, "")), 
            "facets": baja.Facets.DEFAULT.decodeFromString(bajaDef(bson.x, "")),
            "cx": cx
          });
        }
        else {        
          if (bson.dn) {
            slot.$setDisplayName(bson.dn);
          }
        
          // Synchronize the value
          syncVal(newVal, comp, slot, bson.d);
        }
      }
    }
  };
      
  /**
   * Commit the sync ops to the Component Space.
   *
   * @private
   *
   * @param {Array} syncOpsArray  an array of Sync Ops to be committed to the Component Space.
   */
  var commitSyncOps = function (syncOpsArray) {
    strictArg(syncOpsArray, Array);
    
    // Commit all of the SyncOps
    var sp,   // SyncOp
        comp, // Component, the Op happens on
        i;
        
    for (i = 0; i < syncOpsArray.length; ++i) {
      sp = syncOpsArray[i];
      
      try {
        
        // Get Component from SyncOp
        if (sp.h !== undefined) { // Was the handle encoded?
          comp = this.findByHandle(sp.h);
          
          // Update the display name of the component
          if (comp && comp.getPropertyInParent() !== null) {
            comp.getPropertyInParent().$setDisplayName(sp.cdn);
            comp.getPropertyInParent().$setDisplay(sp.cd);
          }
        }
        else {
          comp = null;
        }
        
        // Look up SyncOp, decode and Commit
        if (syncOps.hasOwnProperty(sp.nm) && 
            typeof syncOps[sp.nm] === "function" && 
            typeof syncOps[sp.nm].id === "string") {
          syncOps[sp.nm].decodeAndCommit(comp, sp);
        }
      }
      catch (err) {
        // Log any errors generated by committing sync ops
        baja.error(err);
      }
    }
  };
  
  /**
   * Private framework handler for a Component Space.
   * <p>
   * This is a private internal method for framework developers.
   *
   * @private
   */
  baja.BoxComponentSpace.prototype.$fw = function (x, a, b, c) {    
    if (x === "commitSyncOps") {
      // Process sync ops
      commitSyncOps.call(this, /*SyncOps*/a);
    }
    else if (x === "commitSlotInfo") {
      // Commit a singular Slot
      commitSlotInfo.call(this, /*Slot Information to Commit*/a);
    }
    else {
      // Else call super framework handler
      baja.BoxComponentSpace.$super.prototype.$fw.apply(this, arguments);
    }
  };  
            
}(baja));
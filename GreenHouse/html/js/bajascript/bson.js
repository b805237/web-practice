//
// Copyright 2010, Tridium, Inc. All Rights Reserved.
//

/**
 * BOX System Object Notation.
 * <p>
 * BSON is BOG notation in a JSON format. JSON is used instead of XML because
 * tests show that browsers can parse JSON significantly faster.
 *
 * @author Gareth Johnson
 * @version 1.0.0.0
 */

//JsLint options (see http://www.jslint.com )
/*jslint rhino: true, onevar: false, plusplus: true, white: true, undef: false, nomen: false, eqeqeq: true, 
bitwise: true, regexp: true, newcap: true, immed: true, strict: false, indent: 2, vars: true, continue: true */

// Globals for JsLint to ignore 
/*global baja, syncVal, encodeVal, BaseBajaObj*/ 
  
(function bson(baja) {

  // Use ECMAScript 5 Strict Mode
  "use strict";
  
  // Create local for improved minification
  var bajaDef = baja.def,
      objectify = baja.objectify,
      serverDecodeContext = baja.$serverDecodeContext = { serverDecode: true },
      bsonDecodeValue;
  
  /**
   * @namespace BOX System Object Notation.
   */
  baja.bson = new BaseBajaObj();
  
  ////////////////////////////////////////////////////////////////
  // Decode Actions/Topics
  //////////////////////////////////////////////////////////////// 
  
  /**
   * Decode the BSON for an Action Type.
   *
   * @private
   *
   * @param bson the BSON to decode.
   * @returns type the parameter for the Action Type (or null if none).
   */
  function decodeActionParamType(bson) {
    var paramType = null;    
    
    // Decode Action Parameter Type
    if (typeof bson.apt === "string") {
      paramType = baja.lt(bson.apt);
    }
    
    return paramType;
  }
  
  /**
   * Decode the BSON for an Action Default.
   *
   * @private
   *
   * @param bson the BSON to decode.
   * @returns type the parameter for the Action Default (or null if none).
   */
  function decodeActionParamDefault(bson) {
    var paramDef = null;    
    
    // Decode default Action Parameter Type
    if (typeof bson.apd === "object") {
      paramDef = bsonDecodeValue(bson.apd, serverDecodeContext);
    }
    
    return paramDef;
  }
  
  /**
   * Decode the BSON for an Action Return Type.
   *
   * @private
   *
   * @param bson the BSON to decode.
   * @returns type the parameter for the Action Return Type (or null if none).
   */
  function decodeActionReturnType(bson) {
    var returnType = null;    
    
    // Decode default Action Parameter Type
    if (typeof bson.art === "string") {
      returnType = baja.lt(bson.art);
    }
    
    return returnType;
  }
        
  /**
   * Decode the BSON for the Topic and return the event type.
   *
   * @private
   *
   * @param bson the BSON to decode.
   * @returns {Type} the event type for a Topic.
   */
  function decodeTopicEventType(bson) {   
    var eventType = null;
    
    if (typeof bson.tet === "string") {
      eventType = baja.lt(bson.tet);
    }
    
    return eventType;
  }

  ////////////////////////////////////////////////////////////////
  // BSON Frozen Slots
  //////////////////////////////////////////////////////////////// 
  
  /**
   * @class Frozen Property Slot.
   * <p>
   * Property defines a Slot which is a storage location
   * for a variable in a Complex.
   * <p>
   * A new object should never be directly created with this Constructor. All Slots are 
   * created internally by BajaScript.
   *
   * @name FrozenProperty
   * @extends baja.Property
   */
  var FrozenProperty = function (bson, complex) {
    FrozenProperty.$super.call(this, bson.n, bson.dn);
    this.$bson = bson;
    this.$complex = complex;
  }.$extend(baja.Property);
  
  FrozenProperty.prototype.isFrozen = function () {
    return true;
  };
  
  /**   
   * Return the Property value.
   * <p>
   * Please note, this method is intended for INTERNAL use by Tridium only. An
   * external developer should never call this method.
   *
   * @private  
   *
   * @returns value
   */
  FrozenProperty.prototype.$getValue = function () {
    if (this.$val === undefined) {
      var val = this.$val = bsonDecodeValue(this.$bson.v, serverDecodeContext);
      // Set up any parenting if needed      
      if (val.getType().isComplex() && this.$complex) {
        val.$parent = this.$complex;
        val.$propInParent = this;
      }
    }
    return this.$val;
  };
  
  /**
   * Return true if the value has been lazily decoded.
   *
   * @private
   *
   * @returns {Boolean}
   */
  FrozenProperty.prototype.$isValueDecoded = function () {
    return this.$val !== undefined;
  };

  /**   
   * Set the Property value.
   * <p>
   * Please note, this method is intended for INTERNAL use by Tridium only. An
   * external developer should never call this method.
   *
   * @private  
   *
   * @param val value to be set.
   */
  FrozenProperty.prototype.$setValue = function (val) {
    this.$val = val;
  };   
    
  /**   
   * Return the Flags for the Property.
   *
   * @see baja.Flags
   *
   * @returns {Number}
   */
  FrozenProperty.prototype.getFlags = function () { 
    if (this.$flags === undefined) {
      this.$flags = this.$bson.f === undefined ? 0 : baja.Flags.decodeFromString(this.$bson.f);
    }
    return this.$flags; 
  };
  
  /**   
   * Set the Flags for the Property.
   * <p>
   * Please note, this method is intended for INTERNAL use by Tridium only. An
   * external developer should never call this method.
   *
   * @private
   * @see baja.Flags
   *
   * @param {Number} flags
   */
  FrozenProperty.prototype.$setFlags = function (flags) { 
    this.$flags = flags; 
  };
  
  /**
   * Return the Facets for the Property.
   *
   * @see baja.Facets
   *
   * @returns the Slot Facets
   */
  FrozenProperty.prototype.getFacets = function () {
    if (this.$facets === undefined) {
      this.$facets = this.$bson.x === undefined ? baja.Facets.DEFAULT : baja.Facets.DEFAULT.decodeFromString(this.$bson.x);
    }
    return this.$facets;  
  };
  
  /**   
   * Set the Facets for the Property.
   * <p>
   * Please note, this method is intended for INTERNAL use by Tridium only. An
   * external developer should never call this method.
   *
   * @private
   * @see baja.Facets
   *
   * @param {baja.Facets} facets
   */
  FrozenProperty.prototype.$setFacets = function (facets) {
    this.$facets = facets; 
  };
  
  /**
   * Return the default flags for the Property.
   *
   * @returns {Number}
   */
  FrozenProperty.prototype.getDefaultFlags = function () {
    if (this.$defFlags === undefined) {
      this.$defFlags = this.$bson.f === undefined ? 0 : baja.Flags.decodeFromString(this.$bson.f);
    }
    return this.$defFlags; 
  };
  
  /**
   * Return the default value for the Property.
   *
   * @returns the default value for the Property.
   */
  FrozenProperty.prototype.getDefaultValue = function () {   
    if (this.$defVal === undefined) {
      this.$defVal = bsonDecodeValue(this.$bson.v, serverDecodeContext);
    }
    return this.$defVal;
  }; 
  
  /**
   * Return the Type for this Property.
   *
   * @returns the Type for the Property.
   */
  FrozenProperty.prototype.getType = function () {
    if (this.$val === undefined) {
      if (this.$initType === undefined) {
        this.$initType = baja.lt(this.$bson.v.t);
      }
      return this.$initType;
    }
    else {
      return this.$getValue().getType();
    }    
  };
    
  /**
   * Return the display String for this Property.
   * <p>
   * Please note, this method is intended for INTERNAL use by Tridium only. An
   * external developer should never call this method.
   *
   * @private
   *
   * @returns {String}
   */
  FrozenProperty.prototype.$getDisplay = function () {
    if (this.$display === undefined) {
      this.$display = this.$bson.v.d || "";
    }
    return this.$display;
  };
  
  /**
   * Set the display for this Property.
   * <p>
   * Please note, this method is intended for INTERNAL use by Tridium only. An
   * external developer should never call this method.
   *
   * @private
   *
   * @param {String} display the display String
   */
  FrozenProperty.prototype.$setDisplay = function (display) {
    this.$display = display;
  };
  
  /**
   * @class Frozen Action Slot.
   * <p>
   * Action is a Slot that defines a behavior which can
   * be invoked on a Component.
   * <p>
   * A new object should never be directly created with this Constructor. All Slots are 
   * created internally by BajaScript
   *
   * @name FrozenAction
   * @extends baja.Action
   */
  var FrozenAction = function (bson) {
    FrozenAction.$super.call(this, bson.n, bson.dn);
    this.$bson = bson;
  }.$extend(baja.Action);

  FrozenAction.prototype.isFrozen = FrozenProperty.prototype.isFrozen;
  
  /**   
   * Return the Flags for the Action.
   *
   * @function
   * @see baja.Flags
   *
   * @returns {Number}
   */
  FrozenAction.prototype.getFlags = FrozenProperty.prototype.getFlags;
  
  /**   
   * Set the Flags for the Action.
   * <p>
   * Please note, this method is intended for INTERNAL use by Tridium only. An
   * external developer should never call this method.
   *
   * @function
   * @private
   * @see baja.Flags
   *
   * @param {Number} flags
   */
  FrozenAction.prototype.$setFlags = FrozenProperty.prototype.$setFlags;
  
  /**
   * Return the Facets for the Action.
   *
   * @function
   * @see baja.Facets
   *
   * @returns the Slot Facets
   */
  FrozenAction.prototype.getFacets = FrozenProperty.prototype.getFacets;
  
  /**   
   * Set the Facets for the Action.
   * <p>
   * Please note, this method is intended for INTERNAL use by Tridium only. An
   * external developer should never call this method.
   *
   * @function
   * @private
   * @see baja.Facets
   *
   * @param {baja.Facets} facets
   */
  FrozenAction.prototype.$setFacets = FrozenProperty.prototype.$setFacets;
  
  /**
   * Return the default flags for the Action.
   *
   * @returns {Number}
   */
  FrozenAction.prototype.getDefaultFlags = FrozenProperty.prototype.getDefaultFlags;
  
  /**
   * Return the Action's Parameter Type.
   *
   * @returns {Type} the Parameter's Type (or null if the Action has no argument).
   */
  FrozenAction.prototype.getParamType = function () {
    if (this.$paramType === undefined) {
      this.$paramType = decodeActionParamType(this.$bson);
    }
    return this.$paramType;
  };
  
  /**
   * Return the Action's Default Value.
   *
   * @returns the parameter default value (or null if the Action has no argument).
   */
  FrozenAction.prototype.getParamDefault = function () {
    if (this.$paramDef === undefined) {
      this.$paramDef = decodeActionParamDefault(this.$bson);
    }
    return this.$paramDef;
  };
  
  /**
   * Return the return Type for the Action.
   * 
   * @returns {Type} the return Type (or null if the Action has no return Type).
   */
  FrozenAction.prototype.getReturnType = function () {
    if (this.$returnType === undefined) {
      this.$returnType = decodeActionReturnType(this.$bson);
    }
    return this.$returnType;
  };
  
  /**
   * @class Frozen Topic Slot.
   * <p>
   * Topic defines a Slot which indicates an event that
   * is fired on a Component.
   * <p>
   * A new object should never be directly created with this Constructor. All Slots are 
   * created internally by BajaScript.
   *
   * @name FrozenTopic
   * @extends baja.Topic
   */
  var FrozenTopic = function (bson) {
    FrozenTopic.$super.call(this, bson.n, bson.dn);
    this.$bson = bson;
  }.$extend(baja.Topic);
  
  FrozenTopic.prototype.isFrozen = FrozenProperty.prototype.isFrozen;
  
  /**   
   * Return the Flags for the Topic.
   *
   * @function
   * @see baja.Flags
   *
   * @returns {Number}
   */
  FrozenTopic.prototype.getFlags = FrozenProperty.prototype.getFlags;
  
  /**   
   * Set the Flags for the Topic.
   * <p>
   * Please note, this method is intended for INTERNAL use by Tridium only. An
   * external developer should never call this method.
   *
   * @function
   * @private
   * @see baja.Flags
   *
   * @param {Number} flags
   */
  FrozenTopic.prototype.$setFlags = FrozenProperty.prototype.$setFlags;
  
  /**
   * Return the Facets for the Topic.
   *
   * @function
   * @see baja.Facets
   *
   * @returns the Slot Facets
   */
  FrozenTopic.prototype.getFacets = FrozenProperty.prototype.getFacets;
  
  /**   
   * Set the Facets for the Topic.
   * <p>
   * Please note, this method is intended for INTERNAL use by Tridium only. An
   * external developer should never call this method.
   *
   * @function
   * @private
   * @see baja.Facets
   *
   * @param {baja.Facets} facets
   */
  FrozenTopic.prototype.$setFacets = FrozenProperty.prototype.$setFacets;
  
  /**
   * Return the default flags for the Topic.
   *
   * @returns {Number}
   */
  FrozenTopic.prototype.getDefaultFlags = FrozenProperty.prototype.getDefaultFlags;
    
  /**
   * Return the event type.
   *
   * @returns {Type} the event type (or null if the Topic has not event).
   */
  FrozenTopic.prototype.getEventType = function () {
    if (this.$eventType === undefined) {
      this.$eventType = decodeTopicEventType(this.$bson);
    }
    return this.$eventType;
  };

  ////////////////////////////////////////////////////////////////
  // Auto-generate Slot Methods
  //////////////////////////////////////////////////////////////// 
  
  function generateSlotMethods(complexType, complex, slot) {
    // Cache auto-generated methods onto Type
    var autoGen = complexType.$autoGen = complexType.$autoGen || {},
        slotName = slot.getName(),
        methods = autoGen.hasOwnProperty(slotName) ? autoGen[slotName] : null;
    
    // If the methods already exist then simply copy them over and return
    if (methods) {
      var methodName;  
      for (methodName in methods) {
        if (methods.hasOwnProperty(methodName)) {
          complex[methodName] = methods[methodName];
        }
      } 
      return;
    }
    
    autoGen[slotName] = methods = {};
    
    // Please note: these auto-generated methods should always respect the fact that a Slot can be overridden by
    // sub-Types. Therefore, be aware of using too much closure in these auto-generated methods.
          
    // Form appropriate name for getters, setters and firers
    var capSlotName = slot.getName().capitalizeFirstLetter(),
        i = 0;
        
    if (slot.isProperty()) {
     
      var origGetterName = "get" + capSlotName,
          getterName = origGetterName,
          origGetterDisplayName = origGetterName + "Display",
          getterDisplayName = origGetterDisplayName,
          origSetterName = "set" + capSlotName,
          setterName = origSetterName;
            
      // Find some unique names for the getter and setter (providing this isn't the icon Slot which we DO want to override)...
      i = 0;
      if (capSlotName !== "Icon") {
        while (complex[getterName] !== undefined || complex[getterDisplayName] !== undefined || complex[setterName] !== undefined) {
          getterName = origGetterName + (++i); 
          getterDisplayName = origGetterDisplayName + i;
          setterName = origSetterName + i;
        }
      }
                                 
      // Add Getter
      complex[getterName] = methods[getterName] = function () {
        var v = this.get(slotName);
        
        // If a number then return its inner boxed value
        return v.getType().isNumber() ? v.valueOf() : v;
      };
      
      // Add Display String Getter
      complex[getterDisplayName] = methods[getterDisplayName] = function () {
        return this.getDisplay(slotName);
      };
      
      // Add Setter
      complex[setterName] = methods[setterName] = function (obj) {
        obj = objectify(obj, "value");
        obj.slot = slotName;
      
        // TODO: Need to check incoming value to ensure it's the same Type!!!
        this.set(obj);	
      };
    }
    
    var invokeActionName = slotName;
    if (slot.isAction()) {
    
      // Find a unique name for the Action invocation method
      i = 0;
      while (complex[invokeActionName] !== undefined) {
        invokeActionName = slotName + (++i); 
      }
      
      complex[invokeActionName] = methods[invokeActionName] = function (obj) {
        obj = objectify(obj, "value");
        obj.slot = slotName;
                 
        return this.invoke(obj);
      };
    }         
    
    if (slot.isTopic()) { 

      // Find a unique name for the topic invocation method     
      var origFireTopicName = "fire" + capSlotName,
          fireTopicName = origFireTopicName;
      i = 0;
      while (complex[fireTopicName] !== undefined) {
        fireTopicName = origFireTopicName + (++i); 
      }
          
      complex[fireTopicName] = methods[fireTopicName] = function (obj) {        
        obj = objectify(obj, "value");
        obj.slot = slotName;
        
        this.fire(obj);
      };
    }
  }
    
  ////////////////////////////////////////////////////////////////
  // Contracts
  //////////////////////////////////////////////////////////////// 
  
  /**
   * Return an instance of a frozen Slot.
   *
   * @param bson
   * @param {baja.Complex} [complex]
   *
   * @returns {baja.Slot}
   */
  function createContractSlot(bson, complex) {
    var slot,
        slotType = bson.st;
    
    // Create frozen Slot
    if (slotType === "p") {
      slot = new FrozenProperty(bson, complex);
    }
    else if (slotType === "a") {
      slot = new FrozenAction(bson);
    }
    else if (slotType === "t") {          
      slot = new FrozenTopic(bson);
    }
    else {
      throw new Error("Invalid BSON: Cannot decode: " + JSON.stringify(bson));
    }
    
    return slot;
  }
  
  /**
   * Return return a decoded Contract Slot.
   *
   * @private
   *
   * @param complex the Complex to decode the Slots onto
   * @param bson the BSON to decode
   */
  function decodeContractSlot(complexType, complex, bson) {    
    var slot = createContractSlot(bson, complex),
        slotName = bson.n;
                
    // Only auto-generate the Slot methods if Slot doesn't already exist.
    // This caters for Slots that are overridden by sub-Types.
    if (!complex.$map.contains(slotName)) { 
      // Auto-generate the methods and copy them over to the complex
      generateSlotMethods(complexType, complex, slot);
    }
    
    // Add to Slot Map
    complex.$map.put(slotName, slot);  
  }
    
  /**
   * Return a decoded array of Slots from a BSON Contract Definition.
   *
   * @private
   *
   * @see baja.Slot
   *
   * @param type the Type.
   * @param {baja.Complex} complex the complex instance the Slots are being loaded for.
   */
  baja.bson.decodeComplexContract = function (type, complex) {
    var clxTypes = [],
        t = type,
        i,
        j,
        bson;
    
    // Get a list of all the Super types
    while (t && t.isComplex()) {
      clxTypes.push(t);
      t = t.getSuperType();
    }
      
    // Iterate down through the Super Types and build up the Contract list
    for (i = clxTypes.length - 1; i >= 0; --i) {   
      if (!clxTypes[i].hasContract()) {
        clxTypes[i].loadContract();
      }
      
      bson = clxTypes[i].getContract();
      
      if (bson) {
        for (j = 0; j < bson.length; ++j) {      
          // Add newly created Slot to array
          decodeContractSlot(type, complex, bson[j]);      
        } 
      }
    }   
  };
  
  ////////////////////////////////////////////////////////////////
  // BSON Type Scanning
  //////////////////////////////////////////////////////////////// 

  function scanUnknown(bson, typeSpecs) { 
    if (!bson) {
      return;
    }
  
    var type,
        prop, 
        i;
     
    // Ensure we're dealing with a Slot
    if ((bson.nm === "p" || bson.nm === "a" || bson.nm === "t") && bson.t) {
      // Check to see if the Type is loaded and has a Contract associated with it
      if (baja.registry.hasType(bson.t)) {
      
        type = baja.lt(bson.t);
      
        // Only request type information if we need too
        if ((type.isComplex() || type.isFrozenEnum()) && !type.hasContract()) {
          typeSpecs[bson.t] = bson.t; 
        }
      }
      else {
        typeSpecs[bson.t] = bson.t; 
      }
    }
    
    // Scan for sub-properties
    if (bson instanceof Array) {
      for (i = 0; i < bson.length; ++i) {
        scanUnknown(bson[i], typeSpecs);
      }
    }
    else if (bson instanceof Object) {
      for (prop in bson) {
        if (bson.hasOwnProperty(prop)) {
          scanUnknown(bson[prop], typeSpecs);
        }
      }
    }
  }
  
  /**
   * Scan for Types and Contracts that aren't yet loaded into the BajaScript Registry.
   *
   * @private
   *
   * @param bson  the BSON to scan Types for.
   * @returns {Array} An array of typeSpec information we need to request for (String).
   */
  baja.bson.scanForUnknownTypes = function (bson) {
 
    // Store results in an object as we only want type information added once
    var typeSpecs = {},
        typeSpecArray = [], // Convert from object map to array
        prop;
        
    // Scan the data structure for Slot Type information
    scanUnknown(bson, typeSpecs);
    
    for (prop in typeSpecs) {
      if (typeSpecs.hasOwnProperty(prop)) {
        typeSpecArray.push(prop);
      }
    }
    
    return typeSpecArray;
  };
  
  ////////////////////////////////////////////////////////////////
  // BOG BSON Decoding
  ////////////////////////////////////////////////////////////////

  /**
   * Decode and return a Knob.
   *
   * @private
   *
   * @param bson  the BSON that contains knob information to decode
   * @returns a decoded value (null if unable to decode).
   */
  baja.bson.decodeKnob = function (bson) { 
    var targetOrd = baja.Ord.make(bson.to);
    
    // TODO: Document these methods
    return {
      getId: function getId() {
        return bson.id;
      },
      
      getSourceSlotName: function getSourceSlotName() {
        return bson.ss;
      },
            
      getTargetOrd: function getTargetOrd() {
        return targetOrd;
      },
      
      getTargetSlotName: function getTargetSlotName() {
        return bson.ts;
      }
    };
  };

  /**
   * Return a decoded value.
   *
   * @private
   *
   * @param bson  the BSON to decode.
   * @param [Object] cx the context used when decoding.
   * @returns a decoded value (null if unable to decode).
   */
  baja.bson.decodeValue = function (bson, cx, parent) {     
    cx = cx || {};
    
    // Please note the parent object is designed only to be used internally!
                
    // TODO: Skip this from LoadOp - needed for loading security permissions at some point!
    if (!(bson.nm === "p" || bson.nm === "a" || bson.nm === "t")) {
      return null;
    }
    
    // Decode
    var slot = null,
        slotType = bajaDef(bson.nm, "p"),
        stub = bajaDef(bson.stub, false),
        flags,
        i, x;
    
    if (parent) {
      slot = parent.getSlot(bson.n);
    }
    
    // Slot Flags    
    if (slot !== null) {
      if (bson.f !== undefined) { 
        flags = baja.Flags.decodeFromString(bson.f);      
        if (flags !== slot.getFlags()) {
          parent.setFlags({
            "slot": slot, 
            "flags": flags, 
            "cx": cx
          });
        }
      }
      
      if (bson.dn !== undefined) {
        slot.$setDisplayName(bson.dn);
      }
      
      if (!slot.isProperty()) {
        return null;
      }
    }
    else {
      if (slotType !== "p") {
        throw new Error("Error decoding Slot from BSON: Missing frozen Slot: " + slotType);
      }
    }
    
    // Create object used for decoding
    var obj;
    if (bson.t === undefined) {
      // TODO: Should be getDefaultValue()?
      obj = slot.$getValue();
    }
    else {
      // Get an instance of the Type
      obj = baja.$(bson.t);
    }
    
    // Decode if a Simple
    if (obj.getType().isSimple() && bson.v !== undefined) {
      obj = obj.decodeFromString(bson.v);
    }
    
    // Decode BSON specifically for baja:Action and baja:Topic
    if (obj.getType().isAction()) {      
      obj.$paramType = decodeActionParamType(bson);
      obj.$paramDef = decodeActionParamDefault(bson);
      obj.$returnType = decodeActionReturnType(bson);
    }
    else if (obj.getType().isTopic()) {
      obj.$eventType = decodeTopicEventType(bson);
    }
    
    // Decode Component
    if (obj.getType().isComponent()) {    
      // Decode handle
      if (bson.h !== undefined) {
        obj.$handle = bson.h;
      }
      
      // Decode knobs
      if (bson.nk) {
        for (x = 0; x < bson.nk.length; ++x) {
          obj.$fw("installKnob", baja.bson.decodeKnob(bson.nk[x]), cx);
        }
      }
      
      // Decode permissions
      if (bson.l && typeof bson.l.p === "string") {
        obj.$fw("setPermissions", bson.l.p);
      }
      
      // TODO: Handle Component Stub decoding here
      if (!stub) {
        obj.$bPropsLoaded = true;
      }
    }
              
    var facets;       
    if (parent) {
      try {
        cx.displayName = bajaDef(bson.dn, "");
        cx.display = bajaDef(bson.d, "");
      
        if (slot !== null) {
          parent.set({
            "slot": slot, 
            "value": obj,
            "cx": cx
          });
        }
        else if (parent.getType().isComponent()) {
          facets = baja.Facets.DEFAULT.decodeFromString(bajaDef(bson.x, ""));  
          flags = baja.Flags.decodeFromString(bajaDef(bson.f, "0"));         
          parent.add({
            "slot": bson.n, 
            "value": obj, 
            "flags": flags, 
            "facets": facets, 
            "cx": cx
          });
        }
      }
      finally {   
        cx.displayName = undefined;
        cx.display = undefined;
      }
    }

    // Decode kids
    if (bson.s) {
      for (i = 0; i < bson.s.length; ++i) {
        bsonDecodeValue(bson.s[i], cx, obj);
      }
    }

    return obj;    
  };

  bsonDecodeValue = baja.bson.decodeValue;
    
  ////////////////////////////////////////////////////////////////
  // BSON Encoding
  ////////////////////////////////////////////////////////////////  
  
  function encodeSlot(parObj, par, slot) {
    if (slot === null) {
      return;
    }
            
    // Encode Slot Flags (if they differ from the default    
    var value = null, // Property Value
        skipv = false;    // Skip value
    
    if (slot.isProperty()) {
      value = par.get(slot);    
      if (slot.isFrozen()) {
        if (value.equivalent(slot.getDefaultValue())) {
          skipv = true;
        }
      }
    }
    else {
      skipv = true;
    }
    
    var flags = par.getFlags(slot);
        
    // Skip frozen Slots that have default flags and value
    if (flags === slot.getDefaultFlags() && skipv) {
      return;
    }
    
    // Encode Slot Type
    var o = {};
    if (slot.isProperty()) {
      o.nm = "p";
    }
    else if (slot.isAction()) {
      o.nm = "a";
    }
    else if (slot.isTopic()) {
      o.nm = "t";
    }
    
    // Slot name
    o.n = slot.getName();
    
    // Slot Flags if necessary
    if (((!slot.isFrozen() && flags !== 0) || (flags !== slot.getDefaultFlags())) && par.getType().isComponent()) {
      o.flags = flags;
    }
    
    // Slot facets if necessary
    var fc = slot.getFacets();
    if (!slot.isFrozen() && fc.getKeys().length > 0) {
      o.x = fc.encodeToString();
    }
    
    if (value !== null && value.getType().isComponent()) {
      // Encode handle
      if (value.isMounted()) {
        o.h = value.getHandle();
      }
      
      // TODO: Categories and stub?
    }
    // TODO: Need to re-evalulate this method by going through BogEncoder.encodeSlot again
    
    if (!skipv && slot.isProperty()) {
      o.t = value.getType().getTypeSpec();
      encodeVal(o, value);
    }
    
    // Now we've encoded the Slot, add it to the Slots array
    if (!parObj.s) {
      parObj.s = [];
    }
    
    parObj.s.push(o);
  }
  
  function encodeVal(obj, val) {
  
    var cursor;
    
    if (val.getType().isSimple()) {
      // Encode Simple
      obj.v = val.encodeToString();
    }
    else {
      // Encode Complex
      cursor = val.getSlots();
     
      // Encode all of the Slots on the Complex
      while (cursor.next()) {
        encodeSlot(obj, val, cursor.get());
      }
    }
  }  
   
  function encode(name, val) {
    var o = { nm: "p" };
    
    // Encode name
    if (name !== null) {
      o.n = name;
    }
    
    if (val.getType().isComponent()) {
    
      // Encode handle
      if (val.isMounted()) {
        o.h = val.getHandle();
      }
      
      // TODO: Encode categories
      
      // TODO: Encode whether this Component is fully loaded or not???
    }
    
    o.t = val.getType().getTypeSpec();
    encodeVal(o, val);
    return o;
  } 
  
  /**
   * Return an encoded BSON value.
   *
   * @private
   *
   * @param val  the value to encode to BSON.
   * @returns encoded BSON value.
   */
  baja.bson.encodeValue = function (val) {
    return encode(null, val);
  };  
  
}(baja));
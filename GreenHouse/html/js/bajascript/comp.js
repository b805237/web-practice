//
// Copyright 2010, Tridium, Inc. All Rights Reserved.
//

/**
 * Core Component Architecture for BajaScript.
 *
 * @author Gareth Johnson
 * @version 1.0.0.0
 */

//JsLint options (see http://www.jslint.com )
/*jslint rhino: true, onevar: false, plusplus: true, white: true, undef: false, nomen: false, eqeqeq: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: false, indent: 2, vars: true, continue: true */

// Globals for JsLint to ignore 
/*global baja, syncVal, BaseBajaObj, syncProps*/ 
  
(function comp(baja, BaseBajaObj) {

  // Use ECMAScript 5 Strict Mode
  "use strict";
  
  var emptyArray = [], // An empty Array that should be treated as being immutable
      strictArg = baja.strictArg, // Create local for improved minification
      strictAllArgs = baja.strictAllArgs,
      bajaDef = baja.def,
      objectify = baja.objectify,
      Callback = baja.comm.Callback;
     
  ////////////////////////////////////////////////////////////////
  // Flags
  //////////////////////////////////////////////////////////////// 

  /**
   * @class Slot Flags.
   * <p>
   * Flags are boolean values which are stored as
   * a bitmask on each slot in a Complex.  Some
   * flags apply to all slot types, while some only
   * have meaning for certain slot types.
   * <p>
   * Flags should always be a Number. This Constructor should only be 
   * used to create new objects by Tridium developers.
   *
   * @name baja.Flags
   * @extends BaseBajaObj
   */
  baja.Flags = function (mask, symbol, fname) {
    this.$mask = mask;
    this.$symbol = symbol;
    this.$name = fname;
    
    // Cache this Flag via the symbol name in an Object for quick decoding
    baja.Flags.bySymbol[symbol] = this;
  }.$extend(BaseBajaObj);
  
  baja.Flags.bySymbol = {}; // Used to quickly decode Flag Strings
  
  /**
   * Return the mask for the Flags.
   *
   * @returns {Number}
   */
  baja.Flags.prototype.getMask = function () {
    return this.$mask;
  };
  
  /**
   * Return the symbol for the Flags.
   *
   * @returns {String}
   */
  baja.Flags.prototype.getSymbol = function () {
    return this.$symbol;
  };
  
  /**
   * Return the String representation of the Flags.
   *
   * @returns {String}
   */
  baja.Flags.prototype.toString = function () {
    return this.$name;
  };
  
  /**
   * Equality test.
   *
   * @param obj
   * @returns {Boolean}
   */
  baja.Flags.prototype.equals = function (obj) { 
    return obj instanceof baja.Flags && obj.getMask() === this.getMask();
  };
  
  /**
   * readonly flag (Number).
   */
  baja.Flags.READONLY             = 0x00000001;  // 'r'
  
  /**
   * transient flag (Number).
   */
  baja.Flags.TRANSIENT            = 0x00000002;  // 't'
  
  /**
   * hidden flag (Number).
   */
  baja.Flags.HIDDEN               = 0x00000004;  // 'h'
  
  /**
   * summary flag (Number).
   */
  baja.Flags.SUMMARY              = 0x00000008;  // 's'
  
  /**
   * async flag (Number).
   */
  baja.Flags.ASYNC                = 0x00000010;  // 'a'
  
  /**
   * noRun flag (Number).
   */
  baja.Flags.NO_RUN               = 0x00000020;  // 'n'
  
  /**
   * defaultOnClone flag (Number).
   */
  baja.Flags.DEFAULT_ON_CLONE     = 0x00000040;  // 'd'
  
  /**
   * confirmRequired flag (Number).
   */
  baja.Flags.CONFIRM_REQUIRED     = 0x00000080;  // 'c'
  
  /**
   * operator flag (Number).
   */
  baja.Flags.OPERATOR             = 0x00000100;  // 'o'
  
  /**
   * executeOnChange flag (Number).
   */
  baja.Flags.EXECUTE_ON_CHANGE    = 0x00000200;  // 'x'
  
  /**
   * fanIn flag (Number).
   */
  baja.Flags.FAN_IN               = 0x00000400;  // 'f'
  
  /**
   * noAudit flag (Number).
   */
  baja.Flags.NO_AUDIT             = 0x00000800;  // 'A'
  
  /**
   * composite flag (Number).
   */
  baja.Flags.COMPOSITE            = 0x00001000;  // 'p'
  
  /**
   * removeOnClone flag (Number).
   */
  baja.Flags.REMOVE_ON_CLONE      = 0x00002000;  // 'R'
  
  /**
   * metaData flag (Number).
   */
  baja.Flags.METADATA             = 0x00004000;  // 'm'
  
  /**
   * linkTarget flag (Number).
   */
  baja.Flags.LINK_TARGET          = 0x00008000;  // 'L'
  
  /**
   * nonCritical flag (Number).
   */
  baja.Flags.NON_CRITICAL         = 0x00010000;  // 'N'
  
  /**
   * userDefined1 flag (Number).
   */
  baja.Flags.USER_DEFINED_1       = 0x10000000;  // '1'
  
  /**
   * userDefined2 flag (Number).
   */
  baja.Flags.USER_DEFINED_2       = 0x20000000;  // '2'
  
  /**
   * userDefined3 flag (Number).
   */
  baja.Flags.USER_DEFINED_3       = 0x40000000;  // '3'
  
  /**
   * userDefined4 flag (Number).
   */
  baja.Flags.USER_DEFINED_4       = 0x80000000;  // '4'
  
  baja.Flags.flags = [new baja.Flags(baja.Flags.READONLY,           "r", "readonly"),
                      new baja.Flags(baja.Flags.TRANSIENT,          "t", "transient"),
                      new baja.Flags(baja.Flags.HIDDEN,             "h", "hidden"),
                      new baja.Flags(baja.Flags.SUMMARY,            "s", "summary"),
                      new baja.Flags(baja.Flags.ASYNC,              "a", "async"),
                      new baja.Flags(baja.Flags.NO_RUN,             "n", "noRun"),
                      new baja.Flags(baja.Flags.DEFAULT_ON_CLONE,   "d", "defaultOnClone"),
                      new baja.Flags(baja.Flags.CONFIRM_REQUIRED,   "c", "confirmRequired"),
                      new baja.Flags(baja.Flags.OPERATOR,           "o", "operator"),
                      new baja.Flags(baja.Flags.EXECUTE_ON_CHANGE,  "x", "executeOnChange"),
                      new baja.Flags(baja.Flags.FAN_IN,             "f", "fanIn"),
                      new baja.Flags(baja.Flags.NO_AUDIT,           "A", "noAudit"),
                      new baja.Flags(baja.Flags.COMPOSITE,          "p", "composite"),
                      new baja.Flags(baja.Flags.REMOVE_ON_CLONE,    "R", "removeOnClone"),
                      new baja.Flags(baja.Flags.METADATA,           "m", "metadata"),
                      new baja.Flags(baja.Flags.NON_CRITICAL,       "N", "nonCritical"),
                      new baja.Flags(baja.Flags.LINK_TARGET,        "L", "linkTarget"),
                      new baja.Flags(baja.Flags.USER_DEFINED_1,     "1", "userDefined1"),
                      new baja.Flags(baja.Flags.USER_DEFINED_2,     "2", "userDefined2"),
                      new baja.Flags(baja.Flags.USER_DEFINED_3,     "3", "userDefined3"),
                      new baja.Flags(baja.Flags.USER_DEFINED_4,     "4", "userDefined4")
                      ];
  
  /**
   * Encode Slot Flags to a String.
   *
   * @param {Number} flags  the flags to be encoded.
   *
   * @returns {String}
   */  
  baja.Flags.encodeToString = function (flags) {
    if (flags === 0) {
      return "";
    }
  
    strictArg(flags, Number);
    var s = "", i;
    for (i = 0; i < baja.Flags.flags.length; ++i) {
      if ((baja.Flags.flags[i].getMask() & flags) !== 0) {
        s += baja.Flags.flags[i].getSymbol();
      }
    }
    return s;
  };  
  
  /**
   * Decode Slot Flags from a String.
   *
   * @param {String} flagsStr  the Flags encoded as a String.
   * @returns {Number}
   */  
  baja.Flags.decodeFromString = function (flagsStr) {
    if (flagsStr === "0") {
      return 0;
    }
    
    strictArg(flagsStr, String);
    
    var decodedFlags = 0,
        symbols = flagsStr.split(''), 
        flags,
        i;
        
    for (i = 0; i < symbols.length; ++i) {
      // Find the flags via a Symbol look up
      flags = baja.Flags.bySymbol[symbols[i]];
      
      if (flags) {
        // Add the mask for the flag to the result
        decodedFlags |= flags.getMask();
      }
    }
    return decodedFlags;
  };
    
  ////////////////////////////////////////////////////////////////
  // Slots
  ////////////////////////////////////////////////////////////////  
  
  /**
   * @class Slot
   * <p>
   * A Niagara Complex is made up of Slots. A Slot can be a Property, Action or a Topic.
   * This is the base class for all Slots in BajaScript.
   * <p>
   * A new object should never be directly created with this Constructor.
   *
   * @name baja.Slot
   * @extends BaseBajaObj
   *
   * @param {String} slotName  the name of the Slot.
   * @param {String} displayName  the display name of the Slot.
   */
  baja.Slot = function (slotName, displayName) {
    this.$slotName = slotName || "";
    this.$displayName = displayName || "";
  }.$extend(BaseBajaObj);
  
  /**
   * Return the name of the Slot.
   *
   * @returns {String}
   */
  baja.Slot.prototype.getName = function () { 
    return this.$slotName; 
  };
  
  /**
   * Return a String representation of the Slot.
   *
   * @returns {String}
   */
  baja.Slot.prototype.toString = function () { 
    return this.getName(); 
  };
  
  /**
   * Return the display name of the Slot.
   * <p>
   * Please note, this method is intended for INTERNAL use by Tridium only. An
   * external developer should never call this method.
   *   
   * @private 
   * @returns {String}
   */
  baja.Slot.prototype.$getDisplayName = function () { 
    return this.$displayName; 
  };
  
  /**
   * Set the display name of the Slot.
   * <p>
   * Please note, this method is intended for INTERNAL use by Tridium only. An
   * external developer should never call this method.
   *   
   * @private 
   * @param {String} displayName
   */
  baja.Slot.prototype.$setDisplayName = function (displayName) { 
    this.$displayName = displayName;
  };
      
  /**
   * Is the Slot frozen?
   *
   * @returns {Boolean}
   */
  baja.Slot.prototype.isFrozen = function () {  
    return false; 
  };
  
  /**
   * Is the Slot a Property?
   *
   * @returns {Boolean}
   */
  baja.Slot.prototype.isProperty = function () {
    return false;
  };
  
  /**
   * Is the Slot a Topic?
   *
   * @returns {Boolean}
   */
  baja.Slot.prototype.isTopic = function () {
    return false;
  };
  
  /**
   * Is the Slot an Action?
   *
   * @returns {Boolean}
   */
  baja.Slot.prototype.isAction = function () {
    return false;
  };

  /**
   * @class Property Slot.
   * <p>
   * Property defines a Slot which is a storage location
   * for a variable in a Complex.
   * <p>
   * A new object should never be directly created with this Constructor. All Slots are 
   * created internally by BajaScript.
   *
   * @name baja.Property
   * @extends baja.Slot
   */  
  baja.Property = function (slotName, displayName) {  
    baja.Property.$super.apply(this, arguments);
  }.$extend(baja.Slot);
    
  /**
   * Is this Slot a Property?
   *
   * @returns {Boolean}
   */
  baja.Property.prototype.isProperty = function () {
    return true;
  };  

  /**
   * @class Dynamic Property Slot.
   * <p>
   * Property defines a Slot which is a storage location
   * for a variable in a Complex.
   * <p>
   * A new object should never be directly created with this Constructor. All Slots are 
   * created internally by BajaScript.
   *
   * @name baja.DynamicProperty
   * @extends baja.Property
   * @inner
   */
  var DynamicProperty = function (slotName, displayName, display, flags, facets, value) {  
    DynamicProperty.$super.apply(this, [slotName, displayName]);
    this.$display = display || "";
    this.$flags = flags || 0;
    this.$facets = facets || baja.Facets.DEFAULT;
    this.$val = bajaDef(value, null);
  }.$extend(baja.Property);
    
  /**   
   * Return the Property value.
   * <p>
   * Please note, this method is intended for INTERNAL use by Tridium only. An
   * external developer should never call this method. Access a Property's value
   * through the associated baja.Complex instead.
   *
   * @see baja.Complex#get
   *
   * @name baja.DynamicProperty#$getValue
   * @function
   * @private  
   *
   * @returns value
   */
  DynamicProperty.prototype.$getValue = function () {
    return this.$val;
  };

  /**   
   * Set the Property value.
   * <p>
   * Please note, this method is intended for INTERNAL use by Tridium only. An
   * external developer should never call this method.
   *
   * @name baja.DynamicProperty#$setValue
   * @function
   * @private  
   *
   * @param val value to be set.
   */
  DynamicProperty.prototype.$setValue = function (val) {
    this.$val = val;
  };   
    
  /**   
   * Return the Flags for the Property.
   *
   * @name baja.DynamicProperty#getFlags
   * @function
   * @see baja.Flags
   *
   * @returns {Number}
   */
  DynamicProperty.prototype.getFlags = function () { 
    return this.$flags; 
  };
  
  /**   
   * Set the Flags for the Property.
   * <p>
   * Please note, this method is intended for INTERNAL use by Tridium only. An
   * external developer should never call this method.
   *
   * @name baja.DynamicProperty#$setFlags
   * @function
   * @private
   * @see baja.Flags
   *
   * @param {Number} flags
   */
  DynamicProperty.prototype.$setFlags = function (flags) { 
    this.$flags = flags; 
  };
  
  /**
   * Return the Facets for the Property.
   *
   * @name baja.DynamicProperty#getFacets
   * @function
   * @see baja.Facets
   *
   * @returns the Slot Facets
   */
  DynamicProperty.prototype.getFacets = function () {
    return this.$facets; 
  };
  
  /**   
   * Set the Facets for the Property.
   * <p>
   * Please note, this method is intended for INTERNAL use by Tridium only. An
   * external developer should never call this method.
   *
   * @name baja.DynamicProperty#$setFacets
   * @function
   * @private
   * @see baja.Facets
   *
   * @param {baja.Facets} facets
   */
  DynamicProperty.prototype.$setFacets = function (facets) {
    this.$facets = facets; 
  };
  
  /**
   * Return the default flags for the Property.
   *
   * @name baja.DynamicProperty#getDefaultFlags
   * @function
   *
   * @returns {Number}
   */
  DynamicProperty.prototype.getDefaultFlags = function () {
    return this.getFlags();
  };
  
  /**
   * Return the default value for the Property.
   *
   * @name baja.DynamicProperty#getDefaultValue
   * @function
   *
   * @returns the default value for the Property.
   */
  DynamicProperty.prototype.getDefaultValue = function () {   
    return this.$val;
  }; 
  
  /**
   * Return the Type for this Property.
   *
   * @name baja.DynamicProperty#getType
   * @function
   *
   * @returns the Type for the Property.
   */
  DynamicProperty.prototype.getType = function () { 
    return this.$val.getType(); 
  };
    
  /**
   * Return the display String for this Property.
   * <p>
   * Please note, this method is intended for INTERNAL use by Tridium only. An
   * external developer should never call this method.
   *
   * @name baja.DynamicProperty#$getDisplay
   * @function
   * @private
   *
   * @returns {String}
   */
  DynamicProperty.prototype.$getDisplay = function () {
    return this.$display;
  };
  
  /**
   * Set the display for this Property.
   * <p>
   * Please note, this method is intended for INTERNAL use by Tridium only. An
   * external developer should never call this method.
   *
   * @name baja.DynamicProperty#$setDisplay
   * @function
   * @private
   *
   * @param {String} display the display String.
   */
  DynamicProperty.prototype.$setDisplay = function (display) {
    this.$display = display;
  };

  /**
   * @class Action Slot.
   * <p>
   * Action is a Slot that defines a behavior which can
   * be invoked on a Component.
   * <p>
   * A new object should never be directly created with this Constructor. All Slots are 
   * created internally by BajaScript.
   *
   * @name baja.Action
   * @extends baja.Slot
   */
  baja.Action = function (slotName, displayName) {
    baja.Action.$super.call(this, slotName, displayName);
  }.$extend(baja.Slot);
     
  /**
   * Is the Slot an Action?
   *
   * @returns {Boolean}
   */
  baja.Action.prototype.isAction = function () {
    return true;
  };
  
  /**
   * @class Topic Slot.
   * <p>
   * Topic defines a Slot which indicates an event that
   * is fired on a Component.
   * <p>
   * A new object should never be directly created with this Constructor. All Slots are 
   * created internally by BajaScript.
   *
   * @name baja.Topic
   * @extends baja.Slot
   */
  baja.Topic = function (slotName, displayName) {
    baja.Topic.$super.call(this, slotName, displayName);
  }.$extend(baja.Slot);
  
  /** 
   * Is the Slot a Topic?
   *
   * @returns {Boolean}
   */   
  baja.Topic.prototype.isTopic = function () {
    return true;
  };
        
  /**
   * @class PropertyAction Slot.
   * <p>
   * A Property that is also an Action. Typically this is used for dynamic Actions.
   * <p>
   * A new object should never be directly created with this Constructor. All Slots are 
   * created internally by BajaScript.
   * 
   * @name baja.PropertyAction
   * @extends baja.DynamicProperty
   */
  var PropertyAction = function (slotName, displayName, display, flags, facets, value) {
    PropertyAction.$super.apply(this, arguments);
  }.$extend(DynamicProperty);
   
  /**
   * Is the Slot an Action?
   *
   * @name baja.PropertyAction#isAction
   * @function
   *
   * @returns {Boolean}
   */   
  PropertyAction.prototype.isAction = function () {
    return true;
  };
  
  /**
   * Return the Action's parameter Type.
   *
   * @name baja.PropertyAction#getParamType
   * @function
   *
   * @returns {Type} the parameter type (or null if the Action doesn't have a parameter).
   */
  PropertyAction.prototype.getParamType = function () {
    return this.$val.getParamType();
  };
  
  /**
   * Return the Action's parameter default value.
   *
   * @name baja.PropertyAction#getParamDefault
   * @function
   *
   * @returns the parameter default value (or null if the Action doesn't have a parameter).
   */
  PropertyAction.prototype.getParamDefault = function () {
    return this.$val.getParamDefault();
  };
  
  /**
   * Return the Action's return Type.
   *
   * @name baja.PropertyAction#getReturnType
   * @function
   *
   * @returns {Type} the return type (or null if the Action doesn't have a return Type).
   */
  PropertyAction.prototype.getReturnType = function () {
    return this.$val.getReturnType();
  }; 
  
  /**
   * @class PropertyTopic Slot.
   * <p>
   * A Property that is also a Topic. Typically this is used for dynamic Topics.
   * <p>
   * A new object should never be directly created with this Constructor. All Slots are 
   * created internally by BajaScript.
   *
   * @name baja.PropertyTopic
   * @extends baja.DynamicProperty
   */
  var PropertyTopic = function (slotName, displayName, display, flags, facets, value) {
    PropertyTopic.$super.apply(this, arguments);
  }.$extend(DynamicProperty);
  
  /**
   * Is the Property a Topic?
   *
   * @name baja.PropertyTopic#isTopic
   * @function
   *
   * @returns {Boolean}
   */
  PropertyTopic.prototype.isTopic = function () {
    return true;
  };
  
  /**
   * Return the Topic's event Type.
   *
   * @name baja.PropertyTopic#getEventType
   * @function
   *
   * @returns {Type} the event Type (or null if the Topic has not event Type).
   */
  PropertyTopic.prototype.getEventType = function () {
    return this.$val.getEventType();
  }; 

  ////////////////////////////////////////////////////////////////
  // Slot Cursor
  //////////////////////////////////////////////////////////////// 
  
  /** 
   * @class A Cursor used for Slot iteration.
   *
   * @name baja.SlotCursor
   * @extends baja.FilterCursor
   */
  var SlotCursor = function () {
    SlotCursor.$super.apply(this, arguments);
  }.$extend(baja.FilterCursor);
  
  /**
   * If the Slot is a Property, return its value (otherwise return null).
   *
   * @name baja.SlotCursor#getValue
   * @function
   *
   * @returns a Property value.
   */
  SlotCursor.prototype.getValue = function () {
    var slot = this.get();
    return slot !== null && slot.isProperty() ? this.$context.get(slot) : null;
  };
  
  /**
   * If the Slot is a Property, return its display String (otherwise return null).
   *
   * @name baja.SlotCursor#getDisplay
   * @function
   *
   * @returns {String} display String.
   */
  SlotCursor.prototype.getDisplay = function () {
    var slot = this.get();
    return slot !== null && slot.isProperty() ? this.$context.getDisplay(slot) : null;
  };
  
  /**
   * Return the first Property value in the cursor (regardless of iterative state).
   *
   * @name baja.SlotCursor#firstValue
   * @function
   *
   * @returns first Property value found in the Cursor (or null if nothing found).
   */
  SlotCursor.prototype.firstValue = function () {
    var slot = this.first();
    return slot !== null && slot.isProperty() ? this.$context.get(slot) : null;
  };
  
  /**
   * Return the first Property display String in the cursor (regardless of iterative state).
   *
   * @name baja.SlotCursor#firstDisplay
   * @function
   *
   * @returns first Property display String found in the Cursor (or null if nothing found).
   */
  SlotCursor.prototype.firstDisplay = function () {
    var slot = this.first();
    return slot !== null && slot.isProperty() ? this.$context.getDisplay(slot) : null;
  };
  
  /**
   * Return the last Property value in the cursor (regardless of iterative state).
   *
   * @name baja.SlotCursor#lastValue
   * @function
   *
   * @returns first Property value found in the Cursor (or null if nothing found).
   */
  SlotCursor.prototype.lastValue = function () {
    var slot = this.last();
    return slot !== null && slot.isProperty() ? this.$context.get(slot) : null;
  };
  
  /**
   * Return the last Property display String in the cursor (regardless of iterative state).
   *
   * @name baja.SlotCursor#lastDisplay
   * @function
   *
   * @returns first Property display String found in the Cursor (or null if nothing found).
   */
  SlotCursor.prototype.lastDisplay = function () {
    var slot = this.last();
    return slot !== null && slot.isProperty() ? this.$context.getDisplay(slot) : null;
  };
  
  /**
   * Iterate through the Cursor and call 'each' on every Property Slot and get its value.
   * <p>
   * When the function is called, 'this' refers to the associated Complex and the argument
   * is the value of the Property.
   * 
   * @name baja.SlotCursor#eachValue
   * @function
   *
   * @param {Function} func function called on every iteration with the argument being a Property's value.
   */
  SlotCursor.prototype.eachValue = function (func) {
    return this.each(function (slot, i) {
      if (slot.isProperty()) {
        return func.call(this, this.get(slot), i);
      }
      
      // Return false so nothing stops iterating
      return false;
    });
  };
  
  /**
   * Iterate through the Cursor and call 'each' on every Property Slot and get its display String.
   * <p>
   * When the function is called, 'this' refers to the associated Complex and the argument
   * is the display String.
   * 
   * @name baja.SlotCursor#eachDisplay
   * @function
   *
   * @param {Function} func function called on every iteration with the argument being a Property's display String
   */
  SlotCursor.prototype.eachDisplay = function (func) {
    return this.each(function (slot, i) {
      if (slot.isProperty()) {
        return func.call(this, this.getDisplay(slot), i);
      }
      
      // Return false so nothing stops iterating
      return false;
    });
  };
  
  /**
   * Return an array of Property values (regardless of iterative state).
   *
   * @name baja.SlotCursor#toValueArray
   * @function
   *
   * @returns {Number}
   */  
  SlotCursor.prototype.toValueArray = function () {
    var slots = this.toArray(),
        values = [],
        i;
    
    for (i = 0; i < slots.length; ++i) {
      if (slots[i].isProperty()) {
        values.push(this.$context.get(slots[i]));
      }
    }
            
    return values;
  };
  
  /**
   * Return an array of Property display Strings (regardless of iterative state).
   *
   * @name baja.SlotCursor#toDisplayArray
   * @function
   *
   * @returns {Number}
   */  
  SlotCursor.prototype.toDisplayArray = function () {
    var slots = this.toArray(),
        displays = [],
        i;
    
    for (i = 0; i < slots.length; ++i) {
      if (slots[i].isProperty()) {
        displays.push(this.$context.getDisplay(slots[i]));
      }
    }
            
    return displays;
  };
  
  /**
   * Return an Object Map of Property names with their corresponding values (regardless of iterative state).
   *
   * @name baja.SlotCursor#toValueMap
   * @function
   *
   * @returns {Object}
   */  
  SlotCursor.prototype.toValueMap = function () {
    var slots = this.toArray(),
        map = {},
        s,
        i;
    
    for (i = 0; i < slots.length; ++i) {
      s = slots[i];
      if (s.isProperty()) {
        map[s.getName()] = this.$context.get(s);
      }
    }
            
    return map;
  };
  
  /**
   * Return an Object Map of Property names with their corresponding display Strings (regardless of iterative state).
   *
   * @name baja.SlotCursor#toDisplayMap
   * @function
   *   
   * @returns {Object}
   */  
  SlotCursor.prototype.toDisplayMap = function () {
    var slots = this.toArray(),
        map = {},
        s,
        i;
    
    for (i = 0; i < slots.length; ++i) {
      s = slots[i];
      if (s.isProperty()) {
        map[s.getName()] = this.$context.getDisplay(s);
      }
    }
            
    return map;
  };
  
  function slotCursorFrozen(slot) {
    return slot.isFrozen();
  }
   
  /**
   * Adds a filter to the Cursor for frozen Slots.
   * 
   * @name baja.SlotCursor#frozen
   * @function
   *
   * @returns {baja.SlotCursor} itself.
   */
  SlotCursor.prototype.frozen = function () {
    this.filter(slotCursorFrozen);
    return this;
  };
  
  function slotCursorDynamic(slot) {
    return !slot.isFrozen();
  }
  
  /**
   * Adds a filter to the Cursor for dynamic Slots.
   * 
   * @name baja.SlotCursor#dynamic
   * @function
   *
   * @returns {baja.SlotCursor} itself.
   */
  SlotCursor.prototype.dynamic = function () {
    this.filter(slotCursorDynamic);
    return this;
  };
  
  function slotCursorProperties(slot) {
    return slot.isProperty();
  }
  
  /**
   * Adds a filter to the Cursor for Properties.
   * 
   * @name baja.SlotCursor#properties
   * @function
   *
   * @returns {baja.SlotCursor} itself.
   */
  SlotCursor.prototype.properties = function () {
    this.filter(slotCursorProperties);
    return this;
  };
  
  function slotCursorActions(slot) {
    return slot.isAction();
  }
  
  /**
   * Adds a filter to the Cursor for Actions.
   *
   * @name baja.SlotCursor#actions
   * @function
   * 
   * @returns {baja.SlotCursor} itself.
   */
  SlotCursor.prototype.actions = function () {
    this.filter(slotCursorActions);
    return this;
  };
  
  function slotCursorTopics(slot) {
    return slot.isTopic();
  }
  
  /**
   * Adds a filter to the Cursor for Topics.
   * 
   * @name baja.SlotCursor#topics
   * @function
   *
   * @returns {baja.SlotCursor} itself.
   */
  SlotCursor.prototype.topics = function () {
    this.filter(slotCursorTopics);
    return this;
  };
    
  /**
   * Adds a filter for Property values that match the TypeSpec via {@link Type#is}.
   * <p>
   * This method can take a variable number of TypeSpecs. If a variable number of TypeSpecs
   * are specified then a slot will be filtered through if any of the TypeSpecs match (logical OR).
   * 
   * @name baja.SlotCursor#is
   * @function
   * @see Type#is
   *
   * @param {Type|String} typeSpec the TypeSpec to test against.
   *
   * @returns {baja.SlotCursor} itself.
   */
  SlotCursor.prototype.is = function (typeSpec) {
    typeSpec = Array.prototype.slice.call(arguments);
    
    this.filter(function (slot) {
      if (slot.isProperty()) {
        var t = slot.getType(),
            i;
        
        for (i = 0; i < typeSpec.length; ++i) {
          if (t.is(typeSpec[i])) {
            return true;
          }
        }
      }
      return false;
    });
    
    return this;
  };
  
  function slotCursorIsValue(slot) {
    return slot.isProperty() && slot.getType().isValue();
  }
  
  /**
   * Adds a filter for Property values that are of Type baja:Value {@link Type#isValue}.
   * 
   * @name baja.SlotCursor#isValue
   * @function
   * @see Type#isValue
   *
   * @returns {baja.SlotCursor} itself.
   */
  SlotCursor.prototype.isValue = function () {
    this.filter(slotCursorIsValue);
    return this;
  };
  
  function slotCursorIsSimple(slot) {
    return slot.isProperty() && slot.getType().isSimple();
  }
  
  /**
   * Adds a filter for Property values that are of Type baja:Simple {@link Type#isSimple}.
   * 
   * @name baja.SlotCursor#isSimple
   * @function
   * @see Type#isSimple
   *
   * @returns {baja.SlotCursor} itself.
   */
  SlotCursor.prototype.isSimple = function () {
    this.filter(slotCursorIsSimple);
    return this;
  };
  
  function slotCursorIsNumber(slot) {
    return slot.isProperty() && slot.getType().isNumber();
  }
  
  /**
   * Adds a filter for Property values that are of Type baja:Number {@link Type#isNumber}.
   * 
   * @name baja.SlotCursor#isNumber
   * @function
   * @see Type#isNumber
   *
   * @returns {baja.SlotCursor} itself.
   */
  SlotCursor.prototype.isNumber = function () {
    this.filter(slotCursorIsNumber);
    return this;
  };
  
  function slotCursorIsComplex(slot) {
    return slot.isProperty() && slot.getType().isComplex();
  }
  
  /**
   * Adds a filter for Property values that are of Type baja:Complex {@link Type#isComplex}.
   * 
   * @name baja.SlotCursor#isComplex
   * @function
   * @see Type#isComplex
   *
   * @returns {baja.SlotCursor} itself.
   */
  SlotCursor.prototype.isComplex = function () {
    this.filter(slotCursorIsComplex);
    return this;
  };
  
  function slotCursorIsComponent(slot) {
    return slot.isProperty() && slot.getType().isComponent();
  }
  
  /**
   * Adds a filter for Property values that are of Type baja:Component {@link Type#isComponent}.
   * 
   * @name baja.SlotCursor#isComponent
   * @function
   * @see Type#isComponent
   *
   * @returns {baja.SlotCursor} itself.
   */
  SlotCursor.prototype.isComponent = function () {
    this.filter(slotCursorIsComponent);
    return this;
  };
  
  function slotCursorIsStruct(slot) {
    return slot.isProperty() && slot.getType().isStruct();
  }
  
  /**
   * Adds a filter for Property values that are of Type baja:Struct {@link Type#isStruct}.
   * 
   * @name baja.SlotCursor#isStruct
   * @function
   * @see Type#isStruct
   *
   * @returns {baja.SlotCursor} itself.
   */
  SlotCursor.prototype.isStruct = function () {
    this.filter(slotCursorIsStruct);
    return this;
  };
  
  /**
   * Adds a filter for Properties whose Type matches via equals. 
   * <p>
   * This method can take a variable number of TypeSpecs. If a variable number of TypeSpecs
   * are specified then a slot will be filtered through if any of the TypeSpecs match (logical OR).
   *
   * @name baja.SlotCursor#equalType
   * @function
   *
   * @param {Type|String|Array} typeSpec the TypeSpec to test against. 
   *
   * @returns {baja.SlotCursor} itself.
   */
  SlotCursor.prototype.equalType = function (typeSpec) {
    typeSpec = Array.prototype.slice.call(arguments);
    
    // Ensure we have the Types we're interested in
    var i;
    for (i = 0; i < typeSpec.length; ++i) {
      typeSpec[i] = typeof typeSpec[i] === "string" ? baja.lt(typeSpec[i]) : typeSpec[i];
    }
  
    this.filter(function (slot) {
      if (slot.isProperty()) {
        var t = slot.getType(),
            i;
        
        for (i = 0; i < typeSpec.length; ++i) {
          if (t.equals(typeSpec[i])) {
            return true;
          }
        }
      }
      return false;
    });
    
    return this;
  };
  
  /**
   * Adds a filter for Property values that match via equals. 
   * <p>
   * This method can take a variable number of values. If a variable number of values
   * are specified then a slot will be filtered through if any of the values match (logical OR).
   *
   * @name baja.SlotCursor#equalValue
   * @function
   *
   * @param value the value to be used for equals.
   *
   * @returns {baja.SlotCursor} itself.
   */
  SlotCursor.prototype.equalValue = function (value) {
    value = Array.prototype.slice.call(arguments);
    
    this.filter(function (slot) {
      if (slot.isProperty()) {
        var v = this.get(slot),
            i;
        
        for (i = 0; i < value.length; ++i) {
          if (v.equals(value[i])) {
            return true;
          }
        }
      }
      return false;
    });
    
    return this;
  };
  
  /**
   * Adds a filter for Property values that match via equivalent. 
   * <p>
   * This method can take a variable number of values. If a variable number of values
   * are specified then a slot will be filtered through if any of the values match (logical OR).
   *
   * @name baja.SlotCursor#equivalent
   * @function
   *
   * @param value the value to be used for equivalent.
   *
   * @returns {baja.SlotCursor} itself.
   */
  SlotCursor.prototype.equivalent = function (value) {
    value = Array.prototype.slice.call(arguments); 
    
    this.filter(function (slot) {
      if (slot.isProperty()) {
        var v = this.get(slot),
            i;
        
        for (i = 0; i < value.length; ++i) {
          if (v.equivalent(value[i])) {
            return true;
          }
        }
      }
      return false;
    });
    
    return this;
  };
  
  /**
   * Adds a filter for Slots that match the given Slot name.
   *
   * @name baja.SlotCursor#slotName
   * @function
   *
   * @param {String|RegEx} slotName a String or Regular Expression for matching Slots via name.
   *
   * @returns {baja.SlotCursor} itself.
   */
  SlotCursor.prototype.slotName = function (sName) {
    if (typeof sName === "string") {
      // String Comparison
      this.filter(function (slot) {
        return slot.getName().equals(sName.toString());
      });
    }
    else {
      // RegEx test
      this.filter(function (slot) {
        return sName.test(slot.getName());
      });
    }
    return this;
  };
    
  /**
   * Adds a filter for Slots that match the requested Slot Flags.
   *
   * @name baja.SlotCursor#flags
   * @function
   *
   * @see baja.Flags
   *
   * @param {Number} flgs the Slot flags to be tested for.
   *
   * @returns {baja.SlotCursor} itself.
   */
  SlotCursor.prototype.flags = function (flgs) {
    this.filter(function (slot) {
      return (this.getFlags(slot) & flgs);
    });
    return this;
  };
          
  ////////////////////////////////////////////////////////////////
  // Baja Components
  //////////////////////////////////////////////////////////////// 
  
  // Internal Component Event flags
  var CHANGED        = 0,
      ADDED          = 1,
      REMOVED        = 2,
      RENAMED        = 3,
      REORDERED      = 4,
      PARENTED       = 5,
      UNPARENTED     = 6,
      ACTION_INVOKED = 7,
      TOPIC_FIRED    = 8,
      FLAGS_CHANGED  = 9,
      FACETS_CHANGED = 10,
      RECATEGORIZED  = 11,
      KNOB_ADDED     = 12,
      KNOB_REMOVED   = 13,
      SUBSCRIBED     = 14,
      UNSUBSCRIBED   = 15;
  
  function applyObjToComplex(clx, obj) {
    var slotName,
        value,
        isComponent = clx.getType().isComponent();
    
    for (slotName in obj) {
      if (obj.hasOwnProperty(slotName)) {
        value = obj[slotName];
        if (clx.has(slotName)) {
          
          // If value is a Object Literal then recursively apply it
          if (value && value.constructor === Object) {
            var v = clx.get(slotName);
            applyObjToComplex(v, 
                              value);
          }
          else {
            clx.set({
              slot: slotName,
              value: value
            });
          }
        }
        else if (isComponent) {
          
          // If value is an Object Literal then recursively apply it 
          if (value && value.constructor === Object) {
            var oldValue = value;
            value = new baja.Component();
            applyObjToComplex(value, 
                              oldValue);
          }
          
          clx.add({
            slot: slotName,
            value: value
          });
        }
      }
    }
  }
  
  /**
   * @class Complex
   * <p>
   * Complex is the Value which is defined by one or more
   * property slots. Complex is never used directly, rather
   * it is the base class for Struct and Component.
   * <p>
   * Since Complex relates to a abstract Type, this Constructor should
   * never be directly used to create a new object.
   *
   * @see baja.Struct
   * @see baja.Component
   * 
   * @name baja.Complex
   * @extends baja.Value
   */
  baja.Complex = function () {
    baja.Complex.$super.apply(this, arguments);
    this.$map = new baja.OrderedMap();
    this.$parent = null;
    this.$propInParent = null; 
  }.$extend(baja.Value);
  
  /**
   * Called once the frozen Slots have been loaded onto the Complex.
   * 
   * @private
   */
  baja.Complex.prototype.contractCommitted = function (arg) {
    // If this is a complex and there was an argument then attempt
    // to set (of add if a Component) Properties...
    if (arg && arg.constructor === Object) {
      applyObjToComplex(this, arg);
    }
  };
  
  /**
   * Return the name of the Component.
   * <p>
   * The name is taken from the parent Component's Property for this Component instance.
   * 
   * @returns {String} name (null if not mounted).
   */
  baja.Complex.prototype.getName = function () { 
    return this.$propInParent === null ? null : this.$propInParent.getName();
  };
  
  /**
   * Return a display name.
   * <p>
   * If a Slot is defined as an argument, the display name for the slot will be returned. 
   * If not Slot is defined, the display name of the Complex will be returned.
   *
   * @param {baja.Slot|String} [slot]  the Slot or Slot name.
   *
   * @returns {String} the display name (or null if none available).
   */
  baja.Complex.prototype.getDisplayName = function (slot) {
    var s,
        nameMap,
        entry;
  
    // If no Slot defined then get the display name of the Complex
    if (slot === undefined) {
      return this.getPropertyInParent() === null ? null : this.getParent().getDisplayName(this.getPropertyInParent());
    }
  
    slot = this.getSlot(slot);
    
    // Bail if this slot doesn't exist
    if (slot === null) {
      return null;
    }
    
    // See if a BNameMap is being used.
    nameMap = this.get("displayNames");
   
    if (nameMap && nameMap.getType().getTypeSpec().equals("baja:NameMap")) {
      entry = nameMap.get(slot.getName());
      if (entry) {
        // If we've found an entry then used this for the Slot's display name
        return entry.format();
      }
    }
    
    // This should be ok but just double check to ensure we have a display string
    s = slot.$getDisplayName();
    if (typeof s !== "string") {
      s = "";
    }
    
    // If there is no display name then default to unescaping the slot name
    if (s === "") {
      s = baja.SlotPath.unescape(slot.getName());
    }
    
    return s;
  };
  
  /**
   * Return a display string.
   * <p>
   * If a Slot argument is defined, the display name for the Slot will be returned. 
   * If a Slot argument is not defined, the display name for the Complex will be returned.
   * <p>
   * Note that when an instance of a Complex is created, auto-generated accessors are
   * created to make accessing a frozen Slot's display string convenient...
   * <pre>
   *   // myPoint has a Property named out...
   *   baja.outln("The display string of the out Property: " + myPoint.getOutDisplay());
   * </pre>
   * The auto-generated accessor is in the format of <code>'get(first letter is captialized)SlotNameDisplay()'</code>
   * <p>
   * If the name of an automatically generated method is already used in the Complex, a number will be added to the function name.
   *
   * @param {baja.Slot|String} [slot]  the Slot or Slot name.
   *
   * @returns {String} display (or null if none available).
   */
  baja.Complex.prototype.getDisplay = function (slot) {
    if (slot === undefined) {
      return this.getPropertyInParent() === null ? null : this.getPropertyInParent().$getDisplay();
    }
    slot = this.getSlot(slot);
    return slot === null ? null : slot.$getDisplay();  
  };
      
  /**
   * Return the String representation.
   *
   * @returns {String}
   */
  baja.Complex.prototype.toString = function () {
    var str = this.getDisplay(); 
    return typeof str === "string" ? str : this.getType().toString();
  };
  
  /**
   * Return the parent.
   *
   * @returns parent
   */
  baja.Complex.prototype.getParent = function () {
    return this.$parent;
  };
  
  /**
   * Return the Property in the parent.
   *
   * @returns {baja.Property} the Property in the parent (null if not mounted).
   */
  baja.Complex.prototype.getPropertyInParent = function () {
    return this.$propInParent;
  };
  
  /**
   * Return the Slot.
   * <p>
   * This is useful method to ensure you have the Slot instance instead of the Slot name String.
   * If a Slot is passed in, it will simply be checked and returned.
   *
   * @param {baja.Slot|String} slot the Slot or Slot name.
   * @returns {baja.Slot} the Slot for the Component (or null if the Slot doesn't exist).
   */
  baja.Complex.prototype.getSlot = function (slot) {
    if (typeof slot === "string") {
      return this.$map.get(slot);
    }
    else {
      strictArg(slot, baja.Slot);
      return this.$map.get(slot.getName());
    }
  };
      
  /**
   * Return a Cursor for accessing a Complex's Slots.
   * <p>
   * Please see {@link baja.SlotCursor} for useful builder methods. For example...
   * <pre>
   *   // A Cursor for Dynamic Properties
   *   var frozenPropCursor = myComp.getSlots().dynamic().properties();
   *
   *   // A Cursor for Frozen Actions
   *   var frozenPropCursor = myComp.getSlots().frozen().actions();
   *
   *   // An Array of Control Points
   *   var valArray = myComp.getSlots().properties().is("control:ControlPoint").toValueArray();
   *
   *   // An Array of Action Slots
   *   var actionArray = myComp.getSlots().actions().toArray();
   *
   *   // An Object Map of slot name/value pairs
   *   var map = myComp.getSlots().properties().toMap();
   * 
   *   // The very first dynamic Property
   *   var firstProp = myComp.getSlots().dynamic().properties().first();
   *
   *   // The very last dynamic Property
   *   var lastProp = myComp.getSlots().dynamic().properties().last();
   *
   *   // The very first dynamic Property value
   *   var firstVal = myComp.getSlots().dynamic().properties().firstValue();
   *
   *   // The very first dynamic Property value
   *   var lastVal = myComp.getSlots().dynamic().properties().lastValue();
   *
   *   // All the Slots that start with the name 'foo'
   *   var slotNameCursor = myComp.getSlots().slotName(/^foo/);
   *
   *   // Use a custom Cursor to find all of the Slots that have a particular facets key/value
   *   var custom = myComp.getSlots(function (slot) {
   *      return slot.isProperty() && (this.getFacets(slot).get("myKey", "def") === "foo");
   *   });
   * 
   *   // Same as above
   *   var custom2 = myComp.getSlots().filter(function (slot) {
   *      return slot.isProperty() && (this.getFacets(slot).get("myKey", "def") === "foo");
   *   });
   *   
   *   // All Slots marked summary on the Component
   *   var summarySlotCursor = myComp.getSlots().flags(baja.Flags.SUMMARY);
   *
   *   // Call function for each Property that's a ControlPoint
   *   myComp.getSlots().is("control:ControlPoint").each(function (slot) {
   *     baja.outln("The Nav ORD for the ControlPoint: " + this.get(slot).getNavOrd();
   *   });
   * </pre>
   *
   * @param {Function} [filter]  function to filter out the Slots we're not interested in.
   *                             The filter function will be passed each Slot to see if it should be
   *                             be included. The function must return false to filter out a value and true
   *                             to keep it.
   *
   * @returns {SlotCursor} a Cursor for iterating through the Complex's Slots.
   */
  baja.Complex.prototype.getSlots = function (filter) {
    var cursor = this.$map.getCursor(this, SlotCursor);
    if (filter) {
      cursor.filter(filter);
    }
    return cursor;
  };
  
  /**
   * Return Flags for a slot or for the Complex's parent Property.
   * <p>
   * If no arguments are provided and the Complex has a parent, the 
   * flags for the parent's Property will be returned. 
   *
   * @see baja.Flags
   *
   * @param {baja.Slot|String} [slot] Slot or Slot name.
   * @returns {Number} the flags for the Slot or the parent's Property flags.
   */
  baja.Complex.prototype.getFlags = function (slot) { 
    // If no arguments are specified then attempt to get parent properly slot Flags
    if (arguments.length === 0) {
      if (this.$parent !== null && this.$propInParent !== null) {
        return this.$parent.getFlags(this.$propInParent);
      }
      else {
        throw new Error("Complex has no parent");
      }
    }
  
    slot = this.getSlot(slot); 
    if (slot === null) {
      throw new Error("Slot doesn't exist: " + slot);
    }
    return slot.getFlags();
  };
    
  /**
   * Return a Property's value.
   * <p>
   * Note that when an instance of a Complex is created, auto-generated accessors are
   * created to make accessing a frozen Property's value convenient...
   * <pre>
   *   // myPoint has a Property named out...
   *   var val = myPoint.getOut();
   * </pre>
   * The auto-generated accessor is in the format of <code>'get(first letter is captialized)SlotName()'</code>.
   * <p>
   * If the name of an automatically generated method is already used in the Complex, a number will be added to the function name.
   *
   * @param {baja.Property|String} prop the Property or Property name.
   * @returns the value for the Property (null if the Property doesn't exist).
   */
  baja.Complex.prototype.get = function (prop) {
    prop = this.getSlot(prop);
    if (prop === null) {
      return null;
    }
    return prop.$getValue();
  };
  
  /**
   * Return true if the Slot exists.
   *
   * @param {baja.Property|String} prop the Property or Property name
   * @returns {Boolean}
   */
  baja.Complex.prototype.has = function (prop) {
    return this.getSlot(prop) !== null;
  };
  
  /**
   * Return the result of 'valueOf' on the specified Property's value.
   * If valueOf is not available then the Property's value is returned.
   *
   * @see baja.Complex#get
   *
   * @param {baja.Property|String} prop the Property or Property name.
   * @returns the valueOf for the Property's value or the Property's value
   *         (null if the Property doesn't exist).
   */
  baja.Complex.prototype.getValueOf = function (prop) {
    var v = this.get(prop);
    if (v !== null && typeof v.valueOf === "function") {
      return v.valueOf();
    }
    else {
      return v;
    }
  };
  
  function syncStruct(fromVal, toVal) {
    fromVal.getSlots().properties().each(function (fromProp) {
      var toProp = toVal.getSlot(fromProp.getName());
      
      // Sync value display and slot display name
      fromProp.$setDisplay(toProp.$getDisplay());
      fromProp.$setDisplayName(toProp.$getDisplayName());
      
      if (fromProp.getType().isStruct()) {
        // If another struct then sync appropriately
        syncStruct(fromProp.$getValue(), toProp.$getValue());
      }  
      else {
        // If a simple then directly set the value
        fromProp.$setValue(toProp.$getValue());
      }      
    });
  }
        
  /**
   * Set a Property's value.
   * <p>
   * If the Complex is mounted, this will <strong>asynchronously</strong> set the Properties
   * value on the Server. 
   * <p> 
   * An Object Literal is used to specify the method's arguments...
   * <pre>
   *   myObj.set({
   *     slot: "outsideAirTemp",
   *     value: 23.5,
   *     ok: function () {
   *       // Called once value has been set on the Server (optional)
   *     },
   *     fail: function (err) {
   *       // Called if the value fails to set on the Server (optional)
   *     },
   *     batch // if defined, any network calls will be batched into this object (optional)
   *   });
   * </pre>
   * <p>
   * Note that when an instance of a Complex is created, auto-generated setters are
   * created to make setting a frozen Property's value convenient...
   * <pre>
   *   // myPoint has a Property named outsideAirTemp...
   *   myObj.setOutsideAirTemp(23.5);
   *   
   *   // ... or via an Object Literal if more arguments are needed...
   *   
   *   myObj.setOutsideAirTemp({
   *     value: 23.5,
   *     ok: function () {
   *       // Called once value has been set on the Server (optional)
   *     }
   *   });
   * </pre>
   * The auto-generated setter is in the format of <code>'set(first letter is captialized)SlotName(...)'</code>.
   * <p>
   * If the name of an automatically generated method is already used in the Complex, a number will be added to the function name.
   * <p>
   * For callbacks, the 'this' keyword is set to the parent Component instance (if the Component is available).
   *
   * @param {Object} obj  the Object Literal for the method's arguments.
   * @param {baja.Property|String} obj.slot  the Property or Property name the value will be set on.
   * @param obj.value  the value being set (Type must extend baja:Value).
   * @param {Function} [obj.ok] the ok function callback. Called once network call has succeeded on the Server.
   * @param {Function} [obj.fail] the fail function callback. Called if this method has an error.
   * @param {baja.comm.Batch} [obj.batch] if defined, any network calls will be batched into this object.
   * @param [obj.cx]  the Context (used internally by BajaScript).
   */
  baja.Complex.prototype.set = function (obj) {    
    obj = objectify(obj);
    
    var cb = new Callback(obj.ok, obj.fail, obj.batch),   
        prop = obj.slot,
        val = obj.value,
        cx = bajaDef(obj.cx, null),
        serverDecode = cx && cx.serverDecode,
        commit = cx && cx.commit,
        syncStructVals = cx && cx.syncStructVals,
        comp = this;     // Ensure 'this' is the Component in the ok and fail callback...
    
    // Find the top level Component
    while (comp !== null && !comp.getType().isComponent()) {
      comp = comp.getParent();
    }
    
    cb.addOk(function (ok, fail, resp) {
      if (comp !== null) {
        ok.call(comp, resp);
      }
      else {
        ok(resp);
      }
    });
  
    cb.addFail(function (ok, fail, err) {
      if (comp !== null) {
        fail.call(comp, err);
      }
      else {
        fail(err);
      }
    });
            
    try {
      prop = this.getSlot(prop);
      
      // If decoding from the Server then short circuit some of this
      if (!serverDecode) {        
        // Validate arguments
        strictArg(prop, baja.Property);
        strictArg(val);
        
        if (prop === null) {
          throw new Error("Could not find Property: " + obj.slot);
        }
        if (!baja.hasType(val)) {
          throw new Error("Can only set BValue Types as Component Properties");
        }
        if (val.getType().isAbstract()) {
          throw new Error("Cannot set value in Complex to Abstract Type: " + val.getType());
        }
        if (val.getType().isNumber() && prop.getType().isNumber() && !val.getType().equals(prop.getType())) {
          // Recreate the number with the correct boxed type if the type spec differs
          val = prop.getType().getInstance().constructor.make(val.valueOf()); 
        }
        if (!val.getType().isValue()) {
          throw new Error("Cannot set non Value Types as Properties in a Complex");
        }
        if (val === this) {
          throw new Error("Illegal argument: this === value");
        } 
      }  
      
      if (cx) {
        if (typeof cx.displayName === "string") {
          prop.$setDisplayName(cx.displayName);
        }
        if (typeof cx.display === "string") {
          prop.$setDisplay(cx.display);
        }
      }
      
      if (val.equals(prop.$getValue())) {
        // TODO: May need to check for mounted on Components here
        cb.ok();
        return;
      }
            
      // Return if this set is trapped. If the set is trapped then the set operation will
      // be proxied off to a remote Space elsewhere...
      if (!commit && this.$fw("modifyTrap", [prop], val, cb, cx)) {
        return;
      }
                  
      // Unparent    
      var isClx = val.getType().isComplex();
      if (isClx) {    
        if (val.getParent()) {
          throw new Error("Complex already parented: " + val.getType());
        } 
      
        val.$parent = null;
        val.$propInParent = null;     
      }
            
      // If this is the same Struct from a Server decode then attempt to sync it
      // rather than completely replace it...
      if (syncStructVals && val.getType().isStruct() && val.getType().equals(prop.getType())) {
        syncStruct(/*from*/prop.$getValue(), /*to*/val);
      }
      else {  
        // Set new Property value
        prop.$setValue(val);
          
        // Parent
        if (isClx) {     
          val.$parent = this;
          val.$propInParent = prop;
          
          // If we have a Component then attempt to mount it
          if (val.getType().isComponent() && this.isMounted()) {  
            this.$space.$fw("mount", val);      
          }
        }
      }      
      
      // Invoke modified event (this will bubble up to a Component for the changed callback etc).
      this.$fw("modified", prop, cx);
      
      // TODO: Modified a link. Need to set up Knobs?
      cb.ok();
    }
    catch (err) {
      cb.fail(err);
    }
  };
  
  /**
   * Load all of the Slots on the Complex.
   *
   * @param {Object} [obj] the Object Literal for the method's arguments.
   * @param {Function} [obj.ok] the ok function callback. Called once network call has succeeded on the Server.
   * @param {Function} [obj.fail] the fail function callback. Called if this method has an error.
   * @param {baja.comm.Batch} [obj.batch] if defined, any network calls will be batched into this object.
   *
   * @see baja.Component#loadSlots
   */
  baja.Complex.prototype.loadSlots = function (obj) {
    if (obj && obj.ok && typeof obj.ok === "function") {
      obj.ok.call(this);
    }
  };
    
  /**
   * Return the Facets for a Slot.
   * <p>
   * If no arguments are provided and the Complex has a parent, the 
   * facets for the parent's Property will be returned. 
   *
   * @param {baja.Slot|String} [slot]  the Slot or Slot name.
   * @returns {baja.Facets} the Facets for the Slot (or null if Slot not found) or
   *                       the parent's Property facets.
   */
  baja.Complex.prototype.getFacets = function (slot) {
    // If no arguments are specified then attempt to get parent properly slot Flags
    if (arguments.length === 0) {
      if (this.$parent !== null && this.$propInParent !== null) {
        return this.$parent.getFacets(this.$propInParent);
      }
      else {
        return null;
      }
    }
  
    slot = this.getSlot(slot);
    return slot === null ? null : slot.getFacets();
  };
    
  /**
   * Compare if all of this object's properties are equal to the specified object.
   *
   * @param obj
   * @returns {Boolean} true if this object is equivalent this the specified object.
   */
  baja.Complex.prototype.equivalent = function (obj) { 
    if (!baja.hasType(obj)) {
      return false;
    }
  
    if (!obj.getType().equals(this.getType())) {
      return false;
    }
    
    if (this.$map.getSize() !== obj.$map.getSize()) {
      return false;
    }
    
    // Only compare against Properties
    var props = obj.getSlots().properties(),
        p,
        val;
    
    while (props.next()) {
      p = props.get();
      
      // Always check flags
      if (!this.getFlags(p.getName()).equals(obj.getFlags(p))) {
        return false;
      }
      
      val = obj.get(p);
      
      if (val === null) {
        return false;
      }
      
      // Compare Property values
      if (!val.equivalent(this.get(p.getName()))) {
        return false;
      }
      
      // Ensure they're the same order in the SlotMap
      if (this.$map.getIndex(p.getName()) !== props.getIndex()) {
        return false;
      }
    }
       
    return true;
  };
  
  var copyingContext = { type: "copying" };
  
  /**
   * Create a clone of this Complex.
   * <p>
   * If the exact argument is true and this Complex is a Component then
   * the defaultOnClone and removeOnClone flags will be ignored.
   *
   * @param {Boolean} [exact] flag to indicate whether to create an exact copy (false by default).
   * @returns cloned Complex.
   */
  baja.Complex.prototype.newCopy = function (exact) {
    var newInstance = this.getType().getInstance(), 
        props = this.getSlots().properties(),    
        p,
        val;
    
    while (props.next()) {
      p = props.get();
       
      // If default on clone and it's not an exact copy then skip this Property
      if (!exact && (baja.Flags.DEFAULT_ON_CLONE & p.getFlags()) === baja.Flags.DEFAULT_ON_CLONE) {
        continue;
      }
      
      // Make a copy of the Property value
      val = this.get(p).newCopy(exact);
      
      if (p.isFrozen()) {
        newInstance.set({
          "slot": p.getName(), 
          "value": val,  
          "cx": copyingContext
        });
      }
      else {
        // If remove on clone and it's not an exact copy then skip copying this Property
        if (!exact && (baja.Flags.REMOVE_ON_CLONE & p.getFlags()) === baja.Flags.REMOVE_ON_CLONE) {
          continue;
        }
      
        // TODO: Skip BLinks, dynamic slots added in constructor and slots with removeOnClone set
        p = newInstance.add({
          "slot": p.getName(), 
          "value": val, 
          "flags": p.getFlags(), 
          "facets": p.getFacets(), 
          "cx": copyingContext
        });
      }
      
      // Copy of flags
      newInstance.getSlot(p.getName()).$setFlags(p.getFlags());
    }
    
    return newInstance;
  };
  
    
  /**
   * Internal framework method.
   * <p>
   * This method should only be used by Tridium developers. It follows
   * the same design pattern as Niagara's Component 'fw' method.
   *
   * @private
   */
  baja.Complex.prototype.$fw = function (x, a, b, c, d) {    
    if (x === "modified") {
      if (this.$parent !== null) {
        this.$parent.$fw(x, this.$propInParent, b, c, d);
      }
    }
    else if (x === "modifyTrap") {
      if (this.$parent !== null) {
        a.push(this.$propInParent);
        return this.$parent.$fw(x, a, b, c, d);
      }
      else {
        return false;
      }
    }
  };
      
  /**
   * @class Represents a baja:Struct in BajaScript.
   * <p>
   * Struct is the base class for a component which has
   * one or more properties.  Structs must only declare
   * properties which are typed as boolean, int, float,
   * String, Simple, or other Structs.  This means
   * that a Struct may never have a Component property.
   * Structs only support Property slots, never Actions or Topics.
   * <p>
   * A Struct can only contain frozen Slots. A frozen Slot is defined
   * at compile time (usually hard coded in Java).
   *
   * @see baja.Component
   *
   * @name baja.Struct
   * @extends baja.Complex
   */
  baja.Struct = function () {  
    baja.Struct.$super.apply(this, arguments);  
  }.$extend(baja.Complex).registerType("baja:Struct");
  
  /**
   * @class Represents a baja:Action in BajaScript.
   * <p>
   * Please note: this represents the Property's value and NOT the Property itself.
   *
   * @name baja.ActionProperty
   * @extends baja.Struct
   */
  baja.ActionProperty = function () {
    baja.ActionProperty.$super.apply(this, arguments); 
    this.$paramType = null;
    this.$paramDef = null;
    this.$returnType = null;    
  }.$extend(baja.Struct).registerType("baja:Action");
  
  /**
   * Return the Action's parameter Type.
   *
   * @returns {Type} parameter type (or null if the Action has no parameter).
   */   
  baja.ActionProperty.prototype.getParamType = function () {
    return this.$paramType;
  };
  
  /**
   * Return the Action's parameter default value.
   *
   * @returns parameter default value (or null if the Action has no parameter).
   */
  baja.ActionProperty.prototype.getParamDefault = function () {
    return this.$paramDef;
  };
  
  /**
   * Return the Action's return Type.
   *
   * @returns return type (or null if the Action has nothing to return).
   */
  baja.ActionProperty.prototype.getReturnType = function () {
    return this.$returnType;
  };
  
  /**
   * Called when the Action Property is invoked.
   *
   * @private
   *
   * @param target the Component target the Action is being invoked upon.
   * @param arg the argument for the Action.
   * @param cx the Context for the Action invocation (could be null).
   * @returns the Action's return value (null if nothing to return).
   */
  baja.ActionProperty.prototype.invoke = function (target, arg, cx) {
    return null;
  };
  
  /**
   * @class Represents a baja:Topic in BajaScript.
   * <p>
   * Please note: this represents the Property's value and not the Property itself.
   *
   * @name baja.TopicProperty
   * @extends baja.Struct
   */
  baja.TopicProperty = function () {
    baja.TopicProperty.$super.apply(this, arguments); 
    this.$eventType = null; 
  }.$extend(baja.Struct).registerType("baja:Topic");
  
  /**
   * Return the Topic's event Type.
   *
   * @returns {Type} event Type (or null if the Topic has no event Type).
   */   
  baja.TopicProperty.prototype.getEventType = function () {
    return this.$eventType;
  };
  
  /**
   * Called when the Topic Property is fired.
   * 
   * @private
   *
   * @param target the Component target the Topic is being fired upon.
   * @param event the event for the Topic.
   * @param cx the Context for the Topic being fired (could be null).
   */  
  baja.TopicProperty.prototype.fire = function (target, event, cx) {
  };
           
  /**
   * @class Represents a baja:Component in BajaScript.
   * <p>
   * Component is the required base class for all
   * Baja component classes.
   * <p> 
   * Just like Niagara, 'baja:Component' contains a lot of the core functionality of the framework.
   * Unlike 'baja:Struct', a Component can contain both frozen and dynamic Slots. Frozen Slots are
   * defined at compile time (typically hard coded in Java) and Dynamic Slots can be added at
   * runtime (i.e. when the Station is running). There are three different types of Slots that 
   * a Component can contain (Property, Action and Topic).
   *
   * @see baja.Struct
   * @see baja.Property
   * @see baja.Action
   * @see baja.Topic
   *
   * @name baja.Component
   * @extends baja.Complex
   */  
  baja.Component = function () {
    baja.Component.$super.apply(this, arguments);
    this.$space = null;
    this.$handle = null;
    this.$bPropsLoaded = false;
    this.$subs = [];
    this.$lease = false;
    this.$leaseTicket = baja.clock.expiredTicket;
    this.$knobs = null;
    this.$permissionsStr = null;
    this.$permissions = null;
  }.$extend(baja.Complex).registerType("baja:Component");
    
  // This is a generic component event handling function
  // that can route events to Component or Subscriber event handlers
  function handleComponentEvent(component, handlers, id, slot, obj, str, cx) {
    var error = baja.error;
  
    if (id === CHANGED) {
      handlers.fireHandlers("changed", error, component, slot, cx);     
    }
    else if (id === ADDED) {
      handlers.fireHandlers("added", error, component, slot, cx);
    }
    else if (id === REMOVED) {
      handlers.fireHandlers("removed", error, component, slot, obj, cx);      
    }
    else if (id === RENAMED) {
      handlers.fireHandlers("renamed", error, component, slot, str, cx);
    }
    else if (id === REORDERED) {
      handlers.fireHandlers("reordered", error, component, cx);
    }
    else if (id === TOPIC_FIRED) {
      handlers.fireHandlers("topicFired", error, component, slot, obj, cx);         
    }
    else if (id === FLAGS_CHANGED) {
      handlers.fireHandlers("flagsChanged", error, component, slot, cx);
    }
    else if (id === FACETS_CHANGED) {
      handlers.fireHandlers("facetsChanged", error, component, slot, cx);
    }
    else if (id === SUBSCRIBED) {
      handlers.fireHandlers("subscribed", error, component, cx);
    }
    else if (id === UNSUBSCRIBED) {
      handlers.fireHandlers("unsubscribed", error, component, cx);
    }
    else if (id === KNOB_ADDED) {
      handlers.fireHandlers("addKnob", error, component, slot, obj, cx);
    }
    else if (id === KNOB_REMOVED) {
      handlers.fireHandlers("removeKnob", error, component, slot, obj, cx);
    }
  }  
  
  // Handle Component child events
  function handleComponentChildEvent(component, handlers, id, str, cx) {
    var error = baja.error;
    if (id === RENAMED) {
      handlers.fireHandlers("componentRenamed", error, component, str, cx);
    }
    else if (id === FLAGS_CHANGED) {
      handlers.fireHandlers("componentFlagsChanged", error, component, cx);
    }
    else if (id === FACETS_CHANGED) {
      handlers.fireHandlers("componentFacetsChanged", error, component, cx);
    }
  }
  
  // Handler Reorder Component Child Events  
  function handleReorderComponentChildEvent(component, handlers, cx) {
    handlers.fireHandlers("componentReordered", baja.error, component, cx);
  }
    
  function fwCompEvent(comp, id, slot, obj, str, cx) {             
    
    if (comp.isSubscribed() || id === UNSUBSCRIBED) {  
      // First support framework callback
      // TODO: Commented out for now for improved performance. Are these really needed?
      /*
      try {
        if (id === CHANGED) {
          comp.$fw("changed", slot, cx);   
        }
        else if (id === ADDED) {
          comp.$fw("added", slot, cx);   
        }
        else if (id === REMOVED) {   
          comp.$fw("removed", slot, obj, cx);   
        }
        else if (id === RENAMED) {
          comp.$fw("renamed", slot, str, cx);
        }
        else if (id === REORDERED) {
          comp.$fw("reordered", cx);
        }
        else if (id === TOPIC_FIRED) {
          comp.$fw("fired", slot, obj, cx);   
        }
        else if (id === SUBSCRIBED) {
          comp.$fw("subscribed", cx);
        }
        else if (id === UNSUBSCRIBED) {
          comp.$fw("unsubscribed", cx);
        }
        else if (id === KNOB_ADDED) {
          comp.$fw("knobAdded", obj, cx);
        }
        else if (id === KNOB_REMOVED) {
          comp.$fw("knobRemoved", obj, cx);
        }
      }
      catch (e) {
        error(e);
      }
      */
      
      // Route to event handlers on the Component
      if (comp.hasHandlers()) {
        handleComponentEvent(comp, comp, id, slot, obj, str, cx);
      }
      
      // Route to Subscribers if there are any registered
      if (comp.$subs.length > 0) {  
        // Route to all registered Subscribers
        var i;
        for (i = 0; i < comp.$subs.length; ++i) {
          // Route to event handlers on the Subscriber  
          if (comp.$subs[i].hasHandlers()) {          
            handleComponentEvent(comp, comp.$subs[i], id, slot, obj, str, cx);            
          }
        }
      }
    }
                   
    var targetVal = null;
    if (id === RENAMED) {
      if (slot && slot.isProperty()) {
        targetVal = comp.get(slot);
      }
    }
    else if (id === FLAGS_CHANGED || 
             id === FACETS_CHANGED) {
      if (slot && slot.isProperty()) {
        targetVal = comp.get(slot);
      }
    }
    
    // Route to child Component
    if (targetVal !== null && targetVal.getType().isComponent() && targetVal.isSubscribed()) {
      // Route to event handlers on the Component
      handleComponentChildEvent(targetVal, targetVal, id, str, cx);
      
      // Route to Subscribers if there are any registered
      if (targetVal.$subs.length > 0) {  
        // Route to all registered Subscribers
        var x;
        for (x = 0; x < targetVal.$subs.length; ++x) {
          // Route to event handlers on the Subscriber      
          handleComponentChildEvent(targetVal, targetVal.$subs[x], id, str, cx);
        }
      }
    }
        
    // Special case for child reordered Component events. We need to route to all child Components on the target Component
    if (id === REORDERED) {
      comp.getSlots(function (slot) {
        return slot.isProperty() && slot.getType().isComponent() && this.get(slot).isSubscribed();
      }).each(function (slot) {
        // Route reordered event
        var component = this.get(slot);
        handleReorderComponentChildEvent(component, component, cx);     
        if (component.$subs.length > 0) { 
          var i;
          for (i = 0; i < component.$subs.length; ++i) {
            // Route to event handlers on the Subscriber      
            handleReorderComponentChildEvent(component, component.$subs[i], cx);
          }
        }
      });
    }
    
    // NavEvents
    if (baja.nav.hasHandlers() &&
         comp.isMounted() && 
        ((id === ADDED && slot.getType().isComponent()) ||
         (id === REMOVED && obj.getType().isComponent()) ||
         (id === RENAMED && slot.getType().isComponent()) ||
         id === REORDERED)) {
      handleComponentEvent(comp, baja.nav, id, slot, obj, str, cx); 
    }
  }
    
  function setContextInOkCallback(comp, cb) {
    cb.addOk(function (ok, fail, resp) {
      ok.call(comp, resp);
    });
  }
  
  function setContextInFailCallback(comp, cb) {
    cb.addFail(function (ok, fail, err) {
      fail.call(comp, err);
    });
  }
  
  /**
   * Set a Slot's flags.
   * <p>
   * If the Complex is mounted, this will <strong>asynchronously</strong> set the Slot Flags on the Server. 
   * <p> 
   * An Object Literal is used to specify the method's arguments...
   * <pre>
   *   myObj.setFlags({
   *     slot: "outsideAirTemp",
   *     flags: baja.Flags.SUMMARY,
   *     ok: function () {
   *       // Called once the Flags have been set (optional)
   *     },
   *     fail: function (err) {
   *       // Called if the flags fail to set (optional)
   *     },
   *     batch // if defined, any network calls will be batched into this object (optional)
   *   });
   * </pre>
   * For callbacks, the 'this' keyword is set to the Component instance.
   *
   * @param {Object} obj the Object Literal for the method's arguments.
   * @param {baja.Slot|String} obj.slot the Slot of Slot name.
   * @param {Number} obj.flags the new flags for the Slot.
   * @param {Function} [obj.ok] the ok function callback. Called once the method has succeeded.
   * @param {Function} [obj.fail] the fail function callback. Called if this method has an error.
   * @param {baja.comm.Batch} [obj.batch] if defined, any network calls will be batched into this object.
   * @param [obj.cx] the Context (used internally by BajaScript).
   */
  baja.Component.prototype.setFlags = function (obj) {
    obj = objectify(obj);
    
    var slot = obj.slot,
        flags = obj.flags,
        cx = obj.cx,
        serverDecode = cx && cx.serverDecode,
        commit = cx && cx.commit,
        cb = new Callback(obj.ok, obj.fail, obj.batch);
        
    // Ensure 'this' is Component in callbacks...
    setContextInOkCallback(this, cb);
    setContextInFailCallback(this, cb);
        
    try {
      slot = this.getSlot(slot);
      
      // Short circuit some of this if this is called from a Server decode
      if (!serverDecode) {
        // Validate arguments
        strictArg(slot, baja.Slot);
        strictArg(flags, Number);
        
        if (slot === null) {
          throw new Error("Could not find Slot: " + obj.slot);
        }
            
        // Subclass check
        if (typeof this.checkSetFlags === "function") {
          this.checkSetFlags(slot, flags, cx);
        }   
      }
      
      // Check if this is a proxy. If so then trap it...
      if (!commit && this.isMounted() && this.$space.hasCallbacks()) {
        this.$space.getCallbacks().setFlags(this, slot, flags, cb);
        return;
      }
     
      // Set the flags for the Slot
      slot.$setFlags(flags);
      
      if (cx) {
        if (typeof cx.displayName === "string") {
          slot.$setDisplayName(cx.displayName);
        }
        if (typeof cx.display === "string") {
          slot.$setDisplay(cx.display);
        }
      }
      
      // Fire Component Event
      fwCompEvent(this, FLAGS_CHANGED, slot, null, null, cx);
      
      cb.ok();
    }
    catch (err) {
      cb.fail(err);
    }
  };
  
  /**
   * Set a dynamic Slot's facets.
   * <p>
   * If the Complex is mounted, this will <strong>asynchronously</strong> change the facets on the Server. 
   * <p> 
   * An Object Literal is used to specify the method's arguments...
   * <pre>
   *   myObj.setFacets({
   *     slot: "outsideAirTemp",
   *     facets: baja.Facets.make(["foo"], ["boo"]),
   *     ok: function () {
   *       // Called once the Facets have been set (optional)
   *     },
   *     fail: function (err) {
   *       // Called if the facets fail to change (optional)
   *     },
   *     batch // if defined, any network calls will be batched into this object (optional)
   *   });
   * </pre>
   * For callbacks, the 'this' keyword is set to the Component instance.
   *
   * @param {Object} obj the Object Literal for the method's arguments.
   * @param {baja.Slot|String} obj.slot the Slot of Slot name.
   * @param {baja.Facets} obj.facets the new facets for the dynamic Slot.
   * @param {Function} [obj.ok] the ok function callback. Called once the method has succeeded.
   * @param {Function} [obj.fail] the fail function callback. Called if this method has an error.
   * @param {baja.comm.Batch} [obj.batch] if defined, any network calls will be batched into this object.
   * @param [obj.cx] the Context (used internally by BajaScript).
   */
  baja.Component.prototype.setFacets = function (obj) {
    obj = objectify(obj);
    var cb = new Callback(obj.ok, obj.fail, obj.batch);
        
    // Ensure 'this' is Component in callbacks...
    setContextInOkCallback(this, cb);
    setContextInFailCallback(this, cb);
    
    var slot = obj.slot,
        facets = obj.facets,
        cx = obj.cx,
        serverDecode = cx && cx.serverDecode,
        commit = cx && cx.commit;
    
    try {
      slot = this.getSlot(slot);
      
      if (facets === null) {
        facets = baja.Facets.DEFAULT;
      }
      
      // Short circuit some of this if this is the result of a Server Decode
      if (!serverDecode) {
        // Validate arguments
        strictArg(slot, baja.Slot);
        strictArg(facets, baja.Facets);
        
        if (slot === null) {
          throw new Error("Could not find Slot: " + obj.slot);
        }
                
        if (slot.isFrozen()) {
          throw new Error("Cannot set facets of frozen Slot: " + slot.getName());
        }
            
        // Subclass check
        if (typeof this.checkSetFacets === "function") {
          this.checkSetFacets(slot, facets, cx);
        }
      }
      
      // Check if this is a proxy. If so then trap it...
      if (!commit && this.isMounted() && this.$space.hasCallbacks()) {
        this.$space.getCallbacks().setFacets(this, slot, facets, cb);
        return;
      }
      
      // Set the flags for the Slot
      slot.$setFacets(facets);
      
      if (cx) {
        if (typeof cx.displayName === "string") {
          slot.$setDisplayName(cx.displayName);
        }
        if (typeof cx.display === "string") {
          slot.$setDisplay(cx.display);
        }
      }
      
      // Fire Component Event
      fwCompEvent(this, FACETS_CHANGED, slot, facets, null, cx);
      
      cb.ok();
    }
    catch (err) {
      cb.fail(err);
    }
  };
        
  /**
   * Add a dynamic Property to a Component.
   * <p>   
   * If the value extends baja:Action, the new slot is also an Action.  
   * If the value extends baja:Topic, the new slot is also a Topic.  
   * <p>
   * If the Complex is mounted, this will <strong>asynchronously</strong> add
   * the Property to the Component on the Server. 
   * <p> 
   * An Object Literal is used to specify the method's arguments...
   * <pre>
   *   myObj.add({
   *     slot: "foo",
   *     value: "slot value",
   *     facets: baja.Facets.make(["doo"], ["boo"]), // Optional
   *     flags: baja.Flags.SUMMARY, // Optional  
   *     ok: function (prop) {
   *       // Called once the Property has been added (optional)
   *     },
   *     fail: function (err) {
   *       // Called if the Property fails to add (optional)
   *     },
   *     batch // if defined, any network calls will be batched into this object (optional)
   *   });
   * </pre>
   * For callbacks, the 'this' keyword is set to the Component instance.
   *
   * @see baja.Facets
   * @see baja.Flags
   * @see baja.Component#getUniqueName
   *
   * @param {Object} obj the Object Literal for the method's arguments.
   * @param {String} obj.slot the Slot name the unique name to use as the String
   *                          key for the slot.  If null is passed, then a
   *                          unique name will automatically be generated.
   *                          If the name ends with the '?' character a unique
   *                          name will automatically be generated by appending
   *                          numbers to the specified name.  The name must meet 
   *                          the "name" production in the SlotPath BNF grammar.  
   *                          Informally this means that the name must start with 
   *                          an ascii letter and contain only ascii letters, ascii 
   *                          digits, or '_'.  Escape sequences can be specified 
   *                          using the '$' char.  Use baja.SlotPath.escape() to escape
   *                          illegal characters. 
   * @param {Object} obj.value the value to be added (Type must extend baja:Value).
   * @param {Number} [obj.flags] optional Slot flags.
   * @param {baja.Facets} [obj.facets] optional Slot Facets.
   * @param {Function} [obj.ok] the ok callback. This function is called once the Property
   *                            has been added to the Server. The function is passed the new
   *                            Property that has just been added.
   * @param {Function} [obj.fail] the fail callback. This function is called if the Property
   *                              fails to add. Any error information is passed into this function.
   * @param {baja.comm.Batch} [obj.batch] if defined, any network calls will be batched into this object
   * @param [obj.cx] the Context (used internally by BajaScript).
   * @returns if not mounted, the newly added Property. Otherwise null is returned.
   */
  baja.Component.prototype.add = function (obj) {    
    obj = objectify(obj, "value");
        
    var cb = new Callback(obj.ok, obj.fail, obj.batch);
        
    // Ensure 'this' is Component in callbacks...
    setContextInOkCallback(this, cb);
    setContextInFailCallback(this, cb);
    
    var slotName = obj.slot,
        val = obj.value,
        flags = obj.flags,
        facets = obj.facets,
        cx = obj.cx,
        serverDecode,
        commit;
        
    try {
      slotName = bajaDef(slotName, null);    
      flags = bajaDef(flags, 0);
      facets = bajaDef(facets, baja.Facets.DEFAULT);
      cx = bajaDef(cx, null);
      serverDecode = cx && cx.serverDecode;
      commit = cx && cx.commit;
      
      // Short-circuit some of this if this is the result of a Server Decode
      if (!serverDecode) {      
        // Validate arguments
        strictArg(slotName, String);
        strictArg(val);
        strictArg(flags, Number);
        strictArg(facets, baja.Facets);
        strictArg(cx);
            
        if (!baja.hasType(val)) {
          throw new Error("Can only add BValue Types as Component Properties");
        }
        if (val.getType().isAbstract()) {
          throw new Error("Cannot add Abstract Type to Component: " + val.getType());
        }
        if (!val.getType().isValue()) {
          throw new Error("Cannot add non Value Types as Properties to a Component");
        }
        if (val === this) {
          throw new Error("Illegal argument value === this");
        }
        // Custom check add
        if (typeof this.checkAdd === "function") {
          this.checkAdd(slotName, val, flags, facets, cx);
        }
        if (val.getType().isComponent()) {
          if (typeof val.isParentLegal === "function") {
            if (!this.getType().is("baja:UnrestrictedFolder")) {
              if (!val.isParentLegal(this)) {
                throw new Error("Illegal parent: " + this.getType() + " for child " + val.getType());
              }
            }
          }
          if (typeof this.isChildLegal === "function") {
            if (!this.isChildLegal(val)) {
              throw new Error("Illegal child: " + val.getType() + " for parent " + this.getType());
            }
          }
        }
      }
              
      // Check if this is a proxy. If so then trap it...
      if (!commit && this.isMounted() && this.$space.hasCallbacks()) {      
        this.$space.getCallbacks().add(this, 
                                       slotName, 
                                       val, 
                                       flags, 
                                       facets, 
                                       cb);
        return null;
      }
        
      if (!serverDecode) {
        if (slotName === null) {
          slotName = this.getUniqueName(val.getType().getTypeName()); // TODO: Need extra argument checking before this is reached
        }
        else if (slotName.substring(slotName.length - 1, slotName.length) === "?") {
          slotName = this.getUniqueName(slotName.substring(0, slotName.length - 1));
        } 
        
        baja.SlotPath.verifyValidName(slotName);
      }
                  
      // Check for duplicate Slot
      if (this.$map.get(slotName) !== null) {
        throw new Error("Duplicate Slot: " + slotName);
      }
             
      var displayName = slotName,      
          display = "";
            
      if (cx) {
        if (typeof cx.displayName === "string") {
          displayName = cx.displayName;
        }
        if (typeof cx.display === "string") {
          display = cx.display;
        }
      }
       
      var p;
      if (val.getType().isAction()) {
        p = new PropertyAction(slotName, displayName, display, flags, facets, val);
      }
      else if (val.getType().isTopic()) {
        p = new PropertyTopic(slotName, displayName, display, flags, facets, val);
      }
      else {
        p = new DynamicProperty(slotName, displayName, display, flags, facets, val);
      }
      
      // Add the Slot to the map
      this.$map.put(slotName, p);
      
      // Set up any parenting if needed      
      if (val.getType().isComplex()) {
        if (val.getParent() !== null) {
          throw new Error("Complex already parented: " + val.getType());
        }       
        val.$parent = this;
        val.$propInParent = p;
      
        // If we have a Component then attempt to mount it
        if (val.getType().isComponent() && this.isMounted()) {      
          this.$space.$fw("mount", val);
        }
      }
      
      // Fire Component Event
      fwCompEvent(this, ADDED, p, null, null, cx);
      
      cb.ok(p);
      return p;
    }
    catch (err) {
      cb.fail(err);
    }
    return null;
  };
  
  /**
   * Return a unique name for a potential new Slot in this Component.
   * <p>
   * Please note, this method inspects the current Slots this Component has loaded
   * to find a unique name. Therefore, if this Component is a Proxy, it must be 
   * fully loaded and subscribed. Also please refrain from using this method in a
   * batch operation since it's likely the other operations in the batch will influence
   * a Slot name's uniqueness.
   *
   * @param {String} slotName the initial Slot name used to ensure uniqueness. This must be 
   *                          a valid Slot name.
   * @returns {String} a unique name.
   */
  baja.Component.prototype.getUniqueName = function (slotName) {
    baja.SlotPath.verifyValidName(slotName);
    var n = slotName,
        i = 1;
    while (this.getSlot(n) !== null) {
      n = slotName + i;
      i++;
    }
    return n;
  };
      
  function removeUnmountEvent(component, handlers, cx) {
    handlers.fireHandlers("unmount", baja.error, component, cx);      
  }
  
  function removePropagateUnmountEvent(component, cx) {
    // If the Component is subscribed then trigger the unmount events
    if (component.isSubscribed()) {
      removeUnmountEvent(component, component, cx);
      
      if (component.$subs.length > 0) {  
        // Route to all registered Subscribers
        var i;
        for (i = 0; i < component.$subs.length; ++i) {
          // Route to event handlers on the Subscriber      
          removeUnmountEvent(component, component.$subs[i], cx);
        }
      }
    }
    
    // Search all child Components and trigger the unmount event
    component.getSlots(function (slot) {
      return slot.isProperty() && slot.getType().isComponent();
    }).each(function (slot) {
      removePropagateUnmountEvent(this.get(slot), cx);
    });
  }
  
  /**
   * Remove the dynamic Slot by the specified name.
   * <p>
   * If the Complex is mounted, this will <strong>asynchronously</strong> remove
   * the Property from the Component on the Server. 
   * <p> 
   * The Slot, Slot name, a Complex or an Object Literal can be used for the method's arguments...
   * <pre>
   *   myObj.remove("foo");
   *   
   *   //...or via the Slot itself...
   *
   *   myObj.remove(theFooSlot);
   *
   *   //...or remove the Complex instance from the parent...
   *
   *   myObj.remove(aComplexInstance);
   *
   *   //... of if more arguments are needed then via Object Literal notation...
   *
   *   myObj.remove({
   *     slot: "foo",
   *     ok: function () {
   *       // Called once the Property has been removed (optional)
   *     },
   *     fail: function (err) {
   *       // Called if the Property fails to remove (optional)
   *     },
   *     batch // if defined, any network calls will be batched into this object (optional)
   *   });
   * </pre>
   * For callbacks, the 'this' keyword is set to the Component instance.
   *
   * @param {baja.Slot|String|Object} obj the Slot, Slot name, Complex instance or an Object Literal.
   * @param {String} obj.slot the Slot, Slot name or Complex instance to remove.
   * @param {Function} [obj.ok] the ok callback. This function is called once the Property
   *                            has been remove from the Server. 
   * @param {Function} [obj.fail] the fail callback. This function is called if the Property
   *                              fails to remove. Any error information is passed into this function.
   * @param {baja.comm.Batch} [obj.batch] if defined, any network calls will be batched into this object.
   * @param [obj.cx] the Context (used internally by BajaScript).
   */
  baja.Component.prototype.remove = function (obj) {
    obj = objectify(obj, "slot");

    var slot = obj.slot,
        cx = obj.cx,
        serverDecode = cx && cx.serverDecode,
        commit = cx && cx.commit,
        cb = new Callback(obj.ok, obj.fail, obj.batch);
    
    // Ensure 'this' is Component in callbacks...
    setContextInOkCallback(this, cb);
    setContextInFailCallback(this, cb);
        
    try {
      strictArg(slot);     
      
      var val = null;
      if (baja.hasType(slot) && slot.getType().isComplex()) {
        val = slot;
        slot = slot.getPropertyInParent();
      }
      else {
        slot = this.getSlot(slot);
      }
      
      // Short circuit some of this on a Server decode
      if (!serverDecode) {          
        if (slot === null) {
          throw new Error("Invalid slot for Component remove");
        }
        if (!slot.isProperty() || slot.isFrozen()) {
          throw new Error("Cannot remove Slot that isn't a dynamic Property: " + slot.getName());
        }
        
        // Subclass check
        if (typeof this.checkRemove === "function") {
          this.checkRemove(slot, cx);
        }
      }
      
      // Check if this is a proxy. If so then trap it...
      if (!commit && this.isMounted() && this.$space.hasCallbacks()) {
        this.$space.getCallbacks().remove(this, slot, cb);
        return;
      }
      
      // TODO: Remove links?
      
      if (val === null) {
        val = this.get(slot);
      }
                      
      // Unparent
      if (val.getType().isComplex()) {
      
        // Unmount from Component Space
        if (val.getType().isComponent()) {
          // Trigger unmount event to this component and all child Components just before it's properly removed
          removePropagateUnmountEvent(val, cx);
        
          // If we have a Component then attempt to unmount it
          // (includes unregistering from subscription)
          if (this.isMounted()) {
            this.$space.$fw("unmount", val);
          }
        }
      
        val.$parent = null;
        val.$propInParent = null;     
      }
          
      // Remove the Component from the Slot Map
      this.$map.remove(slot.getName());
                
      // Fire Component Event
      fwCompEvent(this, REMOVED, slot, val, null, cx);
      
      cb.ok();
    }
    catch (err) {
      cb.fail(err);
    }
  };
  
  /**
   * Rename the specified dynamic Slot.
   * <p>
   * If the Complex is mounted, this will <strong>asynchronously</strong> rename
   * the Slot in the Component on the Server.
   * <p> 
   * An Object Literal is used for the method's arguments...
   * <pre>
   *   myObj.rename({
   *     slot: "foo",
   *     newName: "boo",
   *     ok: function () {
   *       // Called once the Slot has been renamed (optional)
   *     },
   *     fail: function (err) {
   *       // Called if the Slot fails to rename (optional)
   *     },
   *     batch // if defined, any network calls will be batched into this object (optional)
   *   });
   * </pre>
   * For callbacks, the 'this' keyword is set to the Component instance.
   *
   * @param {Object} obj the Object Literal used for the method's arguments.
   * @param {baja.Slot|String} obj.slot the dynamic Slot or dynamic Slot name that will be renamed
   * @param {String} obj.newName the new name of the Slot. 
   *                             The name must meet the "name" production in the
   *                             SlotPath BNF grammar.  Informally this means that
   *                             the name must start with an ascii letter, and 
   *                             contain only ascii letters, ascii digits, or '_'.  
   *                             Escape sequences can be specified using the '$' char.  
   *                             Use baja.SlotPath.escape() to escape illegal characters.
   * @param {Function} [obj.ok] the ok callback. This function is called once the Slot
   *                            has been renamed. 
   * @param {Function} [obj.fail] the fail callback. This function is called if the Slot
   *                              fails to rename. Any error information is passed into this function.
   * @param {baja.comm.Batch} [obj.batch] if defined, any network calls will be batched into this object.
   * @param [obj.cx] the Context (used internally by BajaScript).
   */
  baja.Component.prototype.rename = function (obj) {
    obj = objectify(obj);
    
    var slot = obj.slot,
        newName = obj.newName,
        cx = obj.cx,
        serverDecode = cx && cx.serverDecode,
        commit = cx && cx.commit,
        cb = new Callback(obj.ok, obj.fail, obj.batch);
    
    // Ensure 'this' is Component in callbacks...
    setContextInOkCallback(this, cb);
    setContextInFailCallback(this, cb);
    
    try {
      var s = this.getSlot(slot);
          
      if (s === null) {
        throw new Error("Cannot rename. Slot doesn't exist: " + slot + " -> " + newName);
      }
       
      // Short circuit some of these checks on a Server decode 
      if (!serverDecode) {     
        strictArg(s, baja.Slot);
        strictArg(newName, String);
              
        baja.SlotPath.verifyValidName(newName);
        
        if (s.isFrozen()) {
          throw new Error("Cannot rename frozen Slot: " + slot + " -> " + newName);
        }
        if (this.getSlot(newName) !== null) {
          throw new Error("Cannot rename. Slot name already used: " + slot + " -> " + newName);
        }
        
        // Subclass check
        if (typeof this.checkRename === "function") {
          this.checkRename(s, newName, cx);
        }
      }
      
      // Record the old name
      var oldName = s.getName();
      
       // Check if this is a proxy. If so then trap it...
      if (!commit && this.isMounted() && this.$space.hasCallbacks()) {
        this.$space.getCallbacks().rename(this, oldName, newName, cb);
        return;
      }
    
      // Rename the Component from the Slot Map
      if (!this.$map.rename(oldName, newName)) {
        throw new Error("Cannot rename: " + oldName + " -> " + newName);
      }
      
      s.$slotName = newName;
      
      if (cx) {
        if (typeof cx.displayName === "string") {
          s.$setDisplayName(cx.displayName);
        }
        if (typeof cx.display === "string") {
          s.$setDisplay(cx.display);
        }
      }
            
      // Fire Component Event    
      fwCompEvent(this, RENAMED, s, null, oldName, cx);
      
      cb.ok();
    }
    catch (err) {
      cb.fail(err);
    }
  };    
   
  /**
   * Reorder the Component's dynamic Properties.
   * <p>
   * If the Complex is mounted, this will <strong>asynchronously</strong> reorder
   * the dynamic Properties in the Component on the Server.
   * <p> 
   * An Property array or an Object Literal can used for the method's arguments...
   * <pre>
   *   // Order via an array of Properties...
   *   myObj.reorder([booProp, fooProp, dooProp]);
   *
   *   // ...or order via an array of Property names...
   *   myObj.reorder(["boo", "foo", "doo"]);
   *
   *   // ...or for more arguments, use an Object Literal...
   *   myObj.reorder({
   *     dynamicProperties: [booProp, fooProp, dooProp], // Can also be a Property name array!
   *     ok: function () {
   *       // Called once the Properties have been reordered (optional)
   *     },
   *     fail: function (err) {
   *       // Called if the Slot fails to reorder (optional)
   *     },
   *     batch // if defined, any network calls will be batched into this object (optional)
   *   });
   * </pre>
   * For callbacks, the 'this' keyword is set to the Component instance.
   *
   * @param {Array|Object} obj the array of Properties, Property names or an Object Literal used for the method's arguments.
   * @param {Array} obj.dynamicProperties an array of Properties or Property names for the slot order.
   * @param {Function} [obj.ok] the ok callback. This function is called once the dynamic Properties have
   *                            been reordered. 
   * @param {Function} [obj.fail] the fail callback. This function is called if the dynamic Properties fail to reorder. 
   *                              Any error information is passed into this function.
   * @param {baja.comm.Batch} [obj.batch] if defined, any network calls will be batched into this object.
   * @param [obj.cx] the Context (used internally by BajaScript).
   */ 
  baja.Component.prototype.reorder = function (obj) {
    obj = objectify(obj, "dynamicProperties");
    
    var dynamicProperties = obj.dynamicProperties,
        cx = obj.cx,
        serverDecode = cx && cx.serverDecode,
        commit = cx && cx.commit,
        cb = new Callback(obj.ok, obj.fail, obj.batch),
        i;
        
    // Ensure 'this' is Component in callbacks...
    setContextInOkCallback(this, cb);
    setContextInFailCallback(this, cb);
    
    // If this is a commit and the component is mounted then only process if the component is subscribed and fully loaded.
    // Otherwise it probably won't work
    if (commit && this.isMounted() && !(this.isSubscribed() && this.$bPropsLoaded)) {
      cb.ok();
      return;
    }
        
    try {
      // Verify the array contents
      if (!serverDecode) {
        strictArg(dynamicProperties, Array);
      }
      
      var preGetSlot;      
      for (i = 0; i < dynamicProperties.length; ++i) {
        preGetSlot = dynamicProperties[i];
        dynamicProperties[i] = this.getSlot(dynamicProperties[i]);
        
        if (!dynamicProperties[i]) {
          throw new Error("Could not find dynamic Property to reorder: " + preGetSlot + " in " + this.toPathString());
        }
        if (dynamicProperties[i].isFrozen()) {
          throw new Error("Cannot reorder frozen Properties");
        }
      }
      
      var currentDynProps = this.getSlots().dynamic().properties(),
          dynPropCount = 0;
      while (currentDynProps.next()) {
        ++dynPropCount;
      }
      if (dynPropCount === 0) {
        throw new Error("Cannot reorder. No dynamic Props!");
      }
      if (dynPropCount !== dynamicProperties.length) {
        throw new Error("Cannot reorder. Actual count: " + dynPropCount + " != " + dynamicProperties.length);
      }
      
      // Subclass check
      if (!serverDecode && typeof this.checkReorder === "function") {
        this.checkReorder(dynamicProperties, cx);
      }
              
      // Check if this is a proxy. If so then trap it...
      if (!commit && this.isMounted() && this.$space.hasCallbacks()) {
        this.$space.getCallbacks().reorder(this, dynamicProperties, cb);
        return;
      }
          
      // Get a copy of the keys used in the SlotMap
      var keys = this.$map.getKeys();
      
      var getKeyIndex = function (k) {
        var i;
        for (i = 0; i < keys.length; ++i) {
          if (k === keys[i]) {
            return i;
          }
        }
        throw new Error("Could not find Property in reorder: " + k);
      };
      
      var getNewPropsIndex = function (k) {
        var i;
        for (i = 0; i < dynamicProperties.length; ++i) {
          if (k === dynamicProperties[i].getName()) {
            return i;
          }
        }
        throw new Error("Could not find dynamic Property in reorder: " + k);
      };
      
      // Sort the map accordingly
      var that = this;
      this.$map.sort(function (a, b) {
        var as = that.$map.get(a);      
        var bs = that.$map.get(b);
        
        // If both Properties are frozen then just compare against the current indexes
        if (as.isFrozen() && bs.isFrozen()) {
          return getKeyIndex(a) < getKeyIndex(b) ? -1 : 1;
        }
        else if (as.isFrozen()) {
          return -1;
        }
        else if (bs.isFrozen()) {
          return 1;
        }
        else {
          // If both Properties are dynamic then we can order as per the new array
          return getNewPropsIndex(a) < getNewPropsIndex(b) ? -1 : 1;
        }
      });

      // Fire Component Event
      fwCompEvent(this, REORDERED, null, null, null, cx);
      
      cb.ok();
    }
    catch (err) {
      cb.fail(err);
    }
  };
  
  var invalidActionArgErrMsg = "Invalid Action Argument: ";
      
  /**
   * Invoke an Action.
   * <p>
   * If the Complex is mounted, this will <strong>asynchronously</strong> invoke
   * the Action on the Component in the Server.
   * <p> 
   * A Slot, Slot name or an Object Literal can used for the method's arguments...
   * <pre>
   *   // Invoke the Action via its Action Slot...
   *   myObj.invoke(fooAction);
   *
   *   // ...or via the Action's Slot name...
   *   myObj.invoke("foo");
   *
   *   // ...or for more arguments, use an Object Literal...
   *   myObj.invoke({
   *     slot: actionSlot, // Can also be an Action Slot name
   *     value: "the Action's argument",
   *     ok: function (returnValue) {
   *       // Called once the Action has been invoked (optional)
   *     },
   *     fail: function (err) {
   *       // Called if the Action fails to invoke (optional)
   *     },
   *     batch // if defined, any network calls will be batched into this object (optional)
   *   });
   * </pre>
   * For callbacks, the 'this' keyword is set to the Component instance.
   * <p>
   * Please note that auto-generated convenience methods are created and added to a Component for invoking
   * frozen Actions...
   * <pre>
   *   // Invoke an Action called 'override'. Pass in an argument
   *   myPoint.override(overrideVal);
   *
   *   // ...or via an Object Literal for more arguments...
   *   myPoint.override({
   *     value: overrideVal,
   *     ok: function (returnValue) {
   *       // Called once the Action has been invoked (optional)
   *     },
   *     fail: function (err) {
   *       // Called if the Action fails to invoke (optional)
   *     },
   *     batch // if defined, any network calls will be batched into this object (optional)
   *   });
   * </pre>
   * If the name of the auto-generated Action method is already used, BajaScript will attach a number to the end
   * of the method name so it becomes unique. For example, the 'set' Action on a NumericWritable would be called 'set1'
   * because Component already has a 'set' method.
   *
   * @param {baja.Action|String|Object} obj the Action, Action name or Object Literal for the method's arguments.
   * @param {baja.Action|String} obj.slot the Action or Action name.
   * @param [obj.value] the Action's argument.
   * @param {Function} [obj.ok] the ok callback. This function is called once Action has been invoked. 
   *                            If the Action has a returned argument, this will be passed to this function.
   * @param {Function} [obj.fail] the fail callback. This function is called if the Action fails to invoke. 
   *                              Any error information is passed into this function.
   * @param {baja.comm.Batch} [obj.batch] if defined, any network calls will be batched into this object.
   * @param [obj.cx] the Context (used internally by BajaScript).
   */  
  baja.Component.prototype.invoke = function (obj) {
    obj = objectify(obj, "slot");
    
    var action = obj.slot,
        arg = bajaDef(obj.value, null),
        cx = obj.cx,
        retVal = null,
        cb = new Callback(obj.ok, obj.fail, obj.batch),
        flags = 0,
        paramType;
    
    // Ensure 'this' is Component in callbacks...
    setContextInOkCallback(this, cb);
    setContextInFailCallback(this, cb);
            
    try {
      action = this.getSlot(action);
      
      if (action === null) {
        throw new Error("Action does not exist: " + obj.slot);
      }
            
      // Get Slot flags so we can test for 'async'
      flags = this.getFlags(action);
      paramType = action.getParamType();
      
      // Check we have a valid argument for this Action
      if (paramType) {
        if (baja.hasType(arg)) {
          if (arg.getType().isNumber() && paramType.isNumber() && !arg.getType().equals(paramType)) {
            // Recreate the number with the correct boxed type if the type spec differs
            arg = paramType.getInstance().constructor.make(arg.valueOf()); 
          }
          else if (!arg.getType().is(paramType)) {
            throw new Error(invalidActionArgErrMsg + arg);
          }
        }
        else {
          throw new Error(invalidActionArgErrMsg + arg);
        }
      }
    }
    catch (err) {
      // Notify fail
      cb.fail(err);
      
      // We should ALWAYS bail after calling a callback fail!
      return;
    }
    
    var that = this;
    function inv() {
      try {                        
        if (that.isMounted() && that.$space.hasCallbacks()) {
          // If mounted then make a network call for the Action invocation
          that.$space.getCallbacks().invokeAction(that, action, arg, cb);
          return;
        }
        
        if (!action.isProperty()) {
          // Invoke do method of Action
          var s = "do" + action.getName().capitalizeFirstLetter();
          if (typeof that[s] === "function") {
            // Invoke but ensure null is returned if the function returns undefined
            retVal = bajaDef(that[s](arg, cx), null);
          }
          else {
            throw new Error("Could not find do method for Action: " + action.getName());
          }
        }
        else {
          // If the Action is also a Property then forward its invocation on to the value
          retVal = bajaDef(that.get(action).invoke(that, arg, cx), null);
        }
        
        cb.ok(retVal);
      }
      catch (err) {
        cb.fail(err);
      }
    }
    
    if ((flags & baja.Flags.ASYNC) !== baja.Flags.ASYNC) {
      inv();
    }
    else {
      baja.runAsync(inv);
    }
    
    return retVal;
  };

  /**
   * Fire a Topic.
   * <p>
   * If the Complex is mounted, this will <strong>asynchronously</strong> fire
   * the Topic on the Component in the Server.
   * <p> 
   * A Slot, Slot name or an Object Literal can used for the method's arguments...
   * <pre>
   *   // Fire the Topic via its Topic Slot...
   *   myObj.fire(fooTopic);
   *
   *   // ...or via the Topic's Slot name...
   *   myObj.fire("foo");
   *
   *   // ...or for more arguments, use an Object Literal...
   *   myObj.fire({
   *     slot: topicSlot, // Can also be a Topic Slot name
   *     value: "the Topic event argument",
   *     ok: function () {
   *       // Called once the Topic has been fired (optional)
   *     },
   *     fail: function (err) {
   *       // Called if the Topic fails to fire (optional)
   *     },
   *     batch // if defined, any network calls will be batched into this object (optional)
   *   });
   * </pre>
   * <p>
   * Please note that auto-generated convenience methods are created and added to a Component for firing
   * frozen Topics...
   * <pre>
   *   // Fire a Topic called 'foo'
   *   myObj.fireFoo();
   *
   *   // Fire a Topic called foo with an event argument...
   *   myObj.fireFoo("the Topic event argument");
   *
   *   // ...or via an Object Literal for more arguments...
   *   myObj.fireFoo({
   *     value: "the Topic event argument",
   *     ok: function () {
   *       // Called once the Topic has been fired (optional)
   *     },
   *     fail: function (err) {
   *       // Called if the Topic fails to fire (optional)
   *     },
   *     batch // if defined, any network calls will be batched into this object (optional)
   *   });
   * </pre>
   * If the name of the auto-generated Topic method is already used, BajaScript will attach a number to the end
   * of the method name so it becomes unique.
   * <p>
   * For callbacks, the 'this' keyword is set to the Component instance.
   *
   * @param {baja.Action|String|Object} obj the Topic, Topic name or Object Literal for the method's arguments.
   * @param {baja.Action|String} obj.slot the Topic or Topic name.
   * @param [obj.value] the Topic's event.
   * @param {Function} [obj.ok] the ok callback. This function is called once Topic has been fired. 
   * @param {Function} [obj.fail] the fail callback. This function is called if the Topic fails to fire. 
   *                              Any error information is passed into this function.
   * @param {baja.comm.Batch} [obj.batch] if defined, any network calls will be batched into this object.
   * @param [obj.cx] the Context (used internally by BajaScript).
   */ 
  baja.Component.prototype.fire = function (obj) {
    obj = objectify(obj, "slot");
    
    var topic = obj.slot,
        event = obj.value,
        cx = obj.cx,
        serverDecode = cx && cx.serverDecode,
        commit = cx && cx.commit,
        cb = new Callback(obj.ok, obj.fail, obj.batch);
    
    // Ensure 'this' is Component in callbacks...
    setContextInOkCallback(this, cb);
    setContextInFailCallback(this, cb);
    
    try {
      // Ensure we have a Topic Slot
      topic = this.getSlot(topic);
      if (!topic.isTopic()) {
        throw new Error("Slot is not a Topic: " + topic.getName());
      }
      
      // Ensure event is not undefined
      event = bajaDef(event, null);
      
      // Short circuit some of this on a Server decode
      if (!serverDecode) {
        // Validate the event
        if (event !== null) {
          if (!baja.hasType(event)) {
            throw new Error("Topic event is not a BValue");
          }
          if (event.getType().isAbstract()) {    
            throw new Error("Topic event is has abstract Type: " + event.getType());
          }
          if (!event.getType().isValue()) {
            throw new Error("Topic event is not a BValue: " + event.getType());
          }
        }
      }
      
      // Check if this is a proxy. If so then trap it...
      if (!commit && this.isMounted() && this.$space.hasCallbacks()) {
        this.$space.getCallbacks().fire(this, topic, event, cb);
        return;
      }
      
      // If the Topic is a Property then fire on the Property
      if (topic.isProperty()) {
        this.get(topic).fire(this, event, cx);
      }

      // Fire component event for Topic
      fwCompEvent(this, TOPIC_FIRED, topic, event, null, cx); 
    }
    catch (err) {
      cb.fail(err);
    }    
  };
  
  /**
   * Internal Framework Method.
   *
   * @private
   *
   * @see baja.Complex#$fw
   */
  baja.Component.prototype.$fw = function (x, a, b, c, d) {
        
    if (x === "modified") {   
      // Fire a Component modified event for Property changed    
      fwCompEvent(this, CHANGED, a, null, null, b);
      return;
    }
    else if (x === "fwSubscribed") {     
      fwCompEvent(this, SUBSCRIBED, null, null, null, b);
      return;
    }
    else if (x === "fwUnsubscribed") {     
      fwCompEvent(this, UNSUBSCRIBED, null, null, null, b);
      return;
    }
    else if (x === "modifyTrap") {     
      // Check if this is a proxy. If so then trap any modifications
      if (this.isMounted() && this.$space.hasCallbacks() && !(d && d.commit)) {
        this.$space.getCallbacks().set(this, 
                                       a,  // propertyPath
                                       b,  // value
                                       c); // callback
        return true;
      }
      else {
        return false;
      }
    }
    else if (x === "installKnob") {
      // Add a knob to the Component
      this.$knobs = this.$knobs || {};
      this.$knobCount = this.$knobCount || 0;
      
      this.$knobs[a.getId()] = a;
      ++this.$knobCount;
      
      fwCompEvent(this, KNOB_ADDED, this.getSlot(a.getSourceSlotName()), /*a=Knob*/a, null, /*b=Context*/b);
      return;
    }
    else if (x === "uninstallKnob") {
      // Remove the knob from the Component
      if (this.$knobs && this.$knobs.hasOwnProperty(a)) {
        var k = this.$knobs[a];
        delete this.$knobs[a];
        --this.$knobCount;
      
        fwCompEvent(this, KNOB_REMOVED, /*b=Slot name*/this.getSlot(b), k, null, /*c=Context*/c);
      }
      return;
    }
    else if (x === "setPermissions") {
      // Set the permissions on the Component
      this.$permissionsStr = a;
      
      // Nullify any decoded permissions
      this.$permissions = null;
    }
        
    return baja.Component.$super.prototype.$fw.apply(this, arguments);
  };
    
  /**
   * Return true if the Component is mounted inside a Space.
   *
   * @returns {Boolean}
   */
  baja.Component.prototype.isMounted = function () {
    return this.$space !== null;
  };
  
  /**
   * Return the Component Space.
   *
   * @returns the Component Space for this Component (if mounted) otherwise return null.
   */
  baja.Component.prototype.getComponentSpace = function () {
    return this.$space;
  };
  
  /**
   * Return the Component's handle.
   *
   * @returns {String} handle for this Component (if mounted) otherwise return null.
   */
  baja.Component.prototype.getHandle = function () {
    return this.$handle;
  };
  
  /**
   * Return the ORD in session for this Component.
   *
   * @returns {baja.Ord} ORD in Session for this Component (or null if not mounted).
   */
  baja.Component.prototype.getOrdInSession = function () {
    return this.getHandle() === null ? null : baja.Ord.make("station:|h:" + this.getHandle());
  };
      
  var unlease = function () {   
    if (!this.$lease) {
      return;
    }
  
    // Are currently subscribed?
    var prevSub = this.isSubscribed();
    this.$lease = false;
    this.$leaseTicket.cancel();
    
    // If the Component is unsubscribed but was previously subscribed then make a network call 
    if (!this.isSubscribed() && prevSub && this.isMounted() && this.$space.hasCallbacks()) {
      this.$space.getCallbacks().unsubscribe(["h:" + this.$handle], new Callback());
    } 
  };
  
  /**
   * Subscribe a number of Components for a period of time.
   * <p>
   * The default period of time is 10 seconds.
   * <p>
   * Please note that a {@link baja.Subscriber} can also be used to put a Component into
   * and out of subscription.
   * <p>
   * If the Component is mounted and it can be subscribed, this will result in 
   * an <strong>asynchronous</strong> network call.
   * <p>
   * If any of the the Components are already leased, the lease timer will just be renewed.
   * <p>
   * A time (Number or baja.RelTime) or an Object Literal can be used to specify the method's arguments...
   * <pre>
   *   // Lease an array of Components for the default time period
   *   myComp.lease([comp1, comp2, comp3]);
   *   
   *   // ...or lease for 2 and half minutes...
   *   myComp.lease({
   *     time: baja.RelTime.make({minutes: 2, seconds: 30}),
   *     comps: [comp1, comp2, comp3]
   *   });
   * </pre>
   * For callbacks, the 'this' keyword is set to whatever the 'comps' argument was originally set to.
   *
   * @see baja.Subscriber
   * @see baja.Component#lease
   *
   * @param {Object} obj an Object Literal for the method's arguments.
   * @param {Array|baja.Component} obj.comps the Components to be subscribed.
   * @param {Function} [obj.ok] the ok callback. Called once the Component has been unsubscribed.
   * @param {Function} [obj.fail] the fail callback. Called if the Component fails to unsubscribe.
   *                              Any errors will be passed to this function.
   * @param {Number|RelTime} [obj.time] the number of milliseconds or RelTime for the lease.
   * @param {baja.comm.Batch} [obj.batch] if defined, any network calls will be batched into this object.
   *                                      The timer will only be started once the batch has fully committed.   
   */
  baja.Component.lease = function (obj) {
    obj = objectify(obj, "comps");  
    var cb = new Callback(obj.ok, obj.fail, obj.batch);
        
    function scheduleUnlease(comp, time) {
      // Cancel the current lease ticket
      comp.$leaseTicket.cancel();
      
      // Schedule to expire the Subscription in 60 seconds
      comp.$leaseTicket = baja.clock.schedule(function () { 
        unlease.call(comp);           
      }, time);
    }
    
    try {	  
      var comps = obj.comps;
	  
      if (!comps) {
        throw new Error("Must specify Components for lease");
      }
      
      // Ensure 'comps' is used as the context in the callback...
      setContextInOkCallback(comps, cb);
      setContextInFailCallback(comps, cb);
      
      // Get the lease time 
      var time = bajaDef(obj.time, /*10 seconds*/10000);
      
      // If a rel time then get the number of milliseconds from it
      if (baja.hasType(time) && time.getType().is("baja:RelTime")) {
        time = time.getMillis();
      }
    
      strictArg(time, Number);
      if (time < 1) {
        throw new Error("Invalid lease time (time must be > 0 ms): " + time);
      }
	  
      if (!(comps instanceof Array)) {
        comps = [comps];
      }
      
      if (comps.length === 0) {
        cb.ok();
        return;
      }
	  
      var space = null, i;
      for (i = 0; i < comps.length; ++i) {
        // Check all Components are valid
        strictArg(comps[i], baja.Component);
        if (!comps[i].isMounted()) {
          throw new Error("Cannot subscribe unmounted Component!");
        }
        if (!space) {
          space = comps[i].getComponentSpace();
        }
        if (space !== comps[i].getComponentSpace()) {
          throw new Error("All Components must belong to the same Component Space!");
        }
      }
            
      cb.addOk(function (ok, fail) {
        var x;
        for (x = 0; x < comps.length; ++x) {
          scheduleUnlease(comps[x], time);
        }
        
        ok();
      });
      
      // Build handles we want to subscribe
      var handles = [],
          compsToSub = [],
          j;
                    
      for (j = 0; j < comps.length; ++j) {
        // If already subscribed then don't bother making a network call for these
        if (!comps[j].isSubscribed()) {
          handles.push("h:" + comps[j].getHandle());
          compsToSub.push(comps[j]);
        }
        comps[j].$lease = true;
      }
      
      // If there's currently a lease active then renew it by calling ok on the callback
      if (handles.length === 0 || !space.hasCallbacks()) {
        cb.ok();
        return;
      }
      
      // Signal that each Component has been subscribed
      cb.addOk(function (ok, fail, resp) {
        var i;
        for (i = 0; i < compsToSub.length; ++i) {
          try {
             compsToSub[i].$fw("fwSubscribed");
          }
          catch (err) {
            baja.error(err);
          }
        }
        
        ok();
      });
      
      // Make network call for subscription      
      space.getCallbacks().subscribe(handles, cb, obj.importAsync);   
    }
    catch (err) {
      cb.fail(err);
    }
  };
     
  /**
   * Subscribe a Component for a period of time.
   * <p>
   * The default lease time is 10 seconds.
   * <p>
   * Please note that a {@link baja.Subscriber} can also be used to put a Component into
   * and out of subscription.
   * <p>
   * If the Component is mounted and it can be subscribed, this will result in 
   * an <strong>asynchronous</strong> network call.
   * <p>
   * If lease is called while the Component is already leased, the timer will just be renewed.
   * <p>
   * A time (Number or baja.RelTime) or an Object Literal can be used to specify the method's arguments...
   * <pre>
   *   // Lease for 15 seconds
   *   myComp.lease(15000);
   *   
   *   // ...or lease for 2 and half minutes...
   *   myComp.lease(baja.RelTime.make({minutes: 2, seconds: 30}));
   *
   *   // ...or lease using an Object Literal for more arguments...
   *   myComp.lease({
   *     time: 1000, // in milliseconds. Can also be a RelTime.
   *     ok: function () {
   *       // Called once the Component is subscribed (optional)
   *     },
   *     fail: function (err) {
   *       // Called if the Component failed to subscribe (optional)
   *     },
   *     batch // if defined, any network calls will be batched into this object (optional)
   *   });
   * </pre>
   * For callbacks, the 'this' keyword is set to the Component instance.
   *
   * @see baja.Subscriber
   * @see baja.Component.lease
   *
   * @param {Number|baja.RelTime|Object} [obj] the number of milliseconds, RelTime or an Object Literal 
   *                                           for the method's arguments.
   * @param {Function} [obj.ok] the ok callback. Called once the Component has been unsubscribed.
   * @param {Function} [obj.fail] the fail callback. Called if the Component fails to unsubscribe.
   *                              Any errors will be passed to this function.
   * @param {Number|RelTime} [obj.time] the number of milliseconds or RelTime for the lease.
   * @param {baja.comm.Batch} [obj.batch] if defined, any network calls will be batched into this object.
   *                                      The timer will only be started once the batch has fully committed.   
   */
  baja.Component.prototype.lease = function (obj) {
    obj = objectify(obj, "time");  
    obj.comps = this;
    baja.Component.lease(obj);
  };
    
  /**
   * Is the Component subscribed?
   *
   * @returns {Boolean}
   */
  baja.Component.prototype.isSubscribed = function () {
    // Component is subscribed if is leased or a Subscriber is registered on it
    return this.$lease || this.$subs.length > 0;
  };
    
  /**
   * Load all of the Slots on the Component.
   *
   * If the Component is mounted and it can be loaded, this will result in 
   * an <strong>asynchronous</strong> network call.
   * <p>
   * An optional Object Literal can be used to specify the method's arguments...
   * <pre>
   *   myComp.loadSlots({
   *     ok: function () {
   *       // Called once the Component is loaded (optional)
   *     },
   *     fail: function (err) {
   *       // Called if the Component failed to load (optional)
   *     },
   *     batch // if defined, any network calls will be batched into this object (optional)
   *   });
   * </pre>
   * For callbacks, the 'this' keyword is set to the Component instance.
   *
   * @param {Function} [obj.ok] the ok callback. Called once the Component has been loaded.
   * @param {Function} [obj.fail] the fail callback. Called if the Component fails to load.
   *                              Any errors will be passed to this function.
   * @param {baja.comm.Batch} [obj.batch] if defined, any network calls will be batched into this object.
   */
  baja.Component.prototype.loadSlots = function (obj) {
    obj = objectify(obj); 

    var cb = obj.cb;
    if (!cb) {   
      cb = new Callback(obj.ok, obj.fail, obj.batch); 
    }
    
    // Ensure 'this' is Component in callbacks...
    setContextInOkCallback(this, cb);
    setContextInFailCallback(this, cb);

    try {    
      if (!this.$bPropsLoaded && this.isMounted() && this.$space.hasCallbacks()) {   
        this.$space.getCallbacks().loadSlots("h:" + this.getHandle(), 0, cb);
      }
      else {
        cb.ok();
      }
    }
    catch (err) {
      cb.fail(err);
    }
  };
  
  /**
   * Make a Server Side Call.
   * <p>
   * Sometimes it's useful to invoke a method on the server from BajaScript.
   * A Server Side Call is how this is achieved.
   * <p>
   * This will result in an <strong>asynchronous</strong> network call.
   * <p>
   * In order to make a Server Side Call, the developer needs to first create a 
   * Niagara (Server Side) class that implements the box:javax.baja.box.BIServerSideCallHandler interface.
   * The implementation should also declare itself as an Agent on the target Component Type (more information in Java interface docs).
   * Here's an example of how a method implemented by this handler can be invoked...
   * <pre>
   *   // A resolved and mounted Component...
   *   myComp.serverSideCall({
   *     typeSpec: "foo:MyServerSideCallHandler", // The TypeSpec (moduleName:typeName) of the Server Side Call Handler
   *     methodName: "bar", // The name of the public method we wish to invoke in the handler
   *     value: "the argument for the method", // The argument to pass into the method (this can be any Baja Object/Component structure).
   *                                              It will be deserialized automatically by Niagara.
   *     ok: function (returnVal) {
   *       // Called once the method has been executed on the Server (optional)
   *     },
   *     fail: function (err) {
   *       // Called if the method throws an exception on the Server or can't execute for some reason (optional)
   *     },
   *     batch // if defined, any network calls will be batched into this object (optional)
   *   });
   * <\pre>
   * For callbacks, the 'this' keyword is set to the Component instance.
   * 
   * @param {Object} obj the Object Literal for the method's arguments.
   * @param {String} obj.typeSpec the type specification of the Server Side Call Handler (moduleName:typeName).
   * @param {String} obj.methodName the name of the method to invoke in the Server Side Call Handler
   * @param obj.value the value for the server side method argument (must be a BajaScript Type)
   * @param {Function} [obj.ok] the ok callback. Called once the Server Side Call has been invoked.
   *                                             Any return value is passed to this function.
   * @param {Function} [obj.fail] the fail callback. Called if the Component fails to load.
   *                              Any errors will be passed to this function.
   * @param {baja.comm.Batch} [obj.batch] if defined, any network calls will be batched into this object.
   */
  baja.Component.prototype.serverSideCall = function (obj) { 
    obj = objectify(obj);
    
    var typeSpec = obj.typeSpec,
        methodName = obj.methodName,
        val = bajaDef(obj.value, null), 
        cb = new Callback(obj.ok, obj.fail, obj.batch);  
    
    // Ensure 'this' is Component in callbacks...
    setContextInOkCallback(this, cb);
    setContextInFailCallback(this, cb);
    
    try {    
      // Check arguments
      strictArg(typeSpec, String);
      strictArg(methodName, String);
      strictArg(val);
      
      // Can only make this call on proper mounted Components that have Space Callbacks
      if (this.isMounted() && this.$space.hasCallbacks()) {
        this.$space.getCallbacks().serverSideCall(this, typeSpec, methodName, val, cb);
      }
      else {
        throw new Error("Unable to make serverSideCall on non-proxy Component Space");
      }
    }
    catch (err) {
      cb.fail(err);
    }
  };
  
  /**
   * Return the Slot Path of the Component.
   *
   * @returns {baja.SlotPath} the Slot Path or null if not mounted.
   */
  baja.Component.prototype.getSlotPath = function () {
    if (!this.isMounted()) {
      return null;
    }
  
    var slotNames = [];
    function getParNames(comp) {
      slotNames.push(comp.getName());
      
      var p = comp.getParent();
      if (p !== null) {
        getParNames(p);
      }
    }
    
    getParNames(this);
    var b = slotNames.reverse().join("/");
    if (b.length === 0) {
      b = "/";
    }
    return new baja.SlotPath(b);
  };
  
  /**
   * Return the path string of the Component.
   *
   * @returns {String} the Path String or null if not mounted.
   */
  baja.Component.prototype.toPathString = function () {
    if (!this.isMounted()) {
      return null;
    }
    return this.getSlotPath().getBody();
  };
  
  /**
   * Return the Nav ORD for the Component.
   *
   * @returns {baja.Ord} the Nav ORD or null if it's not mounted.
   */
  baja.Component.prototype.getNavOrd = function () {
    if (!this.isMounted()) {
      return null;
    }
    var spaceOrd = this.$space.getAbsoluteOrd();
    if (spaceOrd === null) {
      return null;
    }
    return baja.Ord.make(spaceOrd.toString() + "|" + this.getSlotPath().toString());
  };
  
  /**
   * Return the Nav Name for the Component.
   *
   * @returns {String}
   */
  baja.Component.prototype.getNavName = function () {
    var name = this.getName();
    
    if (name !== null) {
      return name;
    }
    
    var space = this.getComponentSpace();
    if (space && space.getRootComponent() !== null) {
      return space.getNavName();
    }
    else {
      return null;
    }
  };
  
  /**
   * Return the Nav Display Name for the Component.
   *
   * @returns {String}
   */
  baja.Component.prototype.getNavDisplayName = function () {
    return this.getDisplayName();
  };
  
  /**
   * Return the Nav Parent for the Component.
   *
   * @returns parent Nav Node
   */
  baja.Component.prototype.getNavParent = function () {
    var parent = this.getParent();    
    return parent || this.getComponentSpace();
  };
  
  /**
   * Access the Nav Children for the Component.
   *
   * @see baja.NavContainer#getNavChildren
   */
  baja.Component.prototype.getNavChildren = function (obj) {
    obj = objectify(obj, "ok");
    
    if (this.isMounted() && this.$space.hasCallbacks()) {
      // If we're mounted then make a network call to get the NavChildren since this
      // is always implemented Server Side
      this.$space.getCallbacks().getNavChildren(this.getHandle(),
                                                new Callback(obj.ok, obj.fail, obj.batch));
    }
    else {
      var kids = [];
      this.getSlots().properties().isComponent().each(function (slot) {
        if ((this.getFlags(slot) & baja.Flags.HIDDEN) === 0) {
          kids.push(this.get(slot));
        }
      });
      obj.ok(kids);
    }
  };
  
  /**
   * Return the Nav Icon for the Component.
   *
   * @returns {baja.Icon}
   */
  baja.Component.prototype.getNavIcon = function () {
    return this.getIcon();
  };
  
  /**
   * Return the Nav Description for the Component.
   *
   * @returns {String}
   */
  baja.Component.prototype.getNavDescription = function () {
    return this.getType().toString();
  };
  
  // Mix-in the event handlers for baja.Component  
  baja.event.mixin(baja.Component.prototype);  
    
  // These comments are added for the benefit of JsDoc Toolkit...  
    
  /**
   * Attach an Event Handler to this Component instance.
   * <p>
   * When an instance of Component is subscribed to a Component running
   * in the Station, BajaScript can be used to listen for Component Events. 
   * For instance, a common one would be a Property changed event...
   * <pre>
   *   // myPoint is a mounted and subscribed Component...
   *   myPoint.attach("changed", function (prop, cx) {
   *     if (prop.getName() === "out") {
   *       baja.outln("The output of the point is: " + this.getOutDisplay());
   *     }
   *   });
   * </pre>
   * Therefore, an event handler consists of a name and a function. When the
   * function is called, 'this' will map to the target Component the handler
   * is attached too.
   * <p>
   * For a list of all the event handlers and some of this method's more advanced 
   * features, please see {@link baja.Subscriber#attach}.
   *
   * @function
   * @name baja.Component#attach
   *
   * @see baja.Subscriber
   * @see baja.Component#detach
   * @see baja.Component#getHandlers
   * @see baja.Component#hasHandlers
   *
   * @param {String} event handler name
   * @param {Function} func the event handler function
   */
    
  /**
   * Detach an Event Handler from the Component.
   * <p>
   * If no arguments are used with this method then all events are removed.
   * <p>
   * For some of this method's more advanced features, please see {@link baja.Subscriber#detach}.
   * <p>
   * For a list of all the event handlers, please see {@link baja.Subscriber#attach}.
   *
   * @function
   * @name baja.Component#detach
   *
   * @see baja.Subscriber
   * @see baja.Component#attach
   * @see baja.Component#getHandlers
   * @see baja.Component#hasHandlers
   *
   * @param {String} [hName] the name of the handler to detach from the Component.
   * @param {Function} [func] the function to remove from the Subscriber. It's recommended to supply this just in case
   *                          other scripts have added event handlers.
   */
        
  /**
   * Return an array of event handlers.
   * <p>
   * For a list of all the event handlers, please see {@link baja.Subscriber#attach}.
   * <p>
   * To access multiple handlers, insert a space between the handler names.
   *
   * @function
   * @name baja.Component#getHandlers
   *
   * @see baja.Subscriber
   * @see baja.Component#detach
   * @see baja.Component#attach
   * @see baja.Component#hasHandlers
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
   * <p>
   * For a list of all the event handlers, please see {@link baja.Subscriber#attach}.
   *
   * @function
   * @name baja.Component#hasHandlers
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
    
  /**
   * Returns the default parameter for an Action.
   * <p>
   * For unmounted Components, by default it calls <code>Action.getParameterDefault()</code>. 
   * If mounted in a Proxy Component Space, this will result in an asynchronous network call.
   * <p>
   * Here's an example of how to invoke the method...
   * <pre>
   *   // A resolved and mounted Component...
   *   myComp.getActionParameterDefault({
   *     slot: "myAction", 
   *     ok: function (param) {
   *       // Called once we're received the parameter. Note that param can be null
   *       // if there's no parameter for the Action.
   *     },
   *     fail: function (err) {
   *       // Called if the method throws an exception on the Server or can't execute for some reason (optional)
   *     },
   *     batch // if defined, any network calls will be batched into this object (optional)
   *   });
   * <\pre>
   * For callbacks, the 'this' keyword is set to the Component instance.
   *
   * @param {Object} obj the Object Literal for the method's arguments.
   * @param {baja.Action|String} obj.slot the Action or Action name.
   * @param {Function} [obj.ok] the ok callback. Called once the Action Parameter Default has been received.
   *                                             Any return value is passed to this function (could be null
   *                                             if no Action parameter is defined).
   * @param {Function} [obj.fail] the fail callback.
   * @param {baja.comm.Batch} [obj.batch] if defined, any network calls will be batched into this object.
   *
   * @returns {baja.Value} if the Component is not mounted in a Proxy Component Space, this method will return a value.
   *                      If there's no Action Parameter Default then null will be returned.                    
   */
  baja.Component.prototype.getActionParameterDefault = function (obj) {
    obj = objectify(obj, "slot");
    
    var cb = new Callback(obj.ok, obj.fail, obj.batch);
    
    // Ensure 'this' is Component in callbacks...
    setContextInOkCallback(this, cb);
    setContextInFailCallback(this, cb);
    
    var slot = this.getSlot(obj.slot);
    
    try { 
      // Check arguments  
      if (slot === null) {
        throw new Error("Unable to find Action: " + obj.slot);
      }
      if (!slot.isAction()) {
        throw new Error("Slot is not an Action: " + obj.slot);
      }
      
      if (this.isMounted() && this.$space.hasCallbacks()) {
        // If mounted then make a network call for the Action invocation
        this.$space.getCallbacks().getActionParameterDefault(this, slot, cb);
      }
      else {
        // If not mounted then just return it from the Slot
        var def = slot.getParamDefault();
        cb.ok(def);
        return def;
      }
    }
    catch (err) {
      cb.fail(err);
    }
  };

  /**
   * Return the knob count for the Component.
   *
   * @returns {Number} the number of knobs installed on the Component
   */
  baja.Component.prototype.getKnobCount = function () {
    return this.$knobCount || 0;
  };
  
  /**
   * Return the Knobs for a particular Slot or the whole Component.
   * <p>
   * If no slot is passed in all the knobs for the Component will be returned.
   *
   * @param {baja.Slot|String} [slot] the Slot or Slot name.
   *
   * @returns {Array} array of knobs
   */
  baja.Component.prototype.getKnobs = function (slot) {
    if (!this.$knobCount) {
      return emptyArray;
    }
    
    if (arguments.length > 0) {
      // Find Knobs for a particular Slot
      slot = this.getSlot(slot);
      
      if (!slot) {
        throw new Error("Invalid Slot: " + slot);
      }
    }
        
    var p, 
        knob, 
        k = []; 
    
    // Build up knobs array
    for (p in this.$knobs) {
      if (this.$knobs.hasOwnProperty(p)) {
        knob = this.$knobs[p];
        if (slot) {
          if (knob.getSourceSlotName() === slot.getName()) {
            k.push(knob);
          }
        }
        else {
          k.push(knob);
        }
      }
    }
    
    return k;
  };
  
  /**
   * Return the Links for a particular Slot or the whole Component.
   * <p>
   * If no slot is passed in all the links for the Component will be returned.
   *
   * @param {baja.Slot|String} [slot] the Slot or Slot name.
   *
   * @returns {Array} array of links.
   */
  baja.Component.prototype.getLinks = function (slot) {
    var links = [];
        
    if (arguments.length === 0) {
       // If no arguments then return all the knobs for this component
      this.getSlots(function (s) {
        return s.isProperty() && s.getType().isLink();
      }).each(function (s) {
        links.push(this.get(s));
      });
    }
    else {
      // Find Links for a particular Slot
      slot = this.getSlot(slot);
      if (slot === null) {
        throw new Error("Invalid Slot: " + slot);
      }
      this.getSlots(function (s) {
        return s.isProperty() && s.getType().isLink() && this.get(s).getTargetSlotName() === slot.getName();
      }).each(function (s) {
        links.push(this.get(s));
      });
    }
    
    return links;
  };
  
  /**
   * Create an instance of a Link to use for a link to the specified source Component.
   * <p>
   * For unmounted Components, by default this method returns a plain baja:Link instance. 
   * If mounted in a Proxy Component Space, this will result in an asynchronous network call.
   * <\pre>
   * For callbacks, the 'this' keyword is set to the Component instance.
   *
   * @param {Object} obj the Object Literal for the method's arguments.
   * @param {baja.Component} obj.source the source Component for the link.
   * @param {baja.Slot|String} obj.sourceSlot the source Slot or Slot name.
   * @param {baja.Slot|String} obj.targetSlot the target Slot or Slot name.
   * @param {Function} [obj.ok] the ok callback. A link will be passed as an argument to this function.
   * @param {Function} [obj.fail] the fail callback.
   * @param {baja.comm.Batch} [obj.batch] if defined, any network calls will be batched into this object.
   *
   * @returns {baja.Value} if the Component is not mounted in a Proxy Component Space, this method will return a value.                  
   */
  baja.Component.prototype.makeLink = function (obj) {
    obj = objectify(obj);
        
    var cb = new Callback(obj.ok, obj.fail, obj.batch);
    
    // Ensure 'this' is Component in callbacks...
    setContextInOkCallback(this, cb);
    setContextInFailCallback(this, cb);
    
    try { 
      strictArg(obj.source, baja.Component);
      
      var source = obj.source,
          sourceSlot = source.getSlot(obj.sourceSlot),
          targetSlot = this.getSlot(obj.targetSlot);
      
      if (!targetSlot) {
        throw new Error("Invalid Source Slot");
      }
      
      if (!sourceSlot) {
        throw new Error("Invalid Target Slot");
      }
      
      if (this.isMounted() && this.$space.hasCallbacks()) {
        // If mounted then make a network call to get the link
        this.$space.getCallbacks().makeLink(source, sourceSlot, this, targetSlot, cb);
      }
      else {
        // If not mounted then just return it from the Slot
        var link = baja.$("baja:Link");
        cb.ok(link);
        return link;
      }
    }
    catch (err) {
      cb.fail(err);
    }
  };
  
  /**
   * Return the permissions for this Component.
   *
   * @returns {baja.Permissions}
   */
  baja.Component.prototype.getPermissions = function () {
    var p = this.$permissions;
    if (!p) {
      if (typeof this.$permissionsStr === "string") {
        p = this.$permissions = baja.Permissions.make(this.$permissionsStr);
      }
      else {
        p = baja.Permissions.all;
      }
    }
    return p;
  };
    
  ////////////////////////////////////////////////////////////////
  // Component Space
  //////////////////////////////////////////////////////////////// 
         
  /**
   * @class Represents a baja:ComponentSpace in BajaScript.
   *
   * @name baja.ComponentSpace
   * @extends baja.NavContainer
   *
   * @param {String} ordInSession
   * @param host
   */   
  baja.ComponentSpace = function (name, ordInSession, host) {
    baja.ComponentSpace.$super.call(this, {
      navName: name
    });
    this.$map = {};
    this.$root = null;
    this.$callbacks = null;
    this.$host = bajaDef(host, null);
    this.$ordInSession = bajaDef(ordInSession, "");
  }.$extend(baja.NavContainer).registerType("baja:ComponentSpace"); 
  
  /**
   * Called to initialize the Component Space.
   * 
   * @private
   */
  baja.ComponentSpace.prototype.init = function () {
  };
  
  /**
   * Mount a Component in the Component Space.
   * <p>
   * This is a private internal method to mount Components into a Component Space.
   *
   * @private
   */
  var mount = function (comp) {    
    var h = comp.getHandle();  
    if (h === null) {
      // TODO: What about automatically generating a handle for a non Proxy Component Space?
      // TODO: Generate error if not a handle?
      return;
    }
    
    if (this.$map.hasOwnProperty(h)) {
      throw new Error("Fatal error: handle already used in Component Space: " + h);
    }
    
    // Set up the Space and Handle reference
    comp.$space = this;
    this.$map[h] = comp;
        
    // Mount any child Components
    var cursor = comp.getSlots().properties();
    while (cursor.next()) {
      if (cursor.get().getType().isComponent()) {
        mount.call(this, comp.get(cursor.get()));
      }
    }
  };
  
  /**
   * Unmount a Component in the Component Space.
   * <p>
   * This is a private internal method to unmount Components into a Component Space.
   *
   * @private
   */
  var unmount = function (comp) {    
    var h = comp.getHandle();  
    if (h === null) {
      // TODO: Generate error if not a handle?
      return;
    }
    
    if (!this.$map.hasOwnProperty(h)) {
      throw new Error("Fatal error: handle not mapped into Space: " + h);
    }
    
    var prevSub = comp.isSubscribed();
    
    // delete the Space and Handle reference (after this isMounted() will return false)
    comp.$space = null;
    delete this.$map[h];
        
    // Unsubscribe Component from all Subscribers
    var subs = comp.$subs.slice(), i;
    for (i = 0; i < subs.length; ++i) {
      subs[i].unsubscribe({
        "comps": comp
      });
    }
    
    // Make sure we're not leased    
    unlease.call(comp);
    
    // If this was subscribed before, make sure this callback is made
    if (prevSub && typeof comp.unsubscribed === "function") {
      try {
        comp.unsubscribed();
      }
      catch (err) {
        baja.error(err);
      }
    }
    
    // TODO: What about nullifying the handle reference on the Component? 
             
    // Unmount any child Components
    var cursor = comp.getSlots().properties();
    while (cursor.next()) {
      if (cursor.get().getType().isComponent()) {
        unmount.call(this, comp.get(cursor.get()));
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
  baja.ComponentSpace.prototype.$fw = function (x, a, b, c) {    
    if (x === "mount") {
      // Mount this Component    
      mount.call(this, /*Component*/a);
    }
    else if (x === "unmount") {
      // Unmount this Component    
      unmount.call(this, /*Component*/a);
    }
  };  
    
  /**
   * Return the root Component of the Component Space.
   * 
   * @returns the root Component for the Space.
   */
  baja.ComponentSpace.prototype.getRootComponent = function () {
    return this.$root;
  };
  
  /**
   * Return the ORD in Session for the Component Space.
   *
   * @returns {baja.Ord}
   */
  baja.ComponentSpace.prototype.getOrdInSession = function () {
    return baja.Ord.make(this.$ordInSession);
  };
    
  /**
   * Return absolute ORD for the Component Space.
   *
   * @returns {baja.Ord}
   */
  baja.ComponentSpace.prototype.getAbsoluteOrd = function () {
    if (this.$host === null) {
      return baja.Ord.DEFAULT;
    }
    return baja.Ord.make(this.$host.getAbsoluteOrd().toString() + "|" + this.$ordInSession);
  };
    
  /**
   * Find the Component via its handle (null if not found).
   * <p>
   * This method does not result in any network calls.
   *
   * @private
   *
   * @param {String} handle the Component's handle.
   *
   * @returns the Component via its handle (null if not found).
   */
  baja.ComponentSpace.prototype.findByHandle = function (handle) {
    strictArg(handle, String);
    return bajaDef(this.$map[handle], null);
  }; 
  
  /**
   * Find the Component via its handle (null if not found).
   * <p>
   * This method may result in an <strong>asynchronous</strong> network call if 
   * the Component can't be found locally and the Space is a Proxy.
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
  baja.ComponentSpace.prototype.resolveByHandle = function (obj) {
    obj = objectify(obj);
    
    var handle = obj.handle,
        cb = new Callback(obj.ok, obj.fail);
    
    try {
      var comp = this.findByHandle(handle);
      if (comp !== null) {
        cb.ok(comp);
      }
      else {
        throw new Error("Could not find Component from Handle");
      }
    }
    catch (err) {
      cb.fail(err);
    }
  }; 
  
  /**
   * Return true if this Component Space has Space callbacks.
   * <p>
   * Space callbacks are normally used to make network calls.
   *
   * @private
   *
   * @returns {Boolean}
   */   
  baja.ComponentSpace.prototype.hasCallbacks = function () {
    return this.$callbacks !== null;
  };
  
  /**
   * Return the Space Callbacks.
   *
   * @private
   *
   * @returns Space Callbacks
   */ 
  baja.ComponentSpace.prototype.getCallbacks = function () {
    return this.$callbacks;
  };  
  
  /**
   * Sync the Component Space.
   * <p>
   * If the Space is a Proxy, this method will result in an 
   * <strong>asynchronous</strong> network call to sync the master Space with this one.
   * <p>
   * An Object Literal is used for the method's arguments.
   *
   * @param {Object} [obj] the Object Literal for the method's arguments.
   * @param {Function} [obj.ok] the ok callback. Called once the Component Space has
   *                            been successfully synchronized with the Server.
   * @param {Function} [obj.fail] the fail callback. Called If the Component Space 
   *                              can't be synchronized.
   * @param {baja.comm.Batch} [obj.batch] if defined, any network calls will be batched into this object.
   */
  baja.ComponentSpace.prototype.sync = function (obj) {
    obj = objectify(obj, "ok");
    new Callback(obj.ok, obj.fail).ok();
  };
  
  /**
   * Return the Nav ORD of the Root Component.
   *
   * @private
   *
   * @returns {baja.Ord}
   */
  baja.ComponentSpace.prototype.getNavOrd = function () {
    return this.$root === null ? null : this.$root.getNavOrd();
  };
  
  /**
   * Access the Nav Children.
   *
   * @see baja.NavContainer#getNavChildren
   *
   * @returns {String}
   */
  baja.ComponentSpace.prototype.getNavChildren = function (obj) {
    obj = objectify(obj, "ok");
    if (this.$root) {
      this.$root.getNavChildren(obj);
    }
    else {
      obj.ok([]);
    }
  };
  
  /**
   * Return the Nav Icon.
   *
   * @returns {baja.Icon}
   */
  baja.ComponentSpace.prototype.getNavIcon = function () {
    return this.$root ? this.$root.getNavIcon() : baja.ComponentSpace.$super.prototype.getNavIcon.call(this);
  };
        
  /**
   * @class Represents a baja:Host in BajaScript.
   *
   * @name baja.Host
   * @extends baja.Object
   */  
  baja.Host = function () { 
    baja.Host.$super.apply(this, arguments);
  }.$extend(baja.NavContainer).registerType("baja:Host");
  
  /**
   * Return a Host's Nav ORD.
   *
   * @private
   *
   * @returns {baja.Ord}
   */
  baja.Host.prototype.getNavOrd = function () {
    return this.getAbsoluteOrd();
  };
  
  /**
   * Return a Host's Absolute ORD.
   *
   * @private
   *
   * @returns {baja.Ord}
   */
  baja.Host.prototype.getAbsoluteOrd = function () {
    return null;
  };
  
  /**
   * @class Represents a baja:LocalHost in BajaScript.
   *
   * @name baja.LocalHost
   * @extends baja.Host
   */  
  baja.LocalHost = function () { 
    baja.LocalHost.$super.call(this, {
      navName: "localhost",
      icon: "module://icons/x16/localhost.png"
    });
  }.$extend(baja.Host).registerType("baja:LocalHost");
  
  /**
   * Return a Local Host's Absolute ORD.
   *
   * @private
   *
   * @returns {baja.Ord}
   */
  baja.LocalHost.prototype.getAbsoluteOrd = function () {
    return baja.Ord.make("local:");
  };

  ////////////////////////////////////////////////////////////////
  // Subscriber
  //////////////////////////////////////////////////////////////// 
  
  /**
   * @class Component Subscriber used to subscribe to multiple Components for events.
   *
   * @name baja.Subscriber
   * @extends BaseBajaObj
   */    
  baja.Subscriber = function () {
    this.$comps = [];
  }.$extend(BaseBajaObj);
  
  // Mix-in the event handlers for baja.Subscriber
  baja.event.mixin(baja.Subscriber.prototype);
  
  // The following comments have been added for the benefit of JsDoc Toolkit...
  
  /**
   * Attach an Event Handler to this Subscriber.
   * <p>
   * A Subscriber can be used to subscribe to multiple Components
   * in the Station and can be used to listen for Component Events. 
   * For instance, a common one would be a Property changed event...
   * <pre>
   *   // sub is a Subscriber and is subscribed to a Component
   *   sub.attach("changed", function (prop, cx) {
   *     if (prop.getName() === "out") {
   *       baja.outln("The output of the point is: " + this.getOutDisplay());
   *     }
   *   });
   * </pre>
   * An event handler consists of a name and a function. When the
   * function is called, 'this' will map to the target Component.
   * <p> 
   * Here are some examples of the different event handlers that can be 
   * attached to a Component...
   * <pre>
   *   // Property Changed
   *   sub.attach("changed", function (prop, cx) {
   *     // prop: the Property that has changed
   *     // cx: the Context (used internally)
   *   });
   *   
   *   // Property Added
   *   sub.attach("added", function (prop, cx) {
   *     // prop: the Property that has been added
   *     // cx: the Context (used internally)
   *   });
   *   
   *   // Property Removed
   *   sub.attach("removed", function (prop, val, cx) {
   *     // prop: the Property that has been removed
   *     // val: the old value of the Property
   *     // cx: the Context (used internally)
   *   });
   *   
   *   // Property Renamed
   *   sub.attach("renamed", function (prop, oldName, cx) {
   *     // prop: the Property that has been renamed
   *     // oldName: the old slot name
   *     // cx: the Context (used internally)
   *   });
   *   
   *   // Dynamic Slots Reordered
   *   sub.attach("reordered", function (cx) {
   *     // cx: the Context (used internally)
   *   });
   *   
   *   // Topic Fired
   *   sub.attach("topicFired", function (topic, event, cx) {
   *     // topic: the Topic that has been fired
   *     // event: the Topic event data (can be null)
   *     // cx: the Context (used internally)
   *   });
   *   
   *   // Slot Flags Changed
   *   sub.attach("flagsChanged", function (slot, cx) {
   *     // slot: the slot whose flags have changed
   *     // cx: the Context (used internally)
   *   });
   *   
   *   // Slot Facets Changed
   *   sub.attach("facetsChanged", function (slot, cx) {
   *     // slot: the slot whose facets have changed
   *     // cx: the Context (used internally)
   *   });
   * 
   *   // Component subscribed
   *   sub.attach("subscribed", function (cx) {
   *     // cx: the Context (used internally)
   *   });
   * 
   *   // Component unsubscribed
   *   sub.attach("unsubscribed", function (cx) {
   *     // cx: the Context (used internally)
   *   });
   *
   *   // Component unmounted (called just before Component is removed from parent)
   *   sub.attach("unmount", function (cx) {
   *     // cx: the Context (used internally)
   *   });
   * 
   *   // Component renamed in parent
   *   sub.attach("componentRenamed", function (oldName, cx) {
   *     // cx: the Context (used internally)
   *   });
   * 
   *   // Component's flags changed in parent
   *   sub.attach("componentFlagsChanged", function (cx) {
   *     // cx: the Context (used internally)
   *   });
   * 
   *   // Component's facets changed in parent
   *   sub.attach("componentFacetsChanged", function (cx) {
   *     // cx: the Context (used internally)
   *   });
   * 
   *   // Component reordered in parent
   *   sub.attach("componentReordered", function (cx) {
   *     // cx: the Context (used internally)
   *   });
   * </pre>
   * <p>
   * An Object Literal can be used to specify multiple handlers. For example...
   * <pre>
   *   var sub = new baja.Subscriber();
   *   sub.attach({
   *     changed: function (prop, cx) {
   *     },
   *     subscribed: function (cx) {
   *     }
   *   });
   * </pre>
   * <p>
   * Spaces can be used in a name to specify a function for multiple events...
   * <pre>
   *   var sub = new baja.Subscriber();
   *   sub.attach("subscribed changed", function () {
   *     updateGui(this);
   *   });
   * </pre>
   *
   * @function
   * @name baja.Subscriber#attach
   *
   * @see baja.Component#attach
   * @see baja.Subscriber#detach
   * @see baja.Subscriber#getHandlers
   * @see baja.Subscriber#hasHandlers
   * @see baja.Slot
   *
   * @param {String} event handler name.
   * @param {Function} func the event handler function.
   */  
  
  /**
   * Detach an Event Handler from the Subscriber.
   * <p>
   * If no arguments are used with this method then all events are removed.
   * <p>
   * For a list of all the event handlers, please see {@link baja.Subscriber#attach}.
   * <p>
   * A String with spaces can be supplied to remove multiple event handlers. For example...
   * <pre>
   *   sub.detach("subscribed changed"); // Remove all subscribed and changed event handlers
   * </pre>
   * 
   * @function
   * @name baja.Subscriber#detach
   *
   * @see baja.Component#attach
   * @see baja.Subscriber#attach
   * @see baja.Subscriber#getHandlers
   * @see baja.Subscriber#hasHandlers
   *
   * @param {String} [hName] the name of the handler to detach from the Subscriber.
   * @param {Function} [func] the function to remove from the Subscriber. It's recommended to supply this just in case
   *                          other scripts have added event handlers.
   */
    
  /**
   * Return an array of event handlers.
   * <p>
   * For a list of all the event handlers, please see {@link baja.Subscriber#attach}.
   * <p>
   * To access multiple handlers, insert a space between the handler names.
   *
   * @function
   * @name baja.Subscriber#getHandlers
   *
   * @see baja.Component#attach
   * @see baja.Subscriber#detach
   * @see baja.Subscriber#attach
   * @see baja.Subscriber#hasHandlers
   *
   * @param {String} hName the name of the handler
   * @returns {Array}
   */
  
  /**
   * Return true if there any handlers registered for the given handler name.
   * <p>
   * If no handler name is specified then test to see if there are any handlers registered at all.
   * <p>
   * For a list of all the event handlers, please see {@link baja.Subscriber#attach}.
   * <p>
   * Multiple handlers can be tested for by using a space character between the names.
   *
   * @function
   * @name baja.Subscriber#hasHandlers
   *
   * @see baja.Component#attach
   * @see baja.Subscriber#detach
   * @see baja.Subscriber#attach
   * @see baja.Subscriber#getHandlers
   *
   * @param {String} [hName] the name of the handler. If undefined, then see if there are any 
   *                         handlers registered at all.
   * @returns {Boolean}
   */
    
  /**
   * Return an array of the Components currently being 
   * subscribed to by this Subscriber.
   *
   * @returns {Array} a copy of the array used to subscribe Components (baja.Component).
   */
  baja.Subscriber.prototype.getComponents = function () {
    return this.$comps.slice();
  };
  
  /**
   * Subscribe a Component or a number of Components.
   * <p>
   * This will put the Components into subscription if they are not already subscribed and are mounted.
   * The Subscription will last until the page is refreshed or unsubscribe is called.
   * <p>
   * If the Components are mounted and able to be subscribed, this will result in 
   * an <strong>asynchronous</strong> network call.
   * <p>
   * A Component instance, array of Components or an optional Object Literal can be used to 
   * specify the method's arguments...
   * <pre>
   *   // Subscribe a single Component
   *   sub.subscribe(aComp);
   *
   *   // ...or subscribe an array of Components...
   *   sub.subscribe([aComp1, aComp2]);
   *
   *   // ...or use an Object Literal for more arguments...
   *   sub.subscribe({
   *     comps: [aComp1, aComp2], // Can also just be an singular Component instance
   *     ok: function () {
   *       // Called once the Components are subscribed (optional)
   *     },
   *     fail: function (err) {
   *       // Called if the Components fail to subscribe (optional)
   *     },
   *     batch // if defined, any network calls will be batched into this object (optional)
   *   });
   * </pre>
   * For callbacks, the 'this' keyword is set to the comps property.
   *
   * @param {Object} [obj] the Object Literal used for the method's arguments.
   * @param {Function} [obj.ok] the ok callback. Called once the Components have been subscribed.
   * @param {Function} [obj.fail] the fail callback. Called if the Components fail to subscribe.
   *                              Any errors will be passed to this function.
   * @param {baja.comm.Batch} [obj.batch] if defined, any network calls will be batched into this object.
   */
  baja.Subscriber.prototype.subscribe = function (obj) {  
    obj = objectify(obj, "comps");
    
    var comps = obj.comps,
        cb = new Callback(obj.ok, obj.fail, obj.batch);
        
    // Ensure 'this' is Component in callbacks...
    setContextInOkCallback(comps, cb);
    setContextInFailCallback(comps, cb);
    
    try {    
      // Ensure we have an array of valid Components to subscribe too
      if (!(comps instanceof Array)) {
        comps = [comps];
      }
      
      var c, i;

      // Check for errors first
      for (i = 0; i < comps.length; ++i) {
        c = comps[i];
      
        // Make sure we have a Component
        strictArg(c, baja.Component); 
        
        if (!c.isMounted()) {
          throw new Error("Cannot subscribe unmounted Component!");
        }
      } 

      var space = null,   
          ords = [],  
          compsToSub = [],          
          prevSub;    
      
      // Remove references and see if we need a network call    
      for (i = 0; i < comps.length; ++i) {
        c = comps[i];
            
        if (!space) {
          space = c.getComponentSpace();
        }
        
        prevSub = c.isSubscribed();
              
        // Add to this Subscribers Component array
        if (!this.$comps.contains(c)) {
          this.$comps.push(c);
        }
      
        // Make sure this Subscriber is listed in the Subscribed Component
        if (!c.$subs.contains(this)) {
          c.$subs.push(this);
        }
        
        // If the Component is now subscribed but was previously unsubscribed
        // then make a network call
        if (c.isSubscribed() && !prevSub) {
          ords.push("h:" + c.getHandle());
          compsToSub.push(c);
        }
      }
          
      // If there is nothing to subscribe to at this point then just bail
      if (ords.length > 0 && space.hasCallbacks() && bajaDef(obj.netCall, true)) { 
      
        // Signal that each Component has been subscribed
        cb.addOk(function (ok, fail, resp) {
          var i;
          for (i = 0; i < compsToSub.length; ++i) {
            try {
               compsToSub[i].$fw("fwSubscribed");
            }
            catch (err) {
              baja.error(err);
            }
          }
          
          ok();
        });
        
        // Make the network call through the Space    
        space.getCallbacks().subscribe(ords, cb, obj.importAsync);
      }
      else {
        cb.ok();
      }
    }
    catch (err) {
      cb.fail(err);
    }
  };
  
  /**
   * An internal private method for subscribing Components via their ORDs. Please note, this method
   * is strictly intended for Tridium developers only!
   *
   * @private
   * @internal
   *
   * @param {Object} [obj] the Object Literal used for the method's arguments.
   * @param {Array} ords an Array of String ORDs that should resolve to Components for subscription.
   * @param {baja.ComponentSpace} space the Component Space used for ORD resolution.
   * @param {Function} [obj.ok] the ok callback. Called once the Components have been subscribed.
   * @param {Function} [obj.fail] the fail callback. Called if the Components fail to subscribe.
   *                              Any errors will be passed to this function.
   * @param {baja.comm.Batch} [obj.batch] if defined, any network calls will be batched into this object.
   */
  baja.Subscriber.prototype.$ordSubscribe = function (obj) {      
    var ords = obj.ords,
        space = obj.space,
        cb = new Callback(obj.ok, obj.fail, obj.batch),
        that = this;
    
    try {     
      // Ensure these Components are all subscribed
      cb.addOk(function(ok, fail, handles) {
        // Remove references and see if we need a network call    
        var i,
            c,
            prevSub;
            
        for (i = 0; i < handles.length; ++i) {
          // Attempt to find the Component locally
          c = space.findByHandle(handles[i]);     
          
          if (c) {
            // Mark the Component as subscribed         
            prevSub = c.isSubscribed();
                      
            // Add to this Subscribers Component array
            if (!that.$comps.contains(c)) {
              that.$comps.push(c);
            }
          
            // Make sure this Subscriber is listed in the Subscribed Component
            if (!c.$subs.contains(that)) {
              c.$subs.push(that);
            }
            
            // If this is now subscribed then fire the relevant callback
            if (c.isSubscribed() && !prevSub) {
              try {
                 c.$fw("fwSubscribed");
              }
              catch (err) {
                baja.error(err);
              }
            }
          }
          else {
            baja.error("Could not Batch Resolve Subscribe: " + handles[i]);
          }
          
          ok();
        }
      });
             
      // Make the network call through the Space    
      space.getCallbacks().subscribe(ords, cb, /*importAsync*/false);
    }
    catch (err) {
      cb.fail(err);
    }
  };
  
  /**
   * Unsubscribe a Component or a number of Components.
   * <p>
   * This will unsubscribe the mounted Components if they are not already unsubscribed.
   * <p>
   * If the Components are able to be unsubscribed, this will result in 
   * an <strong>asynchronous</strong> network call.
   * <p>
   * A Component instance, array of Components or an optional Object Literal can be used to 
   * specify the method's arguments...
   * <pre>
   *   // Unsubscribe a single Component
   *   sub.unsubscribe(aComp);
   *
   *   // ...or unsubscribe an array of Components...
   *   sub.unsubscribe([aComp1, aComp2]);
   *
   *   // ...or use an Object Literal for more arguments...
   *   sub.unsubscribe({
   *     comps: [aComp1, aComp2], // Can also just be an singular Component instance
   *     ok: function () {
   *       // Called once the Components are unsubscribed (optional)
   *     },
   *     fail: function (err) {
   *       // Called if the Components fail to unsubscribe (optional)
   *     },
   *     batch // if defined, any network calls will be batched into this object (optional)
   *   });
   * </pre>
   * For callbacks, the 'this' keyword is set to the comps property.
   *
   * @param {Object} [obj] the Object Literal used for the method's arguments.
   * @param {Function} [obj.ok] the ok callback. Called once the Components have been unsubscribed.
   * @param {Function} [obj.fail] the fail callback. Called if the Components fail to subscribe.
   *                              Any errors will be passed to this function.
   * @param {baja.comm.Batch} [obj.batch] if defined, any network calls will be batched into this object.
   */
  baja.Subscriber.prototype.unsubscribe = function (obj) { 
    obj = objectify(obj, "comps");
  
    var comps = obj.comps,
        cb = new Callback(obj.ok, obj.fail, obj.batch);
    
    // Ensure 'this' is Component in callbacks...
    setContextInOkCallback(this, cb);
    setContextInFailCallback(this, cb);
          
    try {        
      // Ensure we have an array of valid Components to subscribe too
      if (!(comps instanceof Array)) {
        comps = [comps];
      }
      
      var c, i, j, k;
      
      // Check for errors first
      for (i = 0; i < comps.length; ++i) {
        c = comps[i];
      
        // Make sure we have a Component
        strictArg(c, baja.Component); 
      }
      
      var space = null,    
          ords = [],
          prevSub;
      
      // Add references and see if we need a network call
      for (i = 0; i < comps.length; ++i) {
        c = comps[i];
            
        if (!space) {
          space = c.getComponentSpace();
        }
        
        prevSub = c.isSubscribed();
                    
        // Attempt to remove Component from this Subscribers Component list
        for (j = 0; j < this.$comps.length; ++j) {
          if (this.$comps[j] === c) {
            this.$comps.splice(j, 1);
            break;
          }
        }
        
        // Remove this Subscriber from the Component
        for (k = 0; k < c.$subs.length; ++k) { 
          if (c.$subs[k] === this) {        
            c.$subs.splice(k, 1);
            break;
          }
        }
        
        // If the Component is not subscribed but was previously subscribed then make a network call
        if (!c.isSubscribed() && prevSub && c.isMounted()) {
          ords.push("h:" + c.getHandle());
        }
      }
      
      // If there is nothing to unsubscribe at this point then just bail
      if (ords.length > 0 && space.hasCallbacks()) {   
        // Make the network call through the Space    
        space.getCallbacks().unsubscribe(ords, cb);
      }
      else {
        cb.ok();
      }
    }
    catch (err) {
      cb.fail(err);
    }
  };
  
  /**
   * Unsubscribe all Components from a Subscriber.
   * <p>
   * This will unregister all Components from this Subscriber.
   * <p>
   * If the Components are able to be unsubscribed, this will result in 
   * an <strong>asynchronous</strong> network call.
   * <p>
   * An Object Literal is used to specify the method's arguments...
   * <pre>
   *   // ...or use an Object Literal for more arguments...
   *   sub.unsubscribeAll({
   *     ok: function () {
   *       // Called once the Components are unsubscribed (optional)
   *     },
   *     fail: function (err) {
   *       // Called if the Components fail to unsubscribe (optional)
   *     },
   *     batch // if defined, any network calls will be batched into this object (optional)
   *   });
   * </pre>
   * For callbacks, the 'this' keyword is set to the internal component array.
   *
   * @param {Object} [obj] the Object Literal used for the method's arguments.
   * @param {Function} [obj.ok] the ok callback. Called once the Components have been unsubscribed.
   * @param {Function} [obj.fail] the fail callback. Called if the Components fail to subscribe.
   *                              Any errors will be passed to this function.
   * @param {baja.comm.Batch} [obj.batch] if defined, any network calls will be batched into this object.
   */
  baja.Subscriber.prototype.unsubscribeAll = function (obj) {
    obj = objectify(obj);
    obj.comps = this.$comps.slice();
    this.unsubscribe(obj);
  };
    
  /**
   * Return true if the Component is subscribed in this Subscriber.
   *
   * @param {Object} comp  the Component to be tested for Subscription.
   * @returns {Boolean}
   */
  baja.Subscriber.prototype.isSubscribed = function (comp) {
    strictArg(comp, baja.Component);
    return this.$comps.contains(comp);
  };
  
  ////////////////////////////////////////////////////////////////
  // ControlPoint
  //////////////////////////////////////////////////////////////// 
  
  /**
   * @class Represents a control:ControlPoint in BajaScript.
   *
   * @name baja.ControlPoint
   * @private
   * @inner
   * @extends baja.Component
   */  
  var ControlPoint = function () {
    ControlPoint.$super.apply(this, arguments);
  }.$extend(baja.Component).registerType("control:ControlPoint");
  
  /**
   * Return the Facets for a Slot.
   * <p>
   * If no arguments are provided and the Complex has a parent, the 
   * facets for the parent's Property will be returned. 
   *
   * @name baja.ControlPoint#getFacets
   * @function
   * @private
   * @inner
   *
   * @param {baja.Slot|String} [slot]  the Slot or Slot name.
   * @returns {baja.Facets} the Facets for the Slot (or null if Slot not found) or
   *                        the parent's Property facets.
   */
  ControlPoint.prototype.getFacets = function (slot) {
    // Attempt to match Station Component's 'getSlotFacets' implementation...
    if (slot) {
      slot = this.getSlot(slot);
      if (slot) {
        var nm = slot.getName();
        if (nm.match(/^(out|in[0-9][1-6]?|fallback|override|emergencyOverride|set)/)) {
          return this.get("facets");
        }
      }      
    }    
    
    // Call base class 'getFacets'
    return ControlPoint.$super.prototype.getFacets.apply(this, arguments);
  };
  
}(baja, BaseBajaObj));
//
// Copyright 2010, Tridium, Inc. All Rights Reserved.
//

/**
 * Core Object Architecture for BajaScript.
 *
 * @author Gareth Johnson
 * @version 1.0.0.0
 */

//JsLint options (see http://www.jslint.com )
/*jslint rhino: true, onevar: false, plusplus: true, white: true, undef: false, nomen: false, eqeqeq: true, 
bitwise: true, regexp: true, newcap: true, immed: true, strict: false, indent: 2, vars: true, continue: true */

// Globals for JsLint to ignore 
/*global baja, BaseBajaObj*/ 
  
(function obj(baja) {

  // Use ECMAScript 5 Strict Mode
  "use strict";
   
  // Create local for improved minification
  var strictArg = baja.strictArg,
      strictAllArgs = baja.strictAllArgs,
      bajaDef = baja.def,
      objectify = baja.objectify,
      bajaHasType = baja.hasType;
   
  ////////////////////////////////////////////////////////////////
  // Baja Objects
  //////////////////////////////////////////////////////////////// 

  /**
   * @class Represents baja:Object in BajaScript.
   * <p>
   * Since this Constructor represents an abstract class, it should never
   * be directly used to create a new Object.
   *
   * @name baja.Object
   * @extend BaseBajaObj
   */
  baja.Object = function () {
    baja.Object.$super.apply(this, arguments);  
  }.$extend(BaseBajaObj);
  
  // Default equals equivalent  
  var equalsEquivalent = function (obj) {
    // By default, just perform equals
    return this.equals(obj);
  };
  
  /**
   * Equivalence test.
   * <p>
   * Equivalent is used to compare if two objects have equivalent
   * state, but might not want to return true for equals since it
   * it has implied semantics for many operations.  The default
   * implementation returns the result of <code>equals()</code>.
   * 
   * @param obj
   * @returns {Boolean}
   */
  baja.Object.prototype.equivalent = equalsEquivalent;

  var objectGetIcon = function () {
    return this.getType().getIcon();
  };
  
  /**
   * Return the Object's Icon.
   * 
   * @returns {baja.Icon}
   */
  baja.Object.prototype.getIcon = objectGetIcon;
  
  /**
   * @class Represents baja:Singleton in BajaScript.
   * <p>
   * Since this Constructor represents an abstract class, it should never
   * be directly used to create a new Object.
   *
   * @name baja.Singleton
   * @extends baja.Object
   */
  baja.Singleton = function () {
    baja.Singleton.$super.apply(this, arguments); 
  }.$extend(baja.Object).registerType("baja:Singleton");
  
  /**
   * @class Represents baja:Value in BajaScript.
   * <p>
   * Since this Constructor represents an abstract class, it should never
   * be directly used to create a new Object.
   *
   * @name baja.Value
   * @extends baja.Object
   */
  baja.Value = function () {
    baja.Value.$super.apply(this, arguments);
  }.$extend(baja.Object);
  
  // The default newCopy method  
  var defaultNewCopy = function (exact) {
    return this;
  };
  
  /**
   * Every value may be cloned using the newCopy method.
   * <p>
   * Please note that Simples are immutable so they don't
   * allocate a new instance.   
   *
   * @see baja.Simple
   *
   * @param {Boolean} [exact] true if an exact copy of the value should be made (only valid in the Component architecture).
   * @returns a copy of the value (or the same instance if the value is a Simple).
   */
  baja.Value.prototype.newCopy = defaultNewCopy;
    
  // A caching function wrapper for decodeFromString
  var cacheDecode = function (decodeFunc) {
    // Since Simples are immutable, this function will cache the String used to decode the Simple
    // so when encodeToString is called, this string can be returned
    return function decodeFromString(str) {
      var v = decodeFunc.call(this, str);
      v.$cEncStr = str;
      return v;    
    };
  };

  // A caching function wrapper for encodeToString
  var cacheEncode = function (encodeFunc) {
    // Since Simples are immutable, this function will attempt to get or create a cached string 
    // encoded value
    return function encodeToString() {
      if (this.$cEncStr === undefined) {
        this.$cEncStr = encodeFunc.call(this);
      }
      return this.$cEncStr;
    };
  };
  
  // Removes caching wrapper for Simple constants (mainly needed for number Simples)
  var uncacheConstantEncodeDecode = function (constant) {
    // Take the encodeToString and decodeToString on the prototype chain 
    // and apply it directly as a property on the constant
    var c = constant; // Workaround for JsLint
    constant.decodeFromString = c.decodeFromString;
    constant.encodeToString = c.encodeToString;
    return constant;
  };
  
  /**
   * @class Represents baja:Simple in BajaScript.
   * <p>
   * Simples are immutable and represent primitive data types in Niagara. They are the
   * basic building blocks of the architecture. Simples contain no slots themselves but do
   * contain an implicit data value that can be encoded and decoded in a String format.
   * <p>
   * Simples must be immutable and under no circumstances should there be any attempt
   * to modify the contents of a Simple.
   * <p>
   * all Simples must conform to the following conventions... 
   * <ul>
   *   <li>Define a DEFAULT instance on the Simple Constructor.</li>
   *   <li>Define a make method.</li>
   *   <li>Define a decodeFromString method on the Object's instance that takes a String and returns an instance of the Simple.</li>
   *   <li>Define an encodeToString method on the Object's instance that encodes the value to a String.</li>
   * </ul>
   * <p>
   * Since this Constructor represents an abstract class, it should never
   * be directly used to create a new Object.
   *
   * @name baja.Simple
   * @extends baja.Value
   */
  baja.Simple = function () { 
    baja.Simple.$super.apply(this, arguments);
  }.$extend(baja.Value);
  
  /**
   * Equality test.
   * 
   * @param obj
   * @returns {Boolean}
   */
  baja.Simple.prototype.equals = function (obj) {
    // Comparing in via encodeToString is ok because most Simples
    // lazily cache their string encoding (since they're all immutable)    
    return bajaHasType(obj) && 
           obj.getType().equals(this.getType()) && 
           obj.encodeToString() === this.encodeToString();
  };
      
  ////////////////////////////////////////////////////////////////
  // Default Simple
  //////////////////////////////////////////////////////////////// 
  
  /**
   * @class DefaultSimple
   * <p>
   * Most of the core Simples in BajaScript are represented (i.e. 'baja:String', 'baja:Double' etc). However, they'll always 
   * be some Simples that BajaScript won't have support for. If a dedicated JS Constructor for a Simple can't be found, it'll
   * default back to an instance of a DefaultSimple.
   * <p>
   * A DefaultSimple holds the decoded String representation of a Simple.
   * <p>
   * When creating a Simple, always use the 'make' method instead of creating a new Object.
   *
   * @name baja.DefaultSimple
   * @extends baja.Simple
   */
  baja.DefaultSimple = function (val) {
    baja.DefaultSimple.$super.apply(this, arguments);    
    this.$val = strictArg(val || "", String);
  }.$extend(baja.Simple);
  
  /**
   * Default DefaultSimple instance.
   */
  baja.DefaultSimple.DEFAULT = new baja.DefaultSimple();
    
  /**
   * Make a DefaultSimple.
   *
   * @param {String} str  the String to be used for this Simple
   * @returns {baja.DefaultSimple} an instance of the Simple
   */
  baja.DefaultSimple.prototype.make = function (str) {
    return this.decodeFromString(str);
  };
  
  /**
   * Decode a DefaultSimple from a String
   *
   * @param {String} str
   * @returns {baja.DefaultSimple}
   */
  baja.DefaultSimple.prototype.decodeFromString = function (str) {
    var s = new baja.DefaultSimple(str);
    s.getType = this.getType;
    return s;
  };
  
  /**
   * Encode a DefaultSimple to a String.
   *
   * @returns {String}
   */
  baja.DefaultSimple.prototype.encodeToString = function () {
    return this.$val;
  };
  
  // Register Type
  baja.DefaultSimple.registerType("baja:Simple");
  
  /**
   * Return the String encoding of a DefaultSimple.
   *
   * @returns {String}
   */  
  baja.DefaultSimple.prototype.valueOf = function () {
    return this.$val;
  };
  
  /**
   * Return the String encoding of a DefaultSimple.
   *
   * @returns {String}
   */  
  baja.DefaultSimple.prototype.toString = function () {
    return this.$val;
  };
    
  ////////////////////////////////////////////////////////////////
  // Augmented ECMAScript Baja Objects
  //////////////////////////////////////////////////////////////// 
  
  // New copy that gets the value of the object for the clone
  var valueOfNewCopy = function (exact) {
    return this.valueOf();
  };
  
  // Equals that uses valueOf for the comparison
  var valueOfEquals = function (obj) { 
    return bajaHasType(obj) && 
           obj.getType().equals(this.getType()) && 
           obj.valueOf() === this.valueOf();
  };
   
  /**
   * @class Represents baja:String in BajaScript.
   * <p>
   * All JavaScript Strings are augmented to be baja:String objects.
   *
   * @name String
   */ 

  /**
   * Default String instance.
   */   
  String.DEFAULT = "";
  
  /**
   * Make a String.
   * 
   * @param {String} [str]
   * @returns {String}
   */
  String.make = function (str) {
    if (str === undefined) {
      return String.DEFAULT;
    }
    if (typeof str !== "string") {
      throw new Error("Must supply a String when making BString instances: " + str);
    }
    return str;
  };
  
  /**
   * Make a String.
   *
   * @param {String} [str]
   * @returns {String}
   */
  String.prototype.make = function (str) {
    return String.make(str);
  };
  
  /**
   * Decode a String.
   *
   * @param {String} str
   * @returns {String}
   */
  String.prototype.decodeFromString =  function prototype(str) {
    return str;
  };
  
  /**
   * Encode a String.
   *
   * @returns {String}
   */
  String.prototype.encodeToString = function () {
    return String(this);
  };
    
  // Register String with a Baja Type
  String.registerType("baja:String");
  
  /**
   * Returns a new String with the first letter Capitalized.
   *
   * @returns {String}
   */
  String.prototype.capitalizeFirstLetter = function () {
    if (this.length > 0) {
      return this.charAt(0).toUpperCase() + this.substring(1, this.length);
    }
    else {
      return this;
    }
  };
  
  /**
   * Replace patterned items in a string from an Object Map.
   * <p>
   * <pre>
   *   // For example...
   *   var str = "The weather is {state}!";
   *   str = str.patternReplace({state: "really warm"});
   * </pre>
   *
   * @returns {String}
   */
  String.prototype.patternReplace = function (obj) {
    return this.replace(/\{[a-zA-Z0-9]*\}/g, function (match) {
      match = match.substring(1, match.length - 1);
      return typeof obj[match] === "string" ? obj[match] : match;
    });
  };
  
  /**
   * Return the Symbol used for encoding this data type (primarily used for facets).
   *
   * @returns {String}
   */
  String.prototype.getDataTypeSymbol = function () {
    return "s";
  };
  
  /**
   * Equality test.
   * 
   * @function
   *
   * @param obj
   * @returns {Boolean}
   */
  String.prototype.equals = valueOfEquals;
  
  /**
   * Equivalence test.
   * <p>
   * Equivalent is used to compare if two objects have equivalent
   * state, but might not want to return true for equals since it
   * it has implied semantics for many operations.  The default
   * implementation returns the result of <code>equals()</code>.
   *
   * @function
   * 
   * @param obj
   * @returns {Boolean}
   */
  String.prototype.equivalent = equalsEquivalent;
  
  /**
   * New Copy.
   *
   * @function
   *
   * @returns {String}
   */
  String.prototype.newCopy = valueOfNewCopy;
  
  /**
   * Return the Object's Icon.
   *
   * @function
   * 
   * @returns {baja.Icon}
   */
  String.prototype.getIcon = objectGetIcon;
  
  /**
   * @class Represents a baja:Boolean in BajaScript.
   * <p>
   * Augments Boolean to be a baja:Boolean.
   *
   * @name Boolean
   */
   
  /**
   * Default Boolean instance.
   */
  Boolean.DEFAULT = false;

  /**
   * Make a Boolean.
   *
   * @param {Boolean} b
   * @returns {Boolean}
   */
  Boolean.make = function (b) {
    if (b === undefined) {
      return Boolean.DEFAULT;
    }
    if (typeof b !== "boolean") {
      throw new Error("Must supply a Boolean when making BBoolean instances: " + b);
    }
    return b;
  };
  
  /**
   * Make a Boolean.
   *
   * @param {Boolean} b
   * 
   * @returns {Boolean}
   */
  Boolean.prototype.make = function (b) {
    return Boolean.make(b);
  };
  
  /**
   * Decode a Boolean from a String.
   *
   * @param {String} str
   * @returns {Boolean}
   */
  Boolean.prototype.decodeFromString = function (str) {
    return str === "true";
  };
  
  /**
   * Encode a Boolean to a String.
   *
   * @returns {String}
   */
  Boolean.prototype.encodeToString = function () {
    return this.toString();
  };
  
  /**
   * Return the data type symbol.
   *
   * @returns {String} the Symbol used for encoding this data type (primarily used for facets).
   */
  Boolean.prototype.getDataTypeSymbol = function () {
    return "b";
  };
  
  // Register Type
  Boolean.registerType("baja:Boolean");
  
  /**
   * Equality test.
   *
   * @function
   * 
   * @param obj
   * @returns {Boolean} 
   */
  Boolean.prototype.equals = valueOfEquals;
  
  /**
   * Equivalence test.
   * <p>
   * Equivalent is used to compare if two objects have equivalent
   * state, but might not want to return true for equals since it
   * it has implied semantics for many operations.  The default
   * implementation returns the result of <code>equals()</code>.
   *
   * @function
   * 
   * @param obj
   * @returns {Boolean}
   */
  Boolean.prototype.equivalent = equalsEquivalent;
  
  /**
   * New Copy.
   *
   * @function
   *
   * @returns {Boolean}
   */
  Boolean.prototype.newCopy = valueOfNewCopy;
   
  // Boolean Enum Methods
   
  /**
   * Return true if this enum's value is considered to be in an active state.
   *
   * @returns {Boolean} whether the enum is active.
   */
  Boolean.prototype.isActive = function () {
    return this.valueOf();
  };
  
  /**
   * Return the enum ordinal.
   *
   * @returns {Number} the enum ordinal.
   */
  Boolean.prototype.getOrdinal = function () {
    return this.valueOf() ? 1 : 0;
  };
  
  /**
   * Return the string identifier of this enum value.
   *
   * @returns {String} tag
   */
  Boolean.prototype.getTag = function () {
    return this.valueOf() ? "true" : "false";
  };

  var getBooleanDisplayTag = function (facets) {
    var text;
    
    if (facets) {
      if (this.valueOf()) {
        text = facets instanceof baja.Facets ? facets.get("trueText") : facets.trueText;
      }
      else {
        text = facets instanceof baja.Facets ? facets.get("falseText") : facets.falseText;
      }
    }
  
    if (text) {
      // Handle Format text
      return baja.Format.format(text);
    }
    else {
      return baja.lex("baja").get(this.getTag());
    }
  };
  
  /**
   * Return the display tag of this enum value.
   *
   * @name Boolean#getDisplayTag
   * @function
   *
   * @param {baja.Facets|Object} [facets] used to specify the true and false text.
   *                                      For true text the facets key is 'trueText' and
   *                                      false is 'falseText'. The argument can also be an
   *                                      Object Literal.
   *
   * @returns {String} display tag
   */
  Boolean.prototype.getDisplayTag = getBooleanDisplayTag;
  
  var oldBooleanToString = Boolean.prototype.toString;

  /**
   * Return the String representation of a Boolean.
   *
   * @param {baja.Facets|Object} [facets] used to specify the true and false text.
   *                                      For true text the facets key is 'trueText' and
   *                                      false is 'falseText'. The argument can also be an
   *                                      Object Literal.
   *
   * @returns String
   */
  Boolean.prototype.toString = function () {
    if (arguments.length === 1) {
      return getBooleanDisplayTag.apply(this, arguments);
    }
    else {
      return oldBooleanToString.apply(this, arguments);
    }
  };
    
  /**
   * Return the enum range.
   *
   * @returns {baja.EnumRange} the enum range.
   */
  Boolean.prototype.getRange = function () {
    return baja.EnumRange.BOOLEAN_RANGE;
  };
    
  // TODO: What about encoding/decoding numbers from different locales?
  // How does this work in JavaScript?
  
  /**
   * Return the Object's Icon.
   *
   * @function
   * 
   * @returns {baja.Icon}
   */
  Boolean.prototype.getIcon = objectGetIcon;
  
  /**
    * Return a boolean (itself).
    *
    * @returns {Boolean} return the boolean (itself).
    */
  Boolean.prototype.getBoolean = function () {
    return this.valueOf();
  };
  
  /**
    * Return a boolean (itself).
    *
    * @function
    *
    * @returns {Boolean} return the boolean (itself).
    */
  Boolean.prototype.getEnum = Boolean.prototype.getBoolean;
  
  /**
   * Return the boolean from a BIBoolean.
   *
   * @return resolved boolean value.
   */
  Boolean.getBooleanFromIBoolean = function (boolVal) {
    var val = boolVal,
        type = boolVal.getType(),
        hasOut = false,
        out;
    
    if (type.isComplex()) {
      out = boolVal.get("out");
      if (out && out.getType().is("baja:StatusBoolean")) {
        val = out.getValue().valueOf();
        hasOut = true;
      }
    }
    
    if (!hasOut) {
      if (type.is("baja:StatusBoolean")) {
        val = boolVal.getValue().valueOf();
      }
      else if (type.is("baja:Boolean")) {
        val = boolVal.valueOf();
      }
      else if (typeof boolVal.getBoolean === "function") {
        val = boolVal.getBoolean();
      }
    }
    
    // Make sure we return a boolean
    return !!val;  
  };
  
  /**
   * @class Represents a baja:Double in BajaScript.
   * <p>
   * Augments Number to be a Baja Double. ECMAScript only has one numeric type for 
   * Doubles, Floats, Longs and Integers. Therefore, this type naturally maps to 
   * baja:Double.
   *
   * @name Number
   */
   
  /**
   * Default Number instance.
   */
  Number.DEFAULT = 0;
  
  /**
   * @name baja.Double
   * @augments Number
   */
  baja.Double = Number;
  
  /**
   * Make a Number.
   *
   * @param {Number} num  the number for the Simple.
   * @returns {Number} the Number.
   */
  Number.make = function (num) {
    return Number(num);
  };
  
  /**
   * Make a Number.
   *
   * @param {Number} num  the number.
   * 
   * @returns {Number} the Number.
   */
  Number.prototype.make = function (num) {
    return Number.make(num);
  };
  
  /**
   * Decode a Number from a String.
   *
   * @param {String} str
   * @returns {Number}
   */
  Number.prototype.decodeFromString = function (str) {
    if (str === "0") {
      return 0;
    }
    // Infinity and NaN
    else if (str === "+inf") {
      return Number.POSITIVE_INFINITY;
    }
    else if (str === "-inf") {
      return Number.NEGATIVE_INFINITY;
    }
    else if (str === "nan") {
      return Number["NaN"]; // Workaround for JsLint
    }
        
    // Parse number
    return Number(str);
  };
  
  /**
   * Encode to the Number to a String.
   *
   * @returns {String}
   */
  Number.prototype.encodeToString = function () {
  
    // Infinity and NaN
    if (this.valueOf() === Number.POSITIVE_INFINITY) {
      return "+inf";
    }
    else if (this.valueOf() === Number.NEGATIVE_INFINITY) {
      return "-inf";
    }
    else if (isNaN(this.valueOf())) {
      return "nan";
    }
    
    return this.toString();
  };
  
  /**
   * Return the data type symbol for a Double.
   *
   * @returns {String} the Symbol used for encoding this data type (primarily used for facets).
   */
  Number.prototype.getDataTypeSymbol = function () {
    return "d";
  };
  
  // Register Type
  Number.registerType("baja:Double"); 
  
  /**
   * Equality test.
   *
   * @function
   * 
   * @param obj
   * @returns {Boolean}
   */
  Number.prototype.equals = valueOfEquals;
  
  /**
   * Equivalence test.
   * <p>
   * Equivalent is used to compare if two objects have equivalent
   * state, but might not want to return true for equals since it
   * it has implied semantics for many operations.  The default
   * implementation returns the result of <code>equals()</code>.
   *
   * @function
   * 
   * @param obj
   * @returns {Boolean}
   */
  Number.prototype.equivalent = equalsEquivalent;
  
  /**
   * New Copy.
   *
   * @function
   *
   * @returns {Number}
   */
  Number.prototype.newCopy = valueOfNewCopy;
  
  /**
   * Return the Object's Icon.
   *
   * @function
   * 
   * @returns {baja.Icon}
   */
  Number.prototype.getIcon = objectGetIcon;
  
  /**
   * Return the number (itself).
   *
   * @returns {Number} return the Number (itself).
   */
  Number.prototype.getNumber = function () {
    return this.valueOf();
  };
  
  /**
   * Return the number from a BINumeric.
   *
   * @returns resolved numeric value.
   */
  Number.getNumberFromINumeric = function (numeric) {
    var val = numeric,
        type = numeric.getType(),
        hasOut = false,
        out;

    if (type.isComplex()) {
      out = numeric.get("out");
      if (out && out.getType().is("baja:StatusNumeric")) {
        val = out.getValue().valueOf();
        hasOut = true;
      }
    }
    
    if (!hasOut) {
      if (type.is("baja:StatusNumeric")) {
        val = numeric.getValue().valueOf();
      }
      else if (type.is("baja:Number")) {
        val = numeric.valueOf();
      }
      else if (typeof numeric.getNumber === "function") {
        val = numeric.getNumber();
      }
    }
    
    return typeof val === "number" ? val : 0;
  };
  
  var oldNumberToString = Number.prototype.toString;
  
  var numberToString = function (facets) {
    if (facets) {
      // Attempt to get the precision from the facets or an Object Literal argument
      var precision = null;
      if (facets instanceof baja.Facets) {
        precision = facets.get("precision");
      }
      else if (typeof facets.precision === "number") {
        precision = facets.precision;
      }
      if (precision !== null) {
        return this.valueOf().toFixed(Number(precision.valueOf())); 
      }
    }

    // If no arguments are specified then use the old 
    return oldNumberToString.apply(this.valueOf(), arguments);
  };
  
  /**
   * Return the String representation of a Number.
   *
   * @name Number#toString
   * @function
   *
   * @param {baja.Facets|Object} [facets] used to specify the 'precision'.
   *                                      The argument can also be an Object Literal.
   *
   * @returns String
   */
  Number.prototype.toString = numberToString;
    
  /**
   * @class Represents a baja:Float in BajaScript.
   * <p>
   * Boxes JavaScript Number to represent a baja:Float.
   * <p>
   * When creating a Simple, always use the 'make' method instead of creating a new Object.
   *
   * @name baja.Float
   * @extends baja.Simple
   */
  baja.Float = function (val) {
    baja.Float.$super.apply(this, arguments); 
    this.$val = strictArg(val, Number);
  }.$extend(baja.Simple);
      
  /**
   * Make a Float.
   *
   * @param {Number} num  the Float for the Simple.
   * @returns {baja.Float} the Float.
   */
  baja.Float.make = function (val) {        
    if (val === 0) {
      return baja.Float.DEFAULT;
    }
    else if (isNaN(val)) {
      return baja.Float.NAN;
    }   
    else if (val === baja.Float.POSITIVE_INFINITY.valueOf()) {
      return baja.Float.POSITIVE_INFINITY;
    }
    else if (val === baja.Float.NEGATIVE_INFINITY.valueOf()) {
      return baja.Float.NEGATIVE_INFINITY;
    }
    else if (val >= baja.Float.MAX_VALUE.valueOf()) {
      return baja.Float.MAX_VALUE;
    }
    else if (val > 0 && val <= baja.Float.MIN_VALUE.valueOf()) {
      return baja.Float.MIN_VALUE;
    }
      
    return new baja.Float(val);
  };
  
  /**
   * Make a Float.
   *
   * @param {Number} num  the Float for the Simple.
   * @returns {baja.Float} the Float.
   */
  baja.Float.prototype.make = function (val) {
    return baja.Float.make(val);
  };
    
  /**
   * Decode a Float from a String.
   *
   * @param {String} str
   * @returns {baja.Float}
   */
  baja.Float.prototype.decodeFromString = function (str) {
    if (str === "0") {
      return baja.Float.DEFAULT;
    }
    // Infinity and NaN
    else if (str === "+inf") {
      return baja.Float.POSITIVE_INFINITY;
    }
    else if (str === "-inf") {
      return baja.Float.NEGATIVE_INFINITY;
    }
    else if (str === "nan") {
      return baja.Float.NAN;
    }     
    return baja.Float.make(parseFloat(str));
  };
      
  /**
   * Encode the Float to a String.
   *
   * @returns {String}
   */
  baja.Float.prototype.encodeToString = function () {
  
    // Infinity and NaN
    if (this.$val === Number.POSITIVE_INFINITY) {
      return "+inf";
    }
    else if (this.$val === Number.NEGATIVE_INFINITY) {
      return "-inf";
    }
    else if (isNaN(this.$val)) {
      return "nan";
    }
    
    // Check range limits
    if (this.$val >= baja.Float.MAX_VALUE.valueOf()) {
      return baja.Float.MAX_VALUE.valueOf().toString();
    }
    else if (this.$val > 0 && this.$val <= baja.Float.MIN_VALUE.valueOf()) {
      return baja.Float.MIN_VALUE.valueOf().toString();
    }
    
    return this.$val.toString();
  };
  
  /**
   * Default Float instance.
   */
  baja.Float.DEFAULT = uncacheConstantEncodeDecode(new baja.Float(0));
  
  /**
   * Float Max Value.
   */
  baja.Float.MAX_VALUE = uncacheConstantEncodeDecode(new baja.Float(3.4028235E38));
  
  /**
   * Float Min Value.
   */
  baja.Float.MIN_VALUE = uncacheConstantEncodeDecode(new baja.Float(1.4E-45));
  
  /**
   * Float Positive Infinity.
   */
  baja.Float.POSITIVE_INFINITY = uncacheConstantEncodeDecode(new baja.Float(Number.POSITIVE_INFINITY));
  
  /**
   * Float Negative Infinity.
   */
  baja.Float.NEGATIVE_INFINITY = uncacheConstantEncodeDecode(new baja.Float(Number.NEGATIVE_INFINITY));
  
  /**
   * Float Not A Number.
   */
  baja.Float.NAN = uncacheConstantEncodeDecode(new baja.Float(Number["NaN"]));
  
  baja.Float.prototype.decodeFromString = cacheDecode(baja.Float.prototype.decodeFromString);
  baja.Float.prototype.encodeToString = cacheEncode(baja.Float.prototype.encodeToString);
  
  // Register Type  
  baja.Float.registerType("baja:Float");
  
  /**
   * Equality test.
   *
   * @function
   *
   * @param obj
   * @returns {Boolean}
   */
  baja.Float.prototype.equals = valueOfEquals;
  
  /**
   * Return the Number encapsulated in the Float.
   *
   * @returns {Number} Number for the Float.
   */
  baja.Float.prototype.valueOf = function () {
    return this.$val;
  };
  
  /**
   * Return the Symbol used for encoding this data type (primarily used for facets).
   *
   * @returns {String}
   */
  baja.Float.prototype.getDataTypeSymbol = function () {
    return "f";
  };
  
  /**
   * Return the String representation of a Float.
   *
   * @name baja.Float#toString
   * @function
   *
   * @param {baja.Facets|Object} [facets] used to specify the 'precision'.
   *                                      The argument can also be an Object Literal.
   *
   * @returns String
   */
  baja.Float.prototype.toString = numberToString;
  
  /**
   * @class Represents a baja:Integer in BajaScript.
   * <p>
   * Boxes JavaScript Number to represent a baja:Integer.
   * <p>
   * When creating a Simple, always use the 'make' method instead of creating a new Object.
   *
   * @name baja.Integer
   * @extends baja.Simple
   */
  baja.Integer = function (val) {
    baja.Integer.$super.apply(this, arguments); 
    this.$val = strictArg(val, Number);
  }.$extend(baja.Simple);
      
  /**
   * Make an Integer.
   *
   * @param {Number} num  the Integer for the Simple.
   * @returns {baja.Integer} the Integer.
   */
  baja.Integer.make = function (val) {
    if (val === 0 || isNaN(val)) {
      return baja.Integer.DEFAULT;
    }
    else if (val >= baja.Integer.MAX_VALUE.valueOf() || val === Number.MAX_VALUE) {
      return baja.Integer.MAX_VALUE;
    }
    else if (val <= baja.Integer.MIN_VALUE.valueOf() || val === Number.MIN_VALUE) {
      return baja.Integer.MIN_VALUE;
    }
      
    // Ensure we don't have a floating point
    val = Math.floor(val);
    
    if (val === 0) {
      return baja.Integer.DEFAULT;
    }

    return new baja.Integer(val);
  };
  
  /**
   * Make an Integer.
   *
   * @param {Number} num  the Integer for the Simple.
   * @returns {baja.Integer} the Integer.
   */
  baja.Integer.prototype.make = function (val) {
    return baja.Integer.make(val);
  };
    
  /**
   * Decode a String to an Integer.
   *
   * @param {String} str
   * @returns {baja.Integer}
   */
  baja.Integer.prototype.decodeFromString = function (str) {
    if (str === "0") {
      return baja.Integer.DEFAULT;
    }
    // Min and max limits
    else if (str === "max") {
      return baja.Integer.MAX_VALUE;
    }
    else if (str === "min") {
      return baja.Integer.MIN_VALUE;
    }
          
    return baja.Integer.make(Number(str));
  };
  
  /**
   * Encode an Integer to a String.
   *
   * @returns {String}
   */
  baja.Integer.prototype.encodeToString = function () {          
    // Check range limits and NAN
    if (isNaN(this.$val)) {
      return "0";
    }
    else if (this.$val >= baja.Integer.MAX_VALUE.valueOf()) {
      return "max";
    }
    else if (this.$val <= baja.Integer.MIN_VALUE.valueOf()) {
      return "min";
    }
    
    return Math.floor(this.$val).toFixed(0);
  };
  
  /**
   * Default Integer instance.
   */
  baja.Integer.DEFAULT = uncacheConstantEncodeDecode(new baja.Integer(0));
  
  /**
   * Integer Max Value.
   */
  baja.Integer.MAX_VALUE = uncacheConstantEncodeDecode(new baja.Integer(2147483647));
  
  /**
   * Integer Min Value.
   */
  baja.Integer.MIN_VALUE = uncacheConstantEncodeDecode(new baja.Integer(-2147483648));
  
  baja.Integer.prototype.encodeToString = cacheEncode(baja.Integer.prototype.encodeToString);
  baja.Integer.prototype.decodeFromString = cacheDecode(baja.Integer.prototype.decodeFromString);
  
  // Register Type  
  baja.Integer.registerType("baja:Integer");
  
  /**
   * Equality test.
   *
   * @function
   *
   * @param obj
   * @returns {Boolean}
   */
  baja.Integer.prototype.equals = valueOfEquals;
  
  /**
   * Return the Number encapsulated in the Integer.
   *
   * @returns {Number} Number for the Integer.
   */
  baja.Integer.prototype.valueOf = function () {
    return this.$val;
  };
  
  /**
   * Returns a string representation of the integer.
   * @returns {String}
   */
  baja.Integer.prototype.toString = function () {
    return String(this.valueOf());
  };
  
  /**
   * Return the Symbol used for encoding this data type (primarily used for facets).
   *
   * @returns {String} the Symbol used for encoding this data type (primarily used for facets).
   */
  baja.Integer.prototype.getDataTypeSymbol = function () {
    return "i";
  };
  
  // TODO: Long can't really be represented in JavaScript. This needs more investigation
  
  /**
   * @class Represents a baja:Long in BajaScript.
   * <p>
   * Boxes JavaScript Number to represent a baja:Long.
   * <p>
   * When creating a Simple, always use the 'make' method instead of creating a new Object.
   *
   * @name baja.Long
   * @extends baja.Simple
   */
  baja.Long = function (val) {
    baja.Long.$super.apply(this, arguments); 
    this.$val = strictArg(val, Number);
  }.$extend(baja.Simple);
      
  /**
   * Make a Long.
   *
   * @param {Number} num  the Long for the Simple.
   * @returns {baja.Long} the Long.
   */
  baja.Long.make = function (val) {  
    if (val === 0 || isNaN(val)) {
      return baja.Long.DEFAULT;
    }
    else if (val >= baja.Long.MAX_VALUE.valueOf() || val === Number.MAX_VALUE) {
      return baja.Long.MAX_VALUE;
    }
    else if (val <= baja.Long.MIN_VALUE.valueOf() || val === Number.MIN_VALUE) {
      return baja.Long.MIN_VALUE;
    }
  
    val = Math.floor(val);
    
    if (val === 0) {
      return baja.Long.DEFAULT;
    }
  
    return new baja.Long(val);
  };
  
  /**
   * Make a Long.
   *
   * @param {Number} num  the Long for the Simple.
   * @returns {baja.Long} the Long.
   */
  baja.Long.prototype.make = function (val) {
    return baja.Long.make(val);
  };
    
  /**
   * Decode a Long from a String.
   * 
   * @param {String} str
   * @returns {baja.Long}
   */
  baja.Long.prototype.decodeFromString = function (str) {
    if (str === "0") {
      return baja.Long.DEFAULT;
    }
    // Min and max limits
    if (str === "max") {
      return baja.Long.MAX_VALUE;
    }
    else if (str === "min") {
      return baja.Long.MIN_VALUE;
    }
          
    return baja.Long.make(Number(str));
  };
  
  /**
   * Encode the Long to a String.
   *
   * @returns {String}
   */
  baja.Long.prototype.encodeToString = function () {
        
    // Check range limits and NAN
    if (isNaN(this.$val)) {
      return "0";
    }
    else if (this.$val >= baja.Long.MAX_VALUE.valueOf()) {
      return "max";
    }
    else if (this.$val <= baja.Long.MIN_VALUE.valueOf()) {
      return "min";
    }
        
    return Math.floor(this.$val).toFixed(0);
  };
  
  /**
   * Default Simple instance.
   */
  baja.Long.DEFAULT = uncacheConstantEncodeDecode(new baja.Long(0));
  
  /**
   * Long Max Value.
   */
  baja.Long.MAX_VALUE = uncacheConstantEncodeDecode(new baja.Long(9223372036854775807));
  
  /**
   * Long Min Value.
   */
  baja.Long.MIN_VALUE = uncacheConstantEncodeDecode(new baja.Long(-9223372036854775808));
  
  baja.Long.prototype.decodeFromString = cacheDecode(baja.Long.prototype.decodeFromString);
  baja.Long.prototype.encodeToString = cacheEncode(baja.Long.prototype.encodeToString);
  
  // Register Type  
  baja.Long.registerType("baja:Long");
  
  /**
   * Equality test.
   *
   * @function
   *
   * @param obj
   * @returns {Boolean}
   */
  baja.Long.prototype.equals = valueOfEquals;
  
  /**
   * Return the Number encapsulated in the Long.
   *
   * @returns {Number} Number for the Long.
   */
  baja.Long.prototype.valueOf = function () {
    return this.$val;
  };
  
  /**
   * Return the Symbol used for encoding this data type (primarily used for facets).
   *
   * @returns {String} the Symbol used for encoding this data type (primarily used for facets).
   */
  baja.Long.prototype.getDataTypeSymbol = function () {
    return "l";
  };
  
  /**
   * Returns a string representation of the integer.
   *
   * @returns {String}
   */
  baja.Long.prototype.toString = function () {
    return String(this.valueOf());
  };
        
  ////////////////////////////////////////////////////////////////
  // Facets
  //////////////////////////////////////////////////////////////// 
  
  /**
   * @class Represents a BFacets in BajaScript.
   * <p>
   * BFacets is a map of name/value pairs used to annotate a
   * BComplex's Slot or to just provide additional metadata
   * about something.  The values of facets may only be
   * BIDataValues which are a predefined subset of simples.
   * <p>
   * When creating a Simple, always use the 'make' method instead of creating a new Object.
   *
   * @name baja.Facets
   * @extends baja.Simple
   */
  baja.Facets = function (keys, vals) {
    baja.Facets.$super.apply(this, arguments);    
    this.$map = new baja.OrderedMap();
    strictArg(keys, Array, "Keys array required"); 
    strictArg(vals, Array, "Values array required");    
    
    if (keys.length !== vals.length) {
      throw new Error("baja.Facets Constructor must have an equal number of keys and values");
    } 
    if (keys.length === 0) {
      return;
    }
    
    // Iterate through key, value pair arguments and add to the internal Map
    var dvt = baja.lt("baja:IDataValue");
    var key, i;   
    for (i = 0; i < keys.length; ++i) {
      if (typeof keys[i] !== 'string') {
        throw new Error("Facets keys must be a String");
      }
      
      baja.SlotPath.verifyValidName(keys[i]);
        
      // Check everything being added here is a DataValue
      if (!vals[i].getType) {
        throw new Error("Facet value has no Baja Type associated with it");
      }
      if (!vals[i].getType().is(dvt)) {
        throw new Error("Can only add baja:IDataValue Types to BFacets: " + vals[i].getType().getTypeSpec());
      }
      
      this.$map.put(keys[i], vals[i]);
    }
  }.$extend(baja.Simple);
  
  /**
   * Default Facets instance.
   */
  var facetsDefault = baja.Facets.DEFAULT = new baja.Facets([], []);
  
  /**
   * NULL Facets instance.
   */
  baja.Facets.NULL = facetsDefault;
  
  function facetsExtend(orig, toAdd) {
    var obj = {}, newKeys = [], newValues = [];
    
    baja.iterate(orig.getKeys(), function (key) {
      obj[key] = orig.get(key);
    });
    
    //overwrite any existing values with ones from toAdd
    baja.iterate(toAdd.getKeys(), function (key) {
      obj[key] = toAdd.get(key); 
    });
   
    baja.iterate(obj, function (value, key) {
      newKeys.push(key);
      newValues.push(value);
    });
    
    return baja.Facets.make(newKeys, newValues);
  }
  
  function facetsFromObj(obj) {
    var keys = [], 
        values = [];
    
    baja.iterate(obj, function (v, k) {
      keys.push(k);
      values.push(v);
    });
    
    return baja.Facets.make(keys, values);
  }
  
  /**
   * Make a Facets object. This function can either take two Array objects
   * for keys and values, two Facets or two Object Literals. In the latter two cases, a new
   * Facets object will be returned containing a combination of keys and values
   * from both input Facets objects. If a key exists on both Facets objects,
   * the value from the second Facets will take precedence.
   *
   * @param {Array|baja.Facets|Object} keys an array of keys for the facets. The keys 
   * must be Strings. (This may also be a Facets (or Object Literal) object whose values will be
   * combined with the second parameter. Values in this object will be
   * overwritten by corresponding values from the other).
   * @param {Array|baja.Facets|Object} values an array of values for the facets. The 
   * values must be BajaScript Objects whose Type implements BIDataValue.
   * (This may also be a Facets (or Object Literal) object whose values will be combined with the
   * first parameter. Values in this object will overwrite corresponding values
   * on the other.)
   * @returns {baja.Facets} the Facets
   */
  baja.Facets.make = function (keys, values) {
    // If there are no arguments are defined then return the default  
    if (arguments.length === 0) {
      return facetsDefault;
    }
    
    // Throw an error if no keys
    if (!keys) {
      throw new Error("Keys required");
    }
    
    // If the keys are an Object then convert to Facets
    if (keys.constructor === Object) {
      keys = facetsFromObj(keys);
    }
    
    // If the values are an Object then convert to Facets
    if (values && values.constructor === Object) {
      values = facetsFromObj(values);
    }
            
    if (keys instanceof baja.Facets) {
      // If keys and values are facets then merge
      if (values && values instanceof baja.Facets) {
        return facetsExtend(keys, values);
      }
      
      // If just the keys are facets then just return them
      return keys;
    }
    else {
      // If we've got here then we assume the keys and values are arrays...
      if (keys.length === 0) {
        return facetsDefault;
      }
      
      // Note: I could do more argument checking here but I don't want to slow this down
      // more than necessary.
      
      return new baja.Facets(keys, values);
    }
  };
  
  /**
   * Make a Facets.
   *
   * @param {Array} keys  an array of keys for the facets. The keys must be Strings.
   * @param {Array} values  an array of values for the facets. The values must be BajaScript Objects whose
   *                        Type implements BIDataValue.
   * @returns {baja.Facets} the Facets.
   */
  baja.Facets.prototype.make = function (args) {
    return baja.Facets.make.apply(baja.Facets, arguments);
  };
   
  /**
   * Decode a String to a Facets.
   *
   * @param {String} str
   * @returns {baja.Facets}
   */
  baja.Facets.prototype.decodeFromString = function (str) {    
    if (str.length === 0) {
      return facetsDefault;
    }
        
    var a = str.split("|"), // array
        a2, // inner array
        keys = [],
        vals = [],
        dv, // decoded values
        v; // decoded value
    
    // TODO: Since we haven't yet implemented all of the datatypes for Facets
    // we are hacking around the issue by creating the getDataTypeSymbol methods on a
    // DefaultSimple on the fly. This will have to do until the other Simples needed
    // for the other datatypes have been created
    function addDataType(v, dt) {
      v.getDataTypeSymbol = function () {
        return dt;
      };
      
      if (dt === "u") {
        /** 
         * @ignore - get JsDoc to ignore this symbols so it's not picked up accidently.
         */
        v.getType = function () {
          return baja.lt("baja:Unit");
        };
      }
      else if (dt === "z") {
        /** 
         * @ignore - get JsDoc to ignore this symbols so it's not picked up accidently.
         */
        v.getType = function () {
          return baja.lt("baja:TimeZone");
        };
      }
    }
    
    // Find the first separator and then split the String
    function splitFirst(str, sep) {
      var ind = str.indexOf(sep);
      var a = [];
      if (ind === -1) {
        a.push(str);
      }
      else {
        a.push(str.substring(0, ind));
        if (ind < (str.length - 1)) {
          a.push(str.substring(ind + 1, str.length));
        }
      }
      return a;
    }
    
    var i;
    for (i = 0; i < a.length; ++i) {
    
      a2 = splitFirst(a[i], "=");
      
      baja.SlotPath.verifyValidName(a2[0]);
      
      keys.push(a2[0]);
      
      // Unmarshal data value from String
      dv = splitFirst(a2[1], ":");
      
      if (dv.length === 1) {
        dv.push("");
      }
     
      if (dv[0] === "s") {
        v = baja.SlotPath.unescape(dv[1]);
      }
      else if (dv[0] === "b") {
        v = Boolean.DEFAULT.decodeFromString(dv[1]);
      }
      else if (dv[0] === "i") {
        v = baja.Integer.DEFAULT.decodeFromString(dv[1]);
      }
      else if (dv[0] === "l") {
        v = baja.Long.DEFAULT.decodeFromString(dv[1]);
      }
      else if (dv[0] === "f") {
        v = baja.Float.DEFAULT.decodeFromString(dv[1]);
      }
      else if (dv[0] === "d") {
        v = Number.DEFAULT.decodeFromString(dv[1]);
      }
      else if (dv[0] === "a") {
        v = baja.AbsTime.DEFAULT.decodeFromString(dv[1]);
      }
      else if (dv[0] === "E") {
        v = baja.EnumRange.DEFAULT.decodeFromString(dv[1]);
      }
      else if (dv[0] === "e") {
        v = baja.DynamicEnum.DEFAULT.decodeFromString(dv[1]);
      }
      else if (dv[0] === "r") {
        v = baja.RelTime.DEFAULT.decodeFromString(dv[1]);
      }
      else {
        // TODO: Need to get around to decoding BUnits and other essential data types.
        // Currently this is one big hack
        
        v = new baja.DefaultSimple(dv[1]);        
        addDataType(v, dv[0]);
      }
      
      vals.push(v);
    }
    
    return baja.Facets.make(keys, vals);
  };
  baja.Facets.prototype.decodeFromString = cacheDecode(baja.Facets.prototype.decodeFromString);
  
  /**
   * Encode Facets to a String.
   *
   * @returns {String}
   */
  baja.Facets.prototype.encodeToString = function () {
    var s = "", // TODO: This needs more work for data encoding
        k = this.$map.getKeys(),
        v, i;
    for (i = 0; i < k.length; ++i) {
      if (i > 0) {
        s += "|";
      }
      
      v = this.$map.get(k[i]);
            
      if (v.getDataTypeSymbol === undefined) {
        throw new Error("Cannot encode data type as 'getDataTypeSymbol' is not defined: " + v.getType());
      }
      
      // If a String then escape it
      if (v.getDataTypeSymbol() === "s") {
        v = baja.SlotPath.escape(v);
      }
      
      s += k[i] + "=" + v.getDataTypeSymbol() + ":" + v.encodeToString();
    } 
    return s;
  };
  baja.Facets.prototype.encodeToString = cacheEncode(baja.Facets.prototype.encodeToString);
    
  // Register Type
  baja.Facets.registerType("baja:Facets");  
    
  /**
   * Return a value from the map for the given key
   *
   * @param {String} key  the key used to look up the data value
   * @param [def] if defined, this value is returned if the key can't be found.
   * @returns the data value for the key (null if not found)
   */
  baja.Facets.prototype.get = function (key, def) {
    strictArg(key, String);    
    def = bajaDef(def, null);
    var v = this.$map.get(key);
    return v === null ? def : v;
  };
  
  /**
   * Return a copy of the Facets keys.
   *
   * @returns {Array} all of the keys (String) used in the Facets
   */
  baja.Facets.prototype.getKeys = function () {
    return this.$map.getKeys();
  };  
  
  /**
   * Return a String representation of the Facets.
   *
   * @returns {String}
   */
  baja.Facets.prototype.toString = function () {
    var str = "",
        keys = this.$map.getKeys(),
        i;
    
    for (i = 0; i < keys.length; ++i) {
      if (i > 0) {
        str += ",";
      }
      str += keys[i] + "=" + this.$map.get(keys[i]).toString(); 
    }
    return str;
  }; 
  
  /**
   * Return the value of the Facets.
   * @function
   *
   * @returns {String}
   */
  baja.Facets.prototype.valueOf = baja.Facets.prototype.toString; 
  
  /**
   * Return the facets for the given object.
   * <p>
   * If the facets can't be found then baja.Facets.DEFAULT is returned.
   * 
   * @param obj
   * @returns {baja.Facets}
   */
  baja.Facets.getFacetsFromObject = function (obj) {
    var val = facetsDefault;
    
    if (obj.getType().is("baja:Facets")) {
      val = obj;
    }
    else if (obj.getType().isComplex()) {
      if (obj.has("facets")) {
        val = obj.getFacets();
      }
      else if (obj.getParent()) {
        val = obj.getParent().getFacets(obj.getPropertyInParent());
      }
    }
    
    return val;
  };

  ////////////////////////////////////////////////////////////////
  // Enums
  ////////////////////////////////////////////////////////////////   
  
  /**
   * @class Represents a BEnumRange in BajaScript.
   * <p>
   * An EnumRange stores a range of ordinal/name pairs for Enumerations.
   * <p>
   * When creating a Simple, always use the 'make' method instead of creating a new Object.
   *
   * @name baja.EnumRange
   * @extends baja.Simple
   */
  baja.EnumRange = function (frozen, dynamic, byOrdinal, byTag, options) {
    baja.EnumRange.$super.apply(this, arguments);  
    this.$frozen = frozen;
    this.$dynamic = strictArg(dynamic, Array);
    this.$byOrdinal = strictArg(byOrdinal, Object);
    this.$byTag = strictArg(byTag, Object);
    this.$options = strictArg(options, baja.Facets);
  }.$extend(baja.Simple);
  
  /**
   * Make an EnumRange.
   * <p>
   * The TypeSpec for a FrozenEnum can be used as the first argument. If other arguments
   * are required then an Object Literal is used to to specify the method's arguments.
   * <pre>
   *   // For example...
   *   var er = baja.EnumRange.make({
   *     ordinals: [0, 1, 2],
   *     tags: ["A", "B", "C"]
   *   });
   * </pre>
   * <p>
   *
   * @param {Object} [obj] the Object Literal that holds the method's arguments.
   * @param {String|Type} [frozen] the Type or TypeSpec for the FrozenEnum.
   * @param {Array} [ordinals] an array of numbers that specify the dynamic enum ordinals.
   * @param {Array} [tags] an array of strings that specify the dynamic enum tags.
   * @param {baja.Facets} [facets] optional facets.
   * @returns {baja.EnumRange} the EnumRange.
   */
  baja.EnumRange.make = function (obj) {    
    obj = objectify(obj, "frozen");
    
    var frozen = bajaDef(obj.frozen, null),
        ordinals = obj.ordinals,
        tags = obj.tags,
        count = obj.count,
        options = obj.options;
      
    // Support String typespec as well as type
    if (typeof frozen === "string") {
      frozen = baja.lt(frozen);
    }
    
    if (ordinals === undefined) {
      ordinals = [];
    }
    if (tags === undefined) {
      tags = [];
    }
    if (count === undefined && ordinals instanceof Array) {
      count = ordinals.length;
    }
    if (options === undefined) {
      options = facetsDefault;
    }
   
    strictAllArgs([ordinals, tags, count, options], [Array, Array, Number, baja.Facets]);
    
    if (ordinals.length !== tags.length) {
      throw new Error("Ordinals and tags arrays must match in length");
    }
    
    // optimization
    if (count === 0 && options === facetsDefault) {
      if (frozen === null) {
        return baja.EnumRange.DEFAULT;
      }
      else {
        return new baja.EnumRange(frozen, [], {}, {}, options);
      }
    }
    
    var byOrdinal = {},
        byTag = {},
        dynaOrdinals = [],
        o, t, i;
    
    for (i = 0; i < count; ++i) {
      o = ordinals[i];
      t = tags[i];
      
      // Check for undefined due to JavaScript loading sequence
      if (baja.SlotPath !== undefined) {      
        baja.SlotPath.verifyValidName(t);
      }
      
      // check against frozen
      if (frozen !== null && frozen.isOrdinal(o)) {
        continue;
      }  
              
      // check duplicate ordinal
      if (byOrdinal.hasOwnProperty(o)) {
        throw new Error("Duplicate ordinal: " + t + "=" + o);
      }

      // check duplicate tag
      if (byTag.hasOwnProperty(t) || 
          (frozen && frozen.isTag(t))) {
        throw new Error("Duplicate tag: " + t + "=" + o);
      }
        
      // put into map
      byOrdinal[o] = t;
      byTag[t] = o;
      dynaOrdinals.push(o);
    }
      
    return new baja.EnumRange(frozen, dynaOrdinals, byOrdinal, byTag, options);
        
  };
  
  /**
   * Make an EnumRange.
   * <p>
   * The TypeSpec for a FrozenEnum can be used as the first argument. If other arguments
   * are required then an Object Literal is used to to specify the method's arguments.
   * <pre>
   *   // For example...
   *   var er = baja.$("baja:EnumRange").make({
   *     ordinals: [0, 1, 2],
   *     tags: ["A", "B", "C"]
   *   });
   * </pre>
   * <p>
   *
   * @param {Object} [obj] the Object Literal that holds the method's arguments.
   * @param {String|Type} [frozen] the Type or TypeSpec for the FrozenEnum.
   * @param {Array} [ordinals] an array of numbers that specify the dynamic enum ordinals.
   * @param {Array} [tags] an array of strings that specify the dynamic enum tags.
   * @param {baja.Facets} [facets] optional facets.
   * @returns {baja.EnumRange} the EnumRange .
   */
  baja.EnumRange.prototype.make = function (obj) {    
    return baja.EnumRange.make.apply(baja.EnumRange, arguments);
  };
  
  function splitFrozenDynamic(s) {       
    var frozen = null;
    var dynamic = null;
    var plus = s.indexOf('+');
    if (plus < 0) {
      if (s.indexOf("{") === 0) {
        dynamic = s;
      }
      else {
        frozen = s;
      }
    }
    else {
      if (s.indexOf("{") === 0) {
        dynamic = s.substring(0, plus);
        frozen = s.substring(plus + 1);   
      }
      else {
        frozen = s.substring(0, plus);
        dynamic = s.substring(plus + 1);   
      }
    }    
    return [frozen, dynamic];
  }
  
  function parseDynamic(s, ordinals, tags) {
    var count = 0,
        ordinal,
        st = s.split(/[=,]/),
        i;
    
    for (i = 0; i < st.length; ++i) {
      tags[count] = st[i];
      ordinal = parseInt(st[++i], 10);
      if (isNaN(ordinal)) {
        throw new Error("Invalid ordinal: " + st[i]);
      }
      ordinals[count] = ordinal;
      count++;
    }   
    return count;
  }
  
  /**
   * Decode an EnumRange from a String.
   *
   * @param {String} str
   * @returns {baja.EnumRange}
   */
  baja.EnumRange.prototype.decodeFromString = function (str) {    
    if (str === "{}") {
      return baja.EnumRange.DEFAULT;
    }
    
    // split body from options (there can't be a question mark 
    // anywhere until after the frozen type or dynamic {}
    var options = facetsDefault,
        question = str.indexOf('?');
    if (question > 0) {
      options = facetsDefault.decodeFromString(str.substring(question + 1));
      str = str.substring(0, question);
    }
    
     // split dynamic and frozen tokens
    var split = splitFrozenDynamic(str),
        frozenStr = split[0],
        dynamicStr = split[1],
        frozen = null;        
    
    // get frozen
    if (frozenStr !== null) {
      frozen = baja.lt(frozenStr);
      if (frozen === null) {
        throw new Error("Invalid frozen EnumRange spec: " + frozenStr);
      }
    }
    
    if (dynamicStr === null) {
      return this.make({
        "frozen": frozen, 
        "options": options
      });
    }

    // check for required braces on dynamic
    if (dynamicStr.charAt(0) !== "{") {
      throw new Error("Missing {");
    }
    if (dynamicStr.charAt(dynamicStr.length - 1) !== "}") {
      throw new Error("Missing }");
    }      
    dynamicStr = dynamicStr.substring(1, dynamicStr.length - 1);
                                                  
    // get dynamic                
    var ordinals = [],
        tags = [],
        count = parseDynamic(dynamicStr, ordinals, tags);
    
    return this.make({
      "frozen": frozen, 
      "ordinals": ordinals, 
      "tags": tags, 
      "count": count, 
      "options": options
    });
  };
  
  /**
   * Encode an EnumRange to a String.
   *
   * @returns {String}
   */
  baja.EnumRange.prototype.encodeToString = function () {        
    // Optimization for encoding
    if (this === baja.EnumRange.DEFAULT) {
      return "{}";
    }
  
    var s = "",
        key,
        tag, i;
    
    if (this.$frozen !== null) {
      s += this.$frozen.getTypeSpec();
    }
    
    if (this.$dynamic.length > 0 || this.$frozen === null) {
      if (s.length > 0) {
        s += "+";
      }
      
      s += "{";
      for (i = 0; i < this.$dynamic.length; ++i) {
        key = this.$dynamic[i];
        tag = this.$byOrdinal[key];
        if (i > 0) {
          s += ",";
        }
        s += tag + "=" + key;
      }
      s += "}";
    }     

    if (this.$options !== facetsDefault) {
      s += "?" + this.$options.encodeToString();
    }
    
    return s;
  };
  
  /**
   * Default EnumRange instance.
   */   
  baja.EnumRange.DEFAULT = uncacheConstantEncodeDecode(new baja.EnumRange(null, [], {}, {}, facetsDefault));
  
  baja.EnumRange.prototype.decodeFromString = cacheDecode(baja.EnumRange.prototype.decodeFromString);
  baja.EnumRange.prototype.encodeToString = cacheEncode(baja.EnumRange.prototype.encodeToString);
     
  // Register Type   
  baja.EnumRange.registerType("baja:EnumRange");
  
  /**
   * Return the data type symbol.
   *
   * @returns {String} data type symbol.
   */
  baja.EnumRange.prototype.getDataTypeSymbol = function () {
    return "E";
  };
  
  /**
   * Return all of the ordinals for the EnumRange.
   * <p>
   * The returned array contains both frozen and enum ordinals.
   *
   * @returns {Array} an array of numbers that represents the ordinals for this EnumRange.
   */
  baja.EnumRange.prototype.getOrdinals = function () {
    var ordinals, i;
    if (this.$frozen !== null) {
      ordinals = this.$frozen.getOrdinals();
    }
    else {
      ordinals = [];
    }
    for (i = 0; i < this.$dynamic.length; ++i) {
      ordinals.push(this.$dynamic[i]);
    }
    return ordinals;
  };
  
  /**
   * Return true if the ordinal is valid in this EnumRange.
   *
   * @param {Number} ordinal
   * @returns {Boolean} true if valid
   */
  baja.EnumRange.prototype.isOrdinal = function (ordinal) {
    strictArg(ordinal, Number);
    if (this.$frozen !== null && this.$frozen.isOrdinal(ordinal)) {
      return true;
    }
    return this.$byOrdinal.hasOwnProperty(ordinal);
  };  
  
  /**
   * Return the tag for the specified ordinal.
   * <p>
   * If the ordinal isn't valid then the ordinal is returned 
   * as a String.
   *
   * @param {Number} ordinal
   * @returns {String} tag
   */
  baja.EnumRange.prototype.getTag = function (ordinal) {
    strictArg(ordinal, Number);
    if (this.$byOrdinal.hasOwnProperty(ordinal)) {
      return this.$byOrdinal[ordinal];
    }
      
    if (this.$frozen !== null && this.$frozen.isOrdinal(ordinal)) {
      return this.$frozen.getTag(ordinal);
    }
    
    return String(ordinal);
  };  
  
  /**
   * Return true if the tag is used within the EnumRange.
   *
   * @param {String} tag
   * @returns {Boolean} true if valid.
   */
  baja.EnumRange.prototype.isTag = function (tag) {     
    strictArg(tag, String);  
    if (this.$frozen !== null && this.$frozen.isTag(tag)) {
      return true;
    }
    
    return this.$byTag.hasOwnProperty(tag);
  }; 
  
  /**
   * Convert the tag to its ordinal within the EnumRange.
   *
   * @param {String} tag
   * @returns {Number} ordinal for the tag.
   * @throws error if the tag is invalid.
   */
  baja.EnumRange.prototype.tagToOrdinal = function (tag) {
    strictArg(tag, String);  
    if (this.$frozen !== null && this.$frozen.isTag(tag)) {
      return this.$frozen.tagToOrdinal(tag);
    }
        
    if (this.$byTag.hasOwnProperty(tag)) {
      return this.$byTag[tag];
    }
    else {
      throw new Error("Invalid tag: " + tag);
    }
  }; 
  
  /**
   * Get the enum for the specified tag or ordinal.
   * <p>
   * This method is used to access an enum based upon a tag or ordinal.
   *
   * @param {String|Number} arg a tag or ordinal.
   * @returns {baja.DynamicEnum|baja.FrozenEnum|Boolean} the enum for the tag or ordinal.
   * @throws error if the tag or ordinal is invalid.
   */
  baja.EnumRange.prototype.get = function (arg) {      
      
    if (typeof arg === "string") {
      if (this === baja.EnumRange.BOOLEAN_RANGE) {
        return arg === "false" ? false : true;
      }
    
      // Look up via tag name
      if (this.$frozen !== null && this.$frozen.isTag(arg)) {
        return this.$frozen.getFrozenEnum(arg);
      }
    
      if (this.$byTag.hasOwnProperty(arg)) {
        return baja.DynamicEnum.make({"ordinal": this.$byTag[arg], "range": this});
      }
    }
    else if (typeof arg === "number") {
      if (this === baja.EnumRange.BOOLEAN_RANGE) {
        return arg === 0 ? false : true;
      }
    
      // Look up via ordinal
      if (this.$frozen !== null && this.$frozen.isOrdinal(arg)) {
        return this.$frozen.getFrozenEnum(arg);
      }
    
      if (this.isOrdinal(arg)) {
        return baja.DynamicEnum.make({"ordinal": arg, "range": this}); 
      }
    }
    
    throw new Error("Unable to access enum");
  }; 
  
  /**
   * Return true if the ordinal is a valid ordinal in the frozen range.
   *
   * @param {Number} ordinal
   * @returns {Boolean} true if valid.
   */
  baja.EnumRange.prototype.isFrozenOrdinal = function (ordinal) {
    strictArg(ordinal, Number);
    return this.$frozen !== null && this.$frozen.isOrdinal(ordinal);
  };
  
  /**
   * Return true if the ordinal is a valid ordinal in the dynamic range.
   *
   * @param {Number} ordinal
   * @returns {Boolean} true if valid
   */
  baja.EnumRange.prototype.isDynamicOrdinal = function (ordinal) {
    strictArg(ordinal, Number);
    return this.$byOrdinal.hasOwnProperty(ordinal);
  };
  
  /**
   * Return the Type used for the frozen enum range or null if this range
   * has no frozen ordinal/tag pairs.
   *
   * @returns {Type} the Type for the FrozenEnum or null.
   */
  baja.EnumRange.prototype.getFrozenType = function () {
    return this.$frozen;
  };
  
  /**
   * Get the options for this range stored as a Facets instance.
   *
   * @returns {baja.Facets} facets
   */
  baja.EnumRange.prototype.getOptions = function () {
    return this.$options;
  };
  
  /**
   * Boolean EnumRange.
   */
  baja.EnumRange.BOOLEAN_RANGE = baja.EnumRange.make({
    "ordinals": [0, 1], 
    "tags": ["false", "true"]
  });      
    
  ////////////////////////////////////////////////////////////////
  // EnumSet
  ////////////////////////////////////////////////////////////////   
  
  /**
   * @class Represents a baja:EnumSet in BajaScript.
   * <p>
   * An EnumSet contains an EnumRange and an array of ordinals.
   * <p>
   * When creating a Simple, always use the 'make' method instead of creating a new Object.
   *
   * @name baja.EnumSet
   * @extends baja.Simple
   */
  baja.EnumSet = function (ordinals, range) {
    baja.EnumSet.$super.apply(this, arguments);  
    this.$ordinals = strictArg(ordinals);
    this.$range = strictArg(range, Object);
  }.$extend(baja.Simple);
  
  /**
   * Make an EnumSet. An EnumSet can be created using either an array of
   * ordinals (in which case the range will be set to 
   * <code>baja.EnumRange.DEFAULT</code>), or, to specify a range as well, an 
   * object literal with <code>ordinals</code> and <code>range</code> 
   * properties.
   * <pre>
   *   // For example...
   *   var defaultRange = baja.EnumSet.make([0, 1, 2]);
   *   var customRange = baja.EnumSet.make({
   *     ordinals: [0, 2, 4],
   *     range: baja.EnumRange.make({
   *       ordinals: [0, 1, 2, 3, 4],
   *       tags: ['a', 'b', 'c', 'd', 'e']
   *     })
   *   });
   * </pre>
   * <p>
   *
   * @param {Object|Array} obj the Object Literal that holds the method's arguments
   * (or an array of ordinals).
   * @param {Array} [obj.ordinals] an array of ordinals.
   * @param {baja.EnumRange} [obj.range] the EnumRange to assign the EnumSet.
   * @returns {baja.EnumSet} the EnumSet.
   */
  baja.EnumSet.make = function (obj) {    
    obj = objectify(obj, "ordinals");
    
    var ordinals = obj.ordinals,
        range = obj.range,
        count;
    
    if (ordinals === undefined) {
      ordinals = [];
    }
    
    if (range === undefined) {
      range = baja.EnumRange.DEFAULT;
    }
   
    strictArg(ordinals, Array);
    strictArg(range, baja.EnumRange);
    
    // optimization
    if (ordinals.length === 0 && range === baja.EnumRange.DEFAULT) {
      return baja.EnumSet.NULL;
    }
    
    return new baja.EnumSet(ordinals, range);
  };
  
  /**
   * Make an EnumSet. Same as static method <code>baja.EnumSet.make</code>.
   * 
   * @see baja.EnumSet.make
   */
  baja.EnumSet.prototype.make = function (obj) {    
    return baja.EnumSet.make.apply(baja.EnumSet, arguments);
  };

  /**
   * Decode an EnumSet from a String.
   *
   * @param {String} str
   * @returns {baja.EnumSet}
   */
  baja.EnumSet.prototype.decodeFromString = cacheDecode(function decodeFromString(str) {
    // parse range if specified
    var ordinals = [],
        ordinal,
        range,
        at = str.indexOf('@'),
        split,
        count,
        i;
    
    if (at >= 0) {
      range = baja.EnumRange.DEFAULT.decodeFromString(str.substring(at + 1));
      str = str.substring(0, at);
    }                       

    if (str.length) {
      split = str.split(',');
      count = split.length;
      for (i = 0; i < count; i++) {
        ordinal = parseInt(split[i], 10);
        if (isNaN(ordinal)) {
          throw new Error("Invalid ordinal: " + split[i]);
        }
        ordinals.push(ordinal);
      }
    }
    
    return this.make({
      ordinals: ordinals,
      range: range
    });
  });
  
  /**
   * Encode an EnumSet to a String.
   *
   * @returns {String}
   */
  baja.EnumSet.prototype.encodeToString = cacheEncode(function encodeToString() {  
    var ordinals = this.$ordinals,
        range = this.$range,
        s = ordinals.join(','),
        i;
    
    if (range && (range !== baja.EnumRange.DEFAULT)) {
      s += '@' + range.encodeToString();
    }
    return s;
  });
  
  /**
   * Return the data type symbol (E).
   *
   * @returns {String} data type symbol
   */
  baja.EnumSet.prototype.getDataTypeSymbol = function () {
    return "E";
  };
  
  /**
   * Return all of the ordinals for the EnumSet
   *
   * @returns {Array} an array of numbers that represents the ordinals for this EnumSet.
   */
  baja.EnumSet.prototype.getOrdinals = function () {
    return this.$ordinals;
  };
  
  baja.EnumSet.prototype.getRange = function () {
    return this.$range;
  };
  
  /**
   * Default EnumSet instance.
   */   
  baja.EnumSet.DEFAULT = new baja.EnumSet([], baja.EnumRange.DEFAULT);
  baja.EnumSet.NULL = baja.EnumSet.DEFAULT;
   
  // Register Type   
  baja.EnumSet.registerType("baja:EnumSet");

  /**
   * @class Represents a baja:Enum in BajaScript.
   *
   * @name baja.Enum
   * @extends baja.Simple
   */
  baja.Enum = function () { 
    baja.Enum.$super.apply(this, arguments);  
  }.$extend(baja.Simple);
  
  /**
   * Return the enum (itself).
   *
   * @returns {baja.Enum} returns an enum (itself).
   */
  baja.Enum.prototype.getEnum = function () {
    return this;
  };
    
  /**
   * Return the enum from a BIEnum.
   *
   * @return resolved enum value
   */
  baja.Enum.getEnumFromIEnum = function (enumVal) {
    var val = enumVal,
        type = enumVal.getType(),
        hasOut = false,
        out;
    
    if (type.isComplex()) {
      out = enumVal.get("out");
      if (out && out.getType().is("baja:StatusValue")) {
        val = out.getValue();
        hasOut = true;
      }
    }
    
    if (!hasOut) {
      if (type.is("baja:StatusValue")) {
        val = enumVal.getValue();
      }
      else if (typeof enumVal.getEnum === "function") {
        val = enumVal.getEnum();
      }
    }
    
    return val instanceof baja.Enum ? val : baja.DynamicEnum.DEFAULT;
  };
        
  /**
   * @class Represents a baja:DynamicEnum in BajaScript.
   * <p>
   * BDynamicEnum stores an ordinal state variable as 
   * a Number.  An instance of BEnumRange may be used to specify the range.
   * <p>
   * When creating a Simple, always use the 'make' method instead of creating a new Object.
   *
   * @name baja.DynamicEnum
   * @extends baja.Enum
   */
  baja.DynamicEnum = function (ordinal, range) {
    baja.DynamicEnum.$super.apply(this, arguments);
    this.$ordinal = strictArg(ordinal, Number);
    this.$range = strictArg(range || baja.EnumRange.DEFAULT, baja.EnumRange);    
  }.$extend(baja.Enum);
  
  /**
   * Make a DynamicEnum
   * <p>
   * An ordinal or an Object Literal can be used for the method's arguments...
   * <pre>
   *   var de1 = baja.DynamicEnum.make(0); // Just with an ordinal
   *
   *   //... or with an Object Literal...
   *
   *   var de2 = baja.DynamicEnum.make({ordinal: 0, range: enumRange});
   *   
   *   //...or create from another enumeration...
   *
   *   var de3 = baja.DynamicEnum.make({en: anEnum});
   * </pre>
   *
   * @param {Object|Number} [obj] the Object Literal for the method's arguments or an ordinal.
   * @param {Number} [obj.ordinal] the ordinal for the enum.
   * @param {baja.EnumRange} [obj.range] the range for the enum.
   * @param {baja.DynamicEnum|baja.FrozenEnum|Boolean|String} [obj.en] if defined, this enum will be used for the ordinal and range. 
   *                                                                   As well as an enum, this can also be a TypeSpec 
   *                                                                   String (moduleName:typeName) for a FrozenEnum.
   * @returns {baja.DynamicEnum} the DynamicEnum. 
   */
  baja.DynamicEnum.make = function (obj) {
    obj = objectify(obj, "ordinal");  
    
    var ordinal = bajaDef(obj.ordinal, 0);
    var range = bajaDef(obj.range, baja.EnumRange.DEFAULT);
    
    // Create from another enumeration...
    var en;
    if (obj.en !== undefined) {
      en = obj.en;
    
      if (!bajaHasType(en)) {
        throw new Error("Invalid Enum Argument");
      }
      
      if (en.getType().is("baja:DynamicEnum")) {
        return en;
      }
      
      // If a type spec is passed in then resolve it to the enum instance
      if (typeof en === "string") {
        en = baja.$(en);
      }
      
      if (en.getType().isFrozenEnum() || en.getType().is("baja:Boolean")) {
        ordinal = en.getOrdinal();
        range = en.getRange();
      }
      else {
        throw new Error("Argument must be an Enum");
      }
    }
    
    // Check for default
    if (ordinal === 0 && range === baja.EnumRange.DEFAULT) {
      return baja.DynamicEnum.DEFAULT;
    }
    
    return new baja.DynamicEnum(ordinal, range);
  };
  
  /**
   * Make a DynamicEnum.
   * <p>
   * An ordinal or an Object Literal can be used for the method's arguments...
   * <pre>
   *   var de1 = baja.$("baja:DynamicEnum").make(0); // Just with an ordinal
   *
   *   //... or with an Object Literal...
   *
   *   var de2 = baja.$("baja:DynamicEnum").make({ordinal: 0, range: enumRange});
   *   
   *   //...or create from another enumeration...
   *
   *   var de3 = baja.$("baja:DynamicEnum").make({en: anEnum});
   * </pre>
   *
   * @param {Object|Number} [obj] the Object Literal for the method's arguments or an ordinal.
   * @param {Number} [obj.ordinal] the ordinal for the enum.
   * @param {baja.EnumRange} [obj.range] the range for the enum.
   * @param {baja.DynamicEnum|baja.FrozenEnum|Boolean|String} [obj.en] if defined, this enum will be used for the ordinal and range. 
   *                                                                   As well as an enum, this can also be a TypeSpec 
   *                                                                   String (moduleName:typeName) for a FrozenEnum.
   * @returns {baja.DynamicEnum} the DynamicEnum.
   */
  baja.DynamicEnum.prototype.make = function (obj) {
    return baja.DynamicEnum.make.apply(baja.DynamicEnum, arguments);
  };
    
  /**
   * Decode a DynamicEnum from a String.
   *                    
   * @param {String} str  
   * @returns {baja.DynamicEnum}
   */  
  baja.DynamicEnum.prototype.decodeFromString = function (str) {   
    var o = str;
    var r = null;
    
    var at = str.indexOf("@");
    if (at > 0) { 
      o = str.substring(0, at); 
      r = str.substring(at + 1);
    }
        
    var ordinal = parseInt(o, 10);
    var range = baja.EnumRange.DEFAULT;
    if (r !== null) {
      range = range.decodeFromString(r);
    }
    
    return this.make({"ordinal": ordinal, "range": range});
  };
  baja.DynamicEnum.prototype.decodeFromString = cacheDecode(baja.DynamicEnum.prototype.decodeFromString);
  
  /**
   * Encode a DynamicEnum to a String.
   *
   * @name baja.DynamicEnum#encodeToString
   * @function
   *                     
   * @returns {String}
   */  
  baja.DynamicEnum.prototype.encodeToString = function () {       
    var s = "";
    s += this.$ordinal;
    if (this.$range !== baja.EnumRange.DEFAULT) {
      s += "@" + this.$range.encodeToString();
    }
    
    return s;
  };
  baja.DynamicEnum.prototype.encodeToString = cacheEncode(baja.DynamicEnum.prototype.encodeToString);
  
  /**
   * Default DynamicEnum instance.
   */   
  baja.DynamicEnum.DEFAULT = new baja.DynamicEnum(0, baja.EnumRange.DEFAULT);
   
  // Register Type   
  baja.DynamicEnum.registerType("baja:DynamicEnum");        
  
  /**
   * Return the data type symbol.
   *
   * @returns {String} the data type symbol.
   */
  baja.DynamicEnum.prototype.getDataTypeSymbol = function () {
    return "e";
  };
  
  /**
   * Return whether the enum is action or not.
   *
   * @returns {Boolean} true if active.
   */
  baja.DynamicEnum.prototype.isActive = function () {
    return this.$ordinal !== 0;
  };
  
  /**
   * Return the ordinal.
   *
   * @returns {Number} the ordinal.
   */
  baja.DynamicEnum.prototype.getOrdinal = function () {
    return this.$ordinal;
  };
  
  /**
   * Return the range.
   *
   * @returns {baja.EnumRange} the enum range.
   */
  baja.DynamicEnum.prototype.getRange = function () {
    return this.$range;
  };
  
  /**
   * Return the tag for the ordinal.
   *
   * @returns {String} the tag.
   */
  baja.DynamicEnum.prototype.getTag = function () {
    return this.$range.getTag(this.$ordinal);
  };
  
  /**
   * Return the String representation of the DynamicEnum.
   *
   * @returns {String}
   */
  baja.DynamicEnum.prototype.toString = function () {   
    return this.getTag();  
  };
  
  /**
   * Equals comparison via tag or ordinal.
   *
   * @param {String|Number|baja.DynamicEnum} arg the enum, tag or ordinal used for comparison.
   * @returns {Boolean} true if equal.
   */
  baja.DynamicEnum.prototype.is = function (arg) {  
    var tof = typeof arg;
    if (tof === "number") {
      return arg === this.$ordinal;
    }    
    else if (tof === "string") {
      return arg === this.getTag();
    }
    else {
      return this.equals(arg);
    }
  };
  
  /**
   * @class Represents a baja:FrozenEnum in BajaScript.
   * <p>
   * In Niagara, a BFrozenEnum is a hard coded set of enumerations and is immutable.
   * <p>
   * FrozenEnum objects are treated in a special way in BajaScript. A FrozenEnum's range (also
   * known as a Contract in BajaScript) is lazily requested and stored within the BajaScript 
   * registry. Therefore, this object shouldn't be used directly. 
   * Here's the preferred way of access an FrozenEnum...
   * <pre>
   *   var en = baja.$("baja:Weekday").get("monday");
   * </pre>
   *
   * @name baja.FrozenEnum
   * @extends baja.Enum
   *
   * @see baja.FrozenEnum#get
   */
   var FrozenEnum = function () {
    // This Constructor should be considered private
    FrozenEnum.$super.apply(this, arguments);  
    this.$ordinal = 0;
  }.$extend(baja.Enum);
  
  /**
   * Called once a Contract has been loaded onto a FrozenEnum.
   * <p>
   * This method is designed to be overriden.
   *
   * @name baja.FrozenEnum#contractCommitted
   * @function
   * @private
   */
  FrozenEnum.prototype.contractCommitted = function () { 
  };
  
  /**
   * Make a FrozenEnum.
   *
   * @name baja.FrozenEnum#make
   * @function
   * @private
   *
   * @param {String|Number} arg the tag or ordinal of the frozen enum we want to access.
   *
   * @see baja.FrozenEnum#make
   *
   * @returns {baja.FrozenEnum} the frozen enum.
   */  
  FrozenEnum.prototype.make = function (arg) {
    return this.get(arg);
  };
  
  /**
   * Decode a FrozenEnum from a String.
   *
   * @name baja.FrozenEnum#decodeFromString
   * @function
   *
   * @param {String} str
   * @returns {baja.FrozenEnum}
   */   
  FrozenEnum.prototype.decodeFromString = function (str) {   
    return this.get(str);  
  };
  
  /**
   * Encode the FrozenEnum to a String.
   *
   * @name baja.FrozenEnum#encodeToString
   * @function
   *
   * @returns {String}
   */ 
  FrozenEnum.prototype.encodeToString = function () {    
    return this.getTag();
  };
  
  /**
   * Default FrozenEnum instance.
   *
   * @name baja.FrozenEnum.DEFAULT
   * @private
   * @inner
   */   
  FrozenEnum.DEFAULT = new FrozenEnum();
    
  // Register Type
  FrozenEnum.registerType("baja:FrozenEnum");        
    
  /**
   * Return true if the enum is active.
   *
   * @name baja.FrozenEnum#isActive
   * @function
   *
   * @returns {Boolean} true if active.
   */
  FrozenEnum.prototype.isActive = function () {
    return this.$ordinal !== 0;
  };
  
  /**
   * Return the ordinal for the frozen enum.
   *
   * @name baja.FrozenEnum#getOrdinal
   * @function
   *
   * @returns {Number} ordinal.
   */
  FrozenEnum.prototype.getOrdinal = function () {
    return this.$ordinal;
  };
  
  /**
   * Return the range for the frozen enum.
   *
   * @name baja.FrozenEnum#getRange
   * @function
   *
   * @returns {baja.EnumRange} range.
   */
  FrozenEnum.prototype.getRange = function () {
    return this.getType().getRange();
  };
  
  /**
   * Return the tag for the FrozenEnum.
   *
   * @name baja.FrozenEnum#getTag
   * @function
   *
   * @returns {String} tag
   */
  FrozenEnum.prototype.getTag = function () {
    return this.getType().getTag(this.$ordinal);
  };
  
  /**
   * Return the display tag for the FrozenEnum.
   * <p>
   * A display tag is a translated human friendly readable version of a tag.
   *
   * @name baja.FrozenEnum#getDisplayTag
   * @function
   *
   * @returns {String} display tag.
   */
  FrozenEnum.prototype.getDisplayTag = function () {
    return this.getType().getDisplayTag(this.$ordinal);
  };
  
  /**
   * Return the String representation of a FrozenEnum.
   *
   * @name baja.FrozenEnum#toString
   * @function
   *
   * @returns {String} string
   */
  FrozenEnum.prototype.toString = function () {   
    return this.getDisplayTag();  
  };
  
  /**
   * Get a FrozenEnum.
   * <p>
   * This is the primary way to access an enum...
   * <pre>
   *   var en = baja.$("baja:Weekday").get("monday");
   * </pre>
   *
   * @name baja.FrozenEnum#get
   * @function
   *
   * @param {String|Number} arg the tag of ordinal of the enum to get.
   * @returns {baja.FrozenEnum} the frozen enum.
   */
  FrozenEnum.prototype.get = function (arg) {   
    return this.getRange().get(arg);  
  };
  
  /**
   * Equals comparison via tag or ordinal.
   * <p>
   * This is a convenient way to compare enums...
   * <pre>
   *   var monday = baja.$("baja:Weekday").get("monday");
   *   baja.outln("Is the day Tuesday?: " + monday.is("tuesday"));
   * </pre>
   *
   * @name baja.FrozenEnum#is
   * @function
   *
   * @param {String|Number|baja.FrozenEnum} arg the enum, tag or ordinal used for comparison.
   * @returns {Boolean} true if equal.
   */
  FrozenEnum.prototype.is = function (arg) {  
    var tof = typeof arg;
    if (tof === "string" || tof === "number") {
      return this.equals(this.getRange().get(arg)); 
    }
    else {
      return this.equals(arg);
    }    
  };
  
  /**
   * Return the Frozen Enum as a Dynamic Enum.
   * 
   * @name baja.FrozenEnum#asDynamic
   * @function
   * @see baja.DynamicEnum#make
   * 
   * @returns {baja.DynamicEnum}
   */
  FrozenEnum.prototype.asDynamic = function () {
    return baja.DynamicEnum.make({en: this});
  };
  
  ////////////////////////////////////////////////////////////////
  // Status
  ////////////////////////////////////////////////////////////////  
  
  /**
   * @class Represents a baja:Status in BajaScript.
   * <p>
   * Status provides a bit mask for various standardized 
   * status flags in the Baja control architecture. Plus
   * it provides for arbitrary extensions using BFacets.
   * <p>
   * When creating a Simple, always use the 'make' method instead of creating a new Object.
   *   
   * @name baja.Status
   * @extends baja.Simple
   */
  baja.Status = function (bits, facets) {
    // Constructor should be considered private
    baja.Status.$super.apply(this, arguments);  
    this.$bits = bits;
    this.$facets = facets;
  }.$extend(baja.Simple);
  
  /**
   * Make a Status
   * <p>
   * The bits (Number) or (for more arguments) an Object Literal can be used to specify the method's arguments.
   * <pre>
   *   var st1 = baja.Status.make(baja.Status.DOWN | baja.Status.FAULT);
   *   
   *   // ... or for more arguments...
   *   
   *   var st2 = baja.Status.make({
   *     bits: baja.Status.DOWN,
   *     facets: facets
   *   });
   * </pre>
   * The make method can also be used to create a new status with its state changed...
   * <pre>
   *   var newStatus = baja.Status.make({
   *     orig: oldStatus, 
   *     bits: baja.Status.OVERRIDDEN, 
   *     state: true
   *   }};
   * </pre>
   *
   * @param {Object|Number} obj the Object Literal that specifies the method's arguments or Status bits.
   * @param {Number} obj.bits the Status bits.
   * @param {baja.Facets} [obj.facets] the facets for the Status.
   * @param {baja.Status} [obj.orig] if defined, obj.state must also be defined. This is used to create
   *                                 a new Status with one of it's bit states changed (see example above).
   * @param {Boolean} [obj.state] the state of the bit to change (used in conjunction with obj.orig).
   * @returns {baja.Status} the status.
   */   
  baja.Status.make = function (obj) {
    obj = objectify(obj, "bits");
  
    var orig = obj.orig,
        bits = obj.bits,
        state = obj.state,
        facets = obj.facets,
        nullLookup = baja.Status.$nullLookup;
    
    // If the bits are a baja.Status then get the bits
    if (bajaHasType(bits) && bits.getType().equals(baja.Status.DEFAULT.getType())) {
      bits = bits.getBits();
    }
    
    strictArg(bits, Number);
    
    // Make with original bits...
    if (orig !== undefined) {
      strictAllArgs([orig, state], [baja.Status, Boolean]);
    
      bits = state ? (orig.$bits | bits) : (orig.$bits & ~bits);
      if (bits === 0 && orig.$facets === facetsDefault) {
        return baja.Status.ok;
      }   
      if (orig.$bits === bits) {
        return orig;
      }   
      facets = orig.$facets;
    }
    
    // Standard make...
    facets = bajaDef(facets, facetsDefault);
    strictArg(facets, baja.Facets);
    
    if (facets === facetsDefault) {
      if (bits === 0) {
        return baja.Status.DEFAULT;
      }
      
      if (bits <= 256) {
        if (!(nullLookup.hasOwnProperty(bits))) {
          nullLookup[bits] = new baja.Status(bits, facets);
        }
        return nullLookup[bits];
      }
    }
        
    return new baja.Status(bits, facets);
  };
   
  /**
   * Make a Status.
   * <p>
   * The bits (Number) or (for more arguments) an Object Literal can be used to specify the method's arguments.
   * <pre>
   *   var st1 = baja.Status.make(baja.Status.DOWN | baja.Status.FAULT);
   *   
   *   // ... or for more arguments...
   *   
   *   var st2 = baja.$("baja:Status").make({
   *     bits: baja.Status.DOWN,
   *     facets: facets
   *   });
   * </pre>
   * The make method can also be used to create a new status with its state changed...
   * <pre>
   *   var newStatus = baja.$("baja:Status").make({
   *     orig: oldStatus, 
   *     bits: baja.Status.OVERRIDDEN, 
   *     state: true
   *   }};
   * </pre>
   *
   * @param {Object|Number} obj the Object Literal that specifies the method's arguments or Status bits.
   * @param {Number} obj.bits the Status bits.
   * @param {baja.Facets} [obj.facets] the facets for the Status.
   * @param {baja.Status} [obj.orig] if defined, obj.state must also be defined. This is used to create
   *                                 a new Status with one of it's bit states changed (see example above).
   * @param {Boolean} [obj.state] the state of the bit to change (used in conjunction with obj.orig).
   * @returns {baja.Status} the status.
   */     
  baja.Status.prototype.make = function (obj) {
    return baja.Status.make.apply(baja.Status, arguments);
  };
  
  /**
   * Decode a Status from a String.
   *
   * @param {String} str
   * @returns {baja.Status}
   */   
  baja.Status.prototype.decodeFromString = function (str) {
    var x,
        semi = str.indexOf(';');
    if (semi < 0) {
      x = baja.Status.make(parseInt(str, 16));
    }
    else {
      var bits = parseInt(str.substring(0, semi), 16);
      x = baja.Status.make({"bits": bits, "facets": facetsDefault.decodeFromString(str.substring(semi + 1))});
    }
    return x;
  };
  baja.Status.prototype.decodeFromString = cacheDecode(baja.Status.prototype.decodeFromString);
  
  /**
   * Encode the Status to a String.
   *
   * @returns {String}
   */  
  baja.Status.prototype.encodeToString = function () {
    var s = this.$bits.toString(16);
    if (this.$facets !== facetsDefault) {
      s += ";" + this.$facets.encodeToString();
    }
    return s;
  };
  baja.Status.prototype.encodeToString = cacheEncode(baja.Status.prototype.encodeToString);
  
  /**
   * Equality test.
   *
   * @param obj
   * @returns {Boolean}
   */
  baja.Status.prototype.equals = function (obj) {
    if (bajaHasType(obj) && obj.getType().equals(this.getType())) {
      if (this.$facets === facetsDefault) {
        return obj.$bits === this.$bits;
      } 
      else {
        return obj.$bits === this.$bits && this.$facets.equals(obj.$facets);
      }
    }
    else {
      return false;
    }
  };
  
  /**
   * Default Status instance.
   */
  baja.Status.DEFAULT = new baja.Status(0, facetsDefault);
  
  // Register Type
  baja.Status.registerType("baja:Status"); 
    
  // If the facets are null then the Status is interned into this Object map
  var statusNullLookup = baja.Status.$nullLookup = {};
  
  /**
   * Bit for disabled.
   */
  baja.Status.DISABLED = 0x0001;
  
  /**
   * Bit for fault.
   */
  baja.Status.FAULT = 0x0002;
  
  /**
   * Bit for down.
   */
  baja.Status.DOWN = 0x0004;
  
  /**
   * Bit for alarm.
   */
  baja.Status.ALARM = 0x0008;
  
  /**
   * Bit for stale.
   */
  baja.Status.STALE = 0x0010;
  
  /**
   * Bit for overriden.
   */
  baja.Status.OVERRIDDEN = 0x0020;
  
  /**
   * Bit for null.
   */
  baja.Status.NULL = 0x0040;
  
  /**
   * Bit for unacked alarm.
   */
  baja.Status.UNACKED_ALARM = 0x0080;
  
  /**
   * String used in a Facets for identifying the active priority level of a writable point.
   */
  baja.Status.ACTIVE_LEVEL = "activeLevel";
  
  /**
   * Status for ok (null facets).
   */   
  baja.Status.ok = baja.Status.DEFAULT;
  
  /**
   * Status for disabled (null facets).
   */ 
  statusNullLookup[baja.Status.DISABLED] = baja.Status.disabled = new baja.Status(baja.Status.DISABLED, facetsDefault);
  
  /**
   * Status for fault (null facets).
   */ 
  statusNullLookup[baja.Status.FAULT] = baja.Status.fault = new baja.Status(baja.Status.FAULT, facetsDefault);
  
  /**
   * Status for down (null facets).
   */ 
  statusNullLookup[baja.Status.DOWN] = baja.Status.down = new baja.Status(baja.Status.DOWN, facetsDefault);
  
  /**
   * Status for alarm (null facets).
   */ 
  statusNullLookup[baja.Status.ALARM] = baja.Status.alarm = new baja.Status(baja.Status.ALARM, facetsDefault);
  
  /**
   * Status for stale (null facets).
   */ 
  statusNullLookup[baja.Status.STALE] = baja.Status.stale = new baja.Status(baja.Status.STALE, facetsDefault);
  
  /**
   * Status for overriden (null facets).
   */ 
  statusNullLookup[baja.Status.OVERRIDDEN] = baja.Status.overridden = new baja.Status(baja.Status.OVERRIDDEN, facetsDefault);
  
  /**
   * Status for null status (null facets).
   */ 
  statusNullLookup[baja.Status.NULL] = baja.Status.nullStatus = new baja.Status(baja.Status.NULL, facetsDefault);
  
  /**
   * Status for unacked alarm (null facets).
   */ 
  statusNullLookup[baja.Status.UNACKED_ALARM] = baja.Status.unackedAlarm = new baja.Status(baja.Status.UNACKED_ALARM, facetsDefault);
  
  /**
   * Return the facets for the Status.
   *
   * @returns {baja.Facets} status facets
   */   
  baja.Status.prototype.getFacets = function () {    
    return this.$facets;
  };
  
  /**
   * Return a value from the status facets.
   *
   * @param {String} name the name of the value to get from the status facets.
   * @param [def] if defined, this value is returned if the name can't be found in 
   *              the status facets.
   * @returns the value from the status facets (null if def is undefined and name can't be found).
   */
  baja.Status.prototype.get = function (name, def) {    
    return this.$facets.get(name, def);
  };
  
  /**
   * Return the Status bits.
   *
   * @returns {Number} status bits.
   */
  baja.Status.prototype.getBits = function () {    
    return this.$bits;
  };
  
  /**
   * Return true if the Status is not disabled, fault, down
   * stale or null.
   *
   * @returns {Boolean} true if valid.
   */
  baja.Status.prototype.isValid = function () {    
    return (((this.$bits & baja.Status.DISABLED) === 0) &&
            ((this.$bits & baja.Status.FAULT) === 0) && 
            ((this.$bits & baja.Status.DOWN)  === 0) && 
            ((this.$bits & baja.Status.STALE) === 0) && 
            ((this.$bits & baja.Status.NULL)  === 0));  
  };
  
  /**
   * Return true if the Status is ok.
   *
   * @returns {Boolean}
   */
  baja.Status.prototype.isOk = function () {
    return this.$bits === 0;  
  };
  
  /**
   * Return true if the Status is disabled.
   *
   * @returns {Boolean}
   */
  baja.Status.prototype.isDisabled = function () {
    return (this.$bits & baja.Status.DISABLED) !== 0;  
  };
  
  /**
   * Return true if the Status is in fault.
   *
   * @returns {Boolean}
   */
  baja.Status.prototype.isFault = function () {
    return (this.$bits & baja.Status.FAULT) !== 0;  
  };
  
  /**
   * Return true if the Status is down.
   *
   * @returns {Boolean}
   */
  baja.Status.prototype.isDown = function () {
    return (this.$bits & baja.Status.DOWN) !== 0;  
  };
  
  /**
   * Return true if the Status is in alarm.
   * 
   * @name baja.Status#isAlarm
   * @function
   *
   * @returns {Boolean}
   */
  baja.Status.prototype.isAlarm = function () {
    return (this.$bits & baja.Status.ALARM) !== 0;  
  };

  /**
   * Return true if the Status is stale.
   *
   * @returns {Boolean}
   */
  baja.Status.prototype.isStale = function () {
    return (this.$bits & baja.Status.STALE) !== 0;  
  };

  /**
   * Return true if the Status is overriden.
   *
   * @returns {Boolean}
   */
  baja.Status.prototype.isOverridden = function () {
    return (this.$bits & baja.Status.OVERRIDDEN) !== 0;  
  };
  
  /**
   * Return true if the Status is null.
   *
   * @returns {Boolean}
   */
  baja.Status.prototype.isNull = function () {
    return (this.$bits & baja.Status.NULL) !== 0;  
  };
  
  /**
   * Return true if the Status is unacked alarm.
   *
   * @returns {Boolean}
   */
  baja.Status.prototype.isUnackedAlarm = function () {
    return (this.$bits & baja.Status.UNACKED_ALARM) !== 0;  
  };  
  
  /**
   * Return the status (itself).
   *
   * @name baja.Status#getStatus
   * @function
   *
   * @returns {baja.Status} the status (itself).
   */
  baja.Status.prototype.getStatus = function () {
    return this;
  };
  
  /**
   * Return the status from a BIStatus.
   *
   * @return resolved status value
   */
  baja.Status.getStatusFromIStatus = function (statusVal) {
    var status = statusVal,
        type = statusVal.getType(),
        out,
        hasOut = false;
    
    if (type.isComplex()) {
      out = statusVal.get("out");
      if (out && out.getType().is("baja:StatusValue")) {
        status = out.getStatus();
        hasOut = true;
      }
    }
   
    if (!hasOut && (type.is("baja:StatusValue") || typeof statusVal.getStatus === "function")) {
      status = statusVal.getStatus();
    }
        
    return status instanceof baja.Status ? status : baja.Status.DEFAULT;
  };
  
  ////////////////////////////////////////////////////////////////
  // Date and Time
  ////////////////////////////////////////////////////////////////  
    
  (function dateAndTime() {
  
    ////////////////////////////////////////////////////////////////
    // Date and Time Text Formatting
    ////////////////////////////////////////////////////////////////
    
    /**
     * @namespace Date and Time formatting.
     */
    baja.TimeFormat = {};
    var SHOW_DATE    = baja.TimeFormat.SHOW_DATE = 0x01,
        SHOW_TIME    = baja.TimeFormat.SHOW_TIME = 0x02,
        SHOW_SECONDS = baja.TimeFormat.SHOW_SECONDS = 0x04,
        SHOW_MILLIS  = baja.TimeFormat.SHOW_MILLIS  = 0x08,
        SHOW_ZONE = 0x10; // TODO: Implement timezones. Currently this is unsupported.
  
    // In the first version, this implementation is currently limited
    var patternCache = {},
        SHOW = [
          0,            // 0  blank
          SHOW_DATE,    // 1  YEAR_2
          SHOW_DATE,    // 2  YEAR_4
          SHOW_DATE,    // 3  MON_1
          SHOW_DATE,    // 4  MON_2
          SHOW_DATE,    // 5  MON_TAG
          SHOW_DATE,    // 6  DAY_1
          SHOW_DATE,    // 7  DAY_2
          SHOW_TIME,    // 8  HOUR_12_1
          SHOW_TIME,    // 9  HOUR_12_2
          SHOW_TIME,    // 10 HOUR_24_1
          SHOW_TIME,    // 11 HOUR_24_2
          SHOW_TIME,    // 12 MIN
          SHOW_TIME,    // 13 AM_PM
          SHOW_SECONDS | SHOW_MILLIS, // 14 SEC
          SHOW_ZONE,    // 15 ZONE_TAG
          SHOW_DATE,    // 16  WEEK_1
          SHOW_DATE,    // 17  WEEK_2
          SHOW_DATE,    // 18  MON
          SHOW_ZONE,    // 19  ZONE_OFFSET
          SHOW_DATE     // 20  WEEK_YEAR
        ],
        YEAR_2    = 1,   // YY   two digit year
        YEAR_4    = 2,   // YYYY four digit year
        MON_1     = 3,   // M    one digit month
        MON_2     = 4,   // MM   two digit month
        MON_TAG   = 5,   // MMM  short tag month
        MON       = 18,  // MMMM  long tag month
        DAY_1     = 6,   // D    one digit day of month
        DAY_2     = 7,   // DD   two digit day of month
        HOUR_12_1 = 8,   // h    one digit 12 hour
        HOUR_12_2 = 9,   // hh   two digit 12 hour
        HOUR_24_1 = 10,  // H    one digit 24 hour
        HOUR_24_2 = 11,  // HH   two digit 24 hour
        MIN       = 12,  // mm   two digit minutes
        AM_PM     = 13,  // a    AM PM marker
        SEC       = 14,  // ss   two digit seconds and millis
        ZONE_TAG  = 15,  // z    timezone
        WEEK_1    = 16,  // W    short tag day of week
        WEEK_2    = 17,  // WW   day of week
        ZONE_OFFSET = 19,// Z    timezone offest (RFC 822)
        WEEK_YEAR = 20;  // w    week of year
    
    function toCode(c, count) {
      switch(c) {
        case "Y": return count <= 2 ? YEAR_2 : YEAR_4;
        case "M": 
          switch(count) {
            case 1: return MON_1;
            case 2: return MON_2;
            case 3: return MON_TAG;
            default: return MON;
          }
        case "D": return count === 1 ? DAY_1 : DAY_2;
        case "h": return count === 1 ? HOUR_12_1 : HOUR_12_2;
        case "H": return count === 1 ? HOUR_24_1 : HOUR_24_2;
        case "m": return MIN;
        case "s": return SEC;
        case "a": return AM_PM;
        case "z": return ZONE_TAG;
        case "Z": return ZONE_OFFSET;
        case "W": return count === 1 ? WEEK_1 : WEEK_2;
        case "w": return WEEK_YEAR;
        default:  return c.charCodeAt(0);
      }
    }
    
    function buildPattern(textPattern) {
      // Allocate a pattern array
      var len = textPattern.length,
          pattern = [],
          last = textPattern.charAt(0),
          count = 1,
          i,
          c;
        
      // Parse text pattern into pattern codes
      for (i = 1; i < len; ++i) {
        c = textPattern.charAt(i);
        if (last === c) { 
          count++;
          continue; 
        }
        pattern.push(toCode(last, count));
        last = c;
        count = 1;
      }
      pattern.push(toCode(last, count));
      return pattern;
    }
    
    function pad(s, num) {
      if (num < 10) {
        s += "0";
      }
      s += num;
      return s;
    } 
    
    /**
     * Create a formatting date/time String.
     *
     * @private
     * @ignore
     *
     * @param {Object} obj the Object Literal for the method's arguments.
     * @param {String} [obj.textPattern]
     * @param {baja.AbsTime} [obj.absTime]
     * @param {Number} [obj.year]
     * @param {baja.FrozenEnum} [obj.month]
     * @param {Number} [obj.day] days 1 to 31
     * @param {Number} [obj.hour]
     * @param {Number} [obj.min]
     * @param {Number} [obj.sec]
     * @param {Number} [obj.ms]
     * @param [obj.timeZone]
     * @param {Number} [obj.show] 
     */
    function toDateTimeString(obj) {    
      // Get the pattern code
      var pattern;
      if (patternCache.hasOwnProperty(obj.textPattern)) {
        pattern = patternCache[obj.textPattern];
      }
      else {
        pattern = patternCache[obj.textPattern] = buildPattern(obj.textPattern);      
      }
      
      var s = "",
          sep1 = -1,
          sep2 = -1,
          shownCount = 0,
          c,
          i;

      // walk thru the pattern
      for (i = 0; i < pattern.length; ++i) {
        // get the code
        c = pattern[i];

        // if the code is a separator, save it away and move on
        if (c >= SHOW.length) {
          if (sep1 === -1) {
            sep1 = c;
          }
          else if (sep2 === -1) {
            sep2 = c;
          }
          continue;
        }

        // if we shouldn't show this field, then clear
        // the pending separator and move on
        if ((SHOW[c] & obj.show) === 0) { 
          sep1 = sep2 = -1;
          continue;
        }

        // we are now going to show this field, so update our show count
        shownCount++;

        // if we have a pending separator then write the separator;
        // note we don't show the separator if this is the first field
        if (shownCount > 1 && sep1 !== -1) {
          s += String.fromCharCode(sep1);
          if (sep2 !== -1) {
            s += String.fromCharCode(sep2);
          }
          sep1 = sep2 = -1;
        }

        // output the field according to the pattern code
        shownCount++;
        switch(c) {
          case YEAR_2:
            //issue 12377
            //old code -> pad(s, year >= 2000 ? year-2000 : year-1900);
            //fix below
            s = pad(s, obj.year % 100);
            break;
          case YEAR_4:
            s += obj.year;
            break;
          case MON_1:
            s += obj.month.getOrdinal() + 1;
            break;
          case MON_2:
            s = pad(s, obj.month.getOrdinal() + 1);
            break;
          case MON_TAG:
            s += baja.lex("baja").get(obj.month.getTag() + ".short");
            break;
          case MON:
            s.append(obj.month.getDisplayTag());
            break;
          case DAY_1:
            s += obj.day;
            break;
          case DAY_2:
            s = pad(s, obj.day);
            break;
          case HOUR_12_1:
            if (obj.hour === 0) {
              s += "12";
            }
            else {
              s += obj.hour > 12 ? obj.hour - 12 : obj.hour;
            }
            break;
          case HOUR_12_2:
            if (obj.hour === 0) {
              s += "12";
            }  
            else {
              s = pad(s, obj.hour > 12 ? obj.hour - 12 : obj.hour);
            }
            break;
          case HOUR_24_1:
            s += obj.hour;
            break;
          case HOUR_24_2:
            s = pad(s, obj.hour);
            break;
          case MIN:
            s = pad(s, obj.min);
            break;
          case AM_PM:
            s += obj.hour < 12 ? "AM" : "PM";
            break;
          case SEC:
            s = pad(s, obj.sec);
            if ((obj.show & SHOW_MILLIS) === 0) {
              break;
            }
            s += ".";
            if (obj.ms < 10) {
              s += "0";
            }
            if (obj.ms < 100) {
              s += "0";
            }
            s += obj.ms;
            break;
          case ZONE_TAG:
            // TODO: Timezones
            s += "*** Zone tag not supported ***";
            break;
          case ZONE_OFFSET:
            // TODO: Timezones to get UTC offset
            var offset = obj.absTime.getOffset();

            if (offset === 0) {
              s += "Z";
            }
            else {
              var hrOff = Math.abs(offset / (1000 * 60 * 60)),
                  minOff = Math.abs((offset % (1000 * 60 * 60)) / (1000 * 60));

              if (offset < 0) {
                s += "-";
              }
              else {
                s += "+";
              }

              if (hrOff < 10) {
                s += "0";
              }
              s += hrOff;

              s += ":";
              if (minOff < 10) {
                s += "0";
              }
              s += minOff;
            }                    
            break;  
          case WEEK_1:
            s += baja.lex("baja").get(obj.absTime.getDate().getWeekday().getTag() + ".short");
            break;
          case WEEK_2:
            s += obj.absTime.getDate().getWeekday().getDisplayTag();
            break;
          case WEEK_YEAR:
            // TODO: Week year
            s += "*** Week year not supported ***";
            break;
        }

        // clear separators
        sep1 = sep2 = -1;
      }
      return s;
    }
    
   
    // These will get set as properties on RelTime, left free floating for
    // better minification.
    var MILLIS_IN_SECOND = 1000,
        MILLIS_IN_MINUTE = MILLIS_IN_SECOND * 60,
        MILLIS_IN_HOUR = MILLIS_IN_MINUTE * 60,
        MILLIS_IN_DAY = MILLIS_IN_HOUR * 24;
    
    /**
     * @class Represents a baja:Time in BajaScript.
     * <p>
     * Time stores a time of day which is independent 
     * of any date in the past or future.
     * <p>
     * When creating a Simple, always use the 'make' method instead of creating a new Object.
     *
     * @name baja.Time
     * @extends baja.Simple
     */
    baja.Time = function (hour, min, sec, ms) {
      // Constructor should be considered private
      baja.Time.$super.apply(this, arguments); 
      this.$hour = hour;
      this.$min = min;
      this.$sec = sec;
      this.$ms = ms;        
    }.$extend(baja.Simple);
    
    /**
     * Make a Time.
     * <p>
     * An Object Liternal is used for the method's arguments...
     * <pre>
     *   var t1 = baja.Time.make({
     *     hour: 23,
     *     min: 12,
     *     sec: 15,
     *     ms: 789
     *   });
     *   // ...or use a baja.RelTime to specify hour, min, sec and ms...
     *   var t2 = baja.Time.make({
     *     relTime: myRelTime
     *   });
     *   // ...or pass in milliseconds past midnight...
     *   var t3 = baja.Time.make(12345);
     * </pre>
     *
     * @param {Object} obj the Object Liternal used for the method's arguments.
     * @param {Number} [obj.hour] hours (0-23).
     * @param {Number} [obj.min] minutes (0-59).
     * @param {Number} [obj.sec] seconds (0-59).
     * @param {Number} [obj.ms] milliseconds (0-999).
     * @param {baja.RelTime} [obj.relTime] if defined, this is the milliseconds 
     *                                     since the start of the day. This overrides the 
     *                                     other hour, min, sec and ms arguments.
     * @returns {baja.Time} the time.
     */   
    baja.Time.make = function (obj) {
      var hour, min, sec, ms;
          
      function processMillis(millis) {
        baja.strictArg(millis, Number);
        millis = millis % MILLIS_IN_DAY;
        hour = Math.floor(millis / MILLIS_IN_HOUR);
        millis = millis % MILLIS_IN_HOUR;
        min = Math.floor(millis / MILLIS_IN_MINUTE);
        millis = millis % MILLIS_IN_MINUTE;
        sec = Math.floor(millis / MILLIS_IN_SECOND);
        ms = Math.floor(millis % MILLIS_IN_SECOND);
      }

      obj = objectify(obj, "milliseconds");
      
      if (typeof obj.milliseconds === "number") {
        // Create from a number of milliseconds...
        processMillis(obj.milliseconds);
      } 
      else if (bajaHasType(obj.relTime) && obj.relTime.getType().is("baja:RelTime")) {
        // Build from rel time (overrides other hour, min, sec and ms on object)...
        processMillis(obj.relTime.getMillis());
      } 
      else {
        // Attempt to get time from Object Literal...
        hour = bajaDef(obj.hour, 0);
        min = bajaDef(obj.min, 0);
        sec = bajaDef(obj.sec, 0);
        ms = bajaDef(obj.ms, 0);
      }
    
      // Ensure we're dealing with numbers
      strictAllArgs([hour, min, sec, ms], [Number, Number, Number, Number]);
          
      if (hour < 0 || hour > 23 ||
          min < 0 || min > 59 ||
          sec < 0 || sec > 59 ||
          ms < 0 || ms > 999) {
        throw new Error("Invalid time: " + hour + ":" + min + ":" + sec + "." + ms);
      }
      
      if (hour === 0 && min === 0 && sec === 0 && ms === 0) {
        return baja.Time.DEFAULT;
      }
      else {
        return new baja.Time(hour, min, sec, ms);
      }
    };
    
    /**
     * Make a Time.
     * <p>
     * An Object Liternal is used for the method's arguments...
     * <pre>
     *   var t1 = baja.$("baja:Time").make({
     *     hour: 23,
     *     min: 12,
     *     sec: 15,
     *     ms: 789
     *   });
     *   // ...or use a baja.RelTime to specify hour, min, sec and ms...
     *   var t2 = baja.$("baja:Time").make({
     *     relTime: timeOfDayMillis 
     *   });
     *   // ...or pass in milliseconds past midnight...
     *   var t3 = baja.Time.make(12345);
     * </pre>
     *
     * @param {Object} obj the Object Liternal used for the method's arguments.
     * @param {Number} [obj.hour] hours (0-23).
     * @param {Number} [obj.min] minutes (0-59).
     * @param {Number} [obj.sec] seconds (0-59).
     * @param {Number} [obj.ms] milliseconds (0-999).
     * @param {baja.RelTime} [obj.relTime] if defined, this is the milliseconds 
     *                                     since the start of the day. This overrides the 
     *                                     other hour, min, sec and ms arguments.
     * @returns {baja.Time} the time.
     */   
    baja.Time.prototype.make = function (obj) {
      return baja.Time.make.apply(baja.Time, arguments);
    };
    
    /**
     * Decode a Time from a String.
     *
     * @param {String} str
     * @returns {baja.Time}
     */   
    baja.Time.prototype.decodeFromString = function (str) {
      // Time ISO 8601 format hh:mm:ss.mmm
      var res = /^([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])\.([0-9]{3})$/.exec(str); 
      
      if (res === null) {
        throw new Error("Failed to decode time: " + str);
      }
      
      var t = baja.Time.make({
        hour: parseInt(res[1], 10),
        min: parseInt(res[2], 10),
        sec: parseInt(res[3], 10),
        ms: parseInt(res[4], 10)
      });  
          
      return t;
    };
    baja.Time.prototype.decodeFromString = cacheDecode(baja.Time.prototype.decodeFromString);
    
    // Util for padding out zeros into Strings
    function zeroPad(num, n) {
      var str = num.toString(10),
          zeros = n - str.length, i;
      for (i = 0; i < zeros; ++i) {
        str = "0" + str;
      }
      return str;
    }
    
    /**
     * Encode a Time to a String.
     *
     * @returns {String}
     */
    baja.Time.prototype.encodeToString = function () {
      return zeroPad(this.$hour, 2) + ":" + zeroPad(this.$min, 2) + ":" + zeroPad(this.$sec, 2) + "." +  zeroPad(this.$ms, 3);
    };
    baja.Time.prototype.encodeToString = cacheEncode(baja.Time.prototype.encodeToString);
    
    /**
     * Equality test.
     *
     * @param obj
     * @returns {Boolean}
     */
    baja.Time.prototype.equals = function (obj) {
      if (bajaHasType(obj) && obj.getType().equals(this.getType())) {
        return this.getTimeOfDayMillis() === obj.getTimeOfDayMillis();
      }
      else {
        return false;
      }
    };
    
    /**
     * Default Time instance.
     */
    baja.Time.DEFAULT = new baja.Time(0, 0, 0, 0);
    
    /**
     * Midnight Time.
     */
    baja.Time.MIDNIGHT = baja.Time.DEFAULT;
    
    // Register Type
    baja.Time.registerType("baja:Time"); 
    
    /**
     * Return hours (0-23).
     *
     * @returns {Number}
     */
    baja.Time.prototype.getHour = function () {
      return this.$hour;
    };
    
    /**
     * Return minutes (0-59).
     *
     * @returns {Number}
     */
    baja.Time.prototype.getMinute = function () {
      return this.$min;
    };
    
    /**
     * Return seconds (0-59).
     *
     * @returns {Number}
     */
    baja.Time.prototype.getSecond = function () {
      return this.$sec;
    };
    
    /**
     * Return milliseconds (0-999).
     *
     * @returns {Number}
     */
    baja.Time.prototype.getMillisecond = function () {
      return this.$ms;
    };
    
    /**
     * Return the milliseconds since the start of the day.
     *
     * @returns {Number}
     */
    baja.Time.prototype.getTimeOfDayMillis = function () {
      if (this.$timeOfDayMs === undefined) {
        var ret = this.$hour * MILLIS_IN_HOUR;
        ret += this.$min * MILLIS_IN_MINUTE;
        ret += this.$sec * MILLIS_IN_SECOND;
        ret += this.$ms;
        this.$timeOfDayMs = ret;
      }
      return this.$timeOfDayMs;
    };
    
    /**
     * Return a new time of day by adding the specified
     * duration. If the result goes past midnight, then roll
     * into the next day.
     *
     * @param {baja.RelTime|baja.Time|Number} duration - RelTime or number of millis
     * @returns {baja.Time} the new time with the duration added on.
     */
    baja.Time.prototype.add = function (duration) {
      strictArg(duration);
      
      if (typeof duration.getMillis === 'function') {
        duration = duration.getMillis();
      } else if (typeof duration.getTimeOfDayMillis === 'function') {
        duration = duration.getTimeOfDayMillis();
      }
      
      strictArg(duration, Number);
      
      return baja.Time.make(MILLIS_IN_DAY 
                            + this.getTimeOfDayMillis() 
                            + duration);
    };

    /**
     * Return true if the specified time is before this time.
     *
     * @param {baja.Time} time
     * @returns {Boolean}
     */
    baja.Time.prototype.isBefore = function (time) {
      strictArg(time, baja.Time);
      return this.getTimeOfDayMillis() < time.getTimeOfDayMillis();
    };
    
    /**
     * Return true if the specified time is after this time.
     *
     * @param {baja.Time} time
     * @returns {Boolean}
     */
    baja.Time.prototype.isAfter = function (time) {
      strictArg(time, baja.Time);
      return this.getTimeOfDayMillis() > time.getTimeOfDayMillis();
    };
  
   /**
    * Return a String representation of the time.
    * 
    * @param {Object} [obj] the Object Literal for the method's arguments.
    * @params {String} [obj.textPattern] the text pattern to use for formatting.
    *                                    If not specified, then the user's default
    *                                    time format text pattern will be used.
    * @param {Number} [obj.show] flags used to format the time. For more information,
    *                            please see {@link baja.TimeFormat}.
    * @returns {String}
    */
    baja.Time.prototype.toString = function (obj) {
      var textPattern = (obj && obj.textPattern) || baja.getTimeFormatPattern(),
          show = ((obj && obj.show) || 0) | SHOW_TIME;
    
      // Filter out invalid flags
      show &= ~SHOW_DATE;
    
      return toDateTimeString({
        show: show,
        textPattern: textPattern,
        hour: this.$hour,
        min: this.$min,
        sec: this.$sec,
        ms: this.$ms
      });
    };
      
    /**
     * @class Represents a baja:Date in BajaScript.
     * <p>
     * Date represents a specific day, month, and year.
     * <p>
     * When creating a Simple, always use the 'make' method instead of creating a new Object.
     *
     * @name baja.Date
     * @extends baja.Simple
     */
    baja.Date = function (year, month, day) {
      // Constructor should be considered private
      baja.Date.$super.apply(this, arguments); 
      this.$year = year;
      this.$month = month; // Zero indexed
      this.$day = day;       
    }.$extend(baja.Simple);
    
    /**
     * Make a Date.
     * <p>
     * An Object Literal is used to for the method's arguments...
     * <pre>
     *   var d1 = baja.Date.make({
     *     year: 2008,
     *     month: baja.$("baja:Month").get("december"),
     *     day: 24
     *   });
     *   // ...or from a JavaScript Date...
     *   var d2 = baja.Date.make({
     *     jsDate: date
     *   });
     * </pre>
     *
     * @param {Object} obj the Object Literal.
     * @param {Number} obj.year
     * @param {Number|baja.FrozenEnum} obj.month Number (0-11) or a baja:Month FrozenEnum for the month of the year.
     * @param {Number} obj.day (1-31).
     * @param {Date} [obj.jsDate] A JavaScript Date used to specify the year, month and day.
     *                            If defined, this will override the year, month and day arguments.
     * @returns {baja.Date}                          
     */
    baja.Date.make = function (obj) {
      obj = objectify(obj);
      
      var year,
          month,
          day;
      
      // Create baja.Date from a JavaScript date
      if (obj.jsDate && obj.jsDate instanceof Date) {
        year = obj.jsDate.getFullYear();
        month = obj.jsDate.getMonth(); // zero index based
        day = obj.jsDate.getDate();
      }
      else {
        year = obj.year;
        month = obj.month; // If a number, this should be zero index based
        day = obj.day;
        
        // If the month is a baja:Month then get its ordinal as zero index based
        if (bajaHasType(month) && month.getType().is("baja:Month")) {
          month = month.getOrdinal();
        }
      }
         
      // Validate we have these specified
      strictAllArgs([year, month, day], [Number, Number, Number]);
      
      if (year < 0 || month < 0 || month > 11 || day < 1 || day > 31) {
        throw new Error("Invalid date range");
      }
      
      // Check to see if we should return the default instance
      var d = baja.Date.DEFAULT;
      if (year === d.$year && month === d.$month && day === d.$day) {
        return d;
      }
      
      return new baja.Date(year, month, day);
    };
    
    /**
     * Make a Date.
     * <p>
     * An Object Literal is used to for the method's arguments...
     * <pre>
     *   var d1 = baja.$("baja:Date").make({
     *     year: 2008,
     *     month: baja.$("baja:Month").get("december"),
     *     day: 24
     *   });
     *   // ...or from a JavaScript Date...
     *   var d2 = baja.$("baja:Date").make({
     *     jsDate: date
     *   });
     * </pre>
     *
     * @param {Object} obj the Object Literal.
     * @param {Number} obj.year
     * @param {Number|baja.FrozenEnum} obj.month Number (0-11) or a baja:Month FrozenEnum for the month of the year.
     * @param {Number} obj.day (1-31).
     * @param {Date} [obj.jsDate] A JavaScript Date used to specify the year, month and day.
     *                            If defined, this will override the year, month and day arguments.
     * @returns {baja.Date}                          
     */
    baja.Date.prototype.make = function (obj) {
      return baja.Date.make.apply(baja.Date, arguments);
    };
    
    /**
     * Decode a Date from a String.
     * 
     * @name baja.Date#decodeFromString
     * @function
     *
     * @param {String} str
     * @returns {baja.Date}
     */   
    baja.Date.prototype.decodeFromString = function (str) {
      // Decode ISO 8601 encoding yyyy-mm-dd
      var res = /^([0-9]{4,})\-([0-9]{2})\-([0-9]{2})$/.exec(str);
      
      if (res === null) {
        throw new Error("Could not decode baja.Date: " + str);
      }
      
      function parse(s) {
        return parseInt(s, 10);
      }
      
      var d = baja.Date.make({
        year: parse(res[1]), 
        month: parse(res[2]) - 1, 
        day: parse(res[3])
      });
      
      return d;
    };
    baja.Date.prototype.decodeFromString = cacheDecode(baja.Date.prototype.decodeFromString);
    
    /**
     * Encode the Date to a String.
     * 
     * @name baja.Date#encodeToString
     * @function
     *
     * @returns {String}
     */ 
    baja.Date.prototype.encodeToString = function () {    
      var s = zeroPad(this.$year, 4) + "-" + zeroPad((this.$month + 1), 2) + "-" + zeroPad(this.$day, 2);
      return s;
    };
    baja.Date.prototype.encodeToString = cacheEncode(baja.Date.prototype.encodeToString);
    
    var dateCompareTo = function (date) {
      strictArg(date, baja.Date);
      if (this.$year !== date.$year) { 
        return this.$year - date.$year;
      }      
      if (this.$month !== date.$month) {
        return this.$month - date.$month;
      }
      if (this.$day !== date.$day) {
        return this.$day - date.$day;
      }
      return 0;
    };
    
    /**
     * Equality test.
     *
     * @param obj
     * @returns {Boolean}
     */ 
    baja.Date.prototype.equals = function (obj) {
      if (bajaHasType(obj) && obj.getType().equals(this.getType())) {
        return dateCompareTo.call(this, obj) === 0;
      }
      else {
        return false;
      } 
    };
    
    /**
     * Default Date instance.
     */
    baja.Date.DEFAULT = new baja.Date(1970, 0, 1);
    
    // Register Type
    baja.Date.registerType("baja:Date"); 
    
    /**
     * Return a Date that maps to the current day.
     * 
     * @name baja.Date#today
     * @function
     *
     * @returns {baja.Date}
     */
    baja.Date.today = function () {
      return baja.Date.make({jsDate: new Date()});
    };
    
    /**
     * Return the year.
     *
     * @returns {Number}
     */
    baja.Date.prototype.getYear = function () {
      return this.$year;
    };
    
    /**
     * Return the month.
     *
     * @returns {baja.FrozenEnum} a baja:Month FrozenEnum
     */
    baja.Date.prototype.getMonth = function () {
      return baja.$("baja:Month").get(this.$month);
    };
    
    /**
     * Return the day (1-31).
     *
     * @returns {Number}
     */
    baja.Date.prototype.getDay = function () {
      return this.$day;
    };
    
    /**
     * Return a new JavaScript Date using this date's year, month and day.
     *
     * @returns {Date}
     */   
    baja.Date.prototype.getJsDate = function () {
      // JavaScript Date is mutable therefore we have to return a new instance of Date each time
      return new Date(this.$year, 
                      this.$month, 
                      this.$day, 
                      /*hours*/0, 
                      /*minutes*/0, 
                      /*seconds*/0, 
                      /*ms*/0);
    };
    
    var getCachedJsDate = function () {
      // Lazily create and return an immutable cached version of the JavaScript Date
      if (this.$jsDate === undefined) {
        this.$jsDate = this.getJsDate();
      }
      return this.$jsDate;
    };
    
    /**
     * Return the weekday as a baja:Weekday FrozenEnum.
     *
     * @returns {baja.FrozenEnum} a baja:Weekday FrozenEnum.
     */
    baja.Date.prototype.getWeekday = function () {
      return baja.$("baja:Weekday").get(getCachedJsDate.call(this).getDay());
    };
    
   /**
    * Return true if the specified date is before this date.
    * 
    * @returns {Boolean}
    */
    baja.Date.prototype.isBefore = function (date) {
      return dateCompareTo.call(this, date) < 0;
    };
    
   /**
    * Return true if the specified date is after this date.
    * 
    * @returns {Boolean}
    */
    baja.Date.prototype.isAfter = function (date) {
      return dateCompareTo.call(this, date) > 0;
    };
        
   /**
    * Return a String representation of the Date.
    * 
    * @param {Object} [obj] the Object Literal for the method's arguments.
    * @params {String} [obj.textPattern] the text pattern to use for formatting.
    *                                    If not specified, then the user's default
    *                                    time format text pattern will be used.
    * @param {Number} [obj.show] flags used to format the time. For more information,
    *                            please see {@link baja.TimeFormat}.
    * @returns {String}
    */
    baja.Date.prototype.toString = function (obj) {
      var textPattern = (obj && obj.textPattern) || baja.getTimeFormatPattern(),
          show = ((obj && obj.show) || 0) | SHOW_DATE;
    
      // Filter out invalid flags
      show &= ~SHOW_TIME;
      show &= ~SHOW_SECONDS;
      show &= ~SHOW_MILLIS;
    
      return toDateTimeString({
        show: show,
        textPattern: textPattern,
        year: this.getYear(),
        month: this.getMonth(),
        day: this.getDay()
      });
    };
    
    // TODO: getDayOfYear, isLeapYear, add, subtract, delta, nextDay, prevDay, nextMonth, prevMonth, nextYear, prevYear, next, prev
    
    /**
     * @class Represents a baja:AbsTime in BajaScript.
     * <p>
     * AbsTime encapsulates an absolute point in time
     * relative to a given time zone.
     * <p>
     * When creating a Simple, always use the 'make' method instead of creating a new Object.
     *
     * @name baja.AbsTime
     * @extends baja.Simple
     */
    baja.AbsTime = function (date, time, offset) {
      // Constructor should be considered private
      baja.AbsTime.$super.apply(this, arguments);        
      this.$date = date;
      this.$time = time;
      this.$offset = offset;
    }.$extend(baja.Simple);
    
    /**
     * Make an AbsTime.
     * <p>
     * An Object Literal is used for the method's arguments...
     * <pre>
     *   var at1 = baja.$("baja:AbsTime").make({
     *     date: baja.Date.make({year: 1981, month: 5, day: 17}),
     *     time: baja.Time.make({hour: 15, min: 30}),
     *     offset: -5 * (60 * 60 * 1000) // GMT-05:00
     *   });
     *   // ...or from a JavaScript Date.
     *   // here, time zone offset will be pulled direct from the JS date...
     *   var at2 = baja.AbsTime.make({ jsDate: new Date() });
     *   
     *   // here, time zone offset is set explicitly.
     *   var at3 = baja.AbsTime.make({ 
     *     jsDate: new Date(), 
     *     offset: -8 * (60 * 60 * 1000) // GMT-08:00
     *   });
     * </pre>
     *
     * @param {Object} obj the Object Literal used for the method's arguments.
     * 
     * @param {baja.Date} [obj.date] The <code>baja.Date</code> representing the
     * date part of this <code>AbsTime</code>. Ignored if 
     * <code>obj.jsDate</code> is given.
     * 
     * @param {baja.Time} [obj.time] The <code>baja.Time</code> representing the
     * time part of this <code>AbsTime</code>. Ignored if
     * <code>obj.jsDate</code> is given.
     * 
     * @param {Number} [obj.offset] The time zone offset from UTC, in 
     * milliseconds. If omitted (undefined), then it will either (a) calculate
     * it using the time zone offset from <code>obj.jsDate</code>, if the JS 
     * date is given, or (b) default to 0 (UTC), if no JS date is given. For 
     * example, GMT-05:00 corresponds to -18000000 ms.
     * 
     * @param {Date} [obj.jsDate] if defined, this date is used for the date 
     * and time.
     * 
     * @returns baja.AbsTime
     */
    baja.AbsTime.make = function (obj) {
      obj = objectify(obj);
      
      var date = bajaDef(obj.date, baja.Date.DEFAULT),
          time = bajaDef(obj.time, baja.Time.DEFAULT),
          offset = bajaDef(obj.offset, 0),
          jsDate = obj.jsDate;
          
      if (jsDate) {
        // Get information from JavaScript Date
        if (!(jsDate instanceof Date)) {
          throw new Error("jsDate must be a JavaScript Date");
        }
        
        date = baja.Date.make({
          "year": jsDate.getFullYear(), 
          "month": jsDate.getMonth(), 
          "day": jsDate.getDate()
        });
        
        time = baja.Time.make({
          "hour": jsDate.getHours(), 
          "min": jsDate.getMinutes(), 
          "sec": jsDate.getSeconds(), 
          "ms": jsDate.getMilliseconds()
        });
        
        offset = jsDate.getTimezoneOffset() * -60000;
      }
      
      // The year, month and day must always be specified for this to be valid
      strictAllArgs([date, time, offset], [baja.Date, baja.Time, Number]);
      
      if (date === baja.Date.DEFAULT && time === baja.Time.DEFAULT && offset === 0) {
        return baja.AbsTime.DEFAULT;
      }
      
      return new baja.AbsTime(date, time, offset);
    };
    
    /**
     * See <code>baja.AbsTime.make()</code>.
     */
    baja.AbsTime.prototype.make = function (obj) {
      return baja.AbsTime.make.apply(baja.AbsTime, arguments);
    };
    
    /**
     * Decode an AbsTime from a String.
     *
     * @param {String} str
     * @returns {baja.AbsTime}
     */   
    baja.AbsTime.prototype.decodeFromString = function (str) {
      // Decode ISO 8601 encoding that BAbsTime creates
      var res = /^([0-9]{4,})\-([0-9]{2})\-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})\.([0-9]+)(?:(Z)|(?:(\-|\+)([0-9]{2}):([0-9]{2})))$/.exec(str);
      
      if (res === null) {
        throw new Error("Could not decode AbsTime: " + str);
      }
      
      function parse(s) {
        return parseInt(s, 10);
      }
      
      var date = baja.Date.make({
        "year": parse(res[1]),
        "month": parse(res[2]) - 1, // Zero indexed based
        "day": parse(res[3])
      });
      
      var time = baja.Time.make({
        "hour": parse(res[4]),
        "min": parse(res[5]),
        "sec": parse(res[6]),
        "ms": parse(res[7])
      });
          
      var offset = 0;
      
      if (res[8] !== "Z") {
        // Parse hour and minutes and convert to millis
        offset = parse(res[10]) * (60 * 60 * 1000) + parse(res[11]) * (60 * 1000);
        
        // Apply sign
        if (res[9] === "-") {
          offset *= -1;
        }
      }
      
      return baja.AbsTime.make({
        "date": date, 
        "time": time,
        "offset": offset
      });
    };
    baja.AbsTime.prototype.decodeFromString = cacheDecode(baja.AbsTime.prototype.decodeFromString);
    
    /**
     * Encode the AbsTime to a String.
     *
     * @returns {String}
     */   
    baja.AbsTime.prototype.encodeToString = function () {     
      var s = this.$date.encodeToString() + "T" + this.$time.encodeToString();
          
      if (this.$offset === 0) {
        s += "Z";
      }
      else {
        var hrOff = Math.floor(Math.abs(this.$offset / (1000 * 60 * 60)));
        var minOff = Math.floor(Math.abs((this.$offset % (1000 * 60 * 60)) / (1000 * 60)));

        if (this.$offset < 0) {
          s += "-";
        }
        else {
          s += "+";
        }

        s += zeroPad(hrOff, 2) + ":";
        s += zeroPad(minOff, 2);
      }
      
      return s;
    };
    baja.AbsTime.prototype.encodeToString = cacheEncode(baja.AbsTime.prototype.encodeToString);
    
    /**
     * Equality test.
     *
     * @param obj
     * @returns {Boolean}
     */
    baja.AbsTime.prototype.equals = function (obj) {  
      if (bajaHasType(obj, 'baja:AbsTime')) {
        return obj.getMillis() === this.getMillis();
      }
      return false;
    };
    
    /**
     * Default AbsTime instance - maps to Java Epoch.
     */
    baja.AbsTime.DEFAULT = new baja.AbsTime(baja.Date.DEFAULT, baja.Time.DEFAULT, 0);
    
    // Register Type
    baja.AbsTime.registerType("baja:AbsTime");
    
    /**
     * Return the data type symbol.
     *
     * @returns {String}
     */   
    baja.AbsTime.prototype.getDataTypeSymbol = function () {
      return "a";
    };
    
    /**
     * Return the time.
     *
     * @returns {baja.Time}
     */   
    baja.AbsTime.prototype.getTime = function () {
      return this.$time;
    };
    
    /**
     * Return the date.
     *
     * @returns {baja.Date}
     */ 
    baja.AbsTime.prototype.getDate = function () {
      return this.$date;
    };
    
    /**
     * Return the UTC offset.
     *
     * @returns {Number}
     */ 
    baja.AbsTime.prototype.getOffset = function () {
      return this.$offset;
    };
    
    /** 
     * Make an AbsTime with the current date and time.
     *
     * @returns {baja.AbsTime}
     */
    baja.AbsTime.now = function () {
      return baja.AbsTime.make({ jsDate: new Date() });
    };
    
    /**
     * Return a new JavaScript Date based on this AbsTime.
     * <p>
     * Please, note the AbsTime UTC offset is ignored.
     *
     * @name baja.AbsTime#getJsDate
     * @function
     *
     * @returns {Date}
     */
    baja.AbsTime.prototype.getJsDate = function () {
      // Create a JavaScript Date and return it (warning has no timezone offset)
      var jsDate = this.$jsDate;
      if (!jsDate) {
        jsDate = new Date(this.getMillis());
        this.$jsDate = jsDate;
      }
      return jsDate;
    };
    
    /**
     * Get the number of milliseconds past the epoch represented by this AbsTime.
     * 
     * @returns {Number}
     */
    baja.AbsTime.prototype.getMillis = function () {
      var millis = this.$millis;
      
      if (millis === undefined) {
        var date = this.$date,
            time = this.$time,
            year = date.getYear(),
            month = date.getMonth().getOrdinal(),
            day = date.getDay(),
            hour = time.getHour(),
            min = time.getMinute(),
            sec = time.getSecond(),
            ms = time.getMillisecond();
        
        millis = this.$millis = 
          Date.UTC(year, month, day, hour, min, sec, ms) - this.$offset;
      }
      
      return millis;
    };
        
   /**
    * Return a String representation of the AbsTime.
    * 
    * @param {Object} [obj] the Object Literal for the method's arguments.
    * @params {String} [obj.textPattern] the text pattern to use for formatting.
    *                                    If not specified, then the user's default
    *                                    time format text pattern will be used.
    * @param {Number} [obj.show] flags used to format the time. For more information,
    *                            please see {@link baja.TimeFormat}.
    * @returns {String}
    */
    baja.AbsTime.prototype.toString = function (obj) {
      var textPattern = (obj && obj.textPattern) || baja.getTimeFormatPattern(),
          show = (obj && obj.show) || (SHOW_DATE | SHOW_TIME | SHOW_SECONDS | SHOW_MILLIS),
          time = this.$time,
          date = this.$date;
        
      return toDateTimeString({
        show: show,
        textPattern: textPattern,
        year: date.getYear(),
        month: date.getMonth(),
        day: date.getDay(),
        hour:  time.getHour(), 
        min: time.getMinute(), 
        sec: time.getSecond(), 
        ms: time.getMillisecond()
      });
    };
        
    /**
     * @class Represents a baja:RelTime in BajaScript.
     * <p>
     * RelTime is a Simple type for managing
     * a relative amount of time. 
     * <p>
     * When creating a Simple, always use the 'make' method instead of creating a new Object.
     *
     * @name baja.RelTime
     * @extends baja.Simple
     */
    baja.RelTime = function (ms) {
      baja.RelTime.$super.apply(this, arguments); 
      this.$ms = parseInt(ms, 10);
    }.$extend(baja.Simple);
    
    /**
     * Make a RelTime.
     * <p>
     * This method can take a number of milliseconds of an Object Literal with the method's argument...
     * <pre>
     *   var rt1 = baja.RelTime.make(1000); // One second
     *
     *   // ...or we can specify an Object Literal for more arguments...
     *
     *   // Create a RelTime with 2 days + 2 hours + 2 minutes + 2 seconds + 2 milliseconds...
     *   var rt2 = baja.RelTime.make({
     *     days: 2,
     *     hours: 2,
     *     minutes: 2,
     *     seconds: 2,
     *     ms: 2
     *   });
     * </pre>
     *
     * @param {Object|Number} [obj] the Object Literal or the number of milliseconds.
     * @param {Object} [obj.days] the number of days.
     * @param {Object} [obj.hours] the number of hours.
     * @param {Object} [obj.minutes] the number of minutes.
     * @param {Object} [obj.seconds] the number of seconds.
     * @param {Object} [obj.ms] the number of milliseconds.
     * @returns {baja.RelTime}
     */
    baja.RelTime.make = function (obj) {
      var ms = 0;
      
      if (typeof obj === "number") {
        ms = obj;
      }
      else {
        obj = objectify(obj, "ms");
        ms = bajaDef(obj.ms, 0);
        
        strictArg(ms, Number);
        
        if (typeof obj.days === "number") {
          ms += MILLIS_IN_DAY * obj.days;
        }
        if (typeof obj.hours === "number") {
          ms += MILLIS_IN_HOUR * obj.hours;
        }
        if (typeof obj.minutes === "number") {
          ms += MILLIS_IN_MINUTE * obj.minutes;
        }
        if (typeof obj.seconds === "number") {
          ms += MILLIS_IN_SECOND * obj.seconds;
        }
      }
          
      if (ms === 0) {
        return baja.RelTime.DEFAULT;
      }
      return new baja.RelTime(ms);
    };
    
    /**
     * Make a RelTime.
     * <p>
     * This method can take a number of milliseconds of an Object Literal with the method's argument...
     * <pre>
     *   var rt1 = baja.$("baja:RelTime").make(1000); // One second
     *
     *   // ...or we can specify an Object Literal for more arguments...
     *
     *   // Create a RelTime with 2 days + 2 hours + 2 minutes + 2 seconds + 2 milliseconds...
     *   var rt2 = baja.$("baja:RelTime").make({
     *     days: 2,
     *     hours: 2,
     *     minutes: 2,
     *     seconds: 2,
     *     ms: 2
     *   });
     * </pre>
     *
     * @param {Object|Number} [obj] the Object Literal or the number of milliseconds.
     * @param {Object} [obj.days] the number of days.
     * @param {Object} [obj.hours] the number of hours.
     * @param {Object} [obj.minutes] the number of minutes.
     * @param {Object} [obj.seconds] the number of seconds.
     * @param {Object} [obj.ms] the number of milliseconds.
     * @returns {baja.RelTime}
     */
    baja.RelTime.prototype.make = function (ms) {
      return baja.RelTime.make.apply(baja.RelTime, arguments);
    };
    
    /**
     * Decode a RelTime from a String.
     * 
     * @name baja.RelTime#decodeFromString
     * @function
     *
     * @param {String} str
     * @returns {baja.RelTime}
     */  
    baja.RelTime.prototype.decodeFromString = function (str) {
      // Parse number
      var n = Number(str);
      
      // If still not a number then throw an error
      if (isNaN(n)) {
        throw new Error("Unable to create RelTime: " + str);
      }
    
      return baja.RelTime.make(n);
    };
    baja.RelTime.prototype.decodeFromString = cacheDecode(baja.RelTime.prototype.decodeFromString);
    
    /**
     * Encode the RelTime to a String.
     * 
     * @name baja.RelTime#encodeToString
     * @function
     *
     * @returns {String}
     */ 
    baja.RelTime.prototype.encodeToString = function () {
      return this.$ms.toString();
    };
    baja.RelTime.prototype.encodeToString = cacheEncode(baja.RelTime.prototype.encodeToString);
    
    /**
     * Default RelTime instance.
     */   
    baja.RelTime.DEFAULT = new baja.RelTime(0);
    
    // Register Type
    baja.RelTime.registerType("baja:RelTime");
    
    /**
     * Milliseconds in a second (Number).
     */   
    baja.RelTime.MILLIS_IN_SECOND = MILLIS_IN_SECOND;
    
    /**
     * Milliseconds in a minute (Number).
     */  
    baja.RelTime.MILLIS_IN_MINUTE = MILLIS_IN_MINUTE;
    
    /**
     * Milliseconds in an hour (Number).
     */  
    baja.RelTime.MILLIS_IN_HOUR = MILLIS_IN_HOUR;
    
    /**
     * Milliseconds in a day (Number).
     */  
    baja.RelTime.MILLIS_IN_DAY = MILLIS_IN_DAY;
    
    /**
     * RelTime instance for a second.
     */  
    baja.RelTime.SECOND = baja.RelTime.make(MILLIS_IN_SECOND);
    
    /**
     * RelTime instance for a minute.
     */
    baja.RelTime.MINUTE = baja.RelTime.make(MILLIS_IN_MINUTE);
    
    /**
     * RelTime instance for an hour.
     */
    baja.RelTime.HOUR = baja.RelTime.make(MILLIS_IN_HOUR);
    
    /**
     * RelTime instance for a day.
     */
    baja.RelTime.DAY = baja.RelTime.make(MILLIS_IN_DAY);
    
    /**
     * Equality test.
     *
     * @function
     *
     * @param obj
     * @returns {Boolean}
     */
    baja.RelTime.prototype.equals = valueOfEquals;
    
    /**
     * Return the data type symbol.
     * 
     * @name baja.RelTime#getDataTypeSymbol
     * @function
     *
     * @returns {String}
     */   
    baja.RelTime.prototype.getDataTypeSymbol = function () {
      return "r";
    };
    
    /**
     * Return number of milliseconds.
     *
     * @returns {Number}
     */    
    baja.RelTime.prototype.valueOf = function () {
      return this.$ms;
    };
    
    /**
     * Return a String representation of a RelTime.
     *
     * @returns {String}
     */
    baja.RelTime.prototype.toString = function () {
      return this.$ms.toString();
    };
    
    /**
     * Return number of milliseconds.
     *
     * @returns {Number}
     */
    baja.RelTime.prototype.getMillis = function () {
      return this.$ms;
    };
    
    /**
     * Return the milliseconds part of this duration.
     * 
     * @returns {Number}
     */
    baja.RelTime.prototype.getMillisPart = function () {
      return this.$ms % 1000;
    };
    
    function truncateToInteger(num) {
      return Math[num < 0 ? 'ceil' : 'floor'](num);
    }
    /**
     * Return number of seconds.
     *
     * @returns {Number}
     */
    baja.RelTime.prototype.getSeconds = function () {
      return truncateToInteger(this.$ms / MILLIS_IN_SECOND);
    };
    
    /**
     * Return the seconds part of this duration.
     * 
     * @returns {Number}
     */
    baja.RelTime.prototype.getSecondsPart = function () {
      return this.getSeconds() % 60;
    };
    
    /**
     * Return number of minutes.
     *
     * @returns {Number}
     */
    baja.RelTime.prototype.getMinutes = function () {
      return truncateToInteger(this.$ms / MILLIS_IN_MINUTE);
    };
    
    /**
     * Return the minutes part of this duration.
     * 
     * @returns {Number}
     */
    baja.RelTime.prototype.getMinutesPart = function () {
      return this.getMinutes() % 60;
    };
    
    /**
     * Return number of hours.
     *
     * @returns {Number}
     */
    baja.RelTime.prototype.getHours = function () {
      return truncateToInteger(this.$ms / MILLIS_IN_HOUR);
    };
    
    /**
     * Return the hours part of this duration.
     * 
     * @returns {Number}
     */
    baja.RelTime.prototype.getHoursPart = function () {
      return this.getHours() % 24;
    };
    
    /**
     * Return number of days.
     *
     * @returns {Number}
     */
    baja.RelTime.prototype.getDays = function () {
      return truncateToInteger(this.$ms / MILLIS_IN_DAY);
    };
    
    /**
     * Return the days part of this duration.
     * 
     * @returns {Number}
     */
    baja.RelTime.prototype.getDaysPart = function () {
      return this.getDays();
    };
  
  }()); // dateAndTime
  
  ////////////////////////////////////////////////////////////////
  // Icon
  //////////////////////////////////////////////////////////////// 
  
  /**
   * @class A BajaScript Icon.
   * <p>
   * A BajaScript Icon may contain multiple Image references.
   * <p>
   * For maximum efficiency, all icons in BajaScript are completely interned.
   * <p>
   * This Constructor shouldn't be invoked directly. Please use the 'make' methods to create
   * an instance of an Icon.
   *
   * @name baja.Icon
   * @extends baja.Simple
   */
 
  var iconsCache = {};
  
  baja.Icon = function (ords) {
    baja.Icon.$super.apply(this, arguments); 
    this.$ords = strictArg(ords, Array);     
  }.$extend(baja.Simple);
  
  /**
   * Default Icon instance.
   */
  baja.Icon.DEFAULT = new baja.Icon([]);
  
  function encodeIcon(ords) {
    return ords.join("\n");
  }
    
  /**
   * Make an Icon.
   *
   * @param {Array|String} [ords] an array of Image ORDs or Strings or just a single ORD or String
   * @returns {baja.Icon}
   */
  baja.Icon.make = function (ords) {        
    if (arguments.length === 0) {
      return baja.Icon.DEFAULT;
    }
    
    // If a String is passed in then convert to an Array
    if (typeof ords === "string") {
      ords = [ords];    
    }
    // If an array is passed in then treat this as an array of ORDs
    if (ords && ords.constructor === Array) {
      var encodedStr = encodeIcon(ords);
      // If available from the cache then use it...
      if (iconsCache.hasOwnProperty(encodedStr)) {
        return iconsCache[encodedStr];
      }
    
      if (ords.length === 0) {
        return baja.Icon.DEFAULT;
      }
      if (ords.length === 1 && ords[0].toString() === "") {
        return baja.Icon.DEFAULT;
      }
    
      var newOrds = [], i;
      for (i = 0; i < ords.length; ++i) {
        newOrds.push(baja.Ord.make(ords[i].toString()));
      }
      
      var icon = new baja.Icon(newOrds);
      // Store icon in cache
      iconsCache[encodedStr] = icon;
      icon.$cEncStr = encodedStr;
      
      return icon;
    }
    else {
      throw new Error("Invalid argument for baja.Icon.make");
    }
  };
  
  /**
   * Make an Icon.
   *
   * @param {Array} [images] an array of Image ORDs or Strings
   * @returns {baja.Icon}
   */
  baja.Icon.prototype.make = function (args) {
    return baja.Icon.make.apply(baja.Icon, arguments);
  };
   
  /**
   * Decode a String to an Icon.
   *
   * @param {String} str
   * @returns {baja.Icon}
   */
  baja.Icon.prototype.decodeFromString = function (str) {  
    // If available from the cache then use it...
    if (iconsCache.hasOwnProperty(str)) {
      return iconsCache[str];
    }
  
    return baja.Icon.make(str.split("\n"));
  };
  
  /**
   * Encode Icon to a String.
   *
   * @returns {String}
   */
  baja.Icon.prototype.encodeToString = function () {
    if (!this.$cEncStr) {
      this.$cEncStr = encodeIcon(this.$ords);
    }
    return this.$cEncStr;
  };
    
  // Register Type
  baja.Icon.registerType("baja:Icon");  
  
  /**
   * Return a String representation of the Icon.
   *
   * @returns {String}
   */
  baja.Icon.prototype.toString = function () {
    return this.encodeToString();
  };
  
  /**
   * Return the inner value of the Icon.
   *
   * @returns {String}
   */
  baja.Icon.prototype.valueOf = function () {
    return this.toString();
  };
    
  /**
   * Return a copy of the image ORDs Array.
   * <p>
   * Please note, this is a copy of the Image ORDs and not the URIs to access the images.
   *
   * @see baja.Icon#getImageUris
   *
   * @returns {Array} an array of ORDs to the images.
   */
  baja.Icon.prototype.getImageOrds = function () {
    // Return a copy of the images array
    return Array.prototype.slice.call(this.$ords);
  };  
  
  /**
   * Return an array of URIs to the images.
   *
   * @returns {Array} an array of URI Strings to the images.
   */
  baja.Icon.prototype.getImageUris = function () {
    var regex = /^module\:\/\//, i;
    if (!this.$uris) {
      this.$uris = [];
      for (i = 0; i < this.$ords.length; ++i) {
        this.$uris.push(this.$ords[i].toString().replace(regex, "/module/"));
      }
    }
    return Array.prototype.slice.call(this.$uris);
  }; 
  
  /**
   * Return the standard Object Icon.
   *
   * @returns {baja.Icon}
   */
  var iconStdObj;
  baja.Icon.getStdObjectIcon = function () {
    if (!iconStdObj) {
      iconStdObj = baja.Icon.make(["module://icons/x16/object.png"]); 
    }
    return iconStdObj;
  };
  
  ////////////////////////////////////////////////////////////////
  // Format
  //////////////////////////////////////////////////////////////// 
  
  /**
   * @class Format is used to format Objects into Strings using
   * a standardized formatting pattern language.
   * <p>
   * Currently this implementation of Format is limited to processing Lexicon patterns.
   * <p>
   * This Constructor shouldn't be invoked directly. Please use the 'make' methods to create
   * an instance of a Format.
   *
   * @name baja.Format
   * @extends baja.Simple
   */
  baja.Format = function (pattern) {
    baja.Format.$super.apply(this, arguments); 
    this.$pattern = strictArg(pattern, String);     
  }.$extend(baja.Simple);
  
  /**
   * Default Format instance.
   */
  baja.Format.DEFAULT = new baja.Format("");
      
  /**
   * Make a Format.
   *
   * @param {String} [pattern] the Format Pattern String.
   * @returns {baja.Format}
   */
  baja.Format.make = function (pattern) {
    pattern = pattern || "";
    
    if (pattern === "") {
      return baja.Format.DEFAULT;
    }    
    
    baja.strictArg(pattern, String);
    
    return new baja.Format(pattern);    
  };
  
  /**
   * Make a Format.
   *
   * @param {String} [pattern] the Format Pattern String.
   * @returns {baja.Format}
   */
  baja.Format.prototype.make = function (args) {
    return baja.Format.make.apply(baja.Format, arguments);
  };
   
  /**
   * Decode a String to a Format.
   *
   * @param {String} str
   * @returns {baja.Format}
   */
  baja.Format.prototype.decodeFromString = function (str) {  
    return baja.Format.make(str);
  };
  
  /**
   * Encode Format to a String.
   *
   * @name baja.Format#encodeToString
   * @function
   *
   * @returns {String}
   */
  baja.Format.prototype.encodeToString = function () {
    return this.$pattern;
  };
    
  // Register Type
  baja.Format.registerType("baja:Format");  
  
  /**
   * Return a String representation of the Format.
   *
   * @returns {String}
   */
  baja.Format.prototype.toString = function () {
    return this.$pattern;
  };
  
  /**
   * Return the inner value of the Format.
   *
   * @function
   *
   * @returns {String}
   */
  baja.Format.prototype.valueOf = baja.Format.prototype.toString;
  
  // Scope some of the variables here...
  (function () {
    var formatMatches = [],
        formatErr = "error: ",
        lexiconRegex = /^lexicon\(([a-zA-Z0-9]+)\:([a-zA-Z0-9.\-_]+)\)$/;
    
    // Replace %% with %
    formatMatches.push({
      isMatch: function (content) {
        return content === "";
      },
      replace: function () {
        return "%";
      }
    });
    
    // Identity %.%
    formatMatches.push({
      isMatch: function (content) {
        return content === ".";
      },
      replace: function (content, obj) {
        var val, parent, slot = null, i, o;
        if (obj.target) {
          if (obj.target.container) {
            if (obj.target.propertyPath && obj.target.propertyPath.length > 0) {
              val = parent = obj.target.container;
              
              for (i = 0; i < obj.target.propertyPath.length; ++i) {
                slot = obj.target.propertyPath[i];
                parent = val;
                val = val.get(slot);
              }

              return obj.display ? parent.getDisplay(slot) : parent.get(slot);
            }
            else {
              return obj.display ? obj.target.container.getDisplay(obj.target.slot) : obj.target.container.get(obj.target.slot);
            }
          }
          else {
            o = obj.target.getObject();
            return obj.display && bajaHasType(o) && o.getType().isComplex() ? o.getDisplay() : o;
          }
        } 
        else {
          o = obj.object;
          return obj.display && bajaHasType(o) && o.getType().isComplex() ? o.getDisplay() : o;
        }
      }
    });
    
    // Lexicon %.%
    formatMatches.push({
      isMatch: function (content) {
        return content.match(lexiconRegex);
      },
      replace: function (content, obj) {
        var result = lexiconRegex.exec(content),
            res = null;
        lexiconRegex.lastIndex = 0;
        try {
          res = baja.lex(result[1]).get(result[2]);
        }
        catch (ignore) {}
        return res;
      }
    });
        
    // Reflect Call
    formatMatches.push({
      isMatch: function (content) {
        // Always last in the list so this should always match
        return true;
      },
      replace: function (content, obj) {        
        var val, parent, slot = null, x,
            split = content.split(/\./g);
        
        // Process the format text
        val = parent = obj.object; 
        
        for (x = 0; x < split.length; ++x) {
          if (val === null || val === undefined) {
            return formatErr + content;
          }
        
          // First try looking for the Slot
          if (bajaHasType(val, "baja:Complex") && val.has(split[x])) {
            slot = val.getSlot(split[x]);
            parent = val;
            val = val.get(slot);
          }
          // If there's not Slot then see if a function exists
          else {
            // Nullify this since at this point we're no longer looking up a Slot chain
            slot = null;
            parent = null;
            
            if (typeof val["get" + split[x].capitalizeFirstLetter()] === "function") {
              val = val["get" + split[x].capitalizeFirstLetter()]();
            }
            else if (typeof val[split[x]] === "function") {
              val = val[split[x]]();
            }
            else if (typeof val.get === "function") {
              val = baja.def(val.get(split[x]), null);
            }
            else {
              val = null;
            }
          }
        }
        
        if (slot && parent) {
          val = obj.display ? parent.getDisplay(slot) : parent.get(slot);
          return val;
        }
        else if (bajaHasType(val, "baja:Complex")) {
          parent = val.getParent();
          if (parent) {
            val = obj.display ? parent.getDisplay(val.getPropertyInParent()) : parent.get(val.getPropertyInParent());
            return val;
          }
        }
        // As a last resort, just call toString
        if (val !== null) {
          return val.toString();
        }
        return val;
      }
    });
      
    
    /**
     * Format the specified object using the format pattern.
     * <p>
     * This method can take an Object Literal or a single pattern String
     * argument.
     *
     * @param {Object} obj the Object Literal.
     * @param {String} obj.pattern the format pattern to process.
     * @param {Boolean} [obj.display] if true, the display string of a Property value is used.
     *                                If false, the toString version of a Property value is used.
     *                                By default, this value is true (in BajaScript, most of the time
     *                                we're dealing with mounted Components in a Proxy Component Space).  
     *
     * @returns {String}
     */
    baja.Format.format = function (obj) { 

      // TODO: Currently format processing doesn't work in exactly the same way as Niagara. 
      // Certainly it can never be 100% accurate. However, we can try to cover most common use cases
      // that we want to support.
    
      obj = objectify(obj, "pattern");
      var pattern = obj.pattern;
      obj.display = bajaDef(obj.display, true);
       
      // Format replace       
      var result = pattern.replace(/%[^%]*%/g, function (match) {
        // Remove '%' at start and end
        var content = match.substring(1, match.length - 1), i;
        
        // Match up with a format handler and process it
        for (i = 0; i < formatMatches.length; ++i) {
          if (formatMatches[i].isMatch(content)) {
            var res = formatMatches[i].replace(content, obj);
            return res === null ? formatErr + content : res;
          }
        }
        return formatErr + content;
      }); 

      return result;   
    };      
  }());
  
  /**
   * Format the specified object using the format pattern.
   *
   * @returns {String}
   */
  baja.Format.prototype.format = function (obj) {
    obj = objectify(obj);
    obj.pattern = this.$pattern;
    return baja.Format.format(obj);
  };
  
  ////////////////////////////////////////////////////////////////
  // Permissions
  //////////////////////////////////////////////////////////////// 
  
  /**
   * @class Permissions for a given security domain.
   * <p>
   * This Constructor shouldn't be invoked directly. Please use the 'make' methods to create
   * an instance of a Permissions Object. 
   *
   * @name baja.Permissions
   * @extends baja.Simple
   */
  baja.Permissions = function (mask) {
    baja.Permissions.$super.apply(this, arguments); 
    this.$mask = mask;
  }.$extend(baja.Simple);
    
  var OPERATOR_READ = baja.Permissions.OPERATOR_READ = 0x0001,
      OPERATOR_WRITE = baja.Permissions.OPERATOR_WRITE = 0x0002,
      OPERATOR_INVOKE = baja.Permissions.OPERATOR_INVOKE = 0x0004,
      ADMIN_READ = baja.Permissions.ADMIN_READ = 0x0010,
      ADMIN_WRITE = baja.Permissions.ADMIN_WRITE  = 0x0020,
      ADMIN_INVOKE = baja.Permissions.ADMIN_INVOKE = 0x0040,
      permissionsAll = OPERATOR_READ | OPERATOR_WRITE | OPERATOR_INVOKE | ADMIN_READ | ADMIN_WRITE | ADMIN_INVOKE,
      permissionsCache = {};
  
  permissionsCache[0] = baja.Permissions.none = baja.Permissions.DEFAULT = new baja.Permissions(0);
  permissionsCache[permissionsAll] = baja.Permissions.all = new baja.Permissions(permissionsAll);
  
  /**
   * Make a permissions object.
   *
   * @params {String|Number} perm the permissions to decode.
   * @returns {baja.Permissions}
   */
  baja.Permissions.prototype.make = function (perm) {
    var mask = 0,
        i,
        p;
        
    if (typeof perm === "string") {        
      for (i = 0; i < perm.length; ++i) {
        switch(perm.charAt(i)) {
          case "i": mask |= OPERATOR_INVOKE; break;
          case "r": mask |= OPERATOR_READ; break;
          case "w": mask |= OPERATOR_WRITE; break;
          case "I": mask |= ADMIN_INVOKE; break;
          case "R": mask |= ADMIN_READ; break;
          case "W": mask |= ADMIN_WRITE; break;
        }
      }
    }
    else {
      mask = perm;
    }
    
    // Get permissions from cache
    if (permissionsCache[mask]) {
      p = permissionsCache[mask];
    }
    else {
      p = permissionsCache[mask] = new baja.Permissions(mask);
    }
    return p;
  };
  
  /**
   * Make a permissions object.
   *
   * @params {String|Number} perm the permissions to decode.
   * @returns {baja.Permissions}
   */
  baja.Permissions.make = function (perm) {
    return baja.Permissions.DEFAULT.make.apply(baja.Permissions.DEFAULT, arguments);
  };
  
  /**
   * Decode Permissions from a String.
   *
   * @name baja.Permissions#decodeFromString
   * @function
   *
   * @returns {baja.Permissions}
   */  
  baja.Permissions.prototype.decodeFromString = cacheDecode(function (s) {
    return this.make(s);
  });
  
  /**
   * Encode Permissions to a String.
   *
   * @name baja.Permissions#encodeToString
   * @function
   *
   * @returns {String}
   */  
  baja.Permissions.prototype.encodeToString = cacheEncode(function () {
    var s = "";
    if (this.hasOperatorInvoke()) {
      s += "i";
    }
    if (this.hasOperatorRead()) {
      s += "r";
    }
    if (this.hasOperatorWrite()) {
      s += "w";
    }
    if (this.hasAdminInvoke()) {
      s += "I";
    }
    if (this.hasAdminRead()) {
      s += "R";
    }
    if (this.hasAdminWrite()) {
      s += "W";
    }
    return s;
  });
  
  /**
   * Return a String representation of the Permissions.
   *
   * @returns {String}
   */
  baja.Permissions.prototype.toString = function () {
    return this.encodeToString();
  };
  
  // Register Type
  baja.Permissions.registerType("baja:Permissions");  
  
  /**
   * Is the operator read permission enabled?
   *
   * @returns {Boolean}
   */
  baja.Permissions.prototype.hasOperatorRead = function () {
    return (this.$mask & OPERATOR_READ) !== 0;
  };
  
  /**
   * Is the operator write permission enabled?
   *
   * @returns {Boolean}
   */
  baja.Permissions.prototype.hasOperatorWrite = function () {
    return (this.$mask & OPERATOR_WRITE) !== 0;
  };
  
  /**
   * Is the operator invoke permission enabled?
   *
   * @returns {Boolean}
   */
  baja.Permissions.prototype.hasOperatorInvoke = function () {
    return (this.$mask & OPERATOR_INVOKE) !== 0;
  };
  
  /**
   * Is the admin read permission enabled?
   *
   * @returns {Boolean}
   */
  baja.Permissions.prototype.hasAdminRead = function () {
    return (this.$mask & ADMIN_READ) !== 0;
  };
  
  /**
   * Is the admin write permission enabled?
   *
   * @returns {Boolean}
   */
  baja.Permissions.prototype.hasAdminWrite = function () {
    return (this.$mask & ADMIN_WRITE) !== 0;
  };
  
  /**
   * Is the admin invoke permission enabled?
   *
   * @returns {Boolean}
   */
  baja.Permissions.prototype.hasAdminInvoke = function () {
    return (this.$mask & ADMIN_INVOKE) !== 0;
  };
  
  /**
   * Return true if the specified permissions are enabled.
   *
   * @params {Number|baja.Permissions}
   * @returns {Boolean}
   */
  baja.Permissions.prototype.has = function (mask) {
    if (mask && mask instanceof baja.Permissions) {
      mask = mask.getMask();
    }
    return (this.$mask & mask) === mask;
  };
  
  /**
   * Return the mask for the permissions.
   *
   * @returns {Boolean}
   */
  baja.Permissions.prototype.getMask = function () {
    return this.$mask;
  };
  
  ////////////////////////////////////////////////////////////////
  // NameMap
  //////////////////////////////////////////////////////////////// 
    
/**
   * @class NameMap used for managing a list of String names to Format values.
   * <p>
   * This Constructor shouldn't be invoked directly. Please use the 'make' methods to create
   * an instance of a NameMap Object. 
   *
   * @name baja.NameMap
   * @extends baja.Simple
   */
  baja.NameMap = function (map, $fromDecode) {
    baja.NameMap.$super.apply(this, arguments); 
    
    if ($fromDecode) {
      this.$map = map;
    }
    else {
      strictArg(map, Object);
      this.$map = {};
      // Copy over Properties into this map
      var p,
          v;
      for (p in map) {
        if (map.hasOwnProperty(p)) {
          v = map[p];
          this.$map[p] = v instanceof baja.Format ? v : baja.Format.make(v);
        }
      }
    }
  }.$extend(baja.Simple);
  
  // The simple default instance
  baja.NameMap.DEFAULT = new baja.NameMap({});
  
  /**
   * Make a NameMap object.
   *
   * @params {Object} an object containing key/value pairs.
   * @returns {baja.NameMap}
   */
  baja.NameMap.prototype.make = function (map, $fromDecode) {
    if (!map) {
      return baja.NameMap.DEFAULT;
    }
    return new baja.NameMap(map, $fromDecode);
  };
  
  /**
   * Make a NameMap object.
   *
   * @params {Object} an object containing key/value pairs.
   * @returns {baja.NameMap}
   */
  baja.NameMap.make = function (map) {
    return baja.NameMap.DEFAULT.make.apply(baja.NameMap.DEFAULT, arguments);
  };
  
  /**
   * Decode NameMap from a String.
   *
   * @name baja.NameMap#decodeFromString
   * @function
   *
   * @returns {baja.NameMap}
   */  
  baja.NameMap.prototype.decodeFromString = cacheDecode(function (s) {
    if (s === "{}") {
      return baja.NameMap.DEFAULT;
    }
    
    // Parse everything between {...}
    var res = /^\{(.*)\}$/.exec(s),
        map,
        i = 0,
        buf = "",
        lastDelim = ";",
        key,
        c,
        body;
    
    if (!res) {
      throw new Error("Invalid NameMap");
    }
    
    if (!res[1]) {
      return baja.NameMap.DEFAULT;
    }
    
    // Parse each key value pair (key=value;)
    map = {};
    body = res[1];
    
    // Due to the escaping, this is very difficult to do with regular expressions so we're just
    // going to do this the old fashioned way.
    for (i = 0; i < body.length; ++i) {
      c = body.charAt(i);
      
      if (c === "\\") {
        buf += body.charAt(++i);
      }
      else if (c !== "=" && c !== ";") {
        buf += c;
      }
      else {
        if (c === lastDelim) {
          throw new Error("Invalid NameMap Encoding");
        }
        lastDelim = c;
        if (!key) {
          key = buf;
        }
        else {
          map[key] = baja.Format.make(buf);
          key = undefined;
        }
        buf = "";
      }      
    }
    
    return this.make(map, /*$fromDecode*/true);
  });
  
  function escapeNameMapReplace(match) {
    return "\\" + match;
  }
  
  function escapeNameMapValue(val) {
    return val.replace(/\=|\\|\{|\}|\=|\;/g, escapeNameMapReplace);
  }
  
  /**
   * Encode NameMap to a String.
   *
   * @name baja.NameMap#encodeToString
   * @function
   *
   * @returns {String}
   */  
  baja.NameMap.prototype.encodeToString = cacheEncode(function () {
    var s = "{",
        p,
        map = this.$map;
        
    for (p in map) {
      if (map.hasOwnProperty(p)) {
        s += escapeNameMapValue(p);
        s += "=";       
        s += escapeNameMapValue(map[p].encodeToString());
        s += ";";        
      }
    }
    
    s += "}";
    
    return s;
  });
  
  /**
   * Return a String representation of the NameMap.
   *
   * @returns {String}
   */
  baja.NameMap.prototype.toString = function () {
    return this.encodeToString();
  };
  
  // Register Type
  baja.NameMap.registerType("baja:NameMap");  
  
  /**
   * Return a Format from the Map or null if an entry can't be found.
   *
   * @returns {baja.Format} or null if an entry can't be found.
   */
  baja.NameMap.prototype.get = function (name) {
    return this.$map[name] || null;
  };
  
  /**
   * Return a list of all the keys in the Map.
   *
   * @returns an array of String key names.
   */
  baja.NameMap.prototype.list = function () {
    var map = this.$map,
        p,
        keys = [];
        
    for (p in map) {
      if (map.hasOwnProperty(p)) {
        keys.push(p);
      }
    }
    
    return keys;
  };
    
}(baja));
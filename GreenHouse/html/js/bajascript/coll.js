//
// Copyright 2010, Tridium, Inc. All Rights Reserved.
//

/**
 * Collections Architecture for BajaScript.
 *
 * @author Gareth Johnson
 * @version 1.0.0.0
 */

//JsLint options (see http://www.jslint.com )
/*jslint rhino: true, onevar: false, plusplus: true, white: true, undef: false, nomen: false, 
eqeqeq: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: false, indent: 2, 
vars: true, continue: true */

// Globals for JsLint to ignore 
/*global baja, BaseBajaObj*/ 
  
(function coll(baja) {

  // Use ECMAScript 5 Strict Mode
  "use strict";
  
  // Create local for improved minification
  var strictArg = baja.strictArg,
      strictAllArgs = baja.strictAllArgs,
      bajaDef = baja.def;
  
  function isObjEmpty(obj) {
    var p;
    for (p in obj) {
      if (obj.hasOwnProperty(p)) {
        return false;
      }
    }
    return true;
  }
  
  /**
   * @namespace BajaScript Collection Namespace.
   */
  baja.coll = new BaseBajaObj();
     
  ////////////////////////////////////////////////////////////////
  // Collection
  //////////////////////////////////////////////////////////////// 
  
  /**
   * @class Cursor for a Collection.
   * 
   * @see baja.coll.Collection
   *
   * @name CollectionCursor
   * @extends baja.Cursor
   * @inner
   * @public
   */
  var CollectionCursor = function (collection, curData) {
    CollectionCursor.$super.apply(this, arguments);
    this.$collection = collection;
    this.$curData = curData;
    this.$index = -1;
    this.$before = baja.noop;
    this.$after = baja.noop;
  }.$extend(baja.AsyncCursor);
  
  /**
   * Return the underlying Cursor's Collection.
   * 
   * @returns {baja.coll.BoxCollection}
   */
  CollectionCursor.prototype.getCollection = function () {
    return this.$collection;
  }; 
  
  var colGet = function () {
    return this.$curData[this.$index] || null;
  };
      
  /**
   * Return the current row.
   * 
   * @name CollectionCursor#get
   * @function
   * 
   * @returns the cursor value (null if none available)
   */
  CollectionCursor.prototype.get = colGet; 

  /**
   * When the cursor is iterated, the before function will be called
   * just before iteration starts.
   * <p>
   * When the function is called, 'this' refers to the Cursor. The Cursor is also
   * passed in as a argument to this function.
   * 
   * @param {Function} func the before function.
   */
  CollectionCursor.prototype.before = function (func) {
    strictArg(func, Function);
    this.$before = func;
  };
  
  /**
   * When the cursor is iterated, the before function will be called
   * just after iteration has finished.
   * <p>
   * When the function is called, 'this' refers to the Cursor. The Cursor is also
   * passed in as a argument to this function.
   * 
   * @param {Function} func the before function.
   */
  CollectionCursor.prototype.after = function (func) {
    strictArg(func, Function);
    this.$after = func;
  };
  
  /**
   * Iterate through the Cursor and call 'each' for every item.
   * <p>
   * When the function is called, 'this' refers to the Cursor.
   * 
   * @param {Function} func function called on every iteration with 
   *                        the current row used as the first argument and row
   *                        index as the second argument.
   */
  CollectionCursor.prototype.each = function (func) {
    strictArg(func, Function);
        
    this.$index = -1;
    var size = this.$curData.length,
        i,
        result;

   // Called just before iteration
   this.$before.call(this, this);  
        
    for (i = 0; i < size; ++i) {
      // Called for every item in the Cursor
      ++this.$index;
      result = func.call(this, this.get(), this.$index);
      
      // Break if a truthy result is returned
      if (result) {
        break;
      } 
    }
          
    // Called just after iteration
    this.$after.call(this, this);
  };
  
  /**
   * @class Represents a baja:ICollection in BajaScript.
   * <p>
   * Collections are usually returned as the result of resolving an ORD (i.e. a BQL query).
   *
   * @see CollectionCursor
   * 
   * @name baja.coll.Collection
   * @extends baja.Simple
   */  
  baja.coll.Collection = function (collData) {
    baja.coll.Collection.$super.apply(this, arguments);
    this.$collData = collData;
    this.$Cursor = CollectionCursor;
  }.$extend(baja.Simple);
  
  baja.coll.Collection.DEFAULT = new baja.coll.Collection({});
    
  /**
   * Make a Collection.
   * 
   * @private
   *
   * @param {Object} collData
   * @returns {baja.coll.Collection} the Collection
   */
  baja.coll.Collection.make = function (collData) {    
    if (isObjEmpty(collData)) {
      return baja.coll.Collection.DEFAULT;
    }
    return new baja.coll.Collection(collData);
  };
  
  /**
   * Make a Collection.
   * 
   * @private
   *
   * @param {Object} collData
   * @returns {baja.coll.Collection} the Collection
   */
  baja.coll.Collection.prototype.make = function (collData) {
    return baja.coll.Collection.make(collData);
  };
  
  /**
   * Decode a Collection from a String.
   * 
   * @private
   * 
   * @param {String} str
   * @returns {baja.coll.Collection}
   */
  baja.coll.Collection.prototype.decodeFromString = function (str) {
    return baja.coll.Collection.make(JSON.parse(str));
  };
  
  /**
   * Encode the Collection to a String.
   *
   * @private
   *
   * @returns {String}
   */
  baja.coll.Collection.prototype.encodeToString = function () {
    return JSON.stringify(this.$collData);
  };
    
  // Register Type  
  baja.coll.Collection.registerType("box:BoxCollection");
  
  /**
   * Iterate through a Collection.
   * <p>
   * Please note, this may retrieve data asynchronously.
   * <p>
   * A function is passed in to retrieve to the Cursor.
   * For example...
   * 
   * <pre>
   *   myCollection.cursor(function (cursor) {
   *     // Called once we have the Cursor
   *   });
   *   
   *   // or via an Object Literal...
   *   
   *   myCollection.cursor({
   *     each: function () {
   *       // Called for each item in the Cursor...
   *       var dataFromCursor = this.get();
   *     },
   *     ok: function (cursor) {
   *       // Called once we have the Cursor
   *     },
   *     fail: function (err) {
   *       // Called if any errors in getting data
   *     }
   *   });
   * </pre>
   * 
   * @see CollectionCursor
   * 
   * @param {Object|Function} obj the Object Literal that specifies the method's arguments.
   *                              For convenience, this can also be the ok function.
   * @param {Function} [obj.ok] called when the cursor has been created with the cursor as an argument.
   * @param {Function} [obj.fail] called if the cursor fails to be retrieved. 
   *                              An error is passed in as the first argument.
   * @param {baja.comm.Batch} [obj.batch], if specified, the operation will be batched into this object.
   * @param {Function} [obj.before] called just before the Cursor is about to be iterated through.
   * @param {Function} [obj.after] called just after the Cursor has finished iterating.
   * @param {Number} [obj.offset] Specifies the row number to start encoding the result-set from.
   * @param {Number} [obj.limit] Specifies the maximum number of rows that can be encoded. 
   *                             By default, this is set to 10 rows.
   */
  baja.coll.Collection.prototype.cursor = function (obj) {
    obj = baja.objectify(obj, "each");
    
    var cb = new baja.comm.Callback(obj.ok, obj.fail, obj.batch),
        that = this;
    
    // Add an intermediate callback to create the Cursor Object and pass it back
    cb.addOk(function (ok, fail, resp) {     
      var newOk = function () {  
        var i,
            cursor;
        
        // Decode each row of the result set
        for (i = 0; i < resp.length; ++i) {
          resp[i] = baja.bson.decodeValue(resp[i], baja.$serverDecodeContext);
        }
                
        // Create a Cursor Object and pass it into the Handler
        cursor = new that.$Cursor(that, resp);
    
        if (typeof obj.before === "function") {
          cursor.before(obj.before); 
        }
        
        if (typeof obj.after === "function") {
          cursor.after(obj.after); 
        }
        
        // Please note, if defined, this will trigger an iteration
        if (typeof obj.each === "function") {
          cursor.each(obj.each); 
        }
        
        ok(cursor);
      };
        
      if (!obj.$data) {
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
          
          // Make a synchronous or asynchronous call depending how the orignal callback 
          // was invoked
          if (cb.getBatch().isAsync()) {
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
    
    obj.limit = obj.limit || 10;
    obj.offset = obj.offset || 0;
    
    // If '$data' is specified then use this for the first Cursor iteration. This is an optimization made
    // by BajaScript's ORD architecture. This enables an ORD to be queried and then iterated through at the same time.
    if (obj.$data) {
      cb.ok(obj.$data);
    }
    else {
      
      // Make a a network call for the Cursor data
      baja.comm.cursor(this.$collData.req, cb, obj);
    }
  }; 
  
  ////////////////////////////////////////////////////////////////
  // Collection
  //////////////////////////////////////////////////////////////// 
  
  /**
   * @class Cursor for a Table.
   * 
   * @see baja.coll.Table
   *
   * @name TableCursor
   * @extends CollectionCursor
   * @inner
   * @public
   */
  var TableCursor = function (collection, curData) {
    TableCursor.$super.apply(this, arguments);
    this.$collection = collection;
  }.$extend(CollectionCursor);
  
  function getColDisp(cursor, column, display) { 
    var tof = typeof column;
    
    if (tof === "undefined") {
      // If no column is defined then just return the entire row
      return colGet.call(cursor);
    }
    else if (column && tof === "object") {
      column = column.getName();
    }
    else if (tof !== "string") {
      throw new Error("Invalid Column name: " + column);
    }
    
    var row = colGet.call(cursor);
    if (row !== null) {
      return display ? row.getDisplay(column) : row.get(column);
    }
    
    return null;
  }
        
  /**
   * Return the current row or row item. 
   * <p>
   * If column information is passed into this method then the value for a particular
   * column and row will be returned.
   *
   * @name TableCursor#get
   * @function
   * 
   * @param {String|TableColumn} [column] the column name or column. If undefined,
   *                                      the entire row is returned.
   * @returns the cursor value (null if none available).
   */
  TableCursor.prototype.get = function (column) { 
    return getColDisp(this, column, /*display*/false);
  }; 
  
  /**
   * Return the current item display string.
   * <p>
   * If column information is passed into this method then the display String for a particular
   * column and row will be returned.
   * 
   * @param {String|TableColumn} [column] the column name or column. If undefined,
   *                                      the entire row is returned.
   * @returns the cursor display string (null if none available).
   */
  TableCursor.prototype.getDisplay = function (column) {
    return getColDisp(this, column, /*display*/true);
  }; 
  
  /**
   * @class Represents a baja:ITable in BajaScript.
   * <p>
   * Tables are usually returned as the result of resolving an ORD (i.e. a BQL query).
   *
   * @name baja.coll.Table
   * @extends baja.coll.Collection
   *
   * @see TableCursor
   * @see TableColumn
   */  
  baja.coll.Table = function (tableData) {
    baja.coll.Table.$super.apply(this, arguments);
    this.$tableData = tableData;
    this.$Cursor = TableCursor;
  }.$extend(baja.coll.Collection); 
  
  baja.coll.Table.DEFAULT = new baja.coll.Table({});
  
  /**
   * Make a Table.
   * 
   * @private
   *
   * @param {Object} tableData
   * @returns {baja.coll.Table} the Table.
   */
  baja.coll.Table.make = function (tableData) {
    if (isObjEmpty(tableData)) {
      return baja.coll.Table.DEFAULT;
    }
    return new baja.coll.Table(tableData);
  };
  
  /**
   * Make a Table.
   * 
   * @private
   *
   * @param {Object} tableData
   * @returns {baja.coll.Table} the Table
   */
  baja.coll.Table.prototype.make = function (tableData) {
    return baja.coll.Table.make(tableData);
  };
  
  /**
   * Decode a Table from a String.
   * 
   * @private
   * 
   * @param {String} str
   * @returns {Table}
   */
  baja.coll.Table.prototype.decodeFromString = function (str) {
    return baja.coll.Table.make(JSON.parse(str));
  };
  
  /**
   * Encode the Table to a String.
   *
   * @private
   *
   * @returns {String}
   */
  baja.coll.Table.prototype.encodeToString = function () {
    return JSON.stringify(this.$tableData);
  };
    
  // Register Type  
  baja.coll.Table.registerType("box:BoxTable");
  
  /**
   * Returns an array of Table Columns.
   *
   * @see baja.coll.Table#getCol
   * @see TableColumn
   *
   * @returns an array of columns (TableColumn)
   */
  baja.coll.Table.prototype.getColumns = function () {
    var columns = [],
        cols =  this.$tableData.cols,
        i;
    
    for (i = 0; i < cols.length; ++i) {
      columns.push(this.getCol(cols[i].n));
    }
    
    return columns;
  };
  
  /**
   * Returns a Column Object for the given column name.
   *
   * @param {String|Number} column the column name or index.
   * @returns {TableColumn} the table column or null if the column can't be found.
   */
  baja.coll.Table.prototype.getCol = function (column) {
    strictArg(column);
    
    var to = typeof column,
        cols = this.$tableData.cols,
        data,
        i;
    
    if (to === "number") {
      data = cols[column];
    }
    else if (to === "string") {
      for (i = 0; i < cols.length; ++i) {
        if (cols[i].n === column) {
          data = cols[i]; 
          break;
        }
      }
    }
    
    // If there's no data then return null at this point
    if (!data) {
      return null;
    }
                  
    /** 
     * @class Table Column
     * @name TableColumn
     * @inner
     * @public
     *
     * @see baja.coll.Table
     */
    return { 
      /**
       * Return the column name.
       * 
       * @name TableColumn#getName
       * @returns {String}
       */
      getName: function getName() {
        return data.n;
      },
      
      /**
       * Return the column display name.
       * 
       * @name TableColumn#getDisplayName
       * @returns {String}
       */
      getDisplayName: function getDisplayName() {
        return data.dn;
      },
      
      /**
       * Return the column Type.
       * 
       * @name TableColumn#getType
       * @returns {Type}
       */
      getType: function getType() {
        return baja.lt(data.t);
      },
      
      /**
       * Return the column flags.
       * 
       * @name TableColumn#getFlags
       * @returns {Number}
       */
      getFlags: function getFlags() {
        return data.f;
      },
      
      /**
       * the column facets
       * 
       * @name TableColumn#getFacets
       * @returns {baja.Facets}
       */
      getFacets: function getFacets() {
        return baja.Facets.DEFAULT.decodeFromString(data.x);
      }
    };
  };
  
}(baja));
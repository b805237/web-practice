//
// Copyright 2010, Tridium, Inc. All Rights Reserved.
//

/**
 * BajaScript Virtual Support.
 *
 * @author Gareth Johnson
 * @version 1.0.0.0
 */

//JsLint options (see http://www.jslint.com )
/*jslint rhino: true, onevar: false, plusplus: true, white: true, undef: false, nomen: false, eqeqeq: true, 
bitwise: true, regexp: true, newcap: true, immed: true, strict: false, indent: 2, vars: true, continue: true */

/*global setTimeout, clearTimeout, setInterval, clearInterval, document, window, loadTypes, bajaJsPrint, baja*/ 

(function virt(baja) {

  // Use ECMAScript 5 Strict Mode
  "use strict";
  
  ////////////////////////////////////////////////////////////////
  // Virtual Component Space
  //////////////////////////////////////////////////////////////// 
  
  /**
   * @class Represents a baja:VirtualComponentSpace in BajaScript.
   *
   * @name baja.VirtualComponentSpace
   * @extends baja.BoxComponentSpace
   */  
  baja.VirtualComponentSpace = function (gateway) {
    baja.VirtualComponentSpace.$super.call(this, "virtual");
    this.$gateway = baja.strictArg(gateway);
  }.$extend(baja.BoxComponentSpace).registerType("baja:VirtualComponentSpace");
  
  
  /**
   * Return absolute ORD for the Component Space.
   *
   * @returns {baja.Ord}
   */
  baja.VirtualComponentSpace.prototype.getAbsoluteOrd = function () {
    return baja.Ord.make(this.$gateway.getNavOrd().toString() + "|virtual:");
  };
  
  /**
   * Private framework handler for a Component Space.
   * <p>
   * This is a private internal method for framework developers.
   *
   * @private
   */
  baja.VirtualComponentSpace.prototype.$fw = function (x, a, b, c) {    
    if (x === "unmount") {
      // When a Virtual Component is removed then reset the parent broker properties loaded flag 
      var parent = a.getParent();
      if (parent) {
        parent.$bPropsLoaded = false;
      }
    }
    baja.VirtualComponentSpace.$super.prototype.$fw.apply(this, arguments);
  };  
  
  ////////////////////////////////////////////////////////////////
  // Virtual Component
  //////////////////////////////////////////////////////////////// 
  
  /**
   * @class Represents a baja:VirtualComponent in BajaScript.
   *
   * @name baja.VirtualComponent
   * @extends baja.Component
   */  
  baja.VirtualComponent = function () {
    baja.VirtualComponent.$super.apply(this, arguments);
  }.$extend(baja.Component).registerType("baja:VirtualComponent");
  
  
  /**
   * Return the Nav ORD for the Virtual Component.
   *
   * @private
   *
   * @returns {baja.Ord} the Nav ORD or null if it's not mounted.
   */
  baja.VirtualComponent.prototype.getNavOrd = function () {
    if (!this.isMounted()) {
      return null;
    }
    var spaceOrd = this.$space.getAbsoluteOrd(),
        body = "/",
        slotPath = this.getSlotPath(),
        i;
    
    for (i = 0; i < slotPath.depth(); ++i) {
      if (i > 0) {
        body += "/";
      }
      body += baja.SlotPath.unescape(slotPath.nameAt(i));
    }
    
    return baja.Ord.make(spaceOrd.toString() + body);
  };
  
  ////////////////////////////////////////////////////////////////
  // Virtual Gateway
  //////////////////////////////////////////////////////////////// 
  
  /**
   * @class Represents a baja:VirtualGateway in BajaScript.
   *
   * @name baja.VirtualGateway
   * @extends baja.Component
   */  
  baja.VirtualGateway = function () {
    baja.VirtualGateway.$super.apply(this, arguments);
    this.$virtualSpace = null;
  }.$extend(baja.Component).registerType("baja:VirtualGateway");
  
  function fwLoadVirtualSpace(gateway) {
    var cb = new baja.comm.Callback();
  
    if (gateway.$virtualSpace) {
      cb.ok();
      return;
    }
    
    try {   
      // Create the Virtual Space and initialize it
      gateway.$virtualSpace = new baja.VirtualComponentSpace(gateway);
      gateway.$virtualSpace.init(cb.getBatch());
      
      // TODO: Currently made synchronously on purpose. We don't want to accidently create this twice
      // so this is the safest option for now!
      cb.commitSync();
    }
    catch (err) {
      cb.fail(err);
    }
  }
  
  /**
   * Internal Framework Method.
   *
   * @private
   *
   * @see baja.Component#$fw
   */
  baja.VirtualGateway.prototype.$fw = function (x) {   
    if (x === "loadVirtualSpace") {   
      // Load the virtual space    
      fwLoadVirtualSpace(this);
    }
    else {
      return baja.VirtualGateway.$super.prototype.$fw.apply(this, arguments);
    }
  };
  
  /**
   * Return the Virtual Space for the Gateway. 
   *
   * @returns {baja.VirtualComponentSpace}
   */
  baja.VirtualGateway.prototype.getVirtualSpace = function () {
    if (this.$virtualSpace === null) {
      // TODO: This is currently mounted synchronously as we don't want to accidently mount multiple Component Spaces
      this.$fw("loadVirtualSpace");
    }
  
    return this.$virtualSpace;
  };
  
  /**
   * Load the Slots for the VirtualGateway.
   * 
   * @see baja.Component#loadSlots
   */
  baja.VirtualGateway.prototype.loadSlots = function (obj) {
    // Ensure the Virtual Space is all loaded when this happens
    this.getVirtualSpace();
    
    // Call super
    baja.VirtualGateway.$super.prototype.loadSlots.apply(this, arguments);
  };
  
  /**
   * Access the Nav Children.
   * 
   * @see baja.Component#getNavChildren
   */
  baja.VirtualGateway.prototype.getNavChildren = function (obj) {
    // Access the Nav Children of the Virtual Space
    var space = this.getVirtualSpace();
    
    if (space) {
      space.getRootComponent().getNavChildren(obj);
    }
    else {
      baja.VirtualGateway.$super.prototype.getNavChildren(obj);
    }
  };
  
  ////////////////////////////////////////////////////////////////
  // Virtual Path
  //////////////////////////////////////////////////////////////// 
  
  /**
   * @class Resolves Virtual Slot Paths.
   *
   * @name baja.VirtualPath
   * @extends baja.SlotPath
   */  
  baja.VirtualPath = function () {
    baja.VirtualPath.$super.apply(this, arguments);
  }.$extend(new baja.SlotPath(""));
  
  /**
   * Make a Slot Path.
   *
   * @private
   *
   * @param {Object} query  the ORD Query used in resolving the ORD.
   * @returns {baja.VirtualPath} the new Slot Path.
   */
  baja.VirtualPath.prototype.makeSlotPath = function (query) {
    return new baja.VirtualPath(query);
  };
  
  /**
   * Return whether the specified path name is valid.
   * 
   * @param {String} pathName the path name to validate.
   *
   * @returns {Boolean} true if the slot name is valid.
   */ 
  baja.VirtualPath.prototype.isValidPathName = function (pathName) {
    return baja.VirtualPath.isValidName(pathName);
  };
  
  /**
   * Return whether the slot name is valid.
   *
   * @param {String} nm the name to validate.
   *
   * @returns {Boolean} true if the slot name is valid.
   */ 
  baja.VirtualPath.isValidName = function (nm) {
    return (/^[^\/\|\$\:]+$/).test(nm); 
  };
  
  /**
   * Return the scheme name for the SlotPath.
   *
   * @returns {String}
   */
  baja.VirtualPath.prototype.getSchemeName = function () {
    return "virtual";
  };
  
  /**
   * Return the scheme used with this SlotPath.
   *
   * @returns {baja.OrdScheme}
   */
  baja.VirtualPath.prototype.getScheme = function () {
    return baja.VirtualScheme.DEFAULT;
  };
    
  ////////////////////////////////////////////////////////////////
  // Virtual ORD Scheme
  //////////////////////////////////////////////////////////////// 
    
  /**
   * @class Virtual Slot Scheme for Virtual Components.
   *
   * @name baja.VirtualScheme
   * @extends baja.SlotScheme
   */  
  baja.VirtualScheme = function () {
    baja.VirtualScheme.$super.apply(this, arguments);
  }.$extend(baja.SlotScheme);
  
  /**
   * Default Virtual ORD Scheme instance.
   * @private
   */
  baja.VirtualScheme.DEFAULT = new baja.VirtualScheme();
  
  // Register Type
  baja.VirtualScheme.registerType("baja:VirtualScheme"); 
  
  /**
   * Return an ORD Query for the scheme.
   *
   * @returns {Object}
   */
  baja.VirtualScheme.prototype.parse = function (schemeName, body) {
    return new baja.VirtualPath(body);
  };
      
}(baja));
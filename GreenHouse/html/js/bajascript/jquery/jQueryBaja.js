//
// Copyright 2011, Tridium, Inc. All Rights Reserved.
//

// JsLint options (see http://www.jslint.com )
/*jslint rhino: true, onevar: false, plusplus: false, white: true, undef: true, nomen: true, eqeqeq: true, bitwise: false, regexp: true, newcap: true, immed: true, strict: false, indent: 2 */
 
// Globals for JsLint to ignore 
/*global baja, $, jQuery*/ 

/**
 * jQuery BajaScript Plug-in  
 *
 * Please note, this is an experimental piece of code
 *
 * @author Gareth Johnson
 */
 
/*
  There are quite a few things that need to happen to this code in order for it to become a viable product...
  
  BatchResolve
  ************
  
  ORDs should always be resolved in batch to lower the amount of network comms. In fact, this is essential
  in getting the page to load properly. This however is tricky to implement in this plugin. I imagine that whenever
  an ORD is to be resolved by the plug in, a timer is started (i.e. 50 ms). If another ORD needs to be resolved, it stops and restarts this
  timer. The result is that when the timer properly elapses, it will have a number of ORDs to resolve in one go. The callbacks
  to these ORDs will perform the necessary jQuery bindings as closures can be used for a back reference.
  
  jQuery
  ******
  
  Altering a DOM elements text, amending CSS and DOM attributes covers a lot of what people need to do. However, there are other
  jQuery methods that we should consider animating and that includes jQuery animation itself (i.e. make a text box scroll across the screen).
  
  Currently this piece of software is being developed with jQuery 1.6.1.
  
  JSON
  ****
  
  You'll note that all of the arguments for this plugin are in a JSON format. For example, I don't pass any functions as callbacks. 
  Why? Well I have a number of reasons...
  
  - The arguments for invoking this plugin can be encoded to a 'data' attribute in an HTML DOM Element.
  - At some point, it would be nice for there to be a new Px Editor. Now this isn't a Px editor but an HTML editor. It looks and feels like
    a Px editor as customers will be able to create bindings and set up converters. Instead of Widgets, customers will be creating HTML elements
    and manipulating CSS etc. In order for the bindings to be automatically generated and parsed, it's best to use a JSON format here.

  Converters
  **********

  Other converters need to be implemented. For example...
  - numericToCss: a range array could be specified here for the different CSS selectors.
  - enumToCss: different enums to specify what CSS to use could be used here.

  Simple BajaScript API
  **********************

  Currently there's one method called 'animate' for the plugin. However, it's the intention this plug-in become the Simple API for BajaScript. Therefore,
  other methods will be added in future. For example, 'invoke' for invoking an Action etc.

  Comments
  ********

  Once the API has been firmly established, proper JsDoc Toolkit comments need to be added some HTML documentation can be generated from it.

  Versioning
  **********

  Once the API has been firmly established, this JavaScript file should have the version number embedded into the file name. We only do this on this 
  file because there's no dependency on BOX. By versioning in this way, customers can have backwards compatibility (since we can also just keep the old version
  in the module) and caching problems are avoided.  
  
  Minification
  ************
  
  Of course, for customer distribution, this library has to be minified.
  
  Testing
  *******
  
  BajaScript has been written with unit tests from the ground up. Even this DOM based library should have unit tests written for it.
  
  Conclusion
  **********
  
  I consider this library to be the basis for a whole new generation of graphical interface for Niagara. I don't see Px being 'thrown away'. However, it
  would be foolish to assume let Px be our only way of doing graphics.
*/

(function ($) {

  // Use ECMAScript 5 Strict Mode
  "use strict";

  function getBoolVal(value) {
    // Get the Boolean value we're after...
    var val = value;
    if (!value.getType().is("baja:Boolean")) {
      if (value.getType().is("baja:StatusValue")) {
        val = value.getValue();
      }
      else if (value.getType().is("control:ControlPoint")) {
        val = value.getOut().getValue();
      }
    }
    return val;
  }

  // Value Animation Converter methods...
  // Plese note that 'this' refers to the underlying jQuery Object...
  var valueConverterMethods = {
    
    // Convert a boolean value to CSS...
    booleanToCss: function (args, comp, props, value) {    
      // Get the Boolean value we're after...
      var val = getBoolVal(value);
    
      // Cycle through each element to apply the converter too...
      this.each(function () {
        $(this).css(val ? args.trueValue : args.falseValue);
      });
    },
    
    // Convert a boolean value to an attribute...
    booleanToAttr: function (args, comp, props, value) {    
      // Get the Boolean value we're after...
      var val = getBoolVal(value);
    
      // Cycle through each element to apply the converter too...
      this.each(function () {
        $(this).attr(val ? args.trueValue : args.falseValue);
      });
    },
    
    // Convert the value to the element's text...
    valueToText: function (args, comp, props, value) {      
      var text;
      if (props.length === 0) {
        text = comp.toString();
      }
      else {
        var c = comp;
        for (var i = 0; i < (props.length - 1); ++i) {
          c = c.get(props[i].getName());
        }
                        
        text = c.getSlotDisplay(props[props.length - 1].getName());
      }
      
      this.each(function () {
        $(this).text(text);
      });
    }
  };
  
  // Animator methods...
  var animatorMethods = {
  
    // Value animator...
    value: function (obj) {
      var jQueryObj = this;
    
      // Called on value update and change...
      var valueUpdate = function (props, value) {      
        // Note: 'this' refers to the subscribed Component
        // Look up the Converter method and call it...
        var c;
        for (var i = 0; i < obj.converters.length; ++i) {
          c = obj.converters[i];
          if (valueConverterMethods.hasOwnProperty(c.type) && typeof valueConverterMethods[c.type] === "function") {
            valueConverterMethods[c.type].call(jQueryObj, c, this, props, value);
          }
          else {
            $.error("Cannot find converter: " + obj.converters[i].type);
          }
        }
      };        
                      
      // Resolve the ORD and subscribe...
      baja.Ord.make(obj.ord).resolve({
        ok: function (target) {
          var propPath = target.propertyPath || [];
        
          // Invoke the CSS update...
          valueUpdate.call(this, propPath, target.object);
        
          // Attach a changed callback
          target.getComponent().attach("changed", function (prop, cx) {
            // If the Properties match ok...
            if (target.slot) {
              if (prop.getName() === target.slot.getName()) {                            
                // If there's a Property Path then find the Property...
                var value = this;
                for (var i = 0; i < propPath.length; ++i) {            
                  value = value.get(propPath[i].getName());
                }
                
                valueUpdate.call(this, propPath, value);
              }
            }
            else {
              valueUpdate.call(this, [], this);
            }
          });
        
          // Subscribe the Component...
          target.getComponent().subscribe();
        },
        fail: function (err) {
          $.error(err);
        }
      });
      
      return this;
    },
    
    // Bind Animator...
    bind: function (obj) {
      // Validate arguments...             
      if (!obj.event) {
        $.error("Must specify event for bind in jQuery.baja");        
      }
      
      // Bind...
      return this.bind(obj.event, function () {
        baja.Ord.make(obj.ord).resolve({
          ok: function (target) {
            if (!target.slot) {
              $.error("Invalid ORD for bind event");
            }
            
            // TODO: Value should also be a function...
            
            var value = null;
                        
            if (target.slot.isAction()) {
              // Invoke an Action...

              // Decode Action argument...
              if (target.slot.getParamType()) {
                if (obj.value === undefined) {
                  value = target.getParamDefault();
                }
                else {
                  if (target.slot.getParamType().isSimple()) {
                    // If a Simple then attempt to decode from the String...
                    value = target.slot.getParamType().getInstance().decodeFromString(obj.value);
                  }
                  else {
                    // For anything else, try decoding from BSON...
                    value = baja.bson.decodeSlot(obj.value);
                  }
                }
              }
                        
              target.getComponent().invoke({
                slot: target.slot,
                value: value
              });
            }
            else if (target.slot.isTopic()) {
              // Fire a Topic...
              
              // Decode Topic argument...
              if (target.slot.getEventType()) {
                if (obj.value !== undefined) {
                  if (target.slot.getEventType().isSimple()) {
                    // If a Simple then attempt to decode from the String...
                    value = target.slot.getEventType().getInstance().decodeFromString(obj.value);
                  }
                  else {
                    // For anything else, try decoding from BSON...
                    value = baja.bson.decodeSlot(obj.value);
                  }
                }
              }
              
              target.getComponent().fire({
                slot: target.slot,
                value: value
              });
              
            }
            else {
              // TODO: What about a Property set???
              $.error("Invalid ORD for bind event...");
            }
          }
        });      
      });
    }
  };

  // Plug-in methods...
  var methods = {
    animate: function (animator, obj) {
          
      // First argument can just be an Object Literal which defaults to value...
      if (animator && typeof animator === "object") {
        obj = animator;
        animator = "value";
      }
      
      // If there's not object argument specified then attempt to pick up the information from the element's data...
      if (!obj) {             
        this.each(function () {    
          var o = $(this).data("bajaAnimateArg");
        
          if (!o) {
            $.error("Unable to find animation argument!");
          }
                  
          // Decode the ORD from the element
          o.ord = $(this).data("bajaAnimateOrd");
          
          // Validate ORD...             
          if (!o.ord) {
            $.error("Unable to find ORD");         
          }  

          // Decode the animator to use...
          var animator = $(this).data("bajaAnimator");
          animator = animator || "value";          
          
          methods.animate.call($(this), animator, o);
        });
        return this;
      }
            
      obj.converters = obj.converters || [];
           
      // Validate arguments...             
      if (!obj.ord) {        
        this.each(function () {

          // Make a copy of the arguments object...
          // TODO: We need to think of something better here...
          var o = JSON.parse(JSON.stringify(obj));
        
          // Decode the ORD from the element
          o.ord = $(this).data("bajaAnimateOrd");
          
          // Validate ORD...             
          if (!o.ord) {
            $.error("Unable to find ORD");         
          }   
          
          methods.animate.call($(this), animator, o);
        });
        return this;
      }  

      // Execute one of the binding methods...
      if (animatorMethods.hasOwnProperty(animator) && typeof animatorMethods[animator] === "function") {
        return animatorMethods[animator].call(this, obj);
      }
      else {
        $.error("Method " + animator + " does not exist on jQuery.baja");
      } 
            
      return this;
    }
  };

  $.fn.baja = function (meth) {
    // Execute one of the BajaScript plug in methods...
    if (methods.hasOwnProperty(meth) && typeof methods[meth] === "function") {
      return methods[meth].apply(this, Array.prototype.slice.call(arguments, 1));
    }
    else {
      $.error("Method " + meth + " does not exist on jQuery.baja");
    }   
  };
}(jQuery));
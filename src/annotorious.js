goog.provide('annotorious');

goog.require('goog.array');
goog.require('annotorious.dom');

/**
 * The main entrypoint to the application. The Annotorious class is instantiated exactly once,
 * and added to the global window object as 'window.anno'. It exposes the external JavaScript API
 * and internally manages the 'modules'. (Each module is responsible for one particular media
 * type - image, OpenLayers, etc.)  
 * @constructor
 */
annotorious.Annotorious = function() {
  /** @private **/
  this._modules = [ new annotorious.modules.image.ImageModule() ];
  
  if (annotorious.modules.openlayers)
    this._modules.push(new annotorious.modules.openlayers.OpenLayersModule());
  
  /** @private **/
  this._plugins = [];

  var self = this;
  annotorious.dom.addOnLoadHandler(function() { 
    goog.array.forEach(self._modules, function(module) {
      module.init();
    });

    goog.array.forEach(self._plugins, function(plugin) {
      if (plugin.initPlugin)
        plugin.initPlugin(self);
        
      goog.array.forEach(self._modules, function(module) {
        module.addPlugin(plugin);
      });
    });
  });
}

/**
 * Returns the module that is in charge of handling the item with the specified
 * URL or null, if no responsible module is found.
 * @param {string} item_src the URL of the annotatable item 
 * @private
 * @return {object | null}
 */
annotorious.Annotorious.prototype._getModuleForItemSrc = function(item_src) {
  return goog.array.find(this._modules, function(module) {
    return module.annotatesItem(item_src);
  });
}

/**
 * Adds an annotation to an item on the page.
 * @param {Annotation} annotation the annotation
 */
annotorious.Annotorious.prototype.addAnnotation = function(annotation) {
  var module = this._getModuleForItemSrc(annotation.src);
  
  if (module)
    module.addAnnotation(annotation);
}

/**
 * Adds an event handler to Annotorious.
 * @param {annotorious.event.EventType} type the event type
 * @param {function} handler the handler function
 */
annotorious.Annotorious.prototype.addHandler = function(type, handler) {
  goog.array.forEach(this._modules, function(module) {
    module.addHandler(type, handler);
  });
}

/**
 * Adds a plugin to Annotorious.
 * @param {string} pluginName the plugin name
 * @param {object} opt_config_options an optional object literal with plugin config options
 */
annotorious.Annotorious.prototype.addPlugin = function(pluginName, opt_config_options) {
  this._plugins.push(new window['annotorious']['plugin'][pluginName](opt_config_options));  
}

/**
 * Returns all annotations on the annotatable item with the specified URL, or
 * all annotations on the page in case no URL is specified.
 * @param {string | undefined} opt_item_ url an itemURL (optional)
 * @return {Array.<Annotation>} the annotations
 */
annotorious.Annotorious.prototype.getAnnotations = function(opt_item_url) {
  if (opt_item_url) {
    var module = this._getModuleForItemSrc(opt_item_url);
    if (module)
      return module.getAnnotations(opt_item_url);
    else
      return [];
  } else {
    var annotations = [];
    goog.array.forEach(this._modules, function(module) {
      goog.array.extend(annotations, module.getAnnotations());
    });
    return annotations;
  }
}

/**
 * Makes an item annotatable, if there is a module that supports the item type.
 */
annotorious.Annotorious.prototype.makeAnnotatable = function(item) {
  var module = goog.array.find(this._modules, function(module) {
    return module.supports(item);
  });

  if (module)
    module.makeAnnotatable(item);
  else
    throw('Error: Annotorious does not support this media type in the current version or build configuration.');
}

/**
 * Removes an annotation from an item on the page.
 */
annotorious.Annotorious.prototype.removeAnnotation = function(annotation) {
  var module = this._getModuleForItemSrc(annotation.src);
  
  if (module)
    module.removeAnnotation(annotation);
}

window['anno'] = new annotorious.Annotorious();
annotorious.Annotorious.prototype['addAnnotation'] = annotorious.Annotorious.prototype.addAnnotation;
annotorious.Annotorious.prototype['addHandler'] = annotorious.Annotorious.prototype.addHandler;
annotorious.Annotorious.prototype['addPlugin'] = annotorious.Annotorious.prototype.addPlugin;
annotorious.Annotorious.prototype['getAnnotations'] = annotorious.Annotorious.prototype.getAnnotations;
annotorious.Annotorious.prototype['makeAnnotatable'] = annotorious.Annotorious.prototype.makeAnnotatable;
annotorious.Annotorious.prototype['removeAnnotation'] = annotorious.Annotorious.prototype.removeAnnotation;
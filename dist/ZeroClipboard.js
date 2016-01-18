/*!
 * ZeroClipboard
 * The ZeroClipboard library provides an easy way to copy text to the clipboard using an invisible Adobe Flash movie and a JavaScript interface.
 * Copyright (c) 2009-2015 Jon Rohan, James M. Greene
 * Licensed MIT
 * http://zeroclipboard.org/
 * v2.3.0-beta.1
 */

(function(window, undefined) {
  "use strict";

/**
 * Convert an `arguments` object into an Array.
 *
 * @returns The arguments as an Array
 * @private
 */
var _args = function(argumentsObj) {
  return _slice.call(argumentsObj, 0);
};


/**
 * Shallow-copy the owned, enumerable properties of one object over to another, similar to jQuery's `$.extend`.
 *
 * @returns The target object, augmented
 * @private
 */
var _extend = function() {
  var i, len, arg, prop, src, copy,
      args = _args(arguments),
      target = args[0] || {};

  for (i = 1, len = args.length; i < len; i++) {
    // Only deal with non-null/undefined values
    if ((arg = args[i]) != null) {
      // Extend the base object
      for (prop in arg) {
        if (_hasOwn.call(arg, prop)) {
          src = target[prop];
          copy = arg[prop];

          // Prevent never-ending loops and copying `undefined` valeus
          if (target !== copy && copy !== undefined) {
            target[prop] = copy;
          }
        }
      }
    }
  }
  return target;
};


/**
 * Determine if an element is contained within another element.
 *
 * @returns Boolean
 * @private
 */
var _containedBy = function(el, ancestorEl) {
  if (
    el && el.nodeType === 1 && el.ownerDocument &&
    ancestorEl && (
      (ancestorEl.nodeType === 1 && ancestorEl.ownerDocument && ancestorEl.ownerDocument === el.ownerDocument) ||
      (ancestorEl.nodeType === 9 && !ancestorEl.ownerDocument && ancestorEl === el.ownerDocument)
    )
  ) {
    do {
      if (el === ancestorEl) {
        return true;
      }
      el = el.parentNode;
    }
    while (el);
  }

  return false;
};


/**
 * Get the URL path's parent directory.
 *
 * @returns String or `undefined`
 * @private
 */
var _getDirPathOfUrl = function(url) {
  var dir;
  if (typeof url === "string" && url) {
    dir = url.split("#")[0].split("?")[0];
    dir = url.slice(0, url.lastIndexOf("/") + 1);
  }
  return dir;
};


/**
 * Get the current script's URL by throwing an `Error` and analyzing it.
 *
 * @returns String or `undefined`
 * @private
 */
var _getCurrentScriptUrlFromErrorStack = function(stack) {
  var url, matches;
  if (typeof stack === "string" && stack) {
    matches = stack.match(/^(?:|[^:@]*@|.+\)@(?=http[s]?|file)|.+?\s+(?: at |@)(?:[^:\(]+ )*[\(]?)((?:http[s]?|file):\/\/[\/]?.+?\/[^:\)]*?)(?::\d+)(?::\d+)?/);
    if (matches && matches[1]) {
      url = matches[1];
    }
    else {
      matches = stack.match(/\)@((?:http[s]?|file):\/\/[\/]?.+?\/[^:\)]*?)(?::\d+)(?::\d+)?/);
      if (matches && matches[1]) {
        url = matches[1];
      }
    }
  }
  return url;
};


/**
 * Get the current script's URL by throwing an `Error` and analyzing it.
 *
 * @returns String or `undefined`
 * @private
 */
var _getCurrentScriptUrlFromError = function() {
  /*jshint newcap:false */
  var url, err;
  try {
    throw new _Error();
  }
  catch (e) {
    err = e;
  }

  if (err) {
    url = err.sourceURL || err.fileName || _getCurrentScriptUrlFromErrorStack(err.stack);
  }
  return url;
};


/**
 * Get the current script's URL.
 *
 * @returns String or `undefined`
 * @private
 */
var _getCurrentScriptUrl = function() {
  var jsPath, scripts, i;

  // Try to leverage the `currentScript` feature
  if (_document.currentScript && (jsPath = _document.currentScript.src)) {
    return jsPath;
  }

  // If it it not available, then seek the script out instead...
  scripts = _document.getElementsByTagName("script");

  // If there is only one script
  if (scripts.length === 1) {
    return scripts[0].src || undefined;
  }

  // If `script` elements have the `readyState` property in this browser
  if ("readyState" in scripts[0]) {
    for (i = scripts.length; i--; ) {
      if (scripts[i].readyState === "interactive" && (jsPath = scripts[i].src)) {
        return jsPath;
      }
    }
  }

  // If the document is still parsing, then the last script in the document is the one that is currently loading
  if (_document.readyState === "loading" && (jsPath = scripts[scripts.length - 1].src)) {
    return jsPath;
  }

  // Else take more drastic measures...
  if ((jsPath = _getCurrentScriptUrlFromError())) {
    return jsPath;
  }

  // Otherwise we cannot reliably know which exact script is executing....
  return undefined;
};


/**
 * Get the unanimous parent directory of ALL script tags.
 * If any script tags are either (a) inline or (b) from differing parent
 * directories, this method must return `undefined`.
 *
 * @returns String or `undefined`
 * @private
 */
var _getUnanimousScriptParentDir = function() {
  var i, jsDir, jsPath,
      scripts = _document.getElementsByTagName("script");

  // If every `script` has a `src` attribute AND they all come from the same directory
  for (i = scripts.length; i--; ) {
    if (!(jsPath = scripts[i].src)) {
      jsDir = null;
      break;
    }
    jsPath = _getDirPathOfUrl(jsPath);
    if (jsDir == null) {
      jsDir = jsPath;
    }
    else if (jsDir !== jsPath) {
      jsDir = null;
      break;
    }
  }

  // Otherwise we cannot reliably know what script is executing....
  return jsDir || undefined;
};


/**
 * Is the client's operating system some version of Windows?
 *
 * @returns Boolean
 * @private
 */
var _isWindows = function() {
  var isWindowsRegex = /win(dows|[\s]?(nt|me|ce|xp|vista|[\d]+))/i;
  return !!_navigator && (
    isWindowsRegex.test(_navigator.appVersion || "") ||
    isWindowsRegex.test(_navigator.platform   || "") ||
    (_navigator.userAgent || "").indexOf("Windows") !== -1
  );
};

/**
 * Detect HTML5 clipboard API support.
 * @returns `undefined`
 * @private
 *
 */
var _detectHTML5API = function() {
  try{
    /* In some browsers, in particular Firefox < 40, queryCommandSupported() will
     * return true because the command is "supported" in scripts with extra privileges
     * - but trying to use the API will throw. We use both functions below, but the order
     * matters: if queryCommandEnabled() throws, we will not use queryCommandSupported().
     * queryCommandEnabled() is expected to return false when not called from a
     * user-triggered thread, so it's only called here to see if it throws..
     */
    _html5ClipboardSupported = document.queryCommandEnabled("copy") || document.queryCommandSupported("copy");
  }catch(e){}
};


/**
 * Store references to critically important global functions that may be
 * overridden on certain web pages.
 */
var _hasOwn = window.Object.prototype.hasOwnProperty,
  _navigator = window.navigator,
  _slice = window.Array.prototype.slice,
  _defineProperty = window.Object.defineProperty,
  _document = window.document;

/**
 * Keep track of HTML5 Clipboard API implementation status
 * @private
 */
var _html5ClipboardSupported = false;

/**
 * Keep track of all event listener registrations.
 * @private
 */
var _handlers = {};


/**
 * Keep track of the currently activated element.
 * @private
 */
var _currentElement;


/**
 * Keep track of the element that was activated when a `copy` process started.
 * @private
 */
var _copyTarget;


/**
 * Keep track of data for the pending clipboard transaction.
 * @private
 */
var _clipData = {};


/**
 * Keep track of data formats for the pending clipboard transaction.
 * @private
 */
var _clipDataFormatMap = null;


/**
 * ZeroClipboard configuration defaults for the Core module.
 * @private
 */
var _globalConfig = {

  // Setting this to `false` would allow users to handle calling `ZeroClipboard.focus(...);`
  // themselves instead of relying on our per-element `mouseover` handler.
  autoActivate: true,

  // Ensure OS-compliant line endings, i.e. "\r\n" on Windows, "\n" elsewhere
  fixLineEndings: true,

  // The class used to indicate that a clipped element is being hovered over.
  hoverClass: "zeroclipboard-is-hover",

  // The class used to indicate that a clipped element is active (is being clicked).
  activeClass: "zeroclipboard-is-active",

  // Forcibly set the hand cursor ("pointer") for all clipped elements.
  // IMPORTANT: This configuration value CAN be modified while a SWF is actively embedded.
  forceHandCursor: false

};


/**
* A list of elements that were passed to ZeroClipboard constructors
* or added with clip(). We will handle click events that target
* these elements.
* @private
*/

var _trackedElements = [];


/**
* A method to add tracked element(s)
* Note: if jQuery is used, we want the *actual* elements, not
* jQuery objects
*/

var _trackElements = function(elements){
  if (elements.nodeType === 1) { // Argument is a single element
    _trackedElements.push(elements);
  } else if (elements.length) {
    for (var i = 0, elem; elem = elements[i]; i++) {
      _trackedElements.push(elem);
    }
  }
};



/**
 * Invoke the HTML5 detection algorithms immediately.
 */
_detectHTML5API();

/**
* If HTML5 clipboard is *not* supported, add the Flash-based
* version of ZeroClipboard to the document instead
*/

if (!_html5ClipboardSupported || _globalConfig.useFlash) {
  var zcSourceURL = _getCurrentScriptUrl();
  var isMin = /\.min\./.test(zcSourceURL);
  var newURL = _getDirPathOfUrl(zcSourceURL) + (isMin ? "ZeroClipboardFlash.min.js" : "ZeroClipboardFlash.js");
  document.documentElement.appendChild(document.createElement("script")).src = newURL;
  return ZeroClipboard; // we don't have more work to do
}


/**
* The 'copy' event listener that does the real work
*/


var _copy = function(e){
  if (_hasOwn.call(_clipData,"text/plain")) {
    e.clipboardData.setData("text/plain", _clipData["text/plain"]);
    e.preventDefault();
  }
  if (_hasOwn.call(_clipData, "text/html")) {
    e.clipboardData.setData("text/html", _clipData["text/html"]);
    e.preventDefault();
  }

};

/**
* One global click listener is all we need
*/


var _onclick = function(event) {
  var textContent,
      htmlContent,
      targetEl = _getRelatedTarget(event.target);
  if (
    !(_clipData["text/html"] || _clipData["text/plain"]) &&
    targetEl &&
    (htmlContent = targetEl.value || targetEl.outerHTML || targetEl.innerHTML) &&
    (textContent = targetEl.value || targetEl.textContent || targetEl.innerText)
  ) {
    ZeroClipboard.clearData();
    ZeroClipboard.setData("text/plain", textContent);
    if (htmlContent !== textContent) {
      ZeroClipboard.setData("text/html", htmlContent);
    }
  }
  else if (!_clipData["text/plain"] && event.target && (textContent = event.target.getAttribute("data-clipboard-text"))) {
    ZeroClipboard.clearData();
    ZeroClipboard.setData("text/plain", textContent);
  }
  _copyTarget = event.target; // The clicked element
  if (_copyTarget && _copyTarget.hasAttribute("data-clipboard-text")) {
    _clipData["text/plain"] = _copyTarget.getAttribute("data-clipboard-text");
  }
  if (_trackedElements.indexOf(_copyTarget) || targetEl || _clipData["text/plain"] !== null) {
    // This element was meant for some clipboard action
    // Potential sources of data:
    //   * A selection? (should work to just trigger document.execCommand()? - but on what document??)
    //   * setData() calls in a synthetic copy event fired by us
    //   * data-clipboard-text
    //   * data-clipboard-target
    // So: first fire copy event. If setData() is used, obey. Otherwise,
    // look for data-clipboard-target. If it is an element, get text content and
    // innerHTML (or outer?). If it is an IFRAME and the subdocument contains a
    // selection, fire execCommand() on that document. Otherwise, look for data-clipboard-text
    // and use the value as input. Otherwise, just call execCommand("copy")..?

    _emit("beforecopy");
    _clipData = _emit("copy");
    // data.data.text, data.data.html - simplify to remove double data.data

    document.addEventListener("copy", _copy, false);
    /* This command will trigger our copy listener */
    document.execCommand("copy", null, false);
    document.removeEventListener("copy", _copy, false);
  }
};

document.addEventListener('click', _onclick, false);

/**
 * Get a relatedTarget from the target's `data-clipboard-target` attribute
 * @private
 */
var _getRelatedTarget = function(targetEl) {
  var relatedTargetId = targetEl && targetEl.getAttribute && targetEl.getAttribute("data-clipboard-target");
  return relatedTargetId ? document.getElementById(relatedTargetId) : null;
};


/**
 * The underlying implementation of `ZeroClipboard.config`.
 * @private
 */
var _config = function(options) {
  if (typeof options === "object" && options !== null) {
    for (var prop in options) {
      // TODO: throw if "useFlash" is attempted set after
      // ZC is initialized?
      if (_hasOwn.call(options, prop)) {
        _globalConfig[prop] = options[prop];
      }
    }
  }

  if (typeof options === "string" && options) {
    if (_hasOwn.call(_globalConfig, options)) {
      // TODO: MAYBE do a `_deepCopy` of this as well? It is convenient to NOT
      // do a `_deepCopy` if we want to allow consumers to, for example, be
      // able to update the `trustedDomains` array on their own terms rather
      // than having to send in a whole new array.
      return _globalConfig[options];
    }
    // else `return undefined;`
    return;
  }

  return _deepCopy(_globalConfig);
};


/**
 * The underlying implementation of `ZeroClipboard.state`.
 * @private
 */
var _state = function() {
  return {
    browser: _pick(_navigator, ["userAgent", "platform", "appName", "appVersion"]),
    zeroclipboard: {
      version: ZeroClipboard.version,
      config: ZeroClipboard.config(),
      html5: true
    }
  };
};


/**
 * The underlying implementation of `ZeroClipboard.on`.
 * @private
 */
var _on = function(eventType, listener) {
  var i, len, events,
      added = {};

  if (typeof eventType === "string" && eventType) {
    events = eventType.toLowerCase().split(/\s+/);
  }
  else if (typeof eventType === "object" && eventType && typeof listener === "undefined") {
    for (i in eventType) {
      if (_hasOwn.call(eventType, i) && typeof i === "string" && i && typeof eventType[i] === "function") {
        ZeroClipboard.on(i, eventType[i]);
      }
    }
  }

  if (events && events.length) {
    for (i = 0, len = events.length; i < len; i++) {
      eventType = events[i].replace(/^on/, "");
      added[eventType] = true;
      if (!_handlers[eventType]) {
        _handlers[eventType] = [];
      }
      _handlers[eventType].push(listener);
      // Trigger "ready" listeners immediately
      if(eventType === "ready"){
        _setTimeout.call(function(){
          ZeroClipboard.emit({
            type: "ready",
            client: ZeroClipboard
          });
        }, 0);
      }

    }
  }

  return ZeroClipboard;
};


/**
 * The underlying implementation of `ZeroClipboard.off`.
 * @private
 */
var _off = function(eventType, listener) {
  var i, len, foundIndex, events, perEventHandlers;
  if (arguments.length === 0) {
    // Remove ALL of the _handlers for ALL event types
    events = _keys(_handlers);
  }
  else if (typeof eventType === "string" && eventType) {
    events = eventType.toLowerCase().split(/\s+/);
  }
  else if (typeof eventType === "object" && eventType && typeof listener === "undefined") {
    for (i in eventType) {
      if (_hasOwn.call(eventType, i) && typeof i === "string" && i && typeof eventType[i] === "function") {
        ZeroClipboard.off(i, eventType[i]);
      }
    }
  }

  if (events && events.length) {
    for (i = 0, len = events.length; i < len; i++) {
      eventType = events[i].toLowerCase().replace(/^on/, "");
      perEventHandlers = _handlers[eventType];
      if (perEventHandlers && perEventHandlers.length) {
        if (listener) {
          foundIndex = perEventHandlers.indexOf(listener);
          while (foundIndex !== -1) {
            perEventHandlers.splice(foundIndex, 1);
            foundIndex = perEventHandlers.indexOf(listener, foundIndex);
          }
        }
        else {
          // If no `listener` was provided, remove ALL of the handlers for this event type
          perEventHandlers.length = 0;
        }
      }
    }
  }

  return ZeroClipboard;
};


/**
 * The underlying implementation of `ZeroClipboard.handlers`.
 * @private
 */
var _listeners = function(eventType) {
  var copy;
  if (typeof eventType === "string" && eventType) {
    copy = _deepCopy(_handlers[eventType]) || null;
  }
  else {
    copy = _deepCopy(_handlers);
  }
  return copy;
};


/**
 * The underlying implementation of `ZeroClipboard.emit`.
 * @private
 */
var _emit = function(event) {
  var eventCopy, returnVal, tmp;

  // Create an event object for this event type
  event = _createEvent(event);

  if (!event) {
    return;
  }

  // Trigger any and all registered event handlers
  eventCopy = _extend({}, event);
  _dispatchCallbacks.call(this, eventCopy);

};


/**
 * The underlying implementation of `ZeroClipboard.create`.
 * @private
 */
var _create = function() {
};


/**
 * The underlying implementation of `ZeroClipboard.destroy`.
 * @private
 */
var _destroy = function() {
  // Clear any pending clipboard data
  ZeroClipboard.clearData();

  // Deactivate during self-destruct, even if `_globalConfig.autoActivate` !== `true`
  ZeroClipboard.blur();

  // Emit a special [synchronously handled] event so that Clients may listen
  // for it and destroy themselves
  ZeroClipboard.emit("destroy");

  // Remove all event handlers
  ZeroClipboard.off();
};


/**
 * The underlying implementation of `ZeroClipboard.setData`.
 * @private
 */
var _setData = function(format, data) {
  var dataObj;

  if (typeof format === "object" && format && typeof data === "undefined") {
    dataObj = format;

    // Clear out existing pending data if an object is provided
    ZeroClipboard.clearData();
  }
  else if (typeof format === "string" && format) {
    dataObj = {};
    dataObj[format] = data;
  }
  else {
    return;
  }

  // Copy over owned properties with non-empty string values
  for (var dataFormat in dataObj) {
    if (
      typeof dataFormat === "string" && dataFormat && _hasOwn.call(dataObj, dataFormat) &&
      typeof dataObj[dataFormat] === "string" && dataObj[dataFormat]
    ) {
      _clipData[dataFormat] = _fixLineEndings(dataObj[dataFormat]);
    }
  }
};


/**
 * The underlying implementation of `ZeroClipboard.clearData`.
 * @private
 */
var _clearData = function(format) {
  // If no format is passed, delete all of the pending data
  if (typeof format === "undefined") {
    _deleteOwnProperties(_clipData);
    _clipDataFormatMap = null;
  }
  // Otherwise, delete only the pending data of the specified format
  else if (typeof format === "string" && _hasOwn.call(_clipData, format)) {
    delete _clipData[format];
  }
};


/**
 * The underlying implementation of `ZeroClipboard.getData`.
 * @private
 */
var _getData = function(format) {
  // If no format is passed, get a copy of ALL of the pending data
  if (typeof format === "undefined") {
    return _deepCopy(_clipData);
  }
  // Otherwise, get only the pending data of the specified format
  else if (typeof format === "string" && _hasOwn.call(_clipData, format)) {
    return _clipData[format];
  }
};


/**
 * The underlying implementation of `ZeroClipboard.focus`/`ZeroClipboard.activate`.
 * @private
 */
var _focus = function(element) {
};


/**
 * The underlying implementation of `ZeroClipboard.blur`/`ZeroClipboard.deactivate`.
 * @private
 */
var _blur = function() {
};


/**
 * The underlying implementation of `ZeroClipboard.activeElement`.
 * @private
 */
var _activeElement = function() {
  return null;
};



//
// Helper functions
//


/**
 * Create or update an `event` object, based on the `eventType`.
 * @private
 */
var _createEvent = function(event) {
  /*jshint maxstatements:30 */

  var eventType;
  if (typeof event === "string" && event) {
    eventType = event;
    event = {};
  }
  else if (typeof event === "object" && event && typeof event.type === "string" && event.type) {
    eventType = event.type;
  }

  // Bail if we don't have an event type
  if (!eventType) {
    return;
  }

  eventType = eventType.toLowerCase();

  // Sanitize the event type and set the `target` and `relatedTarget` properties if not already set
  if (!event.target &&
    (
      /^(copy|aftercopy|_click)$/.test(eventType) ||
      (eventType === "error" && event.name === "clipboard-error")
    )
  ) {
    event.target = _copyTarget;
  }

  _extend(event, {
    type: eventType,
    target: event.target || _currentElement || null,
    relatedTarget: event.relatedTarget || null,
    currentTarget: (_flashState && _flashState.bridge) || null,
    timeStamp: event.timeStamp || _now() || null
  });

  var msg = _eventMessages[event.type];
  if (event.type === "error" && event.name && msg) {
    msg = msg[event.name];
  }
  if (msg) {
    event.message = msg;
  }

  if (event.type === "ready") {
    _extend(event, {
      target: null,
      version: _flashState.version
    });
  }

  // Add all of the special properties and methods for a `copy` event
  if (event.type === "copy") {
    event.clipboardData = {
      setData: ZeroClipboard.setData,
      clearData: ZeroClipboard.clearData
    };
  }

  if (event.type === "aftercopy") {
    event = _mapClipResultsFromFlash(event, _clipDataFormatMap);
  }

  if (event.target && !event.relatedTarget) {
    event.relatedTarget = _getRelatedTarget(event.target);
  }

  return _addMouseData(event);
};






/**
 * Ensure OS-compliant line endings, i.e. "\r\n" on Windows, "\n" elsewhere
 *
 * @returns string
 * @private
 */
var _fixLineEndings = function(content) {
  var replaceRegex = /(\r\n|\r|\n)/g;

  if (typeof content === "string" && _globalConfig.fixLineEndings === true) {
    if (_isWindows()) {
      if (/((^|[^\r])\n|\r([^\n]|$))/.test(content)) {
        content = content.replace(replaceRegex, "\r\n");
      }
    }
    else if (/\r/.test(content)) {
      content = content.replace(replaceRegex, "\n");
    }
  }
  return content;
};



/**
 * A shell constructor for `ZeroClipboard` client instances.
 *
 * @constructor
 */
var ZeroClipboard = function() {

  // Ensure the constructor is invoked with the `new` keyword.
  if (!(this instanceof ZeroClipboard)) {
    return new ZeroClipboard();
  }

  // EXTREMELY IMPORTANT!
  // Ensure the `ZeroClipboard._createClient` function is invoked if available.
  // This allows an extension point for 3rd parties to create their own
  // interpretations of what a ZeroClipboard "Client" should be like.
  if (typeof ZeroClipboard._createClient === "function") {
    ZeroClipboard._createClient.apply(this, _args(arguments));
  }

};


/**
 * The ZeroClipboard library's version number.
 *
 * @static
 * @readonly
 * @property {string}
 */
_defineProperty(ZeroClipboard, "version", {
  value: "2.3.0-beta.1",
  writable: false,
  configurable: true,
  enumerable: true
});


/**
 * Update or get a copy of the ZeroClipboard global configuration.
 * Returns a copy of the current/updated configuration.
 *
 * @returns Object
 * @static
 */
ZeroClipboard.config = function(/* options */) {
  return _config.apply(this, _args(arguments));
};


/**
 * Diagnostic method that describes the state of the browser, Flash Player, and ZeroClipboard.
 *
 * @returns Object
 * @static
 */
ZeroClipboard.state = function() {
  return _state.apply(this, _args(arguments));
};


/**
 * Check if Flash is unusable for any reason: disabled, outdated, deactivated, etc.
 *
 * @returns Boolean
 * @static
 */
ZeroClipboard.isFlashUnusable = function() {
  return _isFlashUnusable.apply(this, _args(arguments));
};


/**
 * Register an event listener.
 *
 * @returns `ZeroClipboard`
 * @static
 */
ZeroClipboard.on = function(/* eventType, listener */) {
  return _on.apply(this, _args(arguments));
};


/**
 * Unregister an event listener.
 * If no `listener` function/object is provided, it will unregister all listeners for the provided `eventType`.
 * If no `eventType` is provided, it will unregister all listeners for every event type.
 *
 * @returns `ZeroClipboard`
 * @static
 */
ZeroClipboard.off = function(/* eventType, listener */) {
  return _off.apply(this, _args(arguments));
};


/**
 * Retrieve event listeners for an `eventType`.
 * If no `eventType` is provided, it will retrieve all listeners for every event type.
 *
 * @returns array of listeners for the `eventType`; if no `eventType`, then a map/hash object of listeners for all event types; or `null`
 */
ZeroClipboard.handlers = function(/* eventType */) {
  return _listeners.apply(this, _args(arguments));
};


/**
 * Event emission receiver from the Flash object, forwarding to any registered JavaScript event listeners.
 *
 * @returns For the "copy" event, returns the Flash-friendly "clipData" object; otherwise `undefined`.
 * @static
 */
ZeroClipboard.emit = function(/* event */) {
  return _emit.apply(this, _args(arguments));
};


/**
 * Create and embed the Flash object.
 *
 * @returns The Flash object
 * @static
 */
ZeroClipboard.create = function() {
  return _create.apply(this, _args(arguments));
};


/**
 * Self-destruct and clean up everything, including the embedded Flash object.
 *
 * @returns `undefined`
 * @static
 */
ZeroClipboard.destroy = function() {
  return _destroy.apply(this, _args(arguments));
};


/**
 * Set the pending data for clipboard injection.
 *
 * @returns `undefined`
 * @static
 */
ZeroClipboard.setData = function(/* format, data */) {
  return _setData.apply(this, _args(arguments));
};


/**
 * Clear the pending data for clipboard injection.
 * If no `format` is provided, all pending data formats will be cleared.
 *
 * @returns `undefined`
 * @static
 */
ZeroClipboard.clearData = function(/* format */) {
  return _clearData.apply(this, _args(arguments));
};


/**
 * Get a copy of the pending data for clipboard injection.
 * If no `format` is provided, a copy of ALL pending data formats will be returned.
 *
 * @returns `String` or `Object`
 * @static
 */
ZeroClipboard.getData = function(/* format */) {
  return _getData.apply(this, _args(arguments));
};


/**
 * Sets the current HTML object that the Flash object should overlay. This will put the global
 * Flash object on top of the current element; depending on the setup, this may also set the
 * pending clipboard text data as well as the Flash object's wrapping element's title attribute
 * based on the underlying HTML element and ZeroClipboard configuration.
 *
 * @returns `undefined`
 * @static
 */
ZeroClipboard.focus = ZeroClipboard.activate = function(/* element */) {
  return _focus.apply(this, _args(arguments));
};


/**
 * Un-overlays the Flash object. This will put the global Flash object off-screen; depending on
 * the setup, this may also unset the Flash object's wrapping element's title attribute based on
 * the underlying HTML element and ZeroClipboard configuration.
 *
 * @returns `undefined`
 * @static
 */
ZeroClipboard.blur = ZeroClipboard.deactivate = function() {
  return _blur.apply(this, _args(arguments));
};


/**
 * Returns the currently focused/"activated" HTML element that the Flash object is wrapping.
 *
 * @returns `HTMLElement` or `null`
 * @static
 */
ZeroClipboard.activeElement = function() {
  return _activeElement.apply(this, _args(arguments));
};


/**
 * The underlying implementation of `ZeroClipboard.Client.prototype.clip`.
 * @private
 */
var _clientClip = function(elements) {
  return this;
};


/**
 * The underlying implementation of `ZeroClipboard.Client.prototype.unclip`.
 * @private
 */
var _clientUnclip = function(elements) {
  return this;
};


/**
 * Creates a new ZeroClipboard client instance.
 * Optionally, auto-`clip` an element or collection of elements.
 *
 * @constructor
 */
ZeroClipboard._createClient = function(/* elements */) {
  // Invoke the real constructor
  //_clientConstructor.apply(this, _args(arguments));
};


/**
 * Register an event listener to the client.
 *
 * @returns `this`
 */
ZeroClipboard.prototype.on = function(/* eventType, listener */) {
  return ZeroClipboard.on.apply(this, _args(arguments));
};


/**
 * Unregister an event handler from the client.
 * If no `listener` function/object is provided, it will unregister all handlers for the provided `eventType`.
 * If no `eventType` is provided, it will unregister all handlers for every event type.
 *
 * @returns `this`
 */
ZeroClipboard.prototype.off = function(/* eventType, listener */) {
  return ZeroClipboard.off.apply(this, _args(arguments));
};


/**
 * Retrieve event listeners for an `eventType` from the client.
 * If no `eventType` is provided, it will retrieve all listeners for every event type.
 *
 * @returns array of listeners for the `eventType`; if no `eventType`, then a map/hash object of listeners for all event types; or `null`
 */
ZeroClipboard.prototype.handlers = function(/* eventType */) {
  return ZeroClipboard.handlers.apply(this, _args(arguments));
};


/**
 * Event emission receiver from the Flash object for this client's registered JavaScript event listeners.
 *
 * @returns For the "copy" event, returns the Flash-friendly "clipData" object; otherwise `undefined`.
 */
ZeroClipboard.prototype.emit = function(/* event */) {
  return ZeroClipboard.emit.apply(this, _args(arguments));
};


/**
 * Register clipboard actions for new element(s) to the client.
 *
 * @returns `this`
 */
ZeroClipboard.prototype.clip = function(/* elements */) {
  return _clientClip.apply(this, _args(arguments));
};


/**
 * Unregister the clipboard actions of previously registered element(s) on the page.
 * If no elements are provided, ALL registered elements will be unregistered.
 *
 * @returns `this`
 */
ZeroClipboard.prototype.unclip = function(/* elements */) {
  return _clientUnclip.apply(this, _args(arguments));
};


/**
 * Get all of the elements to which this client is clipped.
 *
 * @returns array of clipped elements
 */
ZeroClipboard.prototype.elements = function() {
  return ZeroClipboard.elements.apply(this, _args(arguments));
};


/**
 * Self-destruct and clean up everything for a single client.
 * This will NOT destroy the embedded Flash object.
 *
 * @returns `undefined`
 */
ZeroClipboard.prototype.destroy = function() {
  return _clientDestroy.apply(this, _args(arguments));
};


/**
 * Stores the pending plain text to inject into the clipboard.
 *
 * @returns `this`
 */
ZeroClipboard.prototype.setText = function(text) {
  ZeroClipboard.setData("text/plain", text);
  return this;
};


/**
 * Stores the pending HTML text to inject into the clipboard.
 *
 * @returns `this`
 */
ZeroClipboard.prototype.setHtml = function(html) {
  ZeroClipboard.setData("text/html", html);
  return this;
};


/**
 * Stores the pending rich text (RTF) to inject into the clipboard.
 *
 * @returns `this`
 */
ZeroClipboard.prototype.setRichText = function(richText) {
  ZeroClipboard.setData("application/rtf", richText);
  return this;
};


/**
 * Stores the pending data to inject into the clipboard.
 *
 * @returns `this`
 */
ZeroClipboard.prototype.setData = function(/* format, data */) {
  ZeroClipboard.setData.apply(this, _args(arguments));
  return this;
};


/**
 * Clears the pending data to inject into the clipboard.
 * If no `format` is provided, all pending data formats will be cleared.
 *
 * @returns `this`
 */
ZeroClipboard.prototype.clearData = function(/* format */) {
  ZeroClipboard.clearData.apply(this, _args(arguments));
  return this;
};


/**
 * Gets a copy of the pending data to inject into the clipboard.
 * If no `format` is provided, a copy of ALL pending data formats will be returned.
 *
 * @returns `String` or `Object`
 */
ZeroClipboard.prototype.getData = function(/* format */) {
  return ZeroClipboard.getData.apply(this, _args(arguments));
};



// The AMDJS logic branch is evaluated first to avoid potential confusion over
// the CommonJS syntactical sugar offered by AMD.
if (typeof define === "function" && define.amd) {
  define(function() {
    return ZeroClipboard;
  });
}
else if (typeof module === "object" && module && typeof module.exports === "object" && module.exports) {
  // CommonJS module loaders....
  module.exports = ZeroClipboard;
}
else {
  window.ZeroClipboard = ZeroClipboard;
}

})((function() {
  /*jshint strict: false */
  return this || window;
})());

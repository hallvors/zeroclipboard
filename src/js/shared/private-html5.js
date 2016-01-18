
var _globalConfig = {};
var _document = window.document,
    _Error = Error,
    _hasOwn = window.Object.prototype.hasOwnProperty;


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
* Get a relatedTarget from the target's `data-clipboard-target` attribute
* @private
*/
var _getRelatedTarget = function(targetEl) {
    var relatedTargetId = targetEl && targetEl.getAttribute && targetEl.getAttribute("data-clipboard-target");
    return relatedTargetId ? _document.getElementById(relatedTargetId) : null;
};


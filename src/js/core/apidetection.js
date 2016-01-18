/**
 * Keep track of HTML5 Clipboard API implementation status
 * @private
 */
var _html5ClipboardSupported = false;

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
 * Invoke the HTML5 detection algorithms immediately.
* If HTML5 clipboard is *not* supported, add the Flash-based
* version of ZeroClipboard to the document instead
*/

_detectHTML5API();

if (!_html5ClipboardSupported || _globalConfig.useFlash) {
  var zcSourceURL = _getCurrentScriptUrl();
  var isMin = /\.min\./.test(zcSourceURL);
  var newURL = _getDirPathOfUrl(zcSourceURL) + (isMin ? "ZeroClipboardFlash.min.js" : "ZeroClipboardFlash.js");
  document.documentElement.appendChild(document.createElement("script")).src = newURL;
  return; // we don't have more work to do
}

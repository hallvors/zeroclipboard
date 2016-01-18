/**
 * Invoke the HTML5 detection algorithms immediately.
* If HTML5 clipboard is *not* supported, add the Flash-based
* version of ZeroClipboard to the document instead
*/

if (!_detectHTML5API() || _globalConfig.useFlash) {
  var zcSourceURL = _getCurrentScriptUrl();
  var isMin = /\.min\./.test(zcSourceURL);
  var newURL = _getDirPathOfUrl(zcSourceURL) + (isMin ? "ZeroClipboardFlash.min.js" : "ZeroClipboardFlash.js");
  document.documentElement.appendChild(document.createElement("script")).src = newURL;
  return; // we don't have more work to do
}

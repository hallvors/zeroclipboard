
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
  // We might have event listeners registered by scripts
  ZeroClipboard.emit(e);

};

/**
* One global click listener is all we need
*/


var _onclick = function(event) {
  var textContent,
      htmlContent,
      _copyTarget = event.target,
      targetEl = _getRelatedTarget(event.target);
  if(_trackedElements.indexOf(_copyTarget) === -1) {
    return;
  }
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
  if (_copyTarget && _copyTarget.hasAttribute("data-clipboard-text")) {
    _clipData["text/plain"] = _copyTarget.getAttribute("data-clipboard-text");
  }
  if (targetEl || _clipData["text/plain"] !== null) {
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

    document.addEventListener("copy", _copy, false);
    /* This command will trigger our copy listener */
    document.execCommand("copy", null, false);
    document.removeEventListener("copy", _copy, false);
    ZeroClipboard.clearData();
  }
};

document.addEventListener("click", _onclick, false);



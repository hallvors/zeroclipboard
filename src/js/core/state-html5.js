/**
* Tracked elements are elements we're instructed to handle copying for
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
    for (var i = 0; elements[i]; i++) {
      _trackedElements.push(elements[i]);
    }
  }
};


/**
* A method to forget tracked element(s)
* Note: if jQuery is used, we want the *actual* elements, not
* jQuery objects
*/

var _untrackElements = function(elements){
  if (elements.nodeType === 1) { // Argument is a single element
    while(_trackedElements.indexOf(elements) > -1) {
        _trackedElements.splice(_trackedElements.indexOf(elements), 1);
    }
  } else if (elements.length) {
    for (var i = 0; elements[i]; i++) {
      _untrackElements(elements[i]);
    }
  }
};


/**
* The _clipData object will remember all the data passed to
* ZeroClipboard while we're processing a copy operation
*/
var _clipData = {};


/**
* The _eventListeners object will keep track of event listeners
* for the ZC events
*/

var _eventListeners = {
    "*": [],
    "copy": []
};

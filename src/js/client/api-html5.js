
var ZeroClipboard = function(){
    return ZeroClipboard; // There will only ever be one instance
};

ZeroClipboard.clip = function(elements) {
    _trackElements(elements);
};

ZeroClipboard.unclip = function(elements) {
    _untrackElements(elements);
};

ZeroClipboard.clearData = function() {
    _clipData = {};
};

ZeroClipboard.setData = function(type, data) {
    _clipData[type] = data;
};

ZeroClipboard.on = function(event, func) {
    if(_eventListeners[event] === undefined){
        throw _Error("No such event: " + event);
    }
    _eventListeners[event].push(func);
};

ZeroClipboard.off = function(event, func) {
    if(_eventListeners[event] === undefined){
        throw _Error("No such event: " + event);
    }
    if(_eventListeners[event].indexOf(func)) {
        _eventListeners[event].splice(_eventListeners[event].indexOf(func), 1);
    }
};

ZeroClipboard.emit = function(event) {
    var i;
    if(_eventListeners["*"]) {
        for(i = 0; i < _eventListeners["*"].length; i++) {
            _eventListeners["*"][i].call(this, event);
            event.preventDefault();
        }
    }
    if(_eventListeners[event.type]) {
        for(i = 0; i < _eventListeners[event.type].length; i++) {
            _eventListeners[event.type][i].call(this, event);
            event.preventDefault(); // Can't say it too often, right? Mea culpa for requiring it..
        }
    }
};

ZeroClipboard.implementation = "native";

////
// Emacs Lisp implementation in JavaScript.
// 
// Copyright (c) 2009 Sami Samhuri - sami.samhuri@gmail.com
//
// Released under the terms of the MIT license.  See the included file
// LICENSE.

// Just a little sugar
EL.initHook(function() {
    Array.prototype.each = function(fn) {
	var i = 0,
	n = this.length;
	while (i < n) {
            fn(this[i], i);
	    ++i;
	}
    };

    // Thanks Prototype
    String.prototype.camelize = function() {
	var oStringList = this.split('_');
	if (oStringList.length == 1)
	    return oStringList[0][0].toUpperCase() + oStringList[0].substring(1);

	var camelizedString = oStringList[0].charAt(0).toUpperCase() + oStringList[0].substring(1);

	for (var i = 1, len = oStringList.length; i < len; i++) {
	    var s = oStringList[i];
	    camelizedString += s.charAt(0).toUpperCase() + s.substring(1);
	}

	return camelizedString;
    };

    // A typeOf function that distinguishes between objects, arrays,
    // and null.
    EL.typeOf = function(value) {
	var s = typeof value;
	if (s === 'object') {
            if (value) {
		if (typeof value.length === 'number' &&
                    !(value.propertyIsEnumerable('length')) &&
                    typeof value.splice === 'function') {
                    s = 'array';
		}
            } else {
		s = 'null';
            }
	}
	return s;
    };

    // TODO throw something more informative
    EL.assert = function(condition, message) {
	if (!condition()) {
            throw("assertion failed: " + condition + " (" + message + ")");
	}
    };
});

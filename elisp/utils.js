////
// Emacs Lisp implementation in JavaScript.
// 
// Copyright (c) 2009 Sami Samhuri - sami.samhuri@gmail.com
//
// Released under the terms of the MIT license.  See the included file
// LICENSE.

// A typeOf function that distinguishes between objects, arrays,
// and null.
var typeOf = function(value) {
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
exports.typeOf = typeOf;

// TODO throw something more informative
exports.assert = function(condition, message) {
    if (!condition()) {
        throw("assertion failed: " + condition + " (" + message + ")");
    }
};

// aka foldl
exports.reduce = function(fn, accum, list) {
    var i = 0,
	n = list.length;
    while (i < n) {
	accum = fn(accum, list[i++]);
    }
    return accum;
};

exports.foldr = function(fn, end, list) {
    var i = list.length-1;
    while (i >= 0) {
	end = fn(end, list[i--]);
    }
    return end;
};

exports.shallowCopy = function(list) {
    var i = 0,
	n = list.length,
	result = [];
    while (i < n) {
	result.push(list[i++]);
    }
    return result;
};

var pp = function(x, toString) {
    var s, recurse = arguments.callee;

//    print('pp, x = ' + x);
    
    if (x === null || x === undefined) {
	s = '';
    }
    else if (!x.repr) {
	s = '[UNKNOWN VALUE: ' + x + ' = {\n'; // what are you?!
	for (var y in x) {
	    s += '    ' + y + ': ' + x[y] + "\n";
	}
	s += '}';
    }
    else {
	s = x.repr();
    }

    if (toString) {
	return(s);
    }
    else if (s.length > 0) {
	print(s);
    }
};
exports.pp = pp;

var pp_v = function(x) {
    print('-------- START --------');
    print('tag: ' + x.tag());

    if (x.isCons()) {
        print('car: ' + x.car());
        print('cdr: ' + x.cdr());	
    }
    else {
	print('value: ' + x.value());	
    }

    print('--------  END  --------');
};
exports.pp_v = pp_v;

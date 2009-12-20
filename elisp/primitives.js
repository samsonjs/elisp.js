////
// Emacs Lisp implementation in JavaScript.
// 
// Copyright (c) 2009 Sami Samhuri - sami.samhuri@gmail.com
//
// Released under the terms of the MIT license.  See the included file
// LICENSE.

var init = require('elisp/init'),
    type = require('elisp/types'),
    utils = require('elisp/utils');

var PrimitiveVariables = [
    ['t', {
        type: 'variable',
	value: type.T,
	docstring: "true"
    }],
    ['nil', {
        type: 'variable',
	value: type.NIL,
	docstring: "nil"
    }]
];
exports.PrimitiveVariables = PrimitiveVariables;


var PrimitiveFunctions = [];
exports.PrimitiveFunctions = PrimitiveFunctions;

// 'this' is bound to the evaluator.Evaluator object when executing primitve functions
var definePrimitive = function(name, params, body, docstring) {
//    print('*** DEFINING: ' + name);
    PrimitiveFunctions.push([name, {
	type: 'primitive',
	name: name,
	params: params,       // unused right now but should be checked
	docstring: docstring,
	body: body
    }]);
};
exports.definePrimitive = definePrimitive;

var notFunc = function(fn) {
    return function(x){ return !fn(x); };
};
exports.notFunc = notFunc;

var makePrimitiveBooleanFunc = function(fn) {
    return function(x){ return x[fn]() ? type.T : type.NIL; };
};
exports.makePrimitiveBooleanFunc = makePrimitiveBooleanFunc;

init.hook('Define Primitive Variables and Functions', function() {
    var type = require('elisp/types');
    definePrimitive('consp', ['symbol'], makePrimitiveBooleanFunc('isCons'),
        "Return T if symbol is a cons, nil otherwise.");
    
    definePrimitive('atom', ['symbol'], makePrimitiveBooleanFunc('isAtom'),
        "Return T if symbol is not a cons or is nil, nil otherwise.");
    
    definePrimitive('symbol-name', ['symbol'],
        function(symbol) { return new type.LispString(symbol.symbolName()); },
        "Return a symbol's name, a string.");
    
    definePrimitive('string-match', ['regex', 'string', '&optional', 'start'],
        function(regex, string, start) {
    	     var index = start ? start.value() : 0,
    		 s = string.value().substring(index),
    		 match = s.match(new RegExp(regex.value())),
    		 found = match ? new type.LispNumber(s.indexOf(match[0])) : type.NIL;
    	     return found;},
        "Return the index of the char matching regex in string, beginning from start if available.");
    
    // Right now a single string in the arg list will cause all the arguments
    // to be converted to strings similar to JavaScript.  These
    // semantics suck and should change, not only for real emacs lisp compatibility.
    // ... for now it's the only way to catenate strings. 
    definePrimitive('+', [/*...*/],
        function() {
    	     var args = utils.shallowCopy(arguments),
    		 initial = type.inferType(args),
		 result = utils.reduce(function(sum, n) {
                      return sum + n.value();
		 }, initial.value(), args);
    	     return type.construct(initial.tag(), result);
	}, "add two numbers");
    
    definePrimitive('-', [/*...*/],
        function() {
	    if (arguments.length == 1) {
		return new type.LispNumber(0 - arguments[0].value());
	    }
	    var initial = arguments.length > 1 ? arguments[0].value() : 0,
	        args = utils.shallowCopy(arguments).slice(1),
		result = utils.reduce(function(diff, n) {
		    return diff - n.value();
                }, initial, args);
	    return new type.LispNumber(result);
	}, "negate a number, or subtract two or more numbers");
    
    definePrimitive('*', [/*...*/],
        function() {
	    var initial = arguments.length >= 1 ? arguments[0].value() : 1,
		args = utils.shallowCopy(arguments).slice(1),
		result = utils.reduce(function(prod, n){
		    return prod * n.value();
		}, initial, args);
	    return new type.LispNumber(result);
	}, "multiply one or more numbers");
    
    definePrimitive('/', [/*...*/],
        function() {
	    // TODO signal a real error for < 2 arguments
	    if (arguments.length < 2) {
		print("[error] invalid division, need 2 or more params");
		return type.NIL;
	    }
	    var initial = arguments[0].value(),
		args = utils.shallowCopy(arguments).slice(1),
		result = utils.foldr(function(quot, n) {
		    return quot / n.value();
		}, initial, args);
	    return new type.LispNumber(result);
    	 }, "divide two or more numbers");
    
    definePrimitive('print', ['x'], utils.pp, "print an expression");

    var settings = require('elisp/settings');
    definePrimitive('hide-prompt', ['yes-or-no'],
        function(bool){ settings.hidePrompt = !bool.isNil(); },
        "Call with T to hide the prompt or nil to show it.");
});

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

var makeBooleanFunc = function(fn) {
    return function(x){ return x[fn]() ? type.T : type.NIL; };
};
exports.makeBooleanFunc = makeBooleanFunc;

// TODO FIXME make NIL act like the empty list
var makeNilFn = function(fn) {
    return function(arg){ return arg.isNil() ? arg : arg[fn](); };
};

var makeZeroFn = function(fn) {
    return function(arg){ return arg.isNil() ? new type.LispNumber(0) : arg[fn](); };
};

init.hook('Define Primitive Variables and Functions', function() {

    definePrimitive('consp', ['symbol'], makeBooleanFunc('isCons'),
        "Return t if symbol is a cons, nil otherwise.");
    
    definePrimitive('atom', ['symbol'], makeBooleanFunc('isAtom'),
        "Return t if symbol is not a cons or is nil, nil otherwise.");


// list functions
    
    definePrimitive('car', ['arg'], makeNilFn('car'),
        "Return the car of list.  If arg is nil, return nil. \
Error if arg is not nil and not a cons cell.");

    definePrimitive('cdr', ['arg'], makeNilFn('cdr'),
	"Return the cdr of list.  If arg is nil, return nil. \
Error if arg is not nil and not a cons cell.");

    definePrimitive('nth', ['n', 'arg'], function(n, arg){
	return arg.isNil() ? arg : arg.nth(n.value());
    }, "Return the nth element of list. \
n counts from zero.  If list is not that long, nil is returned.");

    definePrimitive('nthcdr', ['n', 'arg'], function(n, arg){
	return arg.isNil() ? arg : arg.nthcdr(n.value());
    }, "Take cdr n times on list, returns the result.");

    definePrimitive('cadr', ['arg'], makeNilFn('cadr'),
	"Return the car of the cdr of x.");

    definePrimitive('caddr', ['arg'], makeNilFn('caddr'),
	"Return the car of the cdr of the cdr of x.");

    definePrimitive('cadddr', ['arg'], makeNilFn('cadddr'),
	"Return the car of the cdr of the cdr of the cdr of x.");

//////////
///// FIXME new symbol table! this makes the current one barf, because it sucks
/////
//     definePrimitive('length', ['arg'], makeZeroFn('length'),
// 	"Return the length of list.");

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

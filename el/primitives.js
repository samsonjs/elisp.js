////
// Emacs Lisp implementation in JavaScript.
// 
// Copyright (c) 2009 Sami Samhuri - sami.samhuri@gmail.com
//
// Released under the terms of the MIT license.  See the included file
// LICENSE.


EL.PrimitiveVariables = [
    ['t', {
        type: 'variable',
	value: ['symbol', 't'],
	docstring: "true"
    }],
    ['nil', {
        type: 'variable',
	value: ['symbol', 'nil'],
	docstring: "nil"
    }]
];

EL.PrimitiveFunctions = [];

// 'this' is bound to the EL.Evaluator object when executing primitve functions
EL.definePrimitive = function(name, params, body, docstring) {
    EL.PrimitiveFunctions.push([name, {
	type: 'primitive',
	name: name,
	params: params,       // unused right now but should be checked
	docstring: docstring,
	body: body
    }]);
};

EL.notFunc = function(fn) {
    return function(x){ return !fn(x); };
};

EL.makePrimitiveBooleanFunc = function(fn) {
    return function(x){ return fn(x) ? EL.t : EL.nil; };
};

EL._definePrimitives = function() {
EL.definePrimitive('consp', ['symbol'], EL.makePrimitiveBooleanFunc(EL.isCons),
    "Return T if symbol is a cons, nil otherwise.");

EL.definePrimitive('atom', ['symbol'], EL.makePrimitiveBooleanFunc(EL.isAtom),
    "Return T if symbol is not a cons or is nil, nil otherwise.");

EL.definePrimitive('symbol-name', ['symbol'],
    function(symbol) { return EL.string(EL.val(symbol)); },
    "Return a symbol's name, a string.");

EL.definePrimitive('string-match', ['regex', 'string', '&optional', 'start'],
    function(regex, string, start) {
	     var index = start ? EL.val(start) : 0,
		 s = EL.val(string).substring(index),
		 match = s.match(new RegExp(EL.val(regex))),
		 found = match ? EL.number(s.indexOf(match[0])) : EL.nil;
	     return found;},
    "Return the index of the char matching regex in string, beginning from start if available.");

// Right now a single string in the arg list will cause all the arguments
// to be converted to strings similar to JavaScript.  These
// semantics suck and should change, not only for real emacs lisp compatibility.
EL.definePrimitive('+', [/*...*/],
    function() {
	     var args = EL.Util.shallowCopy(arguments),
		 initial = EL.inferType(args),
		 type = initial[0];
	     return EL.Util.reduce(function(sum, n) {
		     return [type, EL.val(sum) + EL.val(n)];
	         }, initial, args);},
    "add two numbers");

EL.definePrimitive('-', [/*...*/],
    function() {
            return EL.Util.foldr(function(diff, n) {
		return EL.number(EL.val(diff) - EL.val(n));
	    }, EL.number(0), EL.Util.shallowCopy(arguments));},
    "subtract two numbers");

EL.definePrimitive('*', [/*...*/],
    function() {
	     return EL.Util.reduce(function(prod, n) {
		     return EL.number(EL.val(prod) * EL.val(n));
	         }, EL.number(1), EL.Util.shallowCopy(arguments));},
    "multiply two numbers");

EL.definePrimitive('/', [/*...*/],
    function() {
	     return EL.Util.foldr(function(quot, n) {
		     return EL.number(EL.val(quot) / EL.val(n));
	         }, EL.number(1), EL.Util.shallowCopy(arguments));
	 },
    "divide two numbers");

EL.definePrimitive('print', ['x'],
    function(x, tostring) {
	     var buffer = "",
		 tag = EL.tag(x);
	     function p(s) {
		 if (tostring) buffer += s;
		 else print(s);
	     }
	     if (tag == 'number' || tag == 'symbol' || tag == 'string') {
		 p(EL.val(x));
	     }
	     else if (tag == 'lambda') {
		 var fn = EL.val(x);
		 p('(lambda ' + fn.name + ' (' + fn.params + ')\n');
		 p(fn.body); // TODO lisp pretty print
		 p(')');
	     }
	     else if (tag == 'list') {
		 var recurse = arguments.callee; // far easier to remember than Y
		 print('(', El.val(x).map(function(e){return (recurse(e, true) + ' ');}), ")");
	     }
	     else {
		 print('unknown type: ' + x);
	     }
	     return EL.nil;
	 },
    "print an expression");
};
EL.initHook(EL._definePrimitives);
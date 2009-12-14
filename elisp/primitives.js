////
// Emacs Lisp implementation in JavaScript.
// 
// Copyright (c) 2009 Sami Samhuri - sami.samhuri@gmail.com
//
// Released under the terms of the MIT license.  See the included file
// LICENSE.


elisp.PrimitiveVariables = [
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

elisp.PrimitiveFunctions = [];

// 'this' is bound to the elisp.Evaluator object when executing primitve functions
elisp.definePrimitive = function(name, params, body, docstring) {
    elisp.PrimitiveFunctions.push([name, {
	type: 'primitive',
	name: name,
	params: params,       // unused right now but should be checked
	docstring: docstring,
	body: body
    }]);
};

elisp.notFunc = function(fn) {
    return function(x){ return !fn(x); };
};

elisp.makePrimitiveBooleanFunc = function(fn) {
    return function(x){ return fn(x) ? elisp.t : elisp.nil; };
};

elisp._definePrimitives = function() {
elisp.definePrimitive('consp', ['symbol'], elisp.makePrimitiveBooleanFunc(elisp.isCons),
    "Return T if symbol is a cons, nil otherwise.");

elisp.definePrimitive('atom', ['symbol'], elisp.makePrimitiveBooleanFunc(elisp.isAtom),
    "Return T if symbol is not a cons or is nil, nil otherwise.");

elisp.definePrimitive('symbol-name', ['symbol'],
    function(symbol) { return elisp.string(elisp.val(symbol)); },
    "Return a symbol's name, a string.");

elisp.definePrimitive('string-match', ['regex', 'string', '&optional', 'start'],
    function(regex, string, start) {
	     var index = start ? elisp.val(start) : 0,
		 s = elisp.val(string).substring(index),
		 match = s.match(new RegExp(elisp.val(regex))),
		 found = match ? elisp.number(s.indexOf(match[0])) : elisp.nil;
	     return found;},
    "Return the index of the char matching regex in string, beginning from start if available.");

// Right now a single string in the arg list will cause all the arguments
// to be converted to strings similar to JavaScript.  These
// semantics suck and should change, not only for real emacs lisp compatibility.
elisp.definePrimitive('+', [/*...*/],
    function() {
	     var args = elisp.Util.shallowCopy(arguments),
		 initial = elisp.inferType(args),
		 type = initial[0];
	     return elisp.Util.reduce(function(sum, n) {
		     return [type, elisp.val(sum) + elisp.val(n)];
	         }, initial, args);},
    "add two numbers");

elisp.definePrimitive('-', [/*...*/],
    function() {
            return elisp.Util.foldr(function(diff, n) {
		return elisp.number(elisp.val(diff) - elisp.val(n));
	    }, elisp.number(0), elisp.Util.shallowCopy(arguments));},
    "subtract two numbers");

elisp.definePrimitive('*', [/*...*/],
    function() {
	     return elisp.Util.reduce(function(prod, n) {
		     return elisp.number(elisp.val(prod) * elisp.val(n));
	         }, elisp.number(1), elisp.Util.shallowCopy(arguments));},
    "multiply two numbers");

elisp.definePrimitive('/', [/*...*/],
    function() {
	     return elisp.Util.foldr(function(quot, n) {
		     return elisp.number(elisp.val(quot) / elisp.val(n));
	         }, elisp.number(1), elisp.Util.shallowCopy(arguments));
	 },
    "divide two numbers");

elisp.definePrimitive('print', ['x'],
    function(x, tostring) {
	     var buffer = "",
		 tag = elisp.tag(x);
	     function p(s) {
		 if (tostring) buffer += s;
		 else print(s);
	     }
	     if (tag == 'number' || tag == 'symbol' || tag == 'string') {
		 p(elisp.val(x));
	     }
	     else if (tag == 'lambda') {
		 var fn = elisp.val(x);
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
	     return elisp.nil;
	 },
    "print an expression");

elisp.definePrimitive('hide-prompt', ['yes-or-no'],
    function(bool){ elisp.hidePrompt = !elisp.isNil(bool); },
    "Call with T to hide the prompt or nil to show it.");
};
elisp.initHook(elisp._definePrimitives);

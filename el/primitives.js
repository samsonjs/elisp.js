////
// Emacs Lisp implementation in JavaScript.
// 
// Copyright (c) 2009 Sami Samhuri - sami.samhuri@gmail.com
//
// Released under the terms of the MIT license.  See the included file
// LICENSE.


/****************************************************************
 **** Primitives ************************************************
 ****************************************************************/

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

// 'this' is bound to the EL.Evaluator object
EL.PrimitiveFunctions = [
    ['symbol-name', {
	 type:      'primitive',
	 name:      'symbol-name',
	 params:    ['symbol'],
	 body:      function(symbol) { return EL.string(EL.val(symbol)); },
	 docstring: "Return a symbol's name, a string."
    }],

    ['string-match', {
	 type:      'primitive',
	 name:      'string-match',
	 params:    ['regex', 'string', '&optional', 'start'],
	 body:      function(regex, string, start) {
	     var index = start ? EL.val(start) : 0,
		 s = EL.val(string).substring(index),
		 match = s.match(new RegExp(EL.val(regex))),
		 found = match ? EL.number(s.indexOf(match[0])) : EL.nil;
	     return found;
	 },
	 docstring: "Return the index of the char matching regex in string, beginning from start if available."
    }],

    ['+', {
	 type:      'primitive',
	 name:      '+',
	 params:    [/* ... */],
	 body:      function() {
	     var args = EL.Util.shallowCopy(arguments),
		 initial = EL.inferType(args),
		 type = initial[0];
	     return EL.Util.reduce(function(sum, n) {
		     return [type, EL.val(sum) + EL.val(n)];
	         }, initial, args);
	 },
	 docstring: "add two numbers"
    }],
    ['-', {
	 type:      'primitive',
	 name:      '-',
	 params:    [/* ... */],
	 body:      function() {
	     return EL.Util.foldr(function(diff, n) {
		     return EL.number(EL.val(diff) - EL.val(n));
	         }, EL.number(0), EL.Util.shallowCopy(arguments));
	 },
	 docstring: "subtract two numbers"
    }],
    ['*', {
	 type:      'primitive',
	 name:      '*',
	 params:    [/* ... */],
	 body:      function() {
	     return EL.Util.reduce(function(prod, n) {
		     return EL.number(EL.val(prod) * EL.val(n));
	         }, EL.number(1), EL.Util.shallowCopy(arguments));
	 },
	 docstring: "multiply two numbers"
    }],
    ['/', {
	 type:      'primitive',
	 name:      '/',
	 params:    [/* ... */],
	 body:      function() {
	     return EL.Util.foldr(function(quot, n) {
		     return EL.number(EL.val(quot) / EL.val(n));
	         }, EL.number(1), EL.Util.shallowCopy(arguments));
	 },
	 docstring: "divide two numbers"
    }],
    ['print', {
	 type:      'primitive',
	 name:      'print',
	 params:    ['x'],
	 body:      function(x, tostring) {
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
	 docstring: "print an expression"    
     }]
];


/****************************************************************
 ****************************************************************/

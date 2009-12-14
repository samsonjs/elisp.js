////
// Emacs Lisp implementation in JavaScript.
// 
// Copyright (c) 2009 Sami Samhuri - sami.samhuri@gmail.com
//
// Released under the terms of the MIT license.  See the included file
// LICENSE.

elisp.consPair = function(pair) {
    var cons = ['cons', pair];
    cons.isList = true;
    return cons;
};

elisp.cons = function(car, cdr) {
    return elisp.consPair([car, cdr]);
};

elisp.car = function(cons) {
    return elisp.isNil(cons) ? cons : elisp.val(cons)[0];
};

elisp.cdr = function(cons) {
    return elisp.isNil(cons) ? cons : elisp.val(cons)[1];
};

elisp.cadr = function(cons) {
    return elisp.car(elisp.cdr(cons));
};

elisp.caddr = function(cons) {
    return elisp.car(elisp.cdr(elisp.cdr(cons)));
};

elisp.cadddr = function(cons) {
    return elisp.car(elisp.cdr(elisp.cdr(elisp.cdr(cons))));
};

elisp.listLength = function(cons) {
    var n = 0;
    while (!elisp.isNil(cons)) {
	cons = elisp.cdr(cons);
	++n;
    }
    return n;
};

elisp.listLast = function(cons) {
    var last;
    while (!elisp.isNil(cons)) {
	last = cons;
	cons = elisp.cdr(cons);
    }
    return elisp.car(last);
};

elisp.listMap = function(cons, fn) {
    var list = [],
	i = 0;
    while (!elisp.isNil(cons)) {
	list.push(fn(elisp.car(cons), i));
	cons = elisp.cdr(cons);
	++i;
    }
    return list.length > 0 ? elisp.list(list) : elisp.nil;
};

elisp.listReduce = function(fn, accum, cons) {
    var i = 0,
	n = elisp.listLength(cons);
    while (i < n) {
	accum = fn(accum, elisp.nth(i++, cons));
    }
    return accum;
};

elisp.idFunction = function(x){return x;};

elisp.unlist = function(cons) {
    return elisp.listReduce(elisp.idFunction, [], cons);
};

elisp.nth = function(n, cons) {
    var i = 0,
	e;
    while (i <= n && !elisp.isNil(cons)) {
	e = elisp.car(cons);
	cons = elisp.cdr(cons);
	++i;
    }
    return n > --i ? elisp.nil : e;
};

elisp.nthcdr = function(n, cons) {
    var e = elisp.cdr(cons),
	i = 0;
    while (i < n && !elisp.isNil(e)) {
	e = elisp.cdr(e);
	++i;
    }
    return n > i ? elisp.nil : e;
};


////
// Emacs Lisp implementation in JavaScript.
// 
// Copyright (c) 2009 Sami Samhuri - sami.samhuri@gmail.com
//
// Released under the terms of the MIT license.  See the included file
// LICENSE.

EL.consPair = function(pair) {
    var cons = ['cons', pair];
    cons.isList = true;
    return cons;
};

EL.cons = function(car, cdr) {
    return EL.consPair([car, cdr]);
};

EL.car = function(cons) {
    return EL.isNil(cons) ? cons : EL.val(cons)[0];
};

EL.cdr = function(cons) {
    return EL.isNil(cons) ? cons : EL.val(cons)[1];
};

EL.cadr = function(cons) {
    return EL.car(EL.cdr(cons));
};

EL.caddr = function(cons) {
    return EL.car(EL.cdr(EL.cdr(cons)));
};

EL.cadddr = function(cons) {
    return EL.car(EL.cdr(EL.cdr(EL.cdr(cons))));
};

EL.listLength = function(cons) {
    var n = 0;
    while (!EL.isNil(cons)) {
	cons = EL.cdr(cons);
	++n;
    }
    return n;
};

EL.listLast = function(cons) {
    var last;
    while (!EL.isNil(cons)) {
	last = cons;
	cons = EL.cdr(cons);
    }
    return EL.car(last);
};

EL.listMap = function(cons, fn) {
    var list = [],
	i = 0;
    while (!EL.isNil(cons)) {
	list.push(fn(EL.car(cons), i));
	cons = EL.cdr(cons);
	++i;
    }
    return list.length > 0 ? EL.list(list) : EL.nil;
};

EL.listReduce = function(fn, accum, cons) {
    var i = 0,
	n = EL.listLength(cons);
    while (i < n) {
	accum = fn(accum, EL.nth(i++, cons));
    }
    return accum;
};

EL.idFunction = function(x){return x;};

EL.unlist = function(cons) {
    return EL.listReduce(EL.idFunction, [], cons);
};

EL.nth = function(n, cons) {
    var i = 0,
	e;
    while (i <= n && !EL.isNil(cons)) {
	e = EL.car(cons);
	cons = EL.cdr(cons);
	++i;
    }
    return n > --i ? EL.nil : e;
};

EL.nthcdr = function(n, cons) {
    var e = EL.cdr(cons),
	i = 0;
    while (i < n && !EL.isNil(e)) {
	e = EL.cdr(e);
	++i;
    }
    return n > i ? EL.nil : e;
};


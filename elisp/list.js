////
// Emacs Lisp implementation in JavaScript.
// 
// Copyright (c) 2009 Sami Samhuri - sami.samhuri@gmail.com
//
// Released under the terms of the MIT license.  See the included file
// LICENSE.

var type = require('elisp/types'),
    utils = require('elisp/utils'),
    LispCons = type.LispCons,
    NIL = type.NIL;

LispCons.prototype.car = function() {
//     print('[LispCons.car] calling this.isNil - this: ' + this + ' - _car: ' + this._car);
//     print('------');
//     print('' + this._tag);
//     print('------');
//     print('car: ' + this._car._tag);
//     print('------');
//     print('cdr: ' + this._cdr._tag);
//     print('------');
    //utils.pp(this);
    return this.isNil() ? this : this._car;
};

LispCons.prototype.cdr = function() {
//     print('[LispCons.cdr] calling this.isNil - this: ' + this + ' - _cdr: ' + this._cdr);
    return this.isNil() ? this : this._cdr;
};

LispCons.prototype.cadr = function() {
    return this.nth(1);
};

LispCons.prototype.caddr = function() {
    return this.nth(2);
};

LispCons.prototype.cadddr = function() {
    return this.nth(3);
};

LispCons.prototype.length = function() {
    return this._length;
};

LispCons.prototype.last = function() {
    var last,
	cons = this;
//    print('[LispCons.last] calling cons.isNil - cons: ' + cons + ' - _cdr: ' + cons._cdr);
    while (!cons.isNil()) {
	last = cons;
	cons = cons.cdr();
    }
    return last.car();
};

LispCons.prototype.map = function(fn) {
    var list = [],
	i = 0,
	cons = this;
    while (!cons.isNil()) {
	list.push(fn(cons.car(), i));
	cons = cons.cdr();
	++i;
    }
    return list.length > 0 ? type.mkList(list) : type.NIL;
};

LispCons.prototype.reduce = function(accum, fn) {
    var i = 0,
	n = this._length;
    while (i < n) {
	accum = fn(accum, this.nth(i++));
    }
    return accum;
};

LispCons.prototype.unlist = function() {
    return this.reduce([], function(acc, x){acc.push(x); return acc;});
};

LispCons.prototype.nth = function(n) {
    var i = 0,
	cons = this,
        e = cons.car();
    while (i <= n && !cons.isNil()) {
	e = cons.car();
	cons = cons.cdr();
	++i;
    }
    return e;
};

LispCons.prototype.nthcdr = function(n) {
    var e = this,
	i = 1;
    while (i <= n && !e.isNil()) {
	e = e.cdr();
	++i;
    }
    return e;
};

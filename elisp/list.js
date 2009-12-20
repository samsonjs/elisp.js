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
    return this.cdr().car();
};

LispCons.prototype.caddr = function() {
    return this.cdr().cdr().car();
};

LispCons.prototype.cadddr = function() {
    return this.cdr().cdr().cdr().car();
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
//    print('[LispCons.map] calling cons.isNil - cons: ' + cons + ' - _car: ' + cons._car + ' _cdr: ' + this._cdr);
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
    return this.reduce([], function(x){return x;});
};

LispCons.prototype.nth = function(n) {
    var i = 0,
	e,
	cons = this;
//    print('[LispCons.nth] calling cons.isNil - cons: ' + cons + ' - _cdr: ' + cons._cdr);
    while (i <= n && !cons.isNil()) {
	e = cons.car();
	cons = cons.cdr();
	++i;
    }
    return n > --i ? type.NIL : e;
};

LispCons.prototype.nthcdr = function(n) {
    var e = this.cdr(),
	i = 0;
//    print('[LispCons.nthcdr] calling e.isNil - e: ' + e + ' - _cdr: ' + e._cdr);
    while (i < n && !e.isNil()) {
	e = e.cdr();
	++i;
    }
    return n > i ? type.NIL : e;
};


// Make NIL act like a list ... there's got to be a better way

NIL.unlist = function(){return [];};

NIL._length = 0;
NIL.length = function(){return 0;};

NIL.reduce = function(accum){return accum;};

nilMethods = ['car', 'cdr', 'cadr', 'caddr', 'cadddr',
              'last', 'map', 'nthcdr', 'nth'];

var nilFn = function(){return NIL;};

for (var method in nilMethods) {
    NIL[method] = nilFn;
}
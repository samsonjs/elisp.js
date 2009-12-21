////
// Emacs Lisp implementation in JavaScript.
// 
// Copyright (c) 2009 Sami Samhuri - sami.samhuri@gmail.com
//
// Released under the terms of the MIT license.  See the included file
// LICENSE.

var tags = ['symbol', 'string', 'number', 'cons', 'lambda'];
exports.tags = tags;


// All types descend from this object
var LispObject = function(value) {
    this._tag = 'object';
    this._value = value;
};

LispObject.prototype.tag = function() {
    return this._tag;
};

LispObject.prototype.value = function() {
    return this._value;
};

LispObject.prototype.repr = function() {
    return '#<object value:' + this._value + '>';
};

LispObject.prototype.eq = function(other) {
    return other && this._tag == other._tag && this._value == other._value;
};

LispObject.prototype.isA = function(what) {
    return this._tag == what;
};

LispObject.prototype.isSymbol = function() {
    return this.isA('symbol');
};

LispObject.prototype.isString = function() {
    return this.isA('string');
};

LispObject.prototype.isNumber = function() {
    return this.isA('number');
};

LispObject.prototype.isCons = function() {
    return this.isA('cons');
};

LispObject.prototype.isLambda = function() {
    return this.isA('lambda');
};

LispObject.prototype.isNilSymbol = function() {
    return (this.isSymbol() && this.symbolName() == 'nil');
};

LispObject.prototype.isNilList = function() {
    return (this.isCons() && this.car().isNil() && this.cdr().isNil());
};

LispObject.prototype.isNil = function() {
    return this.isNilSymbol() || this.isEmptyList;
};

LispObject.prototype.isList = function() {
    return (this.isNil() || this.isCons());
};

LispObject.prototype.isAtom = function() {
    return !this.isCons();
};

exports.LispObject = LispObject;


// Symbols

var LispSymbol = function(value) {
    this.prototype = new LispObject().prototype;
    //this.prototype.constructor = this;
    this._tag = 'symbol';
    this._value = value;
};
LispSymbol.extend(LispObject);

LispSymbol.prototype.symbolName = function() {
    return this._value;
};

LispSymbol.prototype.repr = function() {
    // TODO escape symbol name for real reading
    return "'" + this._value;
};

exports.LispSymbol = LispSymbol;


// Strings

var LispString = function(value) {
    this._tag = 'string';
    this._value = value;
};
LispString.extend(LispObject);

LispString.prototype.repr = function() {
    // TODO escape string for real reading
    return '"' + this._value + '"';
};

exports.LispString = LispString;


// Numbers

var LispNumber = function(value) {
    this._tag = 'number';
    this._value = value;
};
LispNumber.extend(LispObject);

LispNumber.prototype.repr = function() {
    return '' + this._value;
};

exports.LispNumber = LispNumber;


// Constants

var T = new LispSymbol('t'),
    NIL = new LispSymbol('nil');
exports.T = T;
exports.NIL = NIL;

T.repr = function(){return 't';};
NIL.repr = function(){return 'nil';};


// Conses

var LispCons = function(car, cdr) {
    this._tag = 'cons';
    this._car = car || NIL;
    this._cdr = cdr || NIL;
    this._length = 1 + (cdr._length || 0);
};
LispCons.extend(LispObject);

LispCons.prototype.repr = function() {
    // TODO pretty print lists as a special case
    //      (only dotted pairs should look like this)
    return '(' + this._car.repr() + ' . ' + this._cdr.repr() + ')';
};

LispCons.prototype.eq = function(other) {
    return other.isCons() && this.car().eq(other.car()) &&
	this.cdr().eq(other.cdr());
};

exports.LispCons = LispCons;


// Lambdas 

var LispLambda = function(value) {
    this._tag = 'lambda';
    this._value = value;
};
LispLambda.extend(LispObject);

LispLambda.prototype.repr = function() {
    // TODO implement me
    return '(lambda (...) [body:' + this._value + '] )';
};

exports.LispLambda = LispLambda;



// JavaScript Array -> linked list
var mkList = function(exprs) {
    var list = NIL,
	i = exprs.length;
    while (--i >= 0) {
	list = new LispCons(exprs[i], list);
    }
    return list;
};
exports.mkList = mkList;



var tagToTypeMap = {
    symbol: LispSymbol,
    string: LispString,
    number: LispNumber,
    cons: LispCons,
    lambda: LispLambda
};

var construct = function(typeName, value) {
    baseObject = tagToTypeMap[typeName] || LispObject;
    return new baseObject(value);
};
exports.construct = construct;



// should probably be called guessType or LCDType
var inferType = function(exprs) {
    var type_name = 'number',
        initial = 0,
        i = exprs.length-1;
    while (i >= 0) {
	if (!exprs[i--].isNumber()) {
	    type_name = 'string';
	    initial = '';
	    break;
	}
    }
    return construct(type_name, initial);
};
exports.inferType = inferType;


// special forms

LispObject.prototype._isSpecialForm = function(name) {
    return (this.isCons() && this.car().isSymbol() && this.car().symbolName() == name);
};

LispObject.prototype.isQuote   = function(){return this._isSpecialForm('quote');};
LispObject.prototype.isDefvar  = function(){return this._isSpecialForm('defvar');};
LispObject.prototype.isDefun   = function(){return this._isSpecialForm('defun');};
LispObject.prototype.isSet     = function(){return this._isSpecialForm('set');};
LispObject.prototype.isSetq    = function(){return this._isSpecialForm('setq');};
LispObject.prototype.isCond    = function(){return this._isSpecialForm('cond');};
LispObject.prototype.isIf      = function(){return this._isSpecialForm('if');};

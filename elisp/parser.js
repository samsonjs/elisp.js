////
// Emacs Lisp implementation in JavaScript.
// 
// Copyright (c) 2009 Sami Samhuri - sami.samhuri@gmail.com
//
// Released under the terms of the MIT license.  See the included file
// LICENSE.

var utils = require('elisp/utils'),
    type = require('elisp/types');

var Parser = function(data) {
    this.data = data || '';
};

Parser.Error = function(name, message) {
    this.parserError = true;
    this.name = name;
    this.message = message;
};

Parser.Error.messages = {
    'eof': "no more input"
};

Parser.prototype.error = function(name) {
    throw(new Parser.Error(name, Parser.Error.messages[name]));
};

Parser.prototype.peek = function() {
    return this.data[this.pos];
};

Parser.prototype.consumeChar = function() {
    if (this.pos >= this.data.length) this.error('eof');
    return this.data[this.pos++];
};

Parser.prototype.consumeWhitespace = function() {
    var c;
    while ((c = this.peek()) && c.match(/[\s\n]/)) {
	this.consumeChar();
    }
};

Parser.prototype.rewind = function() {
    this.pos = 0;
};

Parser.prototype.rest = function() {
    return this.data.substring(this.pos);
};

Parser.prototype.moreInput = function() {
    return (this.pos < this.data.length);
};

Parser.prototype.parse = function(string) {
    if (string) this.data = string;
    this.rewind();
    var exprs = [];
    while (this.moreInput()) {
	try {
	    exprs.push(this.parseExpression());
	} catch (e) {
	    if (e.parserError && e.name == 'eof') {
		print("error: " + e.message);
		break;
	    }
	    else {
		throw(e);
	    }
	}
    }
    this.expressions = exprs;
//     print('');
//     Utils.pp(exprs);
//     print('');
    return type.mkList(exprs);
};

Parser.prototype.parseOne = function(string) {
    return this.parse(string).car();
};

Parser.prototype.parseUntil = function(regex, initial, next, consumeTerminator) {
    var c,
	token = initial,
	condition = function(c){ return c.match(regex) === null; };
    while ((c = this.peek()) && condition(c)) {
	token = next(token, this.consumeChar());
    }
    if (consumeTerminator && this.peek()) this.consumeChar();
    return token;
};

Parser.prototype.parseList = function() {
    var list = [],
	expr;
    // consume initial paren '('
    this.consumeChar();
    while ((expr = this.parseExpression()) && expr != ')') {
	list.push(expr);
    }
    return type.mkList(list);
};

Parser.prototype.parseCons = function() {
    var car, cdr, expr;

    // consume initial paren '('
    this.consumeChar();

    car = this.parseExpression();

    // ignore .
    this.parseExpression();

    cdr = this.parseExpression();
    return new type.LispCons(car, cdr);
};

Parser.prototype.parseString = function() {
    // consume initial quotation mark
    this.consumeChar();
    var self = this;
    return new type.LispString(this.parseUntil(/"/, '', function(s,c){
	if (c == '\\') {
	    c = self.consumeChar();
	}
	return s + c;
    }, true /* consume terminator */));
};

Parser.prototype.parseSymbol = function() {
    var symbol = this.parseUntil(/[\s()]/, '', function(t,c){return t + c;});
    return new type.LispSymbol(symbol);
};

// Probably easy to break
Parser.prototype.parseRegex = function() {
    // consume initial slash
    this.consumeChar();
    var self = this;
    return new RegExp(this.parseUntil(/\//, '', function(s,c){
	if (c == '\\') {
	    c = self.consumeChar();
	}
	return s + c;
    }, true /* consume terminator */));
};


// In Emacs Lisp a trailing . is allowed on integers.
// Valid kinds of numbers we parse here are:
//
//   * Integers of the form 42, +17, -300, 7300. (trailing .), +1. and
//     -1.
// 
//   * Floating point numbers of the form -4.5, 0.0, and +933825.3450133492
// 
//   * Exponential notation for floats, e.g. 1.5e2 (150.0) or 420e-1 (42.0)
//     (There is no trailing . allowed anywhere in exponent notation)
//
// Binary, octal, hex, or arbitrary radix integers not yet parsed.
//  (e.g. #x100 == #o400 == #b100000000 == #24rag
Parser.prototype.parseNumber = function() {
    var value = this.parseIntOrFloat(),
	exponentAllowed = value === parseInt(value, 10),
	exp;

    // now check for an exponent
    if (this.exponentAllowed && (this.peek() == 'e' || this.peek() == 'E')) {
	this.consumeChar();

	// Technically this is an error as a float is not allowed for exponents
	// but the regex is strict enough to keep us from trying to do that.
	exp = this.parseIntOrFloat();

	value *= Math.pow(10, exp);
    }

    return new type.LispNumber(value);
};

// Pack int and float parsing together for simplicity's sake.
Parser.prototype.parseIntOrFloat = function() {
    this.exponentAllowed = true;
    var sign = this.peek() == '-' || this.peek() == '+' ? this.consumeChar() : '+',
	value;

    // There may or may not be an integer part of the number.
    if (this.peek() != '.') {
	value = this.parseUntil(/[^\d]/, 0, function(n,c) {
            return n*10 + parseInt(c, 10);
        });
    }

    // if we see a . there might be a float to parse
    if (this.peek() == '.') {
	this.consumeChar();
	if (this.peek() && this.peek().match(/\d/)) {
	    var decimal = this.parseUntil(/[^\d]/, '', function(s,c) {return s + c;});
	    // value may be undefined at this point
	    value = parseFloat('' + (value||'') + '.' + decimal);
	}
	else {
	    this.exponentAllowed = false;
	}
    }

    // Value can technically be undefined but the regex prevents it from
    // ever being so.

    return sign == '-' ? -1*value : value;    
};

// These regexes matches all the inputs specified above parseNumber.
// They are paramount as they exclude some invalid cases the parser
// itself doesn't catch.  Sloppy, should be fixed in the future.
// The reason there are so many is that we can't match the end of
// string or some chars in the same regex.
//
// TODO: pick up Friedl and find a way to consolidate these.
Parser.prototype.lookingAtNumber = function() {
    var pos = this.pos,
	rest = this.rest(),
	match = rest.match(/^[+-]?\d+(\.\d*)?[)\s\n]/)              ||
	      rest.match(/^[+-]?\d+(\.\d*)?$/)                      ||
	      rest.match(/^[+-]?\d+(\.\d+)?([eE][+-]?\d+)?[)\s\n]/) ||
	      rest.match(/^[+-]?\d+(\.\d+)?([eE][+-]?\d+)?$/)       ||
	      rest.match(/^[+-]?(\d+)?\.\d+([eE][+-]?\d+)?[)\s\n]/) ||
	      rest.match(/^[+-]?(\d+)?\.\d+([eE][+-]?\d+)?$/);
    return (match !== null);
};

Parser.prototype.lookingAtCons = function() {
    // FIXME
    return false;

    var orig_pos = this.pos,
	_ = this.consumeChar(),
	__ = _ && this.peek() && this.parseExpression(),
	cdr = __ && this.peek() &&this.parseExpression();
    this.pos = orig_pos; // rewind, like it never happened.
//    print('[Parser.lookingAtCons]');
    return _ == ')' || cdr.isCons() && cdr.isSymbol() && cdr.symbolName() == '.';
};

Parser.prototype.parseExpression = function() {
    var value,
	c = this.peek();
    if (c == '(' && this.lookingAtCons()) {
	value = this.parseCons();
    }
    else if (c == '(') {
	value = this.parseList();
    }
    else if (c == ')') {
	return this.consumeChar();
    }
    else if (c == "'") {
	this.consumeChar();
	value = new type.LispCons(new type.LispSymbol('quote'), this.parseExpression());
    }
    else if (c == '"') {
	value = this.parseString();
    }
    else if (this.lookingAtNumber()) {
	value = this.parseNumber();
    }
    else if (c) {
	value = this.parseSymbol();
    }
    else {
	if (this.pos == this.data.length) {
	    print('[error] no more input. unterminated string or list? (continuing anyway)');
	}
	print('[warning] in Parser.parseExpression: unrecognized char "' + c + '"');
	print('this.pos = ' + this.pos);
	print('this.data.length = ' + this.data.length);
	print('this.rest = ' + this.rest());
    }
    this.consumeWhitespace();
    return value;
};

exports.Parser = Parser;

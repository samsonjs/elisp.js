////
// Emacs Lisp implementation in JavaScript.
// 
// Copyright (c) 2009 Sami Samhuri - sami.samhuri@gmail.com
//
// Released under the terms of the MIT license.  See the included file
// LICENSE.

/****************************************************************
 **** Parser ****************************************************
 ****************************************************************/

EL.Parser = function(data) {
    this.data = data || '';
};

EL.Parser.Error = function(name, message) {
    this.parserError = true;
    this.name = name;
    this.message = message;
};

EL.Parser.Error.messages = {
    'eof': "no more input"
};

EL.Parser.prototype.error = function(name) {
    throw(new EL.Parser.Error(name, EL.Parser.Error.messages[name]));
};

EL.Parser.prototype.peek = function() {
    return this.data[this.pos];
};

EL.Parser.prototype.consumeChar = function() {
    if (this.pos >= this.data.length) this.error('eof');
    return this.data[this.pos++];
};

EL.Parser.prototype.consumeWhitespace = function() {
    var c;
    while ((c = this.peek()) && c.match(/[\s\n]/)) {
	this.consumeChar();
    }
};

EL.Parser.prototype.rewind = function() {
    this.pos = 0;
};

EL.Parser.prototype.rest = function() {
    return this.data.substring(this.pos);
};

EL.Parser.prototype.moreInput = function() {
    return (this.pos < this.data.length);
};

EL.Parser.prototype.parse = function(string) {
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
//     EL.Util.pp(exprs);
//     print('');
    return exprs;
};

EL.Parser.prototype.parseOne = function(string) {
    return this.parse(string)[0];
};

EL.Parser.prototype.parseUntil = function(regex, initial, next, consumeTerminator) {
    var c,
	token = initial,
	condition = function(c){ return c.match(regex) == null; };
    while ((c = this.peek()) && condition(c)) {
	token = next(token, this.consumeChar());
    }
    if (consumeTerminator && this.peek()) this.consumeChar();
    return token;
};

EL.Parser.prototype.parseList = function() {
    var list = [],
	expr;
    // consume initial paren '('
    this.consumeChar();
    while ((expr = this.parseExpression()) && expr != ')') {
	list.push(expr);
    }
    return list;
};

EL.Parser.prototype.parseCons = function() {
    var cons = [],
	expr;
    // consume initial paren '('
    this.consumeChar();
    cons.push(this.parseExpression());
    // ignore .
    this.parseExpression();
    cons.push(this.parseExpression());
    return cons;
};

EL.Parser.prototype.parseString = function() {
    // consume initial quotation mark
    this.consumeChar();
    var self = this;
    return this.parseUntil(/"/, '', function(s,c){
	if (c == '\\') {
	    c = self.consumeChar();
	}
	return s + c;
    }, true /* consume terminator */);
};

EL.Parser.prototype.parseSymbol = function() {
    var symbol = this.parseUntil(/[\s()]/, '', function(t,c){return t + c;});
    return symbol;
};

// Probably easy to break
EL.Parser.prototype.parseRegex = function() {
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

EL.Parser.prototype.parseNumber = function() {
    var sign = this.peek() == '-' ? this.consumeChar() : '+',
	value = this.parseUntil(/[^\d]/, 0, function(n,c) {
            return n*10 + parseInt(c);
        });
    if (this.peek() == '.') {
	this.consumeChar();
	var decimal = this.parseUntil(/[^\d]/, '', function(s,c) {return s + c;});
	value = parseFloat('' + value + '.' + decimal);
    }
    return sign == '-' ? -1*value : value;
};

EL.Parser.prototype.lookingAtNumber = function() {
    var pos = this.pos,
	rest = this.rest(),
	match = rest.match(/^(-)?\d+(\.\d+)?[\s)\n]/) || rest.match(/^(-)?\d+(\.\d+)?$/);
    return (match != null);
};

EL.Parser.prototype.lookingAtCons = function() {
    var orig_pos = this.pos,
	_ = this.consumeChar(),
	_ = this.parseExpression(),
	cdr = this.parseExpression();
    this.pos = orig_pos; // rewind, like it never happened.
    return EL.typeOf(cdr) == 'array' && EL.isSymbol(cdr) && EL.val(cdr) == '.';
};

EL.Parser.prototype.parseExpression = function() {
    var value,
	c = this.peek();
    if (c == '(' && this.lookingAtCons()) {
	value = EL.consPair(this.parseCons());
    }
    else if (c == '(') {
	var list = this.parseList();
    	value = (list.length > 0) ? EL.list(list) : EL.nil;
    }
    else if (c == ')') {
	return this.consumeChar();
    }
    else if (c == "'") {
	this.consumeChar();
	value = EL.cons(EL.symbol('quote'), this.parseExpression());
    }
    else if (c == '"') {
	value = EL.string(this.parseString());
    }
    else if (this.lookingAtNumber()) {
	value = EL.number(this.parseNumber());
    }
    else if (c) {
	value = EL.symbol(this.parseSymbol());
    }
    else {
	if (this.pos == this.data.length) {
	    print('[error] no more input. unterminated string or list? (continuing anyway)');
	}
	print('[warning] in EL.Parser.parseExpression: unrecognized char "' + c + '"');
	print('this.pos = ' + this.pos);
	print('this.data.length = ' + this.data.length);
	print('this.rest = ' + this.rest());
    }
    this.consumeWhitespace();
    return value;
};

/****************************************************************
 ****************************************************************/


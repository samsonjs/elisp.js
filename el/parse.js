var EL = function(){};

/*
 * Emacs Lisp implementation in JavaScript.
 * 
 * Copyright (c) 2009 Sami Samhuri - sami.samhuri@gmail.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 */

//var EL = function(){};

/* EL.nil is implicitly undefined */
EL.t = true;

EL.Parser = function(data) {
    this.data = data;
};

EL.Parser.Error = function(name, message) {
    this.parserError = function() {return true;};
    this.name = name;
    this.message = message;
};

EL.Parser.Error.messages = {
    'eof': "no more input"
};

EL.Parser.prototype.error = function(name) {
    return new EL.Parser.Error(name, EL.Parser.Error.messages[name]);
};

EL.Parser.prototype.peek = function() {
    return this.data[this.pos];
};

EL.Parser.prototype.consumeChar = function() {
    if (this.pos >= this.data.length) throw(this.error('eof'));
    return this.data[this.pos++];
};

EL.Parser.prototype.consumeWhitespace = function() {
    var c;
    while ((c = this.peek()) && c.match(/[\s\n]/)) {	
	this.consumeChar();
    }
};

EL.Parser.prototype.rest = function() {
    return this.data.substring(this.pos, this.data.length);
};

EL.Parser.prototype.moreInput = function() {
    return (this.pos < this.data.length);
};

EL.Parser.prototype.parse = function() {
    this.pos = 0;
    var exprs = [];
    while (this.moreInput()) {
	try {
	    exprs.push(this.parseExpression());
	} catch (e) {
	    if (e.parserError && e.parserError() && e.name == 'eof') {
		print("error: " + e.message);
		break;
	    }
	    else {
		throw(e);
	    }
	}
    }
    this.expressions = exprs;
    this.prettyPrint(exprs);
    return exprs;
};

EL.Parser.prototype.parseUntil = function(regex, initial, next) {
    var c,
	token = initial,
	condition = function(c){ return c.match(regex) == null; };
    while ((c = this.peek()) && condition(c)) {
	token = next(token, this.consumeChar());
    }
    if (this.peek()) this.consumeChar(); // consume terminator
    return token;
};

EL.Parser.prototype.parseSexp = function() {
    var sexp = [],
	token;
    // consume initial paren '('
    this.consumeChar();
    while ((expr = this.parseExpression()) && expr != ')') {
	sexp.push(expr);
    }
    return sexp;
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
    });
};

EL.Parser.prototype.parseSymbol = function() {
    var symbol = this.parseUntil(/[\s()]/, '', function(t,c){return t + c;});
    return symbol;
};

// Only integers
EL.Parser.prototype.parseNumber = function() {
   return this.parseUntil(/[^\d]/, 0, function(n,c){return n*10 + parseInt(c);});
    var c,
	num = 0;
    while ((c = this.peek()) && c.match(/\d/)) {
	num *= 10;
	num += parseInt(this.consumeChar());
    }
    return num;
};

EL.Parser.prototype.lookingAtNumber = function() {
    var pos = this.pos,
	rest = this.rest(),
	match = rest.match(/^\d+\b/) || rest.match(/^\d+$/);
    return (match != null);
};

EL.Parser.prototype.parseExpression = function() {
    var value,
	c = this.peek();
    if (c == '(') {
	print("SEXP(");
	value = ['sexp', this.parseSexp()];
    }
    else if (c == ')') {
	print(")");
	return this.consumeChar();
    }
    else if (c == "'") {
	print("QUOTE");
	this.consumeChar();
	var expr = this.parseExpression(),
	    quote = [['symbol', 'quote']];
	quote.push(expr);
	value = ['sexp', quote];
    }
    else if (c == '"') {
	print("STRING");
	value = ['string', this.parseString()];
    }
    else if (this.lookingAtNumber()) {
	print("NUMBER");
	value = ['number', this.parseNumber()];
    }
    else if (c) {
	print("SYMBOL");
	value = ['symbol', this.parseSymbol()];
    }
    this.consumeWhitespace();
    return value;
};

EL.Parser.prototype.prettyPrint = function(x, indent, key) {
    var typeOf = function(value) {
	var s = typeof value;
	if (s === 'object') {
            if (value) {
		if (typeof value.length === 'number' &&
                    !(value.propertyIsEnumerable('length')) &&
                    typeof value.splice === 'function') {
                    s = 'array';
		}
            } else {
		s = 'null';
            }
	}
	return s;
    };
    
    if (indent === undefined) {
	indent = 0;
    }
    
    var space = "";
    for (var j = 0; j < indent; j++) {
	space += "    ";
    }
	
    switch (typeOf(x)) {
    case 'object':
	if (key) {
	    print(space + key + ': {');	    
	}
	else {
	    print(space + '{');
	}
	for (var a in x) {
	    this.prettyPrint(x[a], 1+indent, a);
	}
	print(space + "},");
	break;

    case 'string':
	if (key) {
	    print(space + key + ': "' + x + '",');	    
	}
	else {
	    print(space + '"' + x + '",');
	}
	break;

    case 'array':
	if (key) {
	    print(space + key + ': [');
	}
	else {
	    print(space + '[');
	}
	var n = x.length, i = 0;
	while (i < n) {
	    this.prettyPrint(x[i++], 1+indent);
	}
	print(space + '],');
	break;

    case 'null':
	if (key) {
	    print(space + key + ': (null),');
	}
	else {
	    print(space + '(null),');
	}
	break;

    default:
	if (key) {
	    print(space + key + ": " + x + ',');
	}
	else {
	    print(space + x + ',');
	}
	break;
    }
};

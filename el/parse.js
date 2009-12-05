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

EL.parse = function(input) {
    var parser = new EL.Parser(input);
    parser.parse();
};

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
    print('');
    this.prettyPrint(exprs);
    print('');
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

EL.Parser.prototype.lookingAtCons = function() {
    var orig_pos = this.pos,
	_ = this.consumeChar(),
	_ = this.parseExpression(),
	cdr = this.parseExpression();
    this.pos = orig_pos; // rewind, like it never happened.
    return cdr != null && cdr[0] == 'symbol' && cdr[1] == '.';
};

EL.Parser.prototype.parseExpression = function() {
    var value,
	c = this.peek();
    if (c == '(' && this.lookingAtCons()) {
// 	print("CONS(");
	value = ['cons', this.parseCons()];
    }
    else if (c == '(') {
// 	print("LIST(");
	var list = this.parseList();
	value = (list.length > 0) ? ['list', list] : ['symbol', 'nil'];
    }
    else if (c == ')') {
// 	print(")");
	return this.consumeChar();
    }
    else if (c == "'") {
// 	print("QUOTE");
	this.consumeChar();
	value = ['list', [['symbol', 'quote']]];
	value[1].push(this.parseExpression());
    }
    else if (c == '"') {
// 	print("STRING");
	value = ['string', this.parseString()];
    }
    else if (this.lookingAtNumber()) {
// 	print("NUMBER");
	value = ['number', this.parseNumber()];
    }
    else if (c) {
// 	print("SYMBOL");
	value = ['symbol', this.parseSymbol()];
    }
    this.consumeWhitespace();
    return value;
};

EL.Parser.prototype.prettyPrint = function(x, indent, key, noprint) {
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
   
    /* string to print at the end, the only way to print 2 strings in
     * succession without a newline is to buffer them
     */
    var buffer = "";
    var printB = function(s, newline) {
	buffer += s;
	if (newline) buffer += "\n";
    };
    var dumpBuffer = function(b) {
	if (b === undefined) b = buffer;
	if (buffer.length <= 72) {
	    print(buffer);    
	}
	else {
	    var split = 72;
	    var c;
	    while ((c = b[split]) && c.match(/[a-zA-Z0-9"'\[\]_-]/)) --split;
	    print(b.substring(0, split));
	    var next_chunk = b.substring(split, b.length);
	    if (next_chunk) dumpBuffer(next_chunk);
	}
	buffer = "";
    };

    var space = "";
//     for (var j = 0; j < indent; j++) {
// 	space += "    ";
//     }
	
    switch (typeOf(x)) {
    case 'object':
	if (key) {
	    printB(space + key + ': {');
	}
	else {
	    printB(space + '{');
	}
	for (var a in x) {
	    printB(this.prettyPrint(x[a], 1+indent, a, true));
	}
	printB(space + "}");
	break;

    case 'string':
	if (key) {
	    printB(space + key + ': "' + x + '"');
	}
	else {
	    printB(space + '"' + x + '"');
	}
	return buffer;
	break;

    case 'array':
	if (key) {
	    printB(space + key + ': [');
	}
	else {
	    printB(space + '[');
	}
	var n = x.length, i = 0;
	while (i < n) {
	    if (i > 0) printB(', ');
	    printB(this.prettyPrint(x[i++], 1+indent, undefined, true));
	}
	printB(space + ']');
	break;

    case 'null':
	if (key) {
	    printB(space + key + ': (null)');
	}
	else {
	    printB(space + '(null)');
	}
	return buffer;
	break;

    default:
	if (key) {
	    printB(space + key + ": " + x);
	}
	else {
	    printB(space + x);
	}
	return buffer;
	break;
    }
    var s = buffer;
    if (!noprint) dumpBuffer();
    return s;
};

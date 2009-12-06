var spidermonkeykludge = 0;
// spidermonkey doesn't like a C-style comment at the beginning

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


// can't live without the basics

Array.prototype.each = function(fn) {
    var i = 0,
	n = this.length;
    while (i < n) {
        fn(this[i], i);
	++i;
    }
};


// our namespace
var EL = function(){};

	
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

EL.Parser.prototype.parseNumber = function() {
    var value = this.parseUntil(/[^\d]/, 0, function(n,c) {
            return n*10 + parseInt(c);
        });
    if (this.peek() == '.') {
	this.consumeChar();
	var decimal = this.parseUntil(/[^\d]/, '', function(s,c) {return s + c;});
	value = parseFloat('' + value + '.' + decimal);
    }
    return value;
};

EL.Parser.prototype.lookingAtNumber = function() {
    var pos = this.pos,
	rest = this.rest(),
	match = rest.match(/^\d+(\.\d+)?[\s)\n]/) || rest.match(/^\d+(\.\d+)?$/);
    return (match != null);
};

EL.Parser.prototype.lookingAtCons = function() {
    var orig_pos = this.pos,
	_ = this.consumeChar(),
	_ = this.parseExpression(),
	cdr = this.parseExpression();
    this.pos = orig_pos; // rewind, like it never happened.
    return EL.typeOf(cdr) == 'array' && EL.tag(cdr) == 'symbol' && EL.val(cdr) == '.';
};

EL.Parser.prototype.parseExpression = function() {
    var value,
	c = this.peek();
    if (c == '(' && this.lookingAtCons()) {
	value = ['cons', this.parseCons()];
    }
    else if (c == '(') {
	var list = this.parseList();
    	value = (list.length > 0) ? ['list', list] : EL.nil;
    }
    else if (c == ')') {
	return this.consumeChar();
    }
    else if (c == "'") {
	this.consumeChar();
	value = ['list', [['symbol', 'quote']]];
	value[1].push(this.parseExpression());
    }
    else if (c == '"') {
	value = ['string', this.parseString()];
    }
    else if (this.lookingAtNumber()) {
	value = ['number', this.parseNumber()];
    }
    else if (c) {
	value = ['symbol', this.parseSymbol()];
    }
    this.consumeWhitespace();
    return value;
};

/****************************************************************
 ****************************************************************/


/****************************************************************
 **** Symbol Table **********************************************
 ****************************************************************/

EL.SymbolTable = function(bindings) {
    this.symbols = [[]];
    this.level = 0;
    if (bindings) this.define(bindings);
};

EL.SymbolTable.prototype.lookupWithScope = function(name) {
    var i = this.level,
	symbol;
    while (i >= 0) {
	value = this.symbols[i][name];
        if (value) {
            return [i, value];
        }
	--i;
    }
    return null;
};

EL.SymbolTable.prototype.lookup = function(name) {
    var pair = this.lookupWithScope(name);
    return pair && pair[1];
};

// store the given symbol/value pair in the symbol table at the current level.
EL.SymbolTable.prototype.define = function(name, value) {
    if (value === undefined && EL.typeOf(name) == 'array') {	
	var bindings = name,
	    i = 0,
	    n = bindings.length,
	    scope = this.symbols[this.level];
	while (i < n) {
	    var name = bindings[i][0],
	        value = bindings[i][1];
// 	    print('name: ' + name);
// 	    print('value: ' + value);
	    scope[name] = value;
	    ++i;
	}
    }
    else {
	this.symbols[this.level][name] = value;
    }
};

EL.SymbolTable.prototype.pushScope = function(bindings) {
//     print('>>> pushing scope <<<');
//     print('>>> level going from ' + this.level + ' to ' + (1+this.level));
//     print(bindings);
    this.symbols[++this.level] = [];
    if (bindings) this.define(bindings);
};

EL.SymbolTable.prototype.popScope = function() {
    --this.level;
};

EL.SymbolTable.prototype.set = function(name, value) {
    var pair = this.lookupWithScope(name),
	level = pair[0];
    this.symbols[level][name] = value;
};

/****************************************************************
 ****************************************************************/



/****************************************************************
 **** Primitives ************************************************
 ****************************************************************/

EL.PrimitiveVariables = [
    ['t', {
        type: 'variable',
	value: true,
	docstring: "true"
    }],
    ['nil', {
        type: 'variable',
	value: null,
	docstring: "nil"
    }]
];

// this is bound to the EL.Evaluator object
EL.PrimitiveFunctions = [
    ['+', {
	 type:      'primitive',
	 name:      '+',
	 params:    [],
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
	 params:    [],
	 body:      function() {
	     return EL.Util.foldr(function(diff, n) {
		     return ['number', EL.val(diff) - EL.val(n)];
	         }, ['number', 0], EL.Util.shallowCopy(arguments));
	 },
	 docstring: "subtract two numbers"
    }],
    ['*', {
	 type:      'primitive',
	 name:      '*',
	 params:    [],
	 body:      function() {
	     return EL.Util.reduce(function(prod, n) {
		     return ['number', EL.val(prod) * EL.val(n)];
	         }, ['number', 1], EL.Util.shallowCopy(arguments));
	 },
	 docstring: "multiply two numbers"
    }],
    ['/', {
	 type:      'primitive',
	 name:      '/',
	 params:    [],
	 body:      function() {
	     return EL.Util.foldr(function(quot, n) {
		     return ['number', EL.val(quot) / EL.val(n)];
	         }, ['number', 1], EL.Util.shallowCopy(arguments));
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
	     else if (tag == 'function') {
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


/****************************************************************
 **** Evaluation ************************************************
 ****************************************************************/

EL.Evaluator = function(exprs) {
    this.expressions = exprs;
    this.variables = new EL.SymbolTable(EL.PrimitiveVariables);
    this.functions = new EL.SymbolTable(EL.PrimitiveFunctions);
};

EL.Evaluator.Error = function(name, message, expr) {
    this.evalError = true;
    this.name = name;
    this.message = message;
    this.expression = expr;
};

EL.Evaluator.Error.messages = {
    'not-expr': "not an expression",
    'undefined-func': "undefined function",
    'undefined-var': "variable not defined"
};

EL.Evaluator.prototype.error = function(name, expr) {
    throw(new EL.Evaluator.Error(name, EL.Evaluator.Error.messages[name], expr));
};

EL.Evaluator.prototype.evalExpressions = function(expressions) {
    var exprs = expressions || this.expressions,
	i = 0,
	n = exprs.length,
	result;
    while (i < n) {
	try {
	    result = this.eval(exprs[i++]);	    
	} catch (e) {
	    if (e.evalError) {
		print('[error] ' + e.message);
		if (e.expression) {
		    print("got: " + e.expression);
		}
		result = EL.nil;
		break;
	    }
	    else {
		throw(e);
	    }
	}
    }
//     EL.Util.pp(result);
    return result;
};

EL.Evaluator.prototype.lookupVar = function(symbol) {
    return this.variables.lookup(symbol);
};

EL.Evaluator.prototype.lookupFunc = function(symbol) {
    return this.functions.lookup(symbol);
};

EL.Evaluator.prototype.defineVar = function(symbol, value, docstring) {
    this.variables.define(symbol, {
	type: 'variable',
	value: value,
	docstring: docstring || "(undocumented)"
    });
};

EL.Evaluator.prototype.setVar = function(symbol, value) {
    var valueObject = this.lookupVar(symbol);
    valueObject.value = value;
    this.variables.set(symbol, valueObject);
};

EL.Evaluator.prototype.defineFunc = function(symbol, params, body, docstring) {
    this.functions.define(symbol, {
	type: 'function',
	name: symbol,
	params: EL.val(params),
	body: body,
	docstring: docstring || "(undocumented)"
    });
};

EL.Evaluator.prototype.call = function(func, args) {
    var result;
    if (func.type === 'primitive') {
	result = func.body.apply(this, args);
    }
    else {
	this.functions.pushScope();
	this.variables.pushScope(func.params.map(function(e, i){
		var name = EL.symbolName(e),
		    value = {
			type: 'variable',
			value: this.eval(args[i])
		    };
                return [name, value];
	    }));
	result = this.evalExpressions(func.body);
	this.functions.popScope();
	this.variables.popScope();
    }
    return result;
};

EL.Evaluator.prototype.eval = function(expr) {
    var result, x,
	tag = EL.tag(expr);
    if (EL.isAtom(expr)) {
	return expr;
    }
    else if (tag == 'symbol') {
	var name = EL.val(expr);
	x = this.lookupVar(name);
	if (x == null) this.error('undefined-var', name);
	result = x.value;
    }
//     else if (expr[0] == 'cons') {
// 	var cons = expr[1];
// 	result = [this.eval(cons[0]), this.eval(cons[1])];
//     }

    ///////////////////
    // special forms //
    ///////////////////
    // (many could be in lisp when there are macros) //

    else if (EL.isQuote(expr)) {
	result = EL.val(EL.val(expr));
    }
    else if (EL.isDefVar(expr)) {
	var val = EL.val(expr),
	    name = EL.symbolName(val[1]),
	    value = this.eval(val[2]),
	    docstring = val[3];
	// TODO check for re-definitions
	this.defineVar(name, value, docstring);
	result = EL.nil;
    }
    else if (EL.isDefFunc(expr)) {
	var val = EL.val(expr),
	    name = EL.symbolName(val[1]),
	    params = val[2],
	    docstring = EL.isString(val[3]) && val[3],
	    body = val.slice(docstring ? 4 : 3);
	// TODO check for re-definitions
	this.defineFunc(name, params, body, docstring);
	result = EL.nil;
    }
    else if (EL.isSet(expr)) {
	var val = EL.val(expr),
	    name = EL.symbolName(val[1]),
	    value = this.eval(val[2]);
	result = this.setVar(name, value);
    }
    else if (EL.isSetq(expr)) {
	var val = EL.val(expr),
	    i = 0;
	while (EL.isSymbol(val[i+1])) {
	    var name = EL.symbolName(val[i+1]),
                value = this.eval(val[i+2]);
	    result = this.setVar(name, value);
	    i += 2;
        }
    }
    else if (EL.isIf(expr)) {
	var val = EL.val(expr),
	    condition = this.eval(val[1]),
	    trueBlock = val[2],
	    nilBlock = val[3];
	result = this.primitiveIf(condition, trueBlock, nilBlock);
    }

    // function application
    else if (EL.tag(expr) == 'list') {
	var list = expr[1],
	    car = list[0],
	    cdr = list.slice(1),
	    func, args;
	while (!(EL.isFunction(car) || EL.isSymbol(car))) {
	    car = this.eval(car);
	}
	if ((func = this.lookupFunc(car[1]))) {
	    var self = this;
	    args = cdr.map(function(e){return self.eval(e);});
	    result = this.call(func, args);
	}
	else {
	    this.error('undefined-func', car);
	}
    }
    else {
	this.error('not-expr', expr);
    }
    return result;
};


/****************************************************************
 ****************************************************************/


/****************************************************************
 **** Lisp Support **********************************************
 ****************************************************************/

EL.nil = ['symbol', 'nil'];
EL.t = ['symbol', 't'];

EL.typeOf = function(value) {
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

EL.assert = function(condition, message) {
    if (!condition()) {
        throw("assertion failed: " + condition + " (" + message + ")");
    }
};

EL.tag = function(expr) {
    EL.assert(function() { var f='tag'; return EL.typeOf(expr) == 'array'; }, expr);
    return expr[0];
};

EL.val = function(expr) {
    EL.assert(function() { var f='val'; return EL.typeOf(expr) == 'array'; }, expr);
    return expr[1];
};

EL.symbolName = function(symbol) {
//    EL.Util.pp(symbol);
    EL.assert(function(){ var f='symbolName'; return EL.isSymbol(symbol); }, symbol);
    return symbol[1];
};

EL.isSymbol = function(expr) {
    return (EL.tag(expr) == 'symbol');
};

EL.isString = function(expr) {
    return (EL.tag(expr) == 'string');
};

EL.isList = function(expr) {
    return (EL.tag(expr) == 'list');
};

EL.isFunction = function(expr) {
    return (EL.tag(expr) == 'function');
};

EL.isAtom = function(expr) {
    return EL.tag(expr) == 'string' || EL.tag(expr) == 'number';
};

EL.inferType = function(exprs) {
    var type = 'number',
        initial = 0,
        i = exprs.length-1;
    while(i >= 0) {
	if (EL.isString(exprs[i--])) {
	    type = 'string';
	    initial = '';
	    break;
	}
    }
    return [type, initial];
};

EL.isSpecialForm = function(name, expr) {
    var tag = EL.tag(expr),
	car = EL.typeOf(expr) == 'array' && EL.val(expr)[0],
	thisName = car && EL.symbolName(car);
    return (tag == 'list' && thisName == name);
};
EL.isQuote   = function(expr){return EL.isSpecialForm('quote', expr);};
EL.isDefVar  = function(expr){return EL.isSpecialForm('defvar', expr);};
EL.isDefFunc = function(expr){return EL.isSpecialForm('defun', expr);};
EL.isSet     = function(expr){return EL.isSpecialForm('set', expr);};
EL.isSetq    = function(expr){return EL.isSpecialForm('setq', expr);};
EL.isCond    = function(expr){return EL.isSpecialForm('cond', expr);};
EL.isIf      = function(expr){return EL.isSpecialForm('if', expr);};

EL.eval = function(exprs) {
    var e = new EL.Evaluator();
    return e.evalExpressions(exprs);
};

EL.parse = function(string) {
    var p = new EL.Parser();
    return p.parse(string);
};

EL.parseOne = function(string) {
    return EL.parse(string)[0];
};
EL.read = EL.parseOne;

EL.rep = function(string) {
    EL.print(EL.eval(EL.read(string)));
};

EL.repl = function() {
    var p = new EL.Parser(),
	e = new EL.Evaluator();
    while (true) {
	print("elisp> ");
	EL.print(e.eval(p.parseOne(readline())));
    }
};


/****************************************************************
 ****************************************************************/


/****************************************************************
 **** Utilities *************************************************
 ****************************************************************/

EL.Util = function(){};

// aka foldl
EL.Util.reduce = function(fn, accum, list) {
    var i = 0,
	n = list.length;
    while (i < n) {
	accum = fn(accum, list[i++]);
    }
    return accum;
};

EL.Util.foldr = function(fn, end, list) {
    var i = list.length-1;
    while (i >= 0) {
	end = fn(list[i--], end);
    }
    return end;
};

EL.Util.shallowCopy = function(list) {
    var i = 0,
	n = list.length,
	result = [];
    while (i < n) {
	result.push(list[i++]);
    }
    return result;
};


// i'm sorry
EL.Util.pp = function(x, indent, key, noprint) {
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
	    var next_chunk = b.substring(split);
	    if (next_chunk) dumpBuffer(next_chunk);
	}
	buffer = "";
    };

    var space = "";
//     for (var j = 0; j < indent; j++) {
// 	space += "    ";
//     }
	
    switch (EL.typeOf(x)) {
    case 'object':
	if (key) {
	    printB(space + key + ': {');
	}
	else {
	    printB(space + '{');
	}
	for (var a in x) {
	    printB(EL.Util.pp(x[a], 1+indent, a, true));
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

    case 'array':
	// nil special case
        if (x.length == 2 && EL.tag(x) == 'symbol' && EL.val(x) == 'nil') {
            return EL.Util.pp(null, indent, key);
        }

	if (key) {
	    printB(space + key + ': [');
	}
	else {
	    printB(space + '[');
	}
	var n = x.length, i = 0;
	while (i < n) {
	    if (i > 0) printB(', ');
	    printB(EL.Util.pp(x[i++], 1+indent, undefined, true));
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

    default:
	if (key) {
	    printB(space + key + ": " + x);
	}
	else {
	    printB(space + x);
	}
	return buffer;
    }
    var s = buffer;
    if (!noprint) dumpBuffer();
    return s;
};
EL.print = EL.Util.pp;

// spidermonkey doesn't like a C-style comment at the end either
spidermonkeykludge = 1;

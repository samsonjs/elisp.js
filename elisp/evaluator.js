////
// Emacs Lisp implementation in JavaScript.
// 
// Copyright (c) 2009 Sami Samhuri - sami.samhuri@gmail.com
//
// Released under the terms of the MIT license.  See the included file
// LICENSE.

var type = require('elisp/types'),
    utils = require('elisp/utils'),
    primitives = require('elisp/primitives'),
    symtab = require('elisp/symtab');

Evaluator = function(exprs) {
    this.expressions = exprs;
    this.variables = new symtab.SymbolTable(primitives.PrimitiveVariables);
    this.functions = new symtab.SymbolTable(primitives.PrimitiveFunctions);
};

Evaluator.Error = function(name, message, expr) {
    this.evalError = true;
    this.name = name;
    this.message = message;
    this.expression = utils.pp(expr, true);
};

Evaluator.Error.messages = {
    'not-expr': "not an expression",
    'undefined-func': "undefined function",
    'undefined-var': "variable not defined"
};

Evaluator.prototype.error = function(name, expr) {
    throw(new Evaluator.Error(name, Evaluator.Error.messages[name], expr));
};

Evaluator.prototype.evalExpressions = function(expressions) {
    // TODO this should use lisp's map or reduce for (some) efficiency
    var exprs = expressions || this.expressions,
	i = 0,
	n = exprs.length(),
	result, expr;
    while (i < n) {
	try {
	    expr = exprs.nth(i++);
	    result = this.eval(expr);
	} catch (e) {
	    if (e.evalError) {
		print('[error] ' + e.message);
		if (e.expression) {
		    print("got: " + e.expression);
		}
		result = type.NIL;
		break;
	    }
	    else {
		throw(e);
	    }
	}
    }
//     Utils.pp(result);
    return result;
};

Evaluator.prototype.lookupVar = function(symbol) {
    return this.variables.lookup(symbol);
};

Evaluator.prototype.lookupFunc = function(symbol) {
    return this.functions.lookup(symbol);
};

Evaluator.prototype.apply = function(func, args) {
    var result;
    if (func.type === 'primitive') {
// 	print('APPLY: ');
// 	print(func);
// 	print('WITH: ');
// 	print(args);
// 	print('------');
	result = func.body.apply(this, args);
    }
    else {
	this.functions.pushScope();
	this.variables.pushScope(func.params.map(function(e, i){
		var name = e.symbolName(),
		    value = {
			type: 'variable',
			value: this.eval(args[i])
		    };
                return [name, value];
	    }));
	result = func.body.map(function(e) {return this.eval(e); }).last();
	this.functions.popScope();
	this.variables.popScope();
    }
    return result;
};

Evaluator.prototype.eval = function(expr) {
//     print('[Evaluator.eval]');
    //utils.pp(expr);
    var result, x,
	tag = expr.tag();
    if (expr.isAtom()) {
	result = expr;
    }
    else if (expr.isSymbol()) {
	var name = expr.symbolName();
	x = this.lookupVar(name);
	if (!x) this.error('undefined-var', name);
	result = x.value;
    }

    ///////////////////
    // special forms //
    ///////////////////
    // (many could be in lisp when there are macros) //

    else if (expr.isQuote()) {
	result = expr.cdr();
    }
    else if (expr.isDefvar()) {
	var name = expr.cadr().symbolName(),   // 2nd param
	    value = this.eval(expr.caddr()),   // 3rd param
	    docstring = expr.cadddr();         // 4th param
	// TODO check for re-definitions
	this.defineVar(name, value, docstring);
	result = type.NIL;
    }
    else if (expr.isDefun()) {
	var name = expr.nth(1).symbolName(),
	    params = expr.nth(2),
	    d = expr.nth(3),
	    docstring = d.isString() && d,
	    body = expr.nthcdr(docstring ? 3 : 2);
	this.defineFunc(name, params, body, docstring);
	result = type.NIL;
    }
    else if (expr.isSet()) {
	var name = expr.car().symbolName(),
	    value = this.eval(expr.cdr());
	this.setVar(name, value);
	result = value;
    }
    else if (expr.isSetq()) {
	var i = 1,
            n = expr.length(),
	    e;
	while (i < n && (e=expr.nth(i)).isSymbol()) {
	    var name = e.symbolName(),
                value = this.eval(expr.nth(i+1));
	    this.setVar(name, value, true);
	    result = value;
	    i += 2;
        }
    }
    else if (expr.isIf()) {
	var condition = this.eval(expr.nth(1)),
	    trueBlock = expr.nth(2),
	    nilBlock = expr.nth(3);
	result = this.doIf(condition, trueBlock, nilBlock);
    }
    else if (expr.isCond()) {
	// TODO implement me
	result = type.NIL;
// 	var list = expr.nth(1),
// 	    condition = list.car(),
// 	    body = list.cdr(),
// 	    rest = val.slice(2);
// 	result = this.doCond(exprs);
    }

    // function application
    else if (expr.isCons()) {
	var name = expr.car(),
	    rest = expr.cdr(),
	    func, args;
	while (!name.isSymbol()) {
	    name = this.eval(name);
	}
	if ((func = this.lookupFunc(name.symbolName()))) {
	    var self = this;
	    args = rest.reduce([], function(a,e){
		a.push(self.eval(e));
		return a;
	    });
	    result = this.apply(func, args);
	}
	else {
	    this.error('undefined-func', name);
	}
    }
    else {
	this.error('not-expr', expr);
    }
//     print('RESULT: ' + result);
    return result;
};


Evaluator.prototype.defineVar = function(symbol, value, docstring) {
    this.variables.define(symbol, {
	type: 'variable',
	value: value,
	docstring: docstring || "(undocumented)"
    });
};

Evaluator.prototype.setVar = function(symbol, value, create) {
    var valueObject = this.lookupVar(symbol);
    if (!valueObject) {
	if (create) {
	    this.defineVar(symbol, type.NIL);
	    valueObject = this.lookupVar(symbol);
	}
	else {
	    this.error('undefined-var', symbol);
	}
    }
    valueObject.value = value;
    this.variables.set(symbol, valueObject);
};

Evaluator.prototype.defineFunc = function(symbol, params, body, docstring) {
    this.functions.define(symbol, {
	type: 'lambda',
	name: symbol,
	params: params,
	body: body,
	docstring: docstring || "(undocumented)"
    });
};

Evaluator.prototype.doIf = function(condition, trueBlock, nilBlock) {
    return condition.isNil() ? this.eval(nilBlock) : this.eval(trueBlock);
};

Evaluator.prototype.doCond = function(exprs) {
    print('----- COND (doCond) -----');
    utils.pp(exprs);
    return type.NIL;
};

exports.Evaluator = Evaluator;
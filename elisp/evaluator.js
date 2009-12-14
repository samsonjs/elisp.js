////
// Emacs Lisp implementation in JavaScript.
// 
// Copyright (c) 2009 Sami Samhuri - sami.samhuri@gmail.com
//
// Released under the terms of the MIT license.  See the included file
// LICENSE.


elisp.Evaluator = function(exprs) {
    this.expressions = exprs;
    this.variables = new elisp.SymbolTable(elisp.PrimitiveVariables);
    this.functions = new elisp.SymbolTable(elisp.PrimitiveFunctions);
};

elisp.Evaluator.Error = function(name, message, expr) {
    this.evalError = true;
    this.name = name;
    this.message = message;
    this.expression = expr;
};

elisp.Evaluator.Error.messages = {
    'not-expr': "not an expression",
    'undefined-func': "undefined function",
    'undefined-var': "variable not defined"
};

elisp.Evaluator.prototype.error = function(name, expr) {
    throw(new elisp.Evaluator.Error(name, elisp.Evaluator.Error.messages[name], expr));
};

elisp.Evaluator.prototype.evalExpressions = function(expressions) {
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
		result = elisp.nil;
		break;
	    }
	    else {
		throw(e);
	    }
	}
    }
//     elisp.Util.pp(result);
    return result;
};

elisp.Evaluator.prototype.lookupVar = function(symbol) {
    return this.variables.lookup(symbol);
};

elisp.Evaluator.prototype.lookupFunc = function(symbol) {
    return this.functions.lookup(symbol);
};

elisp.Evaluator.prototype.apply = function(func, args) {
    var result;
    if (func.type === 'primitive') {
// 	print('APPLY: ');
// 	elisp.print(func);
// 	print('WITH: ');
// 	elisp.print(args);
// 	print('------');
	result = func.body.apply(this, args);
    }
    else {
	this.functions.pushScope();
	this.variables.pushScope(elisp.listMap(func.params, function(e, i){
		var name = elisp.symbolName(e),
		    value = {
			type: 'variable',
			value: this.eval(args[i])
		    };
                return [name, value];
	    }));
	result = elisp.listLast(elisp.listMap(func.body,
	                     function(e) {return this.eval(e); }));
	this.functions.popScope();
	this.variables.popScope();
    }
    return result;
};

elisp.Evaluator.prototype.eval = function(expr) {
//     print("EVAL: " + elisp.typeOf(expr));
//     elisp.print(expr);
    var result, x,
	tag = elisp.tag(expr);
    if (elisp.isAtom(expr)) {
	result = expr;
    }
    else if (elisp.isSymbol(expr)) {
	var name = elisp.val(expr);
	x = this.lookupVar(name);
	if (x == null) this.error('undefined-var', name);
	result = x.value;
    }

    ///////////////////
    // special forms //
    ///////////////////
    // (many could be in lisp when there are macros) //

    else if (elisp.isQuote(expr)) {
	result = elisp.cdr(expr);
    }
    else if (elisp.isDefVar(expr)) {
	var name = elisp.symbolName(elisp.cadr(expr)), // 2nd param
	    value = this.eval(elisp.caddr(expr)),   // 3rd param
	    docstring = elisp.cadddr(expr);         // 4th param
	// TODO check for re-definitions
	this.defineVar(name, value, docstring);
	result = elisp.nil;
    }
    else if (elisp.isDefFunc(expr)) {
	var name = elisp.symbolName(elisp.nth(1, expr)),
	    params = elisp.nth(2, expr),
	    d = elisp.nth(3, expr),
	    docstring = elisp.isString(d) && d,
	    body = elisp.nthcdr(docstring ? 3 : 2, expr);
	this.defineFunc(name, params, body, docstring);
	result = elisp.nil;
    }
    else if (elisp.isSet(expr)) {
	var val = elisp.val(expr),
	    name = elisp.symbolName(val[1]),
	    value = this.eval(val[2]);
	this.setVar(name, value);
	result = value;
    }
    else if (elisp.isSetq(expr)) {
	var i = 1,
            n = elisp.listLength(expr),
	    e;
	while (i < n && elisp.isSymbol((e=elisp.nth(i,expr)))) {
	    var name = elisp.symbolName(elisp.nth(i, expr)),
                value = this.eval(elisp.nth(i+1, expr));
	    this.setVar(name, value, true);
	    result = value;
	    i += 2;
        }
    }
    else if (elisp.isIf(expr)) {
	var val = elisp.val(expr),
	    condition = this.eval(val[1]),
	    trueBlock = val[2],
	    nilBlock = val[3];
	result = this.doIf(condition, trueBlock, nilBlock);
    }
    else if (elisp.isCond(expr)) {
	var val = elisp.val(expr),
	    list = val[1],
	    condition = elisp.car(list),
	    body = elisp.cdr(list),
	    rest = val.slice(2);
	result = this.doCond(exprs);
    }

    // function application
    else if (elisp.isCons(expr)) {
	var name = elisp.car(expr),
	    rest = elisp.cdr(expr),
	    func, args;
	while (!elisp.isSymbol(name)) {
	    name = this.eval(name);
	}
	if ((func = this.lookupFunc(elisp.symbolName(name)))) {
	    var self = this;
	    args = elisp.listReduce(function(a,e){
		a.push(self.eval(e));
		return a;
	    }, [], rest);
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


elisp.Evaluator.prototype.defineVar = function(symbol, value, docstring) {
    this.variables.define(symbol, {
	type: 'variable',
	value: value,
	docstring: docstring || "(undocumented)"
    });
};

elisp.Evaluator.prototype.setVar = function(symbol, value, create) {
    var valueObject = this.lookupVar(symbol);
    if (!valueObject) {
	if (create) {
	    this.defineVar(symbol, elisp.nil);
	    valueObject = this.lookupVar(symbol);
	}
	else {
	    this.error('undefined-var', symbol);
	}
    }
    valueObject.value = value;
    this.variables.set(symbol, valueObject);
};

elisp.Evaluator.prototype.defineFunc = function(symbol, params, body, docstring) {
    this.functions.define(symbol, {
	type: 'lambda',
	name: symbol,
	params: params,
	body: body,
	docstring: docstring || "(undocumented)"
    });
};

elisp.Evaluator.prototype.doIf = function(condition, trueBlock, nilBlock) {
    return elisp.isNil(condition) ? this.eval(nilBlock) : this.eval(trueBlock);
};

elisp.Evaluator.prototype.doCond = function(exprs) {
    print('----- COND (doCond) -----');
    elisp.print(exprs);
    return elisp.nil;
};



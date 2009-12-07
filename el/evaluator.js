////
// Emacs Lisp implementation in JavaScript.
// 
// Copyright (c) 2009 Sami Samhuri - sami.samhuri@gmail.com
//
// Released under the terms of the MIT license.  See the included file
// LICENSE.


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

EL.Evaluator.prototype.apply = function(func, args) {
    var result;
    if (func.type === 'primitive') {
// 	print('APPLY: ');
// 	EL.print(func);
// 	print('WITH: ');
// 	EL.print(args);
// 	print('------');
	result = func.body.apply(this, args);
    }
    else {
	this.functions.pushScope();
	this.variables.pushScope(EL.listMap(func.params, function(e, i){
		var name = EL.symbolName(e),
		    value = {
			type: 'variable',
			value: this.eval(args[i])
		    };
                return [name, value];
	    }));
	result = EL.listLast(EL.listMap(func.body,
	                     function(e) {return this.eval(e); }));
	this.functions.popScope();
	this.variables.popScope();
    }
    return result;
};

EL.Evaluator.prototype.eval = function(expr) {
//     print("EVAL: " + EL.typeOf(expr));
//     EL.print(expr);
    var result, x,
	tag = EL.tag(expr);
    if (EL.isAtom(expr)) {
	result = expr;
    }
    else if (EL.isSymbol(expr)) {
	var name = EL.val(expr);
	x = this.lookupVar(name);
	if (x == null) this.error('undefined-var', name);
	result = x.value;
    }

    ///////////////////
    // special forms //
    ///////////////////
    // (many could be in lisp when there are macros) //

    else if (EL.isQuote(expr)) {
	result = EL.cdr(expr);
    }
    else if (EL.isDefVar(expr)) {
	var name = EL.symbolName(EL.cadr(expr)), // 2nd param
	    value = this.eval(EL.caddr(expr)),   // 3rd param
	    docstring = EL.cadddr(expr);         // 4th param
	// TODO check for re-definitions
	this.defineVar(name, value, docstring);
	result = EL.nil;
    }
    else if (EL.isDefFunc(expr)) {
	var name = EL.symbolName(EL.nth(1, expr)),
	    params = EL.nth(2, expr),
	    d = EL.nth(3, expr),
	    docstring = EL.isString(d) && d,
	    body = EL.nthcdr(docstring ? 3 : 2, expr);
	this.defineFunc(name, params, body, docstring);
	result = EL.nil;
    }
    else if (EL.isSet(expr)) {
	var val = EL.val(expr),
	    name = EL.symbolName(val[1]),
	    value = this.eval(val[2]);
	this.setVar(name, value);
	result = value;
    }
    else if (EL.isSetq(expr)) {
	var i = 1,
            n = EL.listLength(expr),
	    e;
	while (i < n && EL.isSymbol((e=EL.nth(i,expr)))) {
	    var name = EL.symbolName(EL.nth(i, expr)),
                value = this.eval(EL.nth(i+1, expr));
	    this.setVar(name, value, true);
	    result = value;
	    i += 2;
        }
    }
    else if (EL.isIf(expr)) {
	var val = EL.val(expr),
	    condition = this.eval(val[1]),
	    trueBlock = val[2],
	    nilBlock = val[3];
	result = this.doIf(condition, trueBlock, nilBlock);
    }
    else if (EL.isCond(expr)) {
	var val = EL.val(expr),
	    list = val[1],
	    condition = EL.car(list),
	    body = EL.cdr(list),
	    rest = val.slice(2);
	result = this.doCond(exprs);
    }

    // function application
    else if (EL.isCons(expr)) {
	var name = EL.car(expr),
	    rest = EL.cdr(expr),
	    func, args;
	while (!EL.isSymbol(name)) {
	    name = this.eval(name);
	}
	if ((func = this.lookupFunc(EL.symbolName(name)))) {
	    var self = this;
	    args = EL.listReduce(function(a,e){
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


EL.Evaluator.prototype.defineVar = function(symbol, value, docstring) {
    this.variables.define(symbol, {
	type: 'variable',
	value: value,
	docstring: docstring || "(undocumented)"
    });
};

EL.Evaluator.prototype.setVar = function(symbol, value, create) {
    var valueObject = this.lookupVar(symbol);
    if (!valueObject) {
	if (create) {
	    this.defineVar(symbol, EL.nil);
	    valueObject = this.lookupVar(symbol);
	}
	else {
	    this.error('undefined-var', symbol);
	}
    }
    valueObject.value = value;
    this.variables.set(symbol, valueObject);
};

EL.Evaluator.prototype.defineFunc = function(symbol, params, body, docstring) {
    this.functions.define(symbol, {
	type: 'lambda',
	name: symbol,
	params: params,
	body: body,
	docstring: docstring || "(undocumented)"
    });
};

EL.Evaluator.prototype.doIf = function(condition, trueBlock, nilBlock) {
    return EL.isNil(condition) ? this.eval(nilBlock) : this.eval(trueBlock);
};

EL.Evaluator.prototype.doCond = function(exprs) {
    print('----- COND (doCond) -----');
    EL.print(exprs);
    return EL.nil;
};

/****************************************************************
 ****************************************************************/


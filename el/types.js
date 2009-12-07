////
// Emacs Lisp implementation in JavaScript.
// 
// Copyright (c) 2009 Sami Samhuri - sami.samhuri@gmail.com
//
// Released under the terms of the MIT license.  See the included file
// LICENSE.

// data types are simple tags
EL._defineTags = function() {
    EL.tags = ['symbol', 'string', 'number', 'cons', 'lambda', 'regex'];
    EL.tags.each = Array.prototype.each;

    // define constructors for the primitive types (box values)
    // e.g. EL.symbol('foo')  => ['symbol', 'foo']
    EL.tags.each(function(tag) {
	// don't clobber custom constructors
	if (EL[tag] === undefined) {
	    EL[tag] = function(value) {
		return [tag, value];
	    };	    
	}
	// tag type tests
	var isTag = function(expr) {
	    return (EL.tag(expr) == tag);
	};
	EL['is' + tag.camelize()] = isTag;
    });
};
EL.initHook(EL._defineTags);

// shorthands to save my fingers
EL._defineConstants = function() {
    EL.nil = EL.symbol('nil');
    EL.t = EL.symbol('t');
};
EL.initHook(EL._defineConstants);


// retrieve the tag from a value
EL.tag = function(expr) {
    EL.assert(function() { var f='tag'; return EL.typeOf(expr) == 'array'; }, expr);
    return expr[0];
};

// unbox a value
EL.val = function(expr) {
    EL.assert(function() { var f='val'; return EL.typeOf(expr) == 'array'; }, expr);
    return expr[1];
};

EL.symbolName = function(symbol) {
//    EL.Util.pp(symbol);
    EL.assert(function(){ var f='symbolName'; return EL.isSymbol(symbol); }, symbol);
    return EL.val(symbol);
};

EL.isNilSymbol = function(expr) {
    return (EL.isSymbol(expr) && EL.symbolName(expr) == 'nil');
};

EL.isNil = function(expr) {
    return EL.isNilSymbol(expr);
};

EL.list = function(exprs) {
    var list = EL.nil,
	i = exprs.length;
    while (--i >= 0) {
	list = EL.cons(exprs[i], list);
    }
    return list;
};

EL.isList = function(expr) {
    return (EL.isNil(expr) || EL.isCons(expr));
};

EL.isAtom = function(expr) {
    return EL.isString(expr) || EL.isNumber(expr) || EL.isRegex(expr);
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
    return EL[type](initial);
};


// special forms

EL.isSpecialForm = function(name, expr) {
    var tag = EL.tag(expr),
	car = EL.typeOf(expr) == 'array' && EL.val(expr)[0],
	thisName = car && EL.symbolName(car);
    return (tag == 'cons' && thisName == name);
};

EL.isQuote   = function(expr){return EL.isSpecialForm('quote', expr);};
EL.isDefVar  = function(expr){return EL.isSpecialForm('defvar', expr);};
EL.isDefFunc = function(expr){return EL.isSpecialForm('defun', expr);};
EL.isSet     = function(expr){return EL.isSpecialForm('set', expr);};
EL.isSetq    = function(expr){return EL.isSpecialForm('setq', expr);};
EL.isCond    = function(expr){return EL.isSpecialForm('cond', expr);};
EL.isIf      = function(expr){return EL.isSpecialForm('if', expr);};

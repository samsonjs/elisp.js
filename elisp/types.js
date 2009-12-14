////
// Emacs Lisp implementation in JavaScript.
// 
// Copyright (c) 2009 Sami Samhuri - sami.samhuri@gmail.com
//
// Released under the terms of the MIT license.  See the included file
// LICENSE.

// data types are simple tags
elisp._defineTags = function() {
    elisp.tags = ['symbol', 'string', 'number', 'cons', 'lambda', 'regex'];
    elisp.tags.each = Array.prototype.each;

    // define constructors for the primitive types (box values)
    // e.g. elisp.symbol('foo')  => ['symbol', 'foo']
    elisp.tags.each(function(tag) {
	// don't clobber custom constructors
	if (elisp[tag] === undefined) {
	    elisp[tag] = function(value) {
		return [tag, value];
	    };	    
	}
	// tag type tests
	var isTag = function(expr) {
	    return (elisp.tag(expr) == tag);
	};
	elisp['is' + tag.camelize()] = isTag;
    });
};
elisp.initHook(elisp._defineTags);

// shorthands to save my fingers
elisp._defineConstants = function() {
    elisp.nil = elisp.symbol('nil');
    elisp.t = elisp.symbol('t');
};
elisp.initHook(elisp._defineConstants);


// retrieve the tag from a value
elisp.tag = function(expr) {
    elisp.assert(function() { var f='tag'; return elisp.typeOf(expr) == 'array'; }, expr);
    return expr[0];
};

// unbox a value
elisp.val = function(expr) {
    elisp.assert(function() { var f='val'; return elisp.typeOf(expr) == 'array'; }, expr);
    return expr[1];
};

elisp.symbolName = function(symbol) {
//    elisp.Util.pp(symbol);
    elisp.assert(function(){ var f='symbolName'; return elisp.isSymbol(symbol); }, symbol);
    return elisp.val(symbol);
};

elisp.isNilSymbol = function(expr) {
    return (elisp.isSymbol(expr) && elisp.symbolName(expr) == 'nil');
};

elisp.isNil = function(expr) {
    return elisp.isNilSymbol(expr);
};

elisp.list = function(exprs) {
    var list = elisp.nil,
	i = exprs.length;
    while (--i >= 0) {
	list = elisp.cons(exprs[i], list);
    }
    return list;
};

elisp.isList = function(expr) {
    return (elisp.isNil(expr) || elisp.isCons(expr));
};

elisp.isAtom = function(expr) {
    return !elisp.isCons(expr);
};

elisp.inferType = function(exprs) {
    var type = 'number',
        initial = 0,
        i = exprs.length-1;
    while(i >= 0) {
	if (elisp.isString(exprs[i--])) {
	    type = 'string';
	    initial = '';
	    break;
	}
    }
    return elisp[type](initial);
};


// special forms

elisp.isSpecialForm = function(name, expr) {
    var tag = elisp.tag(expr),
	car = elisp.typeOf(expr) == 'array' && elisp.val(expr)[0],
	thisName = car && elisp.symbolName(car);
    return (tag == 'cons' && thisName == name);
};

elisp.isQuote   = function(expr){return elisp.isSpecialForm('quote', expr);};
elisp.isDefVar  = function(expr){return elisp.isSpecialForm('defvar', expr);};
elisp.isDefFunc = function(expr){return elisp.isSpecialForm('defun', expr);};
elisp.isSet     = function(expr){return elisp.isSpecialForm('set', expr);};
elisp.isSetq    = function(expr){return elisp.isSpecialForm('setq', expr);};
elisp.isCond    = function(expr){return elisp.isSpecialForm('cond', expr);};
elisp.isIf      = function(expr){return elisp.isSpecialForm('if', expr);};

////
// Emacs Lisp implementation in JavaScript.
// 
// Copyright (c) 2009 Sami Samhuri - sami.samhuri@gmail.com
//
// Released under the terms of the MIT license.  See the included file
// LICENSE.

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


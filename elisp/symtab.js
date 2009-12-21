////
// Emacs Lisp implementation in JavaScript.
// 
// Copyright (c) 2009 Sami Samhuri - sami.samhuri@gmail.com
//
// Released under the terms of the MIT license.  See the included file
// LICENSE.

var utils = require('elisp/utils'),
    type = require('elisp/types');

var SymbolTable = function(bindings) {
    this.symbols = [[]];
    this.level = 0;
    if (bindings) this.define(bindings);
};

SymbolTable.prototype.lookupWithScope = function(name) {
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

SymbolTable.prototype.lookup = function(name) {
//    print('name: ' + name);
    var pair = this.lookupWithScope(name);
//    print('pair: ' + pair);
//    print('------');
    return pair && pair[1];
};

// store the given symbol/value pair in the symbol table at the current level.
SymbolTable.prototype.define = function(name, value) {
//    print('###### REAL DEFINE: ' + name + ' = ' + value);
//    print('           (TYPES): ' + utils.typeOf(name) + ' = ' + utils.typeOf(value));
    if (value === undefined && utils.typeOf(name) == 'array') {	
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

SymbolTable.prototype.pushScope = function(bindings) {
//     print('>>> pushing scope <<<');
//     print('>>> level going from ' + this.level + ' to ' + (1+this.level));
//     print(bindings);
    this.symbols[++this.level] = [];
    if (bindings) this.define(bindings);
};

SymbolTable.prototype.popScope = function() {
    --this.level;
};

SymbolTable.prototype.set = function(name, value) {
    var pair = this.lookupWithScope(name),
	level = pair[0];
    this.symbols[level][name] = value;
};

exports.SymbolTable = SymbolTable;


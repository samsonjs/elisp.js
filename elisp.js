////
// Emacs Lisp implementation in JavaScript.
// 
// Copyright (c) 2009 Sami Samhuri - sami.samhuri@gmail.com
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// 
///

if (require.paths[0] != '.') require.paths.unshift('.');
//require.paths.unshift('elisp');

//print('[elisp starting]');

var init = require('elisp/init');  // simple init system
exports.init = init;
//print('* init');

require('elisp/jsExt'); // extensions to native types
//print('* jsExt');

exports.utils = require('elisp/utils');
//print('* utils');

// main lisp system
exports.type = require('elisp/types');
exports.T = exports.type.T;
exports.NIL = exports.type.NIL;
//print('* type');

exports.list = require('elisp/list');
//print('* list');

exports.symtab = require('elisp/symtab');
//print('* symtab');

exports.parser = require('elisp/parser');
//print('* parser');

exports.primitives = require('elisp/primitives');
//print('* primitives');

exports.evaluator = require('elisp/evaluator');
//print('* evaluator');

var repl = require('elisp/repl');
exports.repl = repl;
//print('* repl');

// everything is defined, initialize
init.initialize();

//print('[elisp ready]');

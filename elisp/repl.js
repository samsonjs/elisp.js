////
// Emacs Lisp implementation in JavaScript.
// 
// Copyright (c) 2009 Sami Samhuri - sami.samhuri@gmail.com
//
// Released under the terms of the MIT license.  See the included file
// LICENSE.

var parser = require('elisp/parser'),
    evaluator = require('elisp/evaluator'),
    utils = require('elisp/utils'),
    Parser = parser.Parser,
    Evaluator = evaluator.Evaluator;

// this should probably be renamed to avoid confusion
var eval = function(string) {
    var p = new Parser(),
	e = new Evaluator();
    return e.evalExpressions(p.parse(string));
};
exports.eval = eval;

var parse = function(string) {
    var p = new Parser();
    return p.parse(string);
};
exports.parse = parse;

var parseOne = function(string) {
    return parse(string).car();
};
exports.parseOne = parseOne;
exports.read = parseOne;

exports.pp = utils.pp;

var rep = function(string) {
    var p = new Parser(),
	e = new Evaluator();
    utils.pp(e.eval(p.read(string)));
};
exports.rep = rep;

var repl = function() {
    var p = new Parser(),
	e = new Evaluator(),
	sys = require('system'),
	settings = require('elisp/settings');
    while (true) {
	if (!settings.hidePrompt) {
	    sys.stdout.print("elisp> "); // i don't want a newline, grrrr
	}
	try {
	    var line = sys.stdin.readLine();
	    while (!line) {
		line = sys.stdin.readLine();
	    }
	    if (line.substring(0,1).toLowerCase() == 'q') return;
	    utils.pp(e.eval(p.parseOne(line)));
	} catch (x) {
	    if (x.evalError) {
		print('[error] ' + x.message + ': ' + x.expression);
	    }
	    else throw(x);
	}
    }
};
exports.repl = repl;


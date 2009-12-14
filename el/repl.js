////
// Emacs Lisp implementation in JavaScript.
// 
// Copyright (c) 2009 Sami Samhuri - sami.samhuri@gmail.com
//
// Released under the terms of the MIT license.  See the included file
// LICENSE.

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
EL.print = EL.Util.pp;

EL.rep = function(string) {
    EL.print(EL.eval(EL.parse(string)));
};

EL.repl = function() {
    var p = new EL.Parser(),
	e = new EL.Evaluator();
    while (true) {
	if (!EL.hidePrompt) {
	    print("elisp> "); // i don't want a newline, grrrr
	}
	try {
	    var line = readline();
	    while (!line) {
		line = readline();
	    }
	    if (line.substring(0,1).toLowerCase() == 'q') return;
	    EL.print(e.eval(p.parseOne(line)));
	} catch (x) {
	    if (x.evalError) {
		print('[error] ' + x.message + ': ' + x.expression);
		EL.print(x);		
	    }
	    else throw(x);
	}
    }
};


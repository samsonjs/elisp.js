////
// Emacs Lisp implementation in JavaScript.
// 
// Copyright (c) 2009 Sami Samhuri - sami.samhuri@gmail.com
//
// Released under the terms of the MIT license.  See the included file
// LICENSE.

elisp.eval = function(exprs) {
    var e = new elisp.Evaluator();
    return e.evalExpressions(exprs);
};

elisp.parse = function(string) {
    var p = new elisp.Parser();
    return p.parse(string);
};

elisp.parseOne = function(string) {
    return elisp.parse(string)[0];
};

elisp.read = elisp.parseOne;
elisp.print = elisp.Util.pp;

elisp.rep = function(string) {
    elisp.print(elisp.eval(elisp.parse(string)));
};

elisp.repl = function() {
    var p = new elisp.Parser(),
	e = new elisp.Evaluator();
    while (true) {
	if (!elisp.hidePrompt) {
	    print("elisp> "); // i don't want a newline, grrrr
	}
	try {
	    var line = readline();
	    while (!line) {
		line = readline();
	    }
	    if (line.substring(0,1).toLowerCase() == 'q') return;
	    elisp.print(e.eval(p.parseOne(line)));
	} catch (x) {
	    if (x.evalError) {
		print('[error] ' + x.message + ': ' + x.expression);
		elisp.print(x);		
	    }
	    else throw(x);
	}
    }
};


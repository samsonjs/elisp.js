////
// Emacs Lisp implementation in JavaScript.
// 
// Copyright (c) 2009 Sami Samhuri - sami.samhuri@gmail.com
//
// Released under the terms of the MIT license.  See the included file
// LICENSE.

/****************************************************************
 **** Utilities *************************************************
 ****************************************************************/

elisp.Util = function(){};

// aka foldl
elisp.Util.reduce = function(fn, accum, list) {
    var i = 0,
	n = list.length;
    while (i < n) {
	accum = fn(accum, list[i++]);
    }
    return accum;
};

elisp.Util.foldr = function(fn, end, list) {
    var i = list.length-1;
    while (i >= 0) {
	end = fn(list[i--], end);
    }
    return end;
};

elisp.Util.shallowCopy = function(list) {
    var i = 0,
	n = list.length,
	result = [];
    while (i < n) {
	result.push(list[i++]);
    }
    return result;
};


// i'm sorry
elisp.Util.pp = function(x, indent, key, noprint) {
    if (indent === undefined) {
	indent = 0;
    }
   
    /* string to print at the end, the only way to print 2 strings in
     * succession without a newline is to buffer them
     */
    var buffer = "";
    var printB = function(s, newline) {
	buffer += s;
	if (newline) buffer += "\n";
    };
    var dumpBuffer = function(b) {
	if (b === undefined) b = buffer;
	if (buffer.length <= 72) {
	    print(buffer);
	}
	else {
	    var split = 72;
	    var c;
	    while ((c = b[split]) && c.match(/[a-zA-Z0-9"'\[\]_-]/)) --split;
	    print(b.substring(0, split));
	    var next_chunk = b.substring(split);
	    if (next_chunk) dumpBuffer(next_chunk);
	}
	buffer = "";
    };

    var space = "";
//     for (var j = 0; j < indent; j++) {
// 	space += "    ";
//     }
	
    switch (elisp.typeOf(x)) {
    case 'object':
	if (key) {
	    printB(space + key + ': {');
	}
	else {
	    printB(space + ' {');
	}
	for (var a in x) {
	    printB(elisp.Util.pp(x[a], 1+indent, a, true));
	    printB(', ');
	}
	printB(space + "} ");
	break;

    case 'string':
	if (key) {
	    printB(space + key + ': "' + x + '"');
	}
	else {
	    printB(space + '"' + x + '"');
	}
	return buffer;

    case 'array':
	// nil special case
        if (x.length == 2 && elisp.tag(x) == 'symbol' && elisp.val(x) == 'nil') {
            return elisp.Util.pp(null, indent, key);
        }

	if (key) {
	    printB(space + key + ': [');
	}
	else {
	    printB(space + '[');
	}
	var n = x.length, i = 0;
	while (i < n) {
	    if (i > 0) printB(', ');
	    printB(elisp.Util.pp(x[i++], 1+indent, undefined, true));
	}
	printB(space + ']');
	break;

    case 'null':
	if (key) {
	    printB(space + key + ': (null)');
	}
	else {
	    printB(space + '(null)');
	}
	return buffer;

    default:
	if (key) {
	    printB(space + key + ": " + x);
	}
	else {
	    printB(space + x);
	}
	return buffer;
    }
    if (noprint) return buffer;
    else dumpBuffer();
};

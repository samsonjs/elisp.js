// A basic test of the whole interpreter.

require.paths.unshift('.'); // expected to be run from project root!

var elisp = require('elisp'),
    type = elisp.type,
    LispSymbol = type.LispSymbol,
    LispString = type.LispString,
    LispNumber = type.LispNumber,
    LispCons = type.LispCons,
    T = type.T,
    NIL = type.NIL,
    ok = true;

var test = function(name, code, expected) {
    //print(' * ' + name + ' :: ' + code);
    var result = elisp.repl.eval(code),
	success = result === expected || result && result.eq(expected);
    if (!success) {
	//print(' * ' + name + ' :: ' + code);
	print('*** FAILED result: ' + (result ? result.repr() : '(null)') +
	      ' expected: ' + (expected ? expected.repr() : '(null)'));
	ok = false;
    }
    return success;
};


/////////
// Nil //
/////////

print('---- Testing Nil ----');

test('Empty quoted list', "'()", elisp.NIL);
test('Nil symbol', "'nil", elisp.NIL);
test('Nil constant', "nil", elisp.NIL);


/////////////
// Numbers //
/////////////

print('---- Testing Numbers ----');

test('Positive Zero', '+0', new LispNumber(0));
test('Negative Zero', '-0', new LispNumber(0));

test('Simple Integer',   '42',  new LispNumber(42));
test('Positive Integer', '+42', new LispNumber(42));
test('Negative Integer', '-42', new LispNumber(-42));

test('Simple Integer w/ Exponent',   '42e2',  new LispNumber(4200));
test('Positive Integer w/ Exponent', '+42e2', new LispNumber(4200));
test('Negative Integer w/ Exponent', '-42e2', new LispNumber(-4200));

test('Simple Integer w/ Negative Exponent',   '42e-2',  new LispNumber(0.42));
test('Positive Integer w/ Negative Exponent', '+42e-2', new LispNumber(0.42));
test('Negative Integer w/ Negative Exponent', '-42e-2', new LispNumber(-0.42));

test('Simple Float',   '123.456',  new LispNumber(123.456));
test('Positive Float', '+123.456', new LispNumber(123.456));
test('Negative Float', '-123.456', new LispNumber(-123.456));

test('Fraction-only Float', '.456', new LispNumber(0.456));
test('Fraction-only Positive Float', '+.456', new LispNumber(0.456));
test('Fraction-only Negative Float', '-.456', new LispNumber(-0.456));

test('Simple Float w/ Exponent',   '123.456e2', new LispNumber(12345.6));
test('Positive Float w/ Exponent', '+123.456e2', new LispNumber(12345.6));
test('Negative Float w/ Exponent', '-123.456e2', new LispNumber(-12345.6));

test('Simple Float w/ Negative Exponent',   '123.456e-2', new LispNumber(1.23456));
test('Positive Float w/ Negative Exponent', '+123.456e-2', new LispNumber(1.23456));
test('Negative Float w/ Negative Exponent', '-123.456e-2', new LispNumber(-1.23456));


/////////////
// Symbols //
/////////////

print('---- Testing Symbols ----');

test('Simple Symbol', "'i-am-a-symbol", new LispSymbol('i-am-a-symbol'));


/////////////
// Strings //
/////////////

print('---- Testing Strings ----');

test('Simple String', '"Hello, world!"', new LispString('Hello, world!'));
test('String w/ Quotes', '"Hello, \\"world\\"!"', new LispString('Hello, "world"!'));


/////////////
// Lambdas //
/////////////

print('---- Testing Lambdas ----');

// TODO


////////////////
// Primitives //
////////////////

print('---- Testing Primitives ----');


// arithmetic

test('(+)', '(+)', new LispNumber(0));
test('(+ 5)', '(+ 5)', new LispNumber(5));
test('(+ 5 10 15)', '(+ 5 10 15)', new LispNumber(30));

test('(-)', '(-)', new LispNumber(0));
test('(- 5)', '(- 5)', new LispNumber(-5));
test('(- 15 10 5)', '(- 15 10 5)', new LispNumber(0));

test('(*)', '(*)', new LispNumber(1));
test('(* 5)', '(* 5)', new LispNumber(5));
test('(* 5 5)', '(* 5 5)', new LispNumber(25));
test('(* 5 5 5)', '(* 5 5 5)', new LispNumber(125));

////
// need not test these every time until the test output isn't 
// screwed up with division error messages
////
// test('(/)', '(/)', null); // error, or will be in any case
// test('(/ 5)', '(/ 5)', null); // error
////
test('(/ 125 5)', '(/ 125 5)', new LispNumber(25));
test('(/ 125 5 5)', '(/ 125 5 5)', new LispNumber(5));


// consp

// atom

// symbol-name

// string-match

// print

// hide-prompt


///////////////////
// Special Forms //
///////////////////

print('---- Testing Special Forms ----');


// quote

var cons = new LispCons(new LispSymbol('foo'), elisp.NIL);
test('Simple Quoted Expression', "'(foo)", cons);

var diff = elisp.type.mkList([new LispSymbol('-'), new LispNumber(5), new LispNumber(2)]),
    prod = elisp.type.mkList([new LispSymbol('*'), new LispNumber(17), new LispNumber(5)]);
cons = elisp.type.mkList([new LispSymbol('+'), diff, prod]);
test('Nested Quoted Expression', "'(+ (- 5 2) (* 17 5))", cons);


// defvar

// defun

// set

// setq

// cond

// if


// done, print overall status

print('');
if (ok) {
    print('all ok :)');
}
else {
    print('***** TESTS FAILED *****');
}
/** Copyright (c) 2013 Toby Jaffey <toby@1248.io>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

function evalMatchExpr(expr, mdatas) {
    if (expr.rel === undefined && expr.val === undefined)
        return false;
    for (var i=0;i<mdatas.length;i++) {
        if (expr.rel !== undefined && expr.val === undefined) {
            if ((expr.rel === mdatas[i].rel) || (expr.rel == '*'))
                return true;
        }
        if (expr.rel === undefined && expr.val !== undefined) {
            if ((expr.val === mdatas[i].val) || (expr.val == '*'))
                return true;
        }
        if (expr.rel !== undefined && expr.val !== undefined) {
            if (((expr.rel === mdatas[i].rel) || (expr.rel == '*')) && ((expr.val === mdatas[i].val) || (expr.val == '*')))
                return true;
        }
    }
    return false;
}

function evalOrExpr(exprs, mdatas) {
    for (var i=0;i<exprs.length;i++) {
        if (evalExpr(exprs[i], mdatas))
            return true;
    }
    return false;
}

function evalAndExpr(exprs, mdatas) {
    for (var i=0;i<exprs.length;i++) {
        if (!evalExpr(exprs[i], mdatas))
            return false;
    }
    return true;
}

function evalExpr(expr, mdatas) {
    if (expr === undefined)
        return false;
    if (expr.match !== undefined) {
        return evalMatchExpr(expr.match, mdatas);
    }
    if (expr.or !== undefined) {
        return evalOrExpr(expr.or, mdatas);
    }
    if (expr.and !== undefined) {
        return evalAndExpr(expr.and, mdatas);
    }
    if (expr.not !== undefined) {
        return !evalExpr(expr.not, mdatas);
    }
    return false;
}

exports.match = evalExpr;

// check for match with a catalogue item
exports.matchItem = function(expr, item) {
    return evalExpr(expr, item['i-object-metadata']);
};

// check for match with a catalogue
exports.matchCat = function(expr, cat) {
    return evalExpr(expr, cat['item-metadata']);
};


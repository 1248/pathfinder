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

// check catalogue equality, ignoring order of items
exports.catEquals = function(a, b) {
    var a_str, b_str;
    var a_item_strs = [], b_item_strs = [];
    var i, j;

    // compare item-metadata
    a_str = JSON.stringify(a['item-metdata']);
    b_str = JSON.stringify(b['item-metdata']);
    if (a_str != b_str)
        return false;
    
    // compare items length
    if (a.items.length != b.items.length)
        return false;

    // gather items
    for (i=0;i<a.items.length;i++)
        a_item_strs.push(JSON.stringify(a.items[i]));
    for (i=0;i<b.items.length;i++)
        b_item_strs.push(JSON.stringify(b.items[i]));

    // compare items
    for (i=0;i<a_item_strs.length;i++) {
        var found = false;
        for (j=0;j<b_item_strs.length;j++) {
            if (a_item_strs[i] == b_item_strs[j]) {
                found = true;
                break;
            }
        }
        if (!found)
            return false;
    }
    return true;    // must be identical
};


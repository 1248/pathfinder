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

// Script to empty all known collections

var config = require('../lib/config');
var mongo_db = require('../lib/mongo');

mongo_db.get(function(err, db) {
    if (err) {
        console.log("Error mongodb %j", err);
        process.exit(1);
    } else {
        console.log("Connected");
        var cats = mongo_db.get().collection('cats');
        var items = mongo_db.get().collection('items');
        var perms = mongo_db.get().collection('perms');

        perms.remove({}, function(err, doc) {
            if (err) {
                console.log("Error %j", err);
                process.exit(1);
            } else {
                console.log("perms removed");

                cats.remove({}, function(err, doc) {
                    if (err) {
                        console.log("Error %j", err);
                        process.exit(1);
                    } else {
                        console.log("cats removed");
                        items.remove({}, function(err, doc) {
                            if (err) {
                                console.log("Error %j", err);
                                process.exit(1);
                            } else {
                                console.log("items removed");
                                process.exit(0);
                            }
                        });
                    }
                });
            }
        });
    }
});



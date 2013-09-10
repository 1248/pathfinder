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

var config = require('./config');
var db = require('./mongo');
var _ = require('underscore');
var auth = require('./auth');

function validatePermId(cat_id) {
    var re = /^[A-Za-z0-9]+$/g;
    var m = cat_id.match(re);
    if (m === null || m.length === 0)
        return null;
    else
        return cat_id;
}

function sanitize(doc) {
    delete doc._id;
    delete doc.perm_id;
    return doc;
}

function update_perm(perm_id, perm, cb) {
    var perms = db.get().collection('perms');
    perm.perm_id = perm_id;
    perms.update({perm_id:perm_id}, perm, {safe: true, upsert: true}, function(err, doc) {
        if (err)
            cb("update failed");
        else
            cb(null);
    });
}

exports.find = function(perm_id, cb) {
    perms = db.get().collection('perms');
    perms.findOne({perm_id:perm_id}, function(err, doc) {
        if (err)
            cb(err, null);
        else {
            if (doc === null)
                cb('not found', null);
            else
                cb(null, sanitize(doc));
        }
    });
};

exports.list = function(req, res) {
    auth.get('GET_ALL', req, function(err, perms) {
        if (err)
            res.send(401);
        else {
            perms = db.get().collection('perms');
            perms.find({}, function(err, cursor) {
                if (err)
                    res.send(500);
                else {
                    var o = {};
                    cursor.toArray(function(err, docs) {
                        for (var i=0;i<docs.length;i++) {
                            o[docs[i].perm_id] = sanitize(docs[i]);
                        }
                        res.send(200, o);
                    });
                }
            });
        }
    });
};

exports.get = function(req, res) {
    auth.get('GET', req, function(err, perms) {
        if (err)
            res.send(401);
        else {
            var perm_id = validatePermId(req.params.perm_id);
            if (perm_id === null) {
                res.send(409);  // bad perm name
                return;
            }
            exports.find(perm_id, function(err, doc) {
                if (err === 'not found')
                    res.send(404);
                else
                if (err)
                    res.send(500);
                else
                    res.send(200, doc);
            });
        }
    });
};

exports.post = function(req, res) {
    auth.get('POST', req, function(err, perms) {
        if (err)
            res.send(401);
        else {
            var perm_id = validatePermId(req.params.perm_id);
            if (perm_id === null) {
                res.send(409);  // bad perm name
                return;
            }

            // FIXME, need some validation
            update_perm(perm_id, req.body, function(err) {
                if (err)
                    res.send(500);
                else
                    res.send(200);
            });
        }
    });
};

exports.delete = function(req, res) {
    auth.get('DELETE', req, function(err, permslist) {
        if (err)
            res.send(401);
        else {
            var perm_id = validatePermId(req.params.perm_id);
            if (perm_id === null) {
                res.send(409);  // bad perm name
                return;
            }
            var perms = db.get().collection('perms');
            perms.remove({perm_id:perm_id}, function(err, doc) {
                if (err)
                    res.send(500);
                else
                    res.send(204);
            });
        }
    });
};



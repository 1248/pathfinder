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
var expr = require('./expr');
var perm = require('./perm');

// http://stackoverflow.com/questions/5951552/basic-http-authentication-in-node-js
function getCredentials(req) {
    var header = req.headers.authorization || '',        // get the header
        token = header.split(/\s+/).pop() || '',            // and the encoded auth token
        auth = new Buffer(token, 'base64').toString(),    // convert from base64
        parts = auth.split(/:/);                          // split on colon
    return {username:parts[0], password:parts[1]};
}

// return a list of all perms in permset matching op and rsrc
function filterPerms(op, req, permset) {
    var out = [];
    for (var i=0;i<permset.length;i++) {
        if ((permset[i].op == op || permset[i].op == '*') &&
            (permset[i].rsrc == req.path || permset[i].rsrc == '*')) {
            out.push(permset[i]);
        }
    }
    return out;
}

// get the right permset from db or config
function getPerms(op, req, cb) {
    var credentials = getCredentials(req);
    var elems = req.path.split('/');

    // special rule for /permissions, must have root key
    if (elems[1] === 'permissions') {
        if (credentials.username === config.root_key) {
            cb(null, config.root_perms);
        }
        else
            cb("bad key");
        return;
    }

    if (credentials.username === undefined || credentials.username === '') {
        perm.find("default", function(err, permdoc) {
            if (err) {
                console.log("No default permissions found falling back to config");
                cb(null, config.default_perms);
            }
            else 
                cb(null, permdoc);
        });
    } else {
        perm.find(credentials.username, function(err, permdoc) {
            if (err)
                cb(err, null);
            else 
                cb(null, permdoc);
        });
    }
}

// get the right permset then filter it to those which might be applicable to this request
exports.get = function(op, req, cb) {
    getPerms(op, req, function(err, perms) {
        if (err)
            cb(err, null);
        else {
            var filtered = filterPerms(op, req, perms.rules);
            if (filtered.length === 0)
                cb("Permission denied", null);  // no matching perms
            else
                cb(null, filtered);
        }
    });
};


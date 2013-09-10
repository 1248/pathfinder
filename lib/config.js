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

exports.port = 8001;
exports.root_key = "LETMEIN";

exports.mongo = {
    uri: "mongodb://localhost/catdemo"
};

exports.root_cat = "public";

exports.ssl = {
    enabled: false,
    privateKey: './lib/ssl/server.key',
    certificate: './lib/ssl/server.crt',
    passphrase: undefined   // user will be asked on startup
};

exports.default_perms = {rules:[    // permissive by default
    {
        op:'*',
        rsrc:'*', 
        olditem:{match:{rel:'*',val:'*'}},
        newitem:{match:{rel:'*',val:'*'}},
        newcat:{match:{rel:'*',val:'*'}},
        oldcat:{match:{rel:'*',val:'*'}}
    }
]};

exports.root_perms = {rules:[
    {
        op:'*',
        rsrc:'*', 
        olditem:{match:{rel:'*',val:'*'}},
        newitem:{match:{rel:'*',val:'*'}},
        newcat:{match:{rel:'*',val:'*'}},
        oldcat:{match:{rel:'*',val:'*'}}
    }
]}; // permissive

exports.pubsub = {
    type: 'redis',
    redis: require('redis'),
    db: 0,
    port: 6379,
    host: "127.0.0.1"
};


exports.htdocs = "../htdocs";

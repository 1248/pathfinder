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

// Example of setting up some keys with different access levels

var config = require('../lib/config');
var request = require('request');
var async = require('async');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var urlbase_rootauth = 'http'+(config.ssl.enabled ? 's' : '')+'://'+config.root_key+':@127.0.0.1:'+config.port;
var urlbase_adminauth = 'http'+(config.ssl.enabled ? 's' : '')+'://ADMINSECRET:@127.0.0.1:'+config.port;

var keys = [
    {
        secret: "default",  // default no credentials
        permset: {
            rules:[
                {
                    op:'GET',
                    rsrc:'*',
                    olditem:{match:{rel:'urn:X-smartstreets:rels:hasVisibility',val:'public'}},
                    oldcat:{match:{rel:'urn:X-smartstreets:rels:hasVisibility',val:'public'}}
                }
            ]
        }
    },
    {
        secret: "ADMINSECRET",  // all permissions
        permset: {
            rules:[
                {
                    op:'*',
                    rsrc:'*',
                    olditem:{match:{rel:'*',val:'*'}},
                    newitem:{match:{rel:'*',val:'*'}},
                    newcat:{match:{rel:'*',val:'*'}},
                    oldcat:{match:{rel:'*',val:'*'}}
                }
            ]
        }
    },
    {
        // view any cat or /cats with hasVisibility=public || armhomes
        secret: "HOMESECRET",
        permset: {
            rules:[
                {
                    op:'GET',
                    rsrc:'*',
                    olditem: {
                        or:[
                            {match:{rel:'urn:X-smartstreets:rels:hasVisibility',val:'public'}},
                            {match:{rel:'urn:X-smartstreets:rels:hasVisibility',val:'armhomes'}},
                        ]
                    },
                    oldcat: {
                        or:[
                            {match:{rel:'urn:X-smartstreets:rels:hasVisibility',val:'public'}},
                            {match:{rel:'urn:X-smartstreets:rels:hasVisibility',val:'armhomes'}},
                        ]
                    }
                }
            ]
        }
    }
];

var cats = [
    {
        url: '/cat',
        cat: {
            "item-metadata":[
                {
                    "rel":"urn:X-tsbiot:rels:isContentType",
                    "val":"application/vnd.tsbiot.catalogue+json"
                },
                {
                    "rel":"urn:X-tsbiot:rels:hasDescription:en",
                    "val":"root catalogue"
                },
                {
                    "rel":"urn:X-smartstreets:rels:hasVisibility",
                    "val":"public"
                }
            ],
            "items":[
                {
                    "href":"/cats/meetingrooms",
                    "i-object-metadata":[
                        {
                            "rel":"urn:X-tsbiot:rels:isContentType",
                            "val":"application/vnd.tsbiot.catalogue+json"
                        },
                        {
                            "rel":"urn:X-tsbiot:rels:hasDescription:en",
                            "val":"Meeting rooms"
                        },
                        {
                            "rel":"urn:X-smartstreets:rels:hasVisibility",
                            "val":"public"
                        }
                    ]
                },
                {
                    "href":"/cats/armhomes",
                    "i-object-metadata":[
                        {
                            "rel":"urn:X-tsbiot:rels:isContentType",
                            "val":"application/vnd.tsbiot.catalogue+json"
                        },
                        {
                            "rel":"urn:X-tsbiot:rels:hasDescription:en",
                            "val":"Homes"
                        },
                        {
                            "rel":"urn:X-smartstreets:rels:hasVisibility",
                            "val":"armhomes"
                        }
                    ]
                }
            ]
        }
    },
    {
        url: '/cats/meetingrooms',
        cat: {
            "item-metadata":[
                {
                    "rel":"urn:X-tsbiot:rels:isContentType",
                    "val":"application/vnd.tsbiot.catalogue+json"
                },
                {
                    "rel":"urn:X-tsbiot:rels:hasDescription:en",
                    "val":"meeting room catalogue"
                },
                {
                    "rel":"urn:X-smartstreets:rels:hasVisibility",
                    "val":"public"
                }
            ],
            "items":[
                {
                    "href":"http://example.com/arm/meetingrooms/birch",
                    "i-object-metadata":[
                        {
                            "rel":"urn:X-tsbiot:rels:hasDescription:en",
                            "val":"Birch Room"
                        },
                        {
                            "rel":"urn:X-smartstreets:rels:hasVisibility",
                            "val":"public"
                        },
                        {
                            "rel":"urn:X-tsbiot:rels:isContentType",
                            "val":"application/vnd.tsbiot.resource+json"
                        }
                    ]
                },
                {
                    "href":"http://example.com/arm/meetingrooms/oak",
                    "i-object-metadata":[
                        {
                            "rel":"urn:X-tsbiot:rels:hasDescription:en",
                            "val":"Oak Room"
                        },
                        {
                            "rel":"urn:X-smartstreets:rels:hasVisibility",
                            "val":"public"
                        },
                        {
                            "rel":"urn:X-tsbiot:rels:isContentType",
                            "val":"application/vnd.tsbiot.resource+json"
                        }
                    ]
                }
            ]
        }
    },
    {
        url: '/cats/armhomes',
        cat: {
            "item-metadata":[
                {
                    "rel":"urn:X-tsbiot:rels:isContentType",
                    "val":"application/vnd.tsbiot.catalogue+json"
                },
                {
                    "rel":"urn:X-tsbiot:rels:hasDescription:en",
                    "val":"homes catalogue"
                },
                {
                    "rel":"urn:X-smartstreets:rels:hasVisibility",
                    "val":"armhomes"
                }
            ],
            "items":[
                {
                    "href":"http://example.com/arm/homes/1",
                    "i-object-metadata":[
                        {
                            "rel":"urn:X-tsbiot:rels:hasDescription:en",
                            "val":"User 1 home"
                        },
                        {
                            "rel":"urn:X-smartstreets:rels:hasVisibility",
                            "val":"armhomes"
                        },
                        {
                            "rel":"urn:X-tsbiot:rels:isContentType",
                            "val":"application/vnd.tsbiot.resource+json"
                        }
                    ]
                },
                {
                    "href":"http://example.com/arm/homes/2",
                    "i-object-metadata":[
                        {
                            "rel":"urn:X-tsbiot:rels:hasDescription:en",
                            "val":"User 2 home"
                        },
                        {
                            "rel":"urn:X-smartstreets:rels:hasVisibility",
                            "val":"armhomes"
                        },
                        {
                            "rel":"urn:X-tsbiot:rels:isContentType",
                            "val":"application/vnd.tsbiot.resource+json"
                        }
                    ]
                }
            ]
        }
    }
];
function createKey(keydata, cb) {
    request.post({
        headers: {'content-type' : 'application/json'},
        url: urlbase_rootauth + '/permissions/' + keydata.secret,
        body: JSON.stringify(keydata.permset)
    }, function(error, response, body) {
        if (error)
            console.log(response.statusCode, error);
        if (response.statusCode != 200) {
            cb("Failed to createKey "+response.statusCode, null);
            return;
        }
        else {
            console.log("Created "+keydata.secret+" OK");
            cb(null, null);
            return;
        }
    });
}

function createCat(catdata, cb) {
    request.del({    // delete first
        url: urlbase_adminauth + catdata.url
    }, function(error, response, body) {
        console.log(response.statusCode, error);
        if ((response.statusCode < 200 || response.statusCode >= 300) && response.statusCode != 404) {
            cb("Failed to delete cat "+catdata.url+" "+JSON.stringify(catdata.cat), null);
            return;
        }
        request.post({  // post new
            headers: {'content-type' : 'application/json'},
            url: urlbase_adminauth + catdata.url,
            body: JSON.stringify(catdata.cat)
        }, function(error, response, body) {
            if (error)
                console.log(response.statusCode, error);
            if (response.statusCode < 200 || response.statusCode >= 300)
                cb("Failed to createCat "+catdata.url+" : "+JSON.stringify(catdata.cat), null);
            else {
                cb(null, null);
                return;
            }
        });
    });
}

async.map(keys, createKey, function(err, results) {
    if (err) {
        console.log(err);
        process.exit(1);
    } else {
        async.map(cats, createCat, function(err, results) {
            if (err) {
                console.log(err);
                process.exit(1);
            } else {
                console.log("done");
            }
        });
    }
});



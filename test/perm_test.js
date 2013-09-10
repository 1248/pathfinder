var should = require('should'); 
var assert = require('assert');
var request = require('supertest');  
var config = require('../lib/config');
var _ = require('underscore');
var util = require('../lib/util');

var urlbase_noauth = 'http'+(config.ssl.enabled ? 's' : '')+'://127.0.0.1:'+config.port;
var urlbase_rootauth = 'http'+(config.ssl.enabled ? 's' : '')+'://'+config.root_key+':@127.0.0.1:'+config.port;
var urlbase_keyauth = 'http://'+(config.ssl.enabled ? 's' : '')+''+'MYSECRETKEY'+':@127.0.0.1:'+config.port;
var urlbase_badkeyauth = 'http://'+(config.ssl.enabled ? 's' : '')+''+'NOTMYSECRETKEY'+':@127.0.0.1:'+config.port;

var cat = {   // minimal legal
    "item-metadata":[
        {
            "rel":"urn:X-tsbiot:rels:isContentType",
            "val":"application/vnd.tsbiot.catalogue+json"
        },
        {
            "rel":"urn:X-tsbiot:rels:hasDescription:en",
            "val":""
        }
    ],
    "items":[]
};

describe('should deny access to unauthed user', function() {
    it('get all', function(done) {
        request(urlbase_noauth)
            .get('/permissions')
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(401);
                done();
            });
    });
    it('get one', function(done) {
        request(urlbase_noauth)
            .get('/permissions/test')
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(401);
                done();
            });
    });
    it('post', function(done) {
        request(urlbase_noauth)
            .post('/permissions/test')
            .send({})
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(401);
                done();
            });
    });
    it('put', function(done) {
        request(urlbase_noauth)
            .put('/permissions/test')
            .send({})
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(404);
                done();
            });
    });
    it('del', function(done) {
        request(urlbase_noauth)
            .del('/permissions/test')
            .send({})
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(401);
                done();
            });
    });
});

describe('At startup', function() {
    it('should have empty perm list', function(done) {
        request(urlbase_rootauth)
            .get('/permissions')
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(200);
                res.body.should.eql([]);
                done();
            });
    });
    it('should should give 404 for any perms', function(done) {
            request(urlbase_rootauth)
                .get('/permissions/test')
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.should.have.status(404);
                    done();
                });
        });
});

describe('Create, update, delete permset', function() {
    it('create a permset', function(done) {
        var o = {rules:[{"fixme":123}]};
        var o2 = {rules:[{"different":345}]};
        request(urlbase_rootauth) // create
            .post('/permissions/test')
            .send(o)
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(200);

                request(urlbase_rootauth) // read back
                    .get('/permissions/test')
                    .end(function(err, res) {
                        if (err) {
                            throw err;
                        }
                        res.should.have.status(200);
                        res.body.should.eql(o);

                        request(urlbase_rootauth) // update
                            .post('/permissions/test')
                            .send(o2)
                            .end(function(err, res) {
                                if (err) {
                                    throw err;
                                }
                                res.should.have.status(200);

                                request(urlbase_rootauth) // read back
                                    .get('/permissions/test')
                                    .end(function(err, res) {
                                        if (err) {
                                            throw err;
                                        }
                                        res.should.have.status(200);
                                        res.body.should.eql(o2);

                                        request(urlbase_rootauth) // delete
                                            .del('/permissions/test')
                                            .end(function(err, res) {
                                                if (err) {
                                                    throw err;
                                                }
                                                res.should.have.status(204);

                                                request(urlbase_rootauth) // read back
                                                    .get('/permissions/test')
                                                    .end(function(err, res) {
                                                        if (err) {
                                                            throw err;
                                                        }
                                                        res.should.have.status(404);
                                                        done();
                                                    });
                                            });
                                    });
                            });
                    });
            });
    });
});

/*
Create a permset (ENSURE ROOT KEY)
Create a resource
Try to access with permset key
*/

describe('Test permset', function() {
    var permset = {
        rules: [
            {op:'MODIFY_CAT',rsrc:'/cats/bob',
                olditem:{match:{rel:'*',val:'*'}},
                newitem:{match:{rel:'*',val:'*'}},
                newcat:{match:{rel:'*',val:'*'}},
                oldcat:{match:{rel:'*',val:'*'}}
            },
            {op:'GET',rsrc:'/cats/bob',
                olditem:{match:{rel:'*',val:'*'}},
                newitem:{match:{rel:'*',val:'*'}},
                newcat:{match:{rel:'*',val:'*'}},
                oldcat:{match:{rel:'*',val:'*'}}
            },
            {op:'DELETE_CAT',rsrc:'/cats/bob',
                    olditem:{match:{rel:'*',val:'*'}},
                newitem:{match:{rel:'*',val:'*'}},
                newcat:{match:{rel:'*',val:'*'}},
                oldcat:{match:{rel:'*',val:'*'}}
            }
        ]
    };

    it('should allow creation of permset', function(done) {
        request(urlbase_rootauth)
            .post('/permissions/MYSECRETKEY')
            .send(permset)
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(200);
                done();
            });
    });
    it('should not allow creation of catalogue using bad key', function(done) {
        request(urlbase_badkeyauth)
            .post('/cats/bob')
            .send(cat)
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(401);
                done();
            });
    });
    it('should allow creation of catalogue using key', function(done) {
        request(urlbase_keyauth)
            .post('/cats/bob')
            .send(cat)
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(201);
                done();
            });
    });
    it('should not allow fetch of catalogue using bad key', function(done) {
        request(urlbase_badkeyauth)
            .get('/cats/bob')
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(401);
                done();
            });
    });
    it('should allow fetch of catalogue using key', function(done) {
        request(urlbase_keyauth)
            .get('/cats/bob')
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(200);
                res.body.should.eql(cat);
                done();
            });
    });
    it('should not allow delete of catalogue using badkey', function(done) {
        request(urlbase_badkeyauth)
            .del('/cats/bob')
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(401);
                done();
            });
    });
    it('should allow delete of catalogue using key', function(done) {
        request(urlbase_keyauth)
            .del('/cats/bob')
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(204);
                done();
            });
    });
});

var cat1 = {
   "item-metadata":[
        {
            "rel":"urn:X-tsbiot:rels:isContentType",
            "val":"application/vnd.tsbiot.catalogue+json"
        },
        {
            "rel":"urn:X-tsbiot:rels:hasDescription:en",
            "val":""
        }
    ],
    "items":[
        {
            "href":"HREF1",
            "i-object-metadata":[
                {
                    "rel":"urn:X-tsbiot:rels:hasDescription:en",
                    "val":"DESC1"
                },
                {
                    "rel":"RELA",
                    "val":"VALA"
                },
                {
                    "rel":"RELB",
                    "val":"VALB"
                }
            ]
        },
        {
            "href":"HREF2",
            "i-object-metadata":[
                {
                    "rel":"urn:X-tsbiot:rels:hasDescription:en",
                    "val":"DESC2"
                },
                {
                    "rel":"RELA",
                    "val":"VALA"
                }
            ]
        }
    ]
};

var filter_tests = [
    {
        permset:{
            rules: [
                {op:'DELETE_CAT',rsrc:'/cats/bob'},
                {op:'MODIFY_CAT',rsrc:'/cats/bob'},
                {
                    op:'GET',
                    rsrc:'/cats/bob', 
                    olditem:{
                        and:[
                            {match:{val:'DESC1'}},
                            {match:{val:'DESC2'}}
                        ]
                    },
                    oldcat:{match:{rel:'*',val:'*'}}
                }
            ]
        },
        cat: cat1,
        result:{
            "item-metadata":[
                {
                    "rel":"urn:X-tsbiot:rels:isContentType",
                    "val":"application/vnd.tsbiot.catalogue+json"
                },
                {
                    "rel":"urn:X-tsbiot:rels:hasDescription:en",
                    "val":""
                }
            ],
            "items":[
            ]
        }
    },
    {
        permset:{
            rules: [
                {op:'DELETE_CAT',rsrc:'/cats/bob'},
                {op:'MODIFY_CAT',rsrc:'/cats/bob'},
                {
                    op:'GET',
                    rsrc:'/cats/bob', 
                    olditem:{
                        match:{rel:'RELB'}
                    },
                    oldcat:{match:{rel:'*',val:'*'}}
                }
            ],
        },
        cat: cat1,
        result:{
            "item-metadata":[
                {
                    "rel":"urn:X-tsbiot:rels:isContentType",
                    "val":"application/vnd.tsbiot.catalogue+json"
                },
                {
                    "rel":"urn:X-tsbiot:rels:hasDescription:en",
                    "val":""
                }
            ],
            "items":[
                {
                    "href":"HREF1",
                    "i-object-metadata":[
                        {
                            "rel":"urn:X-tsbiot:rels:hasDescription:en",
                            "val":"DESC1"
                        },
                        {
                            "rel":"RELA",
                            "val":"VALA"
                        },
                        {
                            "rel":"RELB",
                            "val":"VALB"
                        }
                    ]
                }
            ]
        }
    },
    {
        permset:{
            rules: [
                {op:'DELETE_CAT',rsrc:'/cats/bob'},
                {op:'MODIFY_CAT',rsrc:'/cats/bob'},
                {
                    op:'GET',
                    rsrc:'/cats/bob', 
                    olditem:{
                        match:{val:'VALB'}
                    },
                    oldcat:{match:{rel:'*',val:'*'}}
                }
            ],
        },
        cat: cat1,
        result:{
            "item-metadata":[
                {
                    "rel":"urn:X-tsbiot:rels:isContentType",
                    "val":"application/vnd.tsbiot.catalogue+json"
                },
                {
                    "rel":"urn:X-tsbiot:rels:hasDescription:en",
                    "val":""
                }
            ],
            "items":[
                {
                    "href":"HREF1",
                    "i-object-metadata":[
                        {
                            "rel":"urn:X-tsbiot:rels:hasDescription:en",
                            "val":"DESC1"
                        },
                        {
                            "rel":"RELA",
                            "val":"VALA"
                        },
                        {
                            "rel":"RELB",
                            "val":"VALB"
                        }
                    ]
                }
            ]
        }
    },
    {
        permset:{
            rules: [
                {op:'DELETE_CAT',rsrc:'/cats/bob'},
                {op:'MODIFY_CAT',rsrc:'/cats/bob'},
                {
                    op:'GET',
                    rsrc:'/cats/bob', 
                    olditem:{
                        match:{val:'VALA'}
                    },
                    oldcat:{match:{rel:'*',val:'*'}}
                }
            ],
        },
        cat: cat1,
        result:{
            "item-metadata":[
                {
                    "rel":"urn:X-tsbiot:rels:isContentType",
                    "val":"application/vnd.tsbiot.catalogue+json"
                },
                {
                    "rel":"urn:X-tsbiot:rels:hasDescription:en",
                    "val":""
                }
            ],
            "items":[
                {
                    "href":"HREF1",
                    "i-object-metadata":[
                        {
                            "rel":"urn:X-tsbiot:rels:hasDescription:en",
                            "val":"DESC1"
                        },
                        {
                            "rel":"RELA",
                            "val":"VALA"
                        },
                        {
                            "rel":"RELB",
                            "val":"VALB"
                        }
                    ]
                },
                {
                    "href":"HREF2",
                    "i-object-metadata":[
                        {
                            "rel":"urn:X-tsbiot:rels:hasDescription:en",
                            "val":"DESC2"
                        },
                        {
                            "rel":"RELA",
                            "val":"VALA"
                        }
                    ]
                }
            ]
        }
    },
    {
        permset:{
            rules: [
                {op:'DELETE_CAT',rsrc:'/cats/bob'},
                {op:'MODIFY_CAT',rsrc:'/cats/bob'},
                {
                    op:'GET',
                    rsrc:'/cats/bob', 
                    olditem:{
                        match:{val:'VALA'}
                    },
                    oldcat:{match:{rel:'*',val:'*'}}
                }
            ],
        },
        cat: cat1,
        result:{
            "item-metadata":[
                {
                    "rel":"urn:X-tsbiot:rels:isContentType",
                    "val":"application/vnd.tsbiot.catalogue+json"
                },
                {
                    "rel":"urn:X-tsbiot:rels:hasDescription:en",
                    "val":""
                }
            ],
            "items":[
                {
                    "href":"HREF1",
                    "i-object-metadata":[
                        {
                            "rel":"urn:X-tsbiot:rels:hasDescription:en",
                            "val":"DESC1"
                        },
                        {
                            "rel":"RELA",
                            "val":"VALA"
                        },
                        {
                            "rel":"RELB",
                            "val":"VALB"
                        }
                    ]
                },
                {
                    "href":"HREF2",
                    "i-object-metadata":[
                        {
                            "rel":"urn:X-tsbiot:rels:hasDescription:en",
                            "val":"DESC2"
                        },
                        {
                            "rel":"RELA",
                            "val":"VALA"
                        }
                    ]
                }
            ]
        }
    },
    {
        permset:{
            rules: [
                {op:'DELETE_CAT',rsrc:'/cats/bob'},
                {op:'MODIFY_CAT',rsrc:'/cats/bob'},
                {
                    op:'GET',
                    rsrc:'/cats/bob', 
                    olditem:{
                        match:{val:'VALC'}
                    },
                    oldcat:{match:{rel:'*',val:'*'}}
                }
            ],
        },
        cat: cat1,
        result:{
            "item-metadata":[
                {
                    "rel":"urn:X-tsbiot:rels:isContentType",
                    "val":"application/vnd.tsbiot.catalogue+json"
                },
                {
                    "rel":"urn:X-tsbiot:rels:hasDescription:en",
                    "val":""
                }
            ],
            "items":[]
        }
    },
    {
        permset:{
            rules: [
                {op:'DELETE_CAT',rsrc:'/cats/bob'},
                {op:'MODIFY_CAT',rsrc:'/cats/bob'},
                {
                    op:'GET',
                    rsrc:'/cats/bob', 
                    olditem:{
                        match:{val:'RELC'}
                    },
                    oldcat:{match:{rel:'*',val:'*'}}
                }
            ]
        },
        cat: cat1,
        result:{
            "item-metadata":[
                {
                    "rel":"urn:X-tsbiot:rels:isContentType",
                    "val":"application/vnd.tsbiot.catalogue+json"
                },
                {
                    "rel":"urn:X-tsbiot:rels:hasDescription:en",
                    "val":""
                }
            ],
            "items":[]
        }
    },
    {
        permset:{
            rules: [
                {op:'DELETE_CAT',rsrc:'/cats/bob'},
                {op:'MODIFY_CAT',rsrc:'/cats/bob'},
                {
                    op:'GET',
                    rsrc:'/cats/bob', 
                    olditem:{
                        match:{rel:'RELA',val:'VALA'}
                    },
                    oldcat:{match:{rel:'*',val:'*'}}
                }
            ]
        },
        cat: cat1,
        result:{
            "item-metadata":[
                {
                    "rel":"urn:X-tsbiot:rels:isContentType",
                    "val":"application/vnd.tsbiot.catalogue+json"
                },
                {
                    "rel":"urn:X-tsbiot:rels:hasDescription:en",
                    "val":""
                }
            ],
            "items":[
                {
                    "href":"HREF1",
                    "i-object-metadata":[
                        {
                            "rel":"urn:X-tsbiot:rels:hasDescription:en",
                            "val":"DESC1"
                        },
                        {
                            "rel":"RELA",
                            "val":"VALA"
                        },
                        {
                            "rel":"RELB",
                            "val":"VALB"
                        }
                    ]
                },
                {
                    "href":"HREF2",
                    "i-object-metadata":[
                        {
                            "rel":"urn:X-tsbiot:rels:hasDescription:en",
                            "val":"DESC2"
                        },
                        {
                            "rel":"RELA",
                            "val":"VALA"
                        }
                    ]
                }
            ]
        }
    },
    {
        permset:{
            rules: [
                {op:'DELETE_CAT',rsrc:'/cats/bob'},
                {op:'MODIFY_CAT',rsrc:'/cats/bob'},
                {
                    op:'GET',
                    rsrc:'/cats/bob', 
                    olditem:{
                        match:{rel:'RELB',val:'VALB'}
                    },
                    oldcat:{match:{rel:'*',val:'*'}}
                }
            ]
        },
        cat: cat1,
        result:{
            "item-metadata":[
                {
                    "rel":"urn:X-tsbiot:rels:isContentType",
                    "val":"application/vnd.tsbiot.catalogue+json"
                },
                {
                    "rel":"urn:X-tsbiot:rels:hasDescription:en",
                    "val":""
                }
            ],
            "items":[
                {
                    "href":"HREF1",
                    "i-object-metadata":[
                        {
                            "rel":"urn:X-tsbiot:rels:hasDescription:en",
                            "val":"DESC1"
                        },
                        {
                            "rel":"RELA",
                            "val":"VALA"
                        },
                        {
                            "rel":"RELB",
                            "val":"VALB"
                        }
                    ]
                }
            ]
        }
    }
];


describe('Test permissions filtering', function() {
    var i;
    var test_filter = function(o, id) {
        it('should give filtered cat for filter_cat '+id, function(done) {

        request(urlbase_rootauth)   // create key
            .post('/permissions/MYSECRETKEY')
            .send(o.permset)
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(200);
                request(urlbase_keyauth)    // create catalogue
                    .post('/cats/bob')
                    .send(o.cat)
                    .end(function(err, res) {
                        if (err) {
                            throw err;
                        }
                        res.should.have.status(201);
                        request(urlbase_keyauth)    // get filtered cat
                            .get('/cats/bob')
                            .end(function(err, res) {
                                if (err) {
                                    throw err;
                                }
                                res.should.have.status(200);
                                if (!util.catEquals(res.body, o.result)) {
                                    console.log(res.body);
                                    console.log(o.result);
                                    throw new Error("Catalogues differ");
                                }
                                request(urlbase_keyauth)    // delete
                                    .del('/cats/bob')
                                    .end(function(err, res) {
                                        if (err) {
                                            throw err;
                                        }
                                        res.should.have.status(204);
                                        done();
                                    });
                            });
                    });
            });
        
        });
    };

    for (i=0;i<filter_tests.length;i++) {
        test_filter(filter_tests[i], "filter_tests "+i);
    }
});

var cat2 = {
    "item-metadata":[
        {
            "rel":"urn:X-tsbiot:rels:isContentType",
            "val":"application/vnd.tsbiot.catalogue+json"
        },
        {
            "rel":"urn:X-tsbiot:rels:hasDescription:en",
            "val":""
        },
        {
            "rel":"RELA",
            "val":"VALA"
        },
        {
            "rel":"RELB",
            "val":"VALB"
        }
    ],
    "items":[]
};

var get_oldcat_tests = [
    {
        permset:{
            rules: [
                {op:'DELETE_CAT',rsrc:'/cats/bob'},
                {op:'MODIFY_CAT',rsrc:'/cats/bob'},
                {
                    op:'GET',
                    rsrc:'/cats/bob', 
                    oldcat:{match:{rel:'*',val:'*'}}
                }
            ]
        },
        cat: cat2,
        expected: 200
    },
    {
        permset:{
            rules: [
                {op:'DELETE_CAT',rsrc:'/cats/bob'},
                {op:'MODIFY_CAT',rsrc:'/cats/bob'},
                {
                    op:'GET',
                    rsrc:'/cats/bob', 
                    oldcat:{
                        and:[
                            {match:{rel:'RELA', val:'VALA'}},
                            {match:{rel:'RELB', val:'VALB'}}
                        ]
                    }
                }
            ]
        },
        cat: cat2,
        expected: 200
    },
    {
        permset:{
            rules: [
                {op:'DELETE_CAT',rsrc:'/cats/bob'},
                {op:'MODIFY_CAT',rsrc:'/cats/bob'},
                {
                    op:'GET',
                    rsrc:'/cats/bob', 
                    oldcat:{
                        and:[
                            {match:{rel:'RELA', val:'VALA'}},
                            {match:{rel:'RELB', val:'VALC'}}
                        ]
                    }
                }
            ]
        },
        cat: cat2,
        expected: 401
    },
    {
        permset:{
            rules: [
                {op:'DELETE_CAT',rsrc:'/cats/bob'},
                {op:'MODIFY_CAT',rsrc:'/cats/bob'},
                {
                    op:'GET',
                    rsrc:'/cats/bob', 
                    oldcat:{
                        and:[
                            {match:{rel:'RELA', val:'VALA'}},
                            {match:{rel:'RELB', val:'VALC'}}
                        ]
                    }
                },
                {
                    op:'GET',
                    rsrc:'/cats/bob', 
                    oldcat:{
                        and:[
                            {match:{rel:'RELA', val:'VALA'}},
                            {match:{rel:'RELB', val:'VALB'}}
                        ]
                    }
                }
            ]
        },
        cat: cat2,
        expected: 200
    }

];


// GET + oldcat
describe('Test GET of catalogues with oldcat criteria', function() {
    var i;
    var test_get_oldcat = function(o, id) {
        it('should pass get_oldcat_tests '+id, function(done) {

        request(urlbase_rootauth)   // create key
            .post('/permissions/MYSECRETKEY')
            .send(o.permset)
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(200);
                request(urlbase_keyauth)    // create catalogue
                    .post('/cats/bob')
                    .send(o.cat)
                    .end(function(err, res) {
                        if (err) {
                            throw err;
                        }
                        res.should.have.status(201);
                        request(urlbase_keyauth)    // get filtered cat
                            .get('/cats/bob')
                            .end(function(err, res) {
                                if (err) {
                                    throw err;
                                }
                                res.should.have.status(o.expected);
                                request(urlbase_keyauth)    // delete
                                    .del('/cats/bob')
                                    .end(function(err, res) {
                                        if (err) {
                                            throw err;
                                        }
                                        res.should.have.status(204);
                                        done();
                                    });
                            });
                    });
            });
        
        });
    };

    for (i=0;i<get_oldcat_tests.length;i++) {
        test_get_oldcat(get_oldcat_tests[i], "get_oldcat_tests "+i);
    }
});

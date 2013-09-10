var should = require('should'); 
var assert = require('assert');
var request = require('supertest');  
var config = require('../lib/config');
var _ = require('underscore');
var util = require('../lib/util');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var urlbase_noauth = 'http'+(config.ssl.enabled ? 's' : '')+'://127.0.0.1:'+config.port;
var urlbase_rootauth = 'http'+(config.ssl.enabled ? 's' : '')+'://'+config.root_key+':@127.0.0.1:'+config.port;
var urlbase_keyauth = 'http'+(config.ssl.enabled ? 's' : '')+'://'+'MYSECRETKEY'+':@127.0.0.1:'+config.port;
var urlbase_badkeyauth = 'http'+(config.ssl.enabled ? 's' : '')+'://'+'NOTMYSECRETKEY'+':@127.0.0.1:'+config.port;

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

var insert_tests = [
    {
        permset:{
            rules: [
                {op:'GET',rsrc:'/cats/bob',olditem:{match:{rel:'*',val:'*'}}},
                {op:'DELETE_CAT',rsrc:'/cats/bob'},
                {op:'MODIFY_CAT',rsrc:'/cats/bob'},
                {
                    op:'MODIFY_ITEM',
                    rsrc:'/cats/bob', 
                    newitem:{
                        match:{rel:'*',val:'*'}
                    }
                }
            ]
        },
        item:{
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
        expect:201
    },
    {
        permset:{
            rules: [
                {op:'GET',rsrc:'/cats/bob',olditem:{match:{rel:'*',val:'*'}}},
                {op:'DELETE_CAT',rsrc:'/cats/bob'},
                {op:'MODIFY_CAT',rsrc:'/cats/bob'},
                {
                    op:'MODIFY_ITEM',
                    rsrc:'/cats/bob', 
                    newitem:{
                        match:{rel:'RELB'}
                    }
                }
            ]
        },
        item:{
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
        expect:201
    },
    {
        permset:{
            rules: [
                {op:'GET',rsrc:'/cats/bob',olditem:{match:{rel:'*',val:'*'}}},
                {op:'DELETE_CAT',rsrc:'/cats/bob'},
                {op:'MODIFY_CAT',rsrc:'/cats/bob'},
                {
                    op:'MODIFY_ITEM',
                    rsrc:'/cats/bob', 
                    newitem:{
                        match:{rel:'RELC'}
                    }
                }
            ]
        },
        item:{
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
        expect:401
    },
    {
        permset:{
            rules: [
                {op:'GET',rsrc:'/cats/bob',olditem:{match:{rel:'*',val:'*'}}},
                {op:'DELETE_CAT',rsrc:'/cats/bob'},
                {op:'MODIFY_CAT',rsrc:'/cats/bob'},
                {
                    op:'MODIFY_ITEM',
                    rsrc:'/cats/bob', 
                    newitem:{
                        match:{val:'VALA'}
                    }
                }
            ]
        },
        item:{
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
        expect:201
    },
    {
        permset:{
            rules: [
                {op:'GET',rsrc:'/cats/bob',olditem:{match:{rel:'*',val:'*'}}},
                {op:'DELETE_CAT',rsrc:'/cats/bob'},
                {op:'MODIFY_CAT',rsrc:'/cats/bob'},
                {
                    op:'MODIFY_ITEM',
                    rsrc:'/cats/bob', 
                    newitem:{
                        match:{val:'VALC'}
                    }
                }
            ]
        },
        item:{
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
        expect:401
    },
    {
        permset:{
            rules: [
                {op:'GET',rsrc:'/cats/bob',olditem:{match:{rel:'*',val:'*'}}},
                {op:'DELETE_CAT',rsrc:'/cats/bob'},
                {op:'MODIFY_CAT',rsrc:'/cats/bob'},
                {
                    op:'MODIFY_ITEM',
                    rsrc:'/cats/bob', 
                    newitem:{
                        match:{rel:'RELA',val:'VALA'}
                    }
                }
            ]
        },
        item:{
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
        expect:201
    },
    {
        permset:{
            rules: [
                {op:'GET',rsrc:'/cats/bob',olditem:{match:{rel:'*',val:'*'}}},
                {op:'DELETE_CAT',rsrc:'/cats/bob'},
                {op:'MODIFY_CAT',rsrc:'/cats/bob'},
                {
                    op:'MODIFY_ITEM',
                    rsrc:'/cats/bob', 
                    newitem:{
                        match:{rel:'RELA',val:'VALB'}
                    }
                }
            ]
        },
        item:{
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
        expect:401
    },
    {
        permset:{
            rules: [
                {op:'GET',rsrc:'/cats/bob',olditem:{match:{rel:'*',val:'*'}}},
                {op:'DELETE_CAT',rsrc:'/cats/bob'},
                {op:'MODIFY_CAT',rsrc:'/cats/bob'},
                {
                    op:'MODIFY_ITEM',
                    rsrc:'/cats/bob', 
                    newitem:{
                        and:{
                            match:{rel:'RELA',val:'VALA'},
                            match:{rel:'RELB',val:'VALB'}
                        }
                    }
                }
            ]
        },
        item:{
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
        expect:201
    },
    {
        permset:{
            rules: [
                {op:'GET',rsrc:'/cats/bob',olditem:{match:{rel:'*',val:'*'}}},
                {op:'DELETE_CAT',rsrc:'/cats/bob'},
                {op:'MODIFY_CAT',rsrc:'/cats/bob'},
                {
                    op:'MODIFY_ITEM',
                    rsrc:'/cats/bob', 
                    newitem:{
                        and:{
                            match:{val:'VALA'},
                            match:{val:'VALB'}
                        }
                    }
                }
            ]
        },
        item:{
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
        expect:201
    },
    {
        permset:{
            rules: [
                {op:'GET',rsrc:'/cats/bob',olditem:{match:{rel:'*',val:'*'}}},
                {op:'DELETE_CAT',rsrc:'/cats/bob'},
                {op:'MODIFY_CAT',rsrc:'/cats/bob'},
                {
                    op:'MODIFY_ITEM',
                    rsrc:'/cats/bob', 
                    newitem:{
                        or:{
                            match:{val:'VALA'},
                            match:{val:'VALC'}
                        }
                    }
                }
            ]
        },
        item:{
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
        expect:401
    }
];


describe('Test item insert permissions', function() {
    var i;
    var test_insert = function(o, id) {
        it('should pass test '+id, function(done) {

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
                    .send(cat)
                    .end(function(err, res) {
                        if (err) {
                            throw err;
                        }
                        res.should.have.status(201);
                        request(urlbase_keyauth)    // insert item
                            .post('/cats/bob?href=' + encodeURI(o.item.href))
                            .send(o.item)
                            .end(function(err, res) {
                                if (err) {
                                    throw err;
                                }
                                res.should.have.status(o.expect);
                                request(urlbase_keyauth)    // delete
                                    .del('/cats/bob')
                                    .end(function(err, res) {
                                        if (err) {
                                            throw err;
                                        }
                                        res.should.have.status(204);
                                        request(urlbase_rootauth)    // delete perm
                                            .del('/permissions/MYSECRETKEY')
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
        
        });
    };

    for (i=0;i<insert_tests.length;i++) {
        test_insert(insert_tests[i], "insert_tests "+i);
    }
});


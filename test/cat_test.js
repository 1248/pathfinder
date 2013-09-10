var should = require('should'); 
var assert = require('assert');
var request = require('supertest');  
var config = require('../lib/config');
var _ = require('underscore');
var util = require('../lib/util');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var urlbase_noauth = 'http'+(config.ssl.enabled ? 's' : '')+'://127.0.0.1:'+config.port;


var good_cats = [
    {   // minimal legal
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
    },
    {   // minimal legal one item
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
                "href":"http://www.google.com",
                "i-object-metadata":[
                    {
                        "rel":"urn:X-tsbiot:rels:hasDescription:en",
                        "val":""
                    }
                ]
            }
        ]
    },
    {   // eyehub "reference.json"
        "item-metadata":[
            {
                "rel":"urn:X-tsbiot:rels:isContentType",
                "val":"application/vnd.tsbiot.catalogue+json"
            },
            {
                "rel":"urn:X-tsbiot:rels:hasDescription:en",
                "val":"EyeHub example catalog of resources - May-2013"
            },
            {
                "rel":"urn:X-tsbiot:rels:supportsSearch",
                "val":"urn:X-tsbiot:search:simple"
            }
        ],
        "items":[
            {
                "href":"https://eyehubhost.com/data/eyehub1/dms/dm123/devices/d456",
                "i-object-metadata":[
                    {
                        "rel":"urn:X-tsbiot:rels:hasDescription:en",
                        "val":"Resource_49_BA_01_light_sensor"
                    },
                    {
                        "rel":"http://purl.oclc.org/NET/ssnx/ssn#SensingDevice",
                        "val":"http://dbpedia.org/page/Photoresistor"
                    },
                    {
                        "rel":"http://www.loa-cnr.it/ontologies/DUL.owl#hasLocation",
                        "val":"https://eyehubhost.com/data/eyehub1/lms/lmABC/locations/locXYZ"
                    }
                ]
            },
            {
                "href":"https://eyehubhost.com/data/eyehub1/lms/lmABC/locations/locXYZ",
                "i-object-metadata":[
                    {
                        "rel":"urn:X-tsbiot:rels:hasDescription:en",
                        "val":"CCSR Building, 1st Floor, Office BA-01"
                    },
                    {
                        "rel":"urn:X-tsbiot:rels:isContentType",
                        "val":"application/json"
                    },
                    {
                        "rel":"http://www.w3.org/2003/01/geo/wgs84_pos#long",
                        "val":"-0.57"
                    },
                    {
                        "rel":"http://www.w3.org/2003/01/geo/wgs84_pos#lat",
                        "val":"51.23"
                    },
                    {
                        "rel":"http://www.w3.org/2003/01/geo/wgs84_pos#alt",
                        "val":"45"
                    },
                    {
                        "rel":"http://www.loa-cnr.it/ontologies/DUL.owl#hasLocation",
                        "val":"http://www.geonames.org/2647793"
                    }
                ]
            }
        ]
    }
];

var bad_cats = [
    "", // empty string
    "hello world", // string
    [], // array
    {}, // empty object
    {   // just items
        "items":[]
    },
    {   // bare metadata
        "item-metadata":[],
        "items":[]
    },
    {   // no description
        "item-metadata":[
            {
                "rel":"urn:X-tsbiot:rels:isContentType",
                "val":"application/vnd.tsbiot.catalogue+json"
            }
        ],
        "items":[]
    },
    {   // no content type
        "item-metadata":[
            {
                "rel":"urn:X-tsbiot:rels:hasDescription:en",
                "val":""
            }
        ],
        "items":[]
    },
    {   // wrong content type
        "item-metadata":[
            {
                "rel":"urn:X-tsbiot:rels:isContentType",
                "val":"application/vcard+xml"
            },
            {
                "rel":"urn:X-tsbiot:rels:hasDescription:en",
                "val":""
            }
        ],
        "items":[]
    },
    {   // no items
        "item-metadata":[
            {
                "rel":"urn:X-tsbiot:rels:isContentType",
                "val":"application/vnd.tsbiot.catalogue+json"
            },
            {
                "rel":"urn:X-tsbiot:rels:hasDescription:en",
                "val":""
            }
        ]
    },
    {   // no i-object-metadata
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
                "href":"http://www.google.com"
            }
        ]
    },
    {   // empty i-object-metadata
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
                "href":"http://www.google.com",
                "i-object-metadata":[]
            }
        ]
    },
    {   // no description
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
                "href":"http://www.google.com",
                "i-object-metadata":[
                    {
                        "rel":"urn:X-tsbiot:rels:hasDescription:en"
                    }
                ]
            }
        ]
    },
    {   // no href
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
                "i-object-metadata":[
                    {
                        "rel":"urn:X-tsbiot:rels:hasDescription:en",
                        "val":""
                    }
                ]
            }
        ]
    },
    {   // empty rel
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
                "href":"http://www.google.com",
                "i-object-metadata":[
                    {
                        "rel":"urn:X-tsbiot:rels:hasDescription:en",
                        "val":""
                    },
                    {
                        "rel":"",
                        "val":"foo"
                    }
                ]
            }
        ]
    },
    {   // href as obj
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
                "href": {},
                "i-object-metadata":[
                    {
                        "rel":"urn:X-tsbiot:rels:hasDescription:en",
                        "val":""
                    }
                ]
            }
        ]
    }
];

var bad_cat_items = [
    "",             // empty string
    "hello world",  // non-empty string
    "{}",           // json in string
    [],             // array
    {},             // empty obj
    {   // just href
        "href":"http://www.google.com"
    },
    {   // missing any metadata
        "href":"http://www.google.com",
        "i-object-metadata":[]
    },
    {   // missing mandatory metadata
        "href":"http://www.google.com",
        "i-object-metadata":[
            {
                "rel":"urn:X-tsbiot:rels:somethingrandom",
                "val":""
            }
        ]
    },
    {   // missing val
        "href":"http://www.google.com",
        "i-object-metadata":[
            {
                "rel":"urn:X-tsbiot:rels:hasDescription:en",
            }
        ]
    }
];

var good_cat_items = [
    {
        "href":"http://www.google.com",
        "i-object-metadata":[
            {
                "rel":"urn:X-tsbiot:rels:hasDescription:en",
                "val":""
            }
        ]
    },
    {
        "href":"https://eyehubhost.com/data/eyehub1/dms/dm123/devices/d456",
        "i-object-metadata":[
            {
                "rel":"urn:X-tsbiot:rels:hasDescription:en",
                "val":"Resource_49_BA_01_light_sensor"
            },
            {
                "rel":"urn:X-tsbiot:rels:hasTag",
                "val":"light sensor 49,1st,BA,office"
            },
            {
                "rel":"http://purl.oclc.org/NET/ssnx/ssn#SensingDevice",
                "val":"http://dbpedia.org/page/Photoresistor"
            },
            {
                "rel":"http://www.w3.org/2003/01/geo/wgs84_pos#long",
                "val":"-0.57"
            },
            {
                "rel":"http://www.w3.org/2003/01/geo/wgs84_pos#lat",
                "val":"51.23"
            },
            {
                "rel":"http://www.w3.org/2003/01/geo/wgs84_pos#alt",
                "val":"45"
            },
            {
                "rel":"http://www.loa-cnr.it/ontologies/DUL.owl#hasLocation",
                "val":"http://www.geonames.org/2647793"
            }
        ]
    }
];

var good_subcat_names = ["/cats/cat", "/cats/foo", "/cats/FOO", "/cats/Foo", "/cats/foo1", "/cats/foo12bar", "/cats/123", "/cats/12345"];
var bad_subcat_names = ["/cats/foo_", "/cats/foo.", "/cats/foo.bar", "/cats/foo-", "/cats/foo bar", "/cats/ foobar"];

// base_cat = start point
// update = item to post
// result = expected catalogue
var modification_tests = [
    {
        "base_cat": // empty cat
            {
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
            },
        "update":   // an item to post
            {
                "href":"http://www.google.com",
                "i-object-metadata":[
                    {
                        "rel":"urn:X-tsbiot:rels:hasDescription:en",
                        "val":""
                    }
                ]
            },
        "result":   // item in cat
            {
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
                        "href":"http://www.google.com",
                        "i-object-metadata":[
                            {
                                "rel":"urn:X-tsbiot:rels:hasDescription:en",
                                "val":""
                            }
                        ]
                    }
                ]
            }
    },

    {
        "base_cat": // one item
            {
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
                        "href":"http://www.google.com",
                        "i-object-metadata":[
                            {
                                "rel":"urn:X-tsbiot:rels:hasDescription:en",
                                "val":""
                            }
                        ]
                    }
                ]
            },
        "update":   // update item
            {
                "href":"http://www.google.com",
                "i-object-metadata":[
                    {
                        "rel":"urn:X-tsbiot:rels:hasDescription:en",
                        "val":"new"
                    }
                ]
            },
        "result":   // expected
            {
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
                        "href":"http://www.google.com",
                        "i-object-metadata":[
                            {
                                "rel":"urn:X-tsbiot:rels:hasDescription:en",
                                "val":"new"
                            }
                        ]
                    }
                ]
            }
    },

    {
        "base_cat": // one item
            {
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
                        "href":"http://www.google.com",
                        "i-object-metadata":[
                            {
                                "rel":"urn:X-tsbiot:rels:hasDescription:en",
                                "val":""
                            }
                        ]
                    }
                ]
            },
        "update":   // add new item
            {
                "href":"http://www.bing.com",
                "i-object-metadata":[
                    {
                        "rel":"urn:X-tsbiot:rels:hasDescription:en",
                        "val":"BING!"
                    }
                ]
            },
        "result":   // expected
            {
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
                        "href":"http://www.google.com",
                        "i-object-metadata":[
                            {
                                "rel":"urn:X-tsbiot:rels:hasDescription:en",
                                "val":""
                            }
                        ]
                    },
                    {
                        "href":"http://www.bing.com",
                        "i-object-metadata":[
                            {
                                "rel":"urn:X-tsbiot:rels:hasDescription:en",
                                "val":"BING!"
                            }
                        ]
                    }
                ]
            }
    }


];

describe('Bad Catalogues', function() {
    var i;
    var test_cat_post = function(o, cat_id, id, expected_status, delete_after) {
        it('should give '+expected_status+' for cat '+id, function(done) {
            request(urlbase_noauth)
                .post(cat_id)
                .send(o)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.should.have.status(expected_status);
                    done();
                });
        });
    };

    for (i=0;i<bad_cats.length;i++) {
        test_cat_post(bad_cats[i], '/cats/subcat', "sub bad_cat "+i, 400, false);
        test_cat_post(bad_cats[i], '/cat', "root bad_cat "+i, 400, false);
    }
});

describe('Good Catalogues', function() {
    var i;
    var test_cat_post = function(o, cat_id, id, expected_status, delete_after) {
        it('should give '+expected_status+' for cat '+id, function(done) {
            request(urlbase_noauth)
                .post(cat_id)
                .send(o)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.should.have.status(expected_status);

                    request(urlbase_noauth) // read back
                        .get(cat_id)
                        .end(function(err, res) {
                            if (err) {
                                throw err;
                            }
                            res.should.have.status(200);
                            if (!util.catEquals(res.body, o)) {
                                console.log(res.body);
                                console.log(o);
                                throw new Error("Catalogues differ");
                            }

                            request(urlbase_noauth) // delete
                                .del(cat_id)
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
    };

    for (i=0;i<good_cats.length;i++) {
        test_cat_post(good_cats[i], '/cats/subcat', "sub good_cat "+i, 201, false);
        test_cat_post(good_cats[i], '/cat', "root good_cat "+i, 201, false);
    }
});

describe('Valid subcat names', function() {
    var i;
    var test_cat_post = function(o, cat_id, id, expected_status, delete_after) {
        it('should give '+expected_status+' for cat '+id, function(done) {
            request(urlbase_noauth)
                .post(cat_id)
                .send(o)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.should.have.status(expected_status);
                    if (delete_after) {
                        request(urlbase_noauth)
                            .del(cat_id)
                            .end(function(err, res) {
                                if (err) {
                                    throw err;
                                }
                                res.should.have.status(204);
                                done();
                            });
                    } else {
                        done();
                    }
                });
        });
    };

    for (i=0;i<good_subcat_names.length;i++) {
        test_cat_post(good_cats[0], good_subcat_names[i], "sub good_cat_name '"+good_subcat_names[i]+"'", 201, true);
    }
    for (i=0;i<bad_subcat_names.length;i++) {
        test_cat_post(good_cats[0], bad_subcat_names[i], "sub bad_cat_name '"+bad_subcat_names[i]+"'", 409, false);
    }
});


describe('At startup', function() {
    var i;
    it('should have non-existent root catalogue', function(done) {
        request(urlbase_noauth)
            .get('/cat')
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(404);
                done();
            });
    });
    it('should not allow delete of root catalogue', function(done) {
        request(urlbase_noauth)
            .del('/cat')
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(404);
                done();
            });
    });
    it('should have non-existent sub cat', function(done) {
        request(urlbase_noauth)
            .get('/cats/test')
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(404);
                done();
            });
    });
    it('should not allow delete of sub cat', function(done) {
        request(urlbase_noauth)
            .get('/cats/test')
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(404);
                done();
            });
    });
    it('should return not found for item in root cat', function(done) {
        request(urlbase_noauth)
            .get('/cat?href=dummy')
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(404);
                done();
            });
    });
    it('should return not found for item in sub cat', function(done) {
        request(urlbase_noauth)
            .get('/cat?href=dummy')
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(404);
                done();
            });
    });
    it('should return not found for post of valid item to root cat', function(done) {
        var item = good_cat_items[0];
        request(urlbase_noauth)
            .post('/cat?href=' + encodeURIComponent(item.href))
            .send(item)
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(404);
                done();
            });
    });
    it('should return not found for post of valid item to sub cat', function(done) {
        var item = good_cat_items[0];
        request(urlbase_noauth)
            .post('/cats/subcat?href=' + encodeURIComponent(item.href))
            .send(item)
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(404);
                done();
            });
    });
    it('should not allow PUT to create sub catalogue', function(done) {
        var cat = good_cats[0];
        request(urlbase_noauth)
            .put('/cats/subcat')
            .send(cat)
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(405);
                done();
            });
    });
});

describe('Bad subcat items', function(done) {
    before(function(done) {
        request(urlbase_noauth)
            .post('/cats/subcat')
            .send(good_cats[0])
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(201);
                done();
            });
    });

    after(function(done) {
        request(urlbase_noauth)
            .del('/cats/subcat')
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(204);
                done();
            });
    });

    var i;
    var test_cat_item_post = function(o, cat_id, id, expected_status, delete_after) {
        it('should give '+expected_status+' for cat '+id, function(done) {
            request(urlbase_noauth)
                .post(cat_id + '?href='+encodeURIComponent(o.href))
                .send(o)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.should.have.status(expected_status);
                    done();
                });
        });
    };

    for (i=0;i<bad_cat_items.length;i++) {
        test_cat_item_post(bad_cat_items[i], '/cats/subcat', "sub bad_cat_items "+i, 400, false);
        test_cat_item_post(bad_cat_items[i], '/cat', "root bad_cat_items "+i, 400, false);
    }
});

describe('Good sub cat items', function(done) {
    before(function(done) {
        request(urlbase_noauth)
            .post('/cats/subcat')
            .send(good_cats[0])
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(201);
                done();
            });
    });

    after(function(done) {
        request(urlbase_noauth)
            .del('/cats/subcat')
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(204);
                done();
            });
    });

    var i;
    var test_cat_item_post = function(o, cat_id, id, delete_after) {
        it('should give 201 for cat '+id, function(done) {
            request(urlbase_noauth)
                .post(cat_id + '?href='+encodeURIComponent(o.href))
                .send(o)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.should.have.status(201);
                    res.should.have.header('Location');
                    if (delete_after) {
                        request(urlbase_noauth)
                            .del(cat_id + '?href='+encodeURIComponent(o.href))
                            .end(function(err, res) {
                                if (err) {
                                    throw err;
                                }
                                res.should.have.status(200);    // the spec says this
                                done();
                            });
                    }
                });
        });
    };

    for (i=0;i<good_cat_items.length;i++) {
        test_cat_item_post(good_cat_items[i], '/cats/subcat', "sub good_cat_items "+i, true);
    }
});


describe('Catalogue updates', function() {
    var i;
    var test_modification = function(o, cat_id, id) {
        it('modification test '+id, function(done) {
            request(urlbase_noauth) // make cat
                .post(cat_id)
                .send(o.base_cat)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.should.have.status(201);
                    request(urlbase_noauth) // do update
                        .post(cat_id + '?href='+encodeURIComponent(o.update.href))
                        .send(o.update)
                        .end(function(err, res) {
                            if (err) {
                                throw err;
                            }
//                            res.should.have.status(204);  // FIXME can this be 201/200?
                            request(urlbase_noauth) // read back
                                .get(cat_id)
                                .end(function(err, res) {
                                    if (err) {
                                        throw err;
                                    }
                                    res.should.have.status(200);
                                    res.body.should.eql(o.result);
                                    request(urlbase_noauth) // delete
                                        .del(cat_id)
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

    for (i=0;i<modification_tests.length;i++) {
        test_modification(modification_tests[i], '/cats/subcat', i);
        test_modification(modification_tests[i], '/cat', i);
    }
});

describe('root_cat aliasing', function() {
    it('should alias root_cat and /cat', function(done) {
        var o = good_cats[0];
        request(urlbase_noauth)
            .post('/cats/'+config.root_cat)
            .send(o)
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                res.should.have.status(201);

                request(urlbase_noauth)
                    .get('/cat')
                    .end(function(err, res) {
                        if (err) {
                            throw err;
                        }
                        res.should.have.status(200);
                        res.body.should.eql(o);

                        request(urlbase_noauth)
                            .del('/cat')
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


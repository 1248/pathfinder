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
var pubsub = require('./pubsub');
var auth = require('./auth');
var expr = require('./expr');
var URI = require('URIjs');

function validateCatId(cat_id) {
    var re = /^[A-Za-z0-9]+$/g;
    var m = cat_id.match(re);
    if (m === null || m.length === 0)
        return null;
    else
        return cat_id;
}

function sanitize(doc) {
    delete doc._id;
    delete doc.cat_id;
    return doc;
}

function update_item(cat_id, href, item, cb) {
    var items = db.get().collection('items');
    item.cat_id = cat_id;
    items.update({href:href, cat_id:cat_id}, item, {safe: true, upsert: true}, function(err, doc) {
        if (err)
            cb("update failed");
        else {
            pubsub.get(function(err, pbs) {
                if (!err)
                    pbs.publish(item.cat_id+'/'+encodeURIComponent(item.href), sanitize(item));
            });
            cb(null);
        }
    });
}

function validateMetadataArray(metadataArray, checkContentType) {
    var hasDescription = false;
    var hasContentType = false;
    for (var i=0;i<metadataArray.length;i++) {
        if (typeof metadataArray[i] != 'object')
            return false;
        if (Object.keys(metadataArray[i]).length != 2)
            return false;
        if (typeof metadataArray[i].rel != 'string')
            return false;
        if (metadataArray[i].rel === "")
            return false;
        if (typeof metadataArray[i].val != 'string')
            return false;
        if (metadataArray[i].rel == 'urn:X-tsbiot:rels:hasDescription:en')
            hasDescription = true;
        if (metadataArray[i].rel == 'urn:X-tsbiot:rels:isContentType' &&
            metadataArray[i].val == 'application/vnd.tsbiot.catalogue+json')
            hasContentType = true;
    }
    if (!hasDescription)
        return false;
    if (checkContentType && !hasContentType)
        return false;

    return true;
}

function validateItem(item) {
    try {
        // a valid item must have href and a metadata array
        if (typeof item.href != 'string')
            return false;
        if (!(item['i-object-metadata'] instanceof Array))
            return false;
        if (!validateMetadataArray(item['i-object-metadata'], false))
            return false;
    } catch(e) { return false; }
    return true;
}

function validate_cat(cat) {
    try {
        var i;
        if (typeof cat != 'object')
            return false;
        if (!(cat.items instanceof Array))
            return false;
        if (!(cat['item-metadata'] instanceof Array))
            return false;
        if (!validateMetadataArray(cat['item-metadata'], true))
            return false;
        for (i=0;i<cat.items.length;i++) {
            if (!validateItem(cat.items[i]))
                return false;
        }
    } catch(e) { return false; }
    return true;
}

function filterSearch(req, docs, href, rel, val, mdata_name) {
    // FIXME, this is for clarity, not speed
    var ret = [];

    if (href === undefined && rel === undefined && val === undefined)
        return docs;

    for (var i=0;i<docs.length;i++) {
        var fullURL = req.protocol + "://" + req.get('host') + req.path;
        var abs_doc_href = URI(docs[i].href).absoluteTo(fullURL).toString();

        if (href !== undefined && (href == docs[i].href || abs_doc_href == href)) {
            ret.push(docs[i]);
            continue;
        }
        for (var j=0;j<docs[i]['i-object-metadata'].length;j++) {
            if (rel !== undefined && rel == docs[i]['i-object-metadata'][j].rel) {
                ret.push(docs[i]);
                continue;
            }
            if (val !== undefined && val == docs[i]['i-object-metadata'][j].val) {
                ret.push(docs[i]);
                continue;
            }
        }
    }
    return ret;
}

function cat_get(req, res, cat_id, transform) {
    auth.get('GET', req, function(err, perms) {
        if (err) {
            res.send(401, err);
        } else {
            items = db.get().collection('items');
            cats = db.get().collection('cats');
            var filter = {cat_id: cat_id};
            var f = function(cat_doc, req, res) {
                items.find(filter, function(err, cursor) {
                    if (err)
                        res.send(500);
                    else {
                        cursor.toArray(function(err, docs) {
                            // filter just what was asked for
                            docs = filterSearch(req, docs, req.query.href, req.query.rel, req.query.val, 'i-object-metadata');
                            var newdocs = [];
                            // filter just what is allowed, by all given perms
                            for (var x=0;x<perms.length;x++) {
                                for (var i=0;i<docs.length;i++) {
                                    if (expr.matchItem(perms[x].olditem, docs[i])) {
                                        newdocs.push(docs[i]);
                                    }
                                }
                            }
                            // construct a catalogue object
                            var cat = sanitize(cat_doc);
                            cat.items = _.map(newdocs, sanitize);
                            // mangle the cat representation if required
                            if (transform !== undefined)
                                res.send(200, transform(cat));
                            else
                                res.send(200, cat);
                        });
                    }
                });
            };

            cats.findOne(filter, function(err, cat_doc) {
                if (err)
                    res.send(500);
                else {
                    if (cat_doc === null)
                        res.send(404);
                    else {
                        var found = false;
                        for (var i=0;i<perms.length;i++) {
                            if (expr.matchCat(perms[i].oldcat, cat_doc)) {
                                f(cat_doc, req, res);
                                found = true;
                                break;
                            }
                        }
                        if (!found)
                            res.send(401, "Permission denied on catalogue");
                    }
                }
            });
        }
    });
}

exports.list = function(req, res) {
    // FIXME, /cats is not filtered according to permissions, neither items or cat
    auth.get('CAT_LIST', req, function(err, perms) {
        if (err)
            res.send(401);
        else {
            cats = db.get().collection('cats');
            cats.find({}, function(err, cursor) {
                if (err)
                    res.send(500);
                else {
                    var cat = {
                        "item-metadata":[
                            {
                                "rel":"urn:X-tsbiot:rels:isContentType",
                                "val":"application/vnd.tsbiot.catalogue+json"
                            },
                            {
                                "rel":"urn:X-tsbiot:rels:hasDescription:en",
                                "val":"all catalogues"
                            }
                        ],
                        "items":[]
                    };
                    cursor.toArray(function(err, docs) {
                        for (var i=0;i<docs.length;i++) {
                            var item = {};
                            item.href = "/cats/"+docs[i].cat_id;
                            item['i-object-metadata'] = docs[i]['item-metadata'];
                            cat.items.push(item);
                        }
                        // filter just what was asked for
                        // FIXME, this should be done long before this point
                        var filtered_items = filterSearch(req, cat.items, req.query.href, req.query.rel, req.query.val, 'i-object-metadata');
                        cat.items = filtered_items;
                        res.send(200, cat);
                    });
                }
            });
        }
    });
};

exports.get = function(req, res) {
    var cat_id = validateCatId(req.params.cat_id);
    if (cat_id === null) {
        res.send(409);  // bad cat name
        return;
    }
    return cat_get(req, res, cat_id);
};

function metadata_find(mdata, rel) {
    for (i=0;i<mdata.length;i++) {
        if (mdata[i].rel == rel)
            return mdata[i].val;
    }
    return null;
}

exports.core_root_get = function(req, res) {
/*
Example from http://tools.ietf.org/html/draft-bormann-core-links-json-02
application/link-format+json
[
    {
        "href":"/sensors",
        "ct":"40",
        "title":"Sensor Index"
    },
    {
        "href":"/sensors/temp",
        "rt":"temperature-c",
        "if":"sensor"
    },
    {
        "href":"/sensors/light",
        "rt":"light-lux",
        "if":"sensor"
    },
    {
        "href":"http://www.example.com/sensors/t123",
        "anchor":"/sensors/temp",
        "rel":"describedby"
    },
    {
        "href":"/t",
        "anchor":"/sensors/temp",
        "rel":"alternate"
    }
]
*/
    res.setHeader('Content-Type', 'application/link-format+json');
    return cat_get(req, res, config.root_cat, function(cat){
        // basic translation to draft-bormann-core-links-json-02
        var rd = [];

        var trans_f = function(mdata, mdata_name, rd, rd_name) {
            var val = metadata_find(mdata, mdata_name);
            if (val !== null) {
                rd[rd_name] = val;
            }
        };

        for (var i=0;i<cat.items.length;i++) {
            var rditem = {};
            var val;
            var mdata = cat.items[i]['i-object-metadata'];
            rditem.href = cat.items[i].href;
            if (null !== (val = metadata_find(mdata, 'urn:X-tsbiot:rels:hasDescription:en')))
                rditem.title = val;
            // speculative mapping of CoRE to urn namespace
            if (null !== (val = metadata_find(mdata, 'urn:X-CoRE:rd:rt')))
                rditem.rt = val;
            if (null !== (val = metadata_find(mdata, 'urn:X-CoRE:rd:if')))
                rditem.if = val;
            if (null !== (val = metadata_find(mdata, 'urn:X-CoRE:rd:ct')))
                rditem.ct = val;
            if (null !== (val = metadata_find(mdata, 'urn:X-CoRE:rd:sz')))
                rditem.ct = val;

            // for every raw mdata, write an item with href,anchor,rel
            for (var m=0;m<mdata.length;m++) {
                var rd_anchor = {};
                rd_anchor.anchor = cat.items[i].href;
                rd_anchor.href = mdata[m].val;
                rd_anchor.rel = mdata[m].rel;
                rd.push(rd_anchor);
            }

            rd.push(rditem);
        }
        return rd;
    });
};


function create_cat(cat_id, cat_doc, cb) {
    cats = db.get().collection('cats');
    cat_doc.cat_id = cat_id;

    cats.ensureIndex({cat_id:1}, {unique:true}, function(err, indexName) {
        if (err)
            cb("duplicate catalogue", null);
        else {
            cats.insert(cat_doc, {w:1}, function(err, rspdoc) {
                pubsub.get(function(err, pbs) {
                    if (!err)
                        pbs.publish(cat_id, sanitize(cat_doc));
                });
                if (err)
                    cb("apikey_create insert fail", null);
                else {
                    var i;
                    var remaining = cat_doc.items.length;
                    if (cat_doc.items.length === 0) {
                        cb(null);
                        return;
                    }   // add all of the items
                    var f = function(err2) {
                        if (err2) {
                            cb(err2);
                            remaining = 0;
                        } else {
                            remaining--;
                            if (remaining === 0)
                                cb(null);   // done
                        }
                    };
                    for (i=0;i<cat_doc.items.length;i++) {
                        if (remaining > 0) {
                            update_item(cat_id, cat_doc.items[i].href, cat_doc.items[i], f);
                        }
                    }
                }
            });
        }
    });
}


function put_post(req, res, cat_id, isPut) {
    if (req.query.href === undefined) {
        if (isPut === true) {
            res.send(405);
            return;
        } else {
            console.log("MODIFY_CAT");
            auth.get('MODIFY_CAT', req, function(err, perms) {
                if (err)
                    res.send(401, err);
                else {
                    if (!validate_cat(req.body)) {
                        res.send(400, "invalid cat");
                    } else {
                        // FIXME FIXME, check permissions against new catalogue
                        // FIXME FIXME, check permissions against each new item
                        create_cat(cat_id, req.body, function(err, doc) {
                            if (err)
                                res.send(409);  // conflict
                            else
                                res.send(201);  // created
                        });
                    }
                }
            });
        }
    } else {
        console.log("MODIFY_ITEM");
        auth.get('MODIFY_ITEM', req, function(err, perms) {
            if (err)
                res.send(401);
            else {
                if (!validateItem(req.body)) {
                    res.send(400);  // bad request
                } else {
                    // of the perms list we got, do any allow this to be done?
                    var allowed = false;
                    for (i=0;i<perms.length;i++) {
                        if (expr.matchItem(perms[i].newitem, req.body)) {
                            allowed = true;
                            break;
                        }
                    }
                    if (!allowed)
                        res.send(401, "No matching perm expr");
                    else {
                        items = db.get().collection('items');
                        cats = db.get().collection('cats');
                        // look for the catalogue
                        cats.findOne({cat_id:cat_id}, function(err, cat_doc) {
                            if (err)
                                res.send(500);
                            else
                            if (cat_doc === null)
                                res.send(404);
                            else {
                                update_item(cat_id, req.query.href, req.body, function(err) {
                                    if (err) {
                                        res.send(409, err);  // conflict
                                    } else {
                                        res.location(cat_id);
                                        res.send(201);  // created
                                    }
                                });
                            }
                        });
                    }
                }
            }
        });
    }
}

exports.post = function(req, res) {
    var cat_id = validateCatId(req.params.cat_id);
    if (cat_id === null) {
        res.send(409);  // bad cat name
        return;
    }
    return put_post(req, res, cat_id, false);
};

exports.put = function(req, res) {
    var cat_id = validateCatId(req.params.cat_id);
    if (cat_id === null) {
        res.send(409);  // bad cat name
        return;
    }
    return put_post(req, res, cat_id, true);
};


function cat_delete(req, res, cat_id) {
    auth.get('DELETE_CAT', req, function(err, perms) {
        if (err)
            res.send(401, err);
        else {
            cats = db.get().collection('cats');
            items = db.get().collection('items');
            var filter = {cat_id: cat_id};
            cats.findOne(filter, function(err, doc) {
                if (err)
                    res.send(500);
                else {
                    if (doc === null)
                        res.send(404);  // not found
                    else {
                        cats.remove(filter, function(err, doc) {
                            if (err)
                                res.send(500);  // something went wrong FIXME
                            else {
                                pubsub.get(function(err, pbs) {
                                    if (!err)
                                        pbs.publish(cat_id, "");
                                });
                                items.remove(filter, function(err, rspdoc) {
                                    if (err)
                                        res.send(500);  // something went wrong, FIXME
                                    else
                                        res.send(204);  // no content
                                });
                            }
                        });
                    }
                }
            });
        }
    });
}


function cat_delete_item(req, res, cat_id) {
    auth.get('DELETE_ITEM', req, function(err, perms) {
        if (err)
            res.send(401);
        else {
            items = db.get().collection('items');
            var filter = {cat_id:cat_id, href:req.query.href};
            items.remove(filter, function(err, doc) {
                if (err)
                    res.send(500);  // not found, FIXME?
                else {
                    pubsub.get(function(err, pbs) {
                        if (!err)
                            pbs.publish(cat_id+'/'+encodeURIComponent(req.query.href), "");
                    });
                    res.send(200);
                }
            });
        }
    });
}

function cat_getevents(req, res, cat_id) {
    auth.get('EVENTS', req, function(err, perms) {
        if (err)
            res.send(401);
        else {
            res.header('Content-Type', 'text/event-stream');
            res.header('Cache-Control', 'no-cache');
            res.header('Connection', 'keep-alive');
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Credentials', 'true');
            pubsub.get(function(err, pbs) {
                var subbed = function () {
                    console.log("SUBBED");
                    res.on('close', function() {
                    // FIXME
                    //            pbs.unsubscribe("*", function(){});
                    console.log("CLOSE");
                    });
                };

                pbs.subscribe(cat_id, function(topic, msg) {
                    res.write('id: '+(new Date()).toLocaleTimeString()+'\n');
                    res.write('event: '+topic+'\n');
                    res.write('data: ' +JSON.stringify(msg)+ '\n\n');
                }, subbed);

                pbs.subscribe(cat_id+'/*', function(topic, msg) {
                    res.write('id: '+(new Date()).toLocaleTimeString()+'\n');
                    res.write('event: '+topic+'\n');
                    res.write('data: ' +JSON.stringify(msg)+ '\n\n');
                }, subbed);
            });
        }
    });
}


exports.delete = function(req, res) {
    var cat_id = validateCatId(req.params.cat_id);
    if (cat_id === null) {
        res.send(409);  // bad cat name
        return;
    }

    if (req.query.href === undefined)
        return cat_delete(req, res, cat_id);
    else
        return cat_delete_item(req, res, cat_id);
};


exports.getevents = function(req, res) {
    var cat_id = validateCatId(req.params.cat_id);
    if (cat_id === null) {
        res.send(409);  // bad cat name
        return;
    }
    return cat_getevents(req, res, cat_id);
};

exports.root_get = function(req, res) {
    return cat_get(req, res, config.root_cat);
};

exports.root_post = function(req, res) {
    return put_post(req, res, config.root_cat, false);
};

exports.root_put = function(req, res) {
    return put_post(req, res, config.root_cat, true);
};

exports.root_delete = function(req, res) {
    if (req.query.href === undefined)
        return cat_delete(req, res, config.root_cat);
    else
        return cat_delete_item(req, res, config.root_cat);
};

exports.root_getevents = function(req, res) {
    return cat_getevents(req, res, config.root_cat);
};


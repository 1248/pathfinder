Pathfinder Quickstart
=====================

For the most up to date documentation, please see http://wiki.1248.io/doku.php?id=pathfinder

Pre-requisites
--------------

Install node.js, redis and mongodb.

    apt-get install nodejs redis mongodb


Install node dependencies
-------------------------

    npm install

Configure Pathfinder
--------------------

Edit lib/config.js, this contains the Pathfinder static configuration.
For a demo system, no changes need to be made.

port: HTTP/HTTPS listening port (default 8001)
ssl.enabled: If true, HTTPS is used, else HTTP
htdocs: Directory for static web server files (default ../htdocs (relative to lib/))
root_cat: name of catalogue supplying /cat (default root, ie. /cat == /cats/root)
mongo: Mongo server location and credentials
default_perms: Permission set applied when no authentication is provided
root_perms: Permission set applied when root key is provided
root_key: Authentication token for root user (when used, applies root_perms)
pubsub: Port and type for messaging server (default local redis, AMQP supported)


Try it out
----------

Observe that /cat does not exist (404 error returned)

    curl -v http://localhost:8001/cat


Create an empty catalogue (no authentication key, Pathfinder will apply default_perms)

    curl -v http://localhost:8001/cats/root -XPOST --header "Content-Type: application/json" --data '{"item-metadata":[{"rel":"urn:X-tsbiot:rels:isContentType","val":"application/vnd.tsbiot.catalogue+json"},{"rel":"urn:X-tsbiot:rels:hasDescription:en","val":""}],"items":[]}'


Read back the empty catalogue (/cat is an alias for /cats/root, they can be used interchangably)

    curl -v http://localhost:8001/cat


Insert a new item into the catalogue (Pathfinder does not validate URLs, so "myURL" is legal)

    curl -v http://localhost:8001/cat?href=myURL -XPOST --header "Content-Type: application/json" --data '{"href":"myURL", "i-object-metadata":[{"rel":"urn:X-tsbiot:rels:hasDescription:en","val":""}]}'


Read back the catalogue, which now contains our one item

    curl -v http://localhost:8001/cat


Delete the item from the catalogue

    curl -v -XDELETE http://localhost:8001/cat?href=myURL


Read back the catalogue, which is now empty again

    curl -v http://localhost:8001/cats/root


Create and test a permission set
--------------------------------

Pathfinder security is implemented through permission sets. Every permission set linked with a secret key. When the key is presented to Pathfinder with a request, the associated permission set is checked to see if the request is allowed.
Only the root user may create, delete or modify permission sets.

Create a permission set allowing a limited set of operations. This set allows the user to GET any/all items from catalogues containing the metadata "isOwnedBy" "test".

    curl -v -u "LETMEIN:" http://localhost:8001/permissions/SUPERSECRETCODE -XPOST --header "Content-Type: application/json" --data '{"rules":[{"op":"GET","rsrc":"*","olditem":{"match":{"rel":"*","val":"*"}},"oldcat":{"match":{"rel":"isOwnedBy","val":"test"}}}]}'


Read back permission keys present in Pathfinder

    curl -v -u "LETMEIN:" http://localhost:8001/permissions


Create a catalogue, which cannot be read with "SUPERSECRETCODE" (as it does not contain the metadata relation isOwnedBy=test)

    curl -v http://localhost:8001/cats/test -XPOST --header "Content-Type: application/json" --data '{"item-metadata":[{"rel":"urn:X-tsbiot:rels:isContentType","val":"application/vnd.tsbiot.catalogue+json"},{"rel":"urn:X-tsbiot:rels:hasDescription:en","val":""}],"items":[]}'
    curl -v http://localhost:8001/cats/test?href=myURL -XPOST --header "Content-Type: application/json" --data '{"href":"myURL", "i-object-metadata":[{"rel":"urn:X-tsbiot:rels:hasDescription:en","val":""}]}'


Observe that SUPERSECRETCODE is not allowed to read the catalogue

    curl -v -u "SUPERSECRETCODE:" http://localhost:8001/cats/test


But, the default permissions do still allow access

    curl -v http://localhost:8001/cats/test


Modify the catalogue so that SUPERSECRETCODE is allowed access

    curl -v -XDELETE http://localhost:8001/cats/test
    curl -v http://localhost:8001/cats/test -XPOST --header "Content-Type: application/json" --data '{"item-metadata":[{"rel":"urn:X-tsbiot:rels:isContentType","val":"application/vnd.tsbiot.catalogue+json"},{"rel":"urn:X-tsbiot:rels:hasDescription:en","val":""},{"rel":"isOwnedBy","val":"test"}],"items":[]}'
    curl -v http://localhost:8001/cats/test?href=myURL -XPOST --header "Content-Type: application/json" --data '{"href":"myURL", "i-object-metadata":[{"rel":"urn:X-tsbiot:rels:hasDescription:en","val":""}]}'


Observe that SUPERSECRETCODE is now allowed to read the catalogue

    curl -v -u "SUPERSECRETCODE:" http://localhost:8001/cats/test



Permission sets
===============

Below is an example permission set.

    {
        "rules":[
            {
                "op":"GET",
                "rsrc":"*",
                "olditem":{
                    "match":{"rel":"*","val":"*"}
                },
                "oldcat":{
                    "match":{"rel":"isOwnedBy","val":"test"}}
                }
        ]
    }


Every request made to Pathfinder is validated against a permission set.

Every permission set contains an array of rules.

If at least one rule matches the request, it is allowed. If no rules match, the request is not allowed.

Each rule can match one "op". Each op is a type of request. Currently defined ops include "GET" (fetch a catalogue or item), "MODIFY_ITEM" (modify an existing item), "MODIFY_CAT" (modify an existing catalogue), "DELETE_CAT" and "DELETE_ITEM". The op may be a wildcard "*".

Each rule applies to a single "rsrc", this is the path of the resource being accessed, eg. "/cats/test". The rsrc may also be a wildcard "*".

Each rule has an expression used to match against the existing catalogue, the existing item, the new catalogue or the new item, these are referred to as oldcat, olditem, newcat and newitem. For example, when creating a catalogue the "newcat" expression is used, but when modifying an existing catalogue both "oldcat" and "newcat" expressions are checked against old and new catalogues respectively.

Each expression is used to check if the metadata for a catalogue or item contains given fields. Every expression is an object.
The simplest expression is a simple match against a rel/val pair. The following will match if any metadata in the target contains the relation foo=bar.

    {"match":{"rel":"foo","val":"bar"}}

Both val or rel fields may be the "*" wildcard.
More complex expressions can be built up using boolean operators to nest expressions.

    {"not": <expr>}
    {"or": [<expr1>,<expr2>,...]}
    {"and": [<expr1>,<expr2>,...]}


The following example would match any collection of metadata containing (foo=bar AND baz=quux) OR fred=wilma.

    {
        "or":[
            "and":[
                {"match":{"rel":"foo","val":"bar"}},
                {"match":{"rel":"baz","val":"quux"}},
            ],
            {"match":{"rel":"fred","val":"wilma"}}
        ]
    }



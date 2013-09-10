Pathfinder
==========

A dynamic HyperCat catalogue server with the following features:

 * Hosting of multiple catalogues /cats/
 * Aliasing of /cat to a catalogue in /cats
 * Read/insert/modify of items
 * Basic Auth for authentication
 * Search of catalogue (urn:X-tsbiot:search:simple)
 * Rich permissions system to set access and visibility rights based on catalogue/item metadata properties
 * Mapping of /cat to draft-bormann-core-links-json-02 on /.well-known/core

See http://wiki.1248.io/doku.php?id=pathfinder for more information.

Prerequisites
-------------

The server relies on mongodb for persistent storage and redis for realtime event handling.

    apt-get install mongodb redis

Running
-------

    npm install
    npm start

Access http://localhost:8001

Automated Tests
---------------

The automated test suite may be run with

    npm test


Wiping the catalogue
--------------------

For test purposes, the catalogue may be wiped with

    node tools/dropdb.js





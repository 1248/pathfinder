/*
var should = require('should'); 
var assert = require('assert');
var request = require('supertest');  
var config = require('../lib/config');
var _ = require('underscore');
var auth = require('../lib/auth');

var perm_tests = [
    {
        permset: {
            rules: [
                {
                    op: 'GET',
                    rsrc: '*'
                }
            ]
        },
        tests: [
            {
                expect: true,
                op:'GET',
                rsrc:'/foo/bar'
            },
            {
                expect: false,
                op: 'POST',
                rsrc:'/foo/bar'
            },
            {
                expect: false,
                op: 'WIBBLE',
                rsrc:'/foo/bar'
            },
            {
                expect: true,  // no resource given, but allows any
                op: 'GET'
            }
        ]
    },

    {
        permset: {
            rules: [
                {
                    op: 'GET',
                    rsrc: '*'
                },
                {
                    op: 'POST',
                    rsrc: '*'
                }
            ]
        },
        tests: [
            {
                expect: true,
                op:'GET',
                rsrc:'/foo/bar'
            },
            {
                expect: true,
                op: 'POST',
                rsrc:'/foo/bar'
            },
            {
                expect: false,
                op: 'WIBBLE',
                rsrc:'/foo/bar'
            }
        ]
    },

    {
        permset: {
            rules: [
                {
                    op: 'GET',
                    rsrc: '/gettable'
                },
                {
                    op: 'POST',
                    rsrc: '/posttable'
                },
                {
                    op: '*',
                    rsrc: '/anyable'
                }
            ]
        },
        tests: [
            {
                expect: true,
                op:'GET',
                rsrc:'/gettable'
            },
            {
                expect: true,
                op: 'POST',
                rsrc:'/posttable'
            },
            {
                expect: true,
                op: 'WIBBLE',
                rsrc:'/anyable'
            },
            {
                expect: true,
                op: 'GET',
                rsrc:'/anyable'
            },
            {
                expect: true,
                op: 'POST',
                rsrc:'/anyable'
            },
            {
                expect: false,
                op:'POST',
                rsrc:'/gettable'
            },
            {
                expect: false,
                op: 'GET',
                rsrc:'/posttable'
            }
        ]
    },

    {
        permset: {
            rules: [
                {
                    op: 'WIBBLE',
                    rsrc: '*'
                }
            ]
        },
        tests: [
            {
                expect: true,
                op:'WIBBLE',
                rsrc:'/something'
            },
            {
                expect: true,
                op: 'WIBBLE',
                rsrc:'/somethingelse'
            },
            {
                expect: false,
                op: 'GET',
                rsrc:'/something'
            }
        ]
    }

];

describe('permission sets', function() {
    var f = function(permset, id, tests) {
        it('Permset testing '+id, function(done) {
            for (var t=0;t<tests.length;t++) {
                var pass = auth.validateRequest(permset, tests[t].op, tests[t].rsrc) != -1;
                if (pass != tests[t].expect)
                    throw new Error('Permission set err set '+id+' test '+t);
            }
            done();
        });
    };

    for (var i=0;i<perm_tests.length;i++) {
        f(perm_tests[i].permset, i, perm_tests[i].tests);
    }
});
*/


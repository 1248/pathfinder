var should = require('should'); 
var assert = require('assert');
var config = require('../lib/config');
var _ = require('underscore');
var expr = require('../lib/expr');

var tests = [
    // positive matching of rel single, val single and pair
    {
        mdata:[
            {rel: 'RELA', val: 'VALA'},
            {rel: 'RELB', val: 'VALB'}
        ],
        expr:{
            match: {rel:'RELA'}
        },
        expect: true
    },
    {
        mdata:[
            {rel: 'RELA', val: 'VALA'},
            {rel: 'RELB', val: 'VALB'}
        ],
        expr:{
            match: {rel:'RELB'}
        },
        expect: true
    },
    {
        mdata:[
            {rel: 'RELA', val: 'VALA'},
            {rel: 'RELB', val: 'VALB'}
        ],
        expr:{
            match: {val:'VALA'}
        },
        expect: true
    },
    {
        mdata:[
            {rel: 'RELA', val: 'VALA'},
            {rel: 'RELB', val: 'VALB'}
        ],
        expr:{
            match: {rel:'RELA'}
        },
        expect: true
    },
    {
        mdata:[
            {rel: 'RELA', val: 'VALA'},
            {rel: 'RELB', val: 'VALB'}
        ],
        expr:{
            match: {rel:'RELA', val:'VALA'}
        },
        expect: true
    },
    {
        mdata:[
            {rel: 'RELA', val: 'VALA'},
            {rel: 'RELB', val: 'VALB'}
        ],
        expr:{
            match: {rel:'RELB', val:'VALB'}
        },
        expect: true
    },
    // negative matching of rel single, val single and pair 
    {
        mdata:[
            {rel: 'RELA', val: 'VALA'},
            {rel: 'RELB', val: 'VALB'}
        ],
        expr:{
            match: {rel:'RELC'}
        },
        expect: false
    },
    {
        mdata:[
            {rel: 'RELA', val: 'VALA'},
            {rel: 'RELB', val: 'VALB'}
        ],
        expr:{
            match: {val:'VALC'}
        },
        expect: false
    },
    {
        mdata:[
            {rel: 'RELA', val: 'VALA'},
            {rel: 'RELB', val: 'VALB'}
        ],
        expr:{
            match: {rel:'RELC',val:'VALA'}
        },
        expect: false
    },
    {
        mdata:[
            {rel: 'RELA', val: 'VALA'},
            {rel: 'RELB', val: 'VALB'}
        ],
        expr:{
            match: {rel:'RELA',val:'VALC'}
        },
        expect: false
    },
    {
        mdata:[
            {rel: 'RELA', val: 'VALA'},
            {rel: 'RELB', val: 'VALB'}
        ],
        expr:{
            match: {rel:'RELA',val:'VALB'}
        },
        expect: false
    },
    {
        mdata:[
            {rel: 'RELA', val: 'VALA'},
            {rel: 'RELB', val: 'VALB'}
        ],
        expr:{
            match: {rel:'RELB',val:'VALA'}
        },
        expect: false
    },
    {
        mdata:[
            {rel: 'RELA', val: 'VALA'},
            {rel: 'RELB', val: 'VALB'}
        ],
        expr:{
            match: {rel:'RELC',val:'VALC'}
        },
        expect: false
    },

    // not operator
    {
        mdata:[
            {rel: 'RELA', val: 'VALA'},
            {rel: 'RELB', val: 'VALB'}
        ],
        expr:{
            not: {match: {rel:'RELA'}}
        },
        expect: false
    },
    {
        mdata:[
            {rel: 'RELA', val: 'VALA'},
            {rel: 'RELB', val: 'VALB'}
        ],
        expr:{
            not: {match: {rel:'RELC',val:'VALC'}}
        },
        expect: true
    },

    // and operator
    {
        mdata:[
            {rel: 'RELA', val: 'VALA'},
            {rel: 'RELB', val: 'VALB'}
        ],
        expr:{
            and: [
                {match: {rel:'RELA'}},
                {match: {rel:'RELB'}}
            ]
        },
        expect: true
    },
    {
        mdata:[
            {rel: 'RELA', val: 'VALA'},
            {rel: 'RELB', val: 'VALB'}
        ],
        expr:{
            and: [
                {match: {rel:'RELA', val:'VALA'}},
                {match: {rel:'RELB', val:'VALB'}}
            ]
        },
        expect: true
    },
    {
        mdata:[
            {rel: 'RELA', val: 'VALA'},
            {rel: 'RELB', val: 'VALB'}
        ],
        expr:{
            and: [
                {match: {rel:'RELA', val:'VALA'}},
                {match: {rel:'RELB', val:'VALC'}}
            ]
        },
        expect: false
    },

    // or operator
    {
        mdata:[
            {rel: 'RELA', val: 'VALA'},
            {rel: 'RELB', val: 'VALB'}
        ],
        expr:{
            or: [
                {match: {rel:'RELA'}},
                {match: {rel:'RELB'}}
            ]
        },
        expect: true
    },
    {
        mdata:[
            {rel: 'RELA', val: 'VALA'},
            {rel: 'RELB', val: 'VALB'}
        ],
        expr:{
            or: [
                {match: {rel:'RELA', val:'VALA'}},
                {match: {rel:'RELB', val:'VALB'}}
            ]
        },
        expect: true
    },
    {
        mdata:[
            {rel: 'RELA', val: 'VALA'},
            {rel: 'RELB', val: 'VALB'}
        ],
        expr:{
            or: [
                {match: {rel:'RELA', val:'VALC'}},
                {match: {rel:'RELB', val:'VALB'}}
            ]
        },
        expect: true
    },
    {
        mdata:[
            {rel: 'RELA', val: 'VALA'},
            {rel: 'RELB', val: 'VALB'}
        ],
        expr:{
            or: [
                {match: {rel:'RELA', val:'VALA'}},
                {match: {rel:'RELB', val:'VALC'}}
            ]
        },
        expect: true
    },
    {
        mdata:[
            {rel: 'RELA', val: 'VALA'},
            {rel: 'RELB', val: 'VALB'}
        ],
        expr:{
            or: [
                {match: {rel:'RELA', val:'VALC'}},
                {match: {rel:'RELB', val:'VALD'}}
            ]
        },
        expect: false
    },
    // double not
    {
        mdata:[
            {rel: 'RELA', val: 'VALA'},
            {rel: 'RELB', val: 'VALB'}
        ],
        expr:{
            not: {
                not: {match: {rel:'RELA'}}
            }
        },
        expect: true
    },
    // triple not
    {
        mdata:[
            {rel: 'RELA', val: 'VALA'},
            {rel: 'RELB', val: 'VALB'}
        ],
        expr:{
            not: {
                not: {
                    not: {match: {rel:'RELA'}}
                }
            }
        },
        expect: false
    },

    // combinatorial
    {
        mdata:[
            {rel: 'RELA', val: 'VALA'},
            {rel: 'RELB', val: 'VALB'}
        ],
        expr:{
            and: [
                {match:{rel:'RELA',val:'VALA'}},
                {not:{rel:'RELX'}}
            ]
        },
        expect: true
    }

];

describe('permission expression matching', function() {
    var f = function(o, id) {
        it('Expression testing '+id, function(done) {
            var pass = expr.match(o.expr, o.mdata);
            if (pass != o.expect) {
                throw new Error('expr err on '+id);
            }
            done();
        });
    };

    for (var i=0;i<tests.length;i++) {
        f(tests[i], i);
    }
});



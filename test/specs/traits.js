/* global RAML, describe, it */

'use strict';

if (typeof window === 'undefined') {
    var raml           = require('../../lib/raml.js');
    var chai           = require('chai');
    var expect         = chai.expect;
    var should         = chai.should();
    var chaiAsPromised = require('chai-as-promised');
    chai.use(chaiAsPromised);
} else {
    var raml           = RAML.Parser;
    chai.should();
}

describe('Traits', function () {
    it('should detect unused trait parameters and throw an exception', function (done) {
        raml.load([
            '#%RAML 0.8',
            '---',
            'title: Example',
            'traits:',
            '   - trait1:',
            '       queryParameters:',
            '           param1:',
            '               description: <<param1>>',
            '/:',
            '   get:',
            '       is:',
            '           - trait1:',
            '               param1: value1',
            '               param2: value2'
        ].join('\n')).should.be.rejected.with('unused parameter: param2').and.notify(done);
    });

    it('should detect unused resource type parameters and throw an exception', function (done) {
        raml.load([
            '#%RAML 0.8',
            '---',
            'title: Example',
            'resourceTypes:',
            '   - resourceType1:',
            '       get:',
            '           queryParameters:',
            '               param1:',
            '                   description: <<param1>>',
            '/:',
            '   type:',
            '       resourceType1:',
            '           param1: value1',
            '           param2: value2'
        ].join('\n')).should.be.rejected.with('unused parameter: param2').and.notify(done);
    });

    it('should be applied via resource type and parameter key', function (done) {
        raml.load([
            '#%RAML 0.8',
            '---',
            'title: Test',
            'baseUri: http://www.api.com',
            'resourceTypes:',
            '  - base:',
            '      is: [<<trait>>]',
            '      get:',
            'traits:',
            '  - trait1:',
            '      description: This is the description of HOL trait.',
            '/tags:',
            '  type:',
            '    base:',
            '      trait: trait1',
            '  get:'
        ].join('\n')).should.become({
            title: 'Test',
            baseUri: 'http://www.api.com',
            protocols: [
                'HTTP'
            ],
            resourceTypes: [
                {
                    base: {
                        is: [
                            '<<trait>>'
                        ],
                        get: null
                    }
                }
            ],
            traits: [
                {
                    trait1: {
                        description: 'This is the description of HOL trait.'
                    }
                }
            ],
            resources: [
                {
                    type: {
                        base: {
                            trait: 'trait1'
                        }
                    },
                    relativeUri: '/tags',
                    methods: [
                        {
                            description: 'This is the description of HOL trait.',
                            method: 'get',
                            protocols: [
                                'HTTP'
                            ]
                        }
                    ]
                }
            ]
        }).and.notify(done);
    });
});
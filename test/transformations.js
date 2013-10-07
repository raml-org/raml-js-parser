/* global RAML, describe, it */

'use strict';

if (typeof window === 'undefined') {
    var raml           = require('../lib/raml.js');
    var chai           = require('chai');
    var expect         = chai.expect;
    var should         = chai.should();
    var chaiAsPromised = require('chai-as-promised');
    chai.use(chaiAsPromised);
} else {
    var raml           = RAML.Parser;
    chai.should();
}

describe('Transformations', function () {
    it('should not mark formParameters as required by default', function (done) {
        var definition = [
            '#%RAML 0.8',
            '---',
            'title: Title',
            'baseUri: http://server/api',
            '/:',
            '  post:',
            '    body:',
            '      application/x-www-form-urlencoded:',
            '        formParameters:',
            '          mustNotBeRequired:',
            '            type: integer'
        ].join('\n');
        var expected = {
            title: 'Title',
            baseUri: 'http://server/api',
            protocols: [
                'HTTP'
            ],
            resources: [
                {
                    relativeUri: '/',
                    methods: [
                        {
                            method: 'post',
                            protocols: [
                                'HTTP'
                            ],
                            body: {
                                'application/x-www-form-urlencoded': {
                                    formParameters: {
                                        mustNotBeRequired: {
                                            type: 'integer',
                                            displayName: 'mustNotBeRequired'
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            ]
        };
        raml.load(definition).should.become(expected).and.notify(done);
    });

    it('should mark formParameters as required only when explicitly requested', function (done) {
        var definition = [
            '#%RAML 0.8',
            '---',
            'title: Title',
            'baseUri: http://server/api',
            '/:',
            '  post:',
            '    body:',
            '      application/x-www-form-urlencoded:',
            '        formParameters:',
            '          mustBeRequired:',
            '            type: integer',
            '            required: true'
        ].join('\n');
        var expected = {
            title: 'Title',
            baseUri: 'http://server/api',
            protocols: [
                'HTTP'
            ],
            resources: [
                {
                    relativeUri: '/',
                    methods: [
                        {
                            method: 'post',
                            protocols: [
                                'HTTP'
                            ],
                            body: {
                                'application/x-www-form-urlencoded': {
                                    formParameters: {
                                        mustBeRequired: {
                                            type: 'integer',
                                            displayName: 'mustBeRequired',
                                            required: true
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            ]
        };
        raml.load(definition).should.become(expected).and.notify(done);
    });

    it('should fill empty named parameters with default values like displayName and type', function (done) {
        var definition = [
            '#%RAML 0.8',
            '---',
            'title: Title',
            'baseUri: http://server/api',
            '/:',
            '  get:',
            '    queryParameters:',
            '      parameter1:'
        ].join('\n');
        var expected = {
            title: 'Title',
            baseUri: 'http://server/api',
            protocols: [
                'HTTP'
            ],
            resources: [
                {
                    relativeUri: '/',
                    methods: [
                        {
                            method: 'get',
                            protocols: [
                                'HTTP'
                            ],
                            queryParameters: {
                                parameter1: {
                                    displayName: 'parameter1',
                                    type: 'string'
                                }
                            }
                        }
                    ]
                }
            ]
        };
        raml.load(definition).should.become(expected).and.notify(done);
    });
});
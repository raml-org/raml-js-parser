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

describe('Validator', function () {
    it('should fail if baseUriParameters is defined without baseUri', function (done) {
        raml.load([
            '#%RAML 0.8',
            '---',
            'title: Example',
            'baseUriParameters:'
        ].join('\n')).should.be.rejected.with('uri parameters defined when there is no baseUri').and.notify(done);
    });

    (function () {
        var mediaTypes = ['application/x-www-form-urlencoded', 'multipart/form-data'];
        var _do        = function (mediaType) {
            it('should fail if default media type is \'' + mediaType + '\' and body is not a mapping with \'formParameters\' property', function (done) {
                raml.load([
                    '#%RAML 0.8',
                    '---',
                    'title: Example',
                    'baseUri: http://example.com',
                    'mediaType: ' + mediaType,
                    '/:',
                    '   post:',
                    '       body:'
                ].join('\n')).should.be.rejected.with('body must be a mapping with \'formParameters\' property as default media type is \'' + mediaType + '\'').and.notify(done);
            });

            it('should fail if formParameters is not provided for \'' + mediaType + '\' media type', function (done) {
                raml.load([
                    '#%RAML 0.8',
                    '---',
                    'title: Example',
                    'baseUri: http://example.com',
                    '/:',
                    '   post:',
                    '       body:',
                    '           ' + mediaType + ':'
                ].join('\n')).should.be.rejected.and.notify(done);
            });
        };

        for (var i = 0; i < mediaTypes.length; i++) {
            _do(mediaTypes[i]);
        }
    })();
});
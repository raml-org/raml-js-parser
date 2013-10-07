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

    it('should not allow parameters to be used as a name for trait', function (done) {
        raml.load([
            '#%RAML 0.8',
            '---',
            'title: Example',
            'traits:',
            '   - <<traitName>>: {}'
        ].join('\n')).should.be.rejected.with('parameter key cannot be used as a trait name').and.notify(done);
    });

    it('should not allow parameters to be used as a name for resource type', function (done) {
        raml.load([
            '#%RAML 0.8',
            '---',
            'title: Example',
            'resourceTypes:',
            '   - <<resourceTypeName>>: {}'
        ].join('\n')).should.be.rejected.with('parameter key cannot be used as a resource type name').and.notify(done);
    });
});
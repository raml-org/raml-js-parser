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

describe('RAML', function () {
    it('should report error via promises when remote resource is unavalable', function (done) {
        raml.loadFile('/404.ERROR').should.be.rejected.and.notify(done);
    });
});
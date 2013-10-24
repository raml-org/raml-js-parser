/* global RAML, describe, it */

'use strict';

if (typeof window === 'undefined') {
  var raml           = require('../../lib/raml.js');
  var chai           = require('chai');
  var chaiAsPromised = require('chai-as-promised');

  chai.should();
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

  it('should allow protocols at root level', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Example',
      'baseUri: http://api.com',
      'protocols:',
      '   - HTTP',
      '   - HTTPS'
    ].join('\n')).should.be.fulfilled.and.notify(done);
  });

  it('should fail if protocols property is not an array at root level', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Example',
      'baseUri: http://api.com',
      'protocols: HTTP, HTTPS'
    ].join('\n')).should.be.rejected.with('property must be an array').and.notify(done);
  });

  it('should fail if protocols property contains not-a-string values at root level', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Example',
      'baseUri: http://api.com',
      'protocols:',
      '   - {}'
    ].join('\n')).then(function () {}, function (error) {
      setTimeout(function () {
        error.message.should.contain('value must be a string');
        error.problem_mark.line.should.be.equal(5);
        error.problem_mark.column.should.be.equal(5);
        done();
      }, 0);
    });
  });

  it('should fail if protocols property contains invalid values at root level', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Example',
      'baseUri: http://api.com',
      'protocols:',
      '   - HTTP',
      '   - FTP'
    ].join('\n')).then(function () {}, function (error) {
      setTimeout(function () {
        error.message.should.contain('only HTTP and HTTPS values are allowed');
        error.problem_mark.line.should.be.equal(6);
        error.problem_mark.column.should.be.equal(5);
        done();
      }, 0);
    });
  });

  it('should not allow valid protocols in mixed cases at root level', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Example',
      'baseUri: http://api.com',
      'protocols:',
      '   - HtTp',
      '   - hTtPs'
    ].join('\n')).should.be.rejected.with('only HTTP and HTTPS values are allowed').and.notify(done);
  });

  it('should allow protocols at method level', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Example',
      'baseUri: http://api.com',
      '/:',
      '   get:',
      '       protocols:',
      '           - HTTP',
      '           - HTTPS'
    ].join('\n')).should.be.fulfilled.and.notify(done);
  });

  it('should fail if protocols property is not an array at method level', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Example',
      'baseUri: http://api.com',
      '/:',
      '   get:',
      '       protocols: HTTP, HTTPS'
    ].join('\n')).should.be.rejected.with('property must be an array').and.notify(done);
  });

  it('should fail if protocols property contains not-a-string values at method level', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Example',
      'baseUri: http://api.com',
      '/:',
      '   get:',
      '       protocols:',
      '           - {}'
    ].join('\n')).then(function () {}, function (error) {
      setTimeout(function () {
        error.message.should.contain('value must be a string');
        error.problem_mark.line.should.be.equal(7);
        error.problem_mark.column.should.be.equal(13);
        done();
      }, 0);
    });
  });

  it('should fail if protocols property contains invalid values at method level', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Example',
      'baseUri: http://api.com',
      '/:',
      '   get:',
      '       protocols:',
      '           - HTTP',
      '           - FTP'
    ].join('\n')).then(function () {}, function (error) {
      setTimeout(function () {
        error.message.should.contain('only HTTP and HTTPS values are allowed');
        error.problem_mark.line.should.be.equal(8);
        error.problem_mark.column.should.be.equal(13);
        done();
      }, 0);
    });
  });

  it('should not allow valid protocols in mixed cases at method level', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Example',
      'baseUri: http://api.com',
      '/:',
      '   get:',
      '       protocols:',
      '           - HtTp'
    ].join('\n')).should.be.rejected.with('only HTTP and HTTPS values are allowed').and.notify(done);
  });

  it('should allow protocols in traits', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Example',
      'baseUri: http://api.com',
      'traits:',
      '   - trait1:',
      '       protocols:',
      '           - HTTP'
    ].join('\n')).should.be.fulfilled.and.notify(done);
  });

  it('should not allow protocols in resources', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Example',
      'baseUri: http://api.com',
      '/:',
      '   protocols:',
      '       - HTTP'
    ].join('\n')).should.be.rejected.with('property: \'protocols\' is invalid in a resource').and.notify(done);
  });

  it('should not allow parameter key to be used as a name for resource type', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Example',
      'resourceTypes:',
      '   - <<resourceTypeName>>: {}'
    ].join('\n')).should.be.rejected.with('parameter key cannot be used as a resource type name').and.notify(done);
  });

  it('should not allow parameter key to be used as a name for trait', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Example',
      'traits:',
      '   - <<traitName>>: {}'
    ].join('\n')).should.be.rejected.with('parameter key cannot be used as a trait name').and.notify(done);
  });

  it('should allow use parameter key as a trait name within resource type', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Example',
      'resourceTypes:',
      '   - resourceType1:',
      '       is:',
      '           - <<traitName>>'
    ].join('\n')).should.be.fulfilled.and.notify(done);
  });

  it('should allow use parameter key as a resource type name within resource type', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Example',
      'resourceTypes:',
      '   - resourceType1:',
      '       type: <<resourceTypeName>>'
    ].join('\n')).should.be.fulfilled.and.notify(done);
  });

  it('should not allow baseUri to be empty', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Example',
      'baseUri:'
    ].join('\n')).should.be.rejected.with('baseUri must have a value').and.notify(done);
  });

  it('should allow only HTTP and HTTPS protocols to be used in baseUri', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Example',
      'baseUri: ftp://api.com'
    ].join('\n')).should.be.rejected.with('baseUri protocol must be either HTTP or HTTPS').and.notify(done);
  });

  it('should report correct line/column for scheme entry that is not a map', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Example',
      'securitySchemes:',
      '   - scheme1:'
    ].join('\n')).then(function () {}, function (error) {
      setTimeout(function () {
        error.message.should.contain('invalid security scheme property, it must be a map');
        error.problem_mark.line.should.be.equal(4);
        error.problem_mark.column.should.be.equal(5);
        done();
      }, 0);
    });
  });

  it('should report correct line/column when accessTokenUri has not been specified for OAuth 2.0 security scheme', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Example',
      'securitySchemes:',
      '   - scheme1:',
      '       type: OAuth 2.0',
      '       settings: {}'
    ].join('\n')).then(function () {}, function (error) {
      setTimeout(function () {
        error.message.should.contain('OAuth 2.0 settings must have accessTokenUri property');
        error.problem_mark.line.should.be.equal(6);
        error.problem_mark.column.should.be.equal(7);
        done();
      }, 0);
    });
  });

  it('should report correct line/column when authorizationUri has not been specified for OAuth 2.0 security scheme', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Example',
      'securitySchemes:',
      '   - scheme1:',
      '       type: OAuth 2.0',
      '       settings:',
      '           accessTokenUri: i-dont-care'
    ].join('\n')).then(function () {}, function (error) {
      setTimeout(function () {
        error.message.should.contain('OAuth 2.0 settings must have authorizationUri property');
        error.problem_mark.line.should.be.equal(6);
        error.problem_mark.column.should.be.equal(7);
        done();
      }, 0);
    });
  });

  it('should report correct line/column when authorizationUri has not been specified for OAuth 1.0 security scheme', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Example',
      'securitySchemes:',
      '   - scheme1:',
      '       type: OAuth 1.0',
      '       settings:',
      '           requestTokenUri: i-dont-care'
    ].join('\n')).then(function () {}, function (error) {
      setTimeout(function () {
        error.message.should.contain('OAuth 1.0 settings must have authorizationUri property');
        error.problem_mark.line.should.be.equal(6);
        error.problem_mark.column.should.be.equal(7);
        done();
      }, 0);
    });
  });

  it('should report correct line/column when tokenCredentialsUri has not been specified for OAuth 1.0 security scheme', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Example',
      'securitySchemes:',
      '   - scheme1:',
      '       type: OAuth 1.0',
      '       settings:',
      '           requestTokenUri: i-dont-care',
      '           authorizationUri: i-dont-care'
    ].join('\n')).then(function () {}, function (error) {
      setTimeout(function () {
        error.message.should.contain('OAuth 1.0 settings must have tokenCredentialsUri property');
        error.problem_mark.line.should.be.equal(6);
        error.problem_mark.column.should.be.equal(7);
        done();
      }, 0);
    });
  });

  it('should allow applied trait to be a null (implicit empty map)', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Title',
      'traits:',
      '   - trait1: {}',
      '/:',
      '   get:',
      '       is:',
      '         - trait1:'
    ].join('\n')).should.be.fulfilled.and.notify(done);
  });

  it('should report that applied trait value must be a map', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Title',
      'traits:',
      '   - trait1: {}',
      '/:',
      '   get:',
      '       is:',
      '         - trait1:',
      '           - 1'
    ].join('\n')).should.be.rejected.with('trait must be a map').and.notify(done);
  });

  it('should allow only scalar values to be used for parameters when applying traits #1', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Title',
      'traits:',
      '   - trait1:',
      '       description: <<resourcePath>>',
      '/:',
      '   get:',
      '       is:',
      '         - trait1:',
      '             param1: []'
    ].join('\n')).should.be.rejected.with('parameter value must be a scalar').and.notify(done);
  });

  it('should allow only scalar values to be used for parameters when applying traits #2', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Title',
      'traits:',
      '   - trait1:',
      '       description: <<resourcePath>>',
      '/:',
      '   get:',
      '       is:',
      '         - trait1:',
      '             param1: {}'
    ].join('\n')).should.be.rejected.with('parameter value must be a scalar').and.notify(done);
  });

  it('should allow only scalar values to be used for parameters when applying resource types #1', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Title',
      'traits:',
      '   - trait1:',
      '       description: <<resourcePath>>',
      '/:',
      '   get:',
      '       is:',
      '         - trait1:',
      '             param1: []'
    ].join('\n')).should.be.rejected.with('parameter value must be a scalar').and.notify(done);
  });

  it('should allow only scalar values to be used for parameters when applying resouce types #2', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: Title',
      'traits:',
      '   - trait1:',
      '       description: <<resourcePath>>',
      '/:',
      '   get:',
      '       is:',
      '         - trait1:',
      '             param1: {}'
    ].join('\n')).should.be.rejected.with('parameter value must be a scalar').and.notify(done);
  });
});

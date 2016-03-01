/* Reject optional scalar parameters */

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

describe('Uri parameter validations', function () {
  describe('L2 URI parameters', function () {
    it('in baseUriParameters', function (done) {
      return raml.load([
        '#%RAML 0.8',
        'title: Title',
        'baseUri: http://domain/{+l2Parameter}',
        'baseUriParameters:',
        '  l2Parameter:',
        '    type: number'
      ].join('\n'), 'api.raml')
        .then(function (result) {
          setTimeout(function () {
            var expected =   {
              title: 'Title',
              baseUri: 'http://domain/{+l2Parameter}',
              baseUriParameters: {
                l2Parameter: { type: 'number', displayName: 'l2Parameter', required: true },
              },
              protocols: [ 'HTTP' ]
            };

            result.should.deep.equal(expected);
            done();
          }, 0);
        });
    });

    it('in uriParameters', function (done) {
      return raml.load([
        '#%RAML 0.8',
        'title: Title',
        'baseUri: http://domain',
        '/resource/{+newParameter}:',
        '  uriParameters:',
        '    newParameter:',
        '      type: number'
      ].join('\n'), 'api.raml')
        .then(function (result) {
          setTimeout(function () {
            var expected =   {
              title: 'Title',
              baseUri: 'http://domain',
              protocols: [ 'HTTP' ],              
              resources: [{
                uriParameters: {
                  newParameter: { type: 'number', displayName: 'newParameter', required: true },
                },
                "relativeUri": "/resource/{+newParameter}",
                "relativeUriPathSegments": [
                  "resource",
                  "{+newParameter}"
                ]
              }]
            };

            result.should.deep.equal(expected);
            done();
          }, 0);
        }, function (err) {console.log(err)});
    });
  });

  describe('more than one parameter in bracket', function () {
    it('in baseUriParameters', function (done) {
      return raml.load([
        '#%RAML 0.8',
        'title: Title',
        'baseUri: http://domain/{parameter1,parameter2}/{parameter3,parameter4}'
      ].join('\n'), 'api.raml')
        .then(function (result) {
          setTimeout(function () {
            var expected =   {
              title: 'Title',
              baseUri: 'http://domain/{parameter1,parameter2}/{parameter3,parameter4}',
              protocols: [ 'HTTP' ],
              baseUriParameters: {
                parameter1: { type: 'string', displayName: 'parameter1', required: true },
                parameter2: { type: 'string', displayName: 'parameter2', required: true },
                parameter3: { type: 'string', displayName: 'parameter3', required: true },
                parameter4: { type: 'string', displayName: 'parameter4', required: true }
              },
            };

            result.should.deep.equal(expected);
            done();
          }, 0);
        }, console.log);
    });

    it('in uriParameters', function (done) {
      return raml.load([
        '#%RAML 0.8',
        'title: Title',
        'baseUri: http://domain',
        '/resource/{parameter1,parameter2}:'
      ].join('\n'), 'api.raml')
        .then(function (result) {
          setTimeout(function () {
            var expected =   {
              title: 'Title',
              baseUri: 'http://domain',
              protocols: [ 'HTTP' ],              
              resources: [{
                uriParameters: {
                  parameter1: { type: 'string', displayName: 'parameter1', required: true },
                  parameter2: { type: 'string', displayName: 'parameter2', required: true },
                },
                "relativeUri": "/resource/{parameter1,parameter2}",
                "relativeUriPathSegments": [
                  "resource",
                  "{parameter1,parameter2}"
                ]
              }]
            };

            result.should.deep.equal(expected);
            done();
          }, 0);
        }, function (err) {console.log(err)});
    });
  });
});

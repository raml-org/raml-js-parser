"use strict"

if (typeof window === 'undefined') {
    var raml = require('../../lib/raml.js')
    var chai = require('chai')
        , expect = chai.expect
        , should = chai.should();
    var chaiAsPromised = require("chai-as-promised");
    var q = require('q');
    chai.use(chaiAsPromised);
} else {
    var raml = RAML.Parser;
    var q = (new RAML.Parser.FileReader).q;
    chai.should();
}

describe('Include resolution injection', function() {
  it('should call injected method', function(done) {
    var callbackCalled = false;
    var injectedReader = new raml.FileReader(function() {
        callbackCalled = true;
        return q.fcall( function() { return "#%RAML 0.8\ntitle: Hi" })
    });

    var document = [
      "#%RAML 0.8",
      "!include http://john-galt.com/who-is-he.raml"
    ].join("\n");

    var expected = {
      title: 'Hi'
    };

    raml.load(document, 'http://john-galt.com/who-is-he2.raml', { reader: injectedReader } ).then( function(data) {
      setTimeout(function () {
        data.should.deep.equal(expected);
        callbackCalled.should.be.ok;
        done();
      }, 0);
    });
  });

  it('should reject if detects circular reference on the first document', function(done) {
    var callbackCalled = false;
    var injectedReader = new raml.FileReader(function() {
      callbackCalled = true;
      return q.fcall( function() { return "#%RAML 0.8\ntitle: Hi" })
    });

    var document = [
      "#%RAML 0.8",
      "!include http://john-galt.com/who-is-he.raml"
    ].join("\n");

    var expected =  {
      'context': 'while composing scalar out of !include',
      'context_mark': null,
      'message': 'detected circular !include of http://john-galt.com/who-is-he.raml',
      'problem_mark': {
        'name': 'http://john-galt.com/who-is-he.raml',
        'line': 1,
        'column': 0,
        'buffer': '#%RAML 0.8\n!include http://john-galt.com/who-is-he.raml\u0000',
        'pointer': 11
      }
    };

    var noop = function(){};
    raml.load(document, 'http://john-galt.com/who-is-he.raml', { reader: injectedReader } ).then(noop, function(error) {
      setTimeout(function () {
        subsetCompare(expected, JSON.parse(JSON.stringify(error)));
        callbackCalled.should.not.be.ok;
        done();
      }, 0);
    });
  });

  it('should fail if reader is null', function(done) {
    var document = [
      "#%RAML 0.8",
      "!include http://localhost:9001/test/raml-files/external.yml"
    ].join("\n");

    var expected = {
      context: 'while reading file',
      context_mark: null,
      problem_mark:
      {
        name: 'http://john-galt.com/who-is-he.raml',
        line: 1,
        column: 0,
        buffer: '#%RAML 0.8\n!include http://localhost:9001/test/raml-files/external.yml\u0000',
        pointer: 11
      }
    };

    var noop = function(){};
    raml.load(document, 'http://john-galt.com/who-is-he.raml', { reader: null } ).then(noop, function(error) {
      setTimeout(function () {
        subsetCompare(expected, JSON.parse(JSON.stringify(error)));
        done();
      }, 0);
    });
  });

  it('should fail if reader does not return a promise', function(done) {
    var callbackCalled = false;
    var injectedReader = new raml.FileReader(function() {
      callbackCalled = true;
      return "blah";
    });

    var document = [
        "#%RAML 0.8",
        "!include http://john-galt.com/who-is-he.raml"
    ].join("\n");

    var expected = {
      context: 'while reading file',
      context_mark: null,
      problem_mark: {
        name: '/',
        line: 1,
        column: 0,
        buffer: '#%RAML 0.8\n!include http://john-galt.com/who-is-he.raml\u0000',
        pointer: 11
      }
    };

    var noop = function(){};
    raml.load(document, '/', { reader: injectedReader } ).then(noop, function(error) {
      setTimeout(function () {
        subsetCompare(expected, JSON.parse(JSON.stringify(error)));
        done();
      }, 0);
    });
  });
});

function subsetCompare(expected, target) {
    Object.keys(expected).forEach(function(keyName){
        if (expected[keyName] === null) {
            expect(target[keyName]).to.not.be.ok;
        } else {
            expected[keyName].should.deep.equal(target[keyName])
        }
    });

}
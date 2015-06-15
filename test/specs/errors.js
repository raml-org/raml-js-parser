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

describe('Errors', function () {
  it('should be at right line/column when new document content started without special marker right after end marker', function (done) {
    raml.load([
      '#%RAML 0.8',
      '---',
      'title: API 1',
      '...',
      'title: API 2'
    ].join('\n'), 'foo.raml').then(function () {}, function (error) {
      setTimeout(function () {
        error.stack.should.exist;
        error.problem_mark.should.exist;
        error.problem_mark.line.should.be.equal(4);
        error.problem_mark.column.should.be.equal(0);
        error.toString().should.equal([
          'expected \'<document start>\', but found <block mapping end>',
          '  in \"foo.raml\", line 5, column 1:',
          '    title: API 2',
          '    ^'
        ].join('\n'));
        done();
      }, 0);
    });
  });

  it('should error with non-printable characters and render index correctly', function (done) {
    raml.load([
      '#%RAML 0.8',
      // Note: There is a non-readable character after the second quote mark.
      '*Note:* You may provide an optional *scope* parameter to request additional permissions outside of the "basic" permissions scope. [Learn more about scope](http://instagram.com/developer/authentication/#scop'
    ].join('\n')).then(function () {}, function (error) {
      setTimeout(function () {
        error.stack.should.exist;
        error.problem_mark.should.exist;
        error.problem_mark.line.should.be.equal(1);
        error.problem_mark.column.should.be.equal(110);
        error.problem_mark.get_snippet(0).should.equal([
          '... ermissions outside of the "basic" permissions scope. [Learn more a ...',
          '                                     ^'
        ].join('\n'));
        error.problem_mark.get_snippet(0, 55).split('\n')[0].length.should.be.to.equal(55);
        error.problem_mark.get_snippet(0, 80).split('\n')[0].length.should.be.to.equal(80);
        done();
      }, 0);
    });
  });

  it('should render error messages with the correct index', function (done) {
    raml.load([
      '#%RAML 0.8',
      'title: {]'
    ].join('\n')).then(null, function (error) {
      setTimeout(function () {
        error.stack.should.exist;
        error.problem_mark.should.exist;
        error.problem_mark.line.should.be.equal(1);
        error.problem_mark.column.should.be.equal(8);
        error.problem_mark.get_snippet(2).should.equal([
          '  title: {]',
          '          ^'
        ].join('\n'));
        done();
      }, 0);
    })
  })
});

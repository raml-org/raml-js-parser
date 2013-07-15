(function() {
  var composer, construct, joiner, parser, reader, resolver, scanner, traits, util, validator;

  util = require('./util');

  reader = require('./reader');

  scanner = require('./scanner');

  parser = require('./parser');

  composer = require('./composer');

  resolver = require('./resolver');

  construct = require('./construct');

  validator = require('./validator');

  joiner = require('./joiner');

  traits = require('./traits');

  this.make_loader = function(Reader, Scanner, Parser, Composer, Resolver, Validator, Traits, Joiner, Constructor) {
    if (Reader == null) {
      Reader = reader.Reader;
    }
    if (Scanner == null) {
      Scanner = scanner.Scanner;
    }
    if (Parser == null) {
      Parser = parser.Parser;
    }
    if (Composer == null) {
      Composer = composer.Composer;
    }
    if (Resolver == null) {
      Resolver = resolver.Resolver;
    }
    if (Validator == null) {
      Validator = validator.Validator;
    }
    if (Traits == null) {
      Traits = traits.Traits;
    }
    if (Joiner == null) {
      Joiner = joiner.Joiner;
    }
    if (Constructor == null) {
      Constructor = construct.Constructor;
    }
    return (function() {
      var component, components;

      components = [Reader, Scanner, Parser, Composer, Resolver, Validator, Traits, Joiner, Constructor];

      util.extend.apply(util, [_Class.prototype].concat((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = components.length; _i < _len; _i++) {
          component = components[_i];
          _results.push(component.prototype);
        }
        return _results;
      })()));

      function _Class(stream, location) {
        var _i, _len, _ref;
        components[0].call(this, stream, location);
        _ref = components.slice(1);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          component = _ref[_i];
          component.call(this);
        }
      }

      return _Class;

    })();
  };

  this.Loader = this.make_loader();

}).call(this);

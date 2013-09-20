(function() {
  var composer, construct, joiner, parser, reader, resolver, scanner, schemas, securitySchemes, traits, types, util, validator;

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

  types = require('./resourceTypes');

  schemas = require('./schemas');

  securitySchemes = require('./securitySchemes');

  this.make_loader = function(Reader, Scanner, Parser, Composer, Resolver, Validator, ResourceTypes, Traits, Schemas, Joiner, SecuritySchemes, Constructor) {
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
    if (ResourceTypes == null) {
      ResourceTypes = types.ResourceTypes;
    }
    if (Traits == null) {
      Traits = traits.Traits;
    }
    if (Schemas == null) {
      Schemas = schemas.Schemas;
    }
    if (Joiner == null) {
      Joiner = joiner.Joiner;
    }
    if (SecuritySchemes == null) {
      SecuritySchemes = securitySchemes.SecuritySchemes;
    }
    if (Constructor == null) {
      Constructor = construct.Constructor;
    }
    return (function() {
      var component, components;

      components = [Reader, Scanner, Parser, Composer, Resolver, Validator, Traits, ResourceTypes, Schemas, Joiner, Constructor, SecuritySchemes];

      util.extend.apply(util, [_Class.prototype].concat((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = components.length; _i < _len; _i++) {
          component = components[_i];
          _results.push(component.prototype);
        }
        return _results;
      })()));

      function _Class(stream, location, validate) {
        var _i, _len, _ref;
        components[0].call(this, stream, location);
        components[1].call(this, validate);
        _ref = components.slice(2);
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

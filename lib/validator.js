(function() {
  var MarkedYAMLError, nodes, traits, uritemplate, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  MarkedYAMLError = require('./errors').MarkedYAMLError;

  nodes = require('./nodes');

  traits = require('./traits');

  uritemplate = require('uritemplate');

  /*
  The Validator throws these.
  */


  this.ValidationError = (function(_super) {
    __extends(ValidationError, _super);

    function ValidationError() {
      _ref = ValidationError.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    return ValidationError;

  })(MarkedYAMLError);

  /*
  A collection of multiple validation errors
  */


  this.ValidationErrors = (function(_super) {
    __extends(ValidationErrors, _super);

    function ValidationErrors(validation_errors) {
      this.validation_errors = validation_errors;
    }

    ValidationErrors.prototype.get_validation_errors = function() {
      return this.validation_errors;
    };

    return ValidationErrors;

  })(MarkedYAMLError);

  /*
  The Validator class deals with validating a YAML file according to the spec
  */


  this.Validator = (function() {
    function Validator() {
      this.validations = [this.has_title, this.valid_base_uri, this.validate_base_uri_parameters, this.valid_root_properties, this.validate_traits, this.validate_types, this.valid_absolute_uris, this.valid_trait_consumption, this.valid_type_consumption];
    }

    Validator.prototype.validate_document = function(node) {
      var _this = this;
      this.validations.forEach(function(validation) {
        return validation.call(_this, node);
      });
      return true;
    };

    Validator.prototype.validate_uri_parameters = function(uri, node) {
      var child_resources, err, expressions, template, uriParameters, uriProperty,
        _this = this;
      this.check_is_map(node);
      if (this.has_property(node, /^uriParameters$/i)) {
        try {
          template = uritemplate.parse(uri);
        } catch (_error) {
          err = _error;
          uriProperty = this.get_property(node, /^uriParameters$/i);
          throw new exports.ValidationError('while validating uri parameters', null, err.options.message, uriProperty.start_mark);
        }
        expressions = template.expressions.filter(function(expr) {
          return expr.hasOwnProperty('templateText');
        });
        uriParameters = this.property_value(node, /^uriParameters$/i);
        uriParameters.forEach(function(uriParameter) {
          var found, uriParameterName;
          _this.valid_common_parameter_properties(uriParameter[1]);
          uriParameterName = uriParameter[0].value;
          found = expressions.filter(function(expression) {
            return expression.templateText === uriParameterName;
          });
          if (found.length === 0) {
            throw new exports.ValidationError('while validating baseUri', null, uriParameterName + ' uri parameter unused', uriParameter[0].start_mark);
          }
        });
      }
      child_resources = this.child_resources(node);
      return child_resources.forEach(function(childResource) {
        return _this.validate_uri_parameters(childResource[0].value, childResource[1]);
      });
    };

    Validator.prototype.validate_base_uri_parameters = function(node) {
      var baseUri;
      this.check_is_map(node);
      if (this.has_property(node, /^uriParameters$/i)) {
        if (!this.has_property(node, /^baseUri$/i)) {
          throw new exports.ValidationError('while validating uri parameters', null, 'uri parameters defined when there is no baseUri', node.start_mark);
        }
        baseUri = this.property_value(node, /^baseUri$/i);
        return this.validate_uri_parameters(baseUri, node);
      }
    };

    Validator.prototype.validate_types = function(node) {
      var types,
        _this = this;
      this.check_is_map(node);
      if (this.has_property(node, /^resourceTypes$/i)) {
        types = this.property_value(node, /^resourceTypes$/i);
        if (typeof types !== "object") {
          throw new exports.ValidationError('while validating trait properties', null, 'invalid resourceTypes definition, it must be an array', types.start_mark);
        }
        return types.forEach(function(type_entry) {
          if (!(type_entry && type_entry.value)) {
            throw new exports.ValidationError('while validating trait properties', null, 'invalid resourceTypes definition, it must be an array', type_entry.start_mark);
          }
          if (type_entry.tag !== "tag:yaml.org,2002:map") {
            throw new exports.ValidationError('while validating trait properties', null, 'invalid resourceType definition, it must be a mapping', type_entry.start_mark);
          }
          return type_entry.value.forEach(function(type) {
            var methods, resources, useProperty, uses;
            if (!(_this.has_property(type[1], /^displayName$/i))) {
              throw new exports.ValidationError('while validating trait properties', null, 'every resource type must have a displayName property', node.start_mark);
            }
            resources = _this.child_resources(type[1]);
            if (resources.length) {
              throw new exports.ValidationError('while validating trait properties', null, 'resource type cannot define child resources', node.start_mark);
            }
            if (_this.has_property(type[1], /^is$/i)) {
              useProperty = _this.get_property(type[1], /^is$/i);
              uses = _this.property_value(type[1], /^is$/i);
              if (!(uses instanceof Array)) {
                throw new exports.ValidationError('while validating trait consumption', null, 'use property must be an array', useProperty.start_mark);
              }
              uses.forEach(function(use) {
                if (!_this.get_trait(_this.key_or_value(use))) {
                  throw new exports.ValidationError('while validating trait consumption', null, 'there is no trait named ' + _this.key_or_value(use), use.start_mark);
                }
              });
            }
            methods = _this.child_methods(type[1]);
            return methods.forEach(function(method) {
              if (_this.has_property(method[1], /^is$/i)) {
                useProperty = _this.get_property(method[1], /^is$/i);
                uses = _this.property_value(method[1], /^is$/i);
                if (!(uses instanceof Array)) {
                  throw new exports.ValidationError('while validating trait consumption', null, 'use property must be an array', useProperty.start_mark);
                }
                return uses.forEach(function(use) {
                  if (!_this.get_trait(_this.key_or_value(use))) {
                    throw new exports.ValidationError('while validating trait consumption', null, 'there is no trait named ' + _this.key_or_value(use), use.start_mark);
                  }
                });
              }
            });
          });
        });
      }
    };

    Validator.prototype.valid_type_consumption = function(node, types, check_types) {
      var resources,
        _this = this;
      if (types == null) {
        types = void 0;
      }
      if (check_types == null) {
        check_types = true;
      }
      if ((types == null) && this.has_property(node, /^resourceTypes$/i)) {
        types = this.property_value(node, /^resourceTypes$/i);
      }
      resources = this.child_resources(node);
      resources.forEach(function(resource) {
        var typeName, typeProperty;
        if (_this.has_property(resource[1], /^type$/i)) {
          typeProperty = (resource[1].value.filter(function(childNode) {
            return !(childNode[0].value === "object") && childNode[0].value.match(/^type$/);
          }))[0][1];
          typeName = _this.key_or_value(typeProperty);
          if (!(typeProperty.tag === "tag:yaml.org,2002:map" || typeProperty.tag === "tag:yaml.org,2002:str")) {
            throw new exports.ValidationError('while validating resource types consumption', null, 'type property must be a scalar', typeProperty.start_mark);
          }
          if (!types.some(function(types_entry) {
            return types_entry.value.some(function(type) {
              return type[0].value === typeName;
            });
          })) {
            throw new exports.ValidationError('while validating trait consumption', null, 'there is no type named ' + typeName, typeProperty.start_mark);
          }
        }
        return _this.valid_type_consumption(resource[1], types, false);
      });
      if (types && check_types) {
        return types.forEach(function(type_entry) {
          return type_entry.value.forEach(function(type) {
            var inheritsFrom, typeProperty;
            if (_this.has_property(type[1], /^type$/i)) {
              typeProperty = (type[1].value.filter(function(childNode) {
                return !(childNode[0].value === "object") && childNode[0].value.match(/^type$/);
              }))[0][1];
              inheritsFrom = _this.key_or_value(typeProperty);
              if (!(typeProperty.tag === "tag:yaml.org,2002:map" || typeProperty.tag === "tag:yaml.org,2002:str")) {
                throw new exports.ValidationError('while validating resource types consumption', null, 'type property must be a scalar', typeProperty.start_mark);
              }
              if (!types.some(function(types_entry) {
                return types_entry.value.some(function(defined_type) {
                  return defined_type[0].value === inheritsFrom;
                });
              })) {
                throw new exports.ValidationError('while validating trait consumption', null, 'there is no type named ' + inheritsFrom, typeProperty.start_mark);
              }
            }
          });
        });
      }
    };

    Validator.prototype.validate_traits = function(node) {
      var traitsList,
        _this = this;
      this.check_is_map(node);
      if (this.has_property(node, /^traits$/i)) {
        traitsList = this.property_value(node, /^traits$/i);
        if (typeof traitsList !== "object") {
          throw new exports.ValidationError('while validating trait properties', null, 'invalid traits definition, it must be an array', traits.start_mark);
        }
        return traitsList.forEach(function(trait_entry) {
          if (!(trait_entry && trait_entry.value)) {
            throw new exports.ValidationError('while validating trait properties', null, 'invalid traits definition, it must be an array', trait_entry.start_mark);
          }
          return trait_entry.value.forEach(function(trait) {
            _this.valid_traits_properties(trait[1]);
            if (!(_this.has_property(trait[1], /^displayName$/i))) {
              throw new exports.ValidationError('while validating trait properties', null, 'every trait must have a displayName property', trait.start_mark);
            }
          });
        });
      }
    };

    Validator.prototype.valid_traits_properties = function(node) {
      var invalid;
      this.check_is_map(node);
      if (!node.value) {
        return;
      }
      invalid = node.value.filter(function(childNode) {
        if (typeof childNode[0].value === "object") {
          return true;
        }
        return childNode[0].value.match(/^is$/i) || childNode[0].value.match(/^type$/i);
      });
      if (invalid.length > 0) {
        throw new exports.ValidationError('while validating trait properties', null, 'unknown property ' + invalid[0][0].value, invalid[0][0].start_mark);
      }
    };

    Validator.prototype.valid_common_parameter_properties = function(node) {
      var invalid, maxLengthProperty, maxProperty, minLengthProperty, minProperty, repeat, repeatProperty, required, requiredProperty, type, typeProperty;
      this.check_is_map(node);
      invalid = node.value.filter(function(childNode) {
        if (typeof childNode[0].value === "object") {
          return true;
        }
        return !(childNode[0].value.match(/^displayName$/i) || childNode[0].value.match(/^description$/i) || childNode[0].value.match(/^type$/i) || childNode[0].value.match(/^enum$/i) || childNode[0].value.match(/^pattern$/i) || childNode[0].value.match(/^minLength$/i) || childNode[0].value.match(/^maxLength$/i) || childNode[0].value.match(/^minimum$/i) || childNode[0].value.match(/^maximum$/i) || childNode[0].value.match(/^required$/i) || childNode[0].value.match(/^repeat$/i) || childNode[0].value.match(/^default$/i));
      });
      if (invalid.length > 0) {
        throw new exports.ValidationError('while validating parameter properties', null, 'unknown property ' + invalid[0][0].value, invalid[0][0].start_mark);
      }
      if (this.has_property(node, /^minLength$/i)) {
        if (isNaN(this.property_value(node, /^minLength$/i))) {
          minLengthProperty = this.get_property(node, /^minLength$/i);
          throw new exports.ValidationError('while validating parameter properties', null, 'the value of minLength must be a number', minLengthProperty.start_mark);
        }
      }
      if (this.has_property(node, /^maxLength$/i)) {
        if (isNaN(this.property_value(node, /^maxLength$/i))) {
          maxLengthProperty = this.get_property(node, /^maxLength$/i);
          throw new exports.ValidationError('while validating parameter properties', null, 'the value of maxLength must be a number', maxLengthProperty.start_mark);
        }
      }
      if (this.has_property(node, /^minimum$/i)) {
        if (isNaN(this.property_value(node, /^minimum$/i))) {
          minProperty = this.get_property(node, /^minimum$/i);
          throw new exports.ValidationError('while validating parameter properties', null, 'the value of minimum must be a number', minProperty.start_mark);
        }
      }
      if (this.has_property(node, /^maximum$/i)) {
        if (isNaN(this.property_value(node, /^maximum$/i))) {
          maxProperty = this.get_property(node, /^maximum$/i);
          throw new exports.ValidationError('while validating parameter properties', null, 'the value of maximum must be a number', maxProperty.start_mark);
        }
      }
      if (this.has_property(node, /^type$/i)) {
        type = this.property_value(node, /^type$/i);
        if (type !== 'string' && type !== 'number' && type !== 'integer' && type !== 'date') {
          typeProperty = this.get_property(node, /^type$/i);
          throw new exports.ValidationError('while validating parameter properties', null, 'type can either be: string, number, integer or date', typeProperty.start_mark);
        }
      }
      if (this.has_property(node, /^required$/i)) {
        required = this.property_value(node, /^required$/i);
        if (!required.match(/^(true|false)$/)) {
          requiredProperty = this.get_property(node, /^required$/i);
          throw new exports.ValidationError('while validating parameter properties', null, '"' + required + '"' + 'required can be any either true or false', requiredProperty.start_mark);
        }
      }
      if (this.has_property(node, /^repeat$/i)) {
        repeat = this.property_value(node, /^repeat$/i);
        if (!repeat.match(/^(true|false)$/)) {
          repeatProperty = this.get_property(node, /^repeat$/i);
          throw new exports.ValidationError('while validating parameter properties', null, '"' + repeat + '"' + 'repeat can be any either true or false', repeatProperty.start_mark);
        }
      }
    };

    Validator.prototype.valid_root_properties = function(node) {
      var invalid;
      this.check_is_map(node);
      invalid = node.value.filter(function(childNode) {
        if (typeof childNode[0].value === "object") {
          return true;
        }
        return !(childNode[0].value.match(/^title$/i) || childNode[0].value.match(/^baseUri$/i) || childNode[0].value.match(/^version$/i) || childNode[0].value.match(/^traits$/i) || childNode[0].value.match(/^documentation$/i) || childNode[0].value.match(/^uriParameters$/i) || childNode[0].value.match(/^resourceTypes$/i) || childNode[0].value.match(/^\//i));
      });
      if (invalid.length > 0) {
        throw new exports.ValidationError('while validating root properties', null, 'unknown property ' + invalid[0][0].value, invalid[0][0].start_mark);
      }
    };

    Validator.prototype.child_resources = function(node) {
      return node.value.filter(function(childNode) {
        return childNode[0].value.match(/^\//i);
      });
    };

    Validator.prototype.child_methods = function(node) {
      return node.value.filter(function(childNode) {
        return childNode[0].value.match(/^(get|post|put|delete|head|patch|options)$/);
      });
    };

    Validator.prototype.has_property = function(node, property) {
      if (node.value && typeof node.value === "object") {
        return node.value.some(function(childNode) {
          return childNode[0].value && typeof childNode[0].value !== "object" && childNode[0].value.match(property);
        });
      }
      return false;
    };

    Validator.prototype.property_value = function(node, property) {
      var filteredNodes;
      filteredNodes = node.value.filter(function(childNode) {
        return typeof childNode[0].value !== "object" && childNode[0].value.match(property);
      });
      return filteredNodes[0][1].value;
    };

    Validator.prototype.get_property = function(node, property) {
      var filteredNodes;
      filteredNodes = node.value.filter(function(childNode) {
        return typeof childNode[0].value !== "object" && childNode[0].value.match(property);
      });
      return filteredNodes[0][1];
    };

    Validator.prototype.check_is_map = function(node) {
      if (!node instanceof nodes.MappingNode) {
        throw new exports.ValidationError('while validating node', null, 'must be a map', node.start_mark);
      }
    };

    Validator.prototype.resources = function(node, parentPath) {
      var child_resources, response,
        _this = this;
      if (node == null) {
        node = this.get_single_node(true, true, false);
      }
      this.check_is_map(node);
      response = [];
      child_resources = this.child_resources(node);
      child_resources.forEach(function(childResource) {
        var resourceResponse;
        resourceResponse = {};
        resourceResponse.methods = [];
        if (parentPath != null) {
          resourceResponse.uri = parentPath + childResource[0].value;
        } else {
          resourceResponse.uri = childResource[0].value;
        }
        if (_this.has_property(childResource[1], /^displayName$/i)) {
          resourceResponse.displayName = _this.property_value(childResource[1], /^displayName$/i);
        }
        if (_this.has_property(childResource[1], /^get$/i)) {
          resourceResponse.methods.push('get');
        }
        if (_this.has_property(childResource[1], /^post$/i)) {
          resourceResponse.methods.push('post');
        }
        if (_this.has_property(childResource[1], /^put$/i)) {
          resourceResponse.methods.push('put');
        }
        if (_this.has_property(childResource[1], /^patch$/i)) {
          resourceResponse.methods.push('patch');
        }
        if (_this.has_property(childResource[1], /^delete$/i)) {
          resourceResponse.methods.push('delete');
        }
        if (_this.has_property(childResource[1], /^head$/i)) {
          resourceResponse.methods.push('head');
        }
        if (_this.has_property(childResource[1], /^options$/i)) {
          resourceResponse.methods.push('options');
        }
        resourceResponse.line = childResource[0].start_mark.line + 1;
        resourceResponse.column = childResource[0].start_mark.column + 1;
        if (childResource[0].start_mark.name != null) {
          resourceResponse.src = childResource[0].start_mark.name;
        }
        response.push(resourceResponse);
        return response = response.concat(_this.resources(childResource[1], resourceResponse.uri));
      });
      return response;
    };

    Validator.prototype.valid_absolute_uris = function(node) {
      var i, sorted_uris, uris, _i, _ref1, _results;
      uris = this.get_absolute_uris(node);
      sorted_uris = uris.sort();
      if (sorted_uris.length > 1) {
        _results = [];
        for (i = _i = 0, _ref1 = sorted_uris.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (sorted_uris[i + 1] === sorted_uris[i]) {
            throw new exports.ValidationError('while validating trait consumption', null, 'two resources share same URI ' + sorted_uris[i], null);
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    };

    Validator.prototype.get_absolute_uris = function(node, parentPath) {
      var child_resources, response,
        _this = this;
      if (node == null) {
        node = this.get_single_node(true, true, false);
      }
      this.check_is_map(node);
      response = [];
      child_resources = this.child_resources(node);
      child_resources.forEach(function(childResource) {
        var uri;
        if (parentPath != null) {
          uri = parentPath + childResource[0].value;
        } else {
          uri = childResource[0].value;
        }
        response.push(uri);
        return response = response.concat(_this.get_absolute_uris(childResource[1], uri));
      });
      return response;
    };

    Validator.prototype.key_or_value = function(node) {
      if (node instanceof nodes.ScalarNode) {
        return node.value;
      }
      if (node instanceof nodes.MappingNode) {
        return node.value[0][0].value;
      }
    };

    Validator.prototype.value_or_undefined = function(node) {
      if (node instanceof nodes.MappingNode) {
        return node.value;
      }
      return void 0;
    };

    Validator.prototype.valid_trait_consumption = function(node, traits) {
      var resources,
        _this = this;
      if (traits == null) {
        traits = void 0;
      }
      this.check_is_map(node);
      resources = this.child_resources(node);
      return resources.forEach(function(resource) {
        var methods, useProperty, uses;
        if (_this.has_property(resource[1], /^is$/i)) {
          useProperty = _this.get_property(resource[1], /^is$/i);
          uses = _this.property_value(resource[1], /^is$/i);
          if (!(uses instanceof Array)) {
            throw new exports.ValidationError('while validating trait consumption', null, 'use property must be an array', useProperty.start_mark);
          }
          uses.forEach(function(use) {
            if (!_this.get_trait(_this.key_or_value(use))) {
              throw new exports.ValidationError('while validating trait consumption', null, 'there is no trait named ' + _this.key_or_value(use), use.start_mark);
            }
          });
        }
        methods = _this.child_methods(resource[1]);
        methods.forEach(function(method) {
          if (_this.has_property(method[1], /^is$/i)) {
            useProperty = _this.get_property(method[1], /^is$/i);
            uses = _this.property_value(method[1], /^is$/i);
            if (!(uses instanceof Array)) {
              throw new exports.ValidationError('while validating trait consumption', null, 'use property must be an array', useProperty.start_mark);
            }
            return uses.forEach(function(use) {
              if (!_this.get_trait(_this.key_or_value(use))) {
                throw new exports.ValidationError('while validating trait consumption', null, 'there is no trait named ' + _this.key_or_value(use), use.start_mark);
              }
            });
          }
        });
        return _this.valid_trait_consumption(resource[1], traits);
      });
    };

    Validator.prototype.has_title = function(node) {
      var title;
      this.check_is_map(node);
      if (!this.has_property(node, /^title$/i)) {
        throw new exports.ValidationError('while validating title', null, 'missing title', node.start_mark);
      }
      title = this.get_property(node, "title");
      if (!(typeof title.value === 'string' || typeof title.value === 'number')) {
        throw new exports.ValidationError('while validating title', null, 'not a scalar', title.start_mark);
      }
    };

    Validator.prototype.has_version = function(node) {
      this.check_is_map(node);
      if (!this.has_property(node, /^version$/i)) {
        throw new exports.ValidationError('while validating version', null, 'missing version', node.start_mark);
      }
    };

    Validator.prototype.valid_base_uri = function(node) {
      var baeUriNode, baseUri, err, expression, expressions, template, _i, _len, _results;
      if (this.has_property(node, /^baseUri$/i)) {
        baeUriNode = this.get_property(node, /^baseUri$/i);
        baseUri = this.property_value(node, /^baseUri$/i);
        try {
          template = uritemplate.parse(baseUri);
        } catch (_error) {
          err = _error;
          throw new exports.ValidationError('while validating baseUri', null, err.options.message, baeUriNode.start_mark);
        }
        expressions = template.expressions.filter(function(expr) {
          return expr.hasOwnProperty('templateText');
        });
        _results = [];
        for (_i = 0, _len = expressions.length; _i < _len; _i++) {
          expression = expressions[_i];
          if (expression.templateText === 'version') {
            _results.push(this.has_version(node));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    };

    Validator.prototype.get_validation_errors = function() {
      return this.validation_errors;
    };

    Validator.prototype.is_valid = function() {
      return this.validation_errors.length === 0;
    };

    return Validator;

  })();

}).call(this);

(function() {
  var MarkedYAMLError, nodes, traits, uritemplate, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

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
      this.get_properties = __bind(this.get_properties, this);
      this.validations = [this.is_map, this.has_title, this.valid_base_uri, this.validate_base_uri_parameters, this.valid_root_properties, this.validate_security_schemes, this.validate_traits, this.validate_resources, this.validate_traits, this.validate_types, this.validate_root_schemas, this.valid_absolute_uris, this.valid_trait_consumption];
    }

    Validator.prototype.validate_document = function(node) {
      var _this = this;
      this.validations.forEach(function(validation) {
        return validation.call(_this, node);
      });
      return true;
    };

    Validator.prototype.validate_security_schemes = function(node) {
      var schemesProperty,
        _this = this;
      this.check_is_map(node);
      if (this.has_property(node, /^securitySchemes$/)) {
        schemesProperty = this.get_property(node, /^securitySchemes$/);
        if (!this.is_sequence(schemesProperty)) {
          throw new exports.ValidationError('while validating securitySchemes', null, 'invalid security schemes property, it must be an array', schemesProperty.start_mark);
        }
        return schemesProperty.value.forEach(function(scheme_entry) {
          if (!_this.is_mapping(scheme_entry)) {
            throw new exports.ValidationError('while validating securitySchemes', null, 'invalid security scheme property, it must be a map', scheme_entry.start_mark);
          }
          return scheme_entry.value.forEach(function(scheme) {
            if (!_this.is_mapping(scheme[1])) {
              throw new exports.ValidationError('while validating securitySchemes', null, 'invalid security scheme property, it must be a map', scheme.start_mark);
            }
            return _this.validate_security_scheme(scheme[1]);
          });
        });
      }
    };

    Validator.prototype.is_mapping = function(node) {
      return (node != null ? node.tag : void 0) === "tag:yaml.org,2002:map";
    };

    Validator.prototype.is_null = function(node) {
      return (node != null ? node.tag : void 0) === "tag:yaml.org,2002:null";
    };

    Validator.prototype.is_sequence = function(node) {
      return (node != null ? node.tag : void 0) === "tag:yaml.org,2002:seq";
    };

    Validator.prototype.is_string = function(node) {
      return (node != null ? node.tag : void 0) === "tag:yaml.org,2002:str";
    };

    Validator.prototype.is_integer = function(node) {
      return (node != null ? node.tag : void 0) === "tag:yaml.org,2002:int";
    };

    Validator.prototype.is_nullable_mapping = function(node) {
      return this.is_mapping(node) || this.is_null(node);
    };

    Validator.prototype.is_nullable_string = function(node) {
      return this.is_string(node) || this.is_null(node);
    };

    Validator.prototype.is_nullable_sequence = function(node) {
      return this.is_sequence(node) || this.is_null(node);
    };

    Validator.prototype.validate_security_scheme = function(scheme) {
      var settings, type,
        _this = this;
      this.check_is_map(scheme);
      type = null;
      settings = null;
      scheme.value.forEach(function(property) {
        switch (property[0].value) {
          case "description":
            if (!_this.is_string(property[1])) {
              throw new exports.ValidationError('while validating security scheme', null, 'schemes description must be a string', property[1].start_mark);
            }
            break;
          case "type":
            type = property[1].value;
            if (!(_this.is_string(property[1]) && type.match(/^(OAuth 1.0|OAuth 2.0|Basic Authentication|Digest Authentication|x-.+)$/))) {
              throw new exports.ValidationError('while validating security scheme', null, 'schemes type must be any of: "OAuth 1.0", "OAuth 2.0", "Basic Authentication", "Digest Authentication", "x-\{.+\}"', property[1].start_mark);
            }
            break;
          case "describedBy":
            return _this.validate_method(property, true);
          case "settings":
            settings = property;
            if (!_this.is_nullable_mapping(property[1])) {
              throw new exports.ValidationError('while validating security scheme', null, 'schemes settings must be a map', property[1].start_mark);
            }
            break;
          default:
            throw new exports.ValidationError('while validating security scheme', null, "property: '" + property[0].value + "' is invalid in a security scheme", property[0].start_mark);
        }
      });
      if (!type) {
        throw new exports.ValidationError('while validating security scheme', null, 'schemes type must be any of: "OAuth 1.0", "OAuth 2.0", "Basic Authentication", "Digest Authentication", "x-\{.+\}"', scheme.start_mark);
      } else if (type === "OAuth 2.0") {
        if (!settings) {
          throw new exports.ValidationError('while validating security scheme', null, 'for OAuth 2.0 settings must be a map', scheme.start_mark);
        }
        return this.validate_oauth2_settings(settings);
      } else if (type === "OAuth 1.0") {
        if (!settings) {
          throw new exports.ValidationError('while validating security scheme', null, 'for OAuth 1.0 settings must be a map', scheme.start_mark);
        }
        return this.validate_oauth1_settings(settings);
      }
    };

    Validator.prototype.validate_oauth2_settings = function(settings) {
      var accessTokenUrl, authorizationUrl,
        _this = this;
      authorizationUrl = false;
      accessTokenUrl = false;
      settings[1].value.forEach(function(property) {
        if (property[0].value === "authorizationUrl") {
          if (!_this.is_string(property[1])) {
            throw new exports.ValidationError('while validating security scheme', null, 'authorizationUrl must be a URL', property[0].start_mark);
          }
          authorizationUrl = true;
        }
        if (property[0].value === "accessTokenUrl") {
          if (!_this.is_string(property[1])) {
            throw new exports.ValidationError('while validating security scheme', null, 'accessTokenUrl must be a URL', property[0].start_mark);
          }
          return accessTokenUrl = true;
        }
      });
      if (!accessTokenUrl) {
        throw new exports.ValidationError('while validating security scheme', null, 'accessTokenUrl must be a URL', settings.start_mark);
      }
      if (!authorizationUrl) {
        throw new exports.ValidationError('while validating security scheme', null, 'authorizationUrl must be a URL', settings.start_mark);
      }
    };

    Validator.prototype.validate_oauth1_settings = function(settings) {
      var authorizationUri, requestTokenUri, tokenCredentialsUri,
        _this = this;
      requestTokenUri = false;
      authorizationUri = false;
      tokenCredentialsUri = false;
      settings[1].value.forEach(function(property) {
        if (property[0].value === "requestTokenUri") {
          if (!_this.is_string(property[1])) {
            throw new exports.ValidationError('while validating security scheme', null, 'requestTokenUri must be a URL', property[0].start_mark);
          }
          requestTokenUri = true;
        }
        if (property[0].value === "authorizationUri") {
          if (!_this.is_string(property[1])) {
            throw new exports.ValidationError('while validating security scheme', null, 'authorizationUri must be a URL', property[0].start_mark);
          }
          authorizationUri = true;
        }
        if (property[0].value === "tokenCredentialsUri") {
          if (!_this.is_string(property[1])) {
            throw new exports.ValidationError('while validating security scheme', null, 'tokenCredentialsUri must be a URL', property[0].start_mark);
          }
          return tokenCredentialsUri = true;
        }
      });
      if (!requestTokenUri) {
        throw new exports.ValidationError('while validating security scheme', null, 'requestTokenUri must be a URL', settings.start_mark);
      }
      if (!authorizationUri) {
        throw new exports.ValidationError('while validating security scheme', null, 'authorizationUri must be a URL', settings.start_mark);
      }
      if (!tokenCredentialsUri) {
        throw new exports.ValidationError('while validating security scheme', null, 'tokenCredentialsUri must be a URL', settings.start_mark);
      }
    };

    Validator.prototype.validate_root_schemas = function(node) {
      var schema, schemaList, schemaName, schemas, _results;
      if (this.has_property(node, /^schemas$/)) {
        schemas = this.get_property(node, /^schemas$/);
        if (!this.is_mapping(schemas)) {
          throw new exports.ValidationError('while validating schemas', null, 'schemas property must be a mapping', schemas.start_mark);
        }
        schemaList = this.get_all_schemas(node);
        _results = [];
        for (schemaName in schemaList) {
          schema = schemaList[schemaName];
          if (!(schema[1].tag && this.is_string(schema[1]))) {
            throw new exports.ValidationError('while validating schemas', null, 'schema ' + schemaName + ' must be a string', schema[0].start_mark);
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    };

    Validator.prototype.is_map = function(node) {
      if (!node) {
        throw new exports.ValidationError('while validating root', null, 'empty document', 0);
      }
      return this.check_is_map(node);
    };

    Validator.prototype.validate_base_uri_parameters = function(node) {
      var baseUri;
      this.check_is_map(node);
      if (this.has_property(node, /^baseUriParameters$/)) {
        if (!this.has_property(node, /^baseUri$/)) {
          throw new exports.ValidationError('while validating uri parameters', null, 'uri parameters defined when there is no baseUri', node.start_mark);
        }
        baseUri = this.property_value(node, /^baseUri$/);
        return this.validate_uri_parameters(baseUri, this.get_property(node, /^baseUriParameters$/));
      }
    };

    Validator.prototype.validate_uri_parameters = function(uri, uriProperty) {
      var err, expressions, template,
        _this = this;
      try {
        template = uritemplate.parse(uri);
      } catch (_error) {
        err = _error;
        throw new exports.ValidationError('while validating uri parameters', null, err.options.message, uriProperty.start_mark);
      }
      expressions = template.expressions.filter(function(expr) {
        return "templateText" in expr;
      }).map(function(expression) {
        return expression.templateText;
      });
      if (typeof uriProperty.value === "object") {
        return uriProperty.value.forEach(function(uriParameter) {
          var _ref1;
          _this.valid_common_parameter_properties(uriParameter[1]);
          if (_ref1 = uriParameter[0].value, __indexOf.call(expressions, _ref1) < 0) {
            throw new exports.ValidationError('while validating baseUri', null, uriParameter[0].value + ' uri parameter unused', uriParameter[0].start_mark);
          }
        });
      }
    };

    Validator.prototype.validate_types = function(node) {
      var typeProperty, types,
        _this = this;
      this.check_is_map(node);
      if (this.has_property(node, /^resourceTypes$/)) {
        typeProperty = this.get_property(node, /^resourceTypes$/);
        types = typeProperty.value;
        if (!this.is_sequence(typeProperty)) {
          throw new exports.ValidationError('while validating resource types', null, 'invalid resourceTypes definition, it must be an array', types.start_mark);
        }
        return types.forEach(function(type_entry) {
          if (!_this.is_mapping(type_entry)) {
            throw new exports.ValidationError('while validating resource types', null, 'invalid resourceType definition, it must be a mapping', type_entry.start_mark);
          }
          return type_entry.value.forEach(function(type) {
            if (!_this.is_mapping(type[1])) {
              throw new exports.ValidationError('while validating resource types', null, 'invalid resourceType definition, it must be a mapping', type_entry.start_mark);
            }
            return _this.validate_resource(type, true);
          });
        });
      }
    };

    Validator.prototype.validate_traits = function(node) {
      var traitsList,
        _this = this;
      this.check_is_map(node);
      if (this.has_property(node, /^traits$/)) {
        traitsList = this.property_value(node, /^traits$/);
        if (typeof traitsList !== "object") {
          throw new exports.ValidationError('while validating trait properties', null, 'invalid traits definition, it must be an array', traitsList.start_mark);
        }
        return traitsList.forEach(function(trait_entry) {
          if (!(trait_entry && trait_entry.value)) {
            throw new exports.ValidationError('while validating trait properties', null, 'invalid traits definition, it must be an array', trait_entry.start_mark);
          }
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
        return childNode[0].value === "is" || childNode[0].value === "type";
      });
      if (invalid.length > 0) {
        throw new exports.ValidationError('while validating trait properties', null, "invalid property '" + invalid[0][0].value + "'", invalid[0][0].start_mark);
      }
    };

    Validator.prototype.valid_common_parameter_properties = function(node) {
      var _this = this;
      this.check_is_map(node);
      if (!node.value) {
        return;
      }
      return node.value.forEach(function(childNode) {
        var booleanValues, propertyName, propertyValue;
        if (typeof childNode[0].value === "object") {
          return true;
        }
        if (!_this.is_valid_parameter_property_name(childNode[0].value)) {
          throw new exports.ValidationError('while validating parameter properties', null, 'unknown property ' + childNode[0].value, childNode[0].start_mark);
        }
        propertyName = childNode[0].value;
        propertyValue = childNode[1].value;
        booleanValues = ["true", "false"];
        switch (propertyName) {
          case "minLength":
            if (isNaN(propertyValue)) {
              throw new exports.ValidationError('while validating parameter properties', null, 'the value of minLength must be a number', childNode[1].start_mark);
            }
            break;
          case "maxLength":
            if (isNaN(propertyValue)) {
              throw new exports.ValidationError('while validating parameter properties', null, 'the value of maxLength must be a number', childNode[1].start_mark);
            }
            break;
          case "minimum":
            if (isNaN(propertyValue)) {
              throw new exports.ValidationError('while validating parameter properties', null, 'the value of minimum must be a number', childNode[1].start_mark);
            }
            break;
          case "maximum":
            if (isNaN(propertyValue)) {
              throw new exports.ValidationError('while validating parameter properties', null, 'the value of maximum must be a number', childNode[1].start_mark);
            }
            break;
          case "type":
            if (propertyValue !== 'string' && propertyValue !== 'number' && propertyValue !== 'integer' && propertyValue !== 'date') {
              throw new exports.ValidationError('while validating parameter properties', null, 'type can either be: string, number, integer or date', childNode[1].start_mark);
            }
            break;
          case "required":
            if (__indexOf.call(booleanValues, propertyValue) < 0) {
              throw new exports.ValidationError('while validating parameter properties', null, 'required can be any either true or false', childNode[1].start_mark);
            }
            break;
          case "repeat":
            if (__indexOf.call(booleanValues, propertyValue) < 0) {
              throw new exports.ValidationError('while validating parameter properties', null, 'repeat can be any either true or false', childNode[1].start_mark);
            }
        }
      });
    };

    Validator.prototype.valid_root_properties = function(node) {
      var invalid,
        _this = this;
      this.check_is_map(node);
      invalid = node.value.filter(function(childNode) {
        if (_this.is_sequence(childNode[0])) {
          return true;
        }
        return !_this.is_valid_root_property_name(childNode[0]);
      });
      if (invalid.length > 0) {
        throw new exports.ValidationError('while validating root properties', null, 'unknown property ' + invalid[0][0].value, invalid[0][0].start_mark);
      }
    };

    Validator.prototype.is_valid_parameter_property_name = function(propertyName) {
      return propertyName === "displayName" || propertyName === "description" || propertyName === "type" || propertyName === "enum" || propertyName === "example" || propertyName === "pattern" || propertyName === "minLength" || propertyName === "maxLength" || propertyName === "minimum" || propertyName === "maximum" || propertyName === "required" || propertyName === "repeat" || propertyName === "default";
    };

    Validator.prototype.is_valid_root_property_name = function(propertyName) {
      return propertyName.value === "title" || propertyName.value === "baseUri" || propertyName.value === "securitySchemes" || propertyName.value === "schemas" || propertyName.value === "version" || propertyName.value === "traits" || propertyName.value === "documentation" || propertyName.value === "baseUriParameters" || propertyName.value === "resourceTypes" || propertyName.value.match(/^\//);
    };

    Validator.prototype.child_resources = function(node) {
      if (node && this.is_mapping(node)) {
        return node.value.filter(function(childNode) {
          return childNode[0].value.match(/^\//);
        });
      }
      return [];
    };

    Validator.prototype.validate_resources = function(node) {
      var resources,
        _this = this;
      resources = this.child_resources(node);
      return resources.forEach(function(resource) {
        return _this.validate_resource(resource);
      });
    };

    Validator.prototype.validate_resource = function(resource, allowParameterKeys) {
      var _this = this;
      if (allowParameterKeys == null) {
        allowParameterKeys = false;
      }
      if (!(resource[1] && this.is_nullable_mapping(resource[1]))) {
        throw new exports.ValidationError('while validating resources', null, 'resource is not a mapping', resource[1].start_mark);
      }
      if (resource[1].value) {
        return resource[1].value.forEach(function(property) {
          if (!_this.validate_common_properties(property, allowParameterKeys)) {
            if (property[0].value.match(/^\//)) {
              if (allowParameterKeys) {
                throw new exports.ValidationError('while validating trait properties', null, 'resource type cannot define child resources', property[0].start_mark);
              }
              return _this.validate_resource(property, allowParameterKeys);
            } else if (property[0].value === "type") {
              return _this.validate_type_property(property, allowParameterKeys);
            } else if (property[0].value === "uriParameters") {
              return _this.validate_uri_parameters(resource[0].value, property[1]);
            } else if (property[0].value.match(/^(get|post|put|delete|head|patch|options)$/)) {
              return _this.validate_method(property, allowParameterKeys);
            } else {
              throw new exports.ValidationError('while validating resources', null, "property: '" + property[0].value + "' is invalid in a resource", property[0].start_mark);
            }
          }
        });
      }
    };

    Validator.prototype.validate_type_property = function(property, allowParameterKeys) {
      var typeName;
      typeName = this.key_or_value(property[1]);
      if (!(this.is_mapping(property[1]) || this.is_string(property[1]))) {
        throw new exports.ValidationError('while validating resources', null, "property 'type' must be a string or a mapping", property[0].start_mark);
      }
      if (!this.get_type(typeName)) {
        throw new exports.ValidationError('while validating trait consumption', null, 'there is no type named ' + typeName, property[1].start_mark);
      }
    };

    Validator.prototype.validate_method = function(method, allowParameterKeys) {
      var _this = this;
      if (this.is_null(method[1])) {
        return;
      }
      if (!this.is_mapping(method[1])) {
        throw new exports.ValidationError('while validating methods', null, "method must be a mapping", method[0].start_mark);
      }
      return method[1].value.forEach(function(property) {
        if (!_this.validate_common_properties(property, allowParameterKeys)) {
          if (property[0].value === "headers") {
            return _this.validate_headers(property, allowParameterKeys);
          } else if (property[0].value === "queryParameters") {
            return _this.validate_query_params(property, allowParameterKeys);
          } else if (property[0].value === "body") {
            return _this.validate_body(property, allowParameterKeys);
          } else if (property[0].value === "responses") {
            return _this.validate_responses(property, allowParameterKeys);
          } else if (property[0].value === "securedBy") {
            if (!_this.is_sequence(property[1])) {
              throw new exports.ValidationError('while validating resources', null, "property 'securedBy' must be a list", property[0].start_mark);
            }
            return property[1].value.forEach(function(secScheme) {
              var securitySchemeName;
              if (_this.is_sequence(secScheme)) {
                throw new exports.ValidationError('while validating securityScheme consumption', null, 'securityScheme reference cannot be a list', secScheme.start_mark);
              }
              if (!_this.is_null(secScheme)) {
                securitySchemeName = _this.key_or_value(secScheme);
                if (!_this.get_security_scheme(securitySchemeName)) {
                  throw new exports.ValidationError('while validating securityScheme consumption', null, 'there is no securityScheme named ' + securitySchemeName, secScheme.start_mark);
                }
              }
            });
          } else {
            throw new exports.ValidationError('while validating resources', null, "property: '" + property[0].value + "' is invalid in a method", property[0].start_mark);
          }
        }
      });
    };

    Validator.prototype.validate_responses = function(responses, allowParameterKeys) {
      var _this = this;
      if (this.is_null(responses[1])) {
        return;
      }
      if (!this.is_mapping(responses[1])) {
        throw new exports.ValidationError('while validating query parameters', null, "property: 'responses' must be a mapping", responses[0].start_mark);
      }
      return responses[1].value.forEach(function(response) {
        if (!_this.is_nullable_mapping(response[1])) {
          throw new exports.ValidationError('while validating query parameters', null, "each response must be a mapping", response[1].start_mark);
        }
        return _this.validate_response(response, allowParameterKeys);
      });
    };

    Validator.prototype.validate_query_params = function(property, allowParameterKeys) {
      var _this = this;
      if (this.is_null(property[1])) {
        return;
      }
      if (!this.is_mapping(property[1])) {
        throw new exports.ValidationError('while validating query parameters', null, "property: 'queryParameters' must be a mapping", property[0].start_mark);
      }
      return property[1].value.forEach(function(param) {
        if (!_this.is_nullable_mapping(param[1])) {
          throw new exports.ValidationError('while validating query parameters', null, "each query parameter must be a mapping", param[1].start_mark);
        }
        return _this.valid_common_parameter_properties(param[1], allowParameterKeys);
      });
    };

    Validator.prototype.validate_form_params = function(property, allowParameterKeys) {
      var _this = this;
      if (this.is_null(property[1])) {
        return;
      }
      if (!this.is_mapping(property[1])) {
        throw new exports.ValidationError('while validating query parameters', null, "property: 'formParameters' must be a mapping", property[0].start_mark);
      }
      return property[1].value.forEach(function(param) {
        if (!_this.is_nullable_mapping(param[1])) {
          throw new exports.ValidationError('while validating query parameters', null, "each form parameter must be a mapping", param[1].start_mark);
        }
        return _this.valid_common_parameter_properties(param[1], allowParameterKeys);
      });
    };

    Validator.prototype.validate_headers = function(property, allowParameterKeys) {
      var _this = this;
      if (this.is_null(property[1])) {
        return;
      }
      if (!this.is_mapping(property[1])) {
        throw new exports.ValidationError('while validating headers', null, "property: 'headers' must be a mapping", property[0].start_mark);
      }
      return property[1].value.forEach(function(param) {
        if (!_this.is_nullable_mapping(param[1])) {
          throw new exports.ValidationError('while validating query parameters', null, "each header must be a mapping", param[1].start_mark);
        }
        return _this.valid_common_parameter_properties(param[1], allowParameterKeys);
      });
    };

    Validator.prototype.validate_response = function(response, allowParameterKeys) {
      var _this = this;
      if (this.is_sequence(response[0])) {
        if (!response[0].value.length) {
          throw new exports.ValidationError('while validating responses', null, "there must be at least one response code", responseCode.start_mark);
        }
        response[0].value.forEach(function(responseCode) {
          if (!_this.is_integer(responseCode)) {
            throw new exports.ValidationError('while validating responses', null, "each response key must be an integer", responseCode.start_mark);
          }
        });
      } else if (!this.is_integer(response[0])) {
        throw new exports.ValidationError('while validating responses', null, "each response key must be an integer", response[0].start_mark);
      }
      if (!this.is_mapping(response[1])) {
        throw new exports.ValidationError('while validating responses', null, "each response property must be a mapping", response[0].start_mark);
      }
      return response[1].value.forEach(function(property) {
        if (property[0].value.match(/^body$/)) {
          return _this.validate_body(property, allowParameterKeys);
        } else if (property[0].value.match(/^description$/)) {
          if (!_this.is_nullable_string(property[1])) {
            throw new exports.ValidationError('while validating responses', null, "property description must be a string", response[0].start_mark);
          }
        } else if (property[0].value.match(/^summary$/)) {
          if (!_this.is_string(property[1])) {
            throw new exports.ValidationError('while validating resources', null, "property 'summary' must be a string", property[0].start_mark);
          }
        } else {
          throw new exports.ValidationError('while validating response', null, "property: '" + property[0].value + "' is invalid in a response", property[0].start_mark);
        }
      });
    };

    Validator.prototype.validate_body = function(property, allowParameterKeys, bodyMode) {
      var _ref1,
        _this = this;
      if (bodyMode == null) {
        bodyMode = null;
      }
      if (this.is_null(property[1])) {
        return;
      }
      if (!this.is_mapping(property[1])) {
        throw new exports.ValidationError('while validating body', null, "property: body specification must be a mapping", property[0].start_mark);
      }
      return (_ref1 = property[1].value) != null ? _ref1.forEach(function(bodyProperty) {
        if (bodyProperty[0].value.match(/<<([^>]+)>>/)) {
          if (!allowParameterKeys) {
            throw new exports.ValidationError('while validating body', null, "property '" + bodyProperty[0].value + "' is invalid in a resource", bodyProperty[0].start_mark);
          }
        } else if (bodyProperty[0].value.match(/^[^\/]+\/[^\/]+$/)) {
          if (bodyMode && bodyMode !== "explicit") {
            throw new exports.ValidationError('while validating body', null, "not compatible with implicit default Media Type", bodyProperty[0].start_mark);
          }
          bodyMode = "explicit";
          return _this.validate_body(bodyProperty, allowParameterKeys, "implicit");
        } else if (bodyProperty[0].value === "formParameters") {
          if (bodyMode && bodyMode !== "implicit") {
            throw new exports.ValidationError('while validating body', null, "not compatible with explicit default Media Type", bodyProperty[0].start_mark);
          }
          bodyMode = "implicit";
          return _this.validate_form_params(bodyProperty, allowParameterKeys);
        } else if (bodyProperty[0].value === "example") {
          if (bodyMode && bodyMode !== "implicit") {
            throw new exports.ValidationError('while validating body', null, "not compatible with explicit default Media Type", bodyProperty[0].start_mark);
          }
          bodyMode = "implicit";
          if (_this.is_mapping(bodyProperty[1] || _this.is_sequence(bodyProperty[1]))) {
            throw new exports.ValidationError('while validating body', null, "example must be a string", bodyProperty[0].start_mark);
          }
        } else if (bodyProperty[0].value === "schema") {
          if (bodyMode && bodyMode !== "implicit") {
            throw new exports.ValidationError('while validating body', null, "not compatible with explicit default Media Type", bodyProperty[0].start_mark);
          }
          bodyMode = "implicit";
          if (_this.is_mapping(bodyProperty[1]) || _this.is_sequence(bodyProperty[1])) {
            throw new exports.ValidationError('while validating body', null, "schema must be a string", bodyProperty[0].start_mark);
          }
        } else {
          throw new exports.ValidationError('while validating body', null, "property: '" + bodyProperty[0].value + "' is invalid in a body", bodyProperty[0].start_mark);
        }
      }) : void 0;
    };

    Validator.prototype.validate_common_properties = function(property, allowParameterKeys) {
      var _this = this;
      if (property[0].value.match(/<<([^>]+)>>/)) {
        if (!allowParameterKeys) {
          throw new exports.ValidationError('while validating resources', null, "property '" + property[0].value + "' is invalid in a resource", property[0].start_mark);
        }
        return true;
      } else if (property[0].value === "displayName") {
        if (!this.is_string(property[1])) {
          throw new exports.ValidationError('while validating resources', null, "property 'displayName' must be a string", property[0].start_mark);
        }
        return true;
      } else if (property[0].value === "summary") {
        if (!this.is_string(property[1])) {
          throw new exports.ValidationError('while validating resources', null, "property 'summary' must be a string", property[0].start_mark);
        }
        return true;
      } else if (property[0].value === "description") {
        if (!this.is_string(property[1])) {
          throw new exports.ValidationError('while validating resources', null, "property 'description' must be a string", property[0].start_mark);
        }
        return true;
      } else if (property[0].value === "is") {
        if (!this.is_sequence(property[1])) {
          throw new exports.ValidationError('while validating resources', null, "property 'is' must be a list", property[0].start_mark);
        }
        if (!(property[1].value instanceof Array)) {
          throw new exports.ValidationError('while validating trait consumption', null, 'is property must be an array', property[0].start_mark);
        }
        property[1].value.forEach(function(use) {
          var traitName;
          traitName = _this.key_or_value(use);
          if (!_this.get_trait(traitName)) {
            throw new exports.ValidationError('while validating trait consumption', null, 'there is no trait named ' + traitName, use.start_mark);
          }
        });
        return true;
      }
      return false;
    };

    Validator.prototype.child_methods = function(node) {
      if (!(node && this.is_mapping(node))) {
        return [];
      }
      return node.value.filter(function(childNode) {
        return childNode[0].value.match(/^(get|post|put|delete|head|patch|options)$/);
      });
    };

    Validator.prototype.has_property = function(node, property) {
      if (node && this.is_mapping(node)) {
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
      var filteredNodes,
        _this = this;
      if (node && this.is_mapping(node)) {
        filteredNodes = node.value.filter(function(childNode) {
          return _this.is_string(childNode[0]) && childNode[0].value.match(property);
        });
        if (filteredNodes.length > 0) {
          if (filteredNodes[0].length > 0) {
            return filteredNodes[0][1];
          }
        }
      }
      return [];
    };

    Validator.prototype.get_properties = function(node, property) {
      var properties,
        _this = this;
      properties = [];
      if (node && this.is_mapping(node)) {
        node.value.forEach(function(prop) {
          if (_this.is_string(prop[0]) && prop[0].value.match(property)) {
            return properties.push(prop);
          } else {
            return properties = properties.concat(_this.get_properties(prop[1], property));
          }
        });
      }
      return properties;
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
        if (_this.has_property(childResource[1], /^displayName$/)) {
          resourceResponse.displayName = _this.property_value(childResource[1], /^displayName$/);
        }
        if (_this.has_property(childResource[1], /^get$/)) {
          resourceResponse.methods.push('get');
        }
        if (_this.has_property(childResource[1], /^post$/)) {
          resourceResponse.methods.push('post');
        }
        if (_this.has_property(childResource[1], /^put$/)) {
          resourceResponse.methods.push('put');
        }
        if (_this.has_property(childResource[1], /^patch$/)) {
          resourceResponse.methods.push('patch');
        }
        if (_this.has_property(childResource[1], /^delete$/)) {
          resourceResponse.methods.push('delete');
        }
        if (_this.has_property(childResource[1], /^head$/)) {
          resourceResponse.methods.push('head');
        }
        if (_this.has_property(childResource[1], /^options$/)) {
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
      if (!this.is_nullable_mapping(node)) {
        throw new exports.ValidationError('while validating resources', null, 'resource is not a mapping', node.start_mark);
      }
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
        var methods, uses;
        if (_this.has_property(resource[1], /^is$/)) {
          uses = _this.property_value(resource[1], /^is$/);
          uses.forEach(function(use) {
            if (!_this.get_trait(_this.key_or_value(use))) {
              throw new exports.ValidationError('while validating trait consumption', null, 'there is no trait named ' + _this.key_or_value(use), use.start_mark);
            }
          });
        }
        methods = _this.child_methods(resource[1]);
        methods.forEach(function(method) {
          if (_this.has_property(method[1], /^is$/)) {
            uses = _this.property_value(method[1], /^is$/);
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
      if (!this.has_property(node, /^title$/)) {
        throw new exports.ValidationError('while validating title', null, 'missing title', node.start_mark);
      }
      title = this.get_property(node, "title");
      if (!(typeof title.value === 'string' || typeof title.value === 'number')) {
        throw new exports.ValidationError('while validating title', null, 'not a scalar', title.start_mark);
      }
    };

    Validator.prototype.has_version = function(node) {
      this.check_is_map(node);
      if (!this.has_property(node, /^version$/)) {
        throw new exports.ValidationError('while validating version', null, 'missing version', node.start_mark);
      }
    };

    Validator.prototype.valid_base_uri = function(node) {
      var baeUriNode, baseUri, err, expression, expressions, template, _i, _len, _results;
      if (this.has_property(node, /^baseUri$/)) {
        baeUriNode = this.get_property(node, /^baseUri$/);
        baseUri = this.property_value(node, /^baseUri$/);
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

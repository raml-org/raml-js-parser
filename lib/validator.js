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
      this.validations = [this.is_map, this.validate_base_uri_parameters, this.valid_root_properties, this.valid_absolute_uris];
    }

    Validator.prototype.validate_document = function(node) {
      var _this = this;
      this.validations.forEach(function(validation) {
        return validation.call(_this, node);
      });
      return true;
    };

    Validator.prototype.validate_security_schemes = function(schemesProperty) {
      var _this = this;
      if (!this.isSequence(schemesProperty)) {
        throw new exports.ValidationError('while validating securitySchemes', null, 'invalid security schemes property, it must be an array', schemesProperty.start_mark);
      }
      return schemesProperty.value.forEach(function(scheme_entry) {
        if (!_this.isMapping(scheme_entry)) {
          throw new exports.ValidationError('while validating securitySchemes', null, 'invalid security scheme property, it must be a map', scheme_entry.start_mark);
        }
        return scheme_entry.value.forEach(function(scheme) {
          if (!_this.isMapping(scheme[1])) {
            throw new exports.ValidationError('while validating securitySchemes', null, 'invalid security scheme property, it must be a map', scheme.start_mark);
          }
          return _this.validate_security_scheme(scheme[1]);
        });
      });
    };

    Validator.prototype.isMapping = function(node) {
      return (node != null ? node.tag : void 0) === "tag:yaml.org,2002:map";
    };

    Validator.prototype.isNull = function(node) {
      return (node != null ? node.tag : void 0) === "tag:yaml.org,2002:null";
    };

    Validator.prototype.isSequence = function(node) {
      return (node != null ? node.tag : void 0) === "tag:yaml.org,2002:seq";
    };

    Validator.prototype.isString = function(node) {
      return (node != null ? node.tag : void 0) === "tag:yaml.org,2002:str";
    };

    Validator.prototype.isInteger = function(node) {
      return (node != null ? node.tag : void 0) === "tag:yaml.org,2002:int";
    };

    Validator.prototype.isNullableMapping = function(node) {
      return this.isMapping(node) || this.isNull(node);
    };

    Validator.prototype.isNullableString = function(node) {
      return this.isString(node) || this.isNull(node);
    };

    Validator.prototype.isNullableSequence = function(node) {
      return this.isSequence(node) || this.isNull(node);
    };

    Validator.prototype.isScalar = function(node) {
      return (node != null ? node.tag : void 0) === 'tag:yaml.org,2002:null' || (node != null ? node.tag : void 0) === 'tag:yaml.org,2002:bool' || (node != null ? node.tag : void 0) === 'tag:yaml.org,2002:int' || (node != null ? node.tag : void 0) === 'tag:yaml.org,2002:float' || (node != null ? node.tag : void 0) === 'tag:yaml.org,2002:binary' || (node != null ? node.tag : void 0) === 'tag:yaml.org,2002:timestamp' || (node != null ? node.tag : void 0) === 'tag:yaml.org,2002:str';
    };

    Validator.prototype.isCollection = function(node) {
      return (node != null ? node.tag : void 0) === 'tag:yaml.org,2002:omap' || (node != null ? node.tag : void 0) === 'tag:yaml.org,2002:pairs' || (node != null ? node.tag : void 0) === 'tag:yaml.org,2002:set' || (node != null ? node.tag : void 0) === 'tag:yaml.org,2002:seq' || (node != null ? node.tag : void 0) === 'tag:yaml.org,2002:map';
    };

    Validator.prototype.validate_security_scheme = function(scheme) {
      var settings, type,
        _this = this;
      type = null;
      settings = null;
      scheme.value.forEach(function(property) {
        switch (property[0].value) {
          case "description":
            if (!_this.isScalar(property[1])) {
              throw new exports.ValidationError('while validating security scheme', null, 'schemes description must be a string', property[1].start_mark);
            }
            break;
          case "type":
            type = property[1].value;
            if (!(_this.isString(property[1]) && type.match(/^(OAuth 1.0|OAuth 2.0|Basic Authentication|Digest Authentication|x-.+)$/))) {
              throw new exports.ValidationError('while validating security scheme', null, 'schemes type must be any of: "OAuth 1.0", "OAuth 2.0", "Basic Authentication", "Digest Authentication", "x-\{.+\}"', property[1].start_mark);
            }
            break;
          case "describedBy":
            return _this.validate_method(property, true);
          case "settings":
            settings = property;
            if (!_this.isNullableMapping(property[1])) {
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
        switch (property[0].value) {
          case "authorizationUrl":
            if (!_this.isString(property[1])) {
              throw new exports.ValidationError('while validating security scheme', null, 'authorizationUrl must be a URL', property[0].start_mark);
            }
            return authorizationUrl = true;
          case "accessTokenUrl":
            if (!_this.isString(property[1])) {
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
        switch (property[0].value) {
          case "requestTokenUri":
            if (!_this.isString(property[1])) {
              throw new exports.ValidationError('while validating security scheme', null, 'requestTokenUri must be a URL', property[0].start_mark);
            }
            return requestTokenUri = true;
          case "authorizationUri":
            if (!_this.isString(property[1])) {
              throw new exports.ValidationError('while validating security scheme', null, 'authorizationUri must be a URL', property[0].start_mark);
            }
            return authorizationUri = true;
          case "tokenCredentialsUri":
            if (!_this.isString(property[1])) {
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

    Validator.prototype.validate_root_schemas = function(schemas) {
      var schema, schemaList, schemaName, _results;
      if (!this.isSequence(schemas)) {
        throw new exports.ValidationError('while validating schemas', null, 'schemas property must be an array', schemas.start_mark);
      }
      schemaList = this.get_all_schemas();
      _results = [];
      for (schemaName in schemaList) {
        schema = schemaList[schemaName];
        if (!(schema[1].tag && this.isString(schema[1]))) {
          throw new exports.ValidationError('while validating schemas', null, 'schema ' + schemaName + ' must be a string', schema[0].start_mark);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Validator.prototype.is_map = function(node) {
      if (!(node || this.isNull(node))) {
        throw new exports.ValidationError('while validating root', null, 'empty document', 0);
      }
      if (!this.isMapping(node)) {
        throw new exports.ValidationError('while validating root', null, 'document must be a mapping', 0);
      }
    };

    Validator.prototype.validate_base_uri_parameters = function(node) {
      var baseUriProperty;
      baseUriProperty = this.get_property(node, "baseUri");
      this.baseUri = baseUriProperty.value;
      if (this.has_property(node, "baseUriParameters")) {
        if (!this.isScalar(baseUriProperty)) {
          throw new exports.ValidationError('while validating uri parameters', null, 'uri parameters defined when there is no baseUri', node.start_mark);
        }
        return this.validate_uri_parameters(this.baseUri, this.get_property(node, "baseUriParameters"), false, false, ["version"]);
      }
    };

    Validator.prototype.validate_uri_parameters = function(uri, uriProperty, allowParameterKeys, skipParameterUseCheck, reservedNames) {
      var err, expressions, template, _ref1,
        _this = this;
      if (reservedNames == null) {
        reservedNames = [];
      }
      try {
        template = uritemplate.parse(uri);
      } catch (_error) {
        err = _error;
        throw new exports.ValidationError('while validating uri parameters', null, err != null ? (_ref1 = err.options) != null ? _ref1.message : void 0 : void 0, uriProperty.start_mark);
      }
      expressions = template.expressions.filter(function(expr) {
        return "templateText" in expr;
      }).map(function(expression) {
        return expression.templateText;
      });
      if (typeof uriProperty.value === "object") {
        return uriProperty.value.forEach(function(uriParameter) {
          var parameterName;
          parameterName = _this.canonicalizePropertyName(uriParameter[0].value, allowParameterKeys);
          if (__indexOf.call(reservedNames, parameterName) >= 0) {
            throw new exports.ValidationError('while validating baseUri', null, uriParameter[0].value + ' parameter not allowed here', uriParameter[0].start_mark);
          }
          if (!_this.isNullableMapping(uriParameter[1])) {
            throw new exports.ValidationError('while validating baseUri', null, 'parameter must be a mapping', uriParameter[0].start_mark);
          }
          if (!_this.isNull(uriParameter[1])) {
            _this.valid_common_parameter_properties(uriParameter[1], allowParameterKeys);
          }
          if (!(skipParameterUseCheck || _this.isParameterKey(uriParameter) || __indexOf.call(expressions, parameterName) >= 0)) {
            throw new exports.ValidationError('while validating baseUri', null, uriParameter[0].value + ' uri parameter unused', uriParameter[0].start_mark);
          }
        });
      }
    };

    Validator.prototype.validate_types = function(typeProperty) {
      var types,
        _this = this;
      types = typeProperty.value;
      if (!this.isSequence(typeProperty)) {
        throw new exports.ValidationError('while validating resource types', null, 'invalid resourceTypes definition, it must be an array', typeProperty.start_mark);
      }
      return types.forEach(function(type_entry) {
        if (!_this.isMapping(type_entry)) {
          throw new exports.ValidationError('while validating resource types', null, 'invalid resourceType definition, it must be a mapping', type_entry.start_mark);
        }
        return type_entry.value.forEach(function(type) {
          if (!_this.isMapping(type[1])) {
            throw new exports.ValidationError('while validating resource types', null, 'invalid resourceType definition, it must be a mapping', type_entry.start_mark);
          }
          return _this.validate_resource(type, true, 'resource type');
        });
      });
    };

    Validator.prototype.validate_traits = function(traitProperty) {
      var _this = this;
      traits = traitProperty.value;
      if (!Array.isArray(traits)) {
        throw new exports.ValidationError('while validating traits', null, 'invalid traits definition, it must be an array', traitProperty.start_mark);
      }
      return traits.forEach(function(trait_entry) {
        if (!Array.isArray(trait_entry.value)) {
          throw new exports.ValidationError('while validating traits', null, 'invalid traits definition, it must be an array', traitProperty.start_mark);
        }
        return trait_entry.value.forEach(function(trait) {
          return _this.valid_traits_properties(trait);
        });
      });
    };

    Validator.prototype.valid_traits_properties = function(node) {
      var invalid;
      if (!node[1].value) {
        return;
      }
      invalid = node[1].value.filter(function(childNode) {
        return childNode[0].value === "is" || childNode[0].value === "type";
      });
      if (invalid.length > 0) {
        throw new exports.ValidationError('while validating trait properties', null, "property: '" + invalid[0][0].value + "' is invalid in a trait", invalid[0][0].start_mark);
      }
      return this.validate_method(node, true, 'trait');
    };

    Validator.prototype.canonicalizePropertyName = function(propertyName, mustRemoveQuestionMark) {
      if (mustRemoveQuestionMark && propertyName.slice(-1) === '?') {
        return propertyName.slice(0, -1);
      }
      return propertyName;
    };

    Validator.prototype.valid_common_parameter_properties = function(node, allowParameterKeys) {
      var _this = this;
      if (!node.value) {
        return;
      }
      return node.value.forEach(function(childNode) {
        var booleanValues, canonicalPropertyName, propertyName, propertyValue, validTypes;
        propertyName = childNode[0].value;
        propertyValue = childNode[1].value;
        booleanValues = ["true", "false"];
        if (allowParameterKeys && _this.isParameterKey(childNode)) {
          return;
        }
        canonicalPropertyName = _this.canonicalizePropertyName(propertyName, allowParameterKeys);
        switch (canonicalPropertyName) {
          case "displayName":
            if (!_this.isScalar(childNode[1])) {
              throw new exports.ValidationError('while validating parameter properties', null, 'the value of displayName must be a scalar', childNode[1].start_mark);
            }
            break;
          case "pattern":
            if (!_this.isScalar(childNode[1])) {
              throw new exports.ValidationError('while validating parameter properties', null, 'the value of pattern must be a scalar', childNode[1].start_mark);
            }
            break;
          case "default":
            if (!_this.isScalar(childNode[1])) {
              throw new exports.ValidationError('while validating parameter properties', null, 'the value of default must be a scalar', childNode[1].start_mark);
            }
            break;
          case "enum":
            if (!_this.isSequence(childNode[1])) {
              throw new exports.ValidationError('while validating parameter properties', null, 'the value of displayName must be an array', childNode[1].start_mark);
            }
            break;
          case "description":
            if (!_this.isScalar(childNode[1])) {
              throw new exports.ValidationError('while validating parameter properties', null, 'the value of description must be a scalar', childNode[1].start_mark);
            }
            break;
          case "example":
            if (!_this.isScalar(childNode[1])) {
              throw new exports.ValidationError('while validating parameter properties', null, 'the value of example must be a scalar', childNode[1].start_mark);
            }
            break;
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
            validTypes = ['string', 'number', 'integer', 'date', 'boolean', 'file'];
            if (__indexOf.call(validTypes, propertyValue) < 0) {
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
            break;
          default:
            throw new exports.ValidationError('while validating parameter properties', null, 'unknown property ' + propertyName, childNode[0].start_mark);
        }
      });
    };

    Validator.prototype.valid_root_properties = function(node) {
      var checkVersion, hasTitle, hasVersion,
        _this = this;
      hasTitle = false;
      checkVersion = false;
      hasVersion = false;
      if (node != null ? node.value : void 0) {
        node.value.forEach(function(property) {
          if (!_this.isString(property[0])) {
            throw new exports.ValidationError('while validating root properties', null, 'keys can only be strings', property[0].start_mark);
          }
          switch (property[0].value) {
            case "title":
              hasTitle = true;
              if (!_this.isScalar(property[1])) {
                throw new exports.ValidationError('while validating root properties', null, 'title must be a string', property[0].start_mark);
              }
              break;
            case "baseUri":
              if (!_this.isScalar(property[1])) {
                throw new exports.ValidationError('while validating root properties', null, 'baseUri must be a string', property[0].start_mark);
              }
              return checkVersion = _this.validate_base_uri(property[1]);
            case "securitySchemes":
              return _this.validate_security_schemes(property[1]);
            case "schemas":
              return _this.validate_root_schemas(property[1]);
            case "version":
              hasVersion = true;
              if (!_this.isScalar(property[1])) {
                throw new exports.ValidationError('while validating root properties', null, 'version must be a string', property[0].start_mark);
              }
              break;
            case "traits":
              return _this.validate_traits(property[1]);
            case "documentation":
              if (!_this.isSequence(property[1])) {
                throw new exports.ValidationError('while validating root properties', null, 'documentation must be an array', property[0].start_mark);
              }
              return _this.validate_documentation(property[1]);
            case "baseUriParameters":
              return _this.is_map(node);
            case "resourceTypes":
              return _this.validate_types(property[1]);
            case "securedBy":
              return _this.validate_secured_by(property);
            default:
              if (property[0].value.match(/^\//)) {
                return _this.validate_resource(property);
              } else {
                throw new exports.ValidationError('while validating root properties', null, 'unknown property ' + property[0].value, property[0].start_mark);
              }
          }
        });
      }
      if (!hasTitle) {
        throw new exports.ValidationError('while validating root properties', null, 'missing title', node.start_mark);
      }
      if (checkVersion && !hasVersion) {
        throw new exports.ValidationError('while validating version', null, 'missing version', node.start_mark);
      }
    };

    Validator.prototype.validate_documentation = function(documentation_property) {
      var _this = this;
      if (!documentation_property.value.length) {
        throw new exports.ValidationError('while validating documentation section', null, 'there must be at least one document in the documentation section', documentation_property.start_mark);
      }
      return documentation_property.value.forEach(function(docSection) {
        return _this.validate_doc_section(docSection);
      });
    };

    Validator.prototype.validate_doc_section = function(docSection) {
      var hasContent, hasTitle,
        _this = this;
      if (!this.isMapping(docSection)) {
        throw new exports.ValidationError('while validating documentation section', null, 'each documentation section must be a mapping', docSection.start_mark);
      }
      hasTitle = false;
      hasContent = false;
      docSection.value.forEach(function(property) {
        if (!_this.isScalar(property[0])) {
          throw new exports.ValidationError('while validating documentation section', null, 'keys can only be strings', property[0].start_mark);
        }
        switch (property[0].value) {
          case "title":
            if (!(_this.isScalar(property[1]) && !_this.isNull(property[1]))) {
              throw new exports.ValidationError('while validating documentation section', null, 'title must be a string', property[0].start_mark);
            }
            return hasTitle = true;
          case "content":
            if (!(_this.isScalar(property[1]) && !_this.isNull(property[1]))) {
              throw new exports.ValidationError('while validating documentation section', null, 'content must be a string', property[0].start_mark);
            }
            return hasContent = true;
          default:
            throw new exports.ValidationError('while validating root properties', null, 'unknown property ' + property[0].value, property[0].start_mark);
        }
      });
      if (!hasContent) {
        throw new exports.ValidationError('while validating documentation section', null, 'a documentation entry must have content property', docSection.start_mark);
      }
      if (!hasTitle) {
        throw new exports.ValidationError('while validating documentation section', null, 'a documentation entry must have title property', docSection.start_mark);
      }
    };

    Validator.prototype.child_resources = function(node) {
      if (node && this.isMapping(node)) {
        return node.value.filter(function(childNode) {
          return childNode[0].value.match(/^\//);
        });
      }
      return [];
    };

    Validator.prototype.validate_resource = function(resource, allowParameterKeys, context) {
      var _this = this;
      if (allowParameterKeys == null) {
        allowParameterKeys = false;
      }
      if (context == null) {
        context = "resource";
      }
      if (!(resource[1] && this.isNullableMapping(resource[1]))) {
        throw new exports.ValidationError('while validating resources', null, 'resource is not a mapping', resource[1].start_mark);
      }
      if (resource[1].value) {
        return resource[1].value.forEach(function(property) {
          var canonicalKey, key, valid;
          if (!_this.validate_common_properties(property, allowParameterKeys)) {
            if (property[0].value.match(/^\//)) {
              if (allowParameterKeys) {
                throw new exports.ValidationError('while validating trait properties', null, 'resource type cannot define child resources', property[0].start_mark);
              }
              return _this.validate_resource(property, allowParameterKeys);
            } else if (property[0].value.match(new RegExp("^(get|post|put|delete|head|patch|options)" + (allowParameterKeys ? '\\??' : '') + "$"))) {
              return _this.validate_method(property, allowParameterKeys);
            } else {
              key = property[0].value;
              canonicalKey = _this.canonicalizePropertyName(key, allowParameterKeys);
              valid = true;
              switch (canonicalKey) {
                case "uriParameters":
                  _this.validate_uri_parameters(resource[0].value, property[1], allowParameterKeys, allowParameterKeys);
                  break;
                case "baseUriParameters":
                  if (!_this.baseUri) {
                    throw new exports.ValidationError('while validating uri parameters', null, 'base uri parameters defined when there is no baseUri', property[0].start_mark);
                  }
                  _this.validate_uri_parameters(_this.baseUri, property[1], allowParameterKeys);
                  break;
                default:
                  valid = false;
              }
              switch (key) {
                case "type":
                  return _this.validate_type_property(property, allowParameterKeys);
                case "usage":
                  if (!allowParameterKeys) {
                    throw new exports.ValidationError('while validating resources', null, "property: '" + property[0].value + "' is invalid in a resource", property[0].start_mark);
                  }
                  break;
                case "securedBy":
                  return _this.validate_secured_by(property);
                default:
                  if (!valid) {
                    throw new exports.ValidationError('while validating resources', null, "property: '" + property[0].value + ("' is invalid in a " + context), property[0].start_mark);
                  }
              }
            }
          }
        });
      }
    };

    Validator.prototype.validate_secured_by = function(property) {
      var _this = this;
      if (!this.isSequence(property[1])) {
        throw new exports.ValidationError('while validating securityScheme', null, "property 'securedBy' must be a list", property[0].start_mark);
      }
      return property[1].value.forEach(function(secScheme) {
        var securitySchemeName;
        if (_this.isSequence(secScheme)) {
          throw new exports.ValidationError('while validating securityScheme consumption', null, 'securityScheme reference cannot be a list', secScheme.start_mark);
        }
        if (!_this.isNull(secScheme)) {
          securitySchemeName = _this.key_or_value(secScheme);
          if (!_this.get_security_scheme(securitySchemeName)) {
            throw new exports.ValidationError('while validating securityScheme consumption', null, 'there is no securityScheme named ' + securitySchemeName, secScheme.start_mark);
          }
        }
      });
    };

    Validator.prototype.validate_type_property = function(property, allowParameterKeys) {
      var typeName;
      typeName = this.key_or_value(property[1]);
      if (!(this.isMapping(property[1]) || this.isString(property[1]))) {
        throw new exports.ValidationError('while validating resources', null, "property 'type' must be a string or a mapping", property[0].start_mark);
      }
      if (!this.get_type(typeName)) {
        throw new exports.ValidationError('while validating trait consumption', null, 'there is no type named ' + typeName, property[1].start_mark);
      }
    };

    Validator.prototype.validate_method = function(method, allowParameterKeys, context) {
      var _this = this;
      if (context == null) {
        context = 'method';
      }
      if (this.isNull(method[1])) {
        return;
      }
      if (!this.isMapping(method[1])) {
        throw new exports.ValidationError('while validating methods', null, "method must be a mapping", method[0].start_mark);
      }
      return method[1].value.forEach(function(property) {
        var canonicalKey, key, valid;
        if (_this.validate_common_properties(property, allowParameterKeys)) {
          return;
        }
        key = property[0].value;
        canonicalKey = _this.canonicalizePropertyName(key, allowParameterKeys);
        valid = true;
        switch (canonicalKey) {
          case "headers":
            _this.validate_headers(property, allowParameterKeys);
            break;
          case "queryParameters":
            _this.validate_query_params(property, allowParameterKeys);
            break;
          case "body":
            _this.validate_body(property, allowParameterKeys);
            break;
          case "responses":
            _this.validate_responses(property, allowParameterKeys);
            break;
          default:
            valid = false;
        }
        switch (key) {
          case "securedBy":
            return _this.validate_secured_by(property);
          default:
            if (!valid) {
              throw new exports.ValidationError('while validating resources', null, "property: '" + property[0].value + ("' is invalid in a " + context), property[0].start_mark);
            }
        }
      });
    };

    Validator.prototype.validate_responses = function(responses, allowParameterKeys) {
      var _this = this;
      if (this.isNull(responses[1])) {
        return;
      }
      if (!this.isMapping(responses[1])) {
        throw new exports.ValidationError('while validating query parameters', null, "property: 'responses' must be a mapping", responses[0].start_mark);
      }
      return responses[1].value.forEach(function(response) {
        if (!_this.isNullableMapping(response[1])) {
          throw new exports.ValidationError('while validating query parameters', null, "each response must be a mapping", response[1].start_mark);
        }
        return _this.validate_response(response, allowParameterKeys);
      });
    };

    Validator.prototype.validate_query_params = function(property, allowParameterKeys) {
      var _this = this;
      if (this.isNull(property[1])) {
        return;
      }
      if (!this.isMapping(property[1])) {
        throw new exports.ValidationError('while validating query parameters', null, "property: 'queryParameters' must be a mapping", property[0].start_mark);
      }
      return property[1].value.forEach(function(param) {
        if (!_this.isNullableMapping(param[1])) {
          throw new exports.ValidationError('while validating query parameters', null, "each query parameter must be a mapping", param[1].start_mark);
        }
        return _this.valid_common_parameter_properties(param[1], allowParameterKeys);
      });
    };

    Validator.prototype.validate_form_params = function(property, allowParameterKeys) {
      var _this = this;
      if (this.isNull(property[1])) {
        return;
      }
      if (!this.isMapping(property[1])) {
        throw new exports.ValidationError('while validating query parameters', null, "property: 'formParameters' must be a mapping", property[0].start_mark);
      }
      return property[1].value.forEach(function(param) {
        if (!_this.isNullableMapping(param[1])) {
          throw new exports.ValidationError('while validating query parameters', null, "each form parameter must be a mapping", param[1].start_mark);
        }
        return _this.valid_common_parameter_properties(param[1], allowParameterKeys);
      });
    };

    Validator.prototype.validate_headers = function(property, allowParameterKeys) {
      var _this = this;
      if (this.isNull(property[1])) {
        return;
      }
      if (!this.isMapping(property[1])) {
        throw new exports.ValidationError('while validating headers', null, "property: 'headers' must be a mapping", property[0].start_mark);
      }
      return property[1].value.forEach(function(param) {
        if (!_this.isNullableMapping(param[1])) {
          throw new exports.ValidationError('while validating query parameters', null, "each header must be a mapping", param[1].start_mark);
        }
        return _this.valid_common_parameter_properties(param[1], allowParameterKeys);
      });
    };

    Validator.prototype.validate_response = function(response, allowParameterKeys) {
      var _this = this;
      if (this.isSequence(response[0])) {
        if (!response[0].value.length) {
          throw new exports.ValidationError('while validating responses', null, "there must be at least one response code", response[0].start_mark);
        }
        response[0].value.forEach(function(responseCode) {
          if (!_this.isInteger(responseCode)) {
            throw new exports.ValidationError('while validating responses', null, "each response key must be an integer", responseCode.start_mark);
          }
        });
      } else if (!this.isInteger(response[0])) {
        throw new exports.ValidationError('while validating responses', null, "each response key must be an integer", response[0].start_mark);
      }
      if (!this.isNullableMapping(response[1])) {
        throw new exports.ValidationError('while validating responses', null, "each response property must be a mapping", response[0].start_mark);
      }
      if (this.isMapping(response[1])) {
        return response[1].value.forEach(function(property) {
          var canonicalKey;
          canonicalKey = _this.canonicalizePropertyName(property[0].value, allowParameterKeys);
          switch (canonicalKey) {
            case "body":
              return _this.validate_body(property, allowParameterKeys);
            case "description":
              if (!_this.isScalar(property[1])) {
                throw new exports.ValidationError('while validating responses', null, "property description must be a string", response[0].start_mark);
              }
              break;
            case "summary":
              if (!_this.isScalar(property[1])) {
                throw new exports.ValidationError('while validating resources', null, "property 'summary' must be a string", property[0].start_mark);
              }
              break;
            default:
              throw new exports.ValidationError('while validating response', null, "property: '" + property[0].value + "' is invalid in a response", property[0].start_mark);
          }
        });
      }
    };

    Validator.prototype.isParameterKey = function(property) {
      return property[0].value.match(/<<\s*([\w-_]+)\s*>>/);
    };

    Validator.prototype.validate_body = function(property, allowParameterKeys, bodyMode) {
      var _ref1,
        _this = this;
      if (bodyMode == null) {
        bodyMode = null;
      }
      if (this.isNull(property[1])) {
        return;
      }
      if (!this.isMapping(property[1])) {
        throw new exports.ValidationError('while validating body', null, "property: body specification must be a mapping", property[0].start_mark);
      }
      return (_ref1 = property[1].value) != null ? _ref1.forEach(function(bodyProperty) {
        var canonicalProperty, key;
        if (_this.isParameterKey(bodyProperty)) {
          if (!allowParameterKeys) {
            throw new exports.ValidationError('while validating body', null, "property '" + bodyProperty[0].value + "' is invalid in a resource", bodyProperty[0].start_mark);
          }
        } else if (bodyProperty[0].value.match(/^[^\/]+\/[^\/]+$/)) {
          if (bodyMode && bodyMode !== "explicit") {
            throw new exports.ValidationError('while validating body', null, "not compatible with implicit default Media Type", bodyProperty[0].start_mark);
          }
          bodyMode = "explicit";
          return _this.validate_body(bodyProperty, allowParameterKeys, "implicit");
        } else {
          key = bodyProperty[0].value;
          canonicalProperty = _this.canonicalizePropertyName(key, allowParameterKeys);
          switch (canonicalProperty) {
            case "formParameters":
              if (bodyMode && bodyMode !== "implicit") {
                throw new exports.ValidationError('while validating body', null, "not compatible with explicit default Media Type", bodyProperty[0].start_mark);
              }
              bodyMode = "implicit";
              return _this.validate_form_params(bodyProperty, allowParameterKeys);
            case "example":
              if (bodyMode && bodyMode !== "implicit") {
                throw new exports.ValidationError('while validating body', null, "not compatible with explicit default Media Type", bodyProperty[0].start_mark);
              }
              bodyMode = "implicit";
              if (!_this.isScalar(bodyProperty[1])) {
                throw new exports.ValidationError('while validating body', null, "example must be a string", bodyProperty[0].start_mark);
              }
              break;
            case "schema":
              if (bodyMode && bodyMode !== "implicit") {
                throw new exports.ValidationError('while validating body', null, "not compatible with explicit default Media Type", bodyProperty[0].start_mark);
              }
              bodyMode = "implicit";
              if (!_this.isScalar(bodyProperty[1])) {
                throw new exports.ValidationError('while validating body', null, "schema must be a string", bodyProperty[0].start_mark);
              }
              break;
            default:
              throw new exports.ValidationError('while validating body', null, "property: '" + bodyProperty[0].value + "' is invalid in a body", bodyProperty[0].start_mark);
          }
        }
      }) : void 0;
    };

    Validator.prototype.validate_common_properties = function(property, allowParameterKeys) {
      var canonicalProperty, key,
        _this = this;
      if (this.isParameterKey(property)) {
        if (!allowParameterKeys) {
          throw new exports.ValidationError('while validating resources', null, "property '" + property[0].value + "' is invalid in a resource", property[0].start_mark);
        }
        return true;
      } else {
        key = property[0].value;
        canonicalProperty = this.canonicalizePropertyName(key, allowParameterKeys);
        switch (canonicalProperty) {
          case "displayName":
            if (!this.isScalar(property[1])) {
              throw new exports.ValidationError('while validating resources', null, "property 'displayName' must be a string", property[0].start_mark);
            }
            return true;
          case "description":
            if (!this.isScalar(property[1])) {
              throw new exports.ValidationError('while validating resources', null, "property 'description' must be a string", property[0].start_mark);
            }
            return true;
          case "summary":
            if (!this.isScalar(property[1])) {
              throw new exports.ValidationError('while validating resources', null, "property 'summary' must be a string", property[0].start_mark);
            }
            return true;
        }
        switch (key) {
          case "is":
            if (!this.isSequence(property[1])) {
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
      }
      return false;
    };

    Validator.prototype.child_methods = function(node) {
      if (!(node && this.isMapping(node))) {
        return [];
      }
      return node.value.filter(function(childNode) {
        return childNode[0].value.match(/^(get|post|put|delete|head|patch|options)$/);
      });
    };

    Validator.prototype.has_property = function(node, property) {
      if (node && this.isMapping(node)) {
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
      if (node && this.isMapping(node)) {
        filteredNodes = node.value.filter(function(childNode) {
          return _this.isString(childNode[0]) && childNode[0].value.match(property);
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
      if (node && this.isMapping(node)) {
        node.value.forEach(function(prop) {
          if (_this.isString(prop[0]) && prop[0].value.match(property)) {
            return properties.push(prop);
          } else {
            return properties = properties.concat(_this.get_properties(prop[1], property));
          }
        });
      }
      return properties;
    };

    Validator.prototype.resources = function(node, parentPath) {
      var child_resources, response,
        _this = this;
      if (node == null) {
        node = this.get_single_node(true, true, false);
      }
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
        if (_this.has_property(childResource[1], "displayName")) {
          resourceResponse.displayName = _this.property_value(childResource[1], "displayName");
        }
        if (_this.has_property(childResource[1], "get")) {
          resourceResponse.methods.push('get');
        }
        if (_this.has_property(childResource[1], "post")) {
          resourceResponse.methods.push('post');
        }
        if (_this.has_property(childResource[1], "put")) {
          resourceResponse.methods.push('put');
        }
        if (_this.has_property(childResource[1], "patch")) {
          resourceResponse.methods.push('patch');
        }
        if (_this.has_property(childResource[1], "delete")) {
          resourceResponse.methods.push('delete');
        }
        if (_this.has_property(childResource[1], "head")) {
          resourceResponse.methods.push('head');
        }
        if (_this.has_property(childResource[1], "options")) {
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
      response = [];
      if (!this.isNullableMapping(node)) {
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

    Validator.prototype.validate_base_uri = function(baseUriNode) {
      var baseUri, err, expressions, template, _ref1;
      baseUri = baseUriNode.value;
      try {
        template = uritemplate.parse(baseUri);
      } catch (_error) {
        err = _error;
        throw new exports.ValidationError('while validating baseUri', null, err != null ? (_ref1 = err.options) != null ? _ref1.message : void 0 : void 0, baseUriNode.start_mark);
      }
      expressions = template.expressions.filter(function(expr) {
        return 'templateText' in expr;
      }).map(function(expression) {
        return expression.templateText;
      });
      if (__indexOf.call(expressions, 'version') >= 0) {
        return true;
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

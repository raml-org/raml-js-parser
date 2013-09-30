(function() {
  var MarkedYAMLError, nodes, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  MarkedYAMLError = require('./errors').MarkedYAMLError;

  nodes = require('./nodes');

  /*
  The ResourceTypes throws these.
  */


  this.ResourceTypeError = (function(_super) {
    __extends(ResourceTypeError, _super);

    function ResourceTypeError() {
      _ref = ResourceTypeError.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    return ResourceTypeError;

  })(MarkedYAMLError);

  /*
  The ResourceTypes class deals with applying ResourceTypes to resources according to the spec
  */


  this.ResourceTypes = (function() {
    function ResourceTypes() {
      this.apply_parameters_to_type = __bind(this.apply_parameters_to_type, this);
      this.apply_type = __bind(this.apply_type, this);
      this.apply_types = __bind(this.apply_types, this);
      this.get_type = __bind(this.get_type, this);
      this.has_types = __bind(this.has_types, this);
      this.load_types = __bind(this.load_types, this);
      this.declaredTypes = {};
    }

    ResourceTypes.prototype.load_types = function(node) {
      var allTypes,
        _this = this;
      this.load_default_media_type(node);
      if (this.has_property(node, "resourceTypes")) {
        allTypes = this.property_value(node, "resourceTypes");
        if (allTypes && typeof allTypes === "object") {
          return allTypes.forEach(function(type_item) {
            if (type_item && typeof type_item === "object" && typeof type_item.value === "object") {
              return type_item.value.forEach(function(type) {
                return _this.declaredTypes[type[0].value] = type;
              });
            }
          });
        }
      }
    };

    ResourceTypes.prototype.has_types = function(node) {
      if (Object.keys(this.declaredTypes).length === 0 && this.has_property(node, "resourceTypes")) {
        this.load_types(node);
      }
      return Object.keys(this.declaredTypes).length > 0;
    };

    ResourceTypes.prototype.get_type = function(typeName) {
      return this.declaredTypes[typeName];
    };

    ResourceTypes.prototype.get_parent_type_name = function(typeName) {
      var property, type;
      type = (this.get_type(typeName))[1];
      if (type && this.has_property(type, "type")) {
        property = this.property_value(type, "type");
        if (typeof property === "object") {
          if (property.length === 2) {
            return property[0].value;
          }
        } else {
          return property;
        }
      }
      return null;
    };

    ResourceTypes.prototype.apply_types = function(node, resourceUri) {
      var resources,
        _this = this;
      if (resourceUri == null) {
        resourceUri = "";
      }
      if (!this.isMapping(node)) {
        return;
      }
      if (this.has_types(node)) {
        resources = this.child_resources(node);
        return resources.forEach(function(resource) {
          var type;
          _this.apply_default_media_type_to_resource(resource[1]);
          if (_this.has_property(resource[1], "type")) {
            type = _this.get_property(resource[1], "type");
            _this.apply_type(resourceUri + resource[0].value, resource, type);
          }
          return _this.apply_types(resource[1], resourceUri + resource[0].value);
        });
      } else {
        resources = this.child_resources(node);
        return resources.forEach(function(resource) {
          return _this.apply_default_media_type_to_resource(resource[1]);
        });
      }
    };

    ResourceTypes.prototype.apply_type = function(resourceUri, resource, typeKey) {
      var tempType;
      tempType = this.resolve_inheritance_chain(resourceUri, typeKey);
      tempType.combine(resource[1]);
      resource[1] = tempType;
      return resource[1].remove_question_mark_properties();
    };

    ResourceTypes.prototype.resolve_inheritance_chain = function(resourceUri, typeKey) {
      var baseType, child_type, child_type_key, compiledTypes, inherits_from, parentTypeMapping, parentTypeName, pathToCircularRef, result, root_type, type, typeName, typesToApply;
      typeName = this.key_or_value(typeKey);
      compiledTypes = {};
      type = this.apply_parameters_to_type(resourceUri, typeName, typeKey);
      this.apply_default_media_type_to_resource(type);
      this.apply_traits_to_resource(resourceUri, type, false);
      compiledTypes[typeName] = type;
      typesToApply = [typeName];
      child_type = typeName;
      parentTypeName = null;
      while (parentTypeName = this.get_parent_type_name(child_type)) {
        if (parentTypeName in compiledTypes) {
          pathToCircularRef = typesToApply.concat(parentTypeName).join(' -> ');
          throw new exports.ResourceTypeError('while aplying resourceTypes', null, "circular reference of \"" + parentTypeName + "\" has been detected: " + pathToCircularRef, child_type.start_mark);
        }
        child_type_key = this.get_property(this.get_type(child_type)[1], "type");
        parentTypeMapping = this.apply_parameters_to_type(resourceUri, parentTypeName, child_type_key);
        compiledTypes[parentTypeName] = parentTypeMapping;
        this.apply_default_media_type_to_resource(parentTypeMapping);
        this.apply_traits_to_resource(resourceUri, parentTypeMapping, false);
        typesToApply.push(parentTypeName);
        child_type = parentTypeName;
      }
      root_type = typesToApply.pop();
      baseType = compiledTypes[root_type].cloneForResourceType();
      result = baseType;
      while (inherits_from = typesToApply.pop()) {
        baseType = compiledTypes[inherits_from].cloneForResourceType();
        result.combine(baseType);
      }
      return result;
    };

    ResourceTypes.prototype.apply_parameters_to_type = function(resourceUri, typeName, typeKey) {
      var parameters, type;
      type = (this.get_type(typeName))[1].clone();
      parameters = this._get_parameters_from_type_key(resourceUri, typeKey);
      this.apply_parameters(type, parameters, typeKey);
      return type;
    };

    ResourceTypes.prototype._get_parameters_from_type_key = function(resourceUri, typeKey) {
      var parameters, result,
        _this = this;
      result = {
        resourcePath: resourceUri.replace(/\/\/*/g, '/')
      };
      if (!this.isMapping(typeKey)) {
        return result;
      }
      parameters = this.value_or_undefined(typeKey);
      if (!this.isNull(parameters[0][1])) {
        parameters[0][1].value.forEach(function(parameter) {
          var _ref1;
          if (!_this.isScalar(parameter[1])) {
            throw new exports.ResourceTypeError('while aplying parameters', null, 'parameter value is not a scalar', parameter[1].start_mark);
          }
          if ((_ref1 = parameter[1].value) === "methodName" || _ref1 === "resourcePath" || _ref1 === "resourcePathName") {
            throw new exports.ResourceTypeError('while aplying parameters', null, 'invalid parameter name "methodName", "resourcePath" are reserved parameter names "resourcePathName"', parameter[1].start_mark);
          }
          return result[parameter[0].value] = parameter[1].value;
        });
      }
      return result;
    };

    return ResourceTypes;

  })();

}).call(this);

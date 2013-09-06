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
      this.apply_type = __bind(this.apply_type, this);
      this.get_type = __bind(this.get_type, this);
      this.apply_types = __bind(this.apply_types, this);
      this.has_types = __bind(this.has_types, this);
      this.declaredTypes = {};
    }

    ResourceTypes.prototype.has_types = function(node) {
      var allTypes,
        _this = this;
      if (Object.keys(this.declaredTypes).length === 0 && this.has_property(node, /^resourceTypes$/i)) {
        allTypes = this.property_value(node, /^resourceTypes$/i);
        allTypes.forEach(function(type_item) {
          return type_item.value.forEach(function(type) {
            return _this.declaredTypes[type[0].value] = type;
          });
        });
      }
      return Object.keys(this.declaredTypes).length > 0;
    };

    ResourceTypes.prototype.apply_types = function(node) {
      var resources,
        _this = this;
      this.check_is_map(node);
      if (this.has_types(node)) {
        resources = this.child_resources(node);
        return resources.forEach(function(resource) {
          var type;
          if (_this.has_property(resource[1], /^type$/i)) {
            type = _this.get_property(resource[1], /^type$/i);
            _this.apply_type(resource, type);
          }
          return resource[1].remove_question_mark_properties();
        });
      }
    };

    ResourceTypes.prototype.get_type = function(typeName) {
      return this.declaredTypes[typeName];
    };

    ResourceTypes.prototype.apply_type = function(resource, typeKey) {
      var tempType, type;
      type = this.get_type(this.key_or_value(typeKey));
      tempType = (this.resolve_inheritance_chain(type[1], typeKey)).cloneForTrait();
      tempType.combine(resource[1]);
      return resource[1] = tempType;
    };

    ResourceTypes.prototype.get_parent_type_name = function(type) {
      if (this.has_property(type, /^type$/i)) {
        return this.property_value(type, /^type$/i);
      }
      return null;
    };

    ResourceTypes.prototype.resolve_inheritance_chain = function(type, typeKey) {
      var baseType, baseTypeKey, child_type, inheritanceMap, inherits_from, parameters, parentType, root_type, tempType, typesToApply, _results;
      console.log(type);
      return type;
      inheritanceMap = {};
      inheritanceMap[this.key_or_value(typeKey)] = true;
      typesToApply = [
        {
          type: this.key_or_value(typeKey, {
            typeKey: typeKey
          })
        }
      ];
      child_type = type;
      parentType = null;
      while (parentType = this.get_parent_type_name(child_type)) {
        if (inheritanceMap[parentType]) {
          throw new exports.ResourceTypeError('while aplying resourceTypes', null, 'circular reference detected: ' + parentType + "->" + typesToApply, child_type.start_mark);
        }
        parameters = this.get_parameters_from_type_key(this.get_property(child_type, /^type$/i));
        this.apply_parameters(tempType, parameters, baseTypeKey);
        inheritanceMap[parentType] = true;
        typesToApply.push({
          type: parentType,
          typeKey: this.get_property(child_type, /^type$/i)
        });
        child_type = this.get_type(parentType);
      }
      root_type = typesToApply.pop;
      baseType = this.get_type(root_type.type);
      baseTypeKey = root_type.typeKey;
      _results = [];
      while (inherits_from = typesToApply.pop) {
        tempType = baseType.cloneForTrait();
        if (baseTypeKey) {
          parameters = this.get_parameters_from_type_key(baseTypeKey);
          _results.push(this.apply_parameters(tempType, parameters, baseTypeKey));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    ResourceTypes.prototype.get_parameters_from_type_key = function(typeKey) {
      var parameters, result;
      parameters = this.value_or_undefined(typeKey);
      result = {};
      if (parameters) {
        parameters[0][1].value.forEach(function(parameter) {
          if (parameter[1].tag !== 'tag:yaml.org,2002:str') {
            throw new exports.ResourceTypeError('while aplying parameters', null, 'parameter value is not a scalar', parameter[1].start_mark);
          }
          return result[parameter[0].value] = parameter[1].value;
        });
      }
      return result;
    };

    return ResourceTypes;

  })();

}).call(this);

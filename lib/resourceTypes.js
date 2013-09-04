(function() {
  var MarkedYAMLError, nodes, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

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
      this.declaredTypes = [];
    }

    ResourceTypes.prototype.has_types = function(node) {
      if (this.declaredTypes.length === 0 && this.has_property(node, /^resourceTypes$/i)) {
        this.declaredTypes = this.property_value(node, /^resourceTypes$/i);
      }
      return this.declaredTypes.length > 0;
    };

    ResourceTypes.prototype.apply_types = function(node) {};

    ResourceTypes.prototype.apply_type = function(method, typeKey) {
      var parameters, plainParameters, temp, type,
        _this = this;
      type = this.get_type(this.key_or_value(typeKey));
      parameters = this.value_or_undefined(typeKey);
      plainParameters = {};
      if (parameters) {
        parameters[0][1].value.forEach(function(parameter) {
          if (parameter[1].tag !== 'tag:yaml.org,2002:str') {
            throw new exports.TraitError('while aplying parameters', null, 'parameter value is not a scalar', parameter[1].start_mark);
          }
          return plainParameters[parameter[0].value] = parameter[1].value;
        });
      }
      temp = type.cloneForTrait();
      this.apply_parameters(temp, plainParameters, useKey);
      temp.combine(method[1]);
      return method[1] = temp;
    };

    ResourceTypes.prototype.get_type = function(typeName) {
      var type;
      type = this.declaredTypes.filter(function(declaredType) {
        return declaredType[0].value === typeName;
      });
      return type[0][1];
    };

    return ResourceTypes;

  })();

}).call(this);

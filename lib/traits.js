(function() {
  var MarkedYAMLError, nodes, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  MarkedYAMLError = require('./errors').MarkedYAMLError;

  nodes = require('./nodes');

  /*
  The Traits throws these.
  */


  this.TraitError = (function(_super) {
    __extends(TraitError, _super);

    function TraitError() {
      _ref = TraitError.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    return TraitError;

  })(MarkedYAMLError);

  /*
  The Traits class deals with applying traits to resources according to the spec
  */


  this.Traits = (function() {
    function Traits() {
      this.get_type = __bind(this.get_type, this);
      this.declaredTraits = {};
    }

    Traits.prototype.load_traits = function(node) {
      var allTraits,
        _this = this;
      if (this.has_property(node, /^traits$/i)) {
        allTraits = this.property_value(node, /^traits$/i);
        if (allTraits && typeof allTraits === "object") {
          return allTraits.forEach(function(trait_item) {
            if (trait_item && typeof trait_item === "object" && typeof trait_item.value === "object") {
              return trait_item.value.forEach(function(trait) {
                return _this.declaredTraits[trait[0].value] = trait;
              });
            }
          });
        }
      }
    };

    Traits.prototype.has_traits = function(node) {
      if (this.declaredTraits.length === 0 && this.has_property(node, /^traits$/i)) {
        load_traits(node);
      }
      return Object.keys(this.declaredTraits).length > 0;
    };

    Traits.prototype.get_type = function(traitName) {
      return this.declaredTraits[traitName];
    };

    Traits.prototype.apply_traits = function(node) {
      var resources,
        _this = this;
      this.check_is_map(node);
      if (this.has_traits(node)) {
        resources = this.child_resources(node);
        return resources.forEach(function(resource) {
          var methods, uses;
          methods = _this.child_methods(resource[1]);
          if (_this.has_property(resource[1], /^is$/i)) {
            uses = _this.property_value(resource[1], /^is$/i);
            uses.forEach(function(use) {
              return methods.forEach(function(method) {
                return _this.apply_trait(method, use);
              });
            });
          }
          methods.forEach(function(method) {
            if (_this.has_property(method[1], /^is$/i)) {
              uses = _this.property_value(method[1], /^is$/i);
              return uses.forEach(function(use) {
                return _this.apply_trait(method, use);
              });
            }
          });
          resource[1].remove_question_mark_properties();
          return _this.apply_traits(resource[1]);
        });
      }
    };

    Traits.prototype.apply_parameters = function(resource, parameters, useKey) {
      var parameterUse,
        _this = this;
      if (resource.tag === 'tag:yaml.org,2002:str') {
        parameterUse = [];
        if (parameterUse = resource.value.match(/<<([^>]+)>>/g)) {
          parameterUse.forEach(function(parameter) {
            parameter = parameter.replace(/[<>]+/g, '').trim();
            if (!(parameter in parameters)) {
              throw new exports.TraitError('while aplying parameters', null, 'value was not provided for parameter: ' + parameter, useKey.start_mark);
            }
            return resource.value = resource.value.replace("<<" + parameter + ">>", parameters[parameter]);
          });
        }
      }
      if (resource.tag === 'tag:yaml.org,2002:seq') {
        resource.forEach(function(node) {
          return _this.apply_parameters(node, parameters, useKey);
        });
      }
      if (resource.tag === 'tag:yaml.org,2002:map') {
        return resource.value.forEach(function(res) {
          _this.apply_parameters(res[0], parameters, useKey);
          return _this.apply_parameters(res[1], parameters, useKey);
        });
      }
    };

    Traits.prototype.apply_trait = function(method, useKey) {
      var parameters, plainParameters, temp, trait,
        _this = this;
      trait = this.get_trait(this.key_or_value(useKey));
      parameters = this.value_or_undefined(useKey);
      plainParameters = {};
      if (parameters) {
        parameters[0][1].value.forEach(function(parameter) {
          if (parameter[1].tag !== 'tag:yaml.org,2002:str') {
            throw new exports.TraitError('while aplying parameters', null, 'parameter value is not a scalar', parameter[1].start_mark);
          }
          return plainParameters[parameter[0].value] = parameter[1].value;
        });
      }
      temp = trait.cloneForTrait();
      this.apply_parameters(temp, plainParameters, useKey);
      temp.combine(method[1]);
      return method[1] = temp;
    };

    Traits.prototype.get_trait = function(traitName) {
      if (traitName in this.declaredTraits) {
        return this.declaredTraits[traitName][1];
      }
      return null;
    };

    return Traits;

  })();

}).call(this);

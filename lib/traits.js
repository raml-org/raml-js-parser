(function() {
  var MarkedYAMLError, nodes, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

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
      this.declaredTraits = [];
    }

    Traits.prototype.has_traits = function(node) {
      if (this.declaredTraits.length === 0 && this.has_property(node, /^traits$/i)) {
        this.declaredTraits = this.property_value(node, /^traits$/i);
      }
      return this.declaredTraits.length > 0;
    };

    Traits.prototype.apply_traits = function(node) {
      var resources,
        _this = this;
      this.check_is_map(node);
      if (this.has_traits(node)) {
        resources = this.child_resources(node);
        return resources.forEach(function(resource) {
          var uses;
          if (_this.has_property(resource[1], /^use$/i)) {
            uses = _this.property_value(resource[1], /^use$/i);
            uses.forEach(function(use) {
              return _this.apply_trait(resource, use);
            });
          }
          resource[1].remove_question_mark_properties();
          return _this.apply_traits(resource[1]);
        });
      }
    };

    Traits.prototype.apply_trait = function(resource, useKey) {
      var parameters, plainParameters, temp, trait,
        _this = this;
      trait = this.get_trait(this.key_or_value(useKey));
      parameters = this.value_or_undefined(useKey);
      plainParameters = {};
      if (parameters) {
        parameters[0][1].value.forEach(function(parameter) {
          if (parameter[1].tag !== 'tag:yaml.org,2002:str') {
            throw new _this.TraitError('while aplying parameters', null, 'parameter value is not a scalar', parameter[1].start_mark);
          }
          return plainParameters[parameter[0].value] = parameter[1].value;
        });
      }
      temp = trait.cloneTrait();
      this.apply_parameters(temp, plainParameters, useKey);
      temp.combine(resource[1]);
      return resource[1] = temp;
    };

    Traits.prototype.apply_parameters = function(resource, parameters, useKey) {
      var parameterUse,
        _this = this;
      if (resource.tag === 'tag:yaml.org,2002:str') {
        parameterUse = [];
        if (parameterUse = resource.value.match(/<<([^>]+)>>/g)) {
          parameterUse.forEach(function(parameter) {
            parameter = parameter.replace(/[<>]+/g, '');
            if (!parameters[parameter]) {
              throw new _this.TraitError('while aplying parameters', null, 'value was not provided for parameter: ' + parameter, useKey.start_mark);
            }
            return console.log(parameter);
          });
        }
      }
      if (resource.tag === 'tag:yaml.org,2002:seq') {
        resource.forEach(function(node) {
          return _this.apply_parameters(node, parameters, useKey);
        });
      }
      if (resource.tag === 'tag:yaml.org,2002:map') {
        this.apply_parameters(resource.value[0][0], parameters, useKey);
        return this.apply_parameters(resource.value[0][1], parameters, useKey);
      }
    };

    Traits.prototype.get_trait = function(traitName) {
      var trait;
      trait = this.declaredTraits.filter(function(declaredTrait) {
        return declaredTrait[0].value === traitName;
      });
      return trait[0][1];
    };

    return Traits;

  })();

}).call(this);

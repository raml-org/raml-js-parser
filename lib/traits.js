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
      if (this.has_property(node, /^traits$/i)) {
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
              var temp, trait;
              trait = _this.get_trait(_this.key_or_value(use));
              temp = trait.clone();
              temp.combine(resource[1]);
              return resource[1] = temp;
            });
          }
          resource[1].remove_question_mark_properties();
          return _this.apply_traits(resource[1]);
        });
      }
    };

    Traits.prototype.get_trait = function(traitName) {
      var provides, trait;
      trait = this.declaredTraits.filter(function(declaredTrait) {
        return declaredTrait[0].value === traitName;
      });
      provides = trait[0][1].value.filter(function(property) {
        return property[0].value === 'provides';
      });
      return provides[0][1];
    };

    return Traits;

  })();

}).call(this);

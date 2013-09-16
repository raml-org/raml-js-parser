(function() {
  var MarkedYAMLError, nodes, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  MarkedYAMLError = require('./errors').MarkedYAMLError;

  nodes = require('./nodes');

  /*
  The Schemas throws these.
  */


  this.SecuritySchemeError = (function(_super) {
    __extends(SecuritySchemeError, _super);

    /*
      The Schemas class deals with applying schemas to resources according to the spec
    */


    function SecuritySchemeError() {
      _ref = SecuritySchemeError.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    return SecuritySchemeError;

  })(MarkedYAMLError);

  this.SecuritySchemes = (function() {
    function SecuritySchemes() {
      this.get_all_schemes = __bind(this.get_all_schemes, this);
      this.has_schemes = __bind(this.has_schemes, this);
      this.load_security_schemes = __bind(this.load_security_schemes, this);
      this.declaredSchemes = {};
    }

    SecuritySchemes.prototype.load_security_schemes = function(node) {
      var allschemes,
        _this = this;
      if (this.has_property(node, /^securitySchemes$/i)) {
        allschemes = this.property_value(node, /^securitySchemes$/i);
        if (allschemes && typeof allschemes === "object") {
          return allschemes.forEach(function(scheme) {
            return _this.declaredSchemes[scheme[0].value] = scheme;
          });
        }
      }
    };

    SecuritySchemes.prototype.has_schemes = function(node) {
      if (this.declaredSchemes.length === 0 && this.has_property(node, /^schemes$/i)) {
        this.load_schemes(node);
      }
      return Object.keys(this.declaredSchemes).length > 0;
    };

    SecuritySchemes.prototype.get_all_schemes = function() {
      return this.declaredSchemes;
    };

    return SecuritySchemes;

  })();

}).call(this);

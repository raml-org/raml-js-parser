(function() {
  var nodes, uritemplate,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  nodes = require('./nodes');

  uritemplate = require('uritemplate');

  /*
     Applies transformations to the RAML
  */


  this.Transformations = (function() {
    function Transformations() {
      this.apply_default_media_type_to_resource = __bind(this.apply_default_media_type_to_resource, this);
      this.get_media_type = __bind(this.get_media_type, this);
      this.load_default_media_type = __bind(this.load_default_media_type, this);
      this.declaredSchemas = {};
    }

    Transformations.prototype.load_default_media_type = function(node) {
      if (!this.isMapping(node || (node != null ? node.value : void 0))) {
        return;
      }
      return this.mediaType = this.property_value(node, "mediaType");
    };

    Transformations.prototype.get_media_type = function() {
      return this.mediaType;
    };

    Transformations.prototype.findAndInsertUriParameters = function(rootObject) {
      var resources;
      this.findAndInsertMissingBaseUriParameters(rootObject);
      resources = rootObject.resources;
      return this.findAndInsertMissinngBaseUriParameters(resources);
    };

    Transformations.prototype.findAndInsertMissingBaseUriParameters = function(rootObject) {
      var expressions, template;
      if (rootObject.baseUri) {
        template = uritemplate.parse(rootObject.baseUri);
        expressions = template.expressions.filter(function(expr) {
          return 'templateText' in expr;
        }).map(function(expression) {
          return expression.templateText;
        });
        if (expressions.length) {
          if (!rootObject.baseUriParameters) {
            rootObject.baseUriParameters = {};
          }
        }
        return expressions.forEach(function(parameterName) {
          if (!(parameterName in rootObject.baseUriParameters)) {
            rootObject.baseUriParameters[parameterName] = {
              type: "string",
              required: true,
              displayName: parameterName
            };
            if (parameterName === "version") {
              return rootObject.baseUriParameters[parameterName]["enum"] = [rootObject.version];
            }
          }
        });
      }
    };

    Transformations.prototype.findAndInsertMissinngBaseUriParameters = function(resources) {
      var _this = this;
      if (resources != null ? resources.length : void 0) {
        return resources.forEach(function(resource) {
          var expressions, template;
          template = uritemplate.parse(resource.relativeUri);
          expressions = template.expressions.filter(function(expr) {
            return 'templateText' in expr;
          }).map(function(expression) {
            return expression.templateText;
          });
          if (expressions.length) {
            if (!resource.uriParameters) {
              resource.uriParameters = {};
            }
          }
          expressions.forEach(function(parameterName) {
            if (!(parameterName in resource.uriParameters)) {
              return resource.uriParameters[parameterName] = {
                type: "string",
                required: true,
                displayName: parameterName
              };
            }
          });
          return _this.findAndInsertMissinngBaseUriParameters(resource.resources);
        });
      }
    };

    /*
    Media Type pivot when using default mediaType property
    */


    Transformations.prototype.apply_default_media_type_to_resource = function(resource) {
      var methods,
        _this = this;
      if (!this.mediaType) {
        return;
      }
      if (!this.isMapping(resource)) {
        return;
      }
      methods = this.child_methods(resource);
      return methods.forEach(function(method) {
        return _this.apply_default_media_type_to_method(method[1]);
      });
    };

    Transformations.prototype.apply_default_media_type_to_method = function(method) {
      var responses,
        _this = this;
      if (!this.mediaType) {
        return;
      }
      if (!this.isMapping(method)) {
        return;
      }
      if (this.has_property(method, "body")) {
        this.apply_default_media_type_to_body(this.get_property(method, "body"));
      }
      if (this.has_property(method, "responses")) {
        responses = this.get_property(method, "responses");
        return responses.value.forEach(function(response) {
          if (_this.has_property(response[1], "body")) {
            return _this.apply_default_media_type_to_body(_this.get_property(response[1], "body"));
          }
        });
      }
    };

    Transformations.prototype.apply_default_media_type_to_body = function(body) {
      var key, responseType, responseTypeKey, _ref, _ref1, _ref2;
      if (!this.isMapping(body)) {
        return;
      }
      if (body != null ? (_ref = body.value) != null ? (_ref1 = _ref[0]) != null ? (_ref2 = _ref1[0]) != null ? _ref2.value : void 0 : void 0 : void 0 : void 0) {
        key = body.value[0][0].value;
        if (!key.match(/\//)) {
          responseType = new nodes.MappingNode('tag:yaml.org,2002:map', [], body.start_mark, body.end_mark);
          responseTypeKey = new nodes.ScalarNode('tag:yaml.org,2002:str', this.mediaType, body.start_mark, body.end_mark);
          responseType.value.push([responseTypeKey, body.clone()]);
          return body.value = responseType.value;
        }
      }
    };

    return Transformations;

  })();

}).call(this);

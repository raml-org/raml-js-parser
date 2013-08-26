(function() {
  var MarkedYAMLError, unique_id, _ref, _ref1, _ref2,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  MarkedYAMLError = require('./errors').MarkedYAMLError;

  unique_id = 0;

  this.ApplicationError = (function(_super) {
    __extends(ApplicationError, _super);

    function ApplicationError() {
      _ref = ApplicationError.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    return ApplicationError;

  })(MarkedYAMLError);

  this.Node = (function() {
    function Node(tag, value, start_mark, end_mark) {
      this.tag = tag;
      this.value = value;
      this.start_mark = start_mark;
      this.end_mark = end_mark;
      this.unique_id = "node_" + (unique_id++);
    }

    Node.prototype.clone = function() {
      var temp;
      temp = new this.constructor(this.tag, this.value.clone(), this.start_mark, this.end_mark);
      return temp;
    };

    return Node;

  })();

  this.ScalarNode = (function(_super) {
    __extends(ScalarNode, _super);

    ScalarNode.prototype.id = 'scalar';

    function ScalarNode(tag, value, start_mark, end_mark, style) {
      this.tag = tag;
      this.value = value;
      this.start_mark = start_mark;
      this.end_mark = end_mark;
      this.style = style;
      ScalarNode.__super__.constructor.apply(this, arguments);
    }

    ScalarNode.prototype.clone = function() {
      var temp;
      temp = new this.constructor(this.tag, this.value, this.start_mark, this.end_mark);
      return temp;
    };

    ScalarNode.prototype.combine = function(node) {
      if (!(node instanceof ScalarNode)) {
        console.log(this.value);
        console.log(node);
        throw new exports.ApplicationError('while applying node', null, 'different YAML structures', this.start_mark);
      }
      return this.value = node.value;
    };

    ScalarNode.prototype.remove_question_mark_properties = function() {};

    return ScalarNode;

  })(this.Node);

  this.CollectionNode = (function(_super) {
    __extends(CollectionNode, _super);

    function CollectionNode(tag, value, start_mark, end_mark, flow_style) {
      this.tag = tag;
      this.value = value;
      this.start_mark = start_mark;
      this.end_mark = end_mark;
      this.flow_style = flow_style;
      CollectionNode.__super__.constructor.apply(this, arguments);
    }

    return CollectionNode;

  })(this.Node);

  this.SequenceNode = (function(_super) {
    __extends(SequenceNode, _super);

    function SequenceNode() {
      _ref1 = SequenceNode.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    SequenceNode.prototype.id = 'sequence';

    SequenceNode.prototype.clone = function() {
      var items, temp,
        _this = this;
      items = [];
      this.value.forEach(function(item) {
        var value;
        value = item.clone();
        return items.push(value);
      });
      temp = new this.constructor(this.tag, items, this.start_mark, this.end_mark, this.flow_style);
      return temp;
    };

    SequenceNode.prototype.combine = function(node) {
      var _this = this;
      if (!(node instanceof SequenceNode)) {
        throw new exports.ApplicationError('while applying node', null, 'different YAML structures', this.start_mark);
      }
      return node.value.forEach(function(property) {
        var value;
        value = property.clone();
        return _this.value.push(value);
      });
    };

    SequenceNode.prototype.remove_question_mark_properties = function() {
      return this.value.forEach(function(item) {
        return item.remove_question_mark_properties();
      });
    };

    return SequenceNode;

  })(this.CollectionNode);

  this.MappingNode = (function(_super) {
    __extends(MappingNode, _super);

    function MappingNode() {
      _ref2 = MappingNode.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    MappingNode.prototype.id = 'mapping';

    MappingNode.prototype.clone = function() {
      var properties, temp,
        _this = this;
      properties = [];
      this.value.forEach(function(property) {
        var name, value;
        name = property[0].clone();
        value = property[1].clone();
        return properties.push([name, value]);
      });
      temp = new this.constructor(this.tag, properties, this.start_mark, this.end_mark, this.flow_style);
      return temp;
    };

    MappingNode.prototype.cloneTrait = function() {
      var properties, temp,
        _this = this;
      properties = [];
      this.value.forEach(function(property) {
        var name, value;
        name = property[0].clone();
        value = property[1].clone();
        if (!(/^name$/i.test(name.value) || /^description$/i.test(name.value))) {
          return properties.push([name, value]);
        }
      });
      temp = new this.constructor(this.tag, properties, this.start_mark, this.end_mark, this.flow_style);
      return temp;
    };

    MappingNode.prototype.combine = function(resourceNode) {
      var _this = this;
      if (!(resourceNode instanceof MappingNode)) {
        throw new exports.ApplicationError('while applying node', null, 'different YAML structures', this.start_mark);
      }
      return resourceNode.value.forEach(function(resourceProperty) {
        var name, trait_has_property;
        name = resourceProperty[0].value;
        trait_has_property = _this.value.some(function(someProperty) {
          return (someProperty[0].value === name) || ((someProperty[0].value + '?') === name) || (someProperty[0].value === (name + '?'));
        });
        if (trait_has_property) {
          return _this.value.forEach(function(traitProperty) {
            var traitPropertyName;
            traitPropertyName = traitProperty[0].value;
            if ((traitPropertyName === name) || ((traitPropertyName + '?') === name) || (traitPropertyName === (name + '?'))) {
              traitProperty[1].combine(resourceProperty[1]);
              return traitProperty[0].value = traitProperty[0].value.replace(/\?$/, '');
            }
          });
        } else {
          return _this.value.push([resourceProperty[0].clone(), resourceProperty[1].clone()]);
        }
      });
    };

    MappingNode.prototype.remove_question_mark_properties = function() {
      this.value = this.value.filter(function(property) {
        return property[0].value.indexOf('?', property[0].value.length - 1) === -1;
      });
      return this.value.forEach(function(property) {
        return property[1].remove_question_mark_properties();
      });
    };

    return MappingNode;

  })(this.CollectionNode);

}).call(this);

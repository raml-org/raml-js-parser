(function() {
  var _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.composer = require('./composer');

  this.constructor = require('./construct');

  this.errors = require('./errors');

  this.events = require('./events');

  this.loader = require('./loader');

  this.nodes = require('./nodes');

  this.parser = require('./parser');

  this.reader = require('./reader');

  this.resolver = require('./resolver');

  this.scanner = require('./scanner');

  this.tokens = require('./tokens');

  this.q = require('q');

  this.FileError = (function(_super) {
    __extends(FileError, _super);

    function FileError() {
      _ref = FileError.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    return FileError;

  })(this.errors.MarkedYAMLError);

  /*
  Parse the first RAML document in a stream and produce the corresponding
  representation tree.
  */


  this.compose = function(stream, validate, apply, join, location, parent) {
    var loader;
    if (validate == null) {
      validate = true;
    }
    if (apply == null) {
      apply = true;
    }
    if (join == null) {
      join = true;
    }
    loader = new exports.loader.Loader(stream, location, validate, apply, join, parent);
    return loader.get_single_node(validate, apply, join);
  };

  /*
  Parse the first RAML document in a stream and produce the corresponding
  Javascript object.
  */


  this.load = function(stream, location, validate, apply, join) {
    var _this = this;
    if (validate == null) {
      validate = true;
    }
    if (apply == null) {
      apply = true;
    }
    if (join == null) {
      join = true;
    }
    return this.q.fcall(function() {
      var loader;
      loader = new exports.loader.Loader(stream, location, validate, apply, join);
      return loader.get_single_data(validate, apply, join);
    });
  };

  /*
  Parse the first RAML document in a stream and produce the corresponding
  Javascript object.
  */


  this.loadFile = function(file, validate, apply, join) {
    var _this = this;
    if (validate == null) {
      validate = true;
    }
    if (apply == null) {
      apply = true;
    }
    if (join == null) {
      join = true;
    }
    return this.q.fcall(function() {
      var stream;
      stream = _this.readFile(file);
      return _this.load(stream, file, validate, apply, join);
    });
  };

  /*
  Parse the first RAML document in a file and produce the corresponding
  representation tree.
  */


  this.composeFile = function(file, validate, apply, join, parent) {
    var stream;
    if (validate == null) {
      validate = true;
    }
    if (apply == null) {
      apply = true;
    }
    if (join == null) {
      join = true;
    }
    stream = this.readFile(file);
    return this.compose(stream, validate, apply, join, file, parent);
  };

  /*
  Read file either locally or from the network.
  */


  this.readFile = function(file) {
    var error, url;
    url = require('url').parse(file);
    if (url.protocol != null) {
      if (!url.protocol.match(/^https?/i)) {
        throw new exports.FileError("while reading " + file, null, "unknown protocol " + url.protocol, this.start_mark);
      } else {
        return this.fetchFile(file);
      }
    } else {
      if (typeof window !== "undefined" && window !== null) {
        return this.fetchFile(file);
      } else {
        try {
          return require('fs').readFileSync(file).toString();
        } catch (_error) {
          error = _error;
          throw new exports.FileError("while reading " + file, null, "cannot read " + file + " (" + error + ")", this.start_mark);
        }
      }
    }
  };

  /*
  Read file from the network.
  */


  this.fetchFile = function(file) {
    var error, xhr;
    if (typeof window !== "undefined" && window !== null) {
      xhr = new XMLHttpRequest();
    } else {
      xhr = new (require('xmlhttprequest').XMLHttpRequest)();
    }
    try {
      xhr.open('GET', file, false);
      xhr.setRequestHeader('Accept', 'application/raml+yaml, */*');
      xhr.send(null);
      if ((typeof xhr.status === 'number' && xhr.status === 200) || (typeof xhr.status === 'string' && xhr.status.match(/^200/i))) {
        return xhr.responseText;
      }
      throw "HTTP " + xhr.status + " " + xhr.statusText;
    } catch (_error) {
      error = _error;
      throw new exports.FileError("while fetching " + file, null, "cannot fetch " + file + " (" + error + ")", this.start_mark);
    }
  };

}).call(this);

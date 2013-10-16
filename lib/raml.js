(function() {
  var appendNewNodeToParent, defaultSettings, getPendingFile, getPendingFiles, handleStream, isInIncludeTagsStack, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    _this = this;

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

  this.url = require('url');

  this.FileError = (function(_super) {
    __extends(FileError, _super);

    function FileError() {
      _ref = FileError.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    return FileError;

  })(this.errors.MarkedYAMLError);

  defaultSettings = {
    validate: true,
    transform: true,
    compose: true
  };

  /*
  Parse the first RAML document in a stream and produce the corresponding
  Javascript object.
  */


  this.loadFile = function(file, settings) {
    var _this = this;
    if (settings == null) {
      settings = defaultSettings;
    }
    return this.readFileAsync(file).then(function(stream) {
      return _this.load(stream, file, settings);
    });
  };

  /*
  Parse the first RAML document in a file and produce the corresponding
  representation tree.
  */


  this.composeFile = function(file, settings, parent) {
    var _this = this;
    if (settings == null) {
      settings = defaultSettings;
    }
    return this.readFileAsync(file).then(function(stream) {
      return _this.compose(stream, file, settings, parent);
    });
  };

  /*
  Parse the first RAML document in a stream and produce the corresponding
  representation tree.
  */


  this.compose = function(stream, location, settings, parent) {
    if (settings == null) {
      settings = defaultSettings;
    }
    settings.compose = false;
    return handleStream(stream, location, settings, parent);
  };

  /*
  Parse the first RAML document in a stream and produce the corresponding
  Javascript object.
  */


  this.load = function(stream, location, settings) {
    if (settings == null) {
      settings = defaultSettings;
    }
    settings.compose = true;
    return handleStream(stream, location, settings, null);
  };

  handleStream = function(stream, location, settings, parent) {
    var loader;
    if (settings == null) {
      settings = defaultSettings;
    }
    loader = new exports.loader.Loader(stream, location, settings, parent);
    return _this.q.fcall(function() {
      return loader.getYamlRoot();
    }).then(function(partialTree) {
      var files;
      files = loader.getPendingFilesList();
      return getPendingFiles(loader, partialTree, files);
    }).then(function(fullyAssembledTree) {
      loader.composeRamlTree(fullyAssembledTree, settings);
      if (settings.compose) {
        if (fullyAssembledTree != null) {
          return loader.construct_document(fullyAssembledTree);
        } else {
          return null;
        }
      } else {
        return fullyAssembledTree;
      }
    })["catch"](function(error) {
      throw error;
    });
  };

  getPendingFiles = function(loader, node, files) {
    var file, lastVisitedNode, loc, _i, _len;
    loc = [];
    lastVisitedNode = void 0;
    for (_i = 0, _len = files.length; _i < _len; _i++) {
      file = files[_i];
      loc.push(getPendingFile(loader, file).then(function(overwritingnode) {
        if (overwritingnode && !lastVisitedNode) {
          return lastVisitedNode = overwritingnode;
        }
      }));
    }
    return _this.q.all(loc).then(function() {
      if (lastVisitedNode) {
        return lastVisitedNode;
      } else {
        return node;
      }
    });
  };

  getPendingFile = function(loader, fileInfo) {
    var event, fileUri, key, node;
    node = fileInfo.parentNode;
    event = fileInfo.event;
    key = fileInfo.parentKey;
    fileUri = fileInfo.targetFileUri;
    if (fileInfo.includingContext) {
      fileUri = _this.url.resolve(fileInfo.includingContext, fileInfo.targetFileUri);
    }
    if (loader.parent && isInIncludeTagsStack(fileUri, loader)) {
      throw new exports.FileError('while composing scalar out of !include', null, "detected circular !include of " + event.value, event.start_mark);
    }
    if (fileInfo.type === 'fragment') {
      return _this.readFileAsync(fileUri).then(function(result) {
        var _ref1;
        console.log(loader != null ? (_ref1 = loader.parent) != null ? _ref1.src : void 0 : void 0);
        return _this.compose(result, fileUri, {
          validate: false,
          transform: false,
          compose: true
        }, loader);
      }).then(function(value) {
        return appendNewNodeToParent(node, key, value);
      });
    } else {
      return _this.readFileAsync(fileUri).then(function(result) {
        var value;
        value = new _this.nodes.ScalarNode('tag:yaml.org,2002:str', result, event.start_mark, event.end_mark, event.style);
        return appendNewNodeToParent(node, key, value);
      });
    }
  };

  appendNewNodeToParent = function(node, key, value) {
    var item;
    if (node) {
      if (key != null) {
        item = [key, value];
      } else {
        item([value]);
      }
      node.value.push(item);
      return null;
    } else {
      return value;
    }
  };

  /*
  Read file either locally or from the network.
  */


  this.readFileAsync = function(file) {
    var url;
    url = this.url.parse(file);
    if (url.protocol != null) {
      if (!url.protocol.match(/^https?/i)) {
        throw new exports.FileError("while reading " + file, null, "unknown protocol " + url.protocol, this.start_mark);
      } else {
        return this.fetchFileAsync(file);
      }
    } else {
      if (typeof window !== "undefined" && window !== null) {
        return this.fetchFileAsync(file);
      } else {
        return this.fetchLocalFileAsync(file);
      }
    }
  };

  /*
  Read file from the disk.
  */


  this.fetchLocalFileAsync = function(file) {
    var deferred,
      _this = this;
    deferred = this.q.defer();
    require('fs').readFile(file, function(err, data) {
      if (err) {
        return deferred.reject(new exports.FileError("while reading " + file, null, "cannot read " + file + " (" + err + ")", _this.start_mark));
      } else {
        return deferred.resolve(data.toString());
      }
    });
    return deferred.promise;
  };

  /*
  Read file from the network.
  */


  this.fetchFileAsync = function(file) {
    var deferred, error, xhr,
      _this = this;
    deferred = this.q.defer();
    if (typeof window !== "undefined" && window !== null) {
      xhr = new XMLHttpRequest();
    } else {
      xhr = new (require('xmlhttprequest').XMLHttpRequest)();
    }
    try {
      xhr.open('GET', file, false);
      xhr.setRequestHeader('Accept', 'application/raml+yaml, */*');
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if ((typeof xhr.status === 'number' && xhr.status === 200) || (typeof xhr.status === 'string' && xhr.status.match(/^200/i))) {
            return deferred.resolve(xhr.responseText);
          } else {
            return deferred.reject(new exports.FileError("while fetching " + file, null, "cannot fetch " + file + " (" + xhr.statusText + ")", _this.start_mark));
          }
        }
      };
      xhr.send(null);
      return deferred.promise;
    } catch (_error) {
      error = _error;
      throw new exports.FileError("while fetching " + file, null, "cannot fetch " + file + " (" + error + ")", this.start_mark);
    }
  };

  isInIncludeTagsStack = function(include, parent) {
    while (parent = parent.parent) {
      if (parent.src === include) {
        return true;
      }
    }
    return false;
  };

}).call(this);

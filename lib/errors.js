(function() {
  var NON_PRINTABLE, _ref,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  NON_PRINTABLE = require('./util').NON_PRINTABLE;

  this.Mark = (function() {
    function Mark(name, line, column, buffer, pointer) {
      this.name = name;
      this.line = line;
      this.column = column;
      this.buffer = buffer;
      this.pointer = pointer;
    }

    Mark.prototype.get_snippet = function(indent, max_length) {
      var break_chars, end, head, offset, start, tail, _ref, _ref1;
      if (indent == null) {
        indent = 4;
      }
      if (max_length == null) {
        max_length = 75;
      }
      if (this.buffer == null) {
        return null;
      }
      break_chars = '\x00\r\n\x85\u2028\u2029';
      offset = 0;
      head = '';
      tail = '';
      start = this.pointer;
      end = this.pointer;
      while (start > 0 && (_ref = this.buffer[start - 1], __indexOf.call(break_chars, _ref) < 0)) {
        start--;
        if (NON_PRINTABLE.test(this.buffer[start])) {
          offset--;
        }
        if (this.pointer - start > Math.ceil(max_length / 2 - 1)) {
          head = '... ';
          start += 4;
          offset += 4;
          break;
        }
      }
      while (end < this.buffer.length && (_ref1 = this.buffer[end], __indexOf.call(break_chars, _ref1) < 0)) {
        end++;
        if (end - this.pointer > Math.floor(max_length / 2 - 1)) {
          tail = ' ...';
          end -= 4;
          break;
        }
      }
      return "" + ((new Array(indent + 1)).join(' ')) + head + this.buffer.slice(start, end) + tail + "\n" + ((new Array(indent + 1 + this.pointer - start + offset)).join(' ')) + "^";
    };

    Mark.prototype.toString = function() {
      var snippet, where;
      snippet = this.get_snippet();
      where = "  in \"" + this.name + "\", line " + (this.line + 1) + ", column " + (this.column + 1);
      if (!snippet) {
        return where;
      } else {
        return "" + where + ":\n" + snippet;
      }
    };

    return Mark;

  })();

  this.YAMLError = (function(_super) {
    __extends(YAMLError, _super);

    function YAMLError() {
      YAMLError.__super__.constructor.call(this);
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
    }

    YAMLError.prototype.name = 'YAMLError';

    return YAMLError;

  })(Error);

  this.MarkedYAMLError = (function(_super) {
    __extends(MarkedYAMLError, _super);

    function MarkedYAMLError(context, context_mark, message, problem_mark, note) {
      this.context = context;
      this.context_mark = context_mark;
      this.message = message;
      this.problem_mark = problem_mark;
      this.note = note;
      MarkedYAMLError.__super__.constructor.call(this);
      if (!this.message) {
        this.message = this.context;
      }
      if (!this.problem_mark) {
        this.problem_mark = this.context_mark;
      }
    }

    MarkedYAMLError.prototype.toString = function() {
      var lines;
      lines = [];
      if (this.context != null) {
        lines.push(this.context);
      }
      if ((this.context_mark != null) && ((this.message == null) || (this.problem_mark == null) || this.context_mark.name !== this.problem_mark.name || this.context_mark.line !== this.problem_mark.line || this.context_mark.column !== this.problem_mark.column)) {
        lines.push(this.context_mark.toString());
      }
      if (this.message !== this.context) {
        lines.push(this.message);
      }
      if (this.problem_mark != null) {
        lines.push(this.problem_mark.toString());
      }
      if (this.note != null) {
        lines.push(this.note);
      }
      return lines.join('\n');
    };

    return MarkedYAMLError;

  })(this.YAMLError);

  /*
  The Validator throws these.
  */


  this.ValidationError = (function(_super) {
    __extends(ValidationError, _super);

    function ValidationError() {
      _ref = ValidationError.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    return ValidationError;

  })(this.MarkedYAMLError);

}).call(this);

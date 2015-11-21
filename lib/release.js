(function() {
  this.VERSION_MAJOR = 0;

  this.VERSION_MINOR = 8;

  this.VERSION = "" + this.VERSION_MAJOR + "." + this.VERSION_MINOR;

  this.VERSION_LINE = "#%RAML " + this.VERSION;

  this.VERSION_LINE_RE = new RegExp("^#\\s*%RAML\\s+" + this.VERSION + "\\s*$");

}).call(this);

@composer    = require './composer'
@constructor = require './construct'
@errors      = require './errors'
@events      = require './events'
@loader      = require './loader'
@nodes       = require './nodes'
@parser      = require './parser'
@reader      = require './reader'
@resolver    = require './resolver'
@scanner     = require './scanner'
@tokens      = require './tokens'
@q           = require 'q'

class @FileError extends @errors.MarkedYAMLError

###
Scan a RAML stream and produce scanning tokens.
###
@scan = (stream, location) ->
  loader = new exports.loader.Loader stream, location, false
  loader.get_token() while loader.check_token()

###
Parse a RAML stream and produce parsing events.
###
@parse = (stream, location) ->
  loader = new exports.loader.Loader stream, location, false
  loader.get_event() while loader.check_event()

###
Parse the first RAML document in a stream and produce the corresponding
representation tree.
###
@compose = (stream, validate = true, apply = true, join = true, location, parent) ->
  loader = new exports.loader.Loader stream, location, validate, parent
  return loader.get_single_node(validate, apply, join)

###
Parse the first RAML document in a stream and produce the corresponding
Javascript object.
###
@load = (stream, validate = true, location) ->
  loader = new exports.loader.Loader stream, location, validate
  deferred = new @q.defer
  try
    result = loader.get_single_data()
    deferred.resolve result
  catch error
    deferred.reject error
  return deferred.promise

###
Parse the first RAML document in a stream and produce a list of
all the absolute URIs for all resources.
###
@resources = (stream, validate = true, location) ->
  loader = new exports.loader.Loader stream, location, validate
  deferred = new @q.defer
  try
    result = loader.resources()
    deferred.resolve result
  catch error
    deferred.reject error
  return deferred.promise

###
Parse the first RAML document in a stream and produce the corresponding
Javascript object.
###
@loadFile = (file, validate = true) ->
  stream = @readFile file
  return @load stream, validate, file

###
Parse the first RAML document in a file and produce the corresponding
representation tree.
###
@composeFile = (file, validate = true, apply = true, join = true, parent) ->
  stream = @readFile file
  return @compose stream, validate, apply, join, file, parent

###
Parse the first RAML document in a file and produce a list of
all the absolute URIs for all resources.
###
@resourcesFile = (file, validate = true) ->
  stream = @readFile file
  return @resources stream, validate, file

###
Read file either locally or from the network.
###
@readFile = (file) ->
  url = require('url').parse(file)

  if url.protocol?
    unless url.protocol.match(/^https?/i)
      throw new exports.FileError 'while reading ' + file, null, 'unknown protocol ' + url.protocol, @start_mark
    else
      return @fetchFile file
  else
    if (not (window?))
      fs = require('fs')
      if fs.existsSync file
        return fs.readFileSync(file).toString()
      else
        throw new exports.FileError 'while reading ' + file, null, 'cannot find ' + file, @start_mark
    else
      return @fetchFile file

###
Read file from the network.
###
@fetchFile = (file) ->
  if not window?
    xhr = new (require("xmlhttprequest").XMLHttpRequest)()
  else
    xhr = new XMLHttpRequest()
  xhr.open 'GET', file, false
  xhr.setRequestHeader 'Accept', 'application/raml+yaml, */*'
  xhr.send null
  if (typeof xhr.status is 'number' and xhr.status == 200) or
     (typeof xhr.status is 'string' and xhr.status.match /^200/i)
    return xhr.responseText;
  else
    throw new exports.FileError 'while reading ' + file, null, 'cannot fetch ' + file + ' (HTTP ' + xhr.status + ' ' + xhr.statusText + ')', @start_mark

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
Parse the first RAML document in a stream and produce the corresponding
representation tree.
###
@compose = (stream, validate = true, transformtree = true, location, parent) ->
  loader = new exports.loader.Loader stream, location, validate, transformtree, parent
  return loader.get_single_node()

###
Parse the first RAML document in a stream and produce the corresponding
Javascript object.
###
@load = (stream, location, validate = true, transformtree = true) ->
  @q.fcall =>
    loader = new exports.loader.Loader stream, location, validate, transformtree
    return loader.get_single_data(validate, transformtree)

###
Parse the first RAML document in a stream and produce the corresponding
Javascript object.
###
@loadFile = (file, validate = true, transformtree = true) ->
  @q.fcall =>
    stream = @readFile file
    return @load stream, file, validate, transformtree

###
Parse the first RAML document in a file and produce the corresponding
representation tree.
###
@composeFile = (file, validate = true, transformtree = true, parent) ->
  stream = @readFile file
  return @compose stream, validate, transformtree, file, parent

###
Read file either locally or from the network.
###
@readFile = (file) ->
  url = require('url').parse(file)
  if url.protocol?
    unless url.protocol.match(/^https?/i)
      throw new exports.FileError "while reading #{file}", null, "unknown protocol #{url.protocol}", @start_mark
    else
      return @fetchFile file
  else
    if window?
      return @fetchFile file
    else
      try
        return require('fs').readFileSync(file).toString()
      catch error
        throw new exports.FileError "while reading #{file}", null, "cannot read #{file} (#{error})", @start_mark

###
Read file from the network.
###
@fetchFile = (file) ->
  if window?
    xhr = new XMLHttpRequest()
  else
    xhr = new (require('xmlhttprequest').XMLHttpRequest)()

  try
    xhr.open 'GET', file, false
    xhr.setRequestHeader 'Accept', 'application/raml+yaml, */*'
    xhr.send null

    if (typeof xhr.status is 'number' and xhr.status == 200) or
       (typeof xhr.status is 'string' and xhr.status.match /^200/i)
      return xhr.responseText

    throw new Error("HTTP #{xhr.status} #{xhr.statusText}")
  catch error
    throw new exports.FileError "while fetching #{file}", null, "cannot fetch #{file} (#{error})", @start_mark

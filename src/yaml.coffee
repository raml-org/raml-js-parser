# Attach all the classes to the yaml-js object.
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

###
Scan a YAML stream and produce scanning tokens.
###
@scan = (stream) ->
  loader = new exports.loader.Loader stream
  loader.get_token() while loader.check_token()

###
Parse a YAML stream and produce parsing events.
###
@parse = (stream) ->
  loader = new exports.loader.Loader stream
  loader.get_event() while loader.check_event()

###
Parse the first YAML document in a stream and produce the corresponding
representation tree.
###
@compose = (stream) ->
  loader = new exports.loader.Loader stream
  return loader.get_single_node()

###
Parse all YAML documents in a stream and produce corresponding representation
trees.
###
@compose_all = (stream) ->
  loader = new exports.loader.Loader stream
  loader.get_node() while loader.check_node()

###
Parse the first YAML document in a stream and produce the corresponding
Javascript object.
###
@load = (stream) ->
  loader = new exports.loader.Loader stream
  deferred = new @q.defer
  try
    result = loader.get_single_data()
    deferred.resolve result
  catch error
    deferred.reject error
  return deferred.promise

###
Parse all YAML documents in a stream and produce the corresponing Javascript
object.
###
@load_all = (stream) ->
  loader = new exports.loader.Loader stream
  loader.get_data() while loader.check_data()
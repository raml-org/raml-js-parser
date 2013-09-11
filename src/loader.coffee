util        = require './util'
reader      = require './reader'
scanner     = require './scanner'
parser      = require './parser'
composer    = require './composer'
resolver    = require './resolver'
construct   = require './construct'
validator   = require './validator'
joiner      = require './joiner'
traits      = require './traits'
types       = require './resourceTypes'
schemas     = require './schemas'


@make_loader = (Reader = reader.Reader, Scanner = scanner.Scanner, Parser = parser.Parser, Composer = composer.Composer, Resolver = resolver.Resolver, Validator = validator.Validator,  ResourceTypes = types.ResourceTypes, Traits = traits.Traits, Schemas = schemas.Schemas, Joiner = joiner.Joiner, Constructor = construct.Constructor) -> class
  components = [Reader, Scanner, Parser, Composer, Resolver, Validator, Traits, ResourceTypes, Schemas, Joiner, Constructor]
  util.extend.apply util, [@::].concat (component.prototype for component in components)
   
  constructor: (stream, location) ->
    components[0].call @, stream, location
    component.call @ for component in components[1..]

@Loader = @make_loader()
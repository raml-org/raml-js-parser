util        = require './util'
reader      = require './reader'
scanner     = require './scanner'
parser      = require './parser'
composer    = require './composer'
resolver    = require './resolver'
construct   = require './construct'
validator   = require './validator'
traits      = require './traits'

@make_loader = (Reader = reader.Reader, Scanner = scanner.Scanner, Parser = parser.Parser, Composer = composer.Composer, Resolver = resolver.Resolver, Validator = validator.Validator, Traits = traits.Traits, Constructor = construct.Constructor) -> class
  components = [Reader, Scanner, Parser, Composer, Resolver, Validator, Traits, Constructor]
  util.extend.apply util, [@::].concat (component.prototype for component in components)
   
  constructor: (stream) ->
    components[0].call @, stream
    component.call @ for component in components[1..]

@Loader = @make_loader()
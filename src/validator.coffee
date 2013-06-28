{MarkedYAMLError} = require './errors'
nodes             = require './nodes'
uritemplate       = require 'uritemplate'

###
The Validator throws these.
###
class @ValidationError extends MarkedYAMLError
  
###
A collection of multiple validation errors
###
class @ValidationErrors extends MarkedYAMLError
  constructor: (validation_errors) ->
    @validation_errors = validation_errors
    
  get_validation_errors: ->
    return @validation_errors

###
The Validator class deals with validating a YAML file according to the spec
###
class @Validator
  
  constructor: ->
    @validations = [@has_title, @valid_base_uri, @valid_root_properties, @valid_absolute_uris, @validate_traits, @valid_trait_consumption]
  
  validate_document: (node, failFast = true) ->
    @validations.forEach (validation) =>
      validation.call @, node
    return true
    
  validate_traits: (node) ->
    if node instanceof nodes.IncludeNode
      return @validate_traits node.value
    @check_is_map node
    if @has_property node, /traits/i
      traits = @property_value node, /traits/i
      traits.forEach (trait) =>
        @valid_traits_properties trait[1]
        if not (@has_property trait[1], /provides/i)
          throw new exports.ValidationError 'while validating trait properties', null, 'every trait must have a provides property', node.start_mark
        if not (@has_property trait[1], /name/i)
          throw new exports.ValidationError 'while validating trait properties', null, 'every trait must have a name property', node.start_mark
      
  valid_traits_properties: (node) ->  
    if node instanceof nodes.IncludeNode
      return @valid_traits_properties node.value
    @check_is_map node
    invalid = node.value.filter (childNode) -> 
      return not (childNode[0].value.match(/name/i) or \
                  childNode[0].value.match(/description/i) or \
                  childNode[0].value.match(/provides/i) )
    if invalid.length > 0 
      throw new exports.ValidationError 'while validating trait properties', null, 'unknown property ' + invalid[0][0].value, node.start_mark
  
  valid_root_properties: (node) ->
    if node instanceof nodes.IncludeNode
      return @valid_root_properties node.value
    @check_is_map node
    invalid = node.value.filter (childNode) -> 
      return not (childNode[0].value.match(/title/i) or \
                  childNode[0].value.match(/baseUri/i) or \
                  childNode[0].value.match(/version/i) or \
                  childNode[0].value.match(/traits/i) or \
                  childNode[0].value.match(/documentation/i) or \
                  childNode[0].value.match(/uriParameters/i) or \
                  childNode[0].value.match(/^\//i))
    if invalid.length > 0 
      throw new exports.ValidationError 'while validating root properties', null, 'unknown property ' + invalid[0][0].value, node.start_mark
        
  child_resources: (node) ->
    return node.value.filter (childNode) -> return childNode[0].value.match(/^\//i);
    
  has_property: (node, property) ->  
    return node.value.some( (childNode) -> return childNode[0].value.match(property) )
    
  property_value: (node, property) ->
    filteredNodes = node.value.filter (childNode) -> return childNode[0].value.match(property)
    return filteredNodes[0][1].value;
    
  check_is_map: (node) ->
    if not node instanceof nodes.MappingNode
      throw new exports.ValidationError 'while validating node', null, 'must be a map', node.start_mark
                
  valid_absolute_uris: (node, parent = undefined, absolute_uris = []) ->
    if node instanceof nodes.IncludeNode
      return @valid_absolute_uris node.value, parent, absolute_uris
    @check_is_map node  
    resources = @child_resources node
    resources.forEach (resource) =>
      if parent? 
        absolute_uri = parent.value + resource[0].value
      else
        absolute_uri = resource[0].value
      if absolute_uris.indexOf(absolute_uri) != -1 
        throw new exports.ValidationError 'while validating resources URI', null, 'two resources share same URI ' + absolute_uri, node.start_mark
      absolute_uris.push absolute_uri
      @valid_absolute_uris resource[1], resource[0], absolute_uris    
      
  key_or_value: (node) ->
    if node instanceof nodes.IncludeNode
      return @key_or_value node.value
    if node instanceof nodes.ScalarNode
      return node.value
    if node instanceof nodes.MappingNode
      return node.value[0][0].value
      
  valid_trait_consumption: (node, traits = undefined) ->
    if node instanceof nodes.IncludeNode
      return @valid_trait_consumption node.value
    @check_is_map node
    if not traits? and @has_property node, /traits/i
      traits = @property_value node, /traits/i
    resources = @child_resources node
    resources.forEach (resource) =>
      if @has_property resource[1], /use/i
        uses = @property_value resource[1], /use/i
        if not (uses instanceof Array)
          throw new exports.ValidationError 'while validating trait consumption', null, 'use property must be an array', node.start_mark
        uses.forEach (use) =>
          if not traits.some( (trait) => trait[0].value == @key_or_value use)
            throw new exports.ValidationError 'while validating trait consumption', null, 'there is no trait named ' + @key_or_value(use), node.start_mark
      @valid_trait_consumption resource[1], traits
    
  has_title: (node) ->
    if node instanceof nodes.IncludeNode
      return @has_title node.value
    @check_is_map node
    if not @has_property node, /title/i
      throw new exports.ValidationError 'while validating title', null, 'missing title', node.start_mark

  has_version: (node) ->
    if node instanceof nodes.IncludeNode
      return @has_version node.value
    @check_is_map node
    if not @has_property node, /version/i
      throw new exports.ValidationError 'while validating version', null, 'missing version', node.start_mark

  valid_base_uri: (node) ->
    if node instanceof nodes.IncludeNode
      return @valid_base_uri node.value
    if @has_property node, /baseUri/i
      baseUri = @property_value node, /baseUri/i
      try
        template = uritemplate.parse baseUri
      catch err
        throw new exports.ValidationError 'while validating baseUri', null, err.options.message, node.start_mark
      expressions = template.expressions.filter((expr) -> return expr.hasOwnProperty('templateText'))
      for expression in expressions
        if expression.templateText == 'version' 
          @has_version node
        
  get_validation_errors: ->
    return @validation_errors
        
  is_valid: ->
    return @validation_errors.length == 0
  

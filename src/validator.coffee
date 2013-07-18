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
    @validations = [@has_title, @valid_base_uri, @validate_base_uri_parameters, @valid_root_properties, @validate_traits, @valid_absolute_uris, @valid_trait_consumption]

  validate_document: (node) ->
    @validations.forEach (validation) =>
      validation.call @, node

    return true
    
  validate_uri_parameters: (uri, node) ->
    @check_is_map node
    if @has_property node, /^uriParameters$/i
      try
        template = uritemplate.parse uri
      catch err
        throw new exports.ValidationError 'while validating uri parameters', null, err.options.message, node.start_mark
      expressions = template.expressions.filter((expr) -> return expr.hasOwnProperty('templateText'))
      uriParameters = @property_value node, /^uriParameters$/i
      uriParameters.forEach (uriParameter) =>
        uriParameterName = uriParameter[0].value
        found = expressions.filter (expression) -> 
          expression.templateText == uriParameterName
        if found.length == 0 
           throw new exports.ValidationError 'while validating baseUri', null, uriParameterName + ' uri parameter unused', uriParameter[0].start_mark
    child_resources = @child_resources node
    child_resources.forEach (childResource) =>
      @validate_uri_parameters childResource[0].value, childResource[1]
    
  validate_base_uri_parameters: (node) ->
    @check_is_map node
    if @has_property node, /^uriParameters$/i
      if not @has_property node, /^baseUri$/i
        throw new exports.ValidationError 'while validating uri parameters', null, 'uri parameters defined when there is no baseUri', node.start_mark
      baseUri = @property_value node, /^baseUri$/i
      @validate_uri_parameters baseUri, node
    
  validate_traits: (node) ->
    @check_is_map node
    if @has_property node, /^traits$/i
      traits = @property_value node, /^traits$/i
      traits.forEach (trait) =>
        @valid_traits_properties trait[1]
        if not (@has_property trait[1], /^provides$/i)
          throw new exports.ValidationError 'while validating trait properties', null, 'every trait must have a provides property', node.start_mark
        if not (@has_property trait[1], /^name$/i)
          throw new exports.ValidationError 'while validating trait properties', null, 'every trait must have a name property', node.start_mark
      
  valid_traits_properties: (node) ->  
    @check_is_map node
    invalid = node.value.filter (childNode) -> 
      return not (childNode[0].value.match(/^name$/i) or \
                  childNode[0].value.match(/^description$/i) or \
                  childNode[0].value.match(/^provides$/i) )
    if invalid.length > 0 
      throw new exports.ValidationError 'while validating trait properties', null, 'unknown property ' + invalid[0][0].value, node.start_mark
  
  valid_root_properties: (node) ->
    @check_is_map node
    invalid = node.value.filter (childNode) -> 
      return not (childNode[0].value.match(/^title$/i) or \
                  childNode[0].value.match(/^baseUri$/i) or \
                  childNode[0].value.match(/^version$/i) or \
                  childNode[0].value.match(/^traits$/i) or \
                  childNode[0].value.match(/^documentation$/i) or \
                  childNode[0].value.match(/^uriParameters$/i) or \
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
      
  resources: ( node = @get_single_node(true, true, false), parentPath ) ->
    @check_is_map node
    response = []
    child_resources = @child_resources node
    child_resources.forEach (childResource) =>
      resourceResponse = {}
      resourceResponse.methods = []
      
      if parentPath?
        resourceResponse.uri = parentPath + childResource[0].value
      else
        resourceResponse.uri = childResource[0].value
      
      if @has_property childResource[1], /^name$/i
        resourceResponse.name = @property_value childResource[1], /^name$/i

      if @has_property childResource[1], /^get$/i
        resourceResponse.methods.push 'get'
      if @has_property childResource[1], /^post$/i
        resourceResponse.methods.push 'post'
      if @has_property childResource[1], /^put$/i
        resourceResponse.methods.push 'put'
      if @has_property childResource[1], /^patch$/i
        resourceResponse.methods.push 'patch'
      if @has_property childResource[1], /^delete$/i
        resourceResponse.methods.push 'delete'
      if @has_property childResource[1], /^head$/i
        resourceResponse.methods.push 'head'
      if @has_property childResource[1], /^options$/i
        resourceResponse.methods.push 'options'
      
      resourceResponse.line = childResource[0].start_mark.line + 1
      resourceResponse.column = childResource[0].start_mark.column + 1
      if childResource[0].start_mark.name?
        resourceResponse.src = childResource[0].start_mark.name
      response.push resourceResponse
      response = response.concat( @resources(childResource[1], resourceResponse.uri) )
    return response
    
  valid_absolute_uris: (node ) ->
    uris = @get_absolute_uris node
    sorted_uris = uris.sort();
    if sorted_uris.length > 1
      for i in [0...sorted_uris.length]
        if sorted_uris[i + 1] == sorted_uris[i]
          throw new exports.ValidationError 'while validating trait consumption', null, 'two resources share same URI ' + sorted_uris[i], null
    
  get_absolute_uris: ( node = @get_single_node(true, true, false), parentPath ) ->
    @check_is_map node
    
    response = []
    child_resources = @child_resources node
    child_resources.forEach (childResource) =>
      if parentPath?
        uri = parentPath + childResource[0].value
      else
        uri = childResource[0].value
      
      response.push uri
      response = response.concat( @get_absolute_uris(childResource[1], uri) )
    return response 
      
  key_or_value: (node) ->
    if node instanceof nodes.ScalarNode
      return node.value
    if node instanceof nodes.MappingNode
      return node.value[0][0].value
    console.log(node)
      
  valid_trait_consumption: (node, traits = undefined) ->
    @check_is_map node
    if not traits? and @has_property node, /^traits$/i
      traits = @property_value node, /^traits$/i
    resources = @child_resources node
    resources.forEach (resource) =>
      if @has_property resource[1], /^use$/i
        uses = @property_value resource[1], /^use$/i
        if not (uses instanceof Array)
          throw new exports.ValidationError 'while validating trait consumption', null, 'use property must be an array', node.start_mark
        uses.forEach (use) =>
          if not traits.some( (trait) => trait[0].value == @key_or_value use)
            throw new exports.ValidationError 'while validating trait consumption', null, 'there is no trait named ' + @key_or_value(use), node.start_mark
      @valid_trait_consumption resource[1], traits
    
  has_title: (node) ->
    @check_is_map node
    if not @has_property node, /^title$/i
      throw new exports.ValidationError 'while validating title', null, 'missing title', node.start_mark

  has_version: (node) ->
    @check_is_map node
    if not @has_property node, /^version$/i
      throw new exports.ValidationError 'while validating version', null, 'missing version', node.start_mark

  valid_base_uri: (node) ->
    if @has_property node, /^baseUri$/i
      baseUri = @property_value node, /^baseUri$/i
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
  

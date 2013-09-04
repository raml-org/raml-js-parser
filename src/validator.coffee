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
  MAX_TITLE_LENGTH = 48

  constructor: ->
    @validations = [@has_title, @title_is_correct_length, @valid_base_uri, @validate_base_uri_parameters, @valid_root_properties, @validate_traits, @validate_types, @valid_absolute_uris, @valid_trait_consumption, @valid_type_consumption]

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
        @valid_common_parameter_properties uriParameter[1]
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

  validate_types: (node) ->
    @check_is_map node
    if @has_property node, /^resourceTypes$/i
      types = @property_value node, /^resourceTypes$/i
      unless typeof types is "object"
        throw new exports.ValidationError 'while validating trait properties', null, 'invalid resourceTypes definition, it must be an array', types.start_mark
      types.forEach (type_entry) =>
        unless type_entry and type_entry.value
          throw new exports.ValidationError 'while validating trait properties', null, 'invalid resourceTypes definition, it must be an array', type_entry.start_mark
        type_entry.value.forEach (type) =>
          if not (@has_property type[1], /^name$/i)
            throw new exports.ValidationError 'while validating trait properties', null, 'every resource type must have a name property', node.start_mark

          resources = @child_resources type[1]
          if resources.length
            throw new exports.ValidationError 'while validating trait properties', null, 'resource type cannot define child resources', node.start_mark

  valid_type_consumption: (node, types = undefined, check_types = true) ->
    if not types? and @has_property node, /^resourceTypes$/i
      types = @property_value node, /^resourceTypes$/i
    resources = @child_resources node

    # Validate inheritance in resources
    resources.forEach (resource) =>
      if @has_property resource[1], /^type$/i
        typeProperty = (resource[1].value.filter (childNode) -> return childNode[0].value.match(/^type$/))[0][1]
        typeName = typeProperty.value
        if (typeName instanceof Array)
          throw new exports.ValidationError 'while validating resource types consumption', null, 'type property must be a scalar', node.start_mark
        if not types.some( (types_entry) => types_entry.value.some((type) => type[0].value == typeName))
          throw new exports.ValidationError 'while validating trait consumption', null, 'there is no type named ' + typeName, typeProperty.start_mark
      @valid_type_consumption resource[1], types, false

    # validate inheritance in types
    if types and check_types
      types.forEach (type_entry) =>
        type_entry.value.forEach (type) =>
          if @has_property type[1], /^type$/i
            typeProperty = (type[1].value.filter (childNode) -> return childNode[0].value.match(/^type$/))[0][1]
            inheritsFrom = typeProperty.value
            if (inheritsFrom instanceof Array)
              throw new exports.ValidationError 'while validating resource types consumption', null, 'type property must be a scalar', node.start_mark
            if not types.some( (types_entry) => types_entry.value.some((defined_type) => defined_type[0].value == inheritsFrom))
              throw new exports.ValidationError 'while validating trait consumption', null, 'there is no type named ' + inheritsFrom, type.start_mark

  validate_traits: (node) ->
    @check_is_map node
    if @has_property node, /^traits$/i
      traits = @property_value node, /^traits$/i
      unless typeof traits is "object"
        throw new exports.ValidationError 'while validating trait properties', null, 'invalid traits definition, it must be an array', traits.start_mark
      traits.forEach (trait_entry) =>
        unless trait_entry and trait_entry.value
          throw new exports.ValidationError 'while validating trait properties', null, 'invalid traits definition, it must be an array', trait_entry.start_mark
        trait_entry.value.forEach (trait) =>
          @valid_traits_properties trait[1]
          if not (@has_property trait[1], /^name$/i)
            throw new exports.ValidationError 'while validating trait properties', null, 'every trait must have a name property', node.start_mark

  valid_traits_properties: (node) ->  
    @check_is_map node
    invalid = node.value.filter (childNode) -> 
      return (
        childNode[0].value.match(/^is$/i) or
        childNode[0].value.match(/^type$/i))
    if invalid.length > 0 
      throw new exports.ValidationError 'while validating trait properties', null, 'unknown property ' + invalid[0][0].value, node.start_mark

  valid_common_parameter_properties: (node) ->
    @check_is_map node
    invalid = node.value.filter (childNode) -> 
      return not (childNode[0].value.match(/^name$/i) or
                  childNode[0].value.match(/^description$/i) or
                  childNode[0].value.match(/^type$/i) or
                  childNode[0].value.match(/^enum$/i) or
                  childNode[0].value.match(/^pattern$/i) or
                  childNode[0].value.match(/^minLength$/i) or
                  childNode[0].value.match(/^maxLength$/i) or
                  childNode[0].value.match(/^minimum$/i) or
                  childNode[0].value.match(/^maximum$/i) or
                  childNode[0].value.match(/^required$/i) or
                  childNode[0].value.match(/^repeat$/i) or
                  childNode[0].value.match(/^default$/i))
    if invalid.length > 0
      throw new exports.ValidationError 'while validating parameter properties', null, 'unknown property ' + invalid[0][0].value, node.start_mark
    if @has_property node, /^minLength$/i
      if isNaN(@property_value(node, /^minLength$/i))
        throw new exports.ValidationError 'while validating parameter properties', null, 'the value of minLength must be a number', node.start_mark
    if @has_property node, /^maxLength$/i
      if isNaN(@property_value(node, /^maxLength$/i))
        throw new exports.ValidationError 'while validating parameter properties', null, 'the value of maxLength must be a number', node.start_mark
    if @has_property node, /^minimum$/i
      if isNaN(@property_value(node, /^minimum$/i))
        throw new exports.ValidationError 'while validating parameter properties', null, 'the value of minimum must be a number', node.start_mark
    if @has_property node, /^maximum$/i
      if isNaN(@property_value(node, /^maximum$/i))
        throw new exports.ValidationError 'while validating parameter properties', null, 'the value of maximum must be a number', node.start_mark
    if @has_property node, /^type$/i
      type = @property_value node, /^type$/i
      if type != 'string' and type != 'number' and type != 'integer' and type != 'date'
        throw new exports.ValidationError 'while validating parameter properties', null, 'type can either be: string, number, integer or date', node.start_mark
    if @has_property node, /^required$/i
      required = @property_value node, /^required$/i
      unless required.match(/^(true|false)$/)
        throw new exports.ValidationError 'while validating parameter properties', null, '"' + required + '"' + 'required can be any either true or false', node.start_mark
    if @has_property node, /^repeat$/i
      repeat = @property_value node, /^repeat$/i
      unless repeat.match(/^(true|false)$/)
        throw new exports.ValidationError 'while validating parameter properties', null, '"' + repeat + '"' + 'repeat can be any either true or false', node.start_mark

  valid_root_properties: (node) ->
    @check_is_map node
    invalid = node.value.filter (childNode) -> 
      return not (childNode[0].value.match(/^title$/i) or \
                  childNode[0].value.match(/^baseUri$/i) or \
                  childNode[0].value.match(/^version$/i) or \
                  childNode[0].value.match(/^traits$/i) or \
                  childNode[0].value.match(/^documentation$/i) or \
                  childNode[0].value.match(/^uriParameters$/i) or
                  childNode[0].value.match(/^resourceTypes$/i) or
                  childNode[0].value.match(/^\//i))
    if invalid.length > 0 
      throw new exports.ValidationError 'while validating root properties', null, 'unknown property ' + invalid[0][0].value, node.start_mark
        
  child_resources: (node) ->
    return node.value.filter (childNode) -> return childNode[0].value.match(/^\//i);

  child_methods: (node) ->
    return node.value.filter (childNode) -> return childNode[0].value.match(/^(get|post|put|delete|head|patch|options)$/);
    
  has_property: (node, property) ->
    if node.value and typeof node.value is "object"
      return node.value.some(
        (childNode) ->
          return childNode[0].value and childNode[0].value.match(property)
      )
    return false

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

  value_or_undefined: (node) ->
    if node instanceof nodes.MappingNode
      return node.value
    return undefined

  valid_trait_consumption: (node, traits = undefined) ->
    @check_is_map node
    if not traits? and @has_property node, /^traits$/i
      traits = @property_value node, /^traits$/i

    resources = @child_resources node
    resources.forEach (resource) =>
      if @has_property resource[1], /^is$/i
        uses = @property_value resource[1], /^is$/i
        if not (uses instanceof Array)
          throw new exports.ValidationError 'while validating trait consumption', null, 'use property must be an array', node.start_mark
        uses.forEach (use) =>
          if not traits.some( (trait_entry) => trait_entry.value.some((trait) => trait[0].value == @key_or_value use))
            throw new exports.ValidationError 'while validating trait consumption', null, 'there is no trait named ' + @key_or_value(use), use.start_mark

      methods = @child_methods resource[1]
      methods.forEach (method) =>
        if @has_property method[1], /^is$/i
          uses = @property_value method[1], /^is$/i
          if not (uses instanceof Array)
            throw new exports.ValidationError 'while validating trait consumption', null, 'use property must be an array', node.start_mark
          uses.forEach (use) =>
            if not traits.some( (trait_entry) => trait_entry.value.some((trait) => trait[0].value == @key_or_value use))
              throw new exports.ValidationError 'while validating trait consumption', null, 'there is no trait named ' + @key_or_value(use), use.start_mark

      @valid_trait_consumption resource[1], traits
    
  has_title: (node) ->
    @check_is_map node
    unless @has_property node, /^title$/i
      throw new exports.ValidationError 'while validating title', null, 'missing title', node.start_mark
    title = @property_value node, "title"
    unless typeof title is 'string' or typeof title is 'number'
      throw new exports.ValidationError 'while validating title', null, 'not a scalar', node.start_mark

   title_is_correct_length: (node) ->
    @check_is_map node
    title = @property_value node, "title"
    unless title.length <= MAX_TITLE_LENGTH
      throw new exports.ValidationError 'while validating title', null, 'too long', node.start_mark

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
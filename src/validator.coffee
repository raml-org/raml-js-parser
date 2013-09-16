{MarkedYAMLError} = require './errors'
nodes             = require './nodes'
traits            = require './traits'
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
    @validations = [@is_map, @has_title, @valid_base_uri, @validate_base_uri_parameters, @valid_root_properties, @validate_security_schemes, @validate_traits, @validate_resources, @validate_traits, @validate_types, @validate_root_schemas, @valid_absolute_uris, @valid_trait_consumption]

  validate_document: (node) ->
    @validations.forEach (validation) =>
      validation.call @, node
    return true

  validate_security_schemes: (node) ->
    @check_is_map node
    if @has_property node, /^securitySchemes$/i
      schemesProperty = @get_property node, /^securitySchemes$/i
      unless @is_sequence schemesProperty
        throw new exports.ValidationError 'while validating securitySchemes', null, 'invalid security schemes property, it must be an array', schemesProperty.start_mark
      schemesProperty.value.forEach (scheme_entry) =>
        unless @is_mapping scheme_entry
          throw new exports.ValidationError 'while validating securitySchemes', null, 'invalid security scheme property, it must be a map', scheme_entry.start_mark
        scheme_entry.value.forEach (scheme) =>
          unless @is_mapping scheme[1]
            throw new exports.ValidationError 'while validating securitySchemes', null, 'invalid security scheme property, it must be a map', scheme.start_mark
          @validate_security_scheme scheme[1]

  is_mapping: (node) -> return node?.tag is "tag:yaml.org,2002:map"
  is_null: (node) -> return node?.tag is "tag:yaml.org,2002:null"
  is_sequence: (node) -> return node?.tag is "tag:yaml.org,2002:seq"
  is_string: (node) -> return node?.tag is "tag:yaml.org,2002:str"
  is_integer: (node) -> return node?.tag is "tag:yaml.org,2002:int"
  is_nullable_mapping: (node) -> return @is_mapping(node) or @is_null(node)
  is_nullable_string: (node) -> return @is_string(node) or @is_null(node)
  is_nullable_sequence: (node) -> return @is_sequence(node) or @is_null(node)

  validate_security_scheme: (scheme) ->
    @check_is_map scheme
    type = null
    settings = null
    scheme.value.forEach (property) =>
      switch property[0].value
        when "description"
          unless @is_string property[1]
            throw new exports.ValidationError 'while validating security scheme', null, 'schemes description must be a string', property[1].start_mark
        when "type"
          type = property[1].value
          unless @is_string(property[1]) and type.match(/^(OAuth 1.0|OAuth 2.0|Basic Authentication|Digest Authentication|x-.+)$/)
            throw new exports.ValidationError 'while validating security scheme', null, 'schemes type must be any of: "OAuth 1.0", "OAuth 2.0", "Basic Authentication", "Digest Authentication", "x-\{.+\}"', property[1].start_mark
        when "describedBy"
          @validate_method property, true
        when "settings"
          settings = property[1].value
          unless @is_nullable_mapping property[1]
            throw new exports.ValidationError 'while validating security scheme', null, 'schemes settings must be a map', property[1].start_mark
        else
            throw new exports.ValidationError 'while validating security scheme', null, "property: '" + property[0].value + "' is invalid in a security scheme", property[0].start_mark
    unless type
      throw new exports.ValidationError 'while validating security scheme', null, 'schemes type must be any of: "OAuth 1.0", "OAuth 2.0", "Basic Authentication", "Digest Authentication", "x-\{.+\}"', scheme.start_mark

  validate_root_schemas: (node) ->
    if @has_property node, /^schemas$/i
      schemas = @get_property node, /^schemas$/i
      unless @is_mapping schemas
        throw new exports.ValidationError 'while validating schemas', null, 'schemas property must be a mapping', schemas.start_mark
      schemaList = @get_all_schemas node
      for schemaName, schema of schemaList
        unless schema[1].tag and @is_string schema[1]
          throw new exports.ValidationError 'while validating schemas', null, 'schema ' + schemaName + ' must be a string', schema[0].start_mark

  is_map: (node) ->
    unless node
      throw new exports.ValidationError 'while validating root', null, 'empty document', 0
    @check_is_map node

  validate_base_uri_parameters: (node) ->
    @check_is_map node
    if @has_property node, /^baseUriParameters$/i
      if not @has_property node, /^baseUri$/i
        throw new exports.ValidationError 'while validating uri parameters', null, 'uri parameters defined when there is no baseUri', node.start_mark
      baseUri = @property_value node, /^baseUri$/i
      @validate_uri_parameters baseUri, @get_property node, /^baseUriParameters$/i

  validate_uri_parameters: (uri, uriProperty) ->
    try
      template = uritemplate.parse uri
    catch err
      throw new exports.ValidationError 'while validating uri parameters', null, err.options.message, uriProperty.start_mark
    expressions = template.expressions.filter((expr) -> return "templateText" of expr ).map (expression) -> expression.templateText
    if typeof uriProperty.value is "object"
      uriProperty.value.forEach (uriParameter) =>
        @valid_common_parameter_properties uriParameter[1]
        unless uriParameter[0].value in expressions
          throw new exports.ValidationError 'while validating baseUri', null, uriParameter[0].value + ' uri parameter unused', uriParameter[0].start_mark

  validate_types: (node) ->
    @check_is_map node
    if @has_property node, /^resourceTypes$/i
      typeProperty = @get_property node, /^resourceTypes$/i
      types = typeProperty.value

      unless @is_sequence typeProperty
        throw new exports.ValidationError 'while validating resource types', null, 'invalid resourceTypes definition, it must be an array', types.start_mark

      types.forEach (type_entry) =>
        unless @is_mapping type_entry
          throw new exports.ValidationError 'while validating resource types', null, 'invalid resourceType definition, it must be a mapping', type_entry.start_mark

        type_entry.value.forEach (type) =>
          unless @is_mapping type[1]
              throw new exports.ValidationError 'while validating resource types', null, 'invalid resourceType definition, it must be a mapping', type_entry.start_mark
          @validate_resource type, true

#          resources = @child_resources type[1]
#          if resources.length
#            throw new exports.ValidationError 'while validating trait properties', null, 'resource type cannot define child resources', type.start_mark
#
#          # check traits at resourceType level
#          if @has_property type[1], /^is$/i
#            useProperty = @get_property type[1], /^is$/i
#            uses = @property_value type[1], /^is$/i
#            if not (uses instanceof Array)
#              throw new exports.ValidationError 'while validating trait consumption', null, 'is property must be an array', useProperty.start_mark
#            uses.forEach (use) =>
#              if not @get_trait @key_or_value use
#                throw new exports.ValidationError 'while validating trait consumption', null, 'there is no trait named ' + @key_or_value(use), use.start_mark
#
#          # check traits at method level within the resourceType
#          methods = @child_methods type[1]
#          methods.forEach (method) =>
#            if @has_property method[1], /^is$/i
#              useProperty = @get_property method[1], /^is$/i
#              uses = @property_value method[1], /^is$/i
#              if not (uses instanceof Array)
#                throw new exports.ValidationError 'while validating trait consumption', null, 'is property must be an array', useProperty.start_mark
#              uses.forEach (use) =>
#                if not @get_trait @key_or_value use
#                  throw new exports.ValidationError 'while validating trait consumption', null, 'there is no trait named ' + @key_or_value(use), use.start_mark

  validate_traits: (node) ->
    @check_is_map node
    if @has_property node, /^traits$/i
      traitsList = @property_value node, /^traits$/i
      unless typeof traitsList is "object"
        throw new exports.ValidationError 'while validating trait properties', null, 'invalid traits definition, it must be an array', traitsList.start_mark
      traitsList.forEach (trait_entry) =>
        unless trait_entry and trait_entry.value
          throw new exports.ValidationError 'while validating trait properties', null, 'invalid traits definition, it must be an array', trait_entry.start_mark

  valid_traits_properties: (node) ->  
    @check_is_map node
    return unless node.value

    invalid = node.value.filter (childNode) ->
      return (  childNode[0].value.match(/^is$/i) or
                childNode[0].value.match(/^type$/i))
    if invalid.length > 0
      throw new exports.ValidationError 'while validating trait properties', null, "invalid property '" + invalid[0][0].value + "'", invalid[0][0].start_mark

  valid_common_parameter_properties: (node) ->
    @check_is_map node

    return unless node.value

    node.value.forEach (childNode) =>
      return true if typeof childNode[0].value is "object"
      unless @is_valid_parameter_property_name childNode[0].value
        throw new exports.ValidationError 'while validating parameter properties', null, 'unknown property ' + childNode[0].value, childNode[0].start_mark

      propertyName = childNode[0].value
      propertyValue = childNode[1].value

      if propertyName.match(/^minLength$/i)
        if isNaN(propertyValue)
          throw new exports.ValidationError 'while validating parameter properties', null, 'the value of minLength must be a number', childNode[1].start_mark
      else if propertyName.match(/^maxLength$/i)
        if isNaN(propertyValue)
          throw new exports.ValidationError 'while validating parameter properties', null, 'the value of maxLength must be a number', childNode[1].start_mark
      else if propertyName.match(/^minimum$/i)
        if isNaN(propertyValue)
          throw new exports.ValidationError 'while validating parameter properties', null, 'the value of minimum must be a number', childNode[1].start_mark
      else if propertyName.match /^maximum$/i
        if isNaN(propertyValue)
          throw new exports.ValidationError 'while validating parameter properties', null, 'the value of maximum must be a number', childNode[1].start_mark
      else if propertyName.match /^type$/i
        if propertyValue != 'string' and propertyValue != 'number' and propertyValue != 'integer' and propertyValue != 'date'
          throw new exports.ValidationError 'while validating parameter properties', null, 'type can either be: string, number, integer or date', childNode[1].start_mark
      else if propertyName.match /^required$/i
        unless propertyValue.match(/^(true|false)$/)
          throw new exports.ValidationError 'while validating parameter properties', null, 'required can be any either true or false', childNode[1].start_mark
      else if propertyName.match /^repeat$/i
        unless propertyValue.match(/^(true|false)$/)
          throw new exports.ValidationError 'while validating parameter properties', null, 'repeat can be any either true or false', childNode[1].start_mark

  valid_root_properties: (node) ->
    @check_is_map node
    invalid = node.value.filter (childNode) =>
      if @is_sequence childNode[0]
        return true
      return not @is_valid_root_property_name childNode[0]
    if invalid.length > 0
      throw new exports.ValidationError 'while validating root properties', null, 'unknown property ' + invalid[0][0].value, invalid[0][0].start_mark

  is_valid_parameter_property_name: (propertyName) ->
    return propertyName.match(/^displayName$/i) or
            propertyName.match(/^description$/i) or
            propertyName.match(/^type$/i) or
            propertyName.match(/^enum$/i) or
            propertyName.match(/^example$/i) or
            propertyName.match(/^pattern$/i) or
            propertyName.match(/^minLength$/i) or
            propertyName.match(/^maxLength$/i) or
            propertyName.match(/^minimum$/i) or
            propertyName.match(/^maximum$/i) or
            propertyName.match(/^required$/i) or
            propertyName.match(/^repeat$/i) or
            propertyName.match(/^default$/i)

  is_valid_root_property_name: (propertyName) ->
    return (propertyName.value.match(/^title$/i) or
            propertyName.value.match(/^baseUri$/i) or
            propertyName.value.match(/^securitySchemes$/i) or
            propertyName.value.match(/^schemas$/i) or
            propertyName.value.match(/^version$/i) or
            propertyName.value.match(/^traits$/i) or
            propertyName.value.match(/^documentation$/i) or
            propertyName.value.match(/^baseUriParameters$/i) or
            propertyName.value.match(/^resourceTypes$/i) or
            propertyName.value.match(/^\//i))

  child_resources: (node) ->
    if node and @is_mapping node
      return node.value.filter (childNode) -> return childNode[0].value.match(/^\//i);
    return []

  validate_resources: (node) ->
    resources = @child_resources node
    resources.forEach (resource) =>
      @validate_resource resource

  validate_resource: (resource, allowParameterKeys = false) ->
    unless resource[1] and @is_nullable_mapping(resource[1])
      throw new exports.ValidationError 'while validating resources', null, 'resource is not a mapping', resource[1].start_mark
    if resource[1].value
      resource[1].value.forEach (property) =>
        unless @validate_common_properties property, allowParameterKeys
          if property[0].value.match(/^\//)
            if allowParameterKeys
              throw new exports.ValidationError 'while validating trait properties', null, 'resource type cannot define child resources', property[0].start_mark
            @validate_resource property, allowParameterKeys
          else if property[0].value.match(/^type$/)
            @validate_type_property property, allowParameterKeys
          else if property[0].value.match(/^uriParameters$/)
            @validate_uri_parameters resource[0].value, property[1]
          else if property[0].value.match(/^(get|post|put|delete|head|patch|options)$/)
            @validate_method property, allowParameterKeys
          else
            throw new exports.ValidationError 'while validating resources', null, "property: '" + property[0].value + "' is invalid in a resource", property[0].start_mark

  validate_type_property: (property, allowParameterKeys) ->
    typeName = @key_or_value property[1]
    unless @is_mapping(property[1]) or @is_string(property[1])
      throw new exports.ValidationError 'while validating resources', null, "property 'type' must be a string or a mapping", property[0].start_mark
    unless @get_type typeName
      throw new exports.ValidationError 'while validating trait consumption', null, 'there is no type named ' + typeName, property[1].start_mark

  validate_method: (method, allowParameterKeys) ->
    if @is_null method[1]
      return
    unless @is_mapping method[1]
      throw new exports.ValidationError 'while validating methods', null, "method must be a mapping", method[0].start_mark
    method[1].value.forEach (property) =>
      unless @validate_common_properties property, allowParameterKeys
        if property[0].value.match(/^headers$/)
          @validate_headers property, allowParameterKeys
        else if property[0].value.match(/^queryParameters$/)
          @validate_query_params property, allowParameterKeys
        else if property[0].value.match(/^body$/)
          @validate_body property, allowParameterKeys
        else if property[0].value.match(/^responses$/)
          @validate_responses property, allowParameterKeys
        else if property[0].value.match(/^securedBy$/)
          unless @is_sequence property[1]
            throw new exports.ValidationError 'while validating resources', null, "property 'securedBy' must be a list", property[0].start_mark
          property[1].value.forEach (secScheme) =>
            if @is_sequence secScheme
              throw new exports.ValidationError 'while validating securityScheme consumption', null, 'securityScheme reference cannot be a list', secScheme.start_mark
            unless @is_null secScheme
              securitySchemeName = @key_or_value secScheme
              unless @get_security_scheme securitySchemeName
                throw new exports.ValidationError 'while validating securityScheme consumption', null, 'there is no securityScheme named ' + securitySchemeName, secScheme.start_mark
        else
          throw new exports.ValidationError 'while validating resources', null, "property: '" + property[0].value + "' is invalid in a method", property[0].start_mark

  validate_responses: (responses, allowParameterKeys) ->
    if @is_null responses[1]
      return
    unless @is_mapping responses[1]
      throw new exports.ValidationError 'while validating query parameters', null, "property: 'responses' must be a mapping", responses[0].start_mark
    responses[1].value.forEach (response) =>
      unless @is_nullable_mapping response[1]
        throw new exports.ValidationError 'while validating query parameters', null, "each response must be a mapping", response[1].start_mark
      @validate_response response, allowParameterKeys

  validate_query_params: (property, allowParameterKeys) ->
    if @is_null property[1]
      return
    unless @is_mapping property[1]
      throw new exports.ValidationError 'while validating query parameters', null, "property: 'queryParameters' must be a mapping", property[0].start_mark
    property[1].value.forEach (param) =>
      unless @is_nullable_mapping param[1]
        throw new exports.ValidationError 'while validating query parameters', null, "each query parameter must be a mapping", param[1].start_mark
      @valid_common_parameter_properties param[1], allowParameterKeys

  validate_form_params: (property, allowParameterKeys) ->
    if @is_null property[1]
      return
    unless @is_mapping property[1]
      throw new exports.ValidationError 'while validating query parameters', null, "property: 'formParameters' must be a mapping", property[0].start_mark
    property[1].value.forEach (param) =>
      unless @is_nullable_mapping param[1]
        throw new exports.ValidationError 'while validating query parameters', null, "each form parameter must be a mapping", param[1].start_mark
      @valid_common_parameter_properties param[1], allowParameterKeys

  validate_headers: (property, allowParameterKeys) ->
    if @is_null property[1]
      return
    unless @is_mapping property[1]
      throw new exports.ValidationError 'while validating headers', null, "property: 'headers' must be a mapping", property[0].start_mark
    property[1].value.forEach (param) =>
      unless @is_nullable_mapping param[1]
        throw new exports.ValidationError 'while validating query parameters', null, "each header must be a mapping", param[1].start_mark
      @valid_common_parameter_properties param[1], allowParameterKeys

  validate_response: (response, allowParameterKeys) ->
    if @is_sequence response[0]
      unless response[0].value.length
        throw new exports.ValidationError 'while validating responses', null, "there must be at least one response code", responseCode.start_mark
      response[0].value.forEach (responseCode) =>
        unless @is_integer responseCode
          throw new exports.ValidationError 'while validating responses', null, "each response key must be an integer", responseCode.start_mark
    else unless @is_integer response[0]
      throw new exports.ValidationError 'while validating responses', null, "each response key must be an integer", response[0].start_mark
    unless @is_mapping response[1]
      throw new exports.ValidationError 'while validating responses', null, "each response property must be a mapping", response[0].start_mark
    response[1].value.forEach (property) =>
      if property[0].value.match(/^body$/)
        @validate_body property, allowParameterKeys
      else if property[0].value.match(/^description$/)
        unless @is_nullable_string property[1]
          throw new exports.ValidationError 'while validating responses', null, "property description must be a string", response[0].start_mark
      else if property[0].value.match(/^summary$/)
        unless @is_string property[1]
          throw new exports.ValidationError 'while validating resources', null, "property 'summary' must be a string", property[0].start_mark
      else
        throw new exports.ValidationError 'while validating response', null, "property: '" + property[0].value + "' is invalid in a response", property[0].start_mark

  validate_body: (property, allowParameterKeys, bodyMode = null) ->
    if @is_null property[1]
      return
    unless @is_mapping property[1]
      throw new exports.ValidationError 'while validating body', null, "property: body specification must be a mapping", property[0].start_mark
    property[1].value?.forEach (bodyProperty) =>
      if bodyProperty[0].value.match(/<<([^>]+)>>/)
        unless allowParameterKeys
          throw new exports.ValidationError 'while validating body', null, "property '" + bodyProperty[0].value + "' is invalid in a resource", bodyProperty[0].start_mark
      else if bodyProperty[0].value.match(/^[^\/]+\/[^\/]+$/)
        if bodyMode and bodyMode != "explicit"
          throw new exports.ValidationError 'while validating body', null, "not compatible with implicit default Media Type", bodyProperty[0].start_mark
        bodyMode = "explicit"
        @validate_body bodyProperty, allowParameterKeys, "implicit"
      else if bodyProperty[0].value.match(/^formParameters$/)
        if bodyMode and bodyMode != "implicit"
          throw new exports.ValidationError 'while validating body', null, "not compatible with explicit default Media Type", bodyProperty[0].start_mark
        bodyMode = "implicit"
        @validate_form_params bodyProperty, allowParameterKeys
      else if bodyProperty[0].value.match(/^example$/)
        if bodyMode and bodyMode != "implicit"
          throw new exports.ValidationError 'while validating body', null, "not compatible with explicit default Media Type", bodyProperty[0].start_mark
        bodyMode = "implicit"
        if @is_mapping (bodyProperty[1]) or @is_sequence(bodyProperty[1])
          throw new exports.ValidationError 'while validating body', null, "example must be a string", bodyProperty[0].start_mark
      else if bodyProperty[0].value.match(/^schema$/)
        if bodyMode and bodyMode != "implicit"
          throw new exports.ValidationError 'while validating body', null, "not compatible with explicit default Media Type", bodyProperty[0].start_mark
        bodyMode = "implicit"
        if @is_mapping(bodyProperty[1]) or @is_sequence(bodyProperty[1])
          throw new exports.ValidationError 'while validating body', null, "schema must be a string", bodyProperty[0].start_mark
      else
        throw new exports.ValidationError 'while validating body', null, "property: '" + bodyProperty[0].value + "' is invalid in a body", bodyProperty[0].start_mark

  validate_common_properties: (property, allowParameterKeys) ->
    if property[0].value.match(/<<([^>]+)>>/)
      unless allowParameterKeys
        throw new exports.ValidationError 'while validating resources', null, "property '" + property[0].value + "' is invalid in a resource", property[0].start_mark
      return true
    else if property[0].value.match(/^displayName$/)
      unless @is_string property[1]
        throw new exports.ValidationError 'while validating resources', null, "property 'displayName' must be a string", property[0].start_mark
      return true
    else if property[0].value.match(/^summary$/)
      unless @is_string property[1]
        throw new exports.ValidationError 'while validating resources', null, "property 'summary' must be a string", property[0].start_mark
      return true
    else if property[0].value.match(/^description$/)
      unless @is_string property[1]
        throw new exports.ValidationError 'while validating resources', null, "property 'description' must be a string", property[0].start_mark
      return true
    else if property[0].value.match(/^is$/)
      unless @is_sequence property[1]
        throw new exports.ValidationError 'while validating resources', null, "property 'is' must be a list", property[0].start_mark
      if not (property[1].value instanceof Array)
        throw new exports.ValidationError 'while validating trait consumption', null, 'is property must be an array', property[0].start_mark
      property[1].value.forEach (use) =>
        traitName = @key_or_value use
        unless @get_trait traitName
          throw new exports.ValidationError 'while validating trait consumption', null, 'there is no trait named ' + traitName, use.start_mark
      return true
    return false

  child_methods: (node) ->
    unless node and @is_mapping node
      return []
    return node.value.filter (childNode) -> return childNode[0].value.match(/^(get|post|put|delete|head|patch|options)$/);

  has_property: (node, property) ->
    if node and @is_mapping node
      return node.value.some((childNode) -> return childNode[0].value and typeof childNode[0].value != "object" and childNode[0].value.match(property))
    return false

  property_value: (node, property) ->
    filteredNodes = node.value.filter (childNode) ->
      return typeof childNode[0].value != "object" and childNode[0].value.match(property)
    return filteredNodes[0][1].value;

  get_property: (node, property) ->
    if node and @is_mapping node
      filteredNodes = node.value.filter (childNode) =>
        return @is_string(childNode[0]) and childNode[0].value.match(property)
      if filteredNodes.length > 0
        if filteredNodes[0].length > 0
          return filteredNodes[0][1]
    return []

  get_properties: (node, property) =>
    properties = []
    if node and @is_mapping node
      node.value.forEach (prop) =>
        if @is_string(prop[0]) and prop[0].value.match(property)
          properties.push prop
        else
          properties = properties.concat @get_properties prop[1], property
    return properties

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
      
      if @has_property childResource[1], /^displayName$/i
        resourceResponse.displayName = @property_value childResource[1], /^displayName$/i

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
    unless @is_nullable_mapping node
      throw new exports.ValidationError 'while validating resources', null, 'resource is not a mapping', node.start_mark
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
    resources = @child_resources node
    resources.forEach (resource) =>
      if @has_property resource[1], /^is$/i
        uses = @property_value resource[1], /^is$/i
        uses.forEach (use) =>
          if not @get_trait @key_or_value use
            throw new exports.ValidationError 'while validating trait consumption', null, 'there is no trait named ' + @key_or_value(use), use.start_mark

      methods = @child_methods resource[1]
      methods.forEach (method) =>
        if @has_property method[1], /^is$/i
          uses = @property_value method[1], /^is$/i
          uses.forEach (use) =>
            if not @get_trait @key_or_value use
              throw new exports.ValidationError 'while validating trait consumption', null, 'there is no trait named ' + @key_or_value(use), use.start_mark

      @valid_trait_consumption resource[1], traits

  has_title: (node) ->
    @check_is_map node
    unless @has_property node, /^title$/i
      throw new exports.ValidationError 'while validating title', null, 'missing title', node.start_mark
    title = @get_property node, "title"
    unless typeof title.value is 'string' or typeof title.value is 'number'
      throw new exports.ValidationError 'while validating title', null, 'not a scalar', title.start_mark

  has_version: (node) ->
    @check_is_map node
    if not @has_property node, /^version$/i
      throw new exports.ValidationError 'while validating version', null, 'missing version', node.start_mark

  valid_base_uri: (node) ->
    if @has_property node, /^baseUri$/i
      baeUriNode = @get_property node, /^baseUri$/i
      baseUri = @property_value node, /^baseUri$/i
      try
        template = uritemplate.parse baseUri
      catch err
        throw new exports.ValidationError 'while validating baseUri', null, err.options.message, baeUriNode.start_mark
      expressions = template.expressions.filter((expr) -> return expr.hasOwnProperty('templateText'))
      for expression in expressions
        if expression.templateText == 'version' 
          @has_version node
        
  get_validation_errors: ->
    return @validation_errors
        
  is_valid: ->
    return @validation_errors.length == 0
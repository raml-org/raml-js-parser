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
    @validations = [@is_map,  @validate_base_uri_parameters, @valid_root_properties, @valid_absolute_uris]

  validate_document: (node) ->
    @validations.forEach (validation) =>
      validation.call @, node
    return true

  validate_security_schemes: (schemesProperty) ->
    unless @isSequence schemesProperty
      throw new exports.ValidationError 'while validating securitySchemes', null, 'invalid security schemes property, it must be an array', schemesProperty.start_mark
    schemesProperty.value.forEach (scheme_entry) =>
      unless @isMapping scheme_entry
        throw new exports.ValidationError 'while validating securitySchemes', null, 'invalid security scheme property, it must be a map', scheme_entry.start_mark
      scheme_entry.value.forEach (scheme) =>
        unless @isMapping scheme[1]
          throw new exports.ValidationError 'while validating securitySchemes', null, 'invalid security scheme property, it must be a map', scheme.start_mark
        @validate_security_scheme scheme[1]

  isMapping: (node) -> return node?.tag is "tag:yaml.org,2002:map"
  isNull: (node) -> return node?.tag is "tag:yaml.org,2002:null"
  isSequence: (node) -> return node?.tag is "tag:yaml.org,2002:seq"
  isString: (node) -> return node?.tag is "tag:yaml.org,2002:str"
  isInteger: (node) -> return node?.tag is "tag:yaml.org,2002:int"
  isNullableMapping: (node) -> return @isMapping(node) or @isNull(node)
  isNullableString: (node) -> return @isString(node) or @isNull(node)
  isNullableSequence: (node) -> return @isSequence(node) or @isNull(node)
  isScalar: (node) -> return node?.tag is 'tag:yaml.org,2002:null' or
                             node?.tag is 'tag:yaml.org,2002:bool' or
                             node?.tag is 'tag:yaml.org,2002:int' or
                             node?.tag is 'tag:yaml.org,2002:float' or
                             node?.tag is 'tag:yaml.org,2002:binary' or
                             node?.tag is 'tag:yaml.org,2002:timestamp' or
                             node?.tag is 'tag:yaml.org,2002:str'
  isCollection: (node) -> node?.tag is 'tag:yaml.org,2002:omap' or
                          node?.tag is 'tag:yaml.org,2002:pairs' or
                          node?.tag is 'tag:yaml.org,2002:set' or
                          node?.tag is 'tag:yaml.org,2002:seq' or
                          node?.tag is 'tag:yaml.org,2002:map'



  validate_security_scheme: (scheme) ->
    type = null
    settings = null
    scheme.value.forEach (property) =>
      switch property[0].value
        when "description"
          unless @isScalar property[1]
            throw new exports.ValidationError 'while validating security scheme', null, 'schemes description must be a string', property[1].start_mark
        when "type"
          type = property[1].value
          unless @isString(property[1]) and type.match(/^(OAuth 1.0|OAuth 2.0|Basic Authentication|Digest Authentication|x-.+)$/)
            throw new exports.ValidationError 'while validating security scheme', null, 'schemes type must be any of: "OAuth 1.0", "OAuth 2.0", "Basic Authentication", "Digest Authentication", "x-\{.+\}"', property[1].start_mark
        when "describedBy"
          @validate_method property, true
        when "settings"
          settings = property
          unless @isNullableMapping property[1]
            throw new exports.ValidationError 'while validating security scheme', null, 'schemes settings must be a map', property[1].start_mark
        else
            throw new exports.ValidationError 'while validating security scheme', null, "property: '" + property[0].value + "' is invalid in a security scheme", property[0].start_mark
    unless type
      throw new exports.ValidationError 'while validating security scheme', null, 'schemes type must be any of: "OAuth 1.0", "OAuth 2.0", "Basic Authentication", "Digest Authentication", "x-\{.+\}"', scheme.start_mark
    else if type is "OAuth 2.0"
      unless settings
        throw new exports.ValidationError 'while validating security scheme', null, 'for OAuth 2.0 settings must be a map', scheme.start_mark
      @validate_oauth2_settings settings
      # validate settings
    else if type is "OAuth 1.0"
      unless settings
        throw new exports.ValidationError 'while validating security scheme', null, 'for OAuth 1.0 settings must be a map', scheme.start_mark
      @validate_oauth1_settings settings

  validate_oauth2_settings: (settings) ->
    authorizationUrl = false
    accessTokenUrl = false
    settings[1].value.forEach (property) =>
      switch property[0].value
        when "authorizationUrl"
          unless @isString property[1]
            throw new exports.ValidationError 'while validating security scheme', null, 'authorizationUrl must be a URL', property[0].start_mark
          authorizationUrl = true
        when  "accessTokenUrl"
          unless @isString property[1]
            throw new exports.ValidationError 'while validating security scheme', null, 'accessTokenUrl must be a URL', property[0].start_mark
          accessTokenUrl = true
    unless  accessTokenUrl
      throw new exports.ValidationError 'while validating security scheme', null, 'accessTokenUrl must be a URL', settings.start_mark
    unless  authorizationUrl
      throw new exports.ValidationError 'while validating security scheme', null, 'authorizationUrl must be a URL', settings.start_mark

  validate_oauth1_settings: (settings) ->
    requestTokenUri = false
    authorizationUri = false
    tokenCredentialsUri = false
    settings[1].value.forEach (property) =>
      switch property[0].value
        when "requestTokenUri"
          unless @isString property[1]
            throw new exports.ValidationError 'while validating security scheme', null, 'requestTokenUri must be a URL', property[0].start_mark
          requestTokenUri = true
        when "authorizationUri"
          unless @isString property[1]
            throw new exports.ValidationError 'while validating security scheme', null, 'authorizationUri must be a URL', property[0].start_mark
          authorizationUri = true
        when "tokenCredentialsUri"
          unless @isString property[1]
            throw new exports.ValidationError 'while validating security scheme', null, 'tokenCredentialsUri must be a URL', property[0].start_mark
          tokenCredentialsUri = true
    unless  requestTokenUri
      throw new exports.ValidationError 'while validating security scheme', null, 'requestTokenUri must be a URL', settings.start_mark
    unless  authorizationUri
      throw new exports.ValidationError 'while validating security scheme', null, 'authorizationUri must be a URL', settings.start_mark
    unless  tokenCredentialsUri
      throw new exports.ValidationError 'while validating security scheme', null, 'tokenCredentialsUri must be a URL', settings.start_mark

  validate_root_schemas: (schemas) ->
    unless @isSequence schemas
      throw new exports.ValidationError 'while validating schemas', null, 'schemas property must be an array', schemas.start_mark
    schemaList = @get_all_schemas()
    for schemaName, schema of schemaList
      unless schema[1].tag and @isString schema[1]
        throw new exports.ValidationError 'while validating schemas', null, 'schema ' + schemaName + ' must be a string', schema[0].start_mark

  is_map: (node) ->
    unless node or @isNull node
      throw new exports.ValidationError 'while validating root', null, 'empty document', 0
    unless @isMapping node
      throw new exports.ValidationError 'while validating root', null, 'document must be a mapping', 0

  validate_base_uri_parameters: (node) ->
    baseUriProperty = @get_property node, "baseUri"
    @baseUri = baseUriProperty.value
    if @has_property node, "baseUriParameters"
      unless @has_property node, "baseUri"
        throw new exports.ValidationError 'while validating uri parameters', null, 'uri parameters defined when there is no baseUri', node.start_mark
      @validate_uri_parameters @baseUri, @get_property(node, "baseUriParameters"), [ "version" ]

  validate_uri_parameters: (uri, uriProperty, reservedNames = []) ->
    try
      template = uritemplate.parse uri
    catch err
      throw new exports.ValidationError 'while validating uri parameters', null, err.options.message, uriProperty.start_mark
    expressions = template.expressions.filter((expr) -> return "templateText" of expr ).map (expression) -> expression.templateText
    if typeof uriProperty.value is "object"
      uriProperty.value.forEach (uriParameter) =>
        if uriParameter[0].value in reservedNames
          throw new exports.ValidationError 'while validating baseUri', null, 'version parameter not allowed here', uriParameter[0].start_mark
        unless @isNullableMapping(uriParameter[1])
          throw new exports.ValidationError 'while validating baseUri', null, 'parameter must be a mapping', uriParameter[0].start_mark
        unless @isNull(uriParameter[1])
          @valid_common_parameter_properties uriParameter[1]
        unless uriParameter[0].value in expressions
          throw new exports.ValidationError 'while validating baseUri', null, uriParameter[0].value + ' uri parameter unused', uriParameter[0].start_mark

  validate_types: (typeProperty) ->
    types = typeProperty.value

    unless @isSequence typeProperty
      throw new exports.ValidationError 'while validating resource types', null, 'invalid resourceTypes definition, it must be an array', typeProperty.start_mark

    types.forEach (type_entry) =>
      unless @isMapping type_entry
        throw new exports.ValidationError 'while validating resource types', null, 'invalid resourceType definition, it must be a mapping', type_entry.start_mark

      type_entry.value.forEach (type) =>
        unless @isMapping type[1]
            throw new exports.ValidationError 'while validating resource types', null, 'invalid resourceType definition, it must be a mapping', type_entry.start_mark
        #@validate_resource type, true

  validate_traits: (node) ->
    traitsList = node[1].value
    unless typeof traitsList is "object"
      throw new exports.ValidationError 'while validating trait properties', null, 'invalid traits definition, it must be an array', traitsList.start_mark
    traitsList.forEach (trait_entry) =>
      unless trait_entry and trait_entry.value
        throw new exports.ValidationError 'while validating trait properties', null, 'invalid traits definition, it must be an array', trait_entry.start_mark

  valid_traits_properties: (node) ->  
    return unless node.value

    invalid = node.value.filter (childNode) ->
      return (  childNode[0].value is "is" or
                childNode[0].value is "type" )
    if invalid.length > 0
      throw new exports.ValidationError 'while validating trait properties', null, "invalid property '" + invalid[0][0].value + "'", invalid[0][0].start_mark

  valid_common_parameter_properties: (node) ->
    return unless node.value

    node.value.forEach (childNode) =>
      propertyName = childNode[0].value
      propertyValue = childNode[1].value
      booleanValues = ["true", "false"]

      switch propertyName
        when "displayName"
          unless @isScalar (childNode[1])
            throw new exports.ValidationError 'while validating parameter properties', null, 'the value of displayName must be a scalar', childNode[1].start_mark
        when "pattern"
          unless @isScalar (childNode[1])
            throw new exports.ValidationError 'while validating parameter properties', null, 'the value of pattern must be a scalar', childNode[1].start_mark
        when "default"
          unless @isScalar (childNode[1])
            throw new exports.ValidationError 'while validating parameter properties', null, 'the value of default must be a scalar', childNode[1].start_mark
        when "enum"
          unless @isSequence(childNode[1])
            throw new exports.ValidationError 'while validating parameter properties', null, 'the value of displayName must be an array', childNode[1].start_mark
        when "description"
          unless @isScalar (childNode[1])
            throw new exports.ValidationError 'while validating parameter properties', null, 'the value of description must be a scalar', childNode[1].start_mark
        when "example"
          unless @isScalar (childNode[1])
            throw new exports.ValidationError 'while validating parameter properties', null, 'the value of example must be a scalar', childNode[1].start_mark
        when "minLength"
          if isNaN(propertyValue)
            throw new exports.ValidationError 'while validating parameter properties', null, 'the value of minLength must be a number', childNode[1].start_mark
        when "maxLength"
          if isNaN(propertyValue)
            throw new exports.ValidationError 'while validating parameter properties', null, 'the value of maxLength must be a number', childNode[1].start_mark
        when "minimum"
          if isNaN(propertyValue)
            throw new exports.ValidationError 'while validating parameter properties', null, 'the value of minimum must be a number', childNode[1].start_mark
        when "maximum"
          if isNaN(propertyValue)
            throw new exports.ValidationError 'while validating parameter properties', null, 'the value of maximum must be a number', childNode[1].start_mark
        when "type"
          validTypes = ['string', 'number', 'integer', 'date', 'boolean', 'file']
          unless  propertyValue in validTypes
            throw new exports.ValidationError 'while validating parameter properties', null, 'type can either be: string, number, integer or date', childNode[1].start_mark
        when "required"
          unless propertyValue in booleanValues
            throw new exports.ValidationError 'while validating parameter properties', null, 'required can be any either true or false', childNode[1].start_mark
        when "repeat"
          unless propertyValue in booleanValues
            throw new exports.ValidationError 'while validating parameter properties', null, 'repeat can be any either true or false', childNode[1].start_mark
        else
          throw new exports.ValidationError 'while validating parameter properties', null, 'unknown property ' + propertyName, childNode[0].start_mark

  valid_root_properties: (node) ->
    hasTitle = false
    checkVersion = false
    hasVersion = false
    if node?.value
      node.value.forEach (property) =>
        unless @isString property[0]
          throw new exports.ValidationError 'while validating root properties', null, 'keys can only be strings', property[0].start_mark
        switch property[0].value
          when "title"
            hasTitle = true
            unless @isScalar(property[1])
              throw new exports.ValidationError 'while validating root properties', null, 'title must be a string', property[0].start_mark
          when "baseUri"
            unless @isScalar(property[1])
              throw new exports.ValidationError 'while validating root properties', null, 'baseUri must be a string', property[0].start_mark
            checkVersion = @validate_base_uri property[1]
          when "securitySchemes"
            @validate_security_schemes property[1]
          when "schemas"
            @validate_root_schemas property[1]
          when "version"
            hasVersion = true
            unless @isScalar(property[1])
              throw new exports.ValidationError 'while validating root properties', null, 'version must be a string', property[0].start_mark
          when "traits"
            @validate_traits property
          when "documentation"
            unless @isSequence property[1]
              throw new exports.ValidationError 'while validating root properties', null, 'documentation must be an array', property[0].start_mark
            @validate_documentation property[1]
          when "baseUriParameters"
            @is_map node
          when "resourceTypes"
            @validate_types property[1]
          when "securedBy"
            @validate_secured_by property
          else
            if property[0].value.match(/^\//)
              @validate_resource property
            else
              throw new exports.ValidationError 'while validating root properties', null, 'unknown property ' + property[0].value, property[0].start_mark
    unless hasTitle
      throw new exports.ValidationError 'while validating root properties', null, 'missing title', node.start_mark
    if checkVersion and !hasVersion
      throw new exports.ValidationError 'while validating version', null, 'missing version', node.start_mark

  validate_documentation: (documentation_property) ->
    documentation_property.value.forEach (docSection) =>
      @validate_doc_section docSection

  validate_doc_section: (docSection) ->
    unless @isMapping docSection
      throw new exports.ValidationError 'while validating documentation section', null, 'each documentation section must be a mapping', docSection.start_mark

    hasTitle = false
    hasContent = false
    docSection.value.forEach (property) =>
      unless @isScalar(property[0])
        throw new exports.ValidationError 'while validating documentation section', null, 'keys can only be strings', property[0].start_mark
      switch property[0].value
        when "title"
          unless @isScalar property[1]
            throw new exports.ValidationError 'while validating documentation section', null, 'title must be a string', property[0].start_mark
          hasTitle = true
        when "content"
          unless @isNullableString property[1]
            throw new exports.ValidationError 'while validating documentation section', null, 'content must be a string', property[0].start_mark
          hasContent = true
        else
          throw new exports.ValidationError 'while validating root properties', null, 'unknown property ' + property[0].value, property[0].start_mark
    unless hasContent
      throw new exports.ValidationError 'while validating documentation section', null, 'a documentation entry must have content property', docSection.start_mark
    unless hasTitle
      throw new exports.ValidationError 'while validating documentation section', null, 'a documentation entry must have title property', docSection.start_mark

  child_resources: (node) ->
    if node and @isMapping node
      return node.value.filter (childNode) -> return childNode[0].value.match(/^\//);
    return []

  validate_resource: (resource, allowParameterKeys = false) ->
    unless resource[1] and @isNullableMapping(resource[1])
      throw new exports.ValidationError 'while validating resources', null, 'resource is not a mapping', resource[1].start_mark
    if resource[1].value
      resource[1].value.forEach (property) =>
        unless @validate_common_properties property, allowParameterKeys
          if property[0].value.match(/^\//)
            if allowParameterKeys
              throw new exports.ValidationError 'while validating trait properties', null, 'resource type cannot define child resources', property[0].start_mark
            @validate_resource property, allowParameterKeys
          else if property[0].value.match(/^(get|post|put|delete|head|patch|options)$/)
            @validate_method property, allowParameterKeys
          else
            switch property[0].value
              when "type"
                @validate_type_property property, allowParameterKeys
              when  "uriParameters"
                @validate_uri_parameters resource[0].value, property[1]
              when "baseUriParameters"
                unless @baseUri
                  throw new exports.ValidationError 'while validating uri parameters', null, 'base uri parameters defined when there is no baseUri', property[0].start_mark
                @validate_uri_parameters @baseUri, property[1]
              when "securedBy"
                @validate_secured_by property
              else
                throw new exports.ValidationError 'while validating resources', null, "property: '" + property[0].value + "' is invalid in a resource", property[0].start_mark

  validate_secured_by: (property) ->
    unless @isSequence property[1]
      throw new exports.ValidationError 'while validating securityScheme', null, "property 'securedBy' must be a list", property[0].start_mark
    property[1].value.forEach (secScheme) =>
      if @isSequence secScheme
        throw new exports.ValidationError 'while validating securityScheme consumption', null, 'securityScheme reference cannot be a list', secScheme.start_mark
      unless @isNull secScheme
        securitySchemeName = @key_or_value secScheme
        unless @get_security_scheme securitySchemeName
          throw new exports.ValidationError 'while validating securityScheme consumption', null, 'there is no securityScheme named ' + securitySchemeName, secScheme.start_mark


  validate_type_property: (property, allowParameterKeys) ->
    typeName = @key_or_value property[1]
    unless @isMapping(property[1]) or @isString(property[1])
      throw new exports.ValidationError 'while validating resources', null, "property 'type' must be a string or a mapping", property[0].start_mark
    unless @get_type typeName
      throw new exports.ValidationError 'while validating trait consumption', null, 'there is no type named ' + typeName, property[1].start_mark

  validate_method: (method, allowParameterKeys) ->
    if @isNull method[1]
      return
    unless @isMapping method[1]
      throw new exports.ValidationError 'while validating methods', null, "method must be a mapping", method[0].start_mark
    method[1].value.forEach (property) =>
      unless @validate_common_properties property, allowParameterKeys
        switch property[0].value
          when "headers"
            @validate_headers property, allowParameterKeys
          when "queryParameters"
            @validate_query_params property, allowParameterKeys
          when "body"
            @validate_body property, allowParameterKeys
          when "responses"
            @validate_responses property, allowParameterKeys
          when "securedBy"
            @validate_secured_by property
          else
            throw new exports.ValidationError 'while validating resources', null, "property: '" + property[0].value + "' is invalid in a method", property[0].start_mark

  validate_responses: (responses, allowParameterKeys) ->
    if @isNull responses[1]
      return
    unless @isMapping responses[1]
      throw new exports.ValidationError 'while validating query parameters', null, "property: 'responses' must be a mapping", responses[0].start_mark
    responses[1].value.forEach (response) =>
      unless @isNullableMapping response[1]
        throw new exports.ValidationError 'while validating query parameters', null, "each response must be a mapping", response[1].start_mark
      @validate_response response, allowParameterKeys

  validate_query_params: (property, allowParameterKeys) ->
    if @isNull property[1]
      return
    unless @isMapping property[1]
      throw new exports.ValidationError 'while validating query parameters', null, "property: 'queryParameters' must be a mapping", property[0].start_mark
    property[1].value.forEach (param) =>
      unless @isNullableMapping param[1]
        throw new exports.ValidationError 'while validating query parameters', null, "each query parameter must be a mapping", param[1].start_mark
      @valid_common_parameter_properties param[1], allowParameterKeys

  validate_form_params: (property, allowParameterKeys) ->
    if @isNull property[1]
      return
    unless @isMapping property[1]
      throw new exports.ValidationError 'while validating query parameters', null, "property: 'formParameters' must be a mapping", property[0].start_mark
    property[1].value.forEach (param) =>
      unless @isNullableMapping param[1]
        throw new exports.ValidationError 'while validating query parameters', null, "each form parameter must be a mapping", param[1].start_mark
      @valid_common_parameter_properties param[1], allowParameterKeys

  validate_headers: (property, allowParameterKeys) ->
    if @isNull property[1]
      return
    unless @isMapping property[1]
      throw new exports.ValidationError 'while validating headers', null, "property: 'headers' must be a mapping", property[0].start_mark
    property[1].value.forEach (param) =>
      unless @isNullableMapping param[1]
        throw new exports.ValidationError 'while validating query parameters', null, "each header must be a mapping", param[1].start_mark
      @valid_common_parameter_properties param[1], allowParameterKeys

  validate_response: (response, allowParameterKeys) ->
    if @isSequence response[0]
      unless response[0].value.length
        throw new exports.ValidationError 'while validating responses', null, "there must be at least one response code", response[0].start_mark
      response[0].value.forEach (responseCode) =>
        unless @isInteger(responseCode)
          throw new exports.ValidationError 'while validating responses', null, "each response key must be an integer", responseCode.start_mark
    else unless @isInteger response[0]
      throw new exports.ValidationError 'while validating responses', null, "each response key must be an integer", response[0].start_mark
    unless @isNullableMapping response[1]
      throw new exports.ValidationError 'while validating responses', null, "each response property must be a mapping", response[0].start_mark

    if @isMapping response[1]
      response[1].value.forEach (property) =>
        switch property[0].value
          when "body"
            @validate_body property, allowParameterKeys
          when "description"
            unless @isScalar(property[1])
              throw new exports.ValidationError 'while validating responses', null, "property description must be a string", response[0].start_mark
          when "summary"
            unless @isScalar(property[1])
              throw new exports.ValidationError 'while validating resources', null, "property 'summary' must be a string", property[0].start_mark
          else
            throw new exports.ValidationError 'while validating response', null, "property: '" + property[0].value + "' is invalid in a response", property[0].start_mark

  validate_body: (property, allowParameterKeys, bodyMode = null) ->
    if @isNull property[1]
      return
    unless @isMapping property[1]
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
      else
        switch bodyProperty[0].value
          when "formParameters"
            if bodyMode and bodyMode != "implicit"
              throw new exports.ValidationError 'while validating body', null, "not compatible with explicit default Media Type", bodyProperty[0].start_mark
            bodyMode = "implicit"
            @validate_form_params bodyProperty, allowParameterKeys
          when "example"
            if bodyMode and bodyMode != "implicit"
              throw new exports.ValidationError 'while validating body', null, "not compatible with explicit default Media Type", bodyProperty[0].start_mark
            bodyMode = "implicit"
            unless @isScalar(bodyProperty[1])
              throw new exports.ValidationError 'while validating body', null, "example must be a string", bodyProperty[0].start_mark
          when "schema"
            if bodyMode and bodyMode != "implicit"
              throw new exports.ValidationError 'while validating body', null, "not compatible with explicit default Media Type", bodyProperty[0].start_mark
            bodyMode = "implicit"
            unless @isScalar(bodyProperty[1])
              throw new exports.ValidationError 'while validating body', null, "schema must be a string", bodyProperty[0].start_mark
          else
            throw new exports.ValidationError 'while validating body', null, "property: '" + bodyProperty[0].value + "' is invalid in a body", bodyProperty[0].start_mark

  validate_common_properties: (property, allowParameterKeys) ->
    if property[0].value.match(/<<([^>]+)>>/)
      unless allowParameterKeys
        throw new exports.ValidationError 'while validating resources', null, "property '" + property[0].value + "' is invalid in a resource", property[0].start_mark
      return true
    else
      switch property[0].value
        when "displayName"
          unless @isScalar(property[1])
            throw new exports.ValidationError 'while validating resources', null, "property 'displayName' must be a string", property[0].start_mark
          return true
        when "summary"
          unless @isScalar(property[1])
            throw new exports.ValidationError 'while validating resources', null, "property 'summary' must be a string", property[0].start_mark
          return true
        when "description"
          unless @isScalar(property[1])
            throw new exports.ValidationError 'while validating resources', null, "property 'description' must be a string", property[0].start_mark
          return true
        when "is"
          unless @isSequence property[1]
            throw new exports.ValidationError 'while validating resources', null, "property 'is' must be a list", property[0].start_mark
          unless (property[1].value instanceof Array)
            throw new exports.ValidationError 'while validating trait consumption', null, 'is property must be an array', property[0].start_mark
          property[1].value.forEach (use) =>
            traitName = @key_or_value use
            unless @get_trait traitName
              throw new exports.ValidationError 'while validating trait consumption', null, 'there is no trait named ' + traitName, use.start_mark
          return true
    return false

  child_methods: (node) ->
    unless node and @isMapping node
      return []
    return node.value.filter (childNode) -> return childNode[0].value.match(/^(get|post|put|delete|head|patch|options)$/);

  has_property: (node, property) ->
    if node and @isMapping node
      return node.value.some((childNode) -> return childNode[0].value and typeof childNode[0].value != "object" and childNode[0].value.match(property))
    return false

  property_value: (node, property) ->
    filteredNodes = node.value.filter (childNode) ->
      return typeof childNode[0].value != "object" and childNode[0].value.match(property)
    return filteredNodes[0][1].value;

  get_property: (node, property) ->
    if node and @isMapping node
      filteredNodes = node.value.filter (childNode) =>
        return @isString(childNode[0]) and childNode[0].value.match(property)
      if filteredNodes.length > 0
        if filteredNodes[0].length > 0
          return filteredNodes[0][1]
    return []

  get_properties: (node, property) =>
    properties = []
    if node and @isMapping node
      node.value.forEach (prop) =>
        if @isString(prop[0]) and prop[0].value.match(property)
          properties.push prop
        else
          properties = properties.concat @get_properties prop[1], property
    return properties

  resources: ( node = @get_single_node(true, true, false), parentPath ) ->
    response = []
    child_resources = @child_resources node
    child_resources.forEach (childResource) =>
      resourceResponse = {}
      resourceResponse.methods = []
      
      if parentPath?
        resourceResponse.uri = parentPath + childResource[0].value
      else
        resourceResponse.uri = childResource[0].value
      
      if @has_property childResource[1], "displayName"
        resourceResponse.displayName = @property_value childResource[1], "displayName"

      if @has_property childResource[1], "get"
        resourceResponse.methods.push 'get'
      if @has_property childResource[1], "post"
        resourceResponse.methods.push 'post'
      if @has_property childResource[1], "put"
        resourceResponse.methods.push 'put'
      if @has_property childResource[1], "patch"
        resourceResponse.methods.push 'patch'
      if @has_property childResource[1], "delete"
        resourceResponse.methods.push 'delete'
      if @has_property childResource[1], "head"
        resourceResponse.methods.push 'head'
      if @has_property childResource[1], "options"
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
    response = []
    unless @isNullableMapping node
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

  validate_base_uri: (baseUriNode) ->
    baseUri = baseUriNode.value
    try
      template = uritemplate.parse baseUri
    catch err
      throw new exports.ValidationError 'while validating baseUri', null, err.options.message, baseUriNode.start_mark
    expressions = template.expressions.filter((expr) -> return 'templateText' of expr).map (expression) -> expression.templateText
    if 'version' in expressions
      return true

  get_validation_errors: ->
    return @validation_errors
        
  is_valid: ->
    return @validation_errors.length == 0
nodes             = require './nodes'
uritemplate       = require 'uritemplate'

###
   Applies transformations to the RAML
###
class @Transformations
  constructor: ->
    @declaredSchemas = {}

  load_default_media_type: (node) =>
    return unless @isMapping node or node?.value
    @mediaType = @property_value node, "mediaType"

  get_media_type: () =>
    return @mediaType

  findAndInsertUriParameters: (rootObject) ->
    @findAndInsertMissingBaseUriParameters rootObject
    resources = rootObject.resources
    @findAndInsertMissinngBaseUriParameters resources

  findAndInsertMissingBaseUriParameters: (rootObject) ->
    if rootObject.baseUri

      template = uritemplate.parse rootObject.baseUri
      expressions = template.expressions.filter((expr) -> return 'templateText' of expr).map (expression) -> expression.templateText

      if expressions.length
        rootObject.baseUriParameters = {} unless rootObject.baseUriParameters

      expressions.forEach (parameterName) ->
        unless parameterName of rootObject.baseUriParameters
          rootObject.baseUriParameters[parameterName] =
          {
            type: "string",
            required: true,
            displayName: parameterName
          }

          if parameterName is "version"
            rootObject.baseUriParameters[parameterName].enum = [ rootObject.version ]


  findAndInsertMissinngBaseUriParameters: (resources) ->
    if resources?.length
      resources.forEach (resource) =>
        template = uritemplate.parse resource.relativeUri
        expressions = template.expressions.filter((expr) -> return 'templateText' of expr).map (expression) -> expression.templateText

        if expressions.length
          resource.uriParameters = {} unless resource.uriParameters

        expressions.forEach (parameterName) ->
          unless parameterName of resource.uriParameters
            resource.uriParameters[parameterName] =
            {
              type: "string",
              required: true,
              displayName: parameterName
            }
        @findAndInsertMissinngBaseUriParameters resource.resources

  ###
  Media Type pivot when using default mediaType property
  ###
  apply_default_media_type_to_resource: (resource) =>
    return unless @mediaType
    return unless @isMapping resource
    methods = @child_methods resource
    methods.forEach (method) =>
      @apply_default_media_type_to_method(method[1])

  apply_default_media_type_to_method: (method) ->
    return unless @mediaType
    return unless @isMapping method
    # resource->methods->body
    if @has_property(method, "body")
      @apply_default_media_type_to_body @get_property(method, "body")

    # resource->methods->responses->items->body
    if @has_property(method, "responses")
      responses = @get_property method, "responses"
      responses.value.forEach (response) =>
        if @has_property(response[1], "body")
          @apply_default_media_type_to_body @get_property(response[1], "body")

  apply_default_media_type_to_body: (body) ->
    return unless @isMapping body
    if body?.value?[0]?[0]?.value
      key = body.value[0][0].value
      unless key.match(/\//)
        responseType = new nodes.MappingNode 'tag:yaml.org,2002:map', [], body.start_mark, body.end_mark
        responseTypeKey = new nodes.ScalarNode 'tag:yaml.org,2002:str', @mediaType, body.start_mark, body.end_mark
        responseType.value.push [responseTypeKey, body.clone()]
        body.value =  responseType.value

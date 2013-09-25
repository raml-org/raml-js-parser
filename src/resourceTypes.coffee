{MarkedYAMLError} = require './errors'
nodes             = require './nodes'

###
The ResourceTypes throws these.
###
class @ResourceTypeError extends MarkedYAMLError

###
The ResourceTypes class deals with applying ResourceTypes to resources according to the spec
###
class @ResourceTypes
  constructor: ->
    @declaredTypes = {}

  # Loading is extra careful because it is done before validation (so it can be used for validation)
  load_types: (node) =>
    @load_default_media_type(node)
    if @has_property node, "resourceTypes"
      allTypes = @property_value node, "resourceTypes"
      if allTypes and typeof allTypes is "object"
        allTypes.forEach (type_item) =>
          if type_item and typeof type_item is "object" and typeof type_item.value is "object"
            type_item.value.forEach (type) =>
              @declaredTypes[type[0].value] = type

  has_types: (node) =>
    if Object.keys(@declaredTypes).length == 0 and @has_property node, "resourceTypes"
      @load_types node
    return Object.keys(@declaredTypes).length > 0

  get_type: (typeName) =>
    return @declaredTypes[typeName]

  get_parent_type_name: (typeName) ->
    type = (@get_type typeName)[1]
    if type and @has_property type, "type"
      return @property_value type, "type"
    return null

  apply_types: (node, resourceUri = "") =>
    return unless @isMapping(node)
    if @has_types node
      resources = @child_resources node
      resources.forEach (resource) =>
        @apply_default_media_type_to_resource resource[1]

        if @has_property resource[1], "type"
          type = @get_property resource[1], "type"
          @apply_type resourceUri + resource[0].value, resource, type
        @apply_types resource[1], resourceUri + resource[0].value
    else
      resources = @child_resources node
      resources.forEach (resource) =>
        @apply_default_media_type_to_resource resource[1]

  apply_type: (resourceUri, resource, typeKey) =>
    tempType = @resolve_inheritance_chain resourceUri, typeKey
    tempType.combine resource[1]
    resource[1] = tempType
    resource[1].remove_question_mark_properties()

  # calculates and resolve the inheritance chain from a starting type to the root_parent, applies parameters and traits
  # in all steps in the middle
  resolve_inheritance_chain: (resourceUri, typeKey) ->
    typeName = @key_or_value typeKey
    compiledTypes = {}
    type = @apply_parameters_to_type resourceUri, typeName, typeKey
    @apply_default_media_type_to_resource type
    @apply_traits_to_resource resourceUri, type, false
    compiledTypes[ typeName ] = type
    typesToApply = [ typeName ]
    child_type = typeName
    parentTypeName = null

    # Unwind the inheritance chain and check for circular references, while resolving final type shape
    while parentTypeName = @get_parent_type_name child_type
      if parentTypeName of compiledTypes
        throw new exports.ResourceTypeError 'while aplying resourceTypes', null, 'circular reference detected: ' + parentTypeName + "-> [" + typesToApply.reverse + "]", child_type.start_mark
      # apply parameters
      child_type_key = @get_property @get_type(child_type)[1], "type"
      parentTypeMapping = @apply_parameters_to_type resourceUri, parentTypeName, child_type_key
      compiledTypes[parentTypeName] = parentTypeMapping
      @apply_default_media_type_to_resource parentTypeMapping
      # apply traits
      @apply_traits_to_resource resourceUri, parentTypeMapping, false
      typesToApply.push parentTypeName
      child_type = parentTypeName

    root_type = typesToApply.pop()
    baseType = compiledTypes[root_type].cloneForResourceType()
    result = baseType

    while inherits_from = typesToApply.pop()
      baseType = compiledTypes[inherits_from].cloneForResourceType()
      result.combine baseType
    return result

  apply_parameters_to_type: (resourceUri, typeName, typeKey) =>
    type = (@get_type typeName)[1].clone()
    parameters = @_get_parameters_from_type_key resourceUri, typeKey
    @apply_parameters type, parameters, typeKey
    return type

  _get_parameters_from_type_key: (resourceUri, typeKey) ->
    result = {
      resourcePath: resourceUri.replace(/\/\/*/g, '/')
    }
    return result unless @isMapping typeKey
    parameters = @value_or_undefined typeKey
    unless @isNull parameters[0][1]
      parameters[0][1].value.forEach (parameter) ->
        unless parameter[1].tag == 'tag:yaml.org,2002:str'
          throw new exports.ResourceTypeError 'while aplying parameters', null, 'parameter value is not a scalar', parameter[1].start_mark
        if parameter[1].value in [ "methodName", "resourcePath", "resourcePathName"]
          throw new exports.ResourceTypeError 'while aplying parameters', null, 'invalid parameter name "methodName", "resourcePath" are reserved parameter names "resourcePathName"', parameter[1].start_mark
        result[parameter[0].value] = parameter[1].value
    return result
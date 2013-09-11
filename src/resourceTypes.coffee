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
    if @has_property node, /^resourceTypes$/i
      allTypes = @property_value node, /^resourceTypes$/i
      if allTypes and typeof allTypes is "object"
        allTypes.forEach (type_item) =>
          if type_item and typeof type_item is "object" and typeof type_item.value is "object"
            type_item.value.forEach (type) =>
              @declaredTypes[type[0].value] = type

  has_types: (node) =>
    if Object.keys(@declaredTypes).length == 0 and @has_property node, /^resourceTypes$/i
      @load_types node
    return Object.keys(@declaredTypes).length > 0

  get_type: (typeName) =>
    return @declaredTypes[typeName]

  get_parent_type_name: (typeName) ->
    type = (@get_type typeName)[1]
    if type and @has_property type, /^type$/i
      return @property_value type, /^type$/i
    return null

  apply_types: (node) =>
    @check_is_map node
    if @has_types node
      resources = @child_resources node
      resources.forEach (resource) =>
        if @has_property resource[1], /^type$/i
          type = @get_property resource[1], /^type$/i
          @apply_type resource, type
#        resource[1].remove_question_mark_properties()

  apply_type: (resource, typeKey) =>
    tempType = @resolve_inheritance_chain typeKey
    tempType.combine resource[1]
    resource[1] = tempType
    resource[1].remove_question_mark_properties()

  # calculates and resolve the inheritance chain from a starting type to the root_parent, applies parameters and traits
  # in all steps in the middle
  resolve_inheritance_chain: (typeKey) ->
    typeName = @key_or_value typeKey
    compiledTypes = {}
    type = @apply_parameters_to_type typeName, typeKey
    @apply_traits_to_resource type, false
    compiledTypes[ typeName ] = type
    typesToApply = [ typeName ]
    child_type = typeName
    parentTypeName = null

    # Unwind the inheritance chain and check for circular references, while resolving final type shape
    while parentTypeName = @get_parent_type_name child_type
      if parentTypeName of compiledTypes
        throw new exports.ResourceTypeError 'while aplying resourceTypes', null, 'circular reference detected: ' + parentTypeName + "->" + typesToApply , child_type.start_mark
      # apply parameters
      child_type_key = @get_property @get_type(child_type)[1], /^type$/i
      parentTypeMapping = @apply_parameters_to_type parentTypeName, child_type_key
      compiledTypes[parentTypeName] = parentTypeMapping
      # apply traits
      @apply_traits_to_resource parentTypeMapping[1], false
      typesToApply.push parentTypeName
      child_type = parentTypeName

    root_type = typesToApply.pop()
    baseType = compiledTypes[root_type].cloneRemoveIs()
    result = baseType

    while inherits_from = typesToApply.pop()
      baseType = compiledTypes[inherits_from].cloneRemoveIs()
      baseType.combine result
      result = baseType

    return result

  apply_parameters_to_type: (typeName, typeKey) =>
    type = (@get_type typeName)[1].cloneForTrait()
    parameters = @_get_parameters_from_type_key typeKey
    @apply_parameters type, parameters, typeKey
    return type

  _get_parameters_from_type_key: (typeKey) ->
    parameters = @value_or_undefined typeKey
    result = {}
    if parameters and parameters[0] and parameters[0][1] and parameters[0][1].value
      parameters[0][1].value.forEach (parameter) ->
        unless parameter[1].tag == 'tag:yaml.org,2002:str'
          throw new exports.ResourceTypeError 'while aplying parameters', null, 'parameter value is not a scalar', parameter[1].start_mark
        result[parameter[0].value] = parameter[1].value
    return result






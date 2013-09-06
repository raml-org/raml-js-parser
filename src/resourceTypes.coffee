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

  has_types: (node) =>
    if Object.keys(@declaredTypes).length == 0 and @has_property node, /^resourceTypes$/i
      allTypes = @property_value node, /^resourceTypes$/i
      allTypes.forEach (type_item) =>
        type_item.value.forEach (type) =>
          @declaredTypes[type[0].value] = type
    return Object.keys(@declaredTypes).length > 0

  apply_types: (node) =>
    @check_is_map node
    if @has_types node
      resources = @child_resources node
      resources.forEach (resource) =>
        if @has_property resource[1], /^type$/i
          type = @get_property resource[1], /^type$/i
          @apply_type resource, type
        resource[1].remove_question_mark_properties()

  get_type: (typeName) =>
    return @declaredTypes[typeName]

  apply_type: (resource, typeKey) =>
    type = @get_type @key_or_value typeKey
    tempType = (@resolve_inheritance_chain type[1], typeKey).cloneForTrait()
    tempType.combine resource[1]
    resource[1] = tempType

  get_parent_type_name: (type) ->
    if @has_property type, /^type$/i
      return @property_value type, /^type$/i
    return null

  resolve_inheritance_chain: (type, typeKey) ->
    console.log (type)
    return type

    inheritanceMap = {}
    inheritanceMap[@key_or_value typeKey] = true

    typesToApply = [{ type: @key_or_value typeKey, typeKey: typeKey }]
    child_type = type
    parentType = null

    # Unloop the inheritance chain and check for circular references
    while parentType = @get_parent_type_name child_type
      if inheritanceMap[parentType]
        throw new exports.ResourceTypeError 'while aplying resourceTypes', null, 'circular reference detected: ' + parentType + "->" + typesToApply , child_type.start_mark

      parameters = @get_parameters_from_type_key @get_property child_type, /^type$/i
      @apply_parameters tempType, parameters, baseTypeKey


      inheritanceMap[parentType] = true
      typesToApply.push  {
        type: parentType,
        typeKey: @get_property child_type, /^type$/i
      }
      child_type = @get_type parentType

    root_type = typesToApply.pop
    baseType = @get_type root_type.type
    baseTypeKey = root_type.typeKey
    while inherits_from = typesToApply.pop
      tempType = baseType.cloneForTrait()
      if baseTypeKey
        parameters = @get_parameters_from_type_key baseTypeKey
        @apply_parameters tempType, parameters, baseTypeKey

  get_parameters_from_type_key: (typeKey) ->
    parameters = @value_or_undefined typeKey
    result = {}
    if parameters
      parameters[0][1].value.forEach (parameter) ->
        unless parameter[1].tag == 'tag:yaml.org,2002:str'
          throw new exports.ResourceTypeError 'while aplying parameters', null, 'parameter value is not a scalar', parameter[1].start_mark
        result[parameter[0].value] = parameter[1].value
    return result

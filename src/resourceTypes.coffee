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
    @declaredTypes = []

  has_types: (node) ->
    if @declaredTypes.length == 0 and @has_property node, /^resourceTypes$/i
      @declaredTypes = @property_value node, /^resourceTypes$/i
    return @declaredTypes.length > 0

  apply_types: (node) ->
    @check_is_map node
    if @has_types node
      resources = @child_resources node
      resources.forEach (resource) =>
        if @has_property resource[1], /^type$/i
          type = @property_value resource[1], /^type$/i
          @apply_type resource[1], type
        resource[1].remove_question_mark_properties()

  apply_type: (method, typeKey) ->
    trait = get_type @key_or_value typeKey
    parameters = @value_or_undefined typeKey
    plainParameters = {}
    if parameters
      parameters[0][1].value.forEach (parameter) =>
        unless parameter[1].tag == 'tag:yaml.org,2002:str'
          throw new exports.TraitError 'while aplying parameters', null, 'parameter value is not a scalar', parameter[1].start_mark
        plainParameters[parameter[0].value] = parameter[1].value
    temp = trait.cloneTrait()

    # by aplying the parameter mapping first, we allow users to rename things in the trait,
    # and then merge it with the resource
    @apply_parameters temp, plainParameters, useKey
    temp.combine method[1]
    method[1] = temp

  get_type: (typeName) ->
    type = @declaredTypes.filter( (declaredType) -> return declaredType[0].value == typeName );
    return type[0][1];


#  apply_parameters: (resource, parameters, useKey) ->
#    if resource.tag == 'tag:yaml.org,2002:str'
#      parameterUse = []
#      if parameterUse = resource.value.match(/<<([^>]+)>>/g)
#        parameterUse.forEach (parameter) =>
#          parameter = parameter.replace(/[<>]+/g, '').trim()
#          unless parameter of parameters
#            throw new exports.TraitError 'while aplying parameters', null, 'value was not provided for parameter: ' + parameter , useKey.start_mark
#          resource.value = resource.value.replace "<<" + parameter + ">>", parameters[parameter]
#    if resource.tag == 'tag:yaml.org,2002:seq'
#      resource.forEach (node) =>
#        @apply_parameters node, parameters, useKey
#    if resource.tag == 'tag:yaml.org,2002:map'
#      resource.value.forEach (res) =>
#        @apply_parameters res[0], parameters, useKey
#        @apply_parameters res[1], parameters, useKey


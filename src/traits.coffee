{MarkedYAMLError} = require './errors'
nodes             = require './nodes'
inflection        = require 'inflection'

###
The Traits throws these.
###
class @TraitError extends MarkedYAMLError

###
###
class @ParameterError extends MarkedYAMLError


###
The Traits class deals with applying traits to resources according to the spec
###
class @Traits
  constructor: ->
    @declaredTraits = {}

  # Loading is extra careful because it is done before validation (so it can be used for validation)
  load_traits: (node) ->
    if @has_property node, /^traits$/
      allTraits = @property_value node, /^traits$/
      if allTraits and typeof allTraits is "object"
        allTraits.forEach (trait_item) =>
          if trait_item and typeof trait_item is "object" and typeof trait_item.value is "object"
            trait_item.value.forEach (trait) =>
               @declaredTraits[trait[0].value] = trait

  has_traits: (node) ->
    if @declaredTraits.length == 0 and @has_property node, /^traits$/
      @load_traits node
    return Object.keys(@declaredTraits).length > 0

  get_trait: (traitName) ->
    if traitName of @declaredTraits
      return @declaredTraits[traitName][1]
    return null

  apply_traits: (node, resourceUri = "", removeQs = true) ->
    return unless @isMapping(node)
    if @has_traits node
      resources = @child_resources node
      resources.forEach (resource) =>
        @apply_traits_to_resource resourceUri + resource[0].value, resource[1], removeQs

  apply_traits_to_resource: (resourceUri, resource, removeQs) ->
    return unless @isMapping resource
    methods = @child_methods resource
    # apply traits at the resource level, which is basically the same as applying to each method in the resource
    if @has_property resource, /^is$/
      uses = @property_value resource, /^is$/
      uses.forEach (use) =>
        methods.forEach (method) =>
            @apply_trait resourceUri, method, use

    # iterate over all methods and apply all their traits
    methods.forEach (method) =>
      if @has_property method[1], /^is$/
        uses = @property_value method[1], /^is$/
        uses.forEach (use) =>
          @apply_trait resourceUri, method, use

    if removeQs
      resource.remove_question_mark_properties()

    @apply_traits resource, resourceUri, removeQs

  apply_trait: (resourceUri, method, useKey) ->
    trait = @get_trait @key_or_value useKey
    plainParameters = @get_parameters_from_is_key resourceUri, method[0].value, useKey
    temp = trait.cloneForTrait()
    # by aplying the parameter mapping first, we allow users to rename things in the trait,
    # and then merge it with the resource
    @apply_parameters temp, plainParameters, useKey
    @apply_default_media_type_to_method temp
    temp.combine method[1]
    method[1] = temp

  apply_parameters: (resource, parameters, useKey) ->
    unless resource
      return
    if @isString(resource)
      parameterUse = []
      if parameterUse = resource.value.match(/<<\s*([^\|\s>]+)\s*(\|.*)?\s*>>/g)
        parameterUse.forEach (parameter) =>
          parameterName = parameter?.trim()?.replace(/[<>]+/g, '').trim()
          [parameterName, method] = parameterName.split(/\s*\|\s*/)
          unless parameterName of parameters
            throw new exports.ParameterError 'while aplying parameters', null, 'value was not provided for parameter: ' + parameterName , useKey.start_mark
          value = parameters[parameterName]
          if method
            if method.match(/!\s*singularize/)
              value = inflection.singularize(value)
            else if method.match(/!\s*pluralize/)
              value = inflection.pluralize(value)
            else
              throw new exports.ParameterError 'while validating parameter', null, "unknown function applied to parameter" , resource.start_mark
          resource.value = resource.value.replace parameter, value
    if @isSequence(resource)
      resource.value.forEach (node) =>
        @apply_parameters node, parameters, useKey
    if @isMapping(resource)
      resource.value.forEach (property) =>
        @apply_parameters property[0], parameters, useKey
        @apply_parameters property[1], parameters, useKey

  get_parameters_from_is_key: (resourceUri, methodName, typeKey) ->
    result = {
      methodName: methodName,
      resourcePath: resourceUri.replace(/\/\/*/g, '/')
    }
    return result unless @isMapping typeKey
    parameters = @value_or_undefined typeKey
    parameters[0][1].value.forEach (parameter) ->
      unless parameter[1].tag == 'tag:yaml.org,2002:str'
        throw new exports.TraitError 'while aplying parameters', null, 'parameter value is not a scalar', parameter[1].start_mark
      if parameter[1].value in [ "methodName", "resourcePath", "resourcePathName"]
        throw new exports.TraitError 'while aplying parameters', null, 'invalid parameter name "methodName", "resourcePath" are reserved parameter names "resourcePathName"', parameter[1].start_mark
      result[parameter[0].value] = parameter[1].value
    return result

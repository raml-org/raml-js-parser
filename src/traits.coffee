{MarkedYAMLError} = require './errors'
nodes             = require './nodes'

###
The Traits throws these.
###
class @TraitError extends MarkedYAMLError
  
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

  apply_traits: (node, removeQs = true) ->
    return unless @isMapping(node)
    if @has_traits node
      resources = @child_resources node
      resources.forEach (resource) =>
        @apply_traits_to_resource resource[1], removeQs

  apply_traits_to_resource: (resource, removeQs) ->
    return unless @isMapping resource
    methods = @child_methods resource
    # apply traits at the resource level, which is basically the same as applying to each method in the resource
    if @has_property resource, /^is$/
      uses = @property_value resource, /^is$/
      uses.forEach (use) =>
        methods.forEach (method) =>
            @apply_trait method, use
    # iterate over all methods and apply all their traits
    methods.forEach (method) =>
      if @has_property method[1], /^is$/
        uses = @property_value method[1], /^is$/
        uses.forEach (use) =>
          @apply_trait method, use

    if removeQs
      resource.remove_question_mark_properties()

    @apply_traits resource, removeQs

  apply_trait: (method, useKey) ->
    trait = @get_trait @key_or_value useKey
    plainParameters = @get_parameters_from_type_key useKey
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
    if resource.tag == 'tag:yaml.org,2002:str'
      parameterUse = []
      if parameterUse = resource.value.match(/<<([^>]+)>>/g)
        parameterUse.forEach (parameter) =>
          parameter = parameter.replace(/[<>]+/g, '').trim()
          unless parameter of parameters
            throw new exports.TraitError 'while aplying parameters', null, 'value was not provided for parameter: ' + parameter , useKey.start_mark
          resource.value = resource.value.replace "<<" + parameter + ">>", parameters[parameter]
    if resource.tag == 'tag:yaml.org,2002:seq'
      resource.value.forEach (node) =>
        @apply_parameters node, parameters, useKey
    if resource.tag == 'tag:yaml.org,2002:map'
      resource.value.forEach (res) =>
        @apply_parameters res[0], parameters, useKey
        @apply_parameters res[1], parameters, useKey

  get_parameters_from_type_key: (typeKey) ->
    parameters = @value_or_undefined typeKey
    result = {}
    if parameters and parameters[0] and parameters[0][1] and parameters[0][1].value and parameters[0][1].value.length
      parameters[0][1].value.forEach (parameter) ->
        unless parameter[1].tag == 'tag:yaml.org,2002:str'
          throw new exports.TraitError 'while aplying parameters', null, 'parameter value is not a scalar', parameter[1].start_mark
        result[parameter[0].value] = parameter[1].value
    return result

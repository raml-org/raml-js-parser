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
    @declaredTraits = []
    
  has_traits: (node) ->
    if @declaredTraits.length == 0 and @has_property node, /^traits$/i
      @declaredTraits = @property_value node, /^traits$/i
    return @declaredTraits.length > 0
  
  apply_traits: (node) ->
    @check_is_map node
    if @has_traits node
      resources = @child_resources node
      resources.forEach (resource) =>
        methods = @child_methods resource[1]
        # apply traits at the resource level, which is basically the same as applying to each method in the resource
        if @has_property resource[1], /^use$/i
            uses = @property_value resource[1], /^use$/i
            uses.forEach (use) =>
              methods.forEach (method) =>
                @apply_trait method, use
        # iterate over all methods and apply all their traits
        methods.forEach (method) =>
          if @has_property method[1], /^use$/i
            uses = @property_value method[1], /^use$/i
            uses.forEach (use) =>
              @apply_trait method, use

        resource[1].remove_question_mark_properties()
        @apply_traits resource[1]

  apply_parameters: (resource, parameters, useKey) ->
    if resource.tag == 'tag:yaml.org,2002:str'
      parameterUse = []
      if parameterUse = resource.value.match(/<<([^>]+)>>/g)
        parameterUse.forEach (parameter) =>
          parameter = parameter.replace(/[<>]+/g, '')
          unless parameter in parameters
            throw new exports.TraitError 'while aplying parameters', null, 'value was not provided for parameter: ' + parameter , useKey.start_mark
          resource.value.replace "<<" + parameter + ">>", parameters[parameter]
    if resource.tag == 'tag:yaml.org,2002:seq'
      resource.forEach (node) =>
        @apply_parameters node, parameters, useKey
    if resource.tag == 'tag:yaml.org,2002:map'
      @apply_parameters resource.value[0][0], parameters, useKey
      @apply_parameters resource.value[0][1], parameters, useKey

  apply_trait: (method, useKey) ->
    trait = @get_trait @key_or_value useKey
    parameters = @value_or_undefined useKey
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

  get_trait: (traitName) ->
    trait = @declaredTraits.filter( (declaredTrait) -> return declaredTrait[0].value == traitName );
    return trait[0][1];
    
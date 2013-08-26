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
    if @has_property node, /^traits$/i
      @declaredTraits = @property_value node, /^traits$/i
    return @declaredTraits.length > 0
  
  apply_traits: (node) ->
    @check_is_map node
    if @has_traits node
      resources = @child_resources node
      resources.forEach (resource) =>
        if @has_property resource[1], /^use$/i
          uses = @property_value resource[1], /^use$/i
          uses.forEach (use) =>
            @apply_trait resource, use
        resource[1].remove_question_mark_properties()
        @apply_traits resource[1]

  apply_trait: (resource, useKey) ->
    trait = @get_trait @key_or_value useKey

    parameters = @value_or_undefined useKey
    if parameters
      parameters[0][1].value.forEach (parameter) =>
        console.log parameter[1].start_mark
        unless parameter[1].tag == 'tag:yaml.org,2002:str'
          throw new exports.ValidationError 'while aplying parameters', null, 'parameter value is not a scalar', parameter[1].start_mark

    temp = trait.cloneTrait()
    temp.combine resource[1]
    resource[1] = temp

  get_trait: (traitName) ->
    trait = @declaredTraits.filter( (declaredTrait) -> return declaredTrait[0].value == traitName );
    return trait[0][1];
    
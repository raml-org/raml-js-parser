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
    if node instanceof nodes.IncludeNode
      return @has_traits node.value
    if @has_property node, /traits/i
      @declaredTraits = @property_value node, /traits/i
    return @declaredTraits.length > 0
  
  apply_traits: (node) ->
    @check_is_map node
    if @has_traits node
      resources = @child_resources node
      resources.forEach (resource) =>
        if @has_property resource[1], /use/i
          uses = @property_value resource[1], /use/i
          uses.forEach (use) =>
            trait = @get_trait @key_or_value use
            temp = trait.clone()
            temp.combine resource[1]
            resource[1] = temp
        resource[1].remove_question_mark_properties()
        @apply_traits resource[1]
        
  get_trait: (traitName) ->
    trait = @declaredTraits.filter( (declaredTrait) -> return declaredTrait[0].value == traitName );
    provides = trait[0][1].value.filter( (property) -> return property[0].value == 'provides' )
    return provides[0][1];
    
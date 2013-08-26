{MarkedYAMLError} = require './errors'

unique_id = 0

class @ApplicationError extends MarkedYAMLError

class @Node
  constructor: (@tag, @value, @start_mark, @end_mark) ->
    @unique_id = "node_#{unique_id++}"
    
  clone: ->
    temp = new @constructor(@tag, @value.clone(), @start_mark, @end_mark)
    return temp

class @ScalarNode extends @Node
  id: 'scalar'
  constructor: (@tag, @value, @start_mark, @end_mark, @style) ->
    super
    
  clone: ->
    temp = new @constructor(@tag, @value, @start_mark, @end_mark)
    return temp
    
  combine: (node) ->
    if not (node instanceof ScalarNode)
      console.log(@value)
      console.log(node)
      throw new exports.ApplicationError 'while applying node', null, 'different YAML structures', @start_mark
    @value = node.value
    
  remove_question_mark_properties: ->

class @CollectionNode extends @Node
  constructor: (@tag, @value, @start_mark, @end_mark, @flow_style) ->
    super

class @SequenceNode extends @CollectionNode
  id: 'sequence'

  clone: ->
    items = []
    @value.forEach (item) =>
      value = item.clone()
      items.push value
    temp = new @constructor(@tag, items, @start_mark, @end_mark, @flow_style)
    return temp
    
  combine: (node) ->
    if not (node instanceof SequenceNode)
      throw new exports.ApplicationError 'while applying node', null, 'different YAML structures', @start_mark
    node.value.forEach (property) =>
      value = property.clone()
      @value.push value
  
  remove_question_mark_properties: ->
    @value.forEach (item) ->
      item.remove_question_mark_properties()

class @MappingNode extends @CollectionNode
  id: 'mapping'

  clone: ->
    properties = []
    @value.forEach (property) =>
      name = property[0].clone()
      value = property[1].clone()
      properties.push [ name, value ]
    temp = new @constructor( @tag, properties, @start_mark, @end_mark, @flow_style)
    return temp

  cloneTrait: ->
    properties = []
    @value.forEach (property) =>
      name = property[0].clone()
      value = property[1].clone()

      # skip 'name' and 'description' property
      unless  /^name$/i.test(name.value) or /^description$/i.test(name.value)
        properties.push [ name, value ]
    temp = new @constructor( @tag, properties, @start_mark, @end_mark, @flow_style)
    return temp

  combine: (resourceNode) ->
    if not (resourceNode instanceof MappingNode)
      throw new exports.ApplicationError 'while applying node', null, 'different YAML structures', @start_mark

    resourceNode.value.forEach (resourceProperty) =>
      name = resourceProperty[0].value

      trait_has_property = @value.some (someProperty) ->
        return (someProperty[0].value == name) or ((someProperty[0].value + '?') == name) or (someProperty[0].value == (name + '?'))

      if trait_has_property
        @value.forEach (traitProperty) ->
          traitPropertyName = traitProperty[0].value
          if (traitPropertyName == name) or
             ((traitPropertyName + '?') == name) or (traitPropertyName == (name + '?'))
            traitProperty[1].combine resourceProperty[1]
            # remove the '?' at the end of the property name
            traitProperty[0].value = traitProperty[0].value.replace /\?$/, ''
      else
        @value.push [ resourceProperty[0].clone(), resourceProperty[1].clone() ]

  remove_question_mark_properties: ->
    @value = @value.filter (property) ->
      return property[0].value.indexOf('?', property[0].value.length - 1) == -1
    @value.forEach (property) ->
      property[1].remove_question_mark_properties()

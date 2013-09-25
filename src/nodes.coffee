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

  cloneRemoveIs: ->
    return @clone()

  clone: ->
    temp = new @constructor(@tag, @value, @start_mark, @end_mark)
    return temp

  combine: (node) ->
    if this.tag is "tag:yaml.org,2002:null" and node.tag is 'tag:yaml.org,2002:map'
      @value = new exports.MappingNode 'tag:yaml.org,2002:map', [], node.start_mark, node.end_mark
      return @value.combine node
    else if not (node instanceof ScalarNode)
      throw new exports.ApplicationError 'while applying node', null, 'different YAML structures', @start_mark
    @value = node.value
    
  remove_question_mark_properties: ->

class @CollectionNode extends @Node
  constructor: (@tag, @value, @start_mark, @end_mark, @flow_style) ->
    super

class @SequenceNode extends @CollectionNode
  id: 'sequence'

  cloneRemoveIs: ->
    return @clone()

  clone: ->
    items = []
    @value.forEach (item) =>
      value = item.clone()
      items.push value
    temp = new @constructor(@tag, items, @start_mark, @end_mark, @flow_style)
    return temp
    
  combine: (node) ->
    unless node instanceof SequenceNode
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

  cloneForTrait: ->
    @clone()
    properties = []
    @value.forEach (property) =>
      name = property[0].clone()
      value = property[1].clone()

      # skip 'displayName' and 'usage' property
      unless name.value.match(/^(usage|displayName)$/)
        properties.push [ name, value ]
    temp = new @constructor( @tag, properties, @start_mark, @end_mark, @flow_style)
    return temp

  cloneForResourceType: ->
    properties = []
    @value.forEach (property) =>
      name = property[0].cloneRemoveIs()
      value = property[1].cloneRemoveIs()

      # skip 'is', 'displayName' and 'usage' property
      unless name.value.match(/^(is|type|usage|displayName)$/)
        properties.push [ name, value ]
    temp = new @constructor( @tag, properties, @start_mark, @end_mark, @flow_style)
    return temp

  cloneRemoveIs: ->
    properties = []
    @value.forEach (property) =>
      name = property[0].cloneRemoveIs()
      value = property[1].cloneRemoveIs()

      # skip 'is', 'displayName' and 'description' property
      unless name.value.match(/^(is|type)$/)
        properties.push [ name, value ]
    temp = new @constructor( @tag, properties, @start_mark, @end_mark, @flow_style)
    return temp

  combine: (resourceNode) ->
    # We have a special combination strategy in which if the destination node is null,
    # we convert it to a mapping
    if resourceNode.tag is "tag:yaml.org,2002:null"
      resourceNode = new MappingNode 'tag:yaml.org,2002:map', [], resourceNode.start_mark, resourceNode.end_mark

    unless resourceNode instanceof MappingNode
      throw new exports.ApplicationError 'while applying node', null, 'different YAML structures', @start_mark

    resourceNode.value.forEach (resourceProperty) =>
      name = resourceProperty[0].value

      node_has_property = @value.some (someProperty) ->
        return (someProperty[0].value == name) or ((someProperty[0].value + '?') == name) or (someProperty[0].value == (name + '?'))

      if node_has_property
        @value.forEach (ownNodeProperty) ->
          ownNodePropertyName = ownNodeProperty[0].value
          if (ownNodePropertyName == name) or
             ((ownNodePropertyName + '?') == name) or (ownNodePropertyName == (name + '?'))
            ownNodeProperty[1].combine resourceProperty[1]
            # remove the '?' at the end of the property name
            ownNodeProperty[0].value = ownNodeProperty[0].value.replace /\?$/, ''
      else
        @value.push [ resourceProperty[0].clone(), resourceProperty[1].clone() ]

  remove_question_mark_properties: ->
    @value = @value.filter (property) ->
      return property[0].value.indexOf('?', property[0].value.length - 1) == -1
    @value.forEach (property) ->
      property[1].remove_question_mark_properties()

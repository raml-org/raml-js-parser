{MarkedYAMLError} = require './errors'
yaml              = require './yaml'

unique_id = 0

class @IncludeError extends MarkedYAMLError
  
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
      throw new ApplicationError 'while applying node', null, 'different YAML structures', @start_mark
    @value = node.value

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
      throw new ApplicationError 'while applying node', null, 'different YAML structures', @start_mark
    node.value.forEach (property) =>
      value = property.clone()
      @value.push value

class @MappingNode extends @CollectionNode
  id: 'mapping'
  
  clone: ->
    properties = []
    @value.forEach (property) =>
      name = property[0].clone()
      value = property[1].clone()
      properties.push [ name, value ]
    temp = new @constructor(@tag, properties, @start_mark, @end_mark, @flow_style)
    return temp
    
  combine: (node) ->
    if not (node instanceof MappingNode)
      throw new ApplicationError 'while applying node', null, 'different YAML structures', @start_mark
    node.value.forEach (property2) =>
      name = property2[0].value
      has_property = @value.some (property1) -> 
        return (property1[0].value == name) or ((property1[0].value + '?') == name) or (property1[0].value == (name + '?'))
      if has_property
        @value.forEach (property1) ->
          if (property1[0].value == name) or
             ((property1[0].value + '?') == name) or
             (property1[0].value == (name + '?'))
            property1[1].combine property2[1]
          if property1[0].value.indexOf('?', property1[0].value.length - 1) != -1
            property1[0].value = property1[0].value.substring( 0, property1[0].value.length - 1)
      else
        @value.push [ property2[0].clone(), property2[1].clone() ]
  
class @IncludeNode extends @Node
  id: 'include'  
  
  constructor: (@tag, @value, @start_mark, @end_mark, @flow_style) ->
    super
    extension = @value.split(".").pop()
    xhr = new XMLHttpRequest()
    xhr.open 'GET', value, false
    xhr.send null
    if xhr.status == 200
      contentType = xhr.getResponseHeader 'Content-Type'
      if contentType.indexOf('text/yaml') != -1 or
         contentType.indexOf('text/x-yaml') != -1 or
         contentType.indexOf('application/yaml') != -1 or
         contentType.indexOf('application/x-yaml') != -1 or
         extension == 'yaml' or
         extension == 'yml'
        @value = yaml.compose(xhr.responseText);
      else
        @value = xhr.responseText;
    else
      throw new exports.IncludeError 'while including #{value}', null, 'error ' + xhr.status, @start_mark
  
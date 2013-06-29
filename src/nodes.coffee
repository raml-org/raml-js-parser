{MarkedYAMLError} = require './errors'
raml              = require './raml'

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
      throw new ApplicationError 'while applying node', null, 'different YAML structures', @start_mark
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
        
  remove_question_mark_properties: ->
    @value = @value.filter (property) ->
      return property[0].value.indexOf('?', property[0].value.length - 1) == -1
    @value.forEach (property) ->
      property[1].remove_question_mark_properties()
  
class @IncludeNode extends @Node
  id: 'include'  
  
  constructor: (@tag, @value, @start_mark, @end_mark, @flow_style) ->
    super
    extension = @value.split(".").pop()
    if not window?
      xhr = new (require("xmlhttprequest").XMLHttpRequest)()
    else
      xhr = new XMLHttpRequest()
    xhr.open 'GET', value, false
    xhr.send null
    if (typeof xhr.status is 'number' and xhr.status == 200) or
       (typeof xhr.status is 'string' and xhr.status.match /^200/i)
      if extension == 'yaml' or
         extension == 'yml'
        @value = raml.compose(xhr.responseText);
      else
        @value = xhr.responseText;
    else
      throw new exports.IncludeError 'while including ' + value, null, 'error ' + xhr.status, @start_mark

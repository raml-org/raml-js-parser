{MarkedYAMLError} = require './errors'
yaml              = require './yaml'

unique_id = 0

class @IncludeError extends MarkedYAMLError

class @Node
  constructor: (@tag, @value, @start_mark, @end_mark) ->
    @unique_id = "node_#{unique_id++}"

class @ScalarNode extends @Node
  id: 'scalar'
  constructor: (@tag, @value, @start_mark, @end_mark, @style) ->
    super

class @CollectionNode extends @Node
  constructor: (@tag, @value, @start_mark, @end_mark, @flow_style) ->
    super

class @SequenceNode extends @CollectionNode
  id: 'sequence'

class @MappingNode extends @CollectionNode
  id: 'mapping'
  
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
  
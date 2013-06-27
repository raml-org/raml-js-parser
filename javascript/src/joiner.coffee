{MarkedYAMLError} = require './errors'
nodes             = require './nodes'

###
The Traits throws these.
###
class @JoinError extends MarkedYAMLError
  
###
The Joiner class groups resources under resource property and groups methods under operations property
###
class @Joiner
  
  join_resources: (node) ->
    if node instanceof nodes.IncludeNode
      return @join_resources node.value
    resources = node.value.filter (childNode) -> return childNode[0].value.match(/^\//i)
    resourcesArray = []
    if resources.length > 0
      node.value = node.value.filter( (childNode) -> return !childNode[0].value.match(/^\//i) )
      resourcesName = new nodes.ScalarNode 'tag:yaml.org,2002:str', 'resources', resources[0][0].start_mark, resources[ resources.length - 1 ][1].end_mark
      resources.forEach (resource) ->
        relativeUriName = new nodes.ScalarNode 'tag:yaml.org,2002:str', 'relativeUri', resource[0].start_mark, resource[1].end_mark
        relativeUriValue = new nodes.ScalarNode 'tag:yaml.org,2002:str', resource[0].value, resource[0].start_mark, resource[1].end_mark
        resource[1].value.push [ relativeUriName, relativeUriValue ]
        resourcesArray.push resource[1]
      resourcesValue = new nodes.SequenceNode 'tag:yaml.org,2002:seq', resourcesArray, resources[0][0].start_mark, resources[ resources.length - 1 ][1].end_mark
      node.value.push [ resourcesName, resourcesValue ]
  

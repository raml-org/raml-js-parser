objectAssign     = require 'object-assign'
@extend = (destination, sources...) ->
  destination[k] = (v) for k, v of source for source in sources
  return destination

@is_empty = (obj) ->
  return obj.length is 0 if Array.isArray(obj) or typeof obj is 'string'
  return false for own key of obj
  return true

@isNoop =             (node) -> return node
@isMapping =          (node) -> return node?.tag is "tag:yaml.org,2002:map"
@isNull =             (node) -> return node?.tag is "tag:yaml.org,2002:null"
@isSequence =         (node) -> return node?.tag is "tag:yaml.org,2002:seq"
@isString =           (node) -> return node?.tag is "tag:yaml.org,2002:str"
@isInteger =          (node) -> return node?.tag is "tag:yaml.org,2002:int"
@isNullableMapping =  (node) -> return @isMapping(node) or @isNull(node)
@isNullableString =   (node) -> return @isString(node) or @isNull(node)
@isNullableSequence = (node) -> return @isSequence(node) or @isNull(node)
@isNumber =           (node) -> return node?.tag is 'tag:yaml.org,2002:int' or
                                        node?.tag is 'tag:yaml.org,2002:float'
@isScalar =           (node) -> return node?.tag is 'tag:yaml.org,2002:null' or
                                      node?.tag is 'tag:yaml.org,2002:bool' or
                                      node?.tag is 'tag:yaml.org,2002:int' or
                                      node?.tag is 'tag:yaml.org,2002:float' or
                                      node?.tag is 'tag:yaml.org,2002:binary' or
                                      node?.tag is 'tag:yaml.org,2002:timestamp' or
                                      node?.tag is 'tag:yaml.org,2002:str'
@isCollection =       (node) -> return node?.tag is 'tag:yaml.org,2002:omap' or
                                      node?.tag is 'tag:yaml.org,2002:pairs' or
                                      node?.tag is 'tag:yaml.org,2002:set' or
                                      node?.tag is 'tag:yaml.org,2002:seq' or
                                      node?.tag is 'tag:yaml.org,2002:map'

@NON_PRINTABLE = /[^\x09\x0A\x0D\x20-\x7E\x85\xA0-\uD7FF\uE000-\uFFFD]/

@stringifyJSONCircularDepth = (json, depth = 1000) ->
  cache = {}
  JSON.stringify json, (key, value) ->
    if typeof value == 'object' and value != null
      # Store value in our collection
      if cache[key] and cache[key].value == value and cache[key].repetitions > depth
        # Circular reference found, discard key
        delete cache[key]
        return
      # Increments the depth
      if !cache[key]
        cache[key] =
          value: value
          repetitions: 0
      cache[key].repetitions++

      if Array.isArray(value)
        return value.slice()
      else
        return objectAssign({}, value)
    value

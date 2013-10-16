@composer    = require './composer'
@constructor = require './construct'
@errors      = require './errors'
@events      = require './events'
@loader      = require './loader'
@nodes       = require './nodes'
@parser      = require './parser'
@reader      = require './reader'
@resolver    = require './resolver'
@scanner     = require './scanner'
@tokens      = require './tokens'
@q           = require 'q'

class @FileError extends @errors.MarkedYAMLError

defaultSettings = { validate: true, transform: true, compose: true }

###
Parse the first RAML document in a stream and produce the corresponding
Javascript object.
###
@loadFile = (file, settings = defaultSettings) ->
  return @readFileAsync(file)
  .then (stream) =>
      @load stream, file, settings

###
Parse the first RAML document in a file and produce the corresponding
representation tree.
###
@composeFile = (file, settings = defaultSettings, parent) ->
  return @readFileAsync(file)
  .then (stream) =>
      @compose stream, file, settings, parent

###
Parse the first RAML document in a stream and produce the corresponding
representation tree.
###
@compose = (stream, location, settings = defaultSettings, parent) ->
  settings.compose = false
  handleStream(stream, location, settings, parent)

###
Parse the first RAML document in a stream and produce the corresponding
Javascript object.
###
@load = (stream, location, settings = defaultSettings) ->
  settings.compose = true
  handleStream(stream, location, settings, null)

handleStream = (stream, location, settings = defaultSettings, parent) =>
  loader = new exports.loader.Loader stream, location, settings, parent

  return @q.fcall =>
    return loader.getYamlRoot()

  .then (partialTree) =>
    files = loader.getPendingFilesList()
    getPendingFiles(loader, partialTree, files)

  .then (fullyAssembledTree) =>
    loader.composeRamlTree(fullyAssembledTree, settings)

    if settings.compose
      if fullyAssembledTree?
        return loader.construct_document(fullyAssembledTree)
      else
        return null
    else
      return fullyAssembledTree
  .catch (error) =>
    throw error

getPendingFiles = (loader, node, files) =>
  loc = []
  lastVisitedNode = undefined
  for file in files
    loc.push getPendingFile(loader, file)
      .then (overwritingnode) =>
        # we should be able to handle parentless children, but only the last one
        if overwritingnode and !lastVisitedNode
          lastVisitedNode = overwritingnode
  return @q.all(loc).then => return if lastVisitedNode then lastVisitedNode else node

getPendingFile = (loader, fileInfo) =>
  node    = fileInfo.parentNode
  event   = fileInfo.event
  key     = fileInfo.parentKey
  fileUri = fileInfo.targetFileUri

  if fileInfo.includingContext?
    event.value = require('url').resolve(fileInfo.includingContext, fileInfo.targetFileUri)

  if fileInfo.type is 'fragment'
    return @readFileAsync(fileUri)
    .then (result) =>
      return @compose(result, fileInfo.targetFileUri, { validate: false, transform: false, compose: true }, loader)
    .then (value) =>
      return appendNewNodeToParent(node, key, value)
  else
    return @readFileAsync(fileUri)
      .then (result) =>
        value = new @nodes.ScalarNode('tag:yaml.org,2002:str', result, event.start_mark, event.end_mark, event.style)
        return appendNewNodeToParent(node, key, value)

appendNewNodeToParent = (node, key, value) ->
  if node
    if key?
      item = [key, value]
    else
      item [value]
    node.value.push(item)
    return null
  else
    return value

###
Read file either locally or from the network.
###
@readFileAsync = (file) ->
  url = require('url').parse(file)
  if url.protocol?
    unless url.protocol.match(/^https?/i)
      throw new exports.FileError "while reading #{file}", null, "unknown protocol #{url.protocol}", @start_mark
    else
      return @fetchFileAsync file
  else
    if window?
      return @fetchFileAsync file
    else
      return @fetchLocalFileAsync file

###
Read file from the disk.
###
@fetchLocalFileAsync = (file) ->
  deferred = @q.defer()
  require('fs').readFile file, (err, data) =>
    if (err)
      deferred.reject(new exports.FileError "while reading #{file}", null, "cannot read #{file} (#{err})", @start_mark)
    else
      deferred.resolve data.toString()
  return deferred.promise

###
Read file from the network.
###
@fetchFileAsync = (file) ->
  deferred = @q.defer()

  if window?
    xhr = new XMLHttpRequest()
  else
    xhr = new (require('xmlhttprequest').XMLHttpRequest)()

  try
    xhr.open 'GET', file, false
    xhr.setRequestHeader 'Accept', 'application/raml+yaml, */*'

    xhr.onreadystatechange = () =>
      if(xhr.readyState == 4)
        if (typeof xhr.status is 'number' and xhr.status == 200) or
        (typeof xhr.status is 'string' and xhr.status.match /^200/i)
          deferred.resolve(xhr.responseText)
        else
          deferred.reject(new exports.FileError "while fetching #{file}", null, "cannot fetch #{file} (#{xhr.statusText})", @start_mark)

    xhr.send null

    return deferred.promise

  catch error
    throw new exports.FileError "while fetching #{file}", null, "cannot fetch #{file} (#{error})", @start_mark
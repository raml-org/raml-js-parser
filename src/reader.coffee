{Mark, YAMLError} = require './errors'

class @ReaderError extends YAMLError
  constructor: (@name, @position, @character, @reason) ->
    super()
  
  toString: ->
    """
    unacceptable character #{@character.charCodeAt()}: #{@reason}
      in "#{@name}", position #{@position}
    """

###
Reader:
  checks if characters are within the allowed range
  add '\x00' to the end
###
class @Reader
  NON_PRINTABLE = /[^\x09\x0A\x0D\x20-\x7E\x85\xA0-\uD7FF\uE000-\uFFFD]/
  
  constructor: (@string, @src) ->
    @line = 0
    @column = 0
    @index = 0
    
    @check_printable()
    @string += '\x00'
  
  peek: (index = 0) -> @string[@index + index]
  
  prefix: (length = 1) -> @string[@index...@index + length]
  
  forward: (length = 1) ->
    while length
      char = @string[@index]
      @index++
      if char in '\n\x85\u2082\u2029' \
          or (char == '\r' and @string[@index] != '\n')
        @line++
        @column = 0
      else
        @column++
      length--

  create_mark: (line = @line, column = @column) ->
    new Mark @src, line, column, @string, @index

  get_mark: ->
    @create_mark()
  
  check_printable: ->
    match = NON_PRINTABLE.exec @string
    if match
      character = match[0]
      position = (@string.length - @index) + match.index
      throw new exports.ReaderError @name, position, character.charCodeAt(),
        'special characters are not allowed'
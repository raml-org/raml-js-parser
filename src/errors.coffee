{NON_PRINTABLE} = require './util'

class @Mark
  constructor: (@name, @line, @column, @buffer, @pointer) ->

  get_snippet: (indent = 4, max_length = 75) ->
    return null if not @buffer?

    break_chars = '\x00\r\n\x85\u2028\u2029'
    offset = 0
    head = ''
    tail = ''
    start = @pointer
    end = @pointer

    while start > 0 and @buffer[start - 1] not in break_chars
      start--
      if NON_PRINTABLE.test(@buffer[start])
        offset--
      if @pointer - start > Math.ceil(max_length / 2 - 1)
        head = '... '
        start += 4
        offset += 4
        break

    while end < @buffer.length and @buffer[end] not in break_chars
      end++
      if end - @pointer > Math.floor(max_length / 2 - 1)
        tail = ' ...'
        end -= 4
        break

    return """
      #{(new Array indent + 1).join ' '}#{head}#{@buffer[start...end]}#{tail}
      #{(new Array indent + 1 + @pointer - start + offset).join ' '}^
    """

  toString: ->
    snippet = @get_snippet()
    where = "  in \"#{@name}\", line #{@line + 1}, column #{@column + 1}"
    return if not snippet then where else "#{where}:\n#{snippet}"

class @YAMLError extends Error
  constructor: ->
    super()

    Error.captureStackTrace(@, @constructor) if Error.captureStackTrace

  name: 'YAMLError'

class @MarkedYAMLError extends @YAMLError
  constructor: (@context, @context_mark, @message, @problem_mark, @note) ->
    super()

    unless @message
      @message = @context

    unless @problem_mark
      @problem_mark = @context_mark

  toString: ->
    lines = []
    lines.push @context if @context?
    lines.push @context_mark.toString()             \
      if @context_mark? and (                       \
        not @message? or not @problem_mark?         \
        or @context_mark.name != @problem_mark.name \
        or @context_mark.line != @problem_mark.line \
        or @context_mark.column != @problem_mark.column)
    lines.push @message                 if @message != @context
    lines.push @problem_mark.toString() if @problem_mark?
    lines.push @note                    if @note?
    return lines.join '\n'

###
The Validator throws these.
###
class @ValidationError extends @MarkedYAMLError

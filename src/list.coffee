'use strict'

proto = Array.prototype

class List
  constructor: (data, type, parent) ->
    collection = []

    if not type
      type = data[0]?.constructor
    
    if Array.isArray type
      type = type[0]

    @injectClassMethods collection, type, parent

    if typeof data is 'string' and /^\[.+\]$|^\{.+\}$/.test data
      try
        data = JSON.parse data
      catch e
        err = new Error 'could not create List from JSON string: ' + data 
        err.statusCode = 400
        throw err

    data.forEach (item) ->
      collection.push item

    return collection

  injectClassMethods: (collection, type, parent) ->

    define = (prop, desc) ->
      return unless desc?

      Object.defineProperty collection, prop,
        writable: false
        enumerable: false
        value: desc

    for key, value of @
      define key, value

    define 'parent', parent
    define 'itemType', type

    collection

  concat: ->
    arr = proto.concat.apply @, arguments
    new @constructor arr

  map: ->
    arr = proto.map.apply @, arguments
    new @constructor arr

  filter: ->
    arr = proto.filter.apply @, arguments
    new @constructor arr

  build: (data = {}) ->
    if @itemType and data instanceof @itemType 
      data 
    else new @itemType data

  push: (args) ->
    if not Array.isArray args
      args = [ args ]

    added = args.map @build.bind(@)

    count = @length

    added.forEach (add) =>
      count = proto.push.apply @, [ add ]

    count

  splice: (index, count, elements) ->
    args = [ index, count ]

    added = []

    if elements
      if not Array.isArray elements
        elements = [ elements ]

      added = elements.map @build.bind(@)

      if added.length
        args.push added

    proto.splice.apply @, args

  unshift: (args) ->
    if not Array.isArray args
      args = [ args ]

    added = args.map @build.bind(@)

    count = @length

    added.forEach (add) =>
      count = proto.unshift.apply @, [ add ]

    count

module.exports = List
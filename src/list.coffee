'use strict'

class List extends Array
  constructor: (data, type, parent, options) ->
    collection = []

    if not type
      type = data[0]?.constructor
    
    if Array.isArray type
      type = type[0]

    define = (prop, desc) ->
      return unless desc?

      Object.defineProperty collection, prop,
        writable: false
        enumerable: false
        value: desc

    collection.__proto__ = @ 

    define 'parent', parent
    define 'type', type
    define 'options', options

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

  new: (arr) ->
    new @constructor arr, @type, @parent

  concat: ->
    @new Array::concat.apply @, arguments

  map: ->
    @new Array::map.apply @, arguments

  filter: ->
    @new Array::filter.apply @, arguments

  build: (data = {}) ->
    if data instanceof @type 
      data 
    else new @type data, @options

  push: (args) ->
    if not Array.isArray args
      args = [ args ]

    args.forEach (arg) =>
      Array::push.apply @, [ @build(arg) ]

    args.length

  splice: (index, count, elements) ->
    args = [ index, count ]

    if elements
      if not Array.isArray elements
        elements = [ elements ]

      args[3] - elements.map @build.bind(@)

    Array::splice.apply @, args

  unshift: (args) ->
    if not Array.isArray args
      args = [ args ]

    args.forEach (arg) =>
      Array::unshift.apply @, [ @build(arg) ]

    args.length

  toObject: (args...) ->
    
    @map (item) ->
      if typeof item.toObject is 'function'
        item.toObject args...
      else item 
      
  toJSON: ->
    @toObject true

  toString: ->
    JSON.stringify @toJSON()
    
module.exports = List
List = require './list'

objectid = require './objectid'

class Model
  constructor: (data, options = {}) ->

    for own key, value of data
      @[key] = value 
      
    for own key, scope of @constructor.scopes 
      { as, model } = scope

      if not data[as]
        continue 

      if Array.isArray data[as]
        @[as] = new List data[as], @[key], @
      else 
        @[as] = new @[key] data[as] 

        define @[as], '$parent', @

    if options.defaults isnt undefined and options.defaults is false 
      return 

    for own name, property of @constructor.properties
      if property.id and property.type?.toLowerCase() is 'objectid'
        @[name] = objectid @[name]

      if @[name] is undefined and property.default
        @[name] = property.default

  on: ->
    @constructor.on arguments...
    @
  
  once: ->
    @constructor.once arguments...
    @

  toObject: ->
    obj = {} 

    for own key, val of @
      if typeof key is 'string' and key.charAt(0) is '$' and key.charAt(1) is '$'
        continue
      obj[key] = val

    obj
  
  toJSON: @::toObject

  toString: ->
    JSON.stringify @toJSON()

module.exports = Model

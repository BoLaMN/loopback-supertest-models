List = require './list'

objectid = require './objectid'
request  = require './request'
bundle   = require './bundle'

module.exports = (app, models) ->
  configs = bundle app
  apiRoot = app.get 'restApiRoot'

  createRequest = request app, apiRoot, models 

  define = (cls, prop, desc) ->
    Object.defineProperty cls, prop,
      writable: false
      enumerable: false
      value: desc

  createCtor = (name, scope, parent) ->
    { properties, methods, proto, aliases, scopes 
      type, fk, pk, as } = scope

    properties ?= models[name].properties

    child = new Function(
      'return function ' + name + '() {\n' +
      '  return ' + name + '.__super__.constructor.apply(this, arguments);\n' +
      '};'
    )()

    ctor = ->
      @constructor = child
      return

    for own key, value of Model
      child[key] = value
    
    ctor.prototype = Model.prototype

    child.prototype = new ctor
    child.__super__ = Model.prototype

    add = (cls, name, method) ->
      define cls, name, (args...) ->
        if typeof args[args.length - 1] is 'function'
          callback = args.pop()
        
        if parent
          args.unshift parent.id
        else if @id 
          args.unshift @id

        req = createRequest child, method, args
        
        if callback  
          return req.end callback

        req 

    Object.keys(methods or {}).forEach (methodName) ->
      add child, methodName, methods[methodName]

    Object.keys(proto or {}).forEach (methodName) ->
      add child.prototype, methodName, proto[methodName]

    Object.keys(aliases or {}).forEach (aliasName) ->
      alias = aliases[aliasName]
      define child, aliasName, child[alias]

    if as 
      define child, 'as', as

    if type 
      define child, 'type', type

    define child, 'properties', properties
    define child, 'scopes', scopes or {}

    child

  class Model
    constructor: (data) ->

      for own key, value of data
        @[key] = value 
        
      for own key, scope of @constructor.scopes 
        { as, model } = scope

        if not model
          continue 

        define @, key, createCtor model, scope, @

        if not data[as]
          continue 

        if Array.isArray data[as]
          @[as] = new List data[as], @[key]
        else 
          @[as] = new @[key] data[as] 

      for own name, property of @constructor.properties
        if property.type?.toLowerCase() is 'objectid'
          @[name] = objectid @[name]

        if @[name] is undefined and property.default
          @[name] = property.default

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

  Object.keys(configs).forEach (modelName) ->
    models[modelName] = createCtor modelName, configs[modelName]

  models

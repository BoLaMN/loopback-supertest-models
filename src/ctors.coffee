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
    if parent 
      { methods, type, scopes, embed, fk, pk, as, multiple } = scope
      { properties } = models[name]
    else 
      { properties, methods, aliases, scopes } = scope

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

    Object.keys(methods or {}).forEach (methodName) ->
      method = methods[methodName]
      
      define child, methodName, (args...) ->
        if typeof args[args.length - 1] is 'function'
          callback = args.pop()
        
        if parent
          args.unshift parent.id

        req = createRequest child, method, args
        
        if callback  
          return req.end callback

        req 

    Object.keys(aliases or {}).forEach (aliasName) ->
      alias = aliases[aliasName]
      define child, aliasName, child[alias]

    define child, 'properties', properties
    define child, 'scopes', scopes or {}

    if parent 
      define child, 'relationName', as
      define child, 'multiple', multiple

      if not embed and type isnt 'belongsTo'
        Object.defineProperty child.prototype, fk,
          get: -> parent[pk]
          set: (v) -> parent[pk] = v 

      if type is 'belongsTo'
        Object.defineProperty child.prototype, pk,
          get: -> parent[fk]
          set: (v) -> parent[fk] = v 

    child

  class Model
    constructor: (data, parent) ->

      for own key, value of data
        @[key] = value 
        
      if parent 
        define @, 'parent', parent

      for own key, scope of @constructor.scopes 
        { as, multiple, model } = scope

        if not model
          continue 

        define @, key, createCtor model, scope, @

        if not data[as]
          continue 

        if multiple
          @[as] = new List data[as], @[key]
        else 
          @[as] = new @[key] data[as] 

      for own propertyName, property of @constructor.properties
        if Array.isArray property.type
          type = property.type[0]
        else 
          type = property.type

        if type?.toLowerCase() is 'objectid'
          @[propertyName] = objectid()

        if @[propertyName] is undefined and property.default
          @[propertyName] = property.default

    toJSON: ->
      obj = {} 

      for own key, val of @
        if typeof key is 'string' and key.charAt(0) is '$' and key.charAt(1) is '$'
          continue
        obj[key] = val

      obj
    
  Object.keys(configs).forEach (modelName) ->
    models[modelName] = createCtor modelName, configs[modelName]

  models

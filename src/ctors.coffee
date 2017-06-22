List = require './list'

objectid = require './objectid'
request = require './request'

module.exports = (app, models, configs) ->
  createRequest = request app, models 

  define = (cls, prop, desc) ->
    Object.defineProperty cls, prop,
      writable: false
      enumerable: false
      value: desc

  createCtor = (name) ->
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

    child

  buildRelationModel = (parent, scope) ->
    { model, type, scopes, embed, fk, pk, as, multiple } = scope

    ctor = createCtor model
 
    define ctor, 'properties', models[model].properties
    define ctor, 'scopes', scopes or {}

    define ctor, 'relationName', as
    define ctor, 'multiple', multiple

    if not embed and type isnt 'belongsTo'
      Object.defineProperty ctor.prototype, fk,
        get: -> parent[pk]
        set: (v) -> parent[pk] = v 

    if type is 'belongsTo'
      Object.defineProperty ctor.prototype, pk,
        get: -> parent[fk]
        set: (v) -> parent[fk] = v 

    ctor

  class Model
    constructor: (data) ->

      for own key, value of data
        @[key] = value 

      for own key, scope of @constructor.scopes 
        define @, key, buildRelationModel @, scope 

        { as, multiple } = scope

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

        if type.toLowerCase() is 'objectid'
          @[propertyName] = objectid()

        if @[propertyName] is undefined and property.default
          @[propertyName] = property.default

    toJSON: ->

      toJsonReplacer = (key, val) ->
        val = value
        if typeof key is 'string' and key.charAt(0) is '$' and key.charAt(1) is '$'
          val = undefined
        val

      JSON.stringify @, toJsonReplacer
    
  Object.keys(configs).forEach (modelName) ->
    { properties, methods, aliases, scopes } = configs[modelName]
    
    model = createCtor modelName

    define model, 'properties', properties or {}
    define model, 'scopes', scopes or {}

    Object.keys(methods or {}).forEach (methodName) ->
      method = methods[methodName]
      
      define model, methodName, (args...) ->
        if typeof args[args.length - 1] is 'function'
          callback = args.pop()

        req = createRequest model, method, [ @id ], args
        
        if callback  
          return req.end callback

        req 

    Object.keys(aliases or {}).forEach (aliasName) ->
      alias = aliases[aliasName]
      define model, aliasName, model[alias]

    models[modelName] = model

  models

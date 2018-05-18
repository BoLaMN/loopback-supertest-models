List = require './list'

objectid = require './objectid'
params = require './params'

{ EventEmitter } = require 'events'

module.exports = (configs, request, restApiRoot, models) ->

  define = (cls, prop, desc) ->
    return if cls[prop]

    Object.defineProperty cls, prop,
      writable: false
      enumerable: false
      value: desc

  createCtor = (name, scope, parent) ->
    { properties, methods, proto, aliases, scopes
      type, fk, pk, as, url, accepts } = scope

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

    events = models[name] or new EventEmitter

    for f, fn of EventEmitter.prototype
      if typeof fn is 'function'
        define child, f, events[f].bind events

    child.prototype = new ctor
    child.__super__ = Model.prototype

    add = (cls, name, method) ->

      define cls, name, (args...) ->
        if typeof args[args.length - 1] is 'function'
          callback = args.pop()

        p = parent

        ags = []

        if @id
          ags.push @id

        while p
          ags.unshift p.id
          p = p.constructor?.parent

        ids = method.accepts.filter ({ name }) ->
          name in [ 'id', 'fk', 'nk' ]

        for ag, i in ags
          if i is ids.length
            break
          else
            args.splice i, 0, ag

        named = params restApiRoot, method, args
        named.name = name

        req = request child, named

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

    define child, 'parent', parent
    define child, 'properties', properties
    define child, 'scopes', scopes or {}
    define child, 'models', models
    define child, 'url', url
    define child, 'accepts', accepts

    child

  class Model
    constructor: (data, options = {}) ->

      for own key, value of data
        @[key] = value

      for own key, scope of @constructor.scopes
        { as, model } = scope

        if not model
          continue

        subCtor = createCtor model, scope, @

        if Array.isArray data[as]
          @[as] = new List data[as], subCtor
        else if data[as]?
          @[as] = new subCtor data[as]

        define @, key, subCtor

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

  Object.keys(configs).forEach (modelName) ->
    models[modelName] = createCtor modelName, configs[modelName]

  models

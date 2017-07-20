Events = require './events'
Model  = require './model'

params   = require './params'
parser   = require './parser'
define   = require './define'

build = (configs, request, restApiRoot, models) ->

  createCtor = (name, scope) ->
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

    events = models[name] or new Events

    for f, fn of Events.prototype
      if typeof fn is 'function'
        define child, f, events[f].bind events

    child.prototype = new ctor
    child.__super__ = Model.prototype

    add = (cls, name, method) ->
      define cls, name, (args...) ->
        if typeof args[args.length - 1] is 'function'
          callback = args.pop()
        
        if @$parent
          args.unshift @$parent.id
        else if @id 
          args.unshift @id

        named = params restApiRoot, method, args
        req = request parser, child, named
        
        if callback  
          return req.end callback

        req 

    Object.keys(methods or {}).forEach (methodName) ->
      add child, methodName, methods[methodName]

    scopeCtors = {}

    Object.keys(scopes or {}).forEach (scopeName) ->
      scope = scopes[scopeName]

      { as, model } = scope

      if not model
        return 

      scopeCtors[scopeName] = createCtor model, scope

    define child, 'scopes', scopeCtors

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
    define child, 'models', models

    child

  Object.keys(configs).forEach (modelName) ->
    models[modelName] = createCtor modelName, configs[modelName]
    
  models

module.exports = build
async    = require 'async'

bundle   = require './bundle'
ctors    = require './ctors'
request  = require './request'

debug    = require('debug') 'loopback:testing:ctors'

module.exports = (app) ->
  app.start()

  models = {} 

  app.remotes().before '**', (ctx, instance, next) ->
    if typeof instance is 'function'
      next = instance

    regExp = /^__([^_]+)__([^_]+)$/

    { name, sharedClass } = ctx.method
    
    modelName = sharedClass.name

    model = models[modelName]
    matches = name.match regExp 

    if matches?.length > 1
      [ input, name, relation ] = matches

      scope = model.scopes[relation]
      model = models[scope.model]

    debug model.name, name, ctx.args 

    model.emit name, ctx.args

    next()

    return

  async.forEachOf app.models, (model, modelName, next) ->
    model._runWhenAttachedToApp next
  , -> 
      configs = bundle app
      apiRoot = app.get 'restApiRoot'
      
      ctors configs, request(app), apiRoot, models

  models

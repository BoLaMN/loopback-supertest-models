async    = require 'async'

bundle   = require './bundle'
ctors    = require './ctors'
req      = require './request'

debug    = require('debug') 'loopback:testing:ctors'

module.exports = (app) ->
  app.start()

  models = {}

  app.remotes().after '**', (ctx, instance, next) ->
    handler 'after', ctx, instance, next

  app.remotes().before '**', (ctx, instance, next) ->
    handler 'before', ctx, instance, next

  handler = (event, ctx, instance, next) ->
    if typeof instance is 'function'
      next = instance

    regExp = /^__([^_]+)__([^_]+)$/

    { name, sharedClass } = ctx.method

    modelName = sharedClass.name

    model = models[modelName]
    matches = name.match regExp

    if not model?.name
      console.error 'no model found for ' + modelName

      return next()

    if matches?.length > 1
      [ input, name, relation ] = matches

      scope = model.scopes[relation]

      if scope?.model
        model = models[scope.model] or model

    debug model.name, event + ':' + name, ctx.args

    model.emit event + ':' + name, ctx.args

    next()

    return

  async.forEachOf app.models, (model, modelName, next) ->
    model._runWhenAttachedToApp next
  , ->
      configs = bundle app
      apiRoot = app.get 'restApiRoot'

      ctors configs, req(app), apiRoot, models

  models

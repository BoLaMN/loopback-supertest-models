async = require 'async'

bundle = require './bundle'

module.exports = (app) ->
  models = {}

  app.start()

  async.forEachOf app.models, (model, modelName, next) ->
    model._runWhenAttachedToApp next
  , -> bundle(app, models)

  models 
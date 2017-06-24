ctors = require './ctors'
async = require 'async'

module.exports = (app) ->
  app.start()

  models = {} 

  async.forEachOf app.models, (model, modelName, next) ->
    model._runWhenAttachedToApp next
  , -> ctors app, models

  models

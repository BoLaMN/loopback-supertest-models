build   = require '../build'

configs = require './configs'
request = require './request'

models = {}

build configs, request, apiRoot, (name, model) ->
  models[name] = model

module.exports = models
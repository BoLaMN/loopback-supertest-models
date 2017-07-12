ctors = require './ctors'
configs = require './configs'
parser = require './parser'

axios = require 'axios'

models = {}

request = (model, arg) ->

  parse = (response) ->
    response.data = parser(model, arg.returns, response.data, response.status)
    return response

  axios.request
    url: arg.url
    headers: arg.headers
    method: arg.method
    data: arg.body
    params: arg.query
    transformResponse: parse

ctors configs, request, apiRoot, (name, model) ->
  models[name] = model

module.exports = models
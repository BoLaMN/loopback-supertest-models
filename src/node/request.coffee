axios = require 'axios'

module.exports = (parser, model, arg) ->

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

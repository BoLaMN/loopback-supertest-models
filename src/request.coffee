parser    = require './parser'
supertest = require 'supertest'

module.exports = (app) ->
  (model, { method, returns, query, body, headers, url }) ->
    request = supertest(app)[method](url)
    request.type 'json' 

    if body
      request.send body 

    if headers 
      request.set headers 

    if query
      request.query query

    request.auth = (token) ->
      request.set 'Authorization', 'Bearer ' + token 
      request

    request.parse parser model, returns 

    request

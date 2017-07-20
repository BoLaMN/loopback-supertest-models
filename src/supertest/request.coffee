supertest = require 'supertest'

module.exports = (app) ->
  (parser, model, { method, returns, query, body, headers, url }) ->
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

    parse = (res, fn) ->
      res.text = ''
      res.setEncoding 'utf8'
      
      res.on 'data', (chunk) ->
        res.text += chunk

      res.on 'end', ->
        fn null, parser model, returns, res.text, res.statusCode

    request.parse parse

    request

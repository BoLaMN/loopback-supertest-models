parser = require './parser'
supertest = require 'supertest'

module.exports = (app, models) ->
  
  restApiRoot = app.get 'restApiRoot'

  { adapter } = app.handler 'rest'

  isAcceptable = (val, type) ->
    array = Array.isArray(type) or 
            type.toLowerCase() is 'array' or 
            type isnt 'any'

    if array
      return true

    if [ 'boolean', 'string', 'object', 'number' ].indexOf(type) is -1
      return typeof val is 'object'

    typeof val is type

  serializeValue = (val, type) ->
    if type in [ 'object', 'string' ] and typeof val is 'object'
      JSON.stringify val
    else val

  (model, { url, accepts, returns, method }, ctorArgs, args) ->
    query = body = headers = undefined 

    process = (data) ->
      for name, { source, type } of accepts 
        val = data.shift()

        if not val? or not isAcceptable val, type
          continue

        switch source
          when 'body'
            body = val
          when 'form', 'formData'
            body ?= {}
            body[name] = val
          when 'query'
            query ?= {}
            query[name] = serializeValue val, type 
          when 'header'
            headers ?= {}
            headers[name] = val
          when 'path'
            url = url.replace ':' + name, val

    process ctorArgs
    process args 
    
    request = supertest(app)[method](restApiRoot + url)
    request.type 'json' 

    if body
      request.send body 

    if headers 
      request.set headers 

    if query
      request.query query

    auth = request.auth 

    request.auth = (token) ->
      auth.call request, token, type: 'bearer'
      request

    request.parse parser(models, model, returns)

    request

async = require 'async'
supertest = require 'supertest'

List = require './list'

module.exports = (app) ->
  models = {}

  restApiRoot = app.get 'restApiRoot'

  { adapter } = app.handler 'rest'
 
  buildArgs = (method, ctorArgs, args) ->
    { isStatic, isSharedCtor, restClass, accepts, http } = method.sharedMethod or method

    args = if isSharedCtor then ctorArgs else args

    namedArgs = {}

    if not isStatic
      accepts = restClass.ctor.accepts

    accepts
      .filter (accept) ->
        accept.http.source in [ 'path', 'query', 'body' ] 
      .forEach (accept) =>
        val = args.shift()

        if isAcceptable typeof val, accept
          namedArgs[accept.arg or accept.name] = val
        
        return

    namedArgs

  isAcceptable = (val, { type }) ->
    if Array.isArray(type) or type.toLowerCase() is 'array' or type isnt 'any'
      return true

    if ['boolean', 'string', 'object', 'number'].indexOf(type) is -1
      return val is 'object'

    val is type

  remoteMethodProxy = (model, remoteMethod) ->

    (args...) ->
      if typeof args[args.length - 1] is 'function'
        callback = args.pop()

      req = createRequest model, remoteMethod, [ @id ], args
      
      if callback  
        return req.end callback

      req 

  createProxyMethod = (Model, remoteMethod) ->
    if remoteMethod.name is 'Change' or remoteMethod.name is 'Checkpoint'
      return
    
    scope = if remoteMethod.isStatic then Model else Model.prototype

    proxyMethod = remoteMethodProxy Model, remoteMethod

    scope[remoteMethod.name] = proxyMethod

    remoteMethod.aliases.forEach (alias) ->
      scope[alias] = proxyMethod
      return

    return

  serializeQueryStringValue = (val, accept) ->
    if (accept.type == 'object' or accept.type == 'string') and typeof val == 'object'
      JSON.stringify val
    else
      val

  _processArg = (req, verb, accept, args) ->
    httpFormat = accept.http
    
    name = accept.name or accept.arg
    val = args[name]

    if httpFormat
      switch typeof httpFormat
        when 'function', 'object'
          switch httpFormat.source
            when 'body'
              req.body = val
            when 'form', 'formData'
              req.body ?= {}
              req.body[name] = val
            when 'query'
              if val != undefined
                req.query ?= {}
                req.query[name] = serializeQueryStringValue(val, accept)
            when 'header'
              if val != undefined
                req.headers ?= {}
                req.headers[name] = val
            when 'path'
              req.url = req.url.replace ':' + name, val
    else if verb.toLowerCase() == 'get'
      if val != undefined
        req.query ?= {}
        req.query[name] = serializeQueryStringValue(val, accept)
    else
      req.body ?= {}
      req.body[name] = val
    
    req

  parser = (model) ->
    (res, fn) ->
      res.text = ''
      res.setEncoding 'utf8'
      
      res.on 'data', (chunk) ->
        res.text += chunk
        return
      
      res.on 'end', ->
        
        try
          body = res.text and JSON.parse(res.text)

          if Array.isArray body 
            body = new List body, model
          else 
            body = new model body
        catch e
          err = e
          err.rawResponse = res.text or null
          err.statusCode = res.statusCode
        finally
          fn err, body
          
        return
      return

  createRequest = (model, remoteMethod, ctorArgs, args) ->
    method = adapter.getRestMethodByName remoteMethod.stringName
    namedArgs = buildArgs method, ctorArgs, args

    { verb, fullPath } = method.getEndpoints()[0]

    isStatic = method.isStatic or method.sharedMethod?.isStatic

    req = url: fullPath

    if not isStatic
      ctorAccepts = method.restClass.ctor.accepts

      for i of ctorAccepts
        _processArg req, verb, ctorAccepts[i], namedArgs
    
    accepts = method.accepts

    for i of accepts
      _processArg req, verb, accepts[i], namedArgs

    { body, query, headers, url } = req 

    request = supertest(app)[verb.toLowerCase() or 'get'](restApiRoot + url)
    request.type 'json' 

    if body
      request.send body 

    if headers 
      request.set headers 

    if query
      request.query query

    if auth?

      if auth.username and auth.password
        request.auth auth.username, auth.password
      
      if auth.bearer
        request.auth auth.bearer, type: 'bearer'

    request.parse parser(model)

    request

  addModel = (Model) ->
    relations = Object.keys Model.relations 

    class Instance 
      @modelName: Model.modelName
      
      constructor: (data) ->

        for own key, value of data 
          if key in relations
            relation = Model.relations[key]
            model = relation.modelTo.modelName

            if Array.isArray value
              @[key] = new List value, models[model]
            else 
              @[key] = new models[model] value 
          else
            @[key] = value 

    Model.sharedClass.methods().forEach (remoteMethod) =>
      createProxyMethod Instance, remoteMethod

    models[Model.modelName] = Instance

  async.forEachOf app.models, (model, modelName, next) ->
    model._runWhenAttachedToApp next
  , app.models().forEach(addModel)

  models 
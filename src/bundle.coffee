modelInfo = require './model'
createCtors = require './ctors'

module.exports = (app, models) ->

  { adapter } = app.handler 'rest' 

  addModelInfo = (configs, modelName) ->
    configs[modelName] ?= {}
    configs[modelName].properties ?= modelInfo app.models[modelName]
    configs[modelName]

  compact = (array) ->
    idx = 0
    res = []
    
    if array is null
      return res
    
    for value in array when value
      res[idx++] = value
      
    res

  set = (configs, properties, newProp, action, modelName) ->
    model = configs[modelName]

    { relations, dataSource } = app.models[modelName]

    properties.push newProp

    while properties.length
      property = properties.shift()

      if not model
        break

      model[property] ?= {}

      if property not in [ 'scopes', 'methods', 'aliases', 'url' ]
        if relations[property]?.modelTo
          { modelTo, name, embed, multiple, keyFrom, keyTo, type } = relations[property]

          if type in [ 'belongsTo', 'hasOne' ]
            pk = keyTo
            fk = keyFrom
          else
            pk = keyFrom
            fk = keyTo

          if embed
            as = keyFrom
          else
            as = name

          model[property].as = as
          model[property].fk = fk
          model[property].pk = pk 
          
          model[property].type = type 
          model[property].embed = embed
          model[property].multiple = multiple
          model[property].model = modelTo.modelName

          addModelInfo configs, modelTo.modelName

          relations = modelTo.relations

      if not properties.length
        model[property] = action

        if not relations
          continue 

        for name, { embed, keyFrom, modelTo } of relations when embed 
          model[property].scopes ?= {}

          model[property].scopes[keyFrom] ?= 
            model: modelTo.modelName
            as: keyFrom 

          addModelInfo configs, modelTo.modelName

      model = model[property]

    configs

  reducer = (configs, route) ->
    method = adapter.getRestMethodByName route.method
    
    { restClass, accepts, returns
      sharedMethod, name } = method 

    modelName = restClass.name
    model = addModelInfo configs, modelName

    action =
      url: route.path
      method: route.verb.toLowerCase() or 'get'
      accepts: {}
      returns: {}

    if method.isReturningArray()
      action.multiple = true

    accepts
      .filter ({ http }) ->
         http?.source in [ 'path', 'query', 'body' ] 
      .forEach ({ arg, type, http }) ->
        action.accepts[arg] = 
          source: http.source
          type: type 

    returns.forEach ({ arg, root, type }) ->
      if Array.isArray type 
        type = type[0]

      action.returns[arg] = 
        root: root
        type: type 

    sharedMethod.aliases.forEach (alias) ->
      model.aliases ?= {}
      model.aliases[alias] = name.replace 'prototype.', ''

    if sharedMethod.isStatic
      model.methods ?= {}
      model.methods[name] = action
    else
      arr = method.sharedMethod.name.replace /__/g, ' '
      arrParts = compact arr.split ' '
      prop = arrParts[0]

      if arrParts.length > 1
        arrParts.shift()

      if prop is arrParts[0]
        configs[modelName].methods ?= {}
        configs[modelName].methods[prop] = action
      else
        arrParts = arrParts.join '.scopes.'
        arrObject = [ 'scopes' ].concat(arrParts.split('.')).concat [ 'methods' ]

        set configs, arrObject, prop, action, modelName

    configs

  createCtors app, models, adapter.allRoutes().reduce reducer, {}

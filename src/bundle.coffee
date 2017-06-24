modelInfo = require './model'

module.exports = (app) ->
  configs = {}

  { adapter } = app.handler 'rest' 

  addModelInfo = (modelName) ->
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

  set = (properties, newProp, action, modelName) ->
    model = configs[modelName]

    { relations } = app.models[modelName]

    properties.push newProp

    while properties.length
      property = properties.shift()

      if not model
        break

      model[property] ?= {}

      if property not in [ 'scopes', 'methods', 'aliases', 'url' ]
        if relations[property]?.modelTo
          { modelTo, name, embed, keyFrom, keyTo, type } = relations[property]

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
          model[property].model = modelTo.modelName

          addModelInfo modelTo.modelName

          relations = modelTo.relations

      if not properties.length
        model[property] = action

        if not relations
          continue 

        for name, { embed, keyFrom, modelTo } of relations when embed and modelTo?
          model[property].scopes ?= {}

          model[property].scopes[keyFrom] ?= 
            model: modelTo.modelName
            as: keyFrom 

          addModelInfo modelTo.modelName

      model = model[property]

  adapter.allRoutes().forEach (route) ->
    method = adapter.getRestMethodByName route.method
    
    { restClass, accepts, returns
      sharedMethod, name } = method 

    modelName = restClass.name
    model = addModelInfo modelName

    action =
      url: route.path
      method: route.verb.toLowerCase() or 'get'
      accepts: []
      returns: []

    if method.isReturningArray()
      action.multiple = true
    
    addAccept = ({ arg, type, http }) ->
      if Array.isArray type 
        type = type[0]

      action.accepts.push
        name: arg
        source: http?.source or 'query'
        type: type

    addReturn = ({ arg, type, root }) ->
      if Array.isArray type 
        type = type[0]

      action.returns.push
        name: arg
        root: root
        type: type

    if Array.isArray accepts
      accepts
        .filter ({ http, type, arg }) ->
          arg in [ 'filter', 'where' ] or
          http?.source in [ 'path', 'query', 'body' ] and type? 
        .forEach addAccept
    else addAccept accepts

    if Array.isArray returns
      returns.forEach addReturn
    else addReturn returns

    sharedMethod.aliases.forEach (alias) ->
      model.aliases ?= {}
      model.aliases[alias] = name.replace 'prototype.', ''

    if sharedMethod.isStatic
      model.methods ?= {}
      model.methods[name] = action
    else
      arr = method.sharedMethod.name.replace /__/g, ' '
      parts = compact arr.split ' '
      prop = parts[0]

      if parts.length > 1
        parts.shift()

      action.accepts.unshift
        name: 'id'
        source: 'path'
        type: 'any'

      if prop is parts[0]
        configs[modelName].methods ?= {}
        configs[modelName].methods[prop] = action
      else
        parts = parts.join '.scopes.'
        str = [ 'scopes' ].concat(parts.split('.')).concat [ 'methods' ]

        set str, prop, action, modelName

  configs

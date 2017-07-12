module.exports = (restApiRoot, { accepts, url, returns, method }, args) ->
  query = body = headers = undefined 

  acceptable = (val, type) ->
    array = Array.isArray(type) or 
            type.toLowerCase() is 'array' or 
            type is 'any'

    if array
      return true

    if [ 'boolean', 'string', 'object', 'number' ].indexOf(type) is -1
      return typeof val is 'object'

    typeof val is type

  serialize = (val, type) ->
    if type in [ 'object', 'string' ] and typeof val is 'object'
      JSON.stringify val
    else val

  for { name, source, type } in accepts 
    val = args.shift()

    if not val? or not acceptable val, type
      continue

    switch source
      when 'body'
        body = val
      when 'form', 'formData'
        body ?= {}
        body[name] = val
      when 'query'
        query ?= {}
        query[name] = serialize val, type 
      when 'header'
        headers ?= {}
        headers[name] = val
      when 'path'
        url = url.replace ':' + name, val

  url = restApiRoot + url 
  
  { query, body, headers, url, returns, method }
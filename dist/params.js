module.exports = function(restApiRoot, arg, args) {
  var acceptable, accepts, body, headers, i, len, method, name, query, ref, returns, serialize, source, type, url, val;
  accepts = arg.accepts, url = arg.url, returns = arg.returns, method = arg.method;
  query = body = headers = void 0;
  acceptable = function(val, type) {
    var array;
    array = Array.isArray(type) || type.toLowerCase() === 'array' || type === 'any';
    if (array) {
      return true;
    }
    if (['boolean', 'string', 'object', 'number'].indexOf(type) === -1) {
      return typeof val === 'object';
    }
    return typeof val === type;
  };
  serialize = function(val, type) {
    if ((type === 'object' || type === 'string') && typeof val === 'object') {
      return JSON.stringify(val);
    } else {
      return val;
    }
  };
  for (i = 0, len = accepts.length; i < len; i++) {
    ref = accepts[i], name = ref.name, source = ref.source, type = ref.type;
    val = args.shift();
    if ((val == null) || !acceptable(val, type)) {
      continue;
    }
    switch (source) {
      case 'body':
        body = val;
        break;
      case 'form':
      case 'formData':
        if (body == null) {
          body = {};
        }
        body[name] = val;
        break;
      case 'query':
        if (query == null) {
          query = {};
        }
        query[name] = serialize(val, type);
        break;
      case 'header':
        if (headers == null) {
          headers = {};
        }
        headers[name] = val;
        break;
      case 'path':
        url = url.replace(':' + name, val);
    }
  }
  url = restApiRoot + url;
  return {
    query: query,
    body: body,
    headers: headers,
    url: url,
    returns: returns,
    method: method
  };
};

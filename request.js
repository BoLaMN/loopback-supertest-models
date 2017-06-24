var parser, supertest;

parser = require('./parser');

supertest = require('supertest');

module.exports = function(app, models) {
  var adapter, isAcceptable, restApiRoot, serializeValue;
  restApiRoot = app.get('restApiRoot');
  adapter = app.handler('rest').adapter;
  isAcceptable = function(val, type) {
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
  serializeValue = function(val, type) {
    if ((type === 'object' || type === 'string') && typeof val === 'object') {
      return JSON.stringify(val);
    } else {
      return val;
    }
  };
  return function(model, arg, args) {
    var accepts, auth, body, headers, i, len, method, name, query, ref, request, returns, source, type, url, val;
    url = arg.url, accepts = arg.accepts, returns = arg.returns, method = arg.method;
    query = body = headers = void 0;
    for (i = 0, len = accepts.length; i < len; i++) {
      ref = accepts[i], name = ref.name, source = ref.source, type = ref.type;
      val = args.shift();
      if ((val == null) || !isAcceptable(val, type)) {
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
          query[name] = serializeValue(val, type);
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
    request = supertest(app)[method](restApiRoot + url);
    request.type('json');
    if (body) {
      request.send(body);
    }
    if (headers) {
      request.set(headers);
    }
    if (query) {
      request.query(query);
    }
    auth = request.auth;
    request.auth = function(token) {
      request.set('Authorization', 'Bearer ' + token);
      return request;
    };
    request.parse(parser(models, model, returns));
    return request;
  };
};

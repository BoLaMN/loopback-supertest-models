var parser, supertest;

parser = require('./parser');

supertest = require('supertest');

module.exports = function(app, models) {
  var adapter, isAcceptable, restApiRoot, serializeValue;
  restApiRoot = app.get('restApiRoot');
  adapter = app.handler('rest').adapter;
  isAcceptable = function(val, type) {
    var array;
    array = Array.isArray(type) || type.toLowerCase() === 'array' || type !== 'any';
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
  return function(model, arg, ctorArgs, args) {
    var accepts, auth, body, headers, method, process, query, request, returns, url;
    url = arg.url, accepts = arg.accepts, returns = arg.returns, method = arg.method;
    query = body = headers = void 0;
    process = function(data) {
      var name, ref, results, source, type, val;
      results = [];
      for (name in accepts) {
        ref = accepts[name], source = ref.source, type = ref.type;
        val = data.shift();
        if ((val == null) || !isAcceptable(val, type)) {
          continue;
        }
        switch (source) {
          case 'body':
            results.push(body = val);
            break;
          case 'form':
          case 'formData':
            if (body == null) {
              body = {};
            }
            results.push(body[name] = val);
            break;
          case 'query':
            if (query == null) {
              query = {};
            }
            results.push(query[name] = serializeValue(val, type));
            break;
          case 'header':
            if (headers == null) {
              headers = {};
            }
            results.push(headers[name] = val);
            break;
          case 'path':
            results.push(url = url.replace(':' + name, val));
            break;
          default:
            results.push(void 0);
        }
      }
      return results;
    };
    process(ctorArgs);
    process(args);
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
      auth.call(request, token, {
        type: 'bearer'
      });
      return request;
    };
    request.parse(parser(models, model, returns));
    return request;
  };
};

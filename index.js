var List, async, supertest,
  slice = [].slice,
  hasProp = {}.hasOwnProperty,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

async = require('async');

supertest = require('supertest');

List = require('./list');

module.exports = function(app) {
  var _processArg, adapter, addModel, buildArgs, createProxyMethod, createRequest, isAcceptable, models, parser, remoteMethodProxy, restApiRoot, serializeQueryStringValue;
  models = {};
  restApiRoot = app.get('restApiRoot');
  adapter = app.handler('rest').adapter;
  buildArgs = function(method, ctorArgs, args) {
    var accepts, http, isSharedCtor, isStatic, namedArgs, ref, restClass;
    ref = method.sharedMethod || method, isStatic = ref.isStatic, isSharedCtor = ref.isSharedCtor, restClass = ref.restClass, accepts = ref.accepts, http = ref.http;
    args = isSharedCtor ? ctorArgs : args;
    namedArgs = {};
    if (!isStatic) {
      accepts = restClass.ctor.accepts;
    }
    accepts.filter(function(accept) {
      var ref1;
      return (ref1 = accept.http.source) === 'path' || ref1 === 'query' || ref1 === 'body';
    }).forEach((function(_this) {
      return function(accept) {
        var val;
        val = args.shift();
        if (isAcceptable(typeof val, accept)) {
          namedArgs[accept.arg || accept.name] = val;
        }
      };
    })(this));
    return namedArgs;
  };
  isAcceptable = function(val, arg) {
    var type;
    type = arg.type;
    if (Array.isArray(type) || type.toLowerCase() === 'array' || type !== 'any') {
      return true;
    }
    if (['boolean', 'string', 'object', 'number'].indexOf(type) === -1) {
      return val === 'object';
    }
    return val === type;
  };
  remoteMethodProxy = function(model, remoteMethod) {
    return function() {
      var args, callback, req;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if (typeof args[args.length - 1] === 'function') {
        callback = args.pop();
      }
      req = createRequest(model, remoteMethod, [this.id], args);
      if (callback) {
        return req.end(callback);
      }
      return req;
    };
  };
  createProxyMethod = function(Model, remoteMethod) {
    var proxyMethod, scope;
    if (remoteMethod.name === 'Change' || remoteMethod.name === 'Checkpoint') {
      return;
    }
    scope = remoteMethod.isStatic ? Model : Model.prototype;
    proxyMethod = remoteMethodProxy(Model, remoteMethod);
    scope[remoteMethod.name] = proxyMethod;
    remoteMethod.aliases.forEach(function(alias) {
      scope[alias] = proxyMethod;
    });
  };
  serializeQueryStringValue = function(val, accept) {
    if ((accept.type === 'object' || accept.type === 'string') && typeof val === 'object') {
      return JSON.stringify(val);
    } else {
      return val;
    }
  };
  _processArg = function(req, verb, accept, args) {
    var httpFormat, name, val;
    httpFormat = accept.http;
    name = accept.name || accept.arg;
    val = args[name];
    if (httpFormat) {
      switch (typeof httpFormat) {
        case 'function':
        case 'object':
          switch (httpFormat.source) {
            case 'body':
              req.body = val;
              break;
            case 'form':
            case 'formData':
              if (req.body == null) {
                req.body = {};
              }
              req.body[name] = val;
              break;
            case 'query':
              if (val !== void 0) {
                if (req.query == null) {
                  req.query = {};
                }
                req.query[name] = serializeQueryStringValue(val, accept);
              }
              break;
            case 'header':
              if (val !== void 0) {
                if (req.headers == null) {
                  req.headers = {};
                }
                req.headers[name] = val;
              }
              break;
            case 'path':
              req.url = req.url.replace(':' + name, val);
          }
      }
    } else if (verb.toLowerCase() === 'get') {
      if (val !== void 0) {
        if (req.query == null) {
          req.query = {};
        }
        req.query[name] = serializeQueryStringValue(val, accept);
      }
    } else {
      if (req.body == null) {
        req.body = {};
      }
      req.body[name] = val;
    }
    return req;
  };
  parser = function(model) {
    return function(res, fn) {
      res.text = '';
      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        res.text += chunk;
      });
      res.on('end', function() {
        var body, e, err;
        try {
          body = res.text && JSON.parse(res.text);
          if (Array.isArray(body)) {
            body = new List(body, model);
          } else {
            body = new model(body);
          }
        } catch (error) {
          e = error;
          err = e;
          err.rawResponse = res.text || null;
          err.statusCode = res.statusCode;
        } finally {
          fn(err, body);
        }
      });
    };
  };
  createRequest = function(model, remoteMethod, ctorArgs, args) {
    var accepts, body, ctorAccepts, fullPath, headers, i, isStatic, method, namedArgs, query, ref, ref1, req, request, url, verb;
    method = adapter.getRestMethodByName(remoteMethod.stringName);
    namedArgs = buildArgs(method, ctorArgs, args);
    ref = method.getEndpoints()[0], verb = ref.verb, fullPath = ref.fullPath;
    isStatic = method.isStatic || ((ref1 = method.sharedMethod) != null ? ref1.isStatic : void 0);
    req = {
      url: fullPath
    };
    if (!isStatic) {
      ctorAccepts = method.restClass.ctor.accepts;
      for (i in ctorAccepts) {
        _processArg(req, verb, ctorAccepts[i], namedArgs);
      }
    }
    accepts = method.accepts;
    for (i in accepts) {
      _processArg(req, verb, accepts[i], namedArgs);
    }
    body = req.body, query = req.query, headers = req.headers, url = req.url;
    request = supertest(app)[verb.toLowerCase() || 'get'](restApiRoot + url);
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
    if (typeof auth !== "undefined" && auth !== null) {
      if (auth.username && auth.password) {
        request.auth(auth.username, auth.password);
      }
      if (auth.bearer) {
        request.auth(auth.bearer, {
          type: 'bearer'
        });
      }
    }
    request.parse(parser(model));
    return request;
  };
  addModel = function(Model) {
    var Instance, relations;
    relations = Object.keys(Model.relations);
    Instance = (function() {
      Instance.modelName = Model.modelName;

      function Instance(data) {
        var key, model, relation, value;
        for (key in data) {
          if (!hasProp.call(data, key)) continue;
          value = data[key];
          if (indexOf.call(relations, key) >= 0) {
            relation = Model.relations[key];
            model = relation.modelTo.modelName;
            if (Array.isArray(value)) {
              this[key] = new List(value, models[model]);
            } else {
              this[key] = new models[model](value);
            }
          } else {
            this[key] = value;
          }
        }
      }

      return Instance;

    })();
    Model.sharedClass.methods().forEach((function(_this) {
      return function(remoteMethod) {
        return createProxyMethod(Instance, remoteMethod);
      };
    })(this));
    return models[Model.modelName] = Instance;
  };
  async.forEachOf(app.models, function(model, modelName, next) {
    return model._runWhenAttachedToApp(next);
  }, app.models().forEach(addModel));
  return models;
};

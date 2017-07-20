var Events, Model, build, define, params, parser,
  hasProp = {}.hasOwnProperty,
  slice = [].slice;

Events = require('./events');

Model = require('./model');

params = require('./params');

parser = require('./parser');

define = require('./define');

build = function(configs, request, restApiRoot, models) {
  var createCtor;
  createCtor = function(name, scope) {
    var add, aliases, as, child, ctor, events, f, fk, fn, key, methods, pk, properties, proto, ref, scopeCtors, scopes, type, value;
    properties = scope.properties, methods = scope.methods, proto = scope.proto, aliases = scope.aliases, scopes = scope.scopes, type = scope.type, fk = scope.fk, pk = scope.pk, as = scope.as;
    if (properties == null) {
      properties = models[name].properties;
    }
    child = new Function('return function ' + name + '() {\n' + '  return ' + name + '.__super__.constructor.apply(this, arguments);\n' + '};')();
    ctor = function() {
      this.constructor = child;
    };
    for (key in Model) {
      if (!hasProp.call(Model, key)) continue;
      value = Model[key];
      child[key] = value;
    }
    ctor.prototype = Model.prototype;
    events = models[name] || new Events;
    ref = Events.prototype;
    for (f in ref) {
      fn = ref[f];
      if (typeof fn === 'function') {
        define(child, f, events[f].bind(events));
      }
    }
    child.prototype = new ctor;
    child.__super__ = Model.prototype;
    add = function(cls, name, method) {
      return define(cls, name, function() {
        var args, callback, named, req;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        if (typeof args[args.length - 1] === 'function') {
          callback = args.pop();
        }
        if (this.$parent) {
          args.unshift(this.$parent.id);
        } else if (this.id) {
          args.unshift(this.id);
        }
        named = params(restApiRoot, method, args);
        req = request(parser, child, named);
        if (callback) {
          return req.end(callback);
        }
        return req;
      });
    };
    Object.keys(methods || {}).forEach(function(methodName) {
      return add(child, methodName, methods[methodName]);
    });
    scopeCtors = {};
    Object.keys(scopes || {}).forEach(function(scopeName) {
      var model;
      scope = scopes[scopeName];
      as = scope.as, model = scope.model;
      if (!model) {
        return;
      }
      return scopeCtors[scopeName] = createCtor(model, scope);
    });
    define(child, 'scopes', scopeCtors);
    Object.keys(proto || {}).forEach(function(methodName) {
      return add(child.prototype, methodName, proto[methodName]);
    });
    Object.keys(aliases || {}).forEach(function(aliasName) {
      var alias;
      alias = aliases[aliasName];
      return define(child, aliasName, child[alias]);
    });
    if (as) {
      define(child, 'as', as);
    }
    if (type) {
      define(child, 'type', type);
    }
    define(child, 'properties', properties);
    define(child, 'models', models);
    return child;
  };
  Object.keys(configs).forEach(function(modelName) {
    return models[modelName] = createCtor(modelName, configs[modelName]);
  });
  return models;
};

module.exports = build;

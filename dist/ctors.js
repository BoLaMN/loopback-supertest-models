var List, bundle, objectid, request,
  hasProp = {}.hasOwnProperty,
  slice = [].slice;

List = require('./list');

objectid = require('./objectid');

request = require('./request');

bundle = require('./bundle');

module.exports = function(app, models) {
  var Model, apiRoot, configs, createCtor, createRequest, define;
  configs = bundle(app);
  apiRoot = app.get('restApiRoot');
  createRequest = request(app, apiRoot, models);
  define = function(cls, prop, desc) {
    return Object.defineProperty(cls, prop, {
      writable: false,
      enumerable: false,
      value: desc
    });
  };
  createCtor = function(name, scope, parent) {
    var add, aliases, as, child, ctor, fk, key, methods, pk, properties, proto, scopes, type, value;
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
    child.prototype = new ctor;
    child.__super__ = Model.prototype;
    add = function(cls, name, method) {
      return define(cls, name, function() {
        var args, callback, req;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        if (typeof args[args.length - 1] === 'function') {
          callback = args.pop();
        }
        if (parent) {
          args.unshift(parent.id);
        } else if (this.id) {
          args.unshift(this.id);
        }
        req = createRequest(child, method, args);
        if (callback) {
          return req.end(callback);
        }
        return req;
      });
    };
    Object.keys(methods || {}).forEach(function(methodName) {
      return add(child, methodName, methods[methodName]);
    });
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
    define(child, 'scopes', scopes || {});
    return child;
  };
  Model = (function() {
    function Model(data) {
      var as, key, model, name, property, ref, ref1, ref2, scope, value;
      for (key in data) {
        if (!hasProp.call(data, key)) continue;
        value = data[key];
        this[key] = value;
      }
      ref = this.constructor.scopes;
      for (key in ref) {
        if (!hasProp.call(ref, key)) continue;
        scope = ref[key];
        as = scope.as, model = scope.model;
        if (!model) {
          continue;
        }
        define(this, key, createCtor(model, scope, this));
        if (!data[as]) {
          continue;
        }
        if (Array.isArray(data[as])) {
          this[as] = new List(data[as], this[key]);
        } else {
          this[as] = new this[key](data[as]);
        }
      }
      ref1 = this.constructor.properties;
      for (name in ref1) {
        if (!hasProp.call(ref1, name)) continue;
        property = ref1[name];
        if (((ref2 = property.type) != null ? ref2.toLowerCase() : void 0) === 'objectid') {
          this[name] = objectid(this[name]);
        }
        if (this[name] === void 0 && property["default"]) {
          this[name] = property["default"];
        }
      }
    }

    Model.prototype.toJSON = function() {
      var key, obj, ref, val;
      obj = {};
      ref = this;
      for (key in ref) {
        if (!hasProp.call(ref, key)) continue;
        val = ref[key];
        if (typeof key === 'string' && key.charAt(0) === '$' && key.charAt(1) === '$') {
          continue;
        }
        obj[key] = val;
      }
      return obj;
    };

    return Model;

  })();
  Object.keys(configs).forEach(function(modelName) {
    return models[modelName] = createCtor(modelName, configs[modelName]);
  });
  return models;
};

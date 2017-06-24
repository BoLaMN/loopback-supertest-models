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
    var aliases, as, child, ctor, embed, fk, key, methods, multiple, pk, properties, scopes, type, value;
    if (parent) {
      methods = scope.methods, type = scope.type, scopes = scope.scopes, embed = scope.embed, fk = scope.fk, pk = scope.pk, as = scope.as, multiple = scope.multiple;
      properties = models[name].properties;
    } else {
      properties = scope.properties, methods = scope.methods, aliases = scope.aliases, scopes = scope.scopes;
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
    Object.keys(methods || {}).forEach(function(methodName) {
      var method;
      method = methods[methodName];
      return define(child, methodName, function() {
        var args, callback, req;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        if (typeof args[args.length - 1] === 'function') {
          callback = args.pop();
        }
        if (parent) {
          args.unshift(parent.id);
        }
        req = createRequest(child, method, args);
        if (callback) {
          return req.end(callback);
        }
        return req;
      });
    });
    Object.keys(aliases || {}).forEach(function(aliasName) {
      var alias;
      alias = aliases[aliasName];
      return define(child, aliasName, child[alias]);
    });
    define(child, 'properties', properties);
    define(child, 'scopes', scopes || {});
    if (parent) {
      define(child, 'relationName', as);
      define(child, 'multiple', multiple);
      if (!embed && type !== 'belongsTo') {
        Object.defineProperty(child.prototype, fk, {
          get: function() {
            return parent[pk];
          },
          set: function(v) {
            return parent[pk] = v;
          }
        });
      }
      if (type === 'belongsTo') {
        Object.defineProperty(child.prototype, pk, {
          get: function() {
            return parent[fk];
          },
          set: function(v) {
            return parent[fk] = v;
          }
        });
      }
    }
    return child;
  };
  Model = (function() {
    function Model(data, parent) {
      var as, key, model, multiple, property, propertyName, ref, ref1, scope, type, value;
      for (key in data) {
        if (!hasProp.call(data, key)) continue;
        value = data[key];
        this[key] = value;
      }
      if (parent) {
        define(this, 'parent', parent);
      }
      ref = this.constructor.scopes;
      for (key in ref) {
        if (!hasProp.call(ref, key)) continue;
        scope = ref[key];
        as = scope.as, multiple = scope.multiple, model = scope.model;
        if (!model) {
          continue;
        }
        define(this, key, createCtor(model, scope, this));
        if (!data[as]) {
          continue;
        }
        if (multiple) {
          this[as] = new List(data[as], this[key]);
        } else {
          this[as] = new this[key](data[as]);
        }
      }
      ref1 = this.constructor.properties;
      for (propertyName in ref1) {
        if (!hasProp.call(ref1, propertyName)) continue;
        property = ref1[propertyName];
        if (Array.isArray(property.type)) {
          type = property.type[0];
        } else {
          type = property.type;
        }
        if ((type != null ? type.toLowerCase() : void 0) === 'objectid') {
          this[propertyName] = objectid();
        }
        if (this[propertyName] === void 0 && property["default"]) {
          this[propertyName] = property["default"];
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

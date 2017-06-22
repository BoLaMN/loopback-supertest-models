var List, objectid, request,
  hasProp = {}.hasOwnProperty,
  slice = [].slice;

List = require('./list');

objectid = require('./objectid');

request = require('./request');

module.exports = function(app, models, configs) {
  var Model, buildRelationModel, createCtor, createRequest, define;
  createRequest = request(app, models);
  define = function(cls, prop, desc) {
    return Object.defineProperty(cls, prop, {
      writable: false,
      enumerable: false,
      value: desc
    });
  };
  createCtor = function(name) {
    var child, ctor, key, value;
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
    return child;
  };
  buildRelationModel = function(parent, scope) {
    var as, ctor, embed, fk, model, multiple, pk, scopes, type;
    model = scope.model, type = scope.type, scopes = scope.scopes, embed = scope.embed, fk = scope.fk, pk = scope.pk, as = scope.as, multiple = scope.multiple;
    ctor = createCtor(model);
    define(ctor, 'properties', models[model].properties);
    define(ctor, 'scopes', scopes || {});
    define(ctor, 'relationName', as);
    define(ctor, 'multiple', multiple);
    if (!embed && type !== 'belongsTo') {
      Object.defineProperty(ctor.prototype, fk, {
        get: function() {
          return parent[pk];
        },
        set: function(v) {
          return parent[pk] = v;
        }
      });
    }
    if (type === 'belongsTo') {
      Object.defineProperty(ctor.prototype, pk, {
        get: function() {
          return parent[fk];
        },
        set: function(v) {
          return parent[fk] = v;
        }
      });
    }
    return ctor;
  };
  Model = (function() {
    function Model(data) {
      var as, key, multiple, property, propertyName, ref, ref1, scope, type, value;
      for (key in data) {
        if (!hasProp.call(data, key)) continue;
        value = data[key];
        this[key] = value;
      }
      ref = this.constructor.scopes;
      for (key in ref) {
        if (!hasProp.call(ref, key)) continue;
        scope = ref[key];
        define(this, key, buildRelationModel(this, scope));
        as = scope.as, multiple = scope.multiple;
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
        if (type.toLowerCase() === 'objectid') {
          this[propertyName] = objectid();
        }
        if (this[propertyName] === void 0 && property["default"]) {
          this[propertyName] = property["default"];
        }
      }
    }

    Model.prototype.toJSON = function() {
      var toJsonReplacer;
      toJsonReplacer = function(key, val) {
        val = value;
        if (typeof key === 'string' && key.charAt(0) === '$' && key.charAt(1) === '$') {
          val = void 0;
        }
        return val;
      };
      return JSON.stringify(this, toJsonReplacer);
    };

    return Model;

  })();
  Object.keys(configs).forEach(function(modelName) {
    var aliases, methods, model, properties, ref, scopes;
    ref = configs[modelName], properties = ref.properties, methods = ref.methods, aliases = ref.aliases, scopes = ref.scopes;
    model = createCtor(modelName);
    define(model, 'properties', properties || {});
    define(model, 'scopes', scopes || {});
    Object.keys(methods || {}).forEach(function(methodName) {
      var method;
      method = methods[methodName];
      return define(model, methodName, function() {
        var args, callback, req;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        if (typeof args[args.length - 1] === 'function') {
          callback = args.pop();
        }
        req = createRequest(model, method, [this.id], args);
        if (callback) {
          return req.end(callback);
        }
        return req;
      });
    });
    Object.keys(aliases || {}).forEach(function(aliasName) {
      var alias;
      alias = aliases[aliasName];
      return define(model, aliasName, model[alias]);
    });
    return models[modelName] = model;
  });
  return models;
};

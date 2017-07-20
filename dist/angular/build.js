var Events, List, Model, build, define, objectid, params, parser,
  slice = [].slice,
  hasProp = {}.hasOwnProperty,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define = function(cls, prop, desc) {
  if (!((desc != null) || cls[prop])) {
    return;
  }
  return Object.defineProperty(cls, prop, {
    writable: false,
    enumerable: false,
    value: desc
  });
};

module.exports = define;

define = require('./define');

Events = (function() {
  function Events() {
    define(this, 'events', {});
  }

  Events.prototype.on = function(ev, cb) {
    var base;
    if ((base = this.events)[ev] == null) {
      base[ev] = [];
    }
    this.events[ev].push(cb);
    return this.events[ev];
  };

  Events.prototype.removeListener = function(ev, cb) {
    var evts;
    evts = this.events[ev] || [];
    return evts.forEach((function(_this) {
      return function(e, i) {
        if (e === cb || e.cb === cb) {
          return _this.events[ev].splice(i, 1);
        }
      };
    })(this));
  };

  Events.prototype.removeAllListeners = function(ev) {
    var base;
    if (!ev) {
      return this.events = {};
    } else {
      return (base = this.events)[ev] != null ? base[ev] : base[ev] = [];
    }
  };

  Events.prototype.emit = function() {
    var args, ev, evts;
    ev = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    evts = this.events[ev] || [];
    evts.forEach((function(_this) {
      return function(e) {
        return e.apply(_this, args);
      };
    })(this));
    return this;
  };

  Events.prototype.once = function(ev, cb) {
    var c;
    if (!cb) {
      return this;
    }
    c = function() {
      this.removeListener(ev, c);
      return cb.apply(this, arguments);
    };
    c.cb = cb;
    this.on(ev, c);
    return this;
  };

  return Events;

})();

module.exports = Events;

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

define = require('./define');

List = (function(superClass) {
  extend(List, superClass);

  function List(data, type, parent, options) {
    var collection, e, err, ref;
    collection = [];
    if (!type) {
      type = (ref = data[0]) != null ? ref.constructor : void 0;
    }
    if (Array.isArray(type)) {
      type = type[0];
    }
    collection.__proto__ = this;
    define(collection, 'parent', parent);
    define(collection, 'type', type);
    define(collection, 'options', options);
    if (typeof data === 'string' && /^\[.+\]$|^\{.+\}$/.test(data)) {
      try {
        data = JSON.parse(data);
      } catch (error) {
        e = error;
        err = new Error('could not create List from JSON string: ' + data);
        err.statusCode = 400;
        throw err;
      }
    }
    data.forEach(function(item) {
      return collection.push(item);
    });
    return collection;
  }

  List.prototype["new"] = function(arr) {
    return new this.constructor(arr, this.type, this.parent);
  };

  List.prototype.concat = function() {
    return this["new"](Array.prototype.concat.apply(this, arguments));
  };

  List.prototype.map = function() {
    return this["new"](Array.prototype.map.apply(this, arguments));
  };

  List.prototype.filter = function() {
    return this["new"](Array.prototype.filter.apply(this, arguments));
  };

  List.prototype.build = function(data) {
    var cls;
    if (data == null) {
      data = {};
    }
    if (data instanceof this.type) {
      cls = data;
    } else {
      cls = new this.type(data, this.options);
    }
    define(cls, '__parent', this.parent);
    return cls;
  };

  List.prototype.push = function(args) {
    if (!Array.isArray(args)) {
      args = [args];
    }
    args.forEach((function(_this) {
      return function(arg) {
        return Array.prototype.push.apply(_this, [_this.build(arg)]);
      };
    })(this));
    return args.length;
  };

  List.prototype.splice = function(index, count, elements) {
    var args;
    args = [index, count];
    if (elements) {
      if (!Array.isArray(elements)) {
        elements = [elements];
      }
      args[3] - elements.map(this.build.bind(this));
    }
    return Array.prototype.splice.apply(this, args);
  };

  List.prototype.unshift = function(args) {
    if (!Array.isArray(args)) {
      args = [args];
    }
    args.forEach((function(_this) {
      return function(arg) {
        return Array.prototype.unshift.apply(_this, [_this.build(arg)]);
      };
    })(this));
    return args.length;
  };

  List.prototype.toObject = function() {
    var args;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return this.map(function(item) {
      if (typeof item.toObject === 'function') {
        return item.toObject.apply(item, args);
      } else {
        return item;
      }
    });
  };

  List.prototype.toJSON = function() {
    return this.toObject(true);
  };

  List.prototype.toString = function() {
    return JSON.stringify(this.toJSON());
  };

  return List;

})(Array);

module.exports = List;

List = require('./list');

objectid = require('./objectid');

Model = (function() {
  function Model(data, options) {
    var as, key, model, name, property, ref, ref1, ref2, scope, value;
    if (options == null) {
      options = {};
    }
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
      if (!data[as]) {
        continue;
      }
      if (Array.isArray(data[as])) {
        this[as] = new List(data[as], this[key], this);
      } else {
        this[as] = new this[key](data[as]);
        define(this[as], '$parent', this);
      }
    }
    if (options.defaults !== void 0 && options.defaults === false) {
      return;
    }
    ref1 = this.constructor.properties;
    for (name in ref1) {
      if (!hasProp.call(ref1, name)) continue;
      property = ref1[name];
      if (property.id && ((ref2 = property.type) != null ? ref2.toLowerCase() : void 0) === 'objectid') {
        this[name] = objectid(this[name]);
      }
      if (this[name] === void 0 && property["default"]) {
        this[name] = property["default"];
      }
    }
  }

  Model.prototype.on = function() {
    var ref;
    (ref = this.constructor).on.apply(ref, arguments);
    return this;
  };

  Model.prototype.once = function() {
    var ref;
    (ref = this.constructor).once.apply(ref, arguments);
    return this;
  };

  Model.prototype.toObject = function() {
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

  Model.prototype.toJSON = Model.prototype.toObject;

  Model.prototype.toString = function() {
    return JSON.stringify(this.toJSON());
  };

  return Model;

})();

module.exports = Model;

objectid = function(val) {
  var buffer, generate, hex, id, index, next, pid;
  if (val) {
    return val;
  }
  id = parseInt(Math.random() * 0xFFFFFF, 10);
  index = parseInt(Math.random() * 0xFFFFFF, 10);
  pid = Math.floor(Math.random() * 100000) % 0xFFFF;
  next = function() {
    return index = (index + 1) % 0xFFFFFF;
  };
  generate = function() {
    var time;
    time = parseInt(Date.now() / 1000, 10) % 0xFFFFFFFF;
    return hex(8, time) + hex(6, id) + hex(4, pid) + hex(6, next());
  };
  hex = function(length, n) {
    n = n.toString(16);
    if (n.length === length) {
      return n;
    } else {
      return '00000000'.substring(n.length, length) + n;
    }
  };
  buffer = function(str) {
    var i, out;
    i = 0;
    out = [];
    while (i < 24) {
      out.push(parseInt(str[i] + str[i + 1], 16));
      i += 2;
    }
    return out;
  };
  return buffer(generate()).map(hex.bind(this, 2)).join('');
};

module.exports = objectid;

params = function(restApiRoot, arg1, args) {
  var acceptable, accepts, body, headers, j, len, method, name, query, ref, returns, serialize, source, type, url, val;
  accepts = arg1.accepts, url = arg1.url, returns = arg1.returns, method = arg1.method;
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
  for (j = 0, len = accepts.length; j < len; j++) {
    ref = accepts[j], name = ref.name, source = ref.source, type = ref.type;
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

module.exports = params;

List = require('./list');

parser = function(model, returns, body, statusCode) {
  var ctor, err, j, key, len, models, name, opts, ref, root, type;
  body = body && JSON.parse(body);
  if (statusCode >= 400) {
    if (typeof body === 'object' && body.error) {
      err = new Error(body.error.message);
      for (key in body.error) {
        err[key] = body.error[key];
      }
    } else {
      err = new Error('Error: ' + statusCode);
      err.statusCode = statusCode;
      err.details = body;
    }
    return err;
  }
  for (j = 0, len = returns.length; j < len; j++) {
    ref = returns[j], name = ref.name, root = ref.root, type = ref.type;
    if (!root) {
      body = body[name];
    }
    if (model.name === type) {
      ctor = model;
    }
    models = model.models;
    if (ctor == null) {
      ctor = models[name] || models[type] || model;
    }
    opts = {
      defaults: false
    };
    if (ctor) {
      if (Array.isArray(body)) {
        body = new List(body, ctor, null, opts);
      } else {
        body = new ctor(body, opts);
      }
    }
  }
  return body;
};

module.exports = parser;

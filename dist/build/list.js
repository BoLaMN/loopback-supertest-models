var List, define,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  slice = [].slice;

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

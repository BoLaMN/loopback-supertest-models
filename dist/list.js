'use strict';
var List, proto,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  slice = [].slice;

proto = Array.prototype;

List = (function(superClass) {
  extend(List, superClass);

  function List(data, type, parent, options) {
    var collection, define, e, err, ref;
    collection = [];
    if (!type) {
      type = (ref = data[0]) != null ? ref.constructor : void 0;
    }
    if (Array.isArray(type)) {
      type = type[0];
    }
    define = function(prop, desc) {
      if (desc == null) {
        return;
      }
      return Object.defineProperty(collection, prop, {
        writable: false,
        enumerable: false,
        value: desc
      });
    };
    collection.__proto__ = this;
    define('parent', parent);
    define('type', type);
    define('options', options);
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
    return this["new"](proto.concat.apply(this, arguments));
  };

  List.prototype.map = function() {
    return this["new"](proto.map.apply(this, arguments));
  };

  List.prototype.filter = function() {
    return this["new"](proto.filter.apply(this, arguments));
  };

  List.prototype.build = function(data) {
    if (data == null) {
      data = {};
    }
    if (data instanceof this.type) {
      return data;
    } else {
      return new this.type(data, this.options);
    }
  };

  List.prototype.push = function(args) {
    if (!Array.isArray(args)) {
      args = [args];
    }
    args.forEach((function(_this) {
      return function(arg) {
        return proto.push.apply(_this, [_this.build(arg)]);
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
    return proto.splice.apply(this, args);
  };

  List.prototype.unshift = function(args) {
    if (!Array.isArray(args)) {
      args = [args];
    }
    args.forEach((function(_this) {
      return function(arg) {
        return proto.unshift.apply(_this, [_this.build(arg)]);
      };
    })(this));
    return args.length;
  };

  List.prototype.toObject = function() {
    var args;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return this.map(function(item) {
      return item.toObject.apply(item, args);
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

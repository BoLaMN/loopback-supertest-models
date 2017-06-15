'use strict';
var List, proto,
  slice = [].slice;

proto = Array.prototype;

List = (function() {
  function List(data, type, parent) {
    var collection, e, err, ref;
    collection = [];
    if (!type) {
      type = (ref = data[0]) != null ? ref.constructor : void 0;
    }
    if (Array.isArray(type)) {
      type = type[0];
    }
    this.injectClassMethods(collection, type, parent);
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

  List.prototype.injectClassMethods = function(collection, type, parent) {
    var define, key, ref, value;
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
    ref = this;
    for (key in ref) {
      value = ref[key];
      define(key, value);
    }
    define('parent', parent);
    define('itemType', type);
    return collection;
  };

  List.prototype.concat = function() {
    var arr;
    arr = proto.concat.apply(this, arguments);
    return new this.constructor(arr);
  };

  List.prototype.map = function() {
    var arr;
    arr = proto.map.apply(this, arguments);
    return new this.constructor(arr);
  };

  List.prototype.filter = function() {
    var arr;
    arr = proto.filter.apply(this, arguments);
    return new this.constructor(arr);
  };

  List.prototype.build = function(data) {
    if (data == null) {
      data = {};
    }
    if (this.itemType && data instanceof this.itemType) {
      return data;
    } else {
      return new this.itemType(data);
    }
  };

  List.prototype.push = function(args) {
    var added, count;
    if (!Array.isArray(args)) {
      args = [args];
    }
    added = args.map(this.build.bind(this));
    count = this.length;
    added.forEach((function(_this) {
      return function(add) {
        return count = proto.push.apply(_this, [add]);
      };
    })(this));
    return count;
  };

  List.prototype.splice = function(index, count, elements) {
    var added, args;
    args = [index, count];
    added = [];
    if (elements) {
      if (!Array.isArray(elements)) {
        elements = [elements];
      }
      added = elements.map(this.build.bind(this));
      if (added.length) {
        args.push(added);
      }
    }
    return proto.splice.apply(this, args);
  };

  List.prototype.unshift = function(args) {
    var added, count;
    if (!Array.isArray(args)) {
      args = [args];
    }
    added = args.map(this.build.bind(this));
    count = this.length;
    added.forEach((function(_this) {
      return function(add) {
        return count = proto.unshift.apply(_this, [add]);
      };
    })(this));
    return count;
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

})();

module.exports = List;

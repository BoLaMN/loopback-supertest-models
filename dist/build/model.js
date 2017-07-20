var List, Model, objectid,
  hasProp = {}.hasOwnProperty;

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

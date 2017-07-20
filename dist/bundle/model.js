var _models, extend, formatInfo, getModelInfo,
  slice = [].slice,
  hasProp = {}.hasOwnProperty;

extend = function() {
  var args, target;
  target = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
  args.forEach(function(source) {
    var key, results;
    if (!source) {
      return;
    }
    results = [];
    for (key in source) {
      if (!hasProp.call(source, key)) continue;
      if (source[key] !== void 0) {
        results.push(target[key] = source[key]);
      } else {
        results.push(void 0);
      }
    }
    return results;
  });
  return target;
};

formatInfo = function(definition) {
  var k, key, prop, property, ref, ref1, relation, result, type, v, value;
  result = {};
  ref = definition.properties;
  for (key in ref) {
    property = ref[key];
    prop = {};
    for (k in property) {
      if (!hasProp.call(property, k)) continue;
      v = property[k];
      prop[k] = v;
    }
    type = property.type;
    if (typeof type === 'function') {
      type = type.modelName || type.name;
    }
    if (Array.isArray(type)) {
      type = type[0];
      if (type.definition) {
        type = type.definition;
      }
      type = (type != null ? type.modelName : void 0) || (type != null ? type.name : void 0);
    }
    if (type != null) {
      if (result[key] == null) {
        result[key] = prop;
      }
      result[key].type = type;
    }
  }
  ref1 = definition.settings.relations;
  for (key in ref1) {
    value = ref1[key];
    relation = {};
    for (k in value) {
      if (!hasProp.call(value, k)) continue;
      v = value[k];
      relation[k] = v;
    }
    type = relation.model;
    if (relation.property) {
      key = relation.property;
    }
    result[key] = {
      type: type
    };
  }
  return result;
};

_models = {};

module.exports = getModelInfo = function(model) {
  var baseModel, baseProperties, properties, result;
  if (_models[model.modelName]) {
    return _models[model.modelName];
  }
  baseModel = void 0;
  baseProperties = void 0;
  if (model.definition.base) {
    baseModel = getModelInfo(model.app.models[model.definition.base]);
    baseProperties = formatInfo(baseModel.definition);
  }
  properties = formatInfo(model.definition);
  result = extend({}, properties, baseProperties);
  _models[model.modelName] = result;
  return result;
};

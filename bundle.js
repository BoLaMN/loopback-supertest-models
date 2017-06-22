var createCtors, modelInfo;

modelInfo = require('./model');

createCtors = require('./ctors');

module.exports = function(app, models) {
  var adapter, addModelInfo, compact, reducer, set;
  adapter = app.handler('rest').adapter;
  addModelInfo = function(configs, modelName) {
    var base;
    if (configs[modelName] == null) {
      configs[modelName] = {};
    }
    if ((base = configs[modelName]).properties == null) {
      base.properties = modelInfo(app.models[modelName]);
    }
    return configs[modelName];
  };
  compact = function(array) {
    var i, idx, len, res, value;
    idx = 0;
    res = [];
    if (array === null) {
      return res;
    }
    for (i = 0, len = array.length; i < len; i++) {
      value = array[i];
      if (value) {
        res[idx++] = value;
      }
    }
    return res;
  };
  set = function(configs, properties, newProp, action, modelName) {
    var as, base, base1, dataSource, embed, fk, keyFrom, keyTo, model, modelTo, multiple, name, pk, property, ref, ref1, ref2, ref3, relations, type;
    model = configs[modelName];
    ref = app.models[modelName], relations = ref.relations, dataSource = ref.dataSource;
    properties.push(newProp);
    while (properties.length) {
      property = properties.shift();
      if (!model) {
        break;
      }
      if (model[property] == null) {
        model[property] = {};
      }
      if (property !== 'scopes' && property !== 'methods' && property !== 'aliases' && property !== 'url') {
        if ((ref1 = relations[property]) != null ? ref1.modelTo : void 0) {
          ref2 = relations[property], modelTo = ref2.modelTo, name = ref2.name, embed = ref2.embed, multiple = ref2.multiple, keyFrom = ref2.keyFrom, keyTo = ref2.keyTo, type = ref2.type;
          if (type === 'belongsTo' || type === 'hasOne') {
            pk = keyTo;
            fk = keyFrom;
          } else {
            pk = keyFrom;
            fk = keyTo;
          }
          if (embed) {
            as = keyFrom;
          } else {
            as = name;
          }
          model[property].as = as;
          model[property].fk = fk;
          model[property].pk = pk;
          model[property].type = type;
          model[property].embed = embed;
          model[property].multiple = multiple;
          model[property].model = modelTo.modelName;
          addModelInfo(configs, modelTo.modelName);
          relations = modelTo.relations;
        }
      }
      if (!properties.length) {
        model[property] = action;
        if (!relations) {
          continue;
        }
        for (name in relations) {
          ref3 = relations[name], embed = ref3.embed, keyFrom = ref3.keyFrom, modelTo = ref3.modelTo;
          if (!(embed)) {
            continue;
          }
          if ((base = model[property]).scopes == null) {
            base.scopes = {};
          }
          if ((base1 = model[property].scopes)[keyFrom] == null) {
            base1[keyFrom] = {
              model: modelTo.modelName,
              as: keyFrom
            };
          }
          addModelInfo(configs, modelTo.modelName);
        }
      }
      model = model[property];
    }
    return configs;
  };
  reducer = function(configs, route) {
    var accepts, action, arr, arrObject, arrParts, base, method, model, modelName, name, prop, restClass, returns, sharedMethod;
    method = adapter.getRestMethodByName(route.method);
    restClass = method.restClass, accepts = method.accepts, returns = method.returns, sharedMethod = method.sharedMethod, name = method.name;
    modelName = restClass.name;
    model = addModelInfo(configs, modelName);
    action = {
      url: route.path,
      method: route.verb.toLowerCase() || 'get',
      accepts: {},
      returns: {}
    };
    if (method.isReturningArray()) {
      action.multiple = true;
    }
    accepts.filter(function(arg1) {
      var http, ref;
      http = arg1.http;
      return (ref = http != null ? http.source : void 0) === 'path' || ref === 'query' || ref === 'body';
    }).forEach(function(arg1) {
      var arg, http, type;
      arg = arg1.arg, type = arg1.type, http = arg1.http;
      return action.accepts[arg] = {
        source: http.source,
        type: type
      };
    });
    returns.forEach(function(arg1) {
      var arg, root, type;
      arg = arg1.arg, root = arg1.root, type = arg1.type;
      if (Array.isArray(type)) {
        type = type[0];
      }
      return action.returns[arg] = {
        root: root,
        type: type
      };
    });
    sharedMethod.aliases.forEach(function(alias) {
      if (model.aliases == null) {
        model.aliases = {};
      }
      return model.aliases[alias] = name.replace('prototype.', '');
    });
    if (sharedMethod.isStatic) {
      if (model.methods == null) {
        model.methods = {};
      }
      model.methods[name] = action;
    } else {
      arr = method.sharedMethod.name.replace(/__/g, ' ');
      arrParts = compact(arr.split(' '));
      prop = arrParts[0];
      if (arrParts.length > 1) {
        arrParts.shift();
      }
      if (prop === arrParts[0]) {
        if ((base = configs[modelName]).methods == null) {
          base.methods = {};
        }
        configs[modelName].methods[prop] = action;
      } else {
        arrParts = arrParts.join('.scopes.');
        arrObject = ['scopes'].concat(arrParts.split('.')).concat(['methods']);
        set(configs, arrObject, prop, action, modelName);
      }
    }
    return configs;
  };
  return createCtors(app, models, adapter.allRoutes().reduce(reducer, {}));
};

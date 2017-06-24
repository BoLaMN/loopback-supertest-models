var modelInfo;

modelInfo = require('./model');

module.exports = function(app) {
  var adapter, addModelInfo, compact, configs, set;
  configs = {};
  adapter = app.handler('rest').adapter;
  addModelInfo = function(modelName) {
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
  set = function(properties, newProp, action, modelName) {
    var as, base, base1, embed, fk, keyFrom, keyTo, model, modelTo, multiple, name, pk, property, ref, ref1, ref2, relations, results, type;
    model = configs[modelName];
    relations = app.models[modelName].relations;
    properties.push(newProp);
    results = [];
    while (properties.length) {
      property = properties.shift();
      if (!model) {
        break;
      }
      if (model[property] == null) {
        model[property] = {};
      }
      if (property !== 'scopes' && property !== 'methods' && property !== 'aliases' && property !== 'url') {
        if ((ref = relations[property]) != null ? ref.modelTo : void 0) {
          ref1 = relations[property], modelTo = ref1.modelTo, name = ref1.name, embed = ref1.embed, multiple = ref1.multiple, keyFrom = ref1.keyFrom, keyTo = ref1.keyTo, type = ref1.type;
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
          addModelInfo(modelTo.modelName);
          relations = modelTo.relations;
        }
      }
      if (!properties.length) {
        model[property] = action;
        if (!relations) {
          continue;
        }
        for (name in relations) {
          ref2 = relations[name], embed = ref2.embed, keyFrom = ref2.keyFrom, modelTo = ref2.modelTo;
          if (!(embed && (modelTo != null))) {
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
          addModelInfo(modelTo.modelName);
        }
      }
      results.push(model = model[property]);
    }
    return results;
  };
  adapter.allRoutes().forEach(function(route) {
    var accepts, action, arr, base, method, model, modelName, name, parts, prop, ref, restClass, returns, sharedMethod, str;
    method = adapter.getRestMethodByName(route.method);
    restClass = method.restClass, accepts = method.accepts, returns = method.returns, sharedMethod = method.sharedMethod, name = method.name;
    modelName = restClass.name;
    model = addModelInfo(modelName);
    action = {
      url: route.path,
      method: route.verb.toLowerCase() || 'get',
      accepts: [],
      returns: []
    };
    if (method.isReturningArray()) {
      action.multiple = true;
    }
    if (Array.isArray(accepts)) {
      action.accepts = accepts.filter(function(arg1) {
        var arg, http, ref, type;
        http = arg1.http, type = arg1.type, arg = arg1.arg;
        return (arg === 'filter' || arg === 'where') || ((ref = http != null ? http.source : void 0) === 'path' || ref === 'query' || ref === 'body') && (type != null);
      }).map(function(arg1) {
        var arg, http, type;
        arg = arg1.arg, type = arg1.type, http = arg1.http;
        return {
          name: arg,
          source: (http != null ? http.source : void 0) || 'query',
          type: type
        };
      });
    } else {
      action.accepts = [
        {
          name: accepts.arg,
          source: (ref = accepts.http) != null ? ref.source : void 0,
          type: accepts.type
        }
      ];
    }
    if (Array.isArray(returns)) {
      action.returns = returns.map(function(arg1) {
        var arg, root, type;
        arg = arg1.arg, root = arg1.root, type = arg1.type;
        if (Array.isArray(type)) {
          type = type[0];
        }
        return {
          name: arg,
          root: root,
          type: type
        };
      });
    } else {
      action.returns = [
        {
          name: returns.arg,
          root: returns.root,
          type: returns.type
        }
      ];
    }
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
      return model.methods[name] = action;
    } else {
      arr = method.sharedMethod.name.replace(/__/g, ' ');
      parts = compact(arr.split(' '));
      prop = parts[0];
      if (parts.length > 1) {
        parts.shift();
      }
      action.accepts.unshift({
        name: 'id',
        source: 'path',
        type: 'any'
      });
      if (prop === parts[0]) {
        if ((base = configs[modelName]).methods == null) {
          base.methods = {};
        }
        return configs[modelName].methods[prop] = action;
      } else {
        parts = parts.join('.scopes.');
        str = ['scopes'].concat(parts.split('.')).concat(['methods']);
        return set(str, prop, action, modelName);
      }
    }
  });
  return configs;
};

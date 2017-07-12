var async, bundle, ctors, debug, fs, path, request;

async = require('async');

fs = require('fs');

path = require('path');

bundle = require('./bundle');

ctors = require('./ctors');

request = require('./request');

debug = require('debug')('loopback:testing:ctors');

module.exports = function(app) {
  var models;
  app.start();
  models = {};
  app.remotes().before('**', function(ctx, instance, next) {
    var input, matches, model, modelName, name, ref, regExp, relation, scope, sharedClass;
    if (typeof instance === 'function') {
      next = instance;
    }
    regExp = /^__([^_]+)__([^_]+)$/;
    ref = ctx.method, name = ref.name, sharedClass = ref.sharedClass;
    modelName = sharedClass.name;
    model = models[modelName];
    matches = name.match(regExp);
    if ((matches != null ? matches.length : void 0) > 1) {
      input = matches[0], name = matches[1], relation = matches[2];
      scope = model.scopes[relation];
      model = models[scope.model];
    }
    debug(model.name, name, ctx.args);
    model.emit(name, ctx.args);
    next();
  });
  async.forEachOf(app.models, function(model, modelName, next) {
    return model._runWhenAttachedToApp(next);
  }, function() {
    var apiRoot, configJSON, configs;
    configs = bundle(app);
    configJSON = JSON.stringify(configs, null, '\t');
    apiRoot = app.get('restApiRoot');
    fs.writeFileSync(path.join(__dirname, 'configs.json'), configJSON, 'utf-8');
    return ctors(configs, request(app), apiRoot, function(name, model) {
      return models[name] = model;
    });
  });
  return models;
};

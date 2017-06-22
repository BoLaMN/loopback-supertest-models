var async, bundle;

async = require('async');

bundle = require('./bundle');

module.exports = function(app) {
  var models;
  models = {};
  app.start();
  async.forEachOf(app.models, function(model, modelName, next) {
    return model._runWhenAttachedToApp(next);
  }, function() {
    return bundle(app, models);
  });
  return models;
};

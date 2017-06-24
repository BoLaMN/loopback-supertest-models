var async, ctors;

ctors = require('./ctors');

async = require('async');

module.exports = function(app) {
  var models;
  app.start();
  models = {};
  async.forEachOf(app.models, function(model, modelName, next) {
    return model._runWhenAttachedToApp(next);
  }, function() {
    return ctors(app, models);
  });
  return models;
};

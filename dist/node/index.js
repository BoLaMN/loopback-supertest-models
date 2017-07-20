var build, configs, models, request;

build = require('../build');

configs = require('./configs');

request = require('./request');

models = {};

build(configs, request, apiRoot, function(name, model) {
  return models[name] = model;
});

module.exports = models;

var axios, configs, ctors, models, parser, request;

ctors = require('./ctors');

configs = require('./configs');

parser = require('./parser');

axios = require('axios');

models = {};

request = function(model, arg) {
  var parse;
  parse = function(response) {
    response.data = parser(model, arg.returns, response.data, response.status);
    return response;
  };
  return axios.request({
    url: arg.url,
    headers: arg.headers,
    method: arg.method,
    data: arg.body,
    params: arg.query,
    transformResponse: parse
  });
};

ctors(configs, request, apiRoot, function(name, model) {
  return models[name] = model;
});

module.exports = models;

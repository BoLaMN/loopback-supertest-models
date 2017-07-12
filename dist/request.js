var parser, supertest;

parser = require('./parser');

supertest = require('supertest');

module.exports = function(app) {
  return function(model, arg) {
    var body, headers, method, query, request, returns, url;
    method = arg.method, returns = arg.returns, query = arg.query, body = arg.body, headers = arg.headers, url = arg.url;
    request = supertest(app)[method](url);
    request.type('json');
    if (body) {
      request.send(body);
    }
    if (headers) {
      request.set(headers);
    }
    if (query) {
      request.query(query);
    }
    request.auth = function(token) {
      request.set('Authorization', 'Bearer ' + token);
      return request;
    };
    request.parse(parser(model, returns));
    return request;
  };
};

var supertest;

supertest = require('supertest');

module.exports = function(app) {
  return function(parser, model, arg) {
    var body, headers, method, parse, query, request, returns, url;
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
    parse = function(res, fn) {
      res.text = '';
      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        return res.text += chunk;
      });
      return res.on('end', function() {
        return fn(null, parser(model, returns, res.text, res.statusCode));
      });
    };
    request.parse(parse);
    return request;
  };
};

var axios;

axios = require('axios');

module.exports = function(parser, model, arg) {
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

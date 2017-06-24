var List;

List = require('./list');

module.exports = function(models, model, returns) {
  return function(res, fn) {
    res.text = '';
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      return res.text += chunk;
    });
    res.on('end', function() {
      var body, ctor, err, i, key, len, name, ref, root, type;
      body = res.text && JSON.parse(res.text);
      if (res.statusCode >= 400) {
        if (typeof body === 'object' && body.error) {
          err = new Error(body.error.message);
          for (key in body.error) {
            err[key] = body.error[key];
          }
        } else {
          err = new Error('Error: ' + res.statusCode);
          err.statusCode = res.statusCode;
          err.details = body;
        }
        return fn(null, err);
      }
      for (i = 0, len = returns.length; i < len; i++) {
        ref = returns[i], name = ref.name, root = ref.root, type = ref.type;
        if (!root) {
          body = body[name];
        }
        ctor = models[name] || models[type] || model;
        if (Array.isArray(body)) {
          body = new List(body, ctor);
        } else {
          body = new ctor(body);
        }
      }
      return fn(null, body);
    });
  };
};

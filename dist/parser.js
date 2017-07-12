var List;

List = require('./list');

module.exports = function(model, returns, body, statusCode) {
  var ctor, err, i, key, len, models, name, opts, ref, root, type;
  body = body && JSON.parse(body);
  if (statusCode >= 400) {
    if (typeof body === 'object' && body.error) {
      err = new Error(body.error.message);
      for (key in body.error) {
        err[key] = body.error[key];
      }
    } else {
      err = new Error('Error: ' + statusCode);
      err.statusCode = statusCode;
      err.details = body;
    }
    return err;
  }
  for (i = 0, len = returns.length; i < len; i++) {
    ref = returns[i], name = ref.name, root = ref.root, type = ref.type;
    if (!root) {
      body = body[name];
    }
    if (model.name === type) {
      ctor = model;
    }
    models = model.models;
    if (ctor == null) {
      ctor = models[name] || models[type] || model;
    }
    opts = {
      defaults: false
    };
    if (ctor) {
      if (Array.isArray(body)) {
        body = new List(body, ctor, null, opts);
      } else {
        body = new ctor(body, opts);
      }
    }
  }
  return body;
};

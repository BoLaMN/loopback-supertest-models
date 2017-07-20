var bundle, fs, path;

fs = require('fs');

path = require('path');

bundle = require('../bundle');

module.exports = function(app) {
  var configJSON, configs;
  configs = bundle(app);
  configJSON = JSON.stringify(configs, null, '\t');
  fs.writeFileSync(path.join(__dirname, 'configs.json'), configJSON, 'utf-8');
  return configs;
};

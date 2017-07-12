var List, bundle, ctors, fs, objectid, params, parser, path;

fs = require('fs');

path = require('path');

bundle = require('./bundle');

objectid = require('./objectid');

params = require('./params');

ctors = require('./ctors');

parser = require('./parser');

List = require('./list');

module.exports = function(app) {
  var configJS, configJSON, ctorsStr, listClassStr, objectidStr, paramsStr, parserStr;
  configJSON = '  ' + JSON.stringify(bundle(app), null, '\t');
  listClassStr = List.toString();
  ctorsStr = ctors.toString();
  paramsStr = params.toString();
  objectidStr = objectid.toString();
  parserStr = parser.toString();
  configJS = "angular.module('loopback.sdk', [])\n\n.factory('ResourceList', [ function() { \n  " + listClassStr + "\n}])\n\n.factory('ResourceRequest', ['$http', 'ResourceList', function($http, List) {\n  var parser = " + parserStr + "\n\n  return function(model, arg) {\n\n    var parse = function(response) {\n      response.data = parser(model, returns, response.data, response.status);\n      response\n    };\n\n    return $http({\n      url: arg.url,\n      headers: arg.headers,\n      method: arg.method,\n      data: arg.body,\n      params: arg.query,\n      transformResponse: parse\n    });\n  };\n}])\n\n.provider('Resource', [\"$provide\", \"$injector\", function($provide, $injector) {\n  var config = " + configJSON + ";\n  var api = '';\n\n  var List = $injector.get('ResourceList');\n\n  var params = " + paramsStr + "\n  var objectid = " + objectidStr + "\n  var ctors = " + ctorsStr + "\n\n  return {\n    setBaseRoute: function(url) {\n      api = url;\n    },\n    registerModels: function(url) {\n      if (url) { api = url }\n\n      var request = $injector.get('ResourceRequest'); \n      \n      ctors(config, request, api, function(name, model) {\n        $provide.factory(name, [ function() { return model; } ]);\n      });\n    },\n    $get: angular.noop\n  };\n\n}]);";
  return fs.writeFileSync(path.join(__dirname, 'services.js'), configJS, 'utf-8');
};

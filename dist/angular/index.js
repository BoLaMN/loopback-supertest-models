var build, configJS, configs, fs, js, path;

configs = require('./configs');

fs = require('fs');

path = require('path');

build = fs.readFileSync('build.js', 'utf8');

js = build.replace(/(module.exports =.*|.*= require.*)\n+/g, '');

configJS = "angular.module('loopback.sdk', [])\n\n.factory('ResourceRequest', ['$http', function($http) {\n  return function(parser, model, arg) {\n\n    var parse = function(response) {\n      response.data = parser(model, returns, response.data, response.status);\n      response\n    };\n\n    return $http({\n      url: arg.url,\n      headers: arg.headers,\n      method: arg.method,\n      data: arg.body,\n      params: arg.query,\n      transformResponse: parse\n    });\n  };\n}])\n\n.provider('Resource', [\"$provide\", \"$injector\", function($provide, $injector) {\n  var config = " + configs + ";\n  var api = '';\n    " + js + "\n  return {\n    setBaseRoute: function(url) {\n      api = url;\n    },\n    registerModels: function(url) {\n      if (url) { api = url }\n\n      var request = $injector.get('ResourceRequest'); \n      \n      build(config, request, api, function(name, model) {\n        $provide.factory(name, [ function() { return model; } ]);\n      });\n    },\n    $get: angular.noop\n  };\n\n}]);";

fs.writeFileSync(path.join(__dirname, 'services.js'), configJS, 'utf-8');

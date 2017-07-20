configs = require './configs'

fs = require 'fs'
path = require 'path'

#module.exports = (app) ->

build = fs.readFileSync 'build.js', 'utf8'
js = build.replace /(module.exports =.*|.*= require.*)\n+/g, ''

configJS = """
  angular.module('loopback.sdk', [])

  .factory('ResourceRequest', ['$http', function($http) {
    return function(parser, model, arg) {

      var parse = function(response) {
        response.data = parser(model, returns, response.data, response.status);
        response
      };

      return $http({
        url: arg.url,
        headers: arg.headers,
        method: arg.method,
        data: arg.body,
        params: arg.query,
        transformResponse: parse
      });
    };
  }])

  .provider('Resource', ["$provide", "$injector", function($provide, $injector) {
    var config = #{configs};
    var api = '';
    
    #{js}
    
    return {
      setBaseRoute: function(url) {
        api = url;
      },
      registerModels: function(url) {
        if (url) { api = url }

        var request = $injector.get('ResourceRequest'); 
        
        build(config, request, api, function(name, model) {
          $provide.factory(name, [ function() { return model; } ]);
        });
      },
      $get: angular.noop
    };

  }]);
"""

fs.writeFileSync path.join(__dirname, 'services.js'), configJS, 'utf-8'

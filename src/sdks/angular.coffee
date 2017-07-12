fs         = require 'fs'
path       = require 'path'

bundle = require './bundle'
objectid = require './objectid'
params = require './params'
ctors = require './ctors'
parser = require './parser'

List = require './list'

module.exports = (app) ->

  configJSON = '  ' + JSON.stringify bundle(app), null, '\t'
  
  listClassStr = List.toString()
  ctorsStr = ctors.toString()
  paramsStr = params.toString()
  objectidStr = objectid.toString()
  parserStr = parser.toString()

  configJS = """
    angular.module('loopback.sdk', [])

    .factory('ResourceList', [ function() { 
      #{listClassStr}
    }])

    .factory('ResourceRequest', ['$http', 'ResourceList', function($http, List) {
      var parser = #{parserStr}

      return function(model, arg) {

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
      var config = #{configJSON};
      var api = '';

      var List = $injector.get('ResourceList');

      var params = #{paramsStr}
      var objectid = #{objectidStr}
      var ctors = #{ctorsStr}

      return {
        setBaseRoute: function(url) {
          api = url;
        },
        registerModels: function(url) {
          if (url) { api = url }

          var request = $injector.get('ResourceRequest'); 
          
          ctors(config, request, api, function(name, model) {
            $provide.factory(name, [ function() { return model; } ]);
          });
        },
        $get: angular.noop
      };

    }]);
  """

  fs.writeFileSync path.join(__dirname, 'services.js'), configJS, 'utf-8'

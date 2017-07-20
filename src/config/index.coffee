fs         = require 'fs'
path       = require 'path'

bundle   = require '../bundle'

module.exports = (app) ->
  configs = bundle app
  
  configJSON = JSON.stringify configs, null, '\t'

  fs.writeFileSync path.join(__dirname, 'configs.json'), configJSON, 'utf-8'

  configs

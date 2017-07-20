define = require './define'

class Events 
  constructor: ->
    define @, 'events', {}

  on: (ev, cb) ->
    @events[ev] ?= []
    @events[ev].push cb
    @events[ev]

  removeListener: (ev, cb) ->
    evts = @events[ev] or [] 
    evts.forEach (e, i) =>
      if e is cb or e.cb is cb
        @events[ev].splice i, 1

  removeAllListeners: (ev) ->
    if not ev
      @events = {}
    else
      @events[ev] ?= []

  emit: (ev, args...) ->
    evts = @events[ev] or [] 
    evts.forEach (e) =>
      e.apply @, args
    @

  once: (ev, cb) ->
    return @ unless cb

    c = ->
      @removeListener ev, c
      cb.apply @, arguments
    c.cb = cb

    @on ev, c
    @

module.exports = Events
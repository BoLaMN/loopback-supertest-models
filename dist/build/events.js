var Events, define,
  slice = [].slice;

define = require('./define');

Events = (function() {
  function Events() {
    define(this, 'events', {});
  }

  Events.prototype.on = function(ev, cb) {
    var base;
    if ((base = this.events)[ev] == null) {
      base[ev] = [];
    }
    this.events[ev].push(cb);
    return this.events[ev];
  };

  Events.prototype.removeListener = function(ev, cb) {
    var evts;
    evts = this.events[ev] || [];
    return evts.forEach((function(_this) {
      return function(e, i) {
        if (e === cb || e.cb === cb) {
          return _this.events[ev].splice(i, 1);
        }
      };
    })(this));
  };

  Events.prototype.removeAllListeners = function(ev) {
    var base;
    if (!ev) {
      return this.events = {};
    } else {
      return (base = this.events)[ev] != null ? base[ev] : base[ev] = [];
    }
  };

  Events.prototype.emit = function() {
    var args, ev, evts;
    ev = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    evts = this.events[ev] || [];
    evts.forEach((function(_this) {
      return function(e) {
        return e.apply(_this, args);
      };
    })(this));
    return this;
  };

  Events.prototype.once = function(ev, cb) {
    var c;
    if (!cb) {
      return this;
    }
    c = function() {
      this.removeListener(ev, c);
      return cb.apply(this, arguments);
    };
    c.cb = cb;
    this.on(ev, c);
    return this;
  };

  return Events;

})();

module.exports = Events;

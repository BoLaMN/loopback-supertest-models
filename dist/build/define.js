var define;

define = function(cls, prop, desc) {
  if (!((desc != null) || cls[prop])) {
    return;
  }
  return Object.defineProperty(cls, prop, {
    writable: false,
    enumerable: false,
    value: desc
  });
};

module.exports = define;

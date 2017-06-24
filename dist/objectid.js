var id, index, pid;

id = parseInt(Math.random() * 0xFFFFFF, 10);

index = parseInt(Math.random() * 0xFFFFFF, 10);

pid = Math.floor(Math.random() * 100000) % 0xFFFF;

module.exports = function(val) {
  var buffer, generate, hex, next;
  if (val) {
    return val;
  }
  next = function() {
    return index = (index + 1) % 0xFFFFFF;
  };
  generate = function() {
    var time;
    time = parseInt(Date.now() / 1000, 10) % 0xFFFFFFFF;
    return hex(8, time) + hex(6, id) + hex(4, pid) + hex(6, next());
  };
  hex = function(length, n) {
    n = n.toString(16);
    if (n.length === length) {
      return n;
    } else {
      return '00000000'.substring(n.length, length) + n;
    }
  };
  buffer = function(str) {
    var i, out;
    i = 0;
    out = [];
    while (i < 24) {
      out.push(parseInt(str[i] + str[i + 1], 16));
      i += 2;
    }
    return out;
  };
  return buffer(generate()).map(hex.bind(this, 2)).join('');
};

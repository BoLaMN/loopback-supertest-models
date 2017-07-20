objectid = (val) ->
  return val if val 

  id = parseInt(Math.random() * 0xFFFFFF, 10)
  index = parseInt(Math.random() * 0xFFFFFF, 10)
  pid = Math.floor(Math.random() * 100000) % 0xFFFF
  
  next = ->
    index = (index + 1) % 0xFFFFFF

  generate = ->
    time = parseInt((Date.now() / 1000), 10) % 0xFFFFFFFF

    hex(8, time) + hex(6, id) + hex(4, pid) + hex(6, next())

  hex = (length, n) ->
    n = n.toString(16)

    if n.length is length
      n
    else
      '00000000'.substring(n.length, length) + n

  buffer = (str) ->
    i = 0
    out = []

    while i < 24
      out.push(parseInt(str[i] + str[i + 1], 16))
      i += 2

    out

  buffer(generate()).map(hex.bind(this, 2)).join ''

module.exports = objectid
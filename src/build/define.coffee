define = (cls, prop, desc) ->
  return unless desc? or cls[prop]
  
  Object.defineProperty cls, prop,
    writable: false
    enumerable: false
    value: desc

 module.exports = define
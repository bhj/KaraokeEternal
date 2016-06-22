// helper
export default function rows2obj(rows) {
  let out = {}

  if (!Array.isArray(rows) || !rows.length) {
    return out
  }

  rows.forEach(function(row){
    let {key, val} = row

    // simple transform for booleans
    if (val === '0') val = false
    if (val === '1') val = true

    if (typeof out[key] !== 'undefined') {
      if (Array.isArray(out[key])) {
        return out[key].push(val)
      } else {
        return out[key] = [out[key], val]
      }
    }

    out[key] = val
  })

  return out
}

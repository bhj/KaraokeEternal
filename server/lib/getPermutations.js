// return all uppercase and lowercase permutations of str
// based on https://stackoverflow.com/a/27995370
function getPermutations (str) {
  var results = []
  var arr = str.split('')
  var len = Math.pow(arr.length, 2)

  for (var i = 0; i < len; i++) {
    for (var k = 0, j = i; k < arr.length; k++, j >>= 1) {
      arr[k] = (j & 1) ? arr[k].toUpperCase() : arr[k].toLowerCase()
    }
    var combo = arr.join('')
    results.push(combo)
  }
  // remove duplicates
  return results.filter((ext, pos, self) => self.indexOf(ext) === pos)
}

module.exports = getPermutations

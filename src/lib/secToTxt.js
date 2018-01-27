export default function (sec) {
  if (sec >= 60) {
    return Math.round(sec / 60) + 'm'
  } else {
    return Math.floor(sec) + 's'
  }
}

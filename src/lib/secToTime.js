export default function (sec) {
  if (sec >= 60) {
    return {
      value: Math.round(sec / 60),
      unit: 'm',
    }
  } else {
    return {
      value: Math.floor(sec),
      unit: 's',
    }
  }
}

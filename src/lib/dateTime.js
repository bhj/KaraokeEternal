// formats a javascript Date object into a 12h AM/PM time string
// based on https://gist.github.com/hjst/1326755
export function formatTime (dateObj) {
  let hour = dateObj.getHours()
  let minute = dateObj.getMinutes()
  const ap = (hour > 11) ? 'p' : 'a'

  if (hour > 12) {
    hour -= 12
  } else if (hour === 0) {
    hour = '12'
  }

  if (minute < 10) {
    minute = '0' + minute
  }

  return hour + ':' + minute + ap
}

export function formatDate (dateObj) {
  return dateObj.toISOString().substr(0, 10)
}

export function formatDateTime (dateObj) {
  return (formatDate(dateObj) + ' ' + formatTime(dateObj))
}

export function formatSeconds (sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s < 10 ? '0' + s : s}`
}

export function formatSecondsFuzzy (sec) {
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

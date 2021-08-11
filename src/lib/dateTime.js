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
  return dateObj.toISOString().substring(0, 10)
}

export function formatDateTime (dateObj) {
  return (formatDate(dateObj) + ' ' + formatTime(dateObj))
}

export function formatDuration (sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60

  return `${m}:${s < 10 ? '0' + s : s}`
}

export function durationToSeconds (str) {
  const p = str.split(':')
  let s = 0
  let m = 1

  while (p.length > 0) {
    s += m * parseInt(p.pop(), 10)
    m *= 60
  }

  return s
}

export function formatSeconds (sec, fuzzy = false) {
  if (sec >= 60 && fuzzy) return Math.round(sec / 60) + 'm'

  const m = Math.floor(sec / 60)
  const s = sec % 60

  return m ? `${m}m ${s}s` : `${s}s`
}

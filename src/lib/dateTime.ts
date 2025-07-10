// formats a javascript Date object into a 12h AM/PM time string
// based on https://gist.github.com/hjst/1326755
export function formatTime (dateObj: Date) {
  let hour: number | string = dateObj.getHours()
  let minute: number | string = dateObj.getMinutes()
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

export function formatDate (dateObj: Date) {
  return dateObj.toISOString().substring(0, 10)
}

export function formatDateTime (dateObj: Date) {
  return (formatDate(dateObj) + ' ' + formatTime(dateObj))
}

export function formatDuration (sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60

  return `${m}:${s < 10 ? '0' + s : s}`
}

export function formatSeconds (sec: number, fuzzy = false) {
  if (sec >= 60 && fuzzy) return Math.round(sec / 60) + 'm'

  const m = Math.floor(sec / 60)
  const s = sec % 60

  return m ? `${m}m ${s}s` : `${s}s`
}

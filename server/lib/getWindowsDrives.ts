import fs from 'fs'

export default function () {
  const possibleDrives = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => `${letter}:\\`)
  const existingDrives = possibleDrives.filter((drive) => {
    try {
      fs.accessSync(drive, fs.constants.R_OK)
      return true
    } catch {
      return false
    }
  })

  return existingDrives.map(drive => ({
    path: drive,
    label: drive.substring(0, 2),
  }))
}

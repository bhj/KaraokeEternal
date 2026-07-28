/**
 * Pure helpers for FileScanner, kept free of database/IPC/logger imports
 * so they can be unit tested in isolation and safely imported by workers
 * before their logger is initialized.
 */

// per-folder parser config
export const CONFIG_FILENAME = '_kes.v2.json'

// normalize to forward slashes with no leading slash
export const getRelPath = (basePath: string, file: string): string =>
  file.substring(basePath.length).replace(/\\/g, '/').replace(/^\//, '')

// media.dateUpdated stores mtime floored to whole seconds; the same
// normalization must be used for both compare and write or files
// would never match
export const getMtimeSec = (mtimeMs: number): number =>
  Math.floor(mtimeMs / 1000)

/**
 * Whether a file can skip processing entirely
 *
 * @param row - media row matching the file's (pathId, relPath), if any
 * @param mtimeSec - the file's current mtime in whole seconds
 * @param opts.full - full rescan requested; never skip
 * @param opts.requiresCDG - file type requires a .cdg sidecar
 * @param opts.cdgExists - lazy sidecar existence check (only called if
 *   all other conditions pass, since it stats the filesystem)
 */
export const isUnchanged = (
  row: { dateUpdated: number } | undefined,
  mtimeSec: number,
  opts: { full: boolean, requiresCDG: boolean, cdgExists: () => boolean },
): boolean => {
  if (opts.full || !row || row.dateUpdated !== mtimeSec) return false
  return !opts.requiresCDG || opts.cdgExists()
}

/**
 * Whether a scan should keep the ReplayGain values already stored for a file.
 *
 * The player writes values it calculated straight to the db without touching
 * the file, so rescanning an untagged file parses null and would otherwise
 * clear them. Keep them unless the file itself changed.
 *
 * @param scanned - value parsed from the file's tags this scan; null if untagged
 * @param stored - value currently in the db
 * @param mtimeSec - the file's current mtime in whole seconds
 * @param dateUpdated - the row's recorded mtime; 0 means never recorded
 */
export const shouldKeepReplayGain = (
  scanned: unknown,
  stored: unknown,
  mtimeSec: number,
  dateUpdated: number,
): boolean => {
  // tags win, and there's nothing to keep if the db has no value
  if (scanned !== null || stored === null) return false

  // Rows added before dateUpdated held the mtime default to 0, so there's no
  // recorded mtime to compare against and no way to tell whether the file
  // changed. Keep the values: discarding them costs a re-download and
  // re-analysis of the file, while this scan records a real mtime, so a row
  // only lands here once.
  if (dateUpdated === 0) return true

  return mtimeSec <= dateUpdated
}

// order-insensitive equality of { relPath: mtimeSec } maps
export const fingerprintsEqual = (a: Record<string, number>, b: Record<string, number>): boolean => {
  const aKeys = Object.keys(a)
  return aKeys.length === Object.keys(b).length && aKeys.every(key => a[key] === b[key])
}

import path from 'path'
import fsPromises from 'node:fs/promises'
import { parseBuffer } from 'music-metadata'
import { unzip } from 'unzipit'
import getLogger from '../lib/Log.js'
import { getExt } from '../lib/util.js'
import getCdgName from '../lib/getCdgName.js'
import { getMtimeSec, getRelPath, shouldKeepReplayGain } from './scanUtils.js'
import Media from '../Media/Media.js'
import IPC from '../lib/IPCBridge.js'
import fileTypes from '../Media/fileTypes.js'
import { LIBRARY_MATCH_SONG, MEDIA_ADD, MEDIA_UPDATE } from '../../shared/actionTypes.js'
import type { Path, ParsedSongMeta } from '../../shared/types.js'
import type { MediaIndexRow } from '../Media/Media.js'
import type { ICommonTagsResult } from 'music-metadata'

const log = getLogger('FileScanner')

const audioExts = Object.keys(fileTypes).filter(ext => fileTypes[ext].mimeType.startsWith('audio/'))

export interface ParseArgs {
  dir: string
  dirSep: string
  name: string
  meta: ICommonTagsResult
}

export type ParserFn = (args: ParseArgs) => ParsedSongMeta

// "unchanged" is a processed file whose row already matched (e.g. on a
// full scan); it is not tallied since the scan changed nothing for it
export type ProcessStatus = 'new' | 'updated' | 'unchanged'

class FileScanner {
  paths: { result: number[], entities: Record<number, Path> }

  constructor (prefs) {
    this.paths = prefs.paths
  }

  /**
   * Process a single media file: read it, extract metadata, match to a song,
   * and insert or update the corresponding media row.
   *
   * `parsedOrParser` is either pre-resolved song metadata or a parser callback
   * that runs on the file's audio common-tags (a configurable MetaParser
   * derives title/artist from filename + tags).
   *
   * `indexed` carries what PathScanner already has from its path index, so a
   * path scan neither re-derives nor re-queries it per file. When omitted (a
   * single-file ingest) it's resolved here; when supplied with no `row`, the
   * file is known not to be in the database yet.
   */
  async process (
    file: string,
    pathId: number,
    parsedOrParser: ParsedSongMeta | ParserFn,
    indexed?: { relPath: string, row: MediaIndexRow | undefined, mtimeMs: number },
  ): Promise<{ mediaId: number, songId: number, status: ProcessStatus }> {
    // a provider or path scan may hand over a file type the player can't use
    if (!fileTypes[getExt(file)]) {
      throw new Error(`unsupported file type: ${getExt(file) || '(no extension)'}`)
    }

    const relPath = indexed?.relPath ?? getRelPath(this.paths.entities[pathId].path, file)
    const mtimeSec = getMtimeSec(indexed?.mtimeMs ?? (await fsPromises.stat(file)).mtimeMs)
    let row = indexed?.row

    if (!indexed) {
      const res = Media.search({ pathId, relPath })
      log.verbose('  => %s db result(s)', res.result.length)
      row = res.result.length ? res.entities[res.result[0]] : undefined
    }

    let buffer = await fsPromises.readFile(file)
    let mimeType = fileTypes[getExt(file)].mimeType

    if (getExt(file) === '.zip') {
      const { entries } = await unzip(new Uint8Array(buffer))

      const audioName = Object.keys(entries).find(f => !f.includes('/') && audioExts.includes(getExt(f)))
      if (!audioName) throw new Error(`no valid audio file ${JSON.stringify(audioExts)} found in archive`)

      const cdgName = Object.keys(entries).find(f => !f.includes('/') && getExt(f) === '.cdg')
      if (!cdgName) throw new Error('no .cdg sidecar found in archive')

      buffer = Buffer.from(await entries[audioName].arrayBuffer())
      mimeType = fileTypes[getExt(audioName)].mimeType
    } else {
      if (fileTypes[getExt(file)].requiresCDG && !(getCdgName(file))) throw new Error('no .cdg sidecar found')
    }

    const data = await parseBuffer(buffer, mimeType, {
      duration: true,
      skipCovers: true,
    })

    if (!data.format.duration) {
      throw new Error('could not determine duration')
    }

    log.verbose('  => duration: %s:%s',
      Math.floor(data.format.duration / 60),
      Math.round(data.format.duration % 60).toString().padStart(2, '0'),
    )

    const parsed: ParsedSongMeta = typeof parsedOrParser === 'function'
      ? parsedOrParser({
          dir: path.parse(file).dir,
          dirSep: path.sep,
          name: path.parse(file).name,
          meta: data.common,
        })
      : parsedOrParser

    const match = await IPC.req({ type: LIBRARY_MATCH_SONG, payload: parsed }) as { songId: number }

    const media = {
      songId: match.songId,
      pathId,
      relPath,
      duration: Math.round(data.format.duration),
      rgTrackGain: data.common.replaygain_track_gain ? data.common.replaygain_track_gain.dB : null,
      rgTrackPeak: data.common.replaygain_track_peak ? data.common.replaygain_track_peak.ratio : null,
    }

    if (row) {
      const diff = {}

      Object.keys(media).forEach((key) => {
        // An unchanged file normally skips processing entirely, so this mainly
        // covers a full rescan, which bypasses the skip; without it every full
        // rescan would discard client-calculated values for the whole library.
        if ((key === 'rgTrackGain' || key === 'rgTrackPeak')
          && shouldKeepReplayGain(media[key], row[key], mtimeSec, row.dateUpdated)) {
          return
        }

        if (media[key] !== row[key]) diff[key] = media[key]
      })

      const isChanged = Object.keys(diff).length > 0

      // dateUpdated stores the file's mtime; sync it even when content is
      // unchanged so the file can be skipped next scan
      if (isChanged || row.dateUpdated !== mtimeSec) {
        await IPC.req({
          type: MEDIA_UPDATE,
          payload: {
            mediaId: row.mediaId,
            dateUpdated: mtimeSec,
            ...diff,
          },
        })

        log.info('  => updated: %s', Object.keys(diff).join(', ') || 'dateUpdated')
      } else {
        log.info('  => ok')
      }

      // a dateUpdated-only sync is bookkeeping, not a change to the media entry
      return { mediaId: row.mediaId, songId: match.songId, status: isChanged ? 'updated' : 'unchanged' }
    }

    const mediaWithDate = {
      ...media,
      dateAdded: Math.round(new Date().getTime() / 1000), // seconds
      dateUpdated: mtimeSec,
    }
    log.info('  => new: %s', JSON.stringify(match))

    return {
      mediaId: await IPC.req({ type: MEDIA_ADD, payload: mediaWithDate }) as number,
      songId: match.songId,
      status: 'new',
    }
  }
}

export default FileScanner

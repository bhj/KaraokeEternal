import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { close, db, open } from '../lib/Database.js'
import Media from './Media.js'
import Queue from '../Queue/Queue.js'
import User from '../User/User.js'

// runs the real migrations and queries against an in-memory database, so the
// schema is exactly what a fresh install gets
beforeAll(() => {
  open({ file: ':memory:', ro: false })
})

afterAll(() => {
  close()
})

const insert = (query: string, params: unknown[] = []) => Number(db.run(query, params).lastID)

// roleId is NOT NULL with an enforced foreign key, so it can't be left to default
const insertUser = (username: string) => insert(`
  INSERT INTO users (username, password, name, roleId)
  VALUES (?, 'x', ?, (SELECT roleId FROM roles WHERE name = 'standard'))
`, [username, username])

const storedPitch = (userId: number, mediaId: number) => db.get<{ pitch: number }>(
  'SELECT pitch FROM userPitches WHERE userId = ? AND mediaId = ?',
  [userId, mediaId],
)?.pitch

describe('userPitches', () => {
  let roomId: number
  let singer: number
  let other: number
  let songId: number
  let preferredMediaId: number
  let altMediaId: number

  beforeAll(() => {
    const artistId = insert('INSERT INTO artists (name, nameNorm) VALUES (\'Artist\', \'artist\')')
    songId = insert('INSERT INTO songs (artistId, title, titleNorm) VALUES (?, \'Song\', \'song\')', [artistId])
    const pathId = insert('INSERT INTO paths (path, priority) VALUES (\'/media\', 0)')
    roomId = insert('INSERT INTO rooms (name, status) VALUES (\'Room\', \'open\')')
    singer = insertUser('singer')
    other = insertUser('other')

    // two files for the song; the queue resolves to the preferred one
    preferredMediaId = Media.add({ songId, pathId, relPath: 'song.mp4', duration: 200 })
    altMediaId = Media.add({ songId, pathId, relPath: 'song-alt.mp4', duration: 200 })
    Media.setPreferred(preferredMediaId, true)

    Queue.add({ roomId, songId, userId: singer })
    Queue.add({ roomId, songId, userId: other })
  })

  describe('Media.setUserPitch', () => {
    it('reports whether the stored value changed', () => {
      expect(Media.setUserPitch(singer, preferredMediaId, 2)).toBe(true)
      expect(Media.setUserPitch(singer, preferredMediaId, 2)).toBe(false)
      expect(Media.setUserPitch(singer, preferredMediaId, -3)).toBe(true)
      expect(storedPitch(singer, preferredMediaId)).toBe(-3)
    })

    it('stores 0 explicitly, since it overrides a nonzero default', () => {
      expect(Media.setUserPitch(singer, preferredMediaId, 0)).toBe(true)
      expect(storedPitch(singer, preferredMediaId)).toBe(0)
    })

    it('inserts nothing for media that doesn\'t exist', () => {
      expect(Media.setUserPitch(singer, 999999, 1)).toBe(false)
      expect(storedPitch(singer, 999999)).toBeUndefined()
    })

    it('clears with null', () => {
      Media.setUserPitch(singer, preferredMediaId, 5)

      expect(Media.setUserPitch(singer, preferredMediaId, null)).toBe(true)
      expect(Media.setUserPitch(singer, preferredMediaId, null)).toBe(false)
      expect(storedPitch(singer, preferredMediaId)).toBeUndefined()
    })
  })

  describe('Queue.get', () => {
    it('carries each singer\'s own pitch for the picked media alongside the default', () => {
      Media.setPitch(preferredMediaId, 4)
      Media.setUserPitch(singer, preferredMediaId, -2)

      const { result, entities } = Queue.get(roomId)
      const byUser = Object.fromEntries(result.map(id => [entities[id].userId, entities[id]]))

      expect(byUser[singer].mediaId).toBe(preferredMediaId)
      expect(byUser[singer].pitch).toBe(4)
      expect(byUser[singer].userPitch).toBe(-2)
      expect(byUser[other].pitch).toBe(4)
      expect(byUser[other].userPitch).toBeNull()
    })

    it('ignores a preference saved for a different file of the song', () => {
      Media.setUserPitch(singer, preferredMediaId, null)
      Media.setUserPitch(singer, altMediaId, 3)

      const { result, entities } = Queue.get(roomId)
      const item = result.map(id => entities[id]).find(i => i.userId === singer)

      expect(item?.mediaId).toBe(preferredMediaId)
      expect(item?.userPitch).toBeNull()
    })
  })

  describe('cleanup', () => {
    it('Media.cleanup removes preferences for removed media', () => {
      Media.setUserPitch(singer, altMediaId, 3)
      Media.remove([altMediaId])
      Media.cleanup()

      expect(storedPitch(singer, altMediaId)).toBeUndefined()
    })

    it('User.remove removes the user\'s preferences', () => {
      Media.setUserPitch(other, preferredMediaId, 1)
      User.remove(other)

      expect(storedPitch(other, preferredMediaId)).toBeUndefined()
    })

    it('Media.cleanup removes artists left without songs, and their stars', () => {
      const orphanId = insert('INSERT INTO artists (name, nameNorm) VALUES (\'Orphan\', \'orphan\')')
      insert('INSERT INTO songs (artistId, title, titleNorm) VALUES (?, \'Gone\', \'gone\')', [orphanId])
      insert('INSERT INTO artistStars (userId, artistId) VALUES (?, ?)', [singer, orphanId])
      Media.cleanup()

      expect(db.get('SELECT * FROM artists WHERE artistId = ?', [orphanId])).toBeUndefined()
      expect(db.get('SELECT * FROM artistStars WHERE artistId = ?', [orphanId])).toBeUndefined()
      expect(db.get('SELECT * FROM songs WHERE songId = ?', [songId])).toBeDefined()
    })
  })
})

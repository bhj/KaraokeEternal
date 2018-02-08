const db = require('sqlite')
const squel = require('squel')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api/library' })
const debug = require('debug')
const log = debug('app:library')

// get song's media info
router.get('/song/:songId', async (ctx, next) => {
  const media = {
    result: [],
    entities: {},
  }

  // required
  if (!ctx.params.songId) {
    ctx.status = 422
    ctx.body = `Invalid songId`
    return
  }

  try {
    const q = squel.select()
      .field('media.mediaId, media.duration, media.provider, media.providerData, media.isPreferred')
      .field('songs.artistId, songs.songId, songs.title')
      .from('media')
      .where('songId = ?', ctx.params.songId)
      .join(squel.select()
        .from('providers')
        .where('providers.isEnabled = 1')
        .order('priority'),
      'providers', 'media.provider = providers.name')
      .join('songs USING (songId)')
      .join('artists USING (artistId)')
      .order('media.lastTimestamp')

    const { text, values } = q.toParam()
    const rows = await db.all(text, values)

    rows.forEach(row => {
      media.result.push(row.mediaId)
      media.entities[row.mediaId] = {
        ...row,
        providerData: JSON.parse(row.providerData),
      }
    })

    ctx.body = media
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
  }
})

module.exports = router

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

  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  // required
  if (!ctx.params.songId) {
    ctx.status = 422
    ctx.body = `Invalid songId`
    return
  }

  const q = squel.select()
    .field('media.*')
    .field('songs.artistId, songs.songId, songs.title')
    .from('media')
    .where('songId = ?', ctx.params.songId)
    .join(squel.select()
      .from('paths'),
    'paths', 'paths.pathId = media.pathId')
    .join('songs USING (songId)')
    .join('artists USING (artistId)')
    .order('paths.priority')

  const { text, values } = q.toParam()
  const rows = await db.all(text, values)

  rows.forEach(row => {
    media.result.push(row.mediaId)
    media.entities[row.mediaId] = row
  })

  ctx.body = media
})

module.exports = router

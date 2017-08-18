const db = require('sqlite')
const squel = require('squel')
const log = require('debug')('app:provider:youtube')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api/provider/youtube' })
const getProviders = require('../getProviders')

// set api key
router.put('/apiKey', async (ctx, next) => {
  const { apiKey } = ctx.request.body

  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  if (typeof apiKey !== 'string') {
    ctx.status = 422
    ctx.body = 'Invalid apiKey'
    return
  }

  try {
    const q = squel.update()
      .table('providers')
      .set('prefs', squel.select()
        .field(`json_set(prefs, '$.apiKey', '${apiKey}')`)
        .from('providers')
        .where('name = ?', 'youtube')
      )
      .where('name = ?', 'youtube')

    const { text, values } = q.toParam()
    await db.run(text, values)
    ctx.status = 200
  } catch (err) {
    ctx.status = 500
    ctx.body = err
  }
})

// add channel
router.post('/channel', async (ctx, next) => {
  const name = ctx.request.body.channel
  let channels

  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  if (typeof name !== 'string' || !name.trim()) {
    ctx.status = 422
    ctx.body = 'Invalid channel name'
    return
  }

  // is channel already added?
  try {
    const res = await getProviders()
    channels = res.entities.youtube.prefs.channels || []
  } catch (err) {
    return Promise.reject(err)
  }

  if (channels.some(c => c.toLowerCase() === name.toLowerCase())) {
    ctx.status = 500
    ctx.body = 'Channel has already been added'
    return
  }

  // add channel
  channels.push(name.trim())

  try {
    await setChannels(channels)
    ctx.status = 200
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
  }
})

// remove channel
router.delete('/channel/:name', async (ctx, next) => {
  const { name } = ctx.params
  let channels

  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  // required
  if (!name) {
    ctx.status = 422
    ctx.body = `Invalid channel name`
    return
  }

  try {
    const res = await getProviders()
    channels = res.entities.youtube.prefs.channels || []
  } catch (err) {
    return Promise.reject(err)
  }

  // update paths
  channels.splice(channels.indexOf(name), 1)

  try {
    await setChannels(channels)
    ctx.status = 200
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
  }
})

module.exports = router

async function setChannels (channels) {
  try {
    const q = squel.update()
      .table('providers')
      .set('prefs', squel.select()
        .field(`json_set(prefs, '$.channels', json('${JSON.stringify(channels)}'))`)
        .from('providers')
        .where('name = ?', 'youtube')
      )
      .where('name = ?', 'youtube')

    const { text, values } = q.toParam()
    await db.run(text, values)
    return Promise.resolve()
  } catch (err) {
    return Promise.reject(err)
  }
}

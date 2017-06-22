const path = require('path')
const debug = require('debug')
const log = debug('app:provider:cdg')
const getFolders = require('../../../lib/thunks/getFolders')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api/provider/cdg' })

router.get('/ls', async (ctx, next) => {
  // check jwt validity
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  const dir = decodeURIComponent(ctx.query.dir)
  const current = path.resolve(dir)
  const parent = path.resolve(dir, '../')

  try {
    const list = await getFolders(dir)
    const children = list.map(d => {
      return {
        path: d,
        displayPath: d.replace(current + path.sep, '')
      }
    })

    log('%s listed folder %s', ctx.user.name, current)

    ctx.body = {
      current,
      // if at root, parent and current are the same
      parent: parent === current ? false : parent,
      // don't show hidden folders
      children: children.filter(c => !c.displayPath.startsWith('.')),
    }
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
  }
})

module.exports = router

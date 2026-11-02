import KoaRouter from '@koa/router'
import getLogger from '../lib/Log.js'
import Providers, { normalizeProviderUrl } from './Providers.js'

interface RequestWithBody {
  body: Record<string, unknown>
}

const log = getLogger('Providers')
const router = new KoaRouter({ prefix: '/api/providers' })

router.post('/', async (ctx) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const { url, apiKey } = (ctx.request as unknown as RequestWithBody).body

  if (typeof url !== 'string' || !normalizeProviderUrl(url)) {
    ctx.throw(422, 'Invalid url')
    return
  }

  log.verbose('%s probing provider: %s', ctx.user.name, url)
  ctx.body = await Providers.probe(normalizeProviderUrl(url), apiKey as string | undefined)
})

export default router

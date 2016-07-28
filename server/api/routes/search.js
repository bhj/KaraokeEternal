import KoaRouter from 'koa-router'
let router = KoaRouter()

// list all artists
router.get('/api/search', async (ctx, next) => {
  let query = ctx.params.query

  let rows = await ctx.db.all('SELECT artists.*, COUNT(songs.artistId) AS count FROM artists JOIN songs USING(artistId) GROUP BY artistId ORDER BY artists.name')

  // normalize
  let result = []
  let entities = {}

  rows.forEach(function(row){
    result.push(row.id) // artists.id
    entities[row.id] = row
  })

  log('Responding with %s artists', result.length)
  ctx.body = {result, entities}
})

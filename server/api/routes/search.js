import KoaRouter from 'koa-router'
let router = KoaRouter()

// list all artists
router.get('/api/search', async (ctx, next) => {
  let query = ctx.params.query

  let rows = await ctx.db.all('SELECT artists.*, COUNT(songs.artist_id) AS count FROM artists JOIN songs ON artists.id = songs.artist_id GROUP BY artist_id ORDER BY artists.name')

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

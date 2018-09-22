const db = require('sqlite')
const squel = require('squel')
const jwtSign = require('jsonwebtoken').sign
const bcrypt = require('../lib/bcrypt')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api' })
const Prefs = require('../Prefs')

// login
router.post('/login', async (ctx, next) => {
  await _login(ctx, ctx.request.body)
})

// logout
router.get('/logout', async (ctx, next) => {
  // @todo force socket room leave
  ctx.cookies.set('kfToken', '')
  ctx.status = 200
  ctx.body = {}
})

// create
router.post('/account', async (ctx, next) => {
  const { name, username, newPassword, newPasswordConfirm, roomId } = ctx.request.body

  // check presence of all fields
  if (!name || !username || !newPassword || !newPasswordConfirm) {
    ctx.throw(422, 'All fields are required')
  }

  {
    // check for duplicate username
    const q = squel.select()
      .from('users')
      .where('username = ?', username.trim())

    const { text, values } = q.toParam()

    if (await db.get(text, values)) {
      ctx.throw(401, 'Username already exists')
    }
  }

  // check that passwords match
  if (newPassword !== newPasswordConfirm) {
    ctx.throw(422, 'Passwords do not match')
  }

  {
    // insert user
    const q = squel.insert()
      .into('users')
      .set('username', username.trim())
      .set('password', await bcrypt.hash(newPassword, 12))
      .set('name', name.trim())
      .set('isAdmin', 0)

    const { text, values } = q.toParam()
    await db.run(text, values)
  }

  // log them in automatically
  await _login(ctx, { username, password: newPassword, roomId })
})

// first-time setup
router.post('/setup', async (ctx, next) => {
  const { name, username, newPassword, newPasswordConfirm } = ctx.request.body
  let roomId

  // must be first run
  const prefs = await Prefs.get()

  if (prefs.isFirstRun !== true) {
    ctx.throw(403)
  }

  // check presence of all fields
  if (!name || !username || !newPassword || !newPasswordConfirm) {
    ctx.throw(422, 'All fields are required')
  }

  // check that passwords match
  if (newPassword !== newPasswordConfirm) {
    ctx.throw(422, 'Passwords do not match')
  }

  // create admin user
  {
    const q = squel.insert()
      .into('users')
      .set('username', username.trim())
      .set('password', await bcrypt.hash(newPassword, 12))
      .set('name', name.trim())
      .set('isAdmin', 1)

    const { text, values } = q.toParam()
    await db.run(text, values)
  }

  // create default room
  {
    const q = squel.insert()
      .into('rooms')
      .set('name', 'Room 1')
      .set('status', 'open')
      .set('dateCreated', Math.floor(Date.now() / 1000))

    const { text, values } = q.toParam()
    const res = await db.run(text, values)

    // sign in to room
    roomId = res.stmt.lastID
  }

  // unset isFirstRun
  {
    const q = squel.update()
      .table('prefs')
      .where('key = ?', 'isFirstRun')
      .set('data', squel.select().field(`json('false')`))

    const { text, values } = q.toParam()
    await db.run(text, values)
  }

  await _login(ctx, { username, password: newPassword, roomId })
})

// update account
router.put('/account', async (ctx, next) => {
  let user

  // find user by id (from token)
  {
    const q = squel.select()
      .from('users')
      .where('userId = ?', ctx.user.userId)

    const { text, values } = q.toParam()
    user = await db.get(text, values)
  }

  if (!user) {
    ctx.throw(401)
  }

  let { name, username, password, newPassword, newPasswordConfirm } = ctx.request.body

  // check presence of required fields
  if (!name || !username || !password) {
    ctx.throw(422, 'Name, username and current password are required')
  }

  // validate current password
  if (!await bcrypt.compare(password, user.password)) {
    ctx.throw(401, 'Current password is incorrect')
  }

  // check for duplicate username
  {
    const q = squel.select()
      .from('users')
      .where('userId != ?', ctx.user.userId)
      .where('username = ?', username.trim())

    const { text, values } = q.toParam()

    if (await db.get(text, values)) {
      ctx.throw(401, 'Username already exists')
    }
  }

  // begin update query
  const q = squel.update()
    .table('users')
    .where('userId = ?', ctx.user.userId)
    .set('name', name.trim())
    .set('username', username.trim())

  // changing password?
  if (newPassword) {
    if (newPassword !== newPasswordConfirm) {
      ctx.throw(422, 'New passwords do not match')
    }

    q.set('password', await bcrypt.hash(newPassword, 10))
    password = newPassword
  }

  const { text, values } = q.toParam()
  await db.run(text, values)

  // login again
  await _login(ctx, { username, password, roomId: ctx.user.roomId })
})

module.exports = router

async function _login (ctx, creds) {
  const { username, password, roomId } = creds

  if (!username || !password) {
    ctx.throw(422, 'Username/email and password are required')
  }

  // get user
  const q = squel.select()
    .from('users')
    .where('username = ?', username.trim())

  const { text, values } = q.toParam()
  const user = await db.get(text, values)

  if (!user) {
    ctx.throw(401)
  }

  // validate password
  if (!await bcrypt.compare(password, user.password)) {
    ctx.throw(401)
  }

  // client expects boolean
  user.isAdmin = user.isAdmin === 1

  // don't want this in the response
  delete user.password

  // validate roomId (if not an admin)
  if (!user.isAdmin) {
    if (!roomId) {
      ctx.throw(422, 'Please select a room')
    }

    const q = squel.select()
      .from('rooms')
      .where('roomId = ?', roomId)

    const { text, values } = q.toParam()
    const row = await db.get(text, values)

    if (!row) ctx.throw(401, 'Invalid roomId')
    if (row.status !== 'open') ctx.throw(401, 'Room is no longer open')

    user.roomId = row.roomId
  }

  // encrypt JWT based on subset of user object
  const token = jwtSign({
    userId: user.userId,
    isAdmin: user.isAdmin, // used by client for display purposes only
    name: user.name,
    roomId: user.roomId,
  }, ctx.jwtKey)

  // set JWT as an httpOnly cookie
  ctx.cookies.set('kfToken', token, {
    httpOnly: true,
  })

  ctx.body = user
}

const { promisify } = require('util')
const fs = require('fs')
const readFile = promisify(fs.readFile)
const deleteFile = promisify(fs.unlink)
const db = require('sqlite')
const squel = require('squel')
const jwtSign = require('jsonwebtoken').sign
const bcrypt = require('../lib/bcrypt')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api' })
const Prefs = require('../Prefs')
const Queue = require('../Queue')
const User = require('../User')
const {
  QUEUE_PUSH,
} = require('../../shared/actionTypes')

// user images are stored as binary blobs
squel.registerValueHandler(Buffer, buffer => buffer)

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

  // required fields
  if (!name || !username || !newPassword || !newPasswordConfirm) {
    ctx.throw(422, 'All fields are required')
  }

  {
    // check for duplicate username
    const user = await User.getByUsername(username.trim())

    if (user) {
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
      .set('dateCreated', Math.floor(Date.now() / 1000))

    // user image?
    if (ctx.request.files.image) {
      q.set('image', await readFile(ctx.request.files.image.path))
      await deleteFile(ctx.request.files.image.path)
    }

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
      .set('dateCreated', Math.floor(Date.now() / 1000))

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
      .set('data', squel.select().field('json(\'false\')'))

    const { text, values } = q.toParam()
    await db.run(text, values)
  }

  await _login(ctx, { username, password: newPassword, roomId })
})

// update account
router.put('/account', async (ctx, next) => {
  const user = await User.getById(ctx.user.userId, true)

  if (!user) {
    ctx.throw(401)
  }

  let { name, username, password, newPassword, newPasswordConfirm } = ctx.request.body

  // validate current password
  if (!password) {
    ctx.throw(422, 'Current password is required')
  }

  if (!await bcrypt.compare(password, user.password)) {
    ctx.throw(401, 'Current password is incorrect')
  }

  // begin query
  const q = squel.update()
    .table('users')
    .where('userId = ?', ctx.user.userId)

  if (name && name.trim()) {
    // @todo check length
    q.set('name', name.trim())
  }

  // changing username?
  if (username && username.trim()) {
    // check for duplicate
    if (await User.getByUsername(username.trim())) {
      ctx.throw(401, 'Username or email is not available')
    }

    // @todo check length
    q.set('username', username.trim())
  } else {
    // use current username to log in
    username = user.username
  }

  // changing password?
  if (newPassword) {
    // @todo check length
    if (newPassword !== newPasswordConfirm) {
      ctx.throw(422, 'New passwords do not match')
    }

    q.set('password', await bcrypt.hash(newPassword, 10))
    password = newPassword
  }

  // changing user image?
  if (ctx.request.files.image) {
    q.set('image', await readFile(ctx.request.files.image.path))
    await deleteFile(ctx.request.files.image.path)
  } else if (ctx.request.body.image === 'null') {
    q.set('image', null)
  }

  q.set('dateUpdated', Math.floor(Date.now() / 1000))

  const { text, values } = q.toParam()
  await db.run(text, values)

  // notify room?
  if (ctx.user.roomId) {
    ctx.io.to(ctx.user.roomId).emit('action', {
      type: QUEUE_PUSH,
      payload: await Queue.get(ctx.user.roomId)
    })
  }

  // get updated token
  await _login(ctx, { username, password, roomId: ctx.user.roomId })
})

// get own account (helps sync account changes across devices)
router.get('/user', async (ctx, next) => {
  if (typeof ctx.user.userId !== 'number') {
    ctx.throw(401)
  }

  const user = await User.getById(ctx.user.userId)

  if (!user) {
    ctx.throw(404)
  }

  // no need to include in response
  delete user.image

  ctx.body = user
})

// get a user's image
router.get('/user/image/:userId', async (ctx, next) => {
  const userId = parseInt(ctx.params.userId, 10)
  const user = await User.getById(userId)

  if (!user || !user.image) {
    ctx.throw(404)
  }

  if (typeof ctx.query.v !== 'undefined') {
    // client can cache a versioned image forever
    ctx.set('Cache-Control', 'max-age=31536000') // 1 year
  }

  ctx.type = 'image/jpeg'
  ctx.body = user.image
})

module.exports = router

async function _login (ctx, creds) {
  const { username, password, roomId } = creds

  if (!username || !password) {
    ctx.throw(422, 'Username/email and password are required')
  }

  const user = await User.getByUsername(username, true)

  if (!user) {
    ctx.throw(401)
  }

  // validate password
  if (!await bcrypt.compare(password, user.password)) {
    ctx.throw(401)
  }

  // don't want these in the response
  delete user.password
  delete user.image

  // roomId is required if not an admin
  if (!roomId && !user.isAdmin) {
    ctx.throw(422, 'Please select a room')
  }

  // validate roomId
  if (roomId) {
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
    isAdmin: user.isAdmin,
    name: user.name,
    roomId: user.roomId,
  }, ctx.jwtKey)

  // set JWT as an httpOnly cookie
  ctx.cookies.set('kfToken', token, {
    httpOnly: true,
  })

  ctx.body = user
}

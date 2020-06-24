const { promisify } = require('util')
const fs = require('fs')
const readFile = promisify(fs.readFile)
const deleteFile = promisify(fs.unlink)
const db = require('sqlite')
const sql = require('sqlate')
const jwtSign = require('jsonwebtoken').sign
const bcrypt = require('../lib/bcrypt')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api' })
const Prefs = require('../Prefs')
const Queue = require('../Queue')
const Rooms = require('../Rooms')
const User = require('../User')
const {
  QUEUE_PUSH,
} = require('../../shared/actionTypes')

const BCRYPT_ROUNDS = 12
const USERNAME_MIN_LENGTH = 3
const USERNAME_MAX_LENGTH = 128
const PASSWORD_MIN_LENGTH = 6
const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 50
const IMG_MAX_LENGTH = 50000 // bytes

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
    ctx.throw(401, 'Incorrect current password')
  }

  // validated
  const fields = new Map()

  // changing username?
  if (username) {
    username = username.trim()

    if (username.lenth < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
      ctx.throw(400, `Username or email must have ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters`)
    }

    // check for duplicate
    if (await User.getByUsername(username)) {
      ctx.throw(409, 'Username or email is not available')
    }

    fields.set('username', username)
  }

  // changing display name?
  if (name) {
    name = name.trim()

    if (name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH) {
      ctx.throw(400, `Display name must have ${NAME_MIN_LENGTH}-${NAME_MAX_LENGTH} characters`)
    }

    fields.set('name', name)
  }

  // changing password?
  if (newPassword) {
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      ctx.throw(400, `Password must have at least ${PASSWORD_MIN_LENGTH} characters`)
    }

    if (newPassword !== newPasswordConfirm) {
      ctx.throw(422, 'New passwords do not match')
    }

    fields.set('password', await bcrypt.hash(newPassword, BCRYPT_ROUNDS))
  }

  // changing user image?
  if (ctx.request.files.image) {
    fields.set('image', await readFile(ctx.request.files.image.path))
    await deleteFile(ctx.request.files.image.path)
  } else if (ctx.request.body.image === 'null') {
    fields.set('image', null)
  }

  fields.set('dateUpdated', Math.floor(Date.now() / 1000))

  const query = sql`
    UPDATE users
    SET ${sql.tuple(Array.from(fields.keys()).map(sql.column))} = ${sql.tuple(Array.from(fields.values()))}
    WHERE userId = ${ctx.user.userId}
  `
  await db.run(String(query), query.parameters)

  // notify room?
  if (ctx.user.roomId) {
    ctx.io.to(Rooms.prefix(ctx.user.roomId)).emit('action', {
      type: QUEUE_PUSH,
      payload: await Queue.get(ctx.user.roomId)
    })
  }

  // get updated token
  await _login(ctx, {
    username: username || user.username,
    password: newPassword || password,
    roomId: ctx.user.roomId || null,
  })
})

// create account
router.post('/account', async (ctx, next) => {
  // validate room info first
  const { roomId, roomPassword } = ctx.request.body

  try {
    await Rooms.validate(roomId, roomPassword)
  } catch (err) {
    ctx.throw(401, err.message)
  }

  // create user
  const creds = await _create(ctx, false) // non-admin

  // log them in automatically
  await _login(ctx, { ...creds, roomId, roomPassword })
})

// first-time setup
router.post('/setup', async (ctx, next) => {
  // must be first run
  const prefs = await Prefs.get()

  if (prefs.isFirstRun !== true) {
    ctx.throw(403)
  }

  // create admin user
  const creds = await _create(ctx, true)

  // create default room
  const fields = new Map()
  fields.set('name', 'Room 1')
  fields.set('status', 'open')
  fields.set('dateCreated', Math.floor(Date.now() / 1000))

  const query = sql`
    INSERT INTO rooms ${sql.tuple(Array.from(fields.keys()).map(sql.column))}
    VALUES ${sql.tuple(Array.from(fields.values()))}
  `
  const res = await db.run(String(query), query.parameters)

  // sign in to the new room
  creds.roomId = res.stmt.lastID

  // unset isFirstRun
  {
    const query = sql`
      UPDATE prefs
      SET data = 'false'
      WHERE key = 'isFirstRun'
    `
    await db.run(String(query))
  }

  await _login(ctx, creds)
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

async function _create (ctx, isAdmin = 0) {
  let { name, username, newPassword, newPasswordConfirm } = ctx.request.body

  if (!username || !name || !newPassword || !newPasswordConfirm) {
    ctx.throw(422, 'All fields are required')
  }

  username = username.trim()
  name = name.trim()

  if (username.lenth < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
    ctx.throw(400, `Username or email must have ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters`)
  }

  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    ctx.throw(400, `Password must have at least ${PASSWORD_MIN_LENGTH} characters`)
  }

  if (name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH) {
    ctx.throw(400, `Display name must have ${NAME_MIN_LENGTH}-${NAME_MAX_LENGTH} characters`)
  }

  if (newPassword !== newPasswordConfirm) {
    ctx.throw(422, 'New passwords do not match')
  }

  // check for duplicate username
  if (await User.getByUsername(username)) {
    ctx.throw(409, 'Username or email is not available')
  }

  const fields = new Map()
  fields.set('username', username)
  fields.set('password', await bcrypt.hash(newPassword, BCRYPT_ROUNDS))
  fields.set('name', name)
  fields.set('dateCreated', Math.floor(Date.now() / 1000))
  fields.set('isAdmin', isAdmin)

  // user image?
  if (ctx.request.files.image) {
    const img = await readFile(ctx.request.files.image.path)
    await deleteFile(ctx.request.files.image.path)

    // client should resize before uploading to be
    // well below this limit, but just in case...
    if (img.length > IMG_MAX_LENGTH) {
      ctx.throw(413, 'Invalid image')
    }

    fields.set('image', img)
  }

  const query = sql`
    INSERT INTO users ${sql.tuple(Array.from(fields.keys()).map(sql.column))}
    VALUES ${sql.tuple(Array.from(fields.values()))}
  `

  await db.run(String(query), query.parameters)

  // success! return the (cleaned) credentials for sign-in
  return {
    username,
    password: newPassword,
  }
}

async function _login (ctx, creds) {
  const { username, password, roomPassword } = creds
  const roomId = parseInt(creds.roomId, 10) || undefined

  if (!username || !password) {
    ctx.throw(422, 'Username/email and password are required')
  }

  const user = await User.getByUsername(username, true)

  if (!user || !await bcrypt.compare(password, user.password)) {
    ctx.throw(401, 'Incorrect username/email or password')
  }

  if (roomId) {
    try {
      // admins can sign in to closed rooms
      await Rooms.validate(roomId, roomPassword, { isOpen: !user.isAdmin })
    } catch (err) {
      ctx.throw(401, err.message)
    }
  } else if (!user.isAdmin) {
    ctx.throw(422, 'Please select a room')
  }

  user.roomId = roomId

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

  // don't want these in the response
  delete user.password
  delete user.image

  ctx.body = user
}

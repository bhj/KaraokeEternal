const { promisify } = require('util')
const fs = require('fs')
const readFile = promisify(fs.readFile)
const deleteFile = promisify(fs.unlink)
const db = require('../lib/Database').db
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

// list all users (admin only)
router.get('/users', async (ctx, next) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const userRooms = {} // { userId: [roomId, roomId, ...]}

  for (const s of ctx.io.of('/').sockets.values()) {
    if (s.user && typeof s.user.roomId === 'number') {
      if (userRooms[s.user.userId]) {
        userRooms[s.user.userId].push(s.user.roomId)
      } else {
        userRooms[s.user.userId] = [s.user.roomId]
      }
    }
  }

  // get all users
  const users = await User.get()

  users.result.forEach(userId => {
    users.entities[userId].rooms = userRooms[userId] || []
  })

  ctx.body = users
})

// delete a user (admin only)
router.delete('/user/:userId', async (ctx, next) => {
  const targetId = parseInt(ctx.params.userId, 10)

  if (!ctx.user.isAdmin || targetId === ctx.user.userId) {
    ctx.throw(403)
  }

  await User.remove(targetId)

  // disconnect their socket session(s)
  for (const s of ctx.io.of('/').sockets.values()) {
    if (s.user && s.user.userId === targetId) {
      s.disconnect()
    }
  }

  // emit (potentially) updated queues to each room
  for (const room of ctx.io.sockets.adapter.rooms.keys()) {
    // ignore auto-generated per-user rooms
    if (room.startsWith(Rooms.prefix())) {
      const roomId = parseInt(room.substring(Rooms.prefix().length), 10)

      ctx.io.to(room).emit('action', {
        type: QUEUE_PUSH,
        payload: await Queue.get(roomId),
      })
    }
  }

  // success
  ctx.status = 200
  ctx.body = {}
})

// update a user account
router.put('/user/:userId', async (ctx, next) => {
  const prefs = await Prefs.get()
  const targetId = parseInt(ctx.params.userId, 10)
  const user = await User.getById(ctx.user.userId, true)
  const updatingUser = await User.getById(targetId, true)

  if (!updatingUser) {
    ctx.throw(404, `userId ${targetId} not found`)
  }

  // must be admin if updating another user
  if (!user || (targetId !== user.userId && !user.isAdmin)) {
    ctx.throw(401)
  }

  let { name, username, password, newPassword, newPasswordConfirm } = ctx.request.body

  // if username is not required, default to the display name if it's being updated...
  if (!prefs.isUsernameRequired && !username && name && name.trim() !== updatingUser.name) {
    username = name
  }

  // validate current password if updating own password-protected account
  if (targetId === user.userId && user.password !== '') {
    if (!password) {
      ctx.throw(422, 'Current password is required')
    }

    if (!await bcrypt.compare(password, user.password)) {
      ctx.throw(401, 'Incorrect current password')
    }
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

  // changing role?
  if (ctx.request.body.role) {
    // @todo since we're not ensuring there'd be at least one admin
    // remaining, changing one's own role is currently disallowed
    if (!user.isAdmin || targetId === user.userId) {
      ctx.throw(403)
    }

    // if changing to an admin, require a password...
    if (parseInt(ctx.request.body.role, 10)) {
      if (!newPassword && updatingUser.password === '') {
        ctx.throw(400, 'Administrators need a password')
      }
    }

    fields.set('isAdmin', parseInt(ctx.request.body.role, 10))
  }

  fields.set('dateUpdated', Math.floor(Date.now() / 1000))

  const query = sql`
    UPDATE users
    SET ${sql.tuple(Array.from(fields.keys()).map(sql.column))} = ${sql.tuple(Array.from(fields.values()))}
    WHERE userId = ${targetId}
  `
  const res = await db.run(String(query), query.parameters)

  if (!res.changes) {
    ctx.throw(404, `userId ${targetId} not found`)
  }

  // emit (potentially) updated queues to each room
  for (const room of ctx.io.sockets.adapter.rooms.keys()) {
    // ignore auto-generated per-user rooms
    if (room.startsWith(Rooms.prefix())) {
      const roomId = parseInt(room.substring(Rooms.prefix().length), 10)

      ctx.io.to(room).emit('action', {
        type: QUEUE_PUSH,
        payload: await Queue.get(roomId),
      })
    }
  }

  // we're done if updating another account
  if (targetId !== user.userId) {
    ctx.status = 200
    ctx.body = {}
    return
  }

  // send updated token if updating own account
  await _login(ctx, {
    username: username || user.username,
    password: newPassword || password,
    roomId: ctx.user.roomId || null,
  }, false) // don't require room password to update account
})

// create account
router.post('/user', async (ctx, next) => {
  if (!ctx.user.isAdmin) {
    // already signed in as non-admin?
    if (ctx.user.userId !== null) {
      ctx.throw(403, 'You are already signed in')
    }

    // trying to specify a role?
    if (ctx.request.body.role) {
      ctx.throw(403)
    }

    // new users must choose a room at the same time
    try {
      await Rooms.validate(ctx.request.body.roomId, ctx.request.body.roomPassword)
    } catch (err) {
      ctx.throw(401, err.message)
    }
  }

  // create user
  const userData = await _create(ctx, ctx.request.body.role === '1')

  // success
  ctx.status = 200
  ctx.body = userData
})

// first-time setup
router.post('/setup', async (ctx, next) => {
  // must be first run
  const prefs = await Prefs.get()

  if (prefs.isFirstRun !== true) {
    ctx.throw(403)
  }

  // create admin user
  const userData = await _create(ctx, true)

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

  if (typeof res.lastID !== 'number') {
    ctx.throw(500, 'Invalid default room lastID')
  }

  // unset isFirstRun
  {
    const query = sql`
      UPDATE prefs
      SET data = 'false'
      WHERE key = 'isFirstRun'
    `
    await db.run(String(query))
  }

  // success
  ctx.status = 200
  ctx.body = userData
  ctx.body.roomId = res.lastID
})

// get a user's image
router.get('/user/:userId/image', async (ctx, next) => {
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

async function _create (ctx, isAdmin = false) {
  const prefs = await Prefs.get()
  const passwordRequired = isAdmin || prefs.isPasswordRequired
  let { name, username, newPassword, newPasswordConfirm } = ctx.request.body

  // if username is not required, default to the display name...
  if (!prefs.isUsernameRequired && !username) username = name

  if (!name) ctx.throw(422, 'Display name is required')
  if (!username) ctx.throw(422, 'Username is required')
  if (passwordRequired && !newPassword) ctx.throw(422, 'Password is required')
  if (passwordRequired && !newPasswordConfirm) ctx.throw(422, 'Password confirmation is required')

  username = username.trim()
  name = name.trim()

  if (username.lenth < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
    ctx.throw(400, `Username or email must have ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters`)
  }

  if (passwordRequired && newPassword.length < PASSWORD_MIN_LENGTH) {
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

  let passwordHash = ''
  if (newPassword !== undefined) passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)

  const fields = new Map()
  fields.set('username', username)
  fields.set('password', passwordHash)
  fields.set('name', name)
  fields.set('dateCreated', Math.floor(Date.now() / 1000))
  fields.set('isAdmin', isAdmin ? 1 : 0)

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

  return { name, username }
}

async function _login (ctx, creds, validateRoomPassword = true) {
  const prefs = await Prefs.get()
  const { username, password, roomPassword } = creds
  const roomId = parseInt(creds.roomId, 10) || null

  if (!username) ctx.throw(422, 'Username is required')
  if (prefs.isPasswordRequired && !password) ctx.throw(422, 'Password is required')

  const user = await User.getByUsername(username, true)

  if (!user || (user.password !== '' && !await bcrypt.compare(password, user.password))) {
    ctx.throw(401, 'Incorrect username/email or password')
  }

  if (roomId) {
    try {
      // admins can sign in to closed rooms
      await Rooms.validate(roomId, roomPassword, {
        isOpen: !user.isAdmin,
        validatePassword: validateRoomPassword,
      })
    } catch (err) {
      ctx.throw(401, err.message)
    }
  } else if (!user.isAdmin) {
    ctx.throw(422, 'Please select a room')
  }

  user.roomId = roomId

  // encrypt JWT based on subset of user object
  const token = jwtSign({
    dateUpdated: user.dateUpdated,
    isAdmin: user.isAdmin,
    name: user.name,
    roomId: user.roomId,
    userId: user.userId,
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

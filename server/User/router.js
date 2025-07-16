import { promisify } from 'util'
import fs from 'fs'
import Database from '../lib/Database.js'
import sql from 'sqlate'
import jsonWebToken from 'jsonwebtoken'
import bcrypt from '../lib/bcrypt.js'
import KoaRouter from '@koa/router'
import Prefs from '../Prefs/Prefs.js'
import Queue from '../Queue/Queue.js'
import Rooms from '../Rooms/Rooms.js'
import User from '../User/User.js'
import { QUEUE_PUSH } from '../../shared/actionTypes.ts'
import { BCRYPT_ROUNDS, USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH, PASSWORD_MIN_LENGTH, NAME_MIN_LENGTH, NAME_MAX_LENGTH } from './User.js'

const router = new KoaRouter({ prefix: '/api' })
const { db } = Database
const readFile = promisify(fs.readFile)
const deleteFile = promisify(fs.unlink)
const { sign: jwtSign } = jsonWebToken

// Takes the "raw" object returned by the User class and massages it
// into the shape used by the client (state.user) and in server-side
// routers. Should be used to generate the JWT.
const createUserCtx = (user, roomId) => {
  return {
    dateCreated: user.dateCreated,
    dateUpdated: user.dateUpdated,
    isAdmin: user.role === 'admin',
    isGuest: user.role === 'guest',
    name: user.name,
    roomId: parseInt(roomId, 10) || null,
    userId: user.userId,
    username: user.username,
  }
}

// login
router.post('/login', async (ctx) => {
  const roomId = parseInt(ctx.request.body.roomId, 10) || null
  let user

  try {
    user = await User.validate(ctx.request.body)

    if (roomId) {
      await Rooms.validate(roomId, ctx.request.body.roomPassword, {
        isOpen: user.role !== 'admin', // admins can sign in to closed rooms
        validatePassword: true,
      })
    } else if (user.role !== 'admin') {
      ctx.throw(401, 'Please select a room')
    }
  } catch (err) {
    ctx.throw(401, err.message)
  }

  const userCtx = createUserCtx(user, roomId)

  // create JWT
  const token = jwtSign(userCtx, ctx.jwtKey)

  // set JWT as an httpOnly cookie
  ctx.cookies.set('keToken', token, {
    httpOnly: true,
  })

  ctx.body = userCtx
})

// logout
router.get('/logout', async (ctx) => {
  // @todo force socket room leave
  ctx.cookies.set('keToken', '')
  ctx.status = 200
  ctx.body = {}
})

// get own account (helps sync account changes across devices)
router.get('/user', async (ctx) => {
  if (typeof ctx.user.userId !== 'number') {
    ctx.throw(401)
  }

  // include credentials since their username may have changed
  const user = await User.getById(ctx.user.userId, true)

  if (!user) {
    ctx.throw(404)
  }

  ctx.body = createUserCtx(user, ctx.user.roomId)
})

// list all users (admin only)
router.get('/users', async (ctx) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const userRooms = {} // { userId: [roomId, roomId, ...]}
  const sockets = await ctx.io.fetchSockets()

  for (const s of sockets) {
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

  users.result.forEach((userId) => {
    users.entities[userId].rooms = userRooms[userId] || []
  })

  ctx.body = users
})

// delete a user (admin only)
router.delete('/user/:userId', async (ctx) => {
  const targetId = parseInt(ctx.params.userId, 10)

  if (!ctx.user.isAdmin || targetId === ctx.user.userId) {
    ctx.throw(403)
  }

  await User.remove(targetId)

  // disconnect their socket session(s)
  const sockets = await ctx.io.fetchSockets()

  for (const s of sockets) {
    if (s?.user.userId === targetId) {
      s.disconnect()
    }
  }

  // emit (potentially) updated queues to each room
  for (const { room, roomId } of Rooms.getActive(ctx.io)) {
    ctx.io.to(room).emit('action', {
      type: QUEUE_PUSH,
      payload: await Queue.get(roomId),
    })
  }

  // success
  ctx.status = 200
  ctx.body = {}
})

// update a user account
router.put('/user/:userId', async (ctx) => {
  const targetId = parseInt(ctx.params.userId, 10)
  const user = await User.getById(ctx.user.userId, true)

  // must be admin if updating another user
  if (!user || (targetId !== user.userId && user.role !== 'admin')) {
    ctx.throw(401)
  }

  let { name, username, password, newPassword, newPasswordConfirm } = ctx.request.body

  // validate current password if updating own account
  if (targetId === user.userId && !ctx.user.isGuest) {
    if (!password) {
      ctx.throw(422, 'Current password is required')
    }

    if (!(await bcrypt.compare(password, user.password))) {
      ctx.throw(401, 'Incorrect current password')
    }
  }

  // validated
  const fields = new Map()

  // changing username?
  if (username && !ctx.user.isGuest) {
    username = username.trim()

    if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
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
  if (newPassword && !ctx.user.isGuest) {
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
    fields.set('image', await readFile(ctx.request.files.image.filepath))
    await deleteFile(ctx.request.files.image.filepath)
  } else if (ctx.request.body.image === 'null') {
    fields.set('image', null)
  }

  // changing role?
  if (ctx.request.body.role) {
    // @todo since we're not ensuring there'd be at least one admin
    // remaining, changing one's own role is currently disallowed
    if (user.role !== 'admin' || targetId === user.userId) {
      ctx.throw(403)
    }

    fields.set('roleId', sql`(SELECT roleId FROM roles WHERE name = ${ctx.request.body.role})`)
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
  // @todo: only update rooms the user is in
  for (const { room, roomId } of Rooms.getActive(ctx.io)) {
    ctx.io.to(room).emit('action', {
      type: QUEUE_PUSH,
      payload: await Queue.get(roomId),
    })
  }

  // updating another account? we're done
  if (targetId !== user.userId) {
    ctx.status = 200
    ctx.body = {}
    return
  }

  // updating own account: send updated token
  let updatedUser

  if (user.role !== 'guest') {
    try {
      updatedUser = await User.validate({
        username: username || user.username,
        password: newPassword || password,
      })
    } catch (err) {
      ctx.throw(401, err.message)
    }
  } else {
    updatedUser = {
      ...user,
      name: name || user.name,
    }
  }

  const userCtx = createUserCtx(updatedUser, ctx.user.roomId || null)

  // create JWT
  // @todo: this should not extend the JWT expiry date
  const token = jwtSign(userCtx, ctx.jwtKey)

  // set JWT as an httpOnly cookie
  ctx.cookies.set('keToken', token, {
    httpOnly: true,
  })

  ctx.body = userCtx
})

// create account
router.post('/user', async (ctx) => {
  let image

  if (!ctx.user.isAdmin) {
    // already signed in?
    if (ctx.user.userId !== null) {
      ctx.throw(401, 'You are already signed in')
    }

    // only possible roles; further validated per-room below
    if (!['guest', 'standard'].includes(ctx.request.body.role)) {
      ctx.throw(401, 'Invalid role')
    }

    // new users must choose a room at the same time
    try {
      await Rooms.validate(
        ctx.request.body.roomId,
        ctx.request.body.roomPassword,
        { role: ctx.request.body.role },
      )
    } catch (err) {
      ctx.throw(401, err.message)
    }
  }

  if (ctx.request.files.image) {
    image = await readFile(ctx.request.files.image.filepath)
    await deleteFile(ctx.request.files.image.filepath)
  }

  // create user
  try {
    const userId = await User.create({ ...ctx.request.body, image }, ctx.request.body.role)
    const user = await User.getById(userId, true)
    const userCtx = createUserCtx(user, ctx.request.body.roomId || null)

    // create JWT
    const token = jwtSign(userCtx, ctx.jwtKey)

    // set JWT as an httpOnly cookie
    ctx.cookies.set('keToken', token, {
      httpOnly: true,
    })

    ctx.body = userCtx
  } catch (err) {
    ctx.throw(403, err.message)
  }
})

// first-time setup
router.post('/setup', async (ctx) => {
  const prefs = await Prefs.get()
  let image

  // must be first run
  if (prefs.isFirstRun !== true) {
    ctx.throw(403)
  }

  // create admin user
  try {
    await User.create({ ...ctx.request.body, image }, 'admin')
  } catch (err) {
    ctx.throw(403, err.message)
  }

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
  ctx.body = {
    roomId: res.lastID,
  }
})

// get a user's image
router.get('/user/:userId/image', async (ctx) => {
  const targetId = parseInt(ctx.params.userId, 10)

  if (ctx.user.userId !== targetId && !ctx.user.isAdmin) {
    // ensure users are in the same room
    const sockets = await ctx.io.in(Rooms.prefix(ctx.user.roomId)).fetchSockets()

    if (!sockets.some(s => s?.user && s?.user.userId === targetId)) {
      ctx.throw(403)
    }
  }

  const user = await User.getById(targetId)

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

export default router

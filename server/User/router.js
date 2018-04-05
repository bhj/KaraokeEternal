const db = require('sqlite')
const squel = require('squel')
const jwtSign = require('jsonwebtoken').sign
const bcrypt = require('./lib/bcrypt')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api' })
const debug = require('debug')
const log = debug('app:user')
const Prefs = require('../Prefs')

// login
router.post('/login', async (ctx, next) => {
  try {
    await _login(ctx, ctx.request.body)
  } catch (err) {
    log(err)
    ctx.status = 500
  }
})

// logout
router.get('/logout', async (ctx, next) => {
  // @todo force socket room leave
  ctx.cookies.set('id_token', '')
  ctx.status = 200
  ctx.body = {}
})

// create
router.post('/account', async (ctx, next) => {
  let { name, username, newPassword, newPasswordConfirm, roomId } = ctx.request.body

  // check presence of all fields
  if (!name || !username || !newPassword || !newPasswordConfirm) {
    ctx.status = 422
    ctx.body = 'All fields are required'
    return
  }

  // check for duplicate username
  try {
    const q = squel.select()
      .from('users')
      .where('username = ? COLLATE NOCASE', username.trim())

    const { text, values } = q.toParam()

    if (await db.get(text, values)) {
      ctx.status = 401
      ctx.body = 'Username already exists; please choose another'
      return
    }
  } catch (err) {
    log(err)
    ctx.status = 500
    return
  }

  // check that passwords match
  if (newPassword !== newPasswordConfirm) {
    ctx.status = 422
    ctx.body = 'Password fields do not match'
    return
  }

  try {
    const prefs = await Prefs.get()

    if (prefs.isFirstRun === true) {
      // create default room
      const q = squel.insert()
        .into('rooms')
        .set('name', 'Room 1')
        .set('status', 'open')
        .set('dateCreated', Math.floor(Date.now() / 1000))

      const { text, values } = q.toParam()
      const res = await db.run(text, values)

      roomId = res.stmt.lastID
    } else {
      // @todo: validate roomId
    }

    // hash new password
    const hashedPwd = await bcrypt.hash(newPassword, 12)

    // insert user
    const q = squel.insert()
      .into('users')
      .set('username', username.trim())
      .set('password', hashedPwd)
      .set('name', name.trim())
      .set('isAdmin', prefs.isFirstRun === true ? 1 : 0)

    const { text, values } = q.toParam()
    const res = await db.run(text, values)

    if (res.stmt.changes !== 1) {
      throw new Error('insert failed')
    }

    // remove isFirstRun flag if necessary
    if (prefs.isFirstRun === true) {
      const q = squel.update()
        .table('prefs')
        .where('key = ?', 'isFirstRun')
        .set('data', squel.select()
          .field(`json('false')`)
        )

      const { text, values } = q.toParam()
      const res = await db.run(text, values)

      if (res.stmt.changes !== 1) {
        throw new Error('could not set isFirstRun = false')
      }
    }
  } catch (err) {
    log(err)
    ctx.status = 500
    return
  }

  // log them in automatically
  try {
    await _login(ctx, { username, password: newPassword, roomId })
  } catch (err) {
    log(err)
    ctx.status = 500
  }
})

// update account
router.put('/account', async (ctx, next) => {
  let user

  // must be admin
  if (!ctx.user) {
    ctx.status = 401
    ctx.body = 'Invalid token'
    return
  }

  // find user by id (from token)
  try {
    const q = squel.select()
      .from('users')
      .where('userId = ?', ctx.user.userId)

    const { text, values } = q.toParam()
    user = await db.get(text, values)
  } catch (err) {
    log(err)
    ctx.status = 500
    return
  }

  if (!user) {
    ctx.status = 401
    ctx.body = 'Invalid user id'
    return
  }

  let { name, username, password, newPassword, newPasswordConfirm } = ctx.request.body

  // check presence of required fields
  if (!name || !username || !password) {
    ctx.status = 422
    ctx.body = 'Name, username and current password are required'
    return
  }

  // validate current password
  if (!await bcrypt.compare(password, user.password)) {
    ctx.status = 401
    ctx.body = 'Current password is incorrect'
    return
  }

  // check for duplicate username
  try {
    const q = squel.select()
      .from('users')
      .where('userId != ?', ctx.user.userId)
      .where('username = ? COLLATE NOCASE', username.trim())

    const { text, values } = q.toParam()

    if (await db.get(text, values)) {
      ctx.status = 401
      ctx.body = 'Username already exists; please choose another'
      return
    }
  } catch (err) {
    log(err)
    ctx.status = 500
    return
  }

  // begin query
  const u = squel.update()
    .table('users')
    .where('userId = ?', ctx.user.userId)
    .set('name', name.trim())
    .set('username', username.trim())

  // changing password?
  if (newPassword) {
    if (newPassword !== newPasswordConfirm) {
      ctx.status = 422
      ctx.body = 'New passwords do not match'
      return
    }

    try {
      u.set('password', await bcrypt.hash(newPassword, 10))
    } catch (err) {
      log(err)
      ctx.status = 500
      return
    }

    password = newPassword
  }

  // do update!
  try {
    const { text, values } = u.toParam()
    await db.run(text, values)
  } catch (err) {
    log(err)
    ctx.status = 500
    return
  }

  // attempt re-login
  try {
    await _login(ctx, { username, password, roomId: ctx.user.roomId })
  } catch (err) {
    log(err)
    ctx.status = 500
  }
})

module.exports = router

async function _login (ctx, creds) {
  const { username, password, roomId } = creds
  let user

  if (!username || !password) {
    ctx.status = 422
    ctx.body = 'Username/email and password are required'
    return
  }

  // get user
  try {
    const q = squel.select()
      .from('users')
      .where('username = ? COLLATE NOCASE', username.trim())

    const { text, values } = q.toParam()
    user = await db.get(text, values)

    if (!user) {
      ctx.status = 401
      return
    }
  } catch (err) {
    return Promise.reject(err)
  }

  // validate password
  try {
    if (!await bcrypt.compare(password, user.password)) {
      ctx.status = 401
      return
    }
  } catch (err) {
    return Promise.reject(err)
  }

  // validate roomId (if not an admin)
  if (!user.isAdmin) {
    if (typeof roomId === 'undefined') {
      ctx.status = 422
      ctx.body = 'RoomId is required'
      return
    }

    try {
      const q = squel.select()
        .from('rooms')
        .where('roomId = ?', roomId)

      const { text, values } = q.toParam()
      const row = await db.get(text, values)

      if (!row || row.status !== 'open') {
        ctx.status = 401
        ctx.body = 'Invalid Room'
        return
      }
    } catch (err) {
      return Promise.reject(err)
    }
  }

  // get starred songs
  try {
    const q = squel.select()
      .from('stars')
      .field('songId')
      .where('userId = ?', user.userId)

    const { text, values } = q.toParam()
    const rows = await db.all(text, values)

    user.starredSongs = rows.map(row => row.songId)
  } catch (err) {
    return Promise.reject(err)
  }

  delete user.password
  user.roomId = roomId
  user.isAdmin = (user.isAdmin === 1)

  // encrypt JWT based on subset of user object
  // @todo use async version
  const token = jwtSign({
    userId: user.userId,
    isAdmin: user.isAdmin === true,
    name: user.name,
    roomId: user.roomId,
  }, 'shared-secret')

  // set httpOnly cookie containing JWT
  ctx.cookies.set('id_token', token, {
    httpOnly: true,
  })

  ctx.body = user
}

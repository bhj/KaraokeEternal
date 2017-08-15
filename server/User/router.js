const db = require('sqlite')
const squel = require('squel')
const jwtSign = require('jsonwebtoken').sign
const bcrypt = require('./lib/bcrypt')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api' })
const debug = require('debug')
const log = debug('app:user')
const getPrefs = require('../lib/getPrefs')

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
  let { name, email, newPassword, newPasswordConfirm, roomId } = ctx.request.body

  name = name.trim()
  email = email.trim().toLowerCase()

  // check presence of all fields
  if (!name || !email || !newPassword || !newPasswordConfirm) {
    ctx.status = 422
    ctx.body = 'All fields are required'
    return
  }

  // validate email
  if (!validateEmail(email)) {
    ctx.status = 422
    ctx.body = 'Invalid email address'
    return
  }

  // check for duplicate email
  try {
    const q = squel.select()
      .from('users')
      .where('email = ?', email)

    const { text, values } = q.toParam()

    if (await db.get(text, values)) {
      ctx.status = 401
      ctx.body = 'Email address is already taken'
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
    const prefs = await getPrefs()

    if (prefs.firstRun === true) {
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
      .set('email', email)
      .set('password', hashedPwd)
      .set('name', name)
      .set('isAdmin', prefs.firstRun === true ? 1 : 0)

    const { text, values } = q.toParam()
    const res = await db.run(text, values)

    if (res.stmt.changes !== 1) {
      throw new Error('insert failed')
    }

    // remove firstRun flag if necessary
    if (prefs.firstRun === true) {
      const q = squel.update()
        .table('prefs')
        .where('key = ?', 'firstRun')
        .set('data', squel.select()
          .field(`json('false')`)
        )

      const { text, values } = q.toParam()
      const res = await db.run(text, values)

      if (res.stmt.changes !== 1) {
        throw new Error('could not remove firstRun flag')
      }
    }
  } catch (err) {
    log(err)
    ctx.status = 500
    return
  }

  // log them in automatically
  try {
    await _login(ctx, { email, password: newPassword, roomId })
  } catch (err) {
    log(err)
    ctx.status = 500
  }
})

// update account
router.put('/account', async (ctx, next) => {
  let user

  // check jwt validity
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

  let { name, email, password, newPassword, newPasswordConfirm } = ctx.request.body

  name = name.trim()
  email = email.trim().toLowerCase()

  // check presence of required fields
  if (!name || !email || !password) {
    ctx.status = 422
    ctx.body = 'Name, email and current password are required'
    return
  }

  // validate current password
  if (!await bcrypt.compare(password, user.password)) {
    ctx.status = 401
    ctx.body = 'Current password is incorrect'
    return
  }

  // validate email
  if (!validateEmail(email)) {
    ctx.status = 422
    ctx.body = 'Invalid email address'
    return
  }

  // check for duplicate email
  try {
    const q = squel.select()
      .from('users')
      .where('userId != ?', ctx.user.userId)
      .where('email = ? COLLATE NOCASE', email)

    const { text, values } = q.toParam()

    if (await db.get(text, values)) {
      ctx.status = 401
      ctx.body = 'Email address is already registered'
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
    .set('name', name)
    .set('email', email)

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
    await _login(ctx, { email, password, roomId: ctx.user.roomId })
  } catch (err) {
    log(err)
    ctx.status = 500
  }
})

module.exports = router

async function _login (ctx, creds) {
  const { email, password, roomId } = creds
  let user

  if (!email || !password) {
    ctx.status = 422
    ctx.body = 'Email and password are required'
    return
  }

  // get user
  try {
    const q = squel.select()
      .from('users')
      .where('email = ?', email.trim().toLowerCase())

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
  const starredSongs = []
  try {
    const q = squel.select()
      .from('stars')
      .field('mediaId')
      .where('userId = ?', user.userId)

    const { text, values } = q.toParam()
    const rows = await db.all(text, values)

    rows.forEach(row => {
      starredSongs.push(row.mediaId)
    })
  } catch (err) {
    return Promise.reject(err)
  }

  delete user.password
  user.roomId = roomId
  user.isAdmin = (user.isAdmin === 1)
  user.starredSongs = starredSongs

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

// email validation helper from
// http://www.moreofless.co.uk/validate-email-address-without-regex/
function validateEmail (email) {
  var at = email.indexOf('@')
  var dot = email.lastIndexOf('.')
  return email.length > 0 &&
    at > 0 &&
    dot > at + 1 &&
    dot < email.length &&
    email[at + 1] !== '.' &&
    !email.includes(' ') &&
    !email.includes('..')
}

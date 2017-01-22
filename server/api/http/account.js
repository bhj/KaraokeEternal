const db = require('sqlite')
const jwt = require('koa-jwt')
const bcrypt = require('../../thunks/bcrypt')
const KoaRouter = require('koa-router')
const router = KoaRouter()

// list available rooms
router.get('/api/account/rooms', async (ctx, next) => {
  let rooms = await db.all('SELECT * FROM rooms WHERE status = ?', 'open')
  return ctx.body = rooms
})

// login
router.post('/api/account/login', async (ctx, next) => {
  let {email, password, roomId} = ctx.request.body

  // check presence of all fields
  if (!email || !password || !roomId) {
    ctx.status = 422
    return ctx.body = 'Email, password, and room are required'
  }

  email = email.trim().toLowerCase()

  // get user
  let user = await db.get('SELECT * FROM users WHERE email = ?', email)

  // validate password
  if (!user || !await bcrypt.compare(password, user.password)) {
    ctx.status = 401
    return
  }

  // validate roomId
  let room = await db.get('SELECT * FROM rooms WHERE roomId = ?', roomId)

  if (!room || room.status !== 'open') {
    ctx.status = 401
    return ctx.body = 'Invalid Room'
  }

  delete user.password
  user.roomId = room.roomId
  user.isAdmin = (user.isAdmin === 1)

  let token = jwt.sign(user, 'shared-secret')

  // client also persists this to localStorage
  ctx.body = { user, token }
})

// logout
router.get('/api/account/logout', async (ctx, next) => {
  // doesn't do much...
  ctx.status = 200
})

// create
router.post('/api/account/create', async (ctx, next) => {
  let {name, email, newPassword, newPasswordConfirm} = ctx.request.body

  name = name.trim()
  email = email.trim().toLowerCase()

  // check presence of all fields
  if (!name || !email || !newPassword || !newPasswordConfirm) {
    ctx.status = 422
    return ctx.body = 'All fields are required'
  }

  // validate email
  if (!validateEmail(email)) {
    ctx.status = 422
    return ctx.body = 'Invalid email address'
  }

  // check for duplicate email
  if (await db.get('SELECT * FROM users WHERE email = ?', email)) {
    ctx.status = 401
    return ctx.body = 'Email address is already registered'
  }

  // check that passwords match
  if (newPassword !== newPasswordConfirm) {
    ctx.status = 422
    return ctx.body = 'Passwords do not match'
  }

  let hashedPwd = await bcrypt.hash(newPassword, 10)
  let res = await db.run('INSERT INTO users (email, password, name) VALUES (?, ?, ?)', email, hashedPwd, name)
  ctx.status = 200
})

// update
router.post('/api/account/update', async (ctx, next) => {
  // check jwt validity
  if (!ctx.state.user) {
    ctx.status = 401
    return ctx.body = 'Invalid token'
  }

  let user = await db.get('SELECT * FROM users WHERE userId = ?', ctx.state.user.userId)

  if (!user) {
    ctx.status = 401
    return ctx.body = 'Invalid user id'
  }

  let {name, email, password, newPassword, newPasswordConfirm} = ctx.request.body

  name = name.trim()
  email = email.trim().toLowerCase()

  // check presence of required fields
  if (!name || !email || !password) {
    ctx.status = 422
    return ctx.body = 'Name, email and current password are required'
  }

  // validate current password
  if (!await bcrypt.compare(password, user.password)) {
    ctx.status = 401
    return ctx.body = 'Current password is incorrect'
  }

  // changing password?
  if (newPassword && newPasswordConfirm) {
    if (newPassword !== newPasswordConfirm) {
      ctx.status = 422
      return ctx.body = 'New passwords do not match'
    }

    password = await bcrypt.hash(newPassword, 10)
  } else {
    password = user.password
  }

  // validate email
  if (!validateEmail(email)) {
    ctx.status = 422
    return ctx.body = 'Invalid email address'
  }

  // check for duplicate email
  if (await db.get('SELECT * FROM users WHERE userId != ? AND email = ? COLLATE NOCASE ',
      ctx.state.user.userId, email)) {
    ctx.status = 401
    return ctx.body = 'Email address is already registered'
  }

  // do update
  let res = await db.run('UPDATE users SET name = ?, email = ?, password = ? WHERE userId = ?',
    name, email, password, ctx.state.user.userId)

  // return user (shape should match /login)
  user = await db.get('SELECT * FROM users WHERE email = ?', email)

  delete user.password
  user.roomId = ctx.state.user.roomId

  // generate new JWT
  let token = jwt.sign(user, 'shared-secret')

  // store JWT in httpOnly cookie
  // ctx.cookies.set('id_token', token, {httpOnly: true})

  // client also persists this to localStorage
  ctx.body = user
})

module.exports = router

// email validation helper from
// http://www.moreofless.co.uk/validate-email-address-without-regex/
function validateEmail(email) {
  var at = email.indexOf( "@" )
  var dot = email.lastIndexOf( "\." )
  return email.length > 0 &&
         at > 0 &&
         dot > at + 1 &&
         dot < email.length &&
         email[at + 1] !== "." &&
         email.indexOf( " " ) === -1 &&
         email.indexOf( ".." ) === -1
}

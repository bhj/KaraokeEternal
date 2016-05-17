import jwt from 'koa-jwt'
import { hash, compare } from '../lib/bcrypt-promise'
import KoaRouter from 'koa-router'
let router = KoaRouter()

// login
router.post('/api/account/login', async (ctx, next) => {
  let {email, password} = ctx.request.body

  // check presence of all fields
  if (!email || !password) {
    ctx.status = 422
    return ctx.body = 'All fields are required'
  }

  email = email.trim().toLowerCase()


  let user = await ctx.db.get('SELECT * FROM users WHERE email = ?', [email])

  if (!user || !await compare(password, user.password)) {
    ctx.status = 401
    return
  }

  // client will use this info in UI and
  // cache it in localStorage to persist reloads
  ctx.body = {
    name: user.name,
    email: user.email
  }

  // store user id in JWT in httpOnly cookie
  let token = jwt.sign({
    id: user.id,
    name: user.name,
    email: user.email,
  }, 'shared-secret')

  ctx.cookies.set('id_token', token, {httpOnly: true})
})

// logout
router.get('/api/account/logout', async (ctx, next) => {
  ctx.cookies.set('id_token', '', {httpOnly: true})
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
  if (await ctx.db.get('SELECT * FROM users WHERE email = ?', [email])) {
    ctx.status = 401
    return ctx.body = 'Email address is already registered'
  }

  // check that passwords match
  if (newPassword !== newPasswordConfirm) {
    ctx.status = 422
    return ctx.body = 'Passwords do not match'
  }

  let hashedPwd = await hash(newPassword, 10)
  let res = await ctx.db.run('INSERT INTO users (email, password, name) VALUES (?, ?, ?)', [email, hashedPwd, name])
  console.log(res)
  ctx.status = 200
})

// update
router.post('/api/account/update', async (ctx, next) => {
  // check jwt validity
  if (!ctx.state.user) {
    ctx.status = 401
    return ctx.body = 'Invalid token'
  }

  let user = await ctx.db.get('SELECT * FROM users WHERE id = ?', [ctx.state.user.id])

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
  if (!await compare(password, user.password)) {
    ctx.status = 401
    return ctx.body = 'Current password is incorrect'
  }

  // changing password?
  if (newPassword && newPasswordConfirm) {
    if (newPassword !== newPasswordConfirm) {
      ctx.status = 422
      return ctx.body = 'New passwords do not match'
    }

    password = await hash(newPassword, 10)
  } else {
    password = user.password
  }

  // validate email
  if (!validateEmail(email)) {
    ctx.status = 422
    return ctx.body = 'Invalid email address'
  }

  // check for duplicate email
  if (await ctx.db.get('SELECT * FROM users WHERE id != ? AND email = ? COLLATE NOCASE ',
      [ctx.state.user.id, email])) {
    ctx.status = 401
    return ctx.body = 'Email address is already registered'
  }

  // do update
  let res = await ctx.db.run('UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?',
    [name, email, password, ctx.state.user.id])

  // client will use this info in UI and
  // cache it in localStorage to persist reloads
  ctx.body = {
    name,
    email,
  }

  // generate new JWT
  let token = jwt.sign({
    id: ctx.state.user.id,
    name,
    email
  }, 'shared-secret')

  // store JWT in httpOnly cookie
  ctx.cookies.set('id_token', token, {httpOnly: true})  //
  ctx.status = 200
})

export default router

// email validation helper from
// http://www.moreofless.co.uk/validate-email-address-without-regex/
function validateEmail(email) {
  var at = email.indexOf( "@" );
  var dot = email.lastIndexOf( "\." );
  return email.length > 0 &&
         at > 0 &&
         dot > at + 1 &&
         dot < email.length &&
         email[at + 1] !== "." &&
         email.indexOf( " " ) === -1 &&
         email.indexOf( ".." ) === -1;
}

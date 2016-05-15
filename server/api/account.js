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

  email = email.toLowerCase()

  let user = await ctx.db.get('SELECT * FROM users WHERE email = ?', [email])

  if (!user || !await compare(password, user.password)) {
    ctx.status = 401
    return
  }

  // store JWT in httpOnly cookie
  let token = jwt.sign({id: user.id}, 'shared-secret')

  ctx.cookies.set('id_token', token, {httpOnly: true})

  ctx.body = {
    email: user.email,
    name: user.name
  }
})

// create
router.post('/api/account/create', async (ctx, next) => {
  let {name, email, newPassword, newPasswordConfirm} = ctx.request.body

  email = email.toLowerCase()

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

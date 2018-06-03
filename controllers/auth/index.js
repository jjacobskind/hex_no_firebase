const express = require('express')
const passport = require('./passport')
router = express.Router()

router.get('/login', (req, res, next) => {
  res.send(`
    <html>
      <head>
        <title>Login</title>
      </head>
      <body>
        <form action='/auth/login' method='post'>
          Email: <input type='text' name='email' />
          <br/>Password: <input type='password' name='password' />
          <br/><input type='submit' />
        </form>
        <br/>
        <a href='/auth/signup'>Create an Account</a>
      </body>
    </html>
  `)
})

router.post('/login', passport.authenticate('login', {
  failureRedirect: '/auth/signup',
  session: false
}), /*auth.setTokenCookie, */(req, res, next) => {
  const { firstname, lastname, email } = req.user
  const user = { firstname, lastname, email }
  res.send(`<script>window.opener.login(${JSON.stringify(user)});window.close()</script>`)
})

router.get('/signup', (req, res, next) => {
  res.send(`
    <html>
      <head>
        <title>Create An Account</title>
      </head>
      <body>
        <form action='/auth/signup' method='post'>
          First Name: <input type='text' name='firstname' />
          <br/>Last Name: <input type='text' name='lastname' />
          <br/>Email: <input type='text' name='email' />
          <br/>Password: <input type='password' name='password' />
          <br/>Password Confirmation: <input type='password' name='password_confirmation' />
          <br/><input type='submit' />
        </form>
        <br/>
        <a href='/auth/login'>Already have an account? Log In</a>
      </body>
    </html>
  `)
})

router.post('/signup', passport.authenticate('signup', {
  failureRedirect: '/auth/signup',
  session: false
}), /*auth.setTokenCookie, */(req, res, next) => {
  const user = { name: req.user.name, facebook_id: req.user.facebook_id, email: req.user.email }
  res.send(`<script>window.opener.login(${JSON.stringify(user)});window.close()</script>`)
})

module.exports = router

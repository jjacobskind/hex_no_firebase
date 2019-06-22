const express = require('express')
const passport = require('./passport')
router = express.Router()

router.post('/login', passport.authenticate('login', {
  failureRedirect: '/auth/signup',
  session: false
}), /*auth.setTokenCookie, */(req, res, next) => {
  const { firstname, lastname, email } = req.user
  const user = { firstname, lastname, email }
  res.send(`<script>window.opener.login(${JSON.stringify(user)});window.close()</script>`)
})

router.post('/login', (req, res, next) => {
  res.send("Done")
})

router.post('/signup', passport.authenticate('signup', {
  failureRedirect: '/auth/signup',
  session: false
}), /*auth.setTokenCookie, */(req, res, next) => {
  const user = { name: req.user.name, facebook_id: req.user.facebook_id, email: req.user.email }
  res.send(`<script>window.opener.login(${JSON.stringify(user)});window.close()</script>`)
})

module.exports = router

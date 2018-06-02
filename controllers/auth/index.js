const express = require('express')
const passport = require('./passport')
router = express.Router()

router.get('/facebook', passport.authenticate('facebook', {
  scope: 'email',
  display: 'popup',
}))

router.get('/oauth/callback', passport.authenticate('facebook', {
  failureRedirect: '/signup',
  session: false
}), /*auth.setTokenCookie, */(req, res, next) => {
  res.send(`<script>window.opener.login();window.close()</script><h1>${req.user.name}</h1>`)
})

module.exports = router

const passport = require('passport')
const CustomStrategy = require('passport-custom').Strategy
const User = require('../../server/api/user/user.model')

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  models.user.findById(id)
    .then(function(user) { done(null, user); });
});

passport.use('signup', new CustomStrategy(
  (req, done) => {
    const { firstname, lastname, email, password, passwordConfirmation } = req.body
    const user = new User({
      firstname,
      lastname,
      email,
      password,
      passwordConfirmation
    })

    user.save((err, u) => {
      if(err) { return done(err) }
      done(null, u)
    })
  }
))

passport.use('login', new CustomStrategy(
  (req, done) => {
    const { email, password } = req.body

    User.findOne({ email })
      .exec()
      .then(user => {
        if(!user || !user.authenticate(password)) { return('Invalid email or password') }
        return done(null, user)
      })
  })
)

module.exports = passport

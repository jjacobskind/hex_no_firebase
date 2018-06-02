const passport = require('passport')
const FacebookStrategy = require('passport-facebook').Strategy
const User = require('../../server/api/user/user.model')

const facebookConfig = {
  clientID: '517141338388339',
  clientSecret: 'd0b77eb957e05dd00a8f9830b77273a4',
  callbackURL: '/auth/oauth/callback',
  profileFields: ['emails', 'name', 'photos']
};

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  models.user.findById(id)
    .then(function(user) { done(null, user); });
});

passport.use(new FacebookStrategy(facebookConfig,
  (token, refreshToken, profile, done) => {
    User.findOne({ 'facebook_id': profile.id })
      .exec()
      .then(user => {
        if(user) { return done(null, user) }

        user = new User({
          facebook_id: profile.id,
          email: profile.emails[0].value,
          name: [profile.name.givenName, profile.name.familyName].join(" "),
          provider: 'facebook',
          role: 'user'
        })

        user.save((err, u) => {
          if(err) { return done(err) }
          return done(null, u)
        })
      })
  })
)

module.exports = passport

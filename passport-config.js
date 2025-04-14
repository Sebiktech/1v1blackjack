const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const conn = require('./models')
const validPassword = require('./lib/passwordUtils').validPassword

const User = mongoose.model('Users')

const customFields = {
  usernameField: 'uname',
  passwordField: 'pw'
}

const verifyCallback = (username, password, done) => {

  User.findOne({username : username })
    .then((user) => {
      if (!user) { return done(null, false) }
  
      const isValid = validPassword(password, user.hash, user.salt)
  
      if (isValid) {
        return done(null, user)
      } else {
        return done(null, false)
      }
    }).catch((err) => {
        done(err)
      })
}

const strategy = new LocalStrategy(customFields, verifyCallback)

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(strategy)
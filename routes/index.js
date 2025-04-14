const router = require('express').Router()
const passport = require('passport')
const mongoose = require('mongoose')
const conn = require('../models')
const Users = mongoose.model('Users')
const Games = mongoose.model('Games')
const genPassword = require('../lib/passwordUtils').genPassword

router.get('/', (req, res) => {
  if (req.user) {
    Games.find({status: "in progress"}, (err, docs) => {
      res.render('index', {user: req.user, agames: docs})
    })
  } else {
    res.render('index', {user: null})
  }
})

router.get('/rules', (req, res) => {
  res.render('rules', {user: req.user})
})

router.get('/settings', (req, res) => {
  if (req.user) {
    res.render('settings', {user: req.user})
  } else {
    res.redirect('/')
  }
})

router.get('/history', (req, res) => {
  if (req.user) {
    res.render('history', {user: req.user})
  } else {
    res.redirect('/')
  }
})

router.get('/login', (req, res) => {
  if (req.user) {
    res.redirect('/')
  } else {
    res.render('login', {user: req.user})
  }
})

router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login'
}))

router.get('/register', (req, res) => {
  res.render('register')
})

router.post('/register', (req, res) => {
  const saltHash = genPassword(toString(req.body.pw))

  const salt = saltHash.salt
  const hash = saltHash.hash

  const newUser = new Users({
    username: req.body.uname,
    email: req.body.email,
    hash: hash,
    salt: salt,
    balance: 20000,
    settings: {
      sounds: true
    }
  })

  newUser.save().then((user) => {
    console.log(user)
  })
  res.redirect('./login')
})

router.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})

module.exports = router
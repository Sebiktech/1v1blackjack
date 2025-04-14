const mongoose = require('mongoose')

mongoose.connect('mongodb://localhost:27017/blackjack', { useNewUrlParser: true, useUnifiedTopology: true}, (err) => {
  if(!err) {
    console.log("Connected to DB")
  } else {
    console.log(err)
  }
})

const Users = require('./users.js')

const Games = require('./games.js')

const Transactions = require('./transactions.js')
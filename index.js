const express = require('express')
const session = require('express-session')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const methodOverride = require('method-override')
const http = require('http')
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server)
var routes = require('./routes')
const conn = require('./models')

//require('.env').config()

const MongoStore = require('connect-mongo')

const Games = mongoose.model('Games')
const Users = mongoose.model('Users')

const creditSystem = require('./lib/creditSystem.js')

const initializePassport = require('./passport-config')

const sessionStore = MongoStore.create({mongoUrl: 'mongodb://localhost:27017/blackjack', collectionName: 'sessions'})

const sharedSession = session({
  secret: 'process.env.SESSION_SECRET',
  resave: false,
  saveUninitialized: true,
  store: sessionStore,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // equals 1 day session expiry
  }
})

app.use('/static', express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(sharedSession)
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))
app.use(routes)

app.set('view engine', 'ejs')

app.use((req, res, next) => {
  next()
})

server.listen(3000, () => {
  console.log(`Example app listening on port ${3000}`)
})

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next)
io.use(wrap(sharedSession))

io.use((socket, next) => {
  next();
});

io.on('connection', (socket) => {
  // Default Event
  if(!socket.request.session.passport) {
    socket.request.session.passport = {}
  }

  setInterval(function(){
    Games.find({status: 1}, (err, docs) => {
      socket.emit('list games', docs)
    })
  }, 1000)

  // Logged In User Events
  if (socket.request.session.passport.user) {
    var user = socket.request.session.passport.user
    socket.join(user._id)

    socket.on('Create Game', (bet, count) => {
      creditSystem.debit(user._id, bet * count, 5, (success, balance) => {
        if (success) {
          CreateGames({id: user._id, username: user.username}, bet, count)
          socket.request.session.user.balance = balance
        } else {
          socket.emit('new alert', 'danger', "You don't have enough coins!")
        }
      })
    })

    socket.on('Join Game', (id) => {
      Games.findOne({_id: id}, (err, docs) => {
        if(docs.ply1.id !== user._id && docs.status == 1) {
          creditSystem.debit(user._id, docs.bet, 4, (success) => {
            if (success) {
              JoinGame(docs, user)
            } else {
              socket.emit('new alert', "danger", "You don't have enough coins!")
            }
          })
        }
      })
    })
  
    socket.on('Cancel Game', (id) => {
      Games.findOne({_id: id}, (err, docs) => {
        if(docs.ply1.id == user._id && docs.status == 1) {
          docs.status = 4
          docs.save()
        }
      })
    })

    socket.on('Action Game', (id, action) => {
      Games.findOne({_id: id}, (err, docs) => {
        if(docs.ply1.id == user._id || docs.ply2.id == user._id && docs.status == 2) {
          ActionGame(docs, user._id, action, (data) => {
            socket.emit('Update Game', data.id, { action: data.action, card: data.card, total: data.total})
          })
        }
      })
    })

    Games.find({ $or: [{ply1id: user._id}, {ply2id: user._id}], status: 2}).exec((err, docs) => {
      for (let i = 0; i < docs.length; i++) {
        if (docs[i].ply1id == user._id) {
          socket.emit('New Game', docs[i]._id, {id: docs[i].ply2id, uname: docs[i].ply2.username}, docs[i].ply1.cards, CountTotal(docs[i].ply1.cards))
        } else {
          socket.emit('New Game', docs[i]._id, {id: docs[i].ply1id, uname: docs[i].ply1.username}, docs[i].ply2.cards, CountTotal(docs[i].ply2.cards))
        }
      }
    }) 
  }
})

const pack = [1,2,3,4,5,6,7,8,9,10,10,10,10,1,2,3,4,5,6,7,8,9,10,10,10,10,1,2,3,4,5,6,7,8,9,10,10,10,10,1,2,3,4,5,6,7,8,9,10,10,10,10]
const games = []



CreateGames = function (ply1, bet, count) {
    for (let i = 0; i < count; i++) {
      const game = new Games(
        {
          bet: bet,
          deck: ShuffleDeck(),
          time: new Date(),
          ply1id: ply1.id,
          ply1:{
            id: ply1.id,
            username: ply1.username
          },
          status: 1
        }
        )
        game.save()

    }
}

JoinGame = function (game, ply2) {
  game.status = 2
  game.ply1.cards = [game.deck[0], game.deck[2]]
  game.ply2id = ply2._id
  game.ply2.id = ply2._id
  game.ply2.username = ply2.username
  game.ply2.cards = [game.deck[1], game.deck[3]]
  game.lc = 3
  // game.expiry = new Date() + 1000 * 60 * 60 * 24 // 24 hours
  game.save()
  io.to(game.ply1.id).emit('New Game', game._id, {id: ply2._id, uname: ply2.username}, game.ply1.cards, CountTotal(game.ply1.cards))
  io.to(game.ply2.id).emit('New Game', game._id, {id: game.ply1.id, uname: game.ply1.username}, game.ply2.cards, CountTotal(game.ply2.cards))
}

ActionGame = function(game, ply, action, cb) {
  if (action == "hit") {
    game.lc = game.lc+ 1
    if (game.ply1.id == ply && !game.ply1.possition) {
      game.ply1.cards.push(game.deck[game.lc])
      io.to(ply).emit('Update Game', game.id, {action:'add card', card: game.deck[game.lc], total: CountTotal(game.ply1.cards)})
      if (CountTotal(game.ply1.cards) > 21) {
        Stand()
      }
    } else if(game.ply2.id == ply && !game.ply2.possition) {
      game.ply2.cards.push(game.deck[game.lc])
      if (CountTotal(game.ply2.cards) > 21) {
        Stand()
      }
      io.to(ply).emit('Update Game', game.id, {action:'add card', card: game.deck[game.lc], total: CountTotal(game.ply2.cards)})
    }
  } else if (action == "stand") {
    Stand()
  }

  function Stand() {
    if (game.ply1.id == ply) {
      game.ply1.possition = true
    } else if(game.ply2.id == ply) {
      game.ply2.possition = true
    }
    if (game.ply1.possition && game.ply2.possition) {
      EvalueateGame(game)
    }
    io.to(ply).emit('Update Game', game.id, {action:'stand'})
  }
  game.save()
}

CheckGame = function (id) {
  Games.findOne({_id: id}, (err, game) => {
    if(game.ply1.possition == false && game.ply2.possition == false) {
      docs.ply1.possition = false;
      docs.save()
      JoinGame(docs, socket.id)
    }
  })
}

EvalueateGame = function (game) {
  ply1h = CountTotal(game.ply1.cards)
  ply2h = CountTotal(game.ply2.cards)
  game.status = 3;
  if (ply1h == ply2h || ply1h && ply2h > 21) {
    console.log("tie")
    creditSystem.credit(game.ply1.id, game.bet, 4)
    creditSystem.credit(game.ply2.id, game.bet, 5)
    game.result = 2
  } else if (ply1h > ply2h) {
    console.log("player 1 win")
    game.result = 0
    creditSystem.credit(game.ply1.id, game.bet * 2, 4, ()=> {
      console.log("credited")
    })
  } else if (ply2h > ply1h) {
    console.log("player 2 win")
    game.result = 1
    creditSystem.credit(game.ply2.id, game.bet * 2, 4, () => {
      console.log("credited")
    })
  }
  io.to(game.ply1.id).emit('Update Game', game.id, {action:'show result', cards: game.ply2.cards, total: CountTotal(game.ply2.cards)})
  io.to(game.ply2.id).emit('Update Game', game.id, {action:'show result', cards: game.ply1.cards, total: CountTotal(game.ply1.cards)})
}

function ShuffleDeck() {
    const deck = []
    for (let i = 0; i < 311; i++) {
        const card = Math.floor(Math.random() * 51)
         if (CheckCardInDeck(card, deck).length <= 6) {
            deck.push(card)
         }
     }
    return deck;
}

function CheckCardInDeck(card, deck) {
    const found = [];
    for (let i = 0; i < deck.length; i++) {
        if(deck[i] == card){
            found.push(i)
        }
    }
    return found;
}

function CountTotal(cards) {
  let optional = false;
  let total = 0;
  for (let i = 0; i < cards.length; i++) {
    total = total + pack[cards[i]];
    if (pack[cards[i]] == 1 && total < 11) {
      total = total + 10;
      optional = true;
    } else if(total > 21 && optional == true) {
      total = total - 10;
    }
  }
  return total;
}
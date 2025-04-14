const mongoose = require('mongoose')

const GamesSchema = {
    bet: Number, 
    time: Number, 
    deck: Array,
    ply1id: String,
    ply1: { 
        id: String,
        username: String, 
        cards: Array, 
        possition: Boolean
    },
    ply2id: String,
    ply2: { 
        id: String,
        username: String,
        cards: Array, 
        possition: Boolean
    }, 
    lc: Number, 
    result: Number,
    expiry: Number,
    status: Number 
}

mongoose.model("Games", GamesSchema)
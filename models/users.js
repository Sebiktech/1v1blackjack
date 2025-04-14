const mongoose = require('mongoose')

const UsersSchema = { 
    username: String, 
    email: String, 
    hash: String,
    salt: String,
    balance: Number,
    settings: {
        notifications: Boolean,
        sound: Boolean,
        profile: Number
    }
}

mongoose.model("Users", UsersSchema)
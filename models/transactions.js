const mongoose = require('mongoose')

const TransactionsSchema = {
    date: String,
    user: String,
    code: Number,
    action: String, 
    value: Number,
    balance: {
        old: Number,
        new: Number        
    }
}

mongoose.model("Transactions", TransactionsSchema)
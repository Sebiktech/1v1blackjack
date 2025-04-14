const mongoose = require('mongoose')
const conn = require('../models')
const Users = mongoose.model('Users')
const Games = mongoose.model('Games')
const Transactions = mongoose.model('Transactions')

function debit(userid, amount, reason, cb) {

    Users.findOne({_id: userid}, (err, docs) => {
        if (docs.balance > amount) {
            const newbalance = docs.balance - amount;
            console.log(newbalance)
            const transaction = new Transactions({
                date: new Date(),
                user: userid,
                code: reason,
                value: amount,
                balance: {
                    old: docs.balance,
                    new: newbalance
                }
            })
            transaction.save()
            docs.balance = newbalance;
            docs.save()
            cb(true, newbalance)
        } else {
            cb(false)
        }
    })
}

function credit(userid, amount, reason, cb) {

    Users.findOne({_id: userid}, (err, docs) => {
        const newbalance = docs.balance + amount;
        const transaction = new Transactions({
            date: new Date(),
            user: userid,
            code: reason,
            value: amount,
            balance: {
                old: docs.balance,
                new: newbalance
            }
        })
        transaction.save()
        docs.balance = newbalance;
        console.log(newbalance)
        docs.save()
        if(cb) {
            cb(true)
        }
    })
}

module.exports.debit = debit
module.exports.credit = credit
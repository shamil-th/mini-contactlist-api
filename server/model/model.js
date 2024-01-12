const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    firstName: {
        type: String,
        require: true
    },
    lastName: {
        type: String,
        require: true
    },
    phone: {
        type: Number,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    avatar: {
        type: String
    }
})

const ContactDb = mongoose.model('contact',schema);
module.exports = ContactDb
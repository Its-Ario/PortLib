const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {type: String},
    username: {type: String, required: true},
    password: {type: String, required: true},
    email: {type: String, required: true},
    isSuperUser: {type: Boolean, required: true, default: false},
    type: {type: String, required: true, enum: ["admin", "user"], default: "user"}
});

module.exports = mongoose.model('User', userSchema);

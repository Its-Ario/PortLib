const mongoose = require('mongoose');

bookSchema = mongoose.Schema({
    title: {type: String, required: true},
    isbn: { type: String, unique: true, required: true },
    author: {type: String, required: true},
    publicationYear: Number,
    copiesAvailable: { type: Number, default: 1 },
    approved: {type: Boolean, default: false},
    borrowedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}
})

module.exports = mongoose.model('Book', bookSchema);
const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema({
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['borrow', 'purchase'], required: true },
    startDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
    returnDate: { type: Date },
    status: { 
        type: String, 
        enum: ['active', 'completed', 'overdue'], 
        default: 'active' 
    },
    price: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
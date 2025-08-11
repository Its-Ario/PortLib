import { Schema, model } from 'mongoose';

const transactionSchema = Schema(
    {
        book: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        type: { type: String, enum: ['borrow', 'purchase'], required: true },
        startDate: { type: Date, default: Date.now },
        dueDate: {
            type: Date,
            required: function () {
                return this.type === 'borrow';
            },
        },
        returnDate: { type: Date },
        status: {
            type: String,
            enum: ['active', 'completed', 'overdue'],
            default: 'active',
        },
        price: {
            type: Number,
            required: function () {
                return this.type === 'purchase';
            },
        },
    },
    { timestamps: true }
);

transactionSchema.index({ user: 1, status: 1 });
transactionSchema.index({ book: 1, status: 1 });
transactionSchema.index({ dueDate: 1 });

export default model('Transaction', transactionSchema);

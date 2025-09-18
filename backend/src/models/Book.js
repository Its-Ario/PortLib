import { Schema, model } from 'mongoose';

const bookSchema = Schema(
    {
        title: { type: String, required: true, trim: true },
        isbn: { type: String, unique: true, required: true },
        author: { type: String, required: true, trim: true },
        publicationYear: Number,
        copiesAvailable: {
            type: Number,
            default: 1,
            min: [0, 'Copies available cannot be negative'],
        },
        approved: { type: Boolean, default: false },
        submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        forSale: { type: Boolean, default: false },
        price: {
            type: Number,
            required: function () {
                return this.forSale === true;
            },
        },
    },
    { timestamps: true }
);

bookSchema.index({ approved: 1, forSale: 1 });
bookSchema.index({ title: 'text', author: 'text' });

export default model('Book', bookSchema);

import { Schema, model } from 'mongoose';

const bookSchema = Schema({
    title: { type: String, required: true },
    isbn: { type: String, unique: true, required: true },
    author: { type: String, required: true },
    publicationYear: Number,
    copiesAvailable: { type: Number, default: 1 },
    approved: { type: Boolean, default: false },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    forSale: { type: Boolean, default: false },
    price: { type: Number },
});

bookSchema.index({ approved: 1, forSale: 1 });
bookSchema.index({ title: 1 });
bookSchema.index({ author: 1 });

export default model('Book', bookSchema);

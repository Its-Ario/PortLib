import { Types } from 'mongoose';
import Book from '../Models/Book.js';

class BookService {
    async getApprovedBooks() {
        return Book.find({ approved: true }).lean();
    }

    async addBook(bookData, userId) {
        const { title, isbn, author, publicationYear, copiesAvailable } = bookData;

        const book = new Book({
            title,
            isbn,
            author,
            publicationYear,
            copiesAvailable,
            approved: false,
            submittedBy: new Types.ObjectId(String(userId)),
        });

        return book.save();
    }

    async getPendingBooks({ limit = 20, skip = 0 } = {}) {
        return Book.find({ approved: false })
            .populate('submittedBy', 'username')
            .skip(skip)
            .limit(limit)
            .lean();
    }

    async approveBook(bookId) {
        return Book.findByIdAndUpdate(bookId, { approved: true }, { new: true });
    }

    async getBookById(bookId) {
        return Book.findById(bookId).lean();
    }

    async updateBookCopies(bookId, incrementBy) {
        if (typeof incrementBy !== 'number') {
            throw new Error('incrementBy must be a number');
        }

        return Book.findByIdAndUpdate(
            bookId,
            { $inc: { copiesAvailable: incrementBy } },
            { new: true }
        );
    }

    async updateBook(bookId, updateData) {
        return Book.findByIdAndUpdate(bookId, updateData, { new: true });
    }

    async deleteBook(bookId) {
        return Book.findByIdAndDelete(bookId);
    }

    async markBookForSale(bookId, price) {
        if (!price || price <= 0) {
            throw new Error('Price must be greater than zero');
        }

        return Book.findByIdAndUpdate(bookId, { forSale: true, price }, { new: true });
    }

    async removeBookFromSale(bookId) {
        return Book.findByIdAndUpdate(bookId, { forSale: false }, { new: true });
    }

    async getBooksForSale({ limit = 20, skip = 0 } = {}) {
        return Book.find({
            approved: true,
            forSale: true,
            copiesAvailable: { $gt: 0 },
        })
            .skip(skip)
            .limit(limit)
            .lean();
    }
}
export default new BookService();

import { Types } from 'mongoose';
import Book from '../models/Book.js';
import logger from '../logger.js';

class BookService {
    async getApprovedBooks() {
        logger.info('Fetching approved books');
        const books = await Book.find({ approved: true }).lean();
        logger.info(`Fetched ${books.length} approved books`);
        return books;
    }

    async addBook(bookData, userId) {
        logger.info(`Adding new book submitted by user ${userId}`);
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

        const savedBook = await book.save();
        logger.info(`Book added with ID ${savedBook._id}`);
        return savedBook;
    }

    async getPendingBooks({ limit = 20, skip = 0 } = {}) {
        logger.info(`Fetching pending books with skip=${skip} limit=${limit}`);
        const books = await Book.find({ approved: false })
            .populate('submittedBy', 'username')
            .skip(skip)
            .limit(limit)
            .lean();
        logger.info(`Fetched ${books.length} pending books`);
        return books;
    }

    async approveBook(bookId) {
        logger.info(`Approving book ${bookId}`);
        const updatedBook = await Book.findByIdAndUpdate(bookId, { approved: true }, { new: true });
        logger.info(`Book ${bookId} approved`);
        return updatedBook;
    }

    async getBookById(bookId) {
        logger.info(`Fetching book by ID ${bookId}`);
        const book = await Book.findById(bookId).lean();
        logger.info(`Fetched book: ${book ? book.title : 'Not found'}`);
        return book;
    }

    async updateBookCopies(bookId, incrementBy) {
        if (typeof incrementBy !== 'number') {
            logger.error('incrementBy must be a number');
            throw new Error('incrementBy must be a number');
        }
        logger.info(`Updating copies of book ${bookId} by ${incrementBy}`);
        const updatedBook = await Book.findByIdAndUpdate(
            bookId,
            { $inc: { copiesAvailable: incrementBy } },
            { new: true }
        );
        logger.info(`Book ${bookId} now has ${updatedBook.copiesAvailable} copies`);
        return updatedBook;
    }

    async updateBook(bookId, updateData) {
        logger.info(`Updating book ${bookId} with data: ${JSON.stringify(updateData)}`);
        const updatedBook = await Book.findByIdAndUpdate(bookId, updateData, { new: true });
        logger.info(`Book ${bookId} updated`);
        return updatedBook;
    }

    async deleteBook(bookId) {
        logger.info(`Deleting book ${bookId}`);
        const deletedBook = await Book.findByIdAndDelete(bookId);
        logger.info(`Book ${bookId} deleted`);
        return deletedBook;
    }

    async markBookForSale(bookId, price) {
        if (!price || price <= 0) {
            logger.error('Price must be greater than zero');
            throw new Error('Price must be greater than zero');
        }
        logger.info(`Marking book ${bookId} for sale at price ${price}`);
        const updatedBook = await Book.findByIdAndUpdate(
            bookId,
            { forSale: true, price },
            { new: true }
        );
        logger.info(`Book ${bookId} marked for sale`);
        return updatedBook;
    }

    async removeBookFromSale(bookId) {
        logger.info(`Removing book ${bookId} from sale`);
        const updatedBook = await Book.findByIdAndUpdate(bookId, { forSale: false }, { new: true });
        logger.info(`Book ${bookId} removed from sale`);
        return updatedBook;
    }

    async getBooksForSale({ limit = 20, skip = 0 } = {}) {
        logger.info(`Fetching books for sale with skip=${skip} limit=${limit}`);
        const books = await Book.find({
            approved: true,
            forSale: true,
            copiesAvailable: { $gt: 0 },
        })
            .skip(skip)
            .limit(limit)
            .lean();
        logger.info(`Fetched ${books.length} books for sale`);
        return books;
    }
}

export default new BookService();

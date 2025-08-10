import Book, { find, findByIdAndUpdate, findById, findByIdAndDelete } from '../Models/Book';
import { Types } from 'mongoose';

class BookService {
    async getApprovedBooks() {
        return find({ approved: true });
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
            submittedBy: new Types.ObjectId(String(userId))
        });

        return book.save();
    }

    async getPendingBooks() {
        return find({ approved: false }).populate("submittedBy", "username");
    }

    async approveBook(bookId) {
        return findByIdAndUpdate(
        bookId, 
        { approved: true }, 
        { new: true }
        );
    }

    async getBookById(bookId) {
        return findById(bookId);
    }
    
    async updateBook(bookId, updateData) {
        return findByIdAndUpdate(
        bookId,
        updateData,
        { new: true }
        );
    }
    async deleteBook(bookId) {
        return findByIdAndDelete(bookId);
    }

    async markBookForSale(bookId, price) {
        if (!price || price <= 0) {
            throw new Error('Price must be greater than zero');
        }
        
        return findByIdAndUpdate(
            bookId,
            { forSale: true, price },
            { new: true }
        );
    }

    async removeBookFromSale(bookId) {
        return findByIdAndUpdate(
            bookId,
            { forSale: false },
            { new: true }
        );
    }

    async getBooksForSale() {
        return find({ 
            approved: true, 
            forSale: true,
            copiesAvailable: { $gt: 0 }
        });
    }
}

export default new BookService();
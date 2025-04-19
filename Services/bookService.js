const Book = require('../Models/Book');
const mongoose = require('mongoose');

class BookService {
    async getApprovedBooks() {
        return Book.find({ approved: true });
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
            submittedBy: new mongoose.Types.ObjectId(String(userId))
        });

        return book.save();
    }

    async getPendingBooks() {
        return Book.find({ approved: false }).populate("submittedBy", "username");
    }

    async approveBook(bookId) {
        return Book.findByIdAndUpdate(
        bookId, 
        { approved: true }, 
        { new: true }
        );
    }

    async getBookById(bookId) {
        return Book.findById(bookId);
    }
    
    async updateBook(bookId, updateData) {
        return Book.findByIdAndUpdate(
        bookId,
        updateData,
        { new: true }
        );
    }
    async deleteBook(bookId) {
        return Book.findByIdAndDelete(bookId);
    }

    async markBookForSale(bookId, price) {
        if (!price || price <= 0) {
            throw new Error('Price must be greater than zero');
        }
        
        return Book.findByIdAndUpdate(
            bookId,
            { forSale: true, price },
            { new: true }
        );
    }

    async removeBookFromSale(bookId) {
        return Book.findByIdAndUpdate(
            bookId,
            { forSale: false },
            { new: true }
        );
    }

    async getBooksForSale() {
        return Book.find({ 
            approved: true, 
            forSale: true,
            copiesAvailable: { $gt: 0 }
        });
    }
}

module.exports = new BookService();
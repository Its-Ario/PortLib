import Transaction from '../Models/Transaction.js';
import bookService from './bookService.js';
import userService from './userService.js';

class LibraryService {
    async borrowBook(bookId, userId, durationDays = 14) {
        const book = await bookService.getBookById(bookId);
        if (!book) throw new Error('Book not found');

        const user = await userService.getUserProfile(userId);
        if (!user) throw new Error('User not found');

        if (book.copiesAvailable <= 0) {
            throw new Error('No copies available for borrowing');
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + durationDays);

        const transaction = new Transaction({
            book: bookId,
            user: userId,
            type: 'borrow',
            startDate: new Date(),
            dueDate,
            status: 'active',
        });

        await transaction.save();
        await bookService.updateBookCopies(bookId, -1);

        return transaction;
    }

    async returnBook(transactionId) {
        const transaction = await Transaction.findById(transactionId)
            .populate('book')
            .populate('user');

        if (!transaction || transaction.type !== 'borrow') {
            throw new Error('Transaction not found or not a borrowing transaction');
        }

        if (transaction.status === 'completed') {
            throw new Error('Book already returned');
        }

        const today = new Date();

        if (today > transaction.dueDate && transaction.status === 'active') {
            transaction.status = 'overdue';

            const daysLate = Math.floor(
                (today.getTime() - transaction.dueDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            const fine = daysLate * 0.5;

            await userService.updateUserFunds(transaction.user._id, -fine);
        }

        transaction.status = 'completed';
        transaction.returnDate = today;
        await transaction.save();

        await bookService.updateBookCopies(transaction.book._id, 1);

        return transaction;
    }

    async sellBook(bookId, userId) {
        const book = await bookService.getBookById(bookId);
        if (!book) throw new Error('Book not found');

        const user = await userService.getUserProfile(userId);
        if (!user) throw new Error('User not found');

        if (book.copiesAvailable <= 0 || !book.forSale) {
            throw new Error('Book is not available for sale.');
        }

        if (user.balance < book.price) {
            throw new Error('Insufficient funds.');
        }

        const transaction = new Transaction({
            book: bookId,
            user: userId,
            type: 'purchase',
            status: 'completed',
            price: book.price,
        });

        await transaction.save();

        await bookService.updateBookCopies(bookId, -1);

        userService.updateUserFunds(userId, -book.price);
        return transaction;
    }

    async getUserTransactions(userId) {
        return Transaction.find({ user: userId }).populate('book').sort({ createdAt: -1 }).lean();
    }

    async getBookTransactions(bookId) {
        return Transaction.find({ book: bookId }).populate('user').sort({ createdAt: -1 }).lean();
    }

    async getOverdueTransactions() {
        const today = new Date();
        return Transaction.find({
            type: 'borrow',
            status: 'active',
            dueDate: { $lt: today },
        })
            .populate('book')
            .populate('user')
            .lean();
    }

    async getAllTransactions() {
        return Transaction.find()
            .populate('book')
            .populate('user', '-passwordHash')
            .sort({ createdAt: -1 })
            .lean();
    }
}

export default new LibraryService();

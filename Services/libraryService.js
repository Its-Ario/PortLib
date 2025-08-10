import { findById, findByIdAndUpdate } from '../Models/Book';
import { findById as _findById, findByIdAndUpdate as _findByIdAndUpdate } from '../Models/User';
import Transaction, { findById as __findById, find } from '../Models/Transaction';

class LibraryService {
    async borrowBook(bookId, userId, durationDays = 14) {
        const book = await findById(bookId);
        const user = await _findById(userId);

        if (!book || !user) {
        throw new Error('Book or user not found');
        }

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
        dueDate: dueDate,
        status: 'active'
        });

        await transaction.save();
        book.copiesAvailable -= 1;
        await book.save();

        return transaction;
    }

    async returnBook(transactionId) {
        const transaction = await __findById(transactionId)
        .populate('book')
        .populate('user');

        if (!transaction || transaction.type !== 'borrow') {
        throw new Error('Transaction not found or not a borrowing transaction');
        }

        if (transaction.status === 'completed') {
        throw new Error('Book already returned');
        }

        const today = new Date();
        
        if (today > transaction.dueDate) {
        transaction.status = 'overdue';
        const daysLate = Math.floor((today - transaction.dueDate) / (1000 * 60 * 60 * 24));
        const fine = daysLate * 0.50;
        
        await _findByIdAndUpdate(transaction.user._id, {
            $inc: { balance: -fine }
        });
        }

        transaction.status = 'completed';
        transaction.returnDate = today;
        await transaction.save();

        await findByIdAndUpdate(transaction.book._id, {
        $inc: { copiesAvailable: 1 }
        });

        return transaction;
    }

    async sellBook(bookId, userId) {
        const book = await findById(bookId);
        const user = await _findById(userId);

        if (!book || !user) {
        throw new Error('Book or user not found');
        }

        if (book.copiesAvailable <= 0 || !book.forSale) {
        throw new Error('Book is not available for sale');
        }

        if (user.balance < book.price) {
        throw new Error('Insufficient funds');
        }

        const transaction = new Transaction({
        book: bookId,
        user: userId,
        type: 'purchase',
        status: 'completed',
        price: book.price
        });

        await transaction.save();
        
        book.copiesAvailable -= 1;
        await book.save();
        
        user.balance -= book.price;
        await user.save();

        return transaction;
    }

    async getUserTransactions(userId) {
        return find({ user: userId })
        .populate('book')
        .sort({ createdAt: -1 });
    }

    async getBookTransactions(bookId) {
        return find({ book: bookId })
        .populate('user')
        .sort({ createdAt: -1 });
    }

    async getOverdueTransactions() {
        const today = new Date();
        return find({
        type: 'borrow',
        status: 'active',
        dueDate: { $lt: today }
        })
        .populate('book')
        .populate('user');
    }

    async addUserFunds(userId, amount) {
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }
        
        const user = await _findByIdAndUpdate(
            userId,
            { $inc: { balance: amount } },
            { new: true }
        );
        
        if (!user) {
            throw new Error('User not found');
        }
        
        return user;
    }

    async getAllTransactions() {
        return find()
            .populate('book')
            .populate('user', '-password')
            .sort({ createdAt: -1 });
    }
}

export default new LibraryService();
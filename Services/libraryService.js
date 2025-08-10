import Book from '../Models/Book.js';
import User from '../Models/User.js';
import Transaction from '../Models/Transaction.js';

class LibraryService {
    async borrowBook(bookId, userId, durationDays = 14) {
        const book = await Book.findById(bookId);
        if (!book) throw new Error('Book not found');

        const user = await User.findById(userId);
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
        book.copiesAvailable -= 1;
        await book.save();

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

            await User.findByIdAndUpdate(transaction.user._id, {
                $inc: { balance: -fine },
            });
        }

        transaction.status = 'completed';
        transaction.returnDate = today;
        await transaction.save();

        await Book.findByIdAndUpdate(transaction.book._id, {
            $inc: { copiesAvailable: 1 },
        });

        return transaction;
    }

    async sellBook(bookId, userId) {
        const book = await Book.findById(bookId);
        if (!book) throw new Error('Book not found');

        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

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
            price: book.price,
        });

        await transaction.save();

        book.copiesAvailable -= 1;
        await book.save();

        user.balance -= book.price;
        await user.save();

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

    async addUserFunds(userId, amount) {
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }

        const user = await User.findByIdAndUpdate(
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
        return Transaction.find()
            .populate('book')
            .populate('user', '-password')
            .sort({ createdAt: -1 })
            .lean();
    }
}

export default new LibraryService();

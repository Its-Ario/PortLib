import bookService from './bookService.js';
import transactionService from './transactionService.js';
import userService from './userService.js';
import logger from '../logger.js';

class LibraryService {
    async borrowBook(bookId, userId, durationDays = 14) {
        try {
            logger.info(`Borrow attempt: user ${userId} wants book ${bookId}`);
            const book = await bookService.getBookById(bookId);
            if (!book) {
                logger.warn(`Book ${bookId} not found`);
                throw new Error('Book not found');
            }

            const user = await userService.getUserProfile(userId);
            if (!user) {
                logger.warn(`User ${userId} not found`);
                throw new Error('User not found');
            }

            if (book.copiesAvailable <= 0) {
                logger.warn(`No copies available for book ${bookId}`);
                throw new Error('No copies available for borrowing');
            }

            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + durationDays);

            const transaction = await transactionService.createTransaction({
                book: bookId,
                user: userId,
                type: 'borrow',
                startDate: new Date(),
                dueDate,
                status: 'active',
            });
            logger.info(`Transaction created: ${transaction._id} for user ${userId}`);

            await bookService.updateBookCopies(bookId, -1);
            logger.info(`Book ${bookId} copies decremented`);

            return transaction;
        } catch (error) {
            logger.error(`Failed to borrow book: ${error.message}`, error);
            throw error;
        }
    }

    async returnBook(transactionId) {
        try {
            logger.info(`Returning transaction ${transactionId}`);
            const transaction = await transactionService.getTransactionById(transactionId);

            if (!transaction || transaction.type !== 'borrow') {
                logger.warn(`Transaction ${transactionId} not found or invalid`);
                throw new Error('Transaction not found or not a borrowing transaction');
            }

            if (transaction.status === 'completed') {
                logger.warn(`Transaction ${transactionId} already completed`);
                throw new Error('Book already returned');
            }

            const today = new Date();

            if (today > transaction.dueDate && transaction.status === 'active') {
                const daysLate = Math.floor(
                    (today.getTime() - transaction.dueDate.getTime()) / (1000 * 60 * 60 * 24)
                );
                const fine = daysLate * 0.5;
                await userService.updateUserFunds(transaction.user._id, -fine);
                logger.info(`Applied fine of ${fine} to user ${transaction.user._id}`);
            }

            const updatedTransaction = await transactionService.updateTransactionStatus(
                transactionId,
                'completed',
                { returnDate: today }
            );
            logger.info(`Transaction ${transactionId} marked completed`);

            await bookService.updateBookCopies(transaction.book._id, 1);
            logger.info(`Book ${transaction.book._id} copies incremented`);

            return updatedTransaction;
        } catch (error) {
            logger.error(`Failed to return book: ${error.message}`, error);
            throw error;
        }
    }

    async sellBook(bookId, userId) {
        try {
            logger.info(`Sell attempt: user ${userId} wants book ${bookId}`);
            const book = await bookService.getBookById(bookId);
            if (!book) {
                logger.warn(`Book ${bookId} not found`);
                throw new Error('Book not found');
            }

            const user = await userService.getUserProfile(userId);
            if (!user) {
                logger.warn(`User ${userId} not found`);
                throw new Error('User not found');
            }

            if (book.copiesAvailable <= 0 || !book.forSale) {
                logger.warn(`Book ${bookId} not available for sale`);
                throw new Error('Book is not available for sale.');
            }

            if (user.balance < book.price) {
                logger.warn(`User ${userId} has insufficient funds`);
                throw new Error('Insufficient funds.');
            }

            const transaction = await transactionService.createTransaction({
                book: bookId,
                user: userId,
                type: 'purchase',
                status: 'completed',
                price: book.price,
            });
            logger.info(`Transaction created: ${transaction._id} for purchase`);

            await bookService.updateBookCopies(bookId, -1);
            await userService.updateUserFunds(userId, -book.price);
            logger.info(`Book ${bookId} sold to user ${userId}, copies and balance updated`);

            return transaction;
        } catch (error) {
            logger.error(`Failed to sell book: ${error.message}`, error);
            throw error;
        }
    }
}

export default new LibraryService();

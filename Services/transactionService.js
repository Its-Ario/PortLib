import logger from '../logger.js';
import Transaction from '../Models/Transaction.js';
import bookService from './bookService.js';
import userService from './userService.js';

class TransactionService {
    async createTransaction(transactionData) {
        try {
            await this._validateTransactionData(transactionData);

            const transaction = new Transaction({
                ...transactionData,
                status: transactionData.status || 'active',
            });

            const savedTransaction = await transaction.save();
            logger.info(`Transaction created: ${transaction._id}`);

            return savedTransaction;
        } catch (error) {
            logger.error(`Failed to create transaction: ${error.message}`, error);
            throw error;
        }
    }

    async getTransactionById(transactionId) {
        try {
            if (!transactionId) throw new Error('Transaction ID is required');

            const transaction = await Transaction.findById(transactionId)
                .populate('book', 'title author isbn copiesAvailable')
                .populate('user', 'name email')
                .lean();

            if (!transaction) {
                logger.warn(`Transaction not found: ${transactionId}`);
                return null;
            }

            return transaction;
        } catch (error) {
            logger.error(`Failed to get transaction ${transactionId}: ${error.message}`, error);
            throw new Error(`Failed to retrieve transaction: ${error.message}`);
        }
    }

    async getUserTransactions(userId, options = {}) {
        return this._getPaginatedTransactions({ user: userId }, options, `user ${userId}`);
    }

    async getBookTransactions(bookId, options = {}) {
        return this._getPaginatedTransactions({ book: bookId }, options, `book ${bookId}`);
    }

    async getAllTransactions(options = {}) {
        return this._getPaginatedTransactions({}, options, 'all');
    }

    async getOverdueTransactions(graceDays = 0) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - graceDays);

            const overdueTransactions = await Transaction.find({
                status: { $in: ['active', 'overdue'] },
                type: 'borrow',
                dueDate: { $lt: cutoffDate },
            })
                .populate('user', 'name email phone')
                .populate('book', 'title author isbn')
                .sort({ dueDate: 1 })
                .lean();

            logger.info(`Found ${overdueTransactions.length} overdue transactions`);
            return overdueTransactions;
        } catch (error) {
            logger.error(`Failed to get overdue transactions: ${error.message}`, error);
            throw new Error(`Failed to retrieve overdue transactions: ${error.message}`);
        }
    }

    async updateTransactionStatus(transactionId, status, additionalData = {}) {
        try {
            if (!transactionId || !status) {
                throw new Error('Transaction ID and status are required');
            }

            const validStatuses = ['active', 'completed', 'overdue'];
            if (!validStatuses.includes(status)) {
                throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
            }

            const updateData = { status, ...additionalData };
            if (status === 'completed') updateData.returnDate = new Date();

            const transaction = await Transaction.findByIdAndUpdate(transactionId, updateData, {
                new: true,
                runValidators: true,
            });

            if (!transaction) throw new Error('Transaction not found');

            logger.info(`Transaction ${transactionId} status updated to ${status}`);
            return transaction;
        } catch (error) {
            logger.error(`Failed to update transaction ${transactionId}: ${error.message}`, error);
            throw new Error(`Failed to update transaction: ${error.message}`);
        }
    }

    async getUserTransactionStats(userId) {
        try {
            if (!userId) throw new Error('User ID is required');

            const stats = await Transaction.aggregate([
                { $match: { user: userId } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]);

            const result = { total: 0, active: 0, completed: 0, overdue: 0 };
            stats.forEach((stat) => {
                result[stat._id] = stat.count;
                result.total += stat.count;
            });

            return result;
        } catch (error) {
            logger.error(`Failed to get stats for user ${userId}: ${error.message}`, error);
            throw new Error(`Failed to retrieve transaction statistics: ${error.message}`);
        }
    }

    async markOverdueTransactions() {
        try {
            const result = await Transaction.updateMany(
                {
                    status: 'active',
                    type: 'borrow',
                    dueDate: { $lt: new Date() },
                },
                { status: 'overdue' }
            );

            logger.info(`Marked ${result.modifiedCount} transactions as overdue`);
            return result.modifiedCount;
        } catch (error) {
            logger.error(`Failed to mark overdue transactions: ${error.message}`, error);
            throw new Error(`Failed to mark overdue transactions: ${error.message}`);
        }
    }

    async _validateTransactionData(transactionData) {
        const requiredFields = ['user', 'book', 'type'];
        const missingFields = requiredFields.filter((field) => !transactionData[field]);
        if (missingFields.length) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        const validTypes = ['borrow', 'purchase'];
        if (!validTypes.includes(transactionData.type)) {
            throw new Error(`Invalid transaction type. Must be one of: ${validTypes.join(', ')}`);
        }

        if (transactionData.type === 'borrow' && !transactionData.dueDate) {
            throw new Error('Due date is required for borrow transactions');
        }

        if (transactionData.type === 'purchase' && !transactionData.price) {
            throw new Error('Price is required for purchase transactions');
        }

        const book = await bookService.getBookById(transactionData.book);
        if (!book) {
            throw new Error('Book not found');
        }

        const user = await userService.getUserProfile(transactionData.user);
        if (!user) {
            throw new Error('User not found');
        }
    }

    async _getPaginatedTransactions(baseQuery, options, contextLabel) {
        try {
            if (baseQuery.user && !baseQuery.user) {
                throw new Error('User ID is required');
            }
            if (baseQuery.book && !baseQuery.book) {
                throw new Error('Book ID is required');
            }

            const { page = 1, limit = 10, status, type, sort = { createdAt: -1 } } = options;

            const query = { ...baseQuery };
            if (status) query.status = status;
            if (type) query.type = type;

            const skip = (page - 1) * limit;

            const [transactions, total] = await Promise.all([
                Transaction.find(query)
                    .populate('book', 'title author isbn')
                    .populate('user', 'name email')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Transaction.countDocuments(query),
            ]);

            return {
                transactions,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error(
                `Failed to retrieve transactions for ${contextLabel}: ${error.message}`,
                error
            );
            throw new Error(`Failed to retrieve transactions: ${error.message}`);
        }
    }
}

export default new TransactionService();

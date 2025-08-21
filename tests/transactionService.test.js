import transactionService from '../Services/transactionService.js';
import Transaction from '../Models/Transaction.js';
import Book from '../Models/Book.js';
import User from '../Models/User.js';

async function createObjects() {
    const user = await User.create({
        username: 'u',
        balance: 20,
        passwordHash: '1',
        email: 'a@b.com',
        type: 'user',
    });
    const book = await Book.create({
        copiesAvailable: 2,
        submittedBy: user._id,
        author: 'a',
        title: 't',
        isbn: 'i',
    });

    const transaction = await Transaction.create({
        user: user.id,
        book: book.id,
        price: 20,
        type: 'purchase',
        createdAt: new Date(),
    });

    return { user, book, transaction };
}

describe('transactionService', () => {
    describe('createTransaction', () => {
        let user, book, data;

        beforeEach(async () => {
            ({ user, book } = await createObjects());
            data = { user: user.id, book: book.id, price: 20, type: 'purchase' };
        });
        it('should create a transaction successfully', async () => {
            const result = await transactionService.createTransaction(data);

            expect(result.status).toBe('active');
            expect(result.price).toBe(20);
        });

        it('should throw an error if user not found', async () => {
            await user.deleteOne();

            await expect(transactionService.createTransaction(data)).rejects.toThrow(
                'User not found'
            );
        });

        it('should throw an error if book not found', async () => {
            await book.deleteOne();

            await expect(transactionService.createTransaction(data)).rejects.toThrow(
                'Book not found'
            );
        });
    });

    describe('getTransactionById', () => {
        it('should return a transaction by ID', async () => {
            const { transaction } = await createObjects();
            const result = await transactionService.getTransactionById(transaction.id);

            expect(result._id).toEqual(transaction._id);
            expect(result.price).toBe(20);
        });
    });

    describe('getAllTransactions', () => {
        it('should return a list of transactions', async () => {
            const { book, user, transaction } = await createObjects();

            await Transaction.create({
                user: user.id,
                book: book.id,
                price: 20,
                type: 'purchase',
                createdAt: new Date(),
            });

            const result = await transactionService.getAllTransactions();

            expect(result.transactions.length).toBe(2);
            expect(result.transactions[1]._id).toStrictEqual(transaction._id);
        });
    });
});

import LibraryService from '../Services/libraryService.js';
import Book from '../Models/Book.js';
import User from '../Models/User.js';
import Transaction from '../Models/Transaction.js';
import { expect } from '@jest/globals';

async function createBookAndUser() {
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
    return { user, book };
}

describe('LibraryService', () => {
    describe('LibraryService.borrowBook', () => {
        let user, book;

        beforeEach(async () => {
            ({ user, book } = await createBookAndUser());
        });

        it('should borrow a book successfully', async () => {
            await LibraryService.borrowBook(book.id.toString(), user.id.toString());

            const updatedBook = await Book.findById(book._id);
            expect(updatedBook.copiesAvailable).toBe(1);
        });

        it('throws if book not found', async () => {
            await book.deleteOne();

            await expect(
                LibraryService.borrowBook(book._id.toString(), user._id.toString())
            ).rejects.toThrow('Book not found');
        });

        it('throws if no copies available', async () => {
            book.copiesAvailable = 0;
            await book.save();

            await expect(
                LibraryService.borrowBook(book._id.toString(), user._id.toString())
            ).rejects.toThrow('No copies available for borrowing');
        });
    });

    describe('returnBook', () => {
        let user, book;

        beforeEach(async () => {
            ({ user, book } = await createBookAndUser());
        });

        it('should complete a return successfully', async () => {
            const transaction = await Transaction.create({
                type: 'borrow',
                status: 'active',
                dueDate: new Date(Date.now() + 86400000),
                book: book._id,
                user: user._id,
            });

            const result = await LibraryService.returnBook(transaction._id.toString());

            expect(result.status).toBe('completed');
        });

        it('throws if transaction not found or not a borrowing transaction', async () => {
            const transaction = await Transaction.create({
                type: 'borrow',
                status: 'active',
                dueDate: new Date(Date.now() + 86400000),
                book: book._id,
                user: user._id,
            });

            await transaction.deleteOne();

            await expect(LibraryService.returnBook(transaction._id.toString())).rejects.toThrow(
                'Transaction not found or not a borrowing transaction'
            );
        });

        it('throws if book already returned', async () => {
            const transaction = await Transaction.create({
                type: 'borrow',
                status: 'completed',
                dueDate: new Date(Date.now() + 86400000),
                book: book._id,
                user: user._id,
            });

            await expect(LibraryService.returnBook(transaction._id.toString())).rejects.toThrow(
                'Book already returned'
            );
        });

        it('applies fine if late', async () => {
            const pastDueDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            const today = new Date();

            const daysLate = Math.floor(
                (today.getTime() - pastDueDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            const fine = daysLate * 0.5;

            const transaction = await Transaction.create({
                type: 'borrow',
                status: 'active',
                dueDate: pastDueDate,
                book: book._id,
                user: user._id,
            });

            await LibraryService.returnBook(transaction._id.toString());
            const userBal = user.balance;

            user = await User.findById(user.id);

            expect(user.balance).toBe(userBal - fine);
        });
    });

    describe('sellBook', () => {
        let user, book;

        beforeEach(async () => {
            ({ user, book } = await createBookAndUser());
            book.forSale = true;
            book.price = 10;
            await book.save();
        });

        it('should sell a book successfully', async () => {
            await LibraryService.sellBook(book._id.toString(), user._id.toString());

            book = await Book.findById(book._id);
            user = await User.findById(user._id);

            expect(book.copiesAvailable).toBe(1);
            expect(user.balance).toBe(10);
        });

        it('throws if book not found', async () => {
            await book.deleteOne();
            await expect(LibraryService.sellBook(book._id, user._id)).rejects.toThrow(
                'Book not found'
            );
        });

        it('throws if user has insufficient funds', async () => {
            user.balance = 0;
            await user.save();

            await expect(LibraryService.sellBook(book._id, user._id)).rejects.toThrow(
                'Insufficient funds'
            );
        });
    });
});

import mockingoose from 'mockingoose';
import LibraryService from '../Services/libraryService.js';
import Book from '../Models/Book.js';
import User from '../Models/User.js';
import Transaction from '../Models/Transaction.js';
import { jest } from '@jest/globals';
import { Types } from 'mongoose';

const bookId = new Types.ObjectId();
const userId = new Types.ObjectId();
const transId = new Types.ObjectId();

describe('LibraryService', () => {
    beforeEach(() => {
        mockingoose.resetAll();
    });

    describe('LibraryService.borrowBook', () => {
        beforeEach(() => {
            mockingoose.resetAll();
        });

        it('should borrow a book successfully', async () => {
            const fakeBook = {
                _id: bookId,
                copiesAvailable: 2,
                submittedBy: userId,
                author: 'test',
                title: 'Test Book',
                isbn: 'ISBN',
                save: jest.fn().mockResolvedValue(true),
            };

            const fakeUser = { _id: userId };

            const fakeTransaction = {
                save: jest.fn().mockResolvedValue(true),
            };

            mockingoose(Book).toReturn(fakeBook, 'findOne');
            mockingoose(User).toReturn(fakeUser, 'findOne');

            jest.spyOn(Transaction.prototype, 'save').mockImplementation(fakeTransaction.save);

            mockingoose(Book).toReturn({ _id: bookId, copiesAvailable: 1 }, 'findOneAndUpdate');

            await LibraryService.borrowBook(bookId.toString(), userId.toString());

            expect(fakeTransaction.save).toHaveBeenCalled();

            const updatedBook = await Book.findById(bookId);
            expect(updatedBook.copiesAvailable).toBe(2);

            const updatedBookAfterUpdate = await Book.findByIdAndUpdate(
                bookId,
                { $inc: { copiesAvailable: -1 } },
                { new: true }
            );
            expect(updatedBookAfterUpdate.copiesAvailable).toBe(1);
        });

        it('throws if book not found', async () => {
            mockingoose(Book).toReturn(null, 'findOne');
            await expect(
                LibraryService.borrowBook(bookId.toString(), userId.toString())
            ).rejects.toThrow('Book not found');
        });

        it('throws if no copies available', async () => {
            mockingoose(Book).toReturn({ copiesAvailable: 0 }, 'findOne');
            mockingoose(User).toReturn({ _id: userId }, 'findOne');
            await expect(
                LibraryService.borrowBook(bookId.toString(), userId.toString())
            ).rejects.toThrow('No copies available for borrowing');
        });
    });

    describe('returnBook', () => {
        it('should complete a return successfully', async () => {
            const transaction = {
                _id: transId,
                type: 'borrow',
                status: 'active',
                dueDate: new Date(Date.now() + 86400000),
                save: jest.fn().mockResolvedValue(true),
                book: { _id: bookId },
                user: { _id: userId },
            };

            mockingoose(Transaction).toReturn(transaction, 'findOne');

            mockingoose(User).toReturn({ _id: userId }, 'findOneAndUpdate');

            mockingoose(Book).toReturn({ _id: bookId }, 'findOneAndUpdate');

            jest.spyOn(Transaction.prototype, 'save').mockImplementation(transaction.save);

            const result = await LibraryService.returnBook(transId.toString());

            expect(result.status).toBe('completed');
            expect(transaction.save).toHaveBeenCalled();
        });

        it('throws if transaction not found or not a borrowing transaction', async () => {
            mockingoose(Transaction).toReturn(null, 'findOne');
            await expect(LibraryService.returnBook(transId.toString())).rejects.toThrow(
                'Transaction not found or not a borrowing transaction'
            );
        });

        it('throws if book already returned', async () => {
            mockingoose(Transaction).toReturn({ type: 'borrow', status: 'completed' }, 'findOne');
            await expect(LibraryService.returnBook(transId.toString())).rejects.toThrow(
                'Book already returned'
            );
        });

        it('marks transaction overdue and applies fine if late', async () => {
            const pastDueDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            const transaction = {
                _id: transId,
                type: 'borrow',
                status: 'active',
                dueDate: pastDueDate,
                save: jest.fn().mockResolvedValue(true),
                book: { _id: bookId },
                user: { _id: userId },
            };

            mockingoose(Transaction).toReturn(transaction, 'findOne');

            const userUpdateMock = jest.fn().mockResolvedValue({ _id: userId });
            mockingoose(User).toReturn({ _id: userId }, 'findOneAndUpdate');
            jest.spyOn(User, 'findByIdAndUpdate').mockImplementation(userUpdateMock);

            mockingoose(Book).toReturn({ _id: bookId }, 'findOneAndUpdate');

            jest.spyOn(Transaction.prototype, 'save').mockImplementation(transaction.save);

            const result = await LibraryService.returnBook(transId.toString());

            expect(result.status).toBe('completed');
            expect(transaction.save).toHaveBeenCalled();
            expect(userUpdateMock).toHaveBeenCalled();
        });
    });

    describe('sellBook', () => {
        it('should sell a book successfully', async () => {
            const fakeBook = {
                _id: bookId,
                copiesAvailable: 2,
                forSale: true,
                price: 10,
                save: jest.fn().mockResolvedValue(true),
            };
            const fakeUser = {
                _id: userId,
                balance: 20,
                save: jest.fn().mockResolvedValue(true),
            };
            const fakeTransaction = {
                save: jest.fn().mockResolvedValue(true),
            };

            mockingoose(Book).toReturn(fakeBook, 'findOne');
            mockingoose(User).toReturn(fakeUser, 'findOne');

            jest.spyOn(Transaction.prototype, 'save').mockImplementation(fakeTransaction.save);

            mockingoose(Book).toReturn({ _id: bookId, copiesAvailable: 1 }, 'findOneAndUpdate');

            const result = await LibraryService.sellBook(bookId.toString(), userId.toString());

            expect(result.save).toHaveBeenCalled();
            expect(fakeBook.copiesAvailable).toBe(2);

            const updatedBook = await Book.findByIdAndUpdate(
                bookId,
                { $inc: { copiesAvailable: -1 } },
                { new: true }
            );
            expect(updatedBook.copiesAvailable).toBe(1);

            expect(fakeUser.balance).toBe(20);
        });

        it('throws if book not found', async () => {
            mockingoose(Book).toReturn(null, 'findOne');
            await expect(LibraryService.sellBook(bookId, userId)).rejects.toThrow('Book not found');
        });

        it('throws if user has insufficient funds', async () => {
            mockingoose(Book).toReturn({ copiesAvailable: 1, forSale: true, price: 10 }, 'findOne');
            mockingoose(User).toReturn({ balance: 5 }, 'findOne');
            await expect(LibraryService.sellBook(bookId, userId)).rejects.toThrow(
                'Insufficient funds'
            );
        });
    });
});

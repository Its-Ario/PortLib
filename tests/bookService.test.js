import { jest } from '@jest/globals';
import BookService from '../Services/bookService.js';
import Book from '../Models/Book.js';

jest.mock('../Models/Book.js');

const MockedBook = Book;

describe('BookService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('getApprovedBooks returns approved books', async () => {
        const mockBooks = [{ title: 'Book 1' }, { title: 'Book 2' }];
        const mockLean = jest.fn().mockResolvedValue(mockBooks);
        MockedBook.find = jest.fn().mockReturnValue({ lean: mockLean });

        const result = await BookService.getApprovedBooks();
        expect(MockedBook.find).toHaveBeenCalledWith({ approved: true });
        expect(mockLean).toHaveBeenCalled();
        expect(result).toEqual(mockBooks);
    });

    test('addBook creates and saves a new book', async () => {
        const bookData = {
            title: 'New Book',
            isbn: '123',
            author: 'Author',
            publicationYear: 2023,
            copiesAvailable: 5,
        };
        const userId = '507f1f77bcf86cd799439011';

        const saveMock = jest.fn().mockResolvedValue('savedBook');
        jest.spyOn(Book.prototype, 'save').mockImplementation(saveMock);

        const result = await BookService.addBook(bookData, userId);
        expect(saveMock).toHaveBeenCalled();
        expect(result).toEqual('savedBook');
    }, 10000);

    test('getPendingBooks returns pending books with populate and lean', async () => {
        const pendingBooks = [{ title: 'Pending Book' }];

        const mockLean = jest.fn().mockResolvedValue(pendingBooks);
        const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
        const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
        const mockPopulate = jest.fn().mockReturnValue({ skip: mockSkip });
        MockedBook.find = jest.fn().mockReturnValue({ populate: mockPopulate });

        const result = await BookService.getPendingBooks();

        expect(MockedBook.find).toHaveBeenCalledWith({ approved: false });
        expect(mockPopulate).toHaveBeenCalledWith('submittedBy', 'username');
        expect(mockSkip).toHaveBeenCalledWith(0);
        expect(mockLimit).toHaveBeenCalledWith(20);
        expect(mockLean).toHaveBeenCalled();
        expect(result).toEqual(pendingBooks);
    });

    test('approveBook updates book approval', async () => {
        const updatedBook = { approved: true };
        MockedBook.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedBook);

        const result = await BookService.approveBook('bookId');
        expect(MockedBook.findByIdAndUpdate).toHaveBeenCalledWith(
            'bookId',
            { approved: true },
            { new: true }
        );
        expect(result).toEqual(updatedBook);
    });

    test('updateBook updates book fields', async () => {
        const updatedBook = { title: 'Updated Title' };
        MockedBook.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedBook);

        const result = await BookService.updateBook('bookId', { title: 'Updated Title' });
        expect(MockedBook.findByIdAndUpdate).toHaveBeenCalledWith(
            'bookId',
            { title: 'Updated Title' },
            { new: true }
        );
        expect(result).toEqual(updatedBook);
    });

    test('deleteBook deletes book by id', async () => {
        const deletedBook = { _id: 'bookId' };
        MockedBook.findByIdAndDelete = jest.fn().mockResolvedValue(deletedBook);

        const result = await BookService.deleteBook('bookId');
        expect(MockedBook.findByIdAndDelete).toHaveBeenCalledWith('bookId');
        expect(result).toEqual(deletedBook);
    });

    test('markBookForSale sets price and forSale flag', async () => {
        const updatedBook = { price: 20, forSale: true };
        MockedBook.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedBook);

        const result = await BookService.markBookForSale('bookId', 20);
        expect(MockedBook.findByIdAndUpdate).toHaveBeenCalledWith(
            'bookId',
            { forSale: true, price: 20 },
            { new: true }
        );
        expect(result).toEqual(updatedBook);
    });

    test('removeBookFromSale unsets forSale and price', async () => {
        const updatedBook = { forSale: false, price: 0 };
        MockedBook.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedBook);

        const result = await BookService.removeBookFromSale('bookId');

        expect(MockedBook.findByIdAndUpdate).toHaveBeenCalledWith(
            'bookId',
            { forSale: false },
            { new: true }
        );
        expect(result).toEqual(updatedBook);
    });

    test('getBooksForSale returns books where forSale is true', async () => {
        const booksForSale = [{ title: 'For Sale Book' }];

        const mockLean = jest.fn().mockResolvedValue(booksForSale);
        const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
        const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
        MockedBook.find = jest.fn().mockReturnValue({ skip: mockSkip });

        const result = await BookService.getBooksForSale();

        expect(MockedBook.find).toHaveBeenCalledWith({
            approved: true,
            forSale: true,
            copiesAvailable: { $gt: 0 },
        });
        expect(mockSkip).toHaveBeenCalledWith(0);
        expect(mockLimit).toHaveBeenCalledWith(20);
        expect(mockLean).toHaveBeenCalled();
        expect(result).toEqual(booksForSale);
    });

    test('getBookById returns book by id', async () => {
        const book = { _id: 'bookId', title: 'Book Title' };
        const mockLean = jest.fn().mockResolvedValue(book);
        MockedBook.findById = jest.fn().mockReturnValue({ lean: mockLean });

        const result = await BookService.getBookById('bookId');
        expect(MockedBook.findById).toHaveBeenCalledWith('bookId');
        expect(mockLean).toHaveBeenCalled();
        expect(result).toEqual(book);
    });
});

import bookService from '../services/bookService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listBooks = asyncHandler(async (req, res) => {
    const books = await bookService.getApprovedBooks();
    res.json(books);
});

export const addBook = asyncHandler(async (req, res) => {
    const savedBook = await bookService.addBook(req.body, req.user.id);
    res.json(savedBook);
});

export const getPendingBooks = asyncHandler(async (req, res) => {
    const pendingBooks = await bookService.getPendingBooks();
    res.json(pendingBooks);
});

export const approveBook = asyncHandler(async (req, res) => {
    const updated = await bookService.approveBook(req.params.id);
    if (!updated) {
        return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json(updated);
});

export const getBookById = asyncHandler(async (req, res) => {
    const book = await bookService.getBookById(req.params.id);
    if (!book) {
        return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json(book);
});

export const updateBook = asyncHandler(async (req, res) => {
    const updated = await bookService.updateBook(req.params.id, req.body);
    if (!updated) {
        return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json(updated);
});

export const deleteBook = asyncHandler(async (req, res) => {
    const deleted = await bookService.deleteBook(req.params.id);
    if (!deleted) {
        return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json({ success: true, message: 'Book deleted successfully' });
});

export const markBookForSale = asyncHandler(async (req, res) => {
    const { price } = req.body;
    const updated = await bookService.markBookForSale(req.params.id, price);
    if (!updated) {
        return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json(updated);
});

export const removeBookFromSale = asyncHandler(async (req, res) => {
    const updated = await bookService.removeBookFromSale(req.params.id);
    if (!updated) {
        return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json(updated);
});

export const getBooksForSale = asyncHandler(async (req, res) => {
    const books = await bookService.getBooksForSale();
    res.json(books);
});

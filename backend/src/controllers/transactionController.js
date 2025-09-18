import libraryService from '../services/libraryService.js';
import transactionService from '../services/transactionService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const borrowBook = asyncHandler(async (req, res) => {
    const { bookId, durationDays } = req.body;
    const userId = req.user.id;

    const transaction = await libraryService.borrowBook(bookId, userId, durationDays);

    res.status(200).json({ success: true, data: transaction });
});

export const returnBook = asyncHandler(async (req, res) => {
    const { transactionId } = req.params;

    const transaction = await libraryService.returnBook(transactionId);

    res.status(200).json({ success: true, data: transaction });
});

export const purchaseBook = asyncHandler(async (req, res) => {
    const { bookId } = req.body;
    const userId = req.user.id;

    const transaction = await libraryService.sellBook(bookId, userId);

    res.status(200).json({ success: true, data: transaction });
});

export const getUserTransactions = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const transactions = await transactionService.getUserTransactions(userId);

    res.status(200).json({ success: true, data: transactions });
});

export const getBookTransactions = asyncHandler(async (req, res) => {
    const { bookId } = req.params;

    const transactions = await transactionService.getBookTransactions(bookId);

    res.status(200).json({ success: true, data: transactions });
});

export const getOverdueTransactions = asyncHandler(async (req, res) => {
    const transactions = await transactionService.getOverdueTransactions();

    res.status(200).json({ success: true, data: transactions });
});

export const addFunds = asyncHandler(async (req, res) => {
    const { amount } = req.body;
    const userId = req.user.id;

    const user = await libraryService.addUserFunds(userId, amount);

    res.status(200).json({ success: true, data: { balance: user.balance } });
});

export const getAllTransactions = asyncHandler(async (req, res) => {
    const transactions = await transactionService.getAllTransactions();

    res.status(200).json({ success: true, data: transactions });
});

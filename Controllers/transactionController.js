import libraryService from '../Services/libraryService';

export async function borrowBook(req, res) {
    try {
        const { bookId, durationDays } = req.body;
        const userId = req.user.id;

        const transaction = await libraryService.borrowBook(bookId, userId, durationDays);

        res.status(200).json({
            success: true,
            data: transaction,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

export async function returnBook(req, res) {
    try {
        const { transactionId } = req.params;

        const transaction = await libraryService.returnBook(transactionId);

        res.status(200).json({
            success: true,
            data: transaction,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

export async function purchaseBook(req, res) {
    try {
        const { bookId } = req.body;
        const userId = req.user.id;

        const transaction = await libraryService.sellBook(bookId, userId);

        res.status(200).json({
            success: true,
            data: transaction,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

export async function getUserTransactions(req, res) {
    try {
        const userId = req.user.id;

        const transactions = await libraryService.getUserTransactions(userId);

        res.status(200).json({
            success: true,
            data: transactions,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

export async function getBookTransactions(req, res) {
    try {
        const { bookId } = req.params;

        const transactions = await libraryService.getBookTransactions(bookId);

        res.status(200).json({
            success: true,
            data: transactions,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

export async function getOverdueTransactions(req, res) {
    try {
        const transactions = await libraryService.getOverdueTransactions();

        res.status(200).json({
            success: true,
            data: transactions,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

export async function addFunds(req, res) {
    try {
        const { amount } = req.body;
        const userId = req.user.id;

        const user = await libraryService.addUserFunds(userId, amount);

        res.status(200).json({
            success: true,
            data: {
                balance: user.balance,
            },
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

export async function getAllTransactions(req, res) {
    try {
        const transactions = await libraryService.getAllTransactions();

        res.status(200).json({
            success: true,
            data: transactions,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

const LibraryService = require('../Services/libraryService');

exports.borrowBook = async (req, res) => {
    try {
        const { bookId, durationDays } = req.body;
        const userId = req.user.id;
        
        const transaction = await LibraryService.borrowBook(bookId, userId, durationDays);
        
        res.status(200).json({
        success: true,
        data: transaction
        });
    } catch (error) {
        res.status(400).json({
        success: false,
        message: error.message
        });
    }
};

exports.returnBook = async (req, res) => {
    try {
        const { transactionId } = req.params;
        
        const transaction = await LibraryService.returnBook(transactionId);
        
        res.status(200).json({
        success: true,
        data: transaction
        });
    } catch (error) {
        res.status(400).json({
        success: false,
        message: error.message
        });
    }
};

exports.purchaseBook = async (req, res) => {
    try {
        const { bookId } = req.body;
        const userId = req.user.id;
        
        const transaction = await LibraryService.sellBook(bookId, userId);
        
        res.status(200).json({
        success: true,
        data: transaction
        });
    } catch (error) {
        res.status(400).json({
        success: false,
        message: error.message
        });
    }
};

exports.getUserTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const transactions = await LibraryService.getUserTransactions(userId);
        
        res.status(200).json({
        success: true,
        data: transactions
        });
    } catch (error) {
        res.status(400).json({
        success: false,
        message: error.message
        });
    }
};

exports.getBookTransactions = async (req, res) => {
    try {
        const { bookId } = req.params;
        
        const transactions = await LibraryService.getBookTransactions(bookId);
        
        res.status(200).json({
        success: true,
        data: transactions
        });
    } catch (error) {
        res.status(400).json({
        success: false,
        message: error.message
        });
    }
};

exports.getOverdueTransactions = async (req, res) => {
    try {
        // This should be limited to admin users only
        const transactions = await LibraryService.getOverdueTransactions();
        
        res.status(200).json({
        success: true,
        data: transactions
        });
    } catch (error) {
        res.status(400).json({
        success: false,
        message: error.message
        });
    }
};

exports.addFunds = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user.id;
        
        const user = await LibraryService.addUserFunds(userId, amount);
        
        res.status(200).json({
        success: true,
        data: {
            balance: user.balance
        }
        });
    } catch (error) {
        res.status(400).json({
        success: false,
        message: error.message
        });
    }
};

exports.getAllTransactions = async (req, res) => {
    try {
        const transactions = await LibraryService.getAllTransactions();
        
        res.status(200).json({
        success: true,
        data: transactions
        });
    } catch (error) {
        res.status(500).json({
        success: false,
        message: error.message
        });
    }
};
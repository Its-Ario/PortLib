const express = require('express');
const router = express.Router();
const transactionController = require('../Controllers/transactionController');
const auth = require('../Middleware/authMiddleware');

router.use(auth);

router.post('/borrow', transactionController.borrowBook);
router.put('/return/:transactionId', transactionController.returnBook);

router.post('/purchase', transactionController.purchaseBook);

router.get('/my-transactions', transactionController.getUserTransactions);
router.get('/book/:bookId', transactionController.getBookTransactions);

router.post('/add-funds', transactionController.addFunds);

router.get('/overdue', auth.isAdmin, transactionController.getOverdueTransactions);
router.get('/all', auth.isAdmin, transactionController.getAllTransactions);

module.exports = router;
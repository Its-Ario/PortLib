import { Router } from 'express';
const router = Router();
import {
    borrowBook,
    returnBook,
    purchaseBook,
    getUserTransactions,
    getBookTransactions,
    addFunds,
    getOverdueTransactions,
    getAllTransactions,
} from '../controllers/transactionController.js';
import auth, { isAdmin } from '../middleware/authMiddleware.js';

router.use(auth);

router.post('/borrow', borrowBook);
router.put('/return/:transactionId', returnBook);

router.post('/purchase', purchaseBook);

router.get('/my-transactions', getUserTransactions);
router.get('/book/:bookId', getBookTransactions);

router.post('/add-funds', addFunds);

router.get('/overdue', isAdmin, getOverdueTransactions);
router.get('/all', isAdmin, getAllTransactions);

export default router;

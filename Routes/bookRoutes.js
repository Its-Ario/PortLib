import { Router } from 'express';
import auth, { isAdmin } from '../Middleware/authMiddleware.js';
import {
    addBook,
    getPendingBooks,
    approveBook,
    updateBook,
    deleteBook,
    markBookForSale,
    removeBookFromSale,
    listBooks,
    getBooksForSale,
    getBookById,
} from '../Controllers/bookController.js';

const router = Router();

router.use(auth);

router.post('/add', isAdmin, addBook);

router.get('/pending', isAdmin, getPendingBooks);
router.patch('/approve/:id', isAdmin, approveBook);
router.put('/:id', isAdmin, updateBook);
router.delete('/:id', isAdmin, deleteBook);

router.patch('/:id/for-sale', isAdmin, markBookForSale);
router.patch('/:id/remove-from-sale', isAdmin, removeBookFromSale);

router.get('/list', listBooks);
router.get('/for-sale', getBooksForSale);
router.get('/:id', getBookById);

export default router;

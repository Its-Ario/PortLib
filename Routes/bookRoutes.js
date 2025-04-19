const express = require('express');
const auth = require('../Middleware/authMiddleware');
const bookController = require('../Controllers/bookController');

const router = express.Router();

router.use(auth);

router.post('/add', auth.isAdmin, bookController.addBook);

router.get('/pending', auth.isAdmin, bookController.getPendingBooks);
router.patch('/approve/:id', auth.isAdmin, bookController.approveBook);
router.put('/:id', auth.isAdmin, bookController.updateBook);
router.delete('/:id', auth.isAdmin, bookController.deleteBook);

router.patch('/:id/for-sale', auth.isAdmin, bookController.markBookForSale);
router.patch('/:id/remove-from-sale', auth.isAdmin, bookController.removeBookFromSale);

router.get('/list', bookController.listBooks);
router.get('/for-sale', bookController.getBooksForSale);
router.get('/:id', bookController.getBookById);

module.exports = router;
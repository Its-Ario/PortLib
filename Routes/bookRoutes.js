const express = require('express');
const Book = require('../Models/‌Book')
const { verifyToken } = require('../Middleware/authMiddleware');
const mongoose = require('mongoose');

const router = express.Router();
router.use(verifyToken);

router.get('/list', async (req, res) => {
    books = await Book.find();
    res.json(books);
});

router.post('/add', async (req, res) => {
    const {title, isbn, author, publicationYear, copiesAvailable} = req.body;

    const book = new Book({
        title,
        isbn,
        author, 
        publicationYear,
        copiesAvailable,
        submittedBy: new mongoose.Types.ObjectId(req.user.id)
    });      

    const savedBook = await book.save();
    res.json(savedBook);
})

module.exports = router;
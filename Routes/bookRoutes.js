const express = require('express');
const Book = require('../Models/‌Book')
const { verifyToken } = require('../Middleware/authMiddleware');
const mongoose = require('mongoose');

const router = express.Router();
router.use(verifyToken);

router.get('/list', async (req, res) => {
    books = await Book.find({ approved: true });
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
        approved: false,
        submittedBy: new mongoose.Types.ObjectId(String(req.user.id))
    });      

    const savedBook = await book.save();
    res.json(savedBook);
})

router.get('/pending', async (req, res) => {
    const pendingBooks = await Book.find({ approved: false }).populate("submittedBy", "username");
    res.json(pendingBooks);
});

router.patch('/approve/:id', async (req, res) => {
    const updated = await Book.findByIdAndUpdate(req.params.id, { approved: true }, {new: true});
    res.json(updated);
});

module.exports = router;
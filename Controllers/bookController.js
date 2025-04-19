const BookService = require('../Services/bookService');

exports.listBooks = async (req, res) => {
    try {
        const books = await BookService.getApprovedBooks();
        res.json(books);
    } catch (error) {
        res.status(500).json({
        success: false,
        message: error.message
        });
    }
};

exports.addBook = async (req, res) => {
    try {
        const savedBook = await BookService.addBook(req.body, req.user.id);
        res.json(savedBook);
    } catch (error) {
        res.status(400).json({
        success: false,
        message: error.message
        });
    }
};

exports.getPendingBooks = async (req, res) => {
    try {
        const pendingBooks = await BookService.getPendingBooks();
        res.json(pendingBooks);
    } catch (error) {
        res.status(500).json({
        success: false,
        message: error.message
        });
    }
};

exports.approveBook = async (req, res) => {
    try {
        const updated = await BookService.approveBook(req.params.id);
        res.json(updated);
    } catch (error) {
        res.status(400).json({
        success: false,
        message: error.message
        });
    }
};

exports.getBookById = async (req, res) => {
    try {
        const book = await BookService.getBookById(req.params.id);
        
        if (!book) {
        return res.status(404).json({
            success: false,
            message: 'Book not found'
        });
        }
        
        res.json(book);
    } catch (error) {
        res.status(500).json({
        success: false,
        message: error.message
        });
    }
};

exports.updateBook = async (req, res) => {
    try {
        const updated = await BookService.updateBook(req.params.id, req.body);
        
        if (!updated) {
        return res.status(404).json({
            success: false,
            message: 'Book not found'
        });
        }
        
        res.json(updated);
    } catch (error) {
        res.status(400).json({
        success: false,
        message: error.message
        });
    }
};

exports.deleteBook = async (req, res) => {
    try {
        const deleted = await BookService.deleteBook(req.params.id);
        
        if (!deleted) {
        return res.status(404).json({
            success: false,
            message: 'Book not found'
        });
        }
        
        res.json({
        success: true,
        message: 'Book deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
        success: false,
        message: error.message
        });
    }
};

exports.markBookForSale = async (req, res) => {
    try {
        const { price } = req.body;
        const updated = await BookService.markBookForSale(req.params.id, price);
        
        if (!updated) {
        return res.status(404).json({
            success: false,
            message: 'Book not found'
        });
        }
        
        res.json(updated);
    } catch (error) {
        res.status(400).json({
        success: false,
        message: error.message
        });
    }
};

exports.removeBookFromSale = async (req, res) => {
    try {
        const updated = await BookService.removeBookFromSale(req.params.id);
        
        if (!updated) {
        return res.status(404).json({
            success: false,
            message: 'Book not found'
        });
        }
        
        res.json(updated);
    } catch (error) {
        res.status(400).json({
        success: false,
        message: error.message
        });
    }
};

exports.getBooksForSale = async (req, res) => {
    try {
        const books = await BookService.getBooksForSale();
        res.json(books);
    } catch (error) {
        res.status(500).json({
        success: false,
        message: error.message
        });
    }
};
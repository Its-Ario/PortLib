import bookService from '../Services/bookService';

export async function listBooks(req, res) {
    try {
        const books = await bookService.getApprovedBooks();
        res.json(books);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export async function addBook(req, res) {
    try {
        const savedBook = await bookService.addBook(req.body, req.user.id);
        res.json(savedBook);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

export async function getPendingBooks(req, res) {
    try {
        const pendingBooks = await bookService.getPendingBooks();
        res.json(pendingBooks);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export async function approveBook(req, res) {
    try {
        const updated = await bookService.approveBook(req.params.id);
        res.json(updated);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

export async function getBookById(req, res) {
    try {
        const book = await bookService.getBookById(req.params.id);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found',
            });
        }

        res.json(book);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export async function updateBook(req, res) {
    try {
        const updated = await bookService.updateBook(req.params.id, req.body);

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Book not found',
            });
        }

        res.json(updated);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

export async function deleteBook(req, res) {
    try {
        const deleted = await bookService.deleteBook(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Book not found',
            });
        }

        res.json({
            success: true,
            message: 'Book deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export async function markBookForSale(req, res) {
    try {
        const { price } = req.body;
        const updated = await bookService.markBookForSale(req.params.id, price);

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Book not found',
            });
        }

        res.json(updated);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

export async function removeBookFromSale(req, res) {
    try {
        const updated = await bookService.removeBookFromSale(req.params.id);

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Book not found',
            });
        }

        res.json(updated);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

export async function getBooksForSale(req, res) {
    try {
        const books = await bookService.getBooksForSale();
        res.json(books);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

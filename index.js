const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const WebSocketServer = require('./websocketServer');

dotenv.config();

const app = express();
app.use(express.json());

// Add CORS middleware to allow frontend requests
app.use(cors());

// Serve static files from public directory
app.use(express.static('public'));

const mainRoutes = require('./Routes/mainRoutes');
const adminRoutes = require('./Routes/adminRoutes');
const authRoutes = require('./Routes/authRoutes');
const bookRoutes = require('./Routes/bookRoutes');
const transactionRoutes = require('./Routes/transactionRoutes');

app.use('/', mainRoutes);
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/book', bookRoutes);
app.use('/transaction', transactionRoutes);

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocketServer with options
const wsServer = new WebSocketServer(server, {
    jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key_change_this',
    pingInterval: 30000,  // Send ping every 30 seconds
    pingTimeout: 60000    // Connection timeout after 60 seconds without response
});

// WebSocket status endpoint
app.get('/ws-status', (req, res) => {
    res.status(200).json(wsServer.getStatus());
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        websocket: wsServer.getStatus(),
        uptime: process.uptime()
    });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket server is active on ws://localhost:${PORT}`);
});

// Graceful shutdown
// process.on('SIGINT', function() {
//     console.log('Shutting down server...');
//     wsServer.close();
//     server.close(() => {
//         console.log('HTTP server closed');
//         mongoose.connection.close(false, () => {
//             console.log('MongoDB connection closed');
//             process.exit(0);
//         });
//     });
// });

// Error handling
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
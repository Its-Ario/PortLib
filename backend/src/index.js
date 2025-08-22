import express, { json } from 'express';
import { connection, connect } from 'mongoose';
import { createServer } from 'http';
import { config } from 'dotenv';
import cors from 'cors';
import WebSocketServer from './websocketServer';

config();

const app = express();
app.use(json());

app.use(cors());

app.use(express.static('public'));

import mainRoutes from '.routes/mainRoutes';
import adminRoutes from '.routes/adminRoutes';
import authRoutes from '.routes/authRoutes';
import bookRoutes from '.routes/bookRoutes';
import transactionRoutes from '.routes/transactionRoutes';
import logger from './logger';

app.use('/', mainRoutes);
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/book', bookRoutes);
app.use('/transaction', transactionRoutes);

const server = createServer(app);

const wsServer = new WebSocketServer(server, {
    jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key_change_this',
    pingInterval: 30000,
    pingTimeout: 60000,
});

app.get('/ws-status', (req, res) => {
    res.status(200).json(wsServer.getStatus());
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        mongodb: connection.readyState === 1 ? 'connected' : 'disconnected',
        websocket: wsServer.getStatus(),
        uptime: process.uptime(),
    });
});

connect(process.env.MONGO_URI)
    .then(() => logger.log('✅ MongoDB connected'))
    .catch((err) => logger.error('❌ MongoDB connection error:', err));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    logger.log(`🚀 Server is running on http://localhost:${PORT}`);
    logger.log(`🔌 WebSocket server is active on ws://localhost:${PORT}`);
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

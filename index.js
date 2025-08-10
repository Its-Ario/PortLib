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

import mainRoutes from './Routes/mainRoutes';
import adminRoutes from './Routes/adminRoutes';
import authRoutes from './Routes/authRoutes';
import bookRoutes from './Routes/bookRoutes';
import transactionRoutes from './Routes/transactionRoutes';

app.use('/', mainRoutes);
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/book', bookRoutes);
app.use('/transaction', transactionRoutes);

const server = createServer(app);

const wsServer = new WebSocketServer(server, {
    jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key_change_this',
    pingInterval: 30000,
    pingTimeout: 60000
});

app.get('/ws-status', (req, res) => {
    res.status(200).json(wsServer.getStatus());
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        mongodb: connection.readyState === 1 ? 'connected' : 'disconnected',
        websocket: wsServer.getStatus(),
        uptime: process.uptime()
    });
});

connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket server is active on ws://localhost:${PORT}`);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
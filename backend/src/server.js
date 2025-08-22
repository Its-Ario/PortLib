import { createServer } from 'http';
import { config } from 'dotenv';
import pkg from 'mongoose';
const { connect, connection } = pkg;
import app from './app.js';
import SignalingServer from './signalingServer.js';
import logger from './logger.js';

config({
    path: '../.env'
});

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await connect(process.env.MONGO_URI);
        logger.info('✅ MongoDB connected');

        const server = createServer(app);

        const wsServer = new SignalingServer(server, {
            jwtSecret: process.env.JWT_SECRET || 'jwt_secret',
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

        server.listen(PORT, () => {
            logger.info(`🚀 Server running at http://localhost:${PORT}`);
            logger.info(`🔌 Signaling server active on ws://localhost:${PORT}`);
        });
    } catch (err) {
        logger.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}

startServer();

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

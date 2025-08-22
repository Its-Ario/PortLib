import { WebSocketServer as WS } from 'ws';
import * as map from 'lib0/map';
import jwt from 'jsonwebtoken';
import logger from './logger.js';

export default class SignalingServer {
    constructor(server, options = {}) {
        this.options = {
            jwtSecret: options.jwtSecret || null,
            pingInterval: options.pingInterval || 30000,
            pingTimeout: options.pingTimeout || 60000,
        };

        this.wss = new WS({ noServer: true });
        this.topics = new Map();

        this.wss.on('connection', (conn, request) => this.onConnection(conn, request));

        server.on('upgrade', (request, socket, head) => {
            this.handleUpgrade(request, socket, head);
        });

        logger.info(
            `WebSocket server initialized with pingInterval=${this.options.pingInterval}, jwt=${!!this.options.jwtSecret}`
        );
    }

    handleUpgrade(request, socket, head) {
        if (this.options.jwtSecret) {
            try {
                const url = new URL(request.url, `http://${request.headers.host}`);
                const token =
                    url.searchParams.get('token') ||
                    request.headers['sec-websocket-protocol'];

                if (!token) {
                    logger.warn('Unauthorized upgrade attempt: no token');
                    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                    socket.destroy();
                    return;
                }

                jwt.verify(token, this.options.jwtSecret);
                logger.info('Client authenticated via JWT');
            } catch (err) {
                logger.error({ err }, 'JWT verification failed');
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }
        }

        this.wss.handleUpgrade(request, socket, head, (ws) => {
            this.wss.emit('connection', ws, request);
        });
    }

    send(conn, message) {
        if (conn.readyState !== 0 && conn.readyState !== 1) {
            logger.warn('Attempted to send to a closed connection');
            conn.close();
            return;
        }
        try {
            conn.send(JSON.stringify(message));
        } catch (err) {
            logger.error({ err }, 'Failed to send message');
            conn.close();
        }
    }

    onConnection(conn, request) {
        logger.info(`New connection from ${request.socket.remoteAddress}`);
        const subscribedTopics = new Set();
        let closed = false;

        let pongReceived = true;
        const pingInterval = setInterval(() => {
            if (!pongReceived) {
                logger.warn('No pong received, closing connection');
                conn.close();
                clearInterval(pingInterval);
            } else {
                pongReceived = false;
                try {
                    conn.ping();
                } catch (err) {
                    logger.error({ err }, 'Failed to ping client');
                    conn.close();
                }
            }
        }, this.options.pingInterval);

        conn.on('pong', () => {
            pongReceived = true;
            logger.debug('Pong received');
        });

        conn.on('close', () => {
            subscribedTopics.forEach((topicName) => {
                const subs = this.topics.get(topicName) || new Set();
                subs.delete(conn);
                if (subs.size === 0) {
                    this.topics.delete(topicName);
                }
            });
            subscribedTopics.clear();
            closed = true;
            logger.info('Connection closed');
        });

        conn.on('message', (message) => {
            try {
                if (typeof message === 'string' || message instanceof Buffer) {
                    message = JSON.parse(message);
                }
            } catch (err) {
                logger.warn({ err }, 'Invalid JSON message');
                return;
            }

            if (message && message.type && !closed) {
                switch (message.type) {
                    case 'subscribe':
                        (message.topics || []).forEach((topicName) => {
                            if (typeof topicName === 'string') {
                                const topic = map.setIfUndefined(
                                    this.topics,
                                    topicName,
                                    () => new Set()
                                );
                                topic.add(conn);
                                subscribedTopics.add(topicName);
                                logger.info(`Subscribed to topic: ${topicName}`);
                            }
                        });
                        break;

                    case 'unsubscribe':
                        (message.topics || []).forEach((topicName) => {
                            const subs = this.topics.get(topicName);
                            if (subs) {
                                subs.delete(conn);
                                logger.info(`Unsubscribed from topic: ${topicName}`);
                            }
                        });
                        break;

                    case 'publish':
                        if (message.topic) {
                            const receivers = this.topics.get(message.topic);
                            if (receivers) {
                                message.clients = receivers.size;
                                receivers.forEach((receiver) =>
                                    this.send(receiver, message)
                                );
                                logger.info(
                                    `Published to topic=${message.topic} clients=${receivers.size}`
                                );
                            }
                        }
                        break;

                    case 'ping':
                        this.send(conn, { type: 'pong' });
                        logger.debug('Responded with pong');
                        break;

                    default:
                        logger.warn(`Unknown message type: ${message.type}`);
                }
            }
        });
    }
}
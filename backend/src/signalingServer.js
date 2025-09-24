import { WebSocketServer } from 'ws';
import * as map from 'lib0/map';
import * as crypto from 'crypto';
import logger from './logger.js';

export default class SignalingServer {
    constructor(server, options = {}) {
        this.wsReadyStateConnecting = 0;
        this.wsReadyStateOpen = 1;
        this.pingTimeout = options.pingTimeout || 30000;

        this.topics = new Map();
        this.wss = new WebSocketServer({ noServer: true });

        this.wss.on('connection', this.onConnection.bind(this));

        server.on('upgrade', (request, socket, head) => {
            this.wss.handleUpgrade(request, socket, head, (ws) => {
                this.wss.emit('connection', ws, request);
            });
        });

        logger.info('✅ Signaling server initialized');
    }

    send(conn, message) {
        if (
            conn.readyState !== this.wsReadyStateConnecting &&
            conn.readyState !== this.wsReadyStateOpen
        ) {
            conn.close();
            return;
        }
        try {
            conn.send(JSON.stringify(message));
        } catch {
            conn.close();
        }
    }

    onConnection(conn) {
        conn.id = crypto.randomUUID();
        logger.info(`Connection established with ID: ${conn.id}`);

        const subscribedTopics = new Set();
        let closed = false;

        let pongReceived = true;
        const pingInterval = setInterval(() => {
            if (!pongReceived) {
                logger.warn(`No pong received from ${conn.id}, closing connection.`);
                conn.close();
                clearInterval(pingInterval);
            } else {
                pongReceived = false;
                try {
                    conn.ping();
                } catch {
                    conn.close();
                }
            }
        }, this.pingTimeout);

        conn.on('pong', () => {
            pongReceived = true;
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
            clearInterval(pingInterval);
            logger.info(`Connection ${conn.id} closed`);
        });

        conn.on('message', (message) => {
            try {
                if (message instanceof Buffer) {
                    message = JSON.parse(message.toString());
                } else if (typeof message === 'string') {
                    message = JSON.parse(message);
                }
            } catch {
                logger.error(`Malformed JSON from ${conn.id}. Closing connection.`);
                conn.close();
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
                                logger.info(`${conn.id} subscribed to topic: ${topicName}`);
                            }
                        });
                        break;

                    case 'unsubscribe':
                        (message.topics || []).forEach((topicName) => {
                            const subs = this.topics.get(topicName);
                            if (subs) {
                                subs.delete(conn);
                            }
                            subscribedTopics.delete(topicName);
                        });
                        break;

                    case 'publish':
                        if (message.topic) {
                            const receivers = this.topics.get(message.topic);
                            if (receivers) {
                                logger.info(
                                    `Publishing message from ${conn.id} to topic ${message.topic} for ${receivers.size - 1} clients`
                                );
                                receivers.forEach((receiver) => {
                                    if (receiver !== conn) {
                                        this.send(receiver, message);
                                    }
                                });
                            }
                        }
                        break;

                    case 'ping':
                        this.send(conn, { type: 'pong' });
                        break;
                }
            }
        });
    }
}

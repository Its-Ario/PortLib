import { WebSocketServer } from 'ws';
import * as map from 'lib0/map';
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
        }
        try {
            conn.send(JSON.stringify(message));
        } catch {
            conn.close();
        }
    }

    onConnection(conn) {
        const subscribedTopics = new Set();
        let closed = false;

        let pongReceived = true;
        const pingInterval = setInterval(() => {
            if (!pongReceived) {
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

        conn.on('pong', () => (pongReceived = true));

        conn.on('close', () => {
            subscribedTopics.forEach((topicName) => {
                const subs = this.topics.get(topicName) || new Set();
                subs.delete(conn);
                if (subs.size === 0) this.topics.delete(topicName);
            });
            subscribedTopics.clear();
            closed = true;
            logger.info('Connection closed');
        });

        conn.on('message', (message) => {
            if (typeof message === 'string' || message instanceof Buffer) {
                message = JSON.parse(message);
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
                            if (subs) subs.delete(conn);
                        });
                        break;

                    case 'publish':
                        if (message.topic) {
                            const receivers = this.topics.get(message.topic);
                            if (receivers) {
                                message.clients = receivers.size;
                                receivers.forEach((receiver) => this.send(receiver, message));
                                logger.info(
                                    `Published message to topic ${message.topic} for ${receivers.size} clients`
                                );
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

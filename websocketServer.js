import { WebSocketServer as wsServer } from 'ws';
import pkg from 'jsonwebtoken';
const { verify } = pkg;
import User from './Models/User.js';
import logger from './logger.js';

class WebSocketServer {
    constructor(server, options = {}) {
        this.jwtSecret = options.jwtSecret || process.env.JWT_SECRET || 'jwt_secret';

        this.wss = new wsServer({
            server: server,
            verifyClient: this._verifyClient.bind(this),
            clientTracking: true,
            pingInterval: options.pingInterval || 30000,
            pingTimeout: options.pingTimeout || 60000,
        });

        this.clients = new Map();
        this.userLocations = new Map();
        this.pendingLocationUpdates = new Map();
        this.heartbeatInterval = null;
        this.locationUpdateInterval = 5000;

        this.init();
    }

    async _verifyClient(info, done) {
        try {
            const url = new URL(info.req.url, 'http://localhost');
            const token = url.searchParams.get('token');

            if (!token) {
                return done(false, 401, 'Unauthorized');
            }

            try {
                const decoded = verify(token, this.jwtSecret);

                if (!decoded.id) {
                    logger.error('Token missing id field');
                    return done(false, 401, 'Invalid token format');
                }

                const user = await User.findById(decoded.id);

                if (!user) {
                    return done(false, 403, 'User not found');
                }

                if (
                    decoded.tokenVersion !== undefined &&
                    user.tokenVersion !== undefined &&
                    decoded.tokenVersion !== user.tokenVersion
                ) {
                    return done(false, 403, 'Token revoked');
                }

                info.req.user = user;

                return done(true);
            } catch (err) {
                logger.error('Token verification failed:', err.message);
                return done(false, 401, 'Invalid token');
            }
        } catch (error) {
            logger.error('Error in verifyClient:', error);
            return done(false, 500, 'Server error');
        }
    }

    init() {
        this.wss.on('connection', (ws, req) => {
            if (!req.user || !req.user.id) {
                ws.close(1008, 'Unauthorized');
                return;
            }

            const userId = req.user.id;
            const username = req.user.username;
            const isAdmin = req.user.role === 'ADMIN' || false;

            logger.log(`User ${userId} (${username}) connected`);

            if (this.clients.has(userId)) {
                const existingWs = this.clients.get(userId);
                try {
                    existingWs.terminate();
                } catch (e) {
                    logger.error(`Error terminating connection for user ${userId}:`, e);
                }
                this.cleanupUserResources(userId);
            }

            this.clients.set(userId, ws);
            ws.userId = userId;
            ws.username = username;
            ws.isAdmin = isAdmin;
            ws.isAlive = true;

            ws.on('pong', () => {
                ws.isAlive = true;
            });

            if (this.userLocations.size > 0) {
                const activeUsers = [];

                this.userLocations.forEach((userData) => {
                    if (userData.lat === undefined || userData.lng === undefined) return;

                    if (userData.userId === userId) {
                        const selfData = { ...userData, isSelf: true };
                        activeUsers.push(selfData);
                    } else if (userData.showLocationToEveryone || isAdmin) {
                        activeUsers.push(userData);
                    }
                });

                if (activeUsers.length > 0) {
                    try {
                        ws.send(JSON.stringify(activeUsers));
                    } catch (e) {
                        logger.error('Error sending initial users data:', e);
                    }
                }
            }

            ws.on('message', (message) => {
                try {
                    const messageStr = message instanceof Buffer ? message.toString() : message;
                    const data = JSON.parse(messageStr);

                    if (data.userId && data.userId !== userId) {
                        logger.warn(`User ${userId} tried to send data for ${data.userId}`);
                        return;
                    }

                    data.userId = userId;
                    data.username = username;
                    data.timestamp = data.timestamp || Date.now();

                    if (data.type === 'disconnect') {
                        this.handleDisconnect(userId, username);
                        return;
                    }

                    if (data.type === 'visibility') {
                        this.handleVisibilityChange(userId, data.showLocationToEveryone);

                        if (this.userLocations.has(userId)) {
                            const userData = this.userLocations.get(userId);
                            userData.showLocationToEveryone = data.showLocationToEveryone;
                            userData.timestamp = Date.now();
                            this.broadcastLocation(userId, userData);
                        }
                        return;
                    }

                    if (data.type === 'action') {
                        logger.log(`Processing immediate action from user ${userId} (${username})`);
                        this.handleImmediateAction(userId, data);
                        return;
                    }

                    if (data.lat !== undefined && data.lng !== undefined) {
                        logger.log(`Processing location update from user ${userId} (${username})`);

                        if (
                            data.showLocationToEveryone === undefined &&
                            this.userLocations.has(userId)
                        ) {
                            const prevData = this.userLocations.get(userId);
                            data.showLocationToEveryone = prevData.showLocationToEveryone;
                        }

                        ws.userData = data;
                        this.userLocations.set(userId, data);

                        const sendImmediately =
                            data.immediate === true || data.forceUpdate === true;

                        if (sendImmediately) {
                            this.broadcastLocation(userId, data);
                        } else {
                            this.scheduleDelayedLocationUpdate(userId, data);
                        }
                        return;
                    }

                    logger.log(`Processing generic update from user ${userId} (${username})`);

                    ws.userData = data;
                    this.userLocations.set(userId, data);

                    this.broadcastLocation(userId, data);
                } catch (e) {
                    logger.error('Error processing message:', e);
                }
            });

            ws.on('close', () => {
                this.handleDisconnect(userId, username);
            });

            ws.on('error', (error) => {
                logger.error(`WebSocket error for user ${userId}:`, error);
                this.handleDisconnect(userId, username);
            });
        });

        this.startHeartbeat();
    }

    cleanupUserResources(userId) {
        if (this.pendingLocationUpdates.has(userId)) {
            const pendingUpdate = this.pendingLocationUpdates.get(userId);
            if (pendingUpdate && pendingUpdate.timeout) {
                clearTimeout(pendingUpdate.timeout);
            }
            this.pendingLocationUpdates.delete(userId);
        }

        this.clients.delete(userId);
    }

    handleDisconnect(userId, username) {
        logger.log(`User ${userId} (${username}) disconnected`);

        this.cleanupUserResources(userId);

        if (this.userLocations.has(userId)) {
            const userData = this.userLocations.get(userId);
            userData.isDisconnected = true;
            userData.disconnectedAt = Date.now();
            this.userLocations.set(userId, userData);

            setTimeout(() => {
                if (this.userLocations.has(userId)) {
                    const data = this.userLocations.get(userId);
                    if (data.isDisconnected) {
                        this.userLocations.delete(userId);
                    }
                }
            }, 30000);
        }

        this.broadcastToAll({
            userId: userId,
            username: username,
            type: 'disconnect',
            timestamp: Date.now(),
        });
    }

    handleVisibilityChange(userId, showLocationToEveryone) {
        if (this.userLocations.has(userId)) {
            const userData = this.userLocations.get(userId);
            const previousVisibility = userData.showLocationToEveryone;
            userData.showLocationToEveryone = showLocationToEveryone;
            userData.timestamp = Date.now();
            this.userLocations.set(userId, userData);

            logger.log(`User ${userId} visibility changed to ${showLocationToEveryone}`);

            if (previousVisibility === true && showLocationToEveryone === false) {
                this.broadcastToSpecificUsers(
                    {
                        userId: userId,
                        type: 'disconnect',
                        timestamp: Date.now(),
                    },
                    (client) => {
                        return client.userId !== userId && !client.isAdmin;
                    }
                );
            } else if (
                previousVisibility === false &&
                showLocationToEveryone === true &&
                userData.lat !== undefined &&
                userData.lng !== undefined
            ) {
                const dataToSend = { ...userData };
                delete dataToSend.isSelf;
                this.broadcastToSpecificUsers(dataToSend, (client) => {
                    return client.userId !== userId && !client.isAdmin;
                });
            }
        }
    }

    handleImmediateAction(userId, actionData) {
        actionData.timestamp = actionData.timestamp || Date.now();

        if (actionData.showLocationToEveryone === undefined && this.userLocations.has(userId)) {
            const userData = this.userLocations.get(userId);
            actionData.showLocationToEveryone = userData.showLocationToEveryone;
        }

        if (actionData.showLocationToEveryone) {
            this.broadcastToAll(actionData);
        } else {
            const selfClient = this.clients.get(userId);
            if (selfClient && selfClient.readyState === WebSocket.WebSocket.OPEN) {
                try {
                    const selfData = { ...actionData, isSelf: true };
                    selfClient.send(JSON.stringify(selfData));
                } catch (err) {
                    logger.error(`Error sending action to self client ${userId}:`, err);
                }
            }

            this.broadcastToSpecificUsers(actionData, (client) => {
                return client.userId !== userId && client.isAdmin;
            });
        }
    }

    scheduleDelayedLocationUpdate(userId, locationData) {
        if (this.pendingLocationUpdates.has(userId)) {
            const pendingUpdate = this.pendingLocationUpdates.get(userId);
            if (pendingUpdate && pendingUpdate.timeout) {
                clearTimeout(pendingUpdate.timeout);
            }
        }

        const timeout = setTimeout(() => {
            if (this.clients.has(userId) && this.userLocations.has(userId)) {
                logger.log(`Executing delayed location update for user ${userId}`);

                const currentData = this.userLocations.get(userId);

                currentData.timestamp = Date.now();

                this.broadcastLocation(userId, currentData);

                this.scheduleDelayedLocationUpdate(userId, currentData);
            } else {
                this.pendingLocationUpdates.delete(userId);
            }
        }, this.locationUpdateInterval);

        this.pendingLocationUpdates.set(userId, {
            data: locationData,
            timeout: timeout,
        });

        logger.log(
            `Scheduled delayed location update for user ${userId} in ${this.locationUpdateInterval}ms`
        );
    }

    broadcastLocation(userId, userData) {
        userData.timestamp = userData.timestamp || Date.now();

        if (userData.showLocationToEveryone) {
            this.broadcastToAll(userData);
        } else {
            this.broadcastToSpecificUsers(userData, (client) => {
                if (client.userId === userId) {
                    const selfData = { ...userData, isSelf: true };
                    try {
                        client.send(JSON.stringify(selfData));
                    } catch (err) {
                        logger.error(`Error sending to self client ${userId}:`, err);
                    }
                    return false;
                }
                return client.isAdmin;
            });
        }
    }

    broadcastToSpecificUsers(data, filterFunction) {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        const deadClients = [];

        this.clients.forEach((client, clientId) => {
            if (client.readyState === WebSocket.OPEN && filterFunction(client)) {
                try {
                    client.send(message);
                } catch (err) {
                    logger.error(`Error sending to client ${clientId}:`, err);
                    deadClients.push(clientId);
                }
            } else if (
                client.readyState !== WebSocket.OPEN &&
                client.readyState !== WebSocket.CONNECTING
            ) {
                deadClients.push(clientId);
            }
        });

        deadClients.forEach((clientId) => {
            this.cleanupUserResources(clientId);
        });
    }

    broadcastToAll(data) {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        const deadClients = [];

        this.clients.forEach((client, clientId) => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    const isSelf = data.userId === clientId;
                    if (isSelf) {
                        const selfData = { ...data, isSelf: true };
                        client.send(JSON.stringify(selfData));
                    } else {
                        client.send(message);
                    }
                } catch (err) {
                    logger.error(`Error sending to client ${clientId}:`, err);
                    deadClients.push(clientId);
                }
            } else if (
                client.readyState !== WebSocket.OPEN &&
                client.readyState !== WebSocket.CONNECTING
            ) {
                deadClients.push(clientId);
            }
        });

        deadClients.forEach((clientId) => {
            this.cleanupUserResources(clientId);
        });
    }

    startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.heartbeatInterval = setInterval(() => {
            const deadClients = [];

            this.wss.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    if (ws.userId) {
                        deadClients.push(ws.userId);
                    }
                    return ws.terminate();
                }

                ws.isAlive = false;
                try {
                    ws.ping();
                } catch (e) {
                    logger.error('Error sending ping:', e);
                    if (ws.userId) {
                        deadClients.push(ws.userId);
                    }
                    ws.terminate();
                }
            });

            deadClients.forEach((userId) => {
                this.cleanupUserResources(userId);
            });

            const now = Date.now();
            const staleUserIds = [];

            this.userLocations.forEach((userData, userId) => {
                if (
                    userData.isDisconnected &&
                    userData.disconnectedAt &&
                    now - userData.disconnectedAt > 30000
                ) {
                    staleUserIds.push(userId);
                }
            });

            staleUserIds.forEach((userId) => {
                this.userLocations.delete(userId);
            });
        }, 30000);
    }

    stopHeartbeat() {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
    }

    getStatus() {
        let publicSharingCount = 0;
        let connectedCount = 0;

        this.userLocations.forEach((userData) => {
            if (!userData.isDisconnected) {
                connectedCount++;
                if (userData.showLocationToEveryone) {
                    publicSharingCount++;
                }
            }
        });

        return {
            status: 'active',
            connections: this.clients.size,
            activeSharingUsers: connectedCount,
            publicSharingUsers: publicSharingCount,
            pendingUpdates: this.pendingLocationUpdates.size,
            uptime: process.uptime(),
        };
    }

    close() {
        this.pendingLocationUpdates.forEach((update) => {
            if (update && update.timeout) {
                clearTimeout(update.timeout);
            }
        });

        this.pendingLocationUpdates.clear();
        this.stopHeartbeat();

        this.clients.forEach((client, userId) => {
            try {
                client.close(1000, 'Server shutting down');
            } catch (e) {
                logger.error(`Error closing connection for user ${userId}:`, e);
            }
        });

        this.clients.clear();
        this.userLocations.clear();
        this.wss.close();
    }
}

export default WebSocketServer;

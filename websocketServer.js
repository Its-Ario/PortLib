const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const User = require('./Models/User');

class WebSocketServer {
    constructor(server, options = {}) {
        // Configuration options with defaults
        this.jwtSecret = options.jwtSecret || process.env.JWT_SECRET || 'your_jwt_secret_key_change_this';
        
        this.wss = new WebSocket.Server({ 
            server: server,
            verifyClient: this._verifyClient.bind(this),
            clientTracking: true,
            pingInterval: options.pingInterval || 30000,
            pingTimeout: options.pingTimeout || 60000
        });
        
        this.clients = new Map(); // key: userId, value: ws
        this.userLocations = new Map(); // Store user location/state data
        this.heartbeatInterval = null;
        
        this.init();
    }
    
    async _verifyClient(info, done) {
        try {
            const url = new URL(info.req.url, 'http://localhost');
            const token = url.searchParams.get('token');
            
            if (!token) {
                return done(false, 401, 'Unauthorized');
            }

            console.log("A1")
            
            try {
                const decoded = jwt.verify(token, this.jwtSecret);
                                
                if (!decoded.id) {
                    console.error('Token missing id field');
                    return done(false, 401, 'Invalid token format');
                }
                
                const user = await User.findById(decoded.id);
                console.log()
                console.log(user.username);
                console.log(user.tokenVersion);
                if (decoded.tokenVersion != user.tokenVersion) {
                    return done(false, 403, "User not found");
                }

                info.req.user = user;
                
                return done(true);
            } catch (err) {
                console.error('Token verification failed:', err.message);
                return done(false, 401, 'Invalid token');
            }
        } catch (error) {
            console.error('Error in verifyClient:', error);
            return done(false, 500, 'Server error');
        }
    }
    
    init() {
        this.wss.on('connection', (ws, req) => {
            console.log(req.user);
            const userId = req.user.id;
            const username = req.user.username;
            
            if (!userId) {
                ws.close(1008, 'Unauthorized');
                return;
            }
            
            console.log(`User ${userId} (${username}) connected`);
            
            // Store the client connection
            this.clients.set(userId, ws);
            
            // Setup heartbeat
            ws.isAlive = true;
            ws.on('pong', () => {
                ws.isAlive = true;
            });
            
            // Send current active users to the new client
            if (this.userLocations.size > 0) {
                const activeUsers = [];
                this.userLocations.forEach((userData) => {
                    activeUsers.push(userData);
                });
                
                if (activeUsers.length > 0) {
                    try {
                        ws.send(JSON.stringify(activeUsers));
                    } catch (e) {
                        console.error('Error sending initial users data:', e);
                    }
                }
            }
            
            ws.on('message', (message) => {
                try {
                    const messageStr = message instanceof Buffer ? message.toString() : message;
                    const data = JSON.parse(messageStr);
                    
                    // Verify the sender
                    if (data.userId && data.userId !== userId) {
                        console.warn(`User ${userId} tried to send data for ${data.userId}`);
                        return;
                    }
                    
                    // Handle disconnect message
                    if (data.type === 'disconnect') {
                        this.userLocations.delete(userId);
                        
                        this.broadcastToAll({
                            userId: userId,
                            username: username,
                            type: 'disconnect'
                        });
                        
                        return;
                    }
                    
                    // Override userId and username from token to prevent spoofing
                    data.userId = userId;
                    data.username = username;
                    
                    // Log for debugging
                    console.log(`Processing message from user ${userId} (${username}):`, data);
                    
                    // Store user data with the connection
                    ws.userData = data;
                    this.userLocations.set(userId, data);
                    
                    // Broadcast the message to all clients
                    this.broadcastToAll(data);
                    
                } catch (e) {
                    console.error('Error processing message:', e);
                }
            });
            
            ws.on('close', () => {
                console.log(`User ${userId} (${username}) disconnected`);
                
                // Remove client
                this.clients.delete(userId);
                this.userLocations.delete(userId);
                
                // Notify other clients
                this.broadcastToAll({
                    userId: userId,
                    username: username,
                    type: 'disconnect'
                });
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.clients.delete(userId);
                this.userLocations.delete(userId);
            });
        });
        
        this.startHeartbeat();
    }
    
    broadcastToAll(data) {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        
        this.clients.forEach((client, userId) => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(message);
                } catch (err) {
                    console.error(`Error sending to client ${userId}:`, err);
                    this.clients.delete(userId);
                    this.userLocations.delete(userId);
                }
            } else if (client.readyState !== WebSocket.CONNECTING) {
                this.clients.delete(userId);
                this.userLocations.delete(userId);
            }
        });
    }
    
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    return ws.terminate();
                }
                
                ws.isAlive = false;
                try {
                    ws.ping();
                } catch (e) {
                    console.error('Error sending ping:', e);
                    ws.terminate();
                }
            });
        }, 30000);
    }
    
    stopHeartbeat() {
        clearInterval(this.heartbeatInterval);
    }
    
    getStatus() {
        return {
            status: 'active',
            connections: this.clients.size,
            activeSharingUsers: this.userLocations.size,
            uptime: process.uptime()
        };
    }
    
    close() {
        this.stopHeartbeat();
        this.wss.close();
    }
}

module.exports = WebSocketServer;
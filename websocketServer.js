const WebSocket = require('ws');

class WebSocketServer {
    constructor(server) {
        this.wss = new WebSocket.Server({ 
            server: server,
            verifyClient: () => true,
            clientTracking: true,
            pingInterval: 30000,
            pingTimeout: 60000
        });
        
        this.clients = new Map();
        this.userLocations = new Map();
        this.heartbeatInterval = null;
        
        this.init();
    }
    
    init() {
        this.wss.on('connection', (ws, req) => {            
            const clientId = this.generateClientId();
            this.clients.set(clientId, ws);
            
            ws.isAlive = true;
            ws.on('pong', () => {
                ws.isAlive = true;
            });

            if (this.userLocations.size > 0) {
                this.userLocations.forEach((location) => {
                    try {
                        ws.send(JSON.stringify(location));
                    } catch (e) {
                        console.error('Error sending initial location data:', e);
                    }
                });
            }
            
            ws.on('message', (message) => {
                try {
                    const messageStr = message instanceof Buffer ? message.toString() : message;
                    const data = JSON.parse(messageStr);
                    
                    if (data.type === 'disconnect') {
                        this.userLocations.delete(data.userId);
                        
                        this.broadcastToAll(JSON.stringify({
                            userId: data.userId,
                            type: 'disconnect'
                        }));
                        
                        return;
                    }
                    
                    this.userLocations.set(data.userId, data);
                    this.broadcastToAll(JSON.stringify(data));
                    
                } catch (e) {
                    console.error('Error processing message:', e);
                }
            });
            
            ws.on('close', () => {
                this.clients.delete(clientId);
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.clients.delete(clientId);
            });
        });
        
        this.startHeartbeat();
    }
    
    broadcastToAll(message) {
        this.clients.forEach((client, id) => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(message);
                } catch (err) {
                    console.error(`Error sending to client ${id}:`, err);
                    this.clients.delete(id);
                }
            } else if (client.readyState !== WebSocket.CONNECTING) {
                this.clients.delete(id);
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
    
    generateClientId() {
        return 'client_' + Math.random().toString(36).substr(2, 9);
    }
    
    getStatus() {
        return {
            status: 'active',
            connections: this.clients.size,
            activeSharingUsers: this.userLocations.size
        };
    }
    
    close() {
        this.stopHeartbeat();
        this.wss.close();
    }
}

module.exports = WebSocketServer;
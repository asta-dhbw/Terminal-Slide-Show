import { WebSocketServer } from 'ws';
import { Logger } from '../utils/logger.js';
import config from '../../../config/config.js';

/**
 * Manages WebSocket connections and communication with clients
 * @class WebSocketManager
 */
class WebSocketManager {
  constructor() {
    /** @private @type {Logger} Logger instance for WebSocketManager */
    this.logger = new Logger('WebSocketManager');
    /** @private @type {WebSocketServer|null} WebSocket server instance */
    this.server = null;
    /** @private @type {Map<WebSocket, Object>} Map of connected clients and their metadata */
    this.clients = new Map();
    /** @private @type {number} Interval for checking client heartbeats in ms */
    this.heartbeatInterval = config.websocket.heartbeatInterval;
  }

  /**
 * Initializes the WebSocket server
 * @param {http.Server} server - HTTP/HTTPS server to attach WebSocket to
 */
  initialize(server) {
    this.server = new WebSocketServer({
      noServer: true,
      clientTracking: true
    });

    server.on('upgrade', (request, socket, head) => {
      if (request.url === '/ws') {
        this.server.handleUpgrade(request, socket, head, (ws) => {
          this.handleConnection(ws, request);
        });
      }
    });

    // Start heartbeat checking
    setInterval(() => this.checkHeartbeats(), this.heartbeatInterval);

    this.logger.info('WebSocket server initialized');
  }

  /**
 * Handles new WebSocket connections
 * @private
 * @param {WebSocket} ws - WebSocket connection
 * @param {http.IncomingMessage} req - HTTP request that initiated the connection
 */
  handleConnection(ws, req) {
    const clientId = Math.random().toString(36).substring(7);

    this.clients.set(ws, {
      id: clientId,
      lastPing: Date.now(),
      address: req.socket.remoteAddress
    });

    this.logger.info(`New WebSocket connection from ${req.socket.remoteAddress}`);

    // Send initial media list
    if (global.slideshowManager) {
      try {
        const initialData = {
          type: 'mediaList',
          media: global.slideshowManager.getAllMedia()
        };
        ws.send(JSON.stringify(initialData));
      } catch (error) {
        this.logger.error('Failed to send initial data:', error);
      }
    }

    ws.on('pong', () => {
      const client = this.clients.get(ws);
      if (client) {
        client.lastPing = Date.now();
      }
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        if (message.type === 'ping') {
          ws.pong();
          const client = this.clients.get(ws);
          if (client) {
            client.lastPing = Date.now();
          }
        }
      } catch (error) {
        this.logger.error('Failed to parse message:', error);
      }
    });

    ws.on('close', () => {
      this.clients.delete(ws);
      this.logger.info(`Client ${clientId} disconnected`);
    });

    ws.on('error', (error) => {
      this.logger.error(`WebSocket error for client ${clientId}:`, error);
      this.clients.delete(ws);
    });
  }

  /**
 * Checks client heartbeats and removes stale connections
 * @private 
 */
  checkHeartbeats() {
    const now = Date.now();
    for (const [ws, client] of this.clients) {
      if (now - client.lastPing > this.heartbeatInterval * 2) {
        this.logger.info(`Client ${client.id} timed out, closing connection`);
        ws.terminate();
        this.clients.delete(ws);
      } else {
        ws.ping();
      }
    }
  }

  /**
 * Broadcasts media list updates to all connected clients
 * @param {MediaFile[]} mediaList - Updated list of media files
 */
  broadcastUpdate(mediaList) {
    if (!this.server || this.clients.size === 0) return;

    const message = JSON.stringify({
      type: 'mediaUpdate',
      media: mediaList
    });

    let successCount = 0;
    let failCount = 0;

    this.clients.forEach((client, ws) => {
      if (ws.readyState === WebSocketServer.OPEN) {
        try {
          ws.send(message);
          successCount++;
        } catch (err) {
          this.logger.error(`Failed to send to client ${client.id}:`, err);
          ws.terminate();
          this.clients.delete(ws);
          failCount++;
        }
      }
    });

    if (successCount > 0) {
      this.logger.debug(`Broadcast sent to ${successCount} clients (${failCount} failed)`);
    }
  }

  /**
 * Gets the number of currently connected clients
 * @returns {number} Number of connected clients
 */
  getConnectedClients() {
    return this.clients.size;
  }
}

export const webSocketManager = new WebSocketManager();
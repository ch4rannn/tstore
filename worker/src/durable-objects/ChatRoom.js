// ChatRoom Durable Object — WebSocket-based real-time chat
export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map(); // userId -> WebSocket
  }

  async fetch(request) {
    const url = new URL(request.url);

    // Handle broadcast from REST API
    if (url.pathname === '/broadcast') {
      const data = await request.json();
      this.broadcast(JSON.stringify(data));
      return new Response('OK');
    }

    // WebSocket upgrade
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const userId = url.searchParams.get('userId');
    if (!userId) {
      return new Response('User ID required', { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept the WebSocket with hibernation
    this.state.acceptWebSocket(server, [userId]);

    // Track session
    this.sessions.set(userId, server);

    // Notify others that user is online
    this.broadcast(JSON.stringify({
      type: 'userOnline',
      userId,
    }), userId);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      const tags = this.state.getTags(ws);
      const userId = tags[0];

      switch (data.type) {
        case 'typing':
          this.broadcast(JSON.stringify({
            type: 'typing',
            userId,
          }), userId);
          break;

        case 'stopTyping':
          this.broadcast(JSON.stringify({
            type: 'stopTyping',
            userId,
          }), userId);
          break;

        case 'messageRead':
          this.broadcast(JSON.stringify({
            type: 'messageRead',
            userId,
            messageIds: data.messageIds,
          }), userId);
          break;

        case 'sendMessage':
          // Broadcast to all connected users
          this.broadcast(JSON.stringify({
            type: 'newMessage',
            message: data.message,
          }));
          break;

        default:
          break;
      }
    } catch (e) {
      console.error('WebSocket message error:', e);
    }
  }

  async webSocketClose(ws, code, reason) {
    const tags = this.state.getTags(ws);
    const userId = tags[0];

    this.sessions.delete(userId);
    ws.close(code, reason);

    this.broadcast(JSON.stringify({
      type: 'userOffline',
      userId,
    }));
  }

  async webSocketError(ws, error) {
    const tags = this.state.getTags(ws);
    const userId = tags[0];
    this.sessions.delete(userId);
    console.error('WebSocket error for user', userId, error);
  }

  broadcast(message, excludeUserId = null) {
    const sockets = this.state.getWebSockets();
    for (const ws of sockets) {
      try {
        const tags = this.state.getTags(ws);
        if (excludeUserId && tags[0] === excludeUserId) continue;
        ws.send(message);
      } catch (e) {
        // Socket might be closed
      }
    }
  }
}

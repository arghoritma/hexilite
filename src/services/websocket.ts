import HyperExpress from 'hyper-express';

interface WebSocketBroadcastMessage {
  type: string;
  payload: any;
}

export class WebSocketService {
  private clients: Set<HyperExpress.Websocket> = new Set();

  constructor(server: HyperExpress.Server) {
    server.ws('/ws', {
      idle_timeout: 60,
      max_payload_length: 32 * 1024,
    }, (ws: any) => {
      this.clients.add(ws);
      ws.on('close', () => this.clients.delete(ws));
    });
  }

  broadcast(message: WebSocketBroadcastMessage) {
    const data = JSON.stringify(message);
    for (const client of this.clients) {
      client.send(data);
    }
  }
}

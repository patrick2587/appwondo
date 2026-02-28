type MessageHandler = (data: any) => void;

export class WSClient {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000;
  private baseDelay = 1000;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private messageQueue: any[] = [];
  private _isConnected = false;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }

  get isConnected() {
    return this._isConnected;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(`${this.url}?token=${this.token}`);

      this.ws.onopen = () => {
        this._isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.flushQueue();
        this.emit("connectionChange", { connected: true });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data.action, data);
        } catch {}
      };

      this.ws.onclose = () => {
        this._isConnected = false;
        this.stopHeartbeat();
        this.emit("connectionChange", { connected: false });
        this.reconnect();
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      this.reconnect();
    }
  }

  disconnect() {
    this.reconnectAttempts = Infinity;
    this.stopHeartbeat();
    this.ws?.close();
    this.ws = null;
    this._isConnected = false;
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      this.messageQueue.push(data);
    }
  }

  on(action: string, handler: MessageHandler) {
    if (!this.handlers.has(action)) {
      this.handlers.set(action, new Set());
    }
    this.handlers.get(action)!.add(handler);
    return () => {
      this.handlers.get(action)?.delete(handler);
    };
  }

  private emit(action: string, data: any) {
    this.handlers.get(action)?.forEach((handler) => {
      try {
        handler(data);
      } catch {}
    });
  }

  private reconnect() {
    if (this.reconnectAttempts >= 20) return;

    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.reconnectAttempts) + Math.random() * 1000,
      this.maxReconnectDelay
    );
    this.reconnectAttempts++;
    setTimeout(() => this.connect(), delay);
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.send({ action: "ping" });
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private flushQueue() {
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift();
      this.send(msg);
    }
  }

  updateToken(token: string) {
    this.token = token;
  }
}

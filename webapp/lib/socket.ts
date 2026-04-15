import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (typeof window === "undefined") {
    throw new Error("Socket can only be initialized in the browser");
  }

  const hostname = window.location.hostname;
  const SOCKET_URL = `http://${hostname}:3001`;

  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
    });
  }

  return socket;
}

export function connectSocket(token: string): Socket {
  const client = getSocket();

  client.auth = { token };
  if (!client.connected) {
    client.connect();
  }

  return client;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

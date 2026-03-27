import { io, type Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:3001";

let socket: Socket | null = null;

export function getSocket(): Socket {
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

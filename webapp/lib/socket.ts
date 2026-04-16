import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export const SOCKET_PORT = 3001;

export function getSocketUrl(): string {
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:${SOCKET_PORT}`;
  }

  return `http://localhost:${SOCKET_PORT}`;
}

export function getSocket(): Socket {
  if (typeof window === "undefined") {
    throw new Error("Socket can only be initialized in the browser");
  }

  if (!socket) {
    socket = io(getSocketUrl(), {
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

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { getCookie } from "@/lib/cookies";

type SocketStatus = "disconnected" | "connecting" | "connected" | "error";

type SocketStatusContextValue = {
  status: SocketStatus;
  lastError: string | null;
  connectedUsers: number;
};

const SocketStatusContext = createContext<SocketStatusContextValue>({
  status: "disconnected",
  lastError: null,
  connectedUsers: 0,
});

export function useSocketStatus(): SocketStatusContextValue {
  return useContext(SocketStatusContext);
}

export default function SocketProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SocketStatus>("disconnected");
  const [lastError, setLastError] = useState<string | null>(null);
  const [connectedUsers, setConnectedUsers] = useState(0);

  useEffect(() => {
    const socket = getSocket();
    const token = getCookie("access_token");

    const onConnect = () => {
      setStatus("connected");
      setLastError(null);
    };

    const onDisconnect = () => {
      setStatus("disconnected");
    };

    const onPresenceCount = (count: number) => {
      setConnectedUsers(Number(count) || 0);
    };

    const onConnectError = (err: Error) => {
      setStatus("error");
      setLastError(err.message);
      console.error("Socket auth/connection error:", err.message);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("presence_count", onPresenceCount);

    if (token) {
      setStatus("connecting");
      connectSocket(token);
    } else if (socket.connected) {
      disconnectSocket();
    }

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("presence_count", onPresenceCount);
      disconnectSocket();
    };
  }, []);

  const value = useMemo(
    () => ({ status, lastError, connectedUsers }),
    [status, lastError, connectedUsers],
  );

  const badgeColorClass =
    status === "connected"
      ? "bg-green-100 text-green-800"
      : status === "connecting"
        ? "bg-yellow-100 text-yellow-800"
        : status === "error"
          ? "bg-red-100 text-red-800"
          : "bg-gray-100 text-gray-700";

  return (
    <SocketStatusContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-3 right-3 z-50">
        <div
          className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${badgeColorClass}`}
          title={lastError ?? undefined}
        >
          Socket: {status} · {connectedUsers} en ligne
        </div>
      </div>
    </SocketStatusContext.Provider>
  );
}

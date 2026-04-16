"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { clearCookie } from "@/lib/cookies";
import { getAccessToken } from "@/lib/cookies";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken();

    const runLogout = async () => {
      if (token) {
        const socket = connectSocket(token);

        await new Promise<void>((resolve) => {
          socket.emit("presence:logout", (response: { error?: string }) => {
            if (response?.error) {
              console.error("Presence logout update failed:", response.error);
            }

            resolve();
          });
        });
      }

      clearCookie("access_token");
      clearCookie("expires_in");
      disconnectSocket();

      router.replace("/");
    };

    runLogout();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <p className="text-sm text-gray-700">Logging out...</p>
    </div>
  );
}

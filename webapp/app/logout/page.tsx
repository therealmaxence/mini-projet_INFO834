"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { disconnectSocket } from "@/lib/socket";

function clearCookie(name: string): void {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; Secure; SameSite=Strict`;
}

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    clearCookie("access_token");
    clearCookie("expires_in");
    disconnectSocket();

    router.replace("/");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <p className="text-sm text-gray-700">Logging out...</p>
    </div>
  );
}

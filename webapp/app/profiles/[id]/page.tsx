"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { generateAvatar, svgToDataUrl } from "@/utils/avatar";
type AvatarMode = "generated";

const API_URL = "http://localhost:3002/";

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load user profile on mount
  useEffect(() => {
    if (!userId) return;

    const cookieString = typeof document !== 'undefined' ? document.cookie : "";
    const getCookieValue = (name: string) => {
      const row = cookieString.split("; ").find((row) => row.startsWith(`${name}=`));
      return row ? row.split("=")[1] : null;
    };

    const token = getCookieValue("access_token");

    fetch(`${API_URL}profiles/${userId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const name = data.username ?? data.user?.username ?? null;
        if (name) {
          setUsername(name);
          localStorage.setItem("profile_username", name);
          localStorage.setItem("profile_avatar", svgToDataUrl(generateAvatar(name)));
        }
      })
      .catch((err) => console.error("Failed to load profile:", err));
  }, [userId]);

  const [username, setUsername] = useState("");
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameMsg, setUsernameMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const generatedSvg = generateAvatar(username);
  const avatarSrc = svgToDataUrl(generatedSvg);

  // ── Username ──
  const startEditUsername = () => {
    setUsernameInput(username);
    setUsernameMsg(null);
    setEditingUsername(true);
  };

  const handleUsernameSave = async () => {
    const trimmed = usernameInput.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError("");

    const cookieString = typeof document !== 'undefined' ? document.cookie : "";
    const getCookieValue = (name: string) => {
      const row = cookieString.split("; ").find((row) => row.startsWith(`${name}=`));
      return row ? row.split("=")[1] : null;
    };
    const token = getCookieValue("access_token");

    try {
      const response = await fetch(`${API_URL}profiles/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ username: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update username.");
      }

      setUsername(trimmed);
      localStorage.setItem("profile_username", trimmed);
      localStorage.setItem("profile_avatar", svgToDataUrl(generateAvatar(trimmed)));
      setEditingUsername(false);
      setUsernameMsg({ type: "ok", text: "Username updated!" });
      setTimeout(() => setUsernameMsg(null), 3000);
    } catch (err: any) {
      console.error("Username update error:", err);
      setError(err.message);
      setUsernameMsg({ type: "err", text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Password ──
  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      setPasswordMsg({ type: "err", text: "Enter your current password." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: "err", text: "New password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "err", text: "Passwords don't match." });
      return;
    }

    setIsLoading(true);
    setError("");

    const cookieString = typeof document !== 'undefined' ? document.cookie : "";
    const getCookieValue = (name: string) => {
      const row = cookieString.split("; ").find((row) => row.startsWith(`${name}=`));
      return row ? row.split("=")[1] : null;
    };
    const token = getCookieValue("access_token");

    try {
      const response = await fetch(`${API_URL}profiles/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update password.");
      }

      setPasswordMsg({ type: "ok", text: "Password updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordMsg(null), 3000);
    } catch (err: any) {
      console.error("Password update error:", err);
      setPasswordMsg({ type: "err", text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center pt-7 px-4 pb-16 font-['DM_Sans',sans-serif]">
      
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[#3b4a54] text-sm font-medium no-underline self-start mb-5 transition-colors duration-150 hover:text-[#00a884]">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="w-full max-w-[600px] bg-white rounded-[20px] shadow-[0_4px_32px_rgba(0,0,0,0.08)] overflow-hidden">
        
        {/* ── Avatar ── */}
        <div className="flex flex-col items-center pt-9 px-6 pb-7 bg-[#1f2c34]">
          <div className="w-[104px] h-[104px] rounded-full p-[3px] bg-gradient-to-br from-[#00a884] to-[#25d366] mb-3.5 shadow-[0_8px_24px_rgba(0,168,132,0.35)]">
            <img src={avatarSrc} alt="Profile avatar" className="w-full h-full rounded-full object-cover block bg-[#2a3942]" />
          </div>
          <h1 className="font-['Syne',sans-serif] text-[22px] font-extrabold text-[#e9edef] m-0 mb-1 tracking-tight">{username}</h1>
          <p className="text-xs text-[#8696a0] m-0 mb-[18px] tracking-wide uppercase">Your profile</p>
        </div>

        <div className="h-[1px] w-full bg-[#f0f2f5]" />

        {/* ── Username ── */}
        <section className="p-6">
          <h2 className="font-['Syne',sans-serif] text-[13px] font-bold text-[#00a884] tracking-[0.8px] uppercase m-0 mb-4">Username</h2>

          {editingUsername ? (
            <div className="flex flex-col gap-2.5">
              <input
                autoFocus
                className="w-full bg-[#f0f2f5] border-[1.5px] border-transparent rounded-[10px] text-sm font-['DM_Sans',sans-serif] text-[#1c1c1e] py-[11px] px-3.5 outline-none transition-all duration-150 focus:border-[#00a884] focus:bg-white box-border"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUsernameSave();
                  if (e.key === "Escape") setEditingUsername(false);
                }}
                maxLength={32}
              />
              <div className="flex gap-2 justify-end">
                <button 
                  className="bg-[#f0f2f5] text-[#667781] border-none rounded-[10px] py-[11px] px-[22px] text-sm font-medium font-['DM_Sans',sans-serif] cursor-pointer transition-colors duration-150 hover:not:disabled:bg-[#e5e7eb] disabled:opacity-60 disabled:cursor-not-allowed" 
                  onClick={() => setEditingUsername(false)} 
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button 
                  className="bg-[#00a884] text-white border-none rounded-[10px] py-[11px] px-[22px] text-sm font-semibold font-['DM_Sans',sans-serif] cursor-pointer transition-all duration-150 hover:not-disabled:bg-[#008f71] active:not-disabled:scale-95 disabled:opacity-60 disabled:cursor-not-allowed" 
                  onClick={handleUsernameSave} 
                  disabled={isLoading}
                >
                  {isLoading ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-[#f0f2f5] rounded-[10px] py-3 px-4">
              <span className="text-[15px] font-medium text-[#1c1c1e]">{username}</span>
              <button 
                className="flex items-center gap-[5px] text-[13px] font-medium text-[#00a884] bg-transparent border-none cursor-pointer font-['DM_Sans',sans-serif] transition-opacity duration-150 hover:opacity-70" 
                onClick={startEditUsername}
              >
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 0110 16H8v-2a2 2 0 01.586-1.414z" />
                </svg>
                Edit
              </button>
            </div>
          )}

          {usernameMsg && (
            <p className={`text-[13px] font-medium py-2.5 px-3.5 rounded-lg mt-2.5 ${usernameMsg.type === 'ok' ? 'bg-[#d9fdd3] text-[#1a7a4a]' : 'bg-[#fde8e8] text-[#c0392b]'}`}>
              {usernameMsg.text}
            </p>
          )}
        </section>

        <div className="h-[1px] w-full bg-[#f0f2f5]" />

        {/* ── Password ── */}
        <section className="p-6">
          <h2 className="font-['Syne',sans-serif] text-[13px] font-bold text-[#00a884] tracking-[0.8px] uppercase m-0 mb-4">Change Password</h2>
          
          <form onSubmit={handlePasswordSave} className="flex flex-col gap-3.5">
            <label className="flex flex-col gap-1.5 text-[13px] font-medium text-[#667781]">
              Current password
              <input
                className="w-full bg-[#f0f2f5] border-[1.5px] border-transparent rounded-[10px] text-sm font-['DM_Sans',sans-serif] text-[#1c1c1e] py-[11px] px-3.5 outline-none transition-all duration-150 focus:border-[#00a884] focus:bg-white box-border"
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-[13px] font-medium text-[#667781]">
              New password
              <input
                className="w-full bg-[#f0f2f5] border-[1.5px] border-transparent rounded-[10px] text-sm font-['DM_Sans',sans-serif] text-[#1c1c1e] py-[11px] px-3.5 outline-none transition-all duration-150 focus:border-[#00a884] focus:bg-white box-border"
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-[13px] font-medium text-[#667781]">
              Confirm new password
              <input
                className="w-full bg-[#f0f2f5] border-[1.5px] border-transparent rounded-[10px] text-sm font-['DM_Sans',sans-serif] text-[#1c1c1e] py-[11px] px-3.5 outline-none transition-all duration-150 focus:border-[#00a884] focus:bg-white box-border"
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
              />
            </label>

            <label className="flex items-center gap-2 text-[13px] text-[#667781] cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showPasswords} 
                onChange={(e) => setShowPasswords(e.target.checked)} 
                className="accent-[#00a884] w-[15px] h-[15px]" 
              />
              Show passwords
            </label>

            {passwordMsg && (
              <p className={`text-[13px] font-medium py-2.5 px-3.5 rounded-lg m-0 ${passwordMsg.type === 'ok' ? 'bg-[#d9fdd3] text-[#1a7a4a]' : 'bg-[#fde8e8] text-[#c0392b]'}`}>
                {passwordMsg.text}
              </p>
            )}

            <button 
              type="submit" 
              className="w-full bg-[#00a884] text-white border-none rounded-[10px] py-[11px] px-[22px] text-sm font-semibold font-['DM_Sans',sans-serif] cursor-pointer transition-all duration-150 hover:not-disabled:bg-[#008f71] active:not-disabled:scale-95 disabled:opacity-60 disabled:cursor-not-allowed" 
              disabled={isLoading}
            >
              {isLoading ? "Updating…" : "Update password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
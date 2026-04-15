"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { API_URL } from "@/lib/api";
import { getCookie } from "@/lib/cookies";


// ── Generative avatar algorithm
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function generateAvatar(seed: string, size = 120): string {
  const h = hashStr(seed || "user");
  const rand = seededRand(h);

  const palette = [
    ["#0d6efd", "#6ea8fe", "#cfe2ff"],
    ["#00a884", "#25d366", "#d9fdd3"],
    ["#6f42c1", "#a98eda", "#e9d8fd"],
    ["#fd7e14", "#feb272", "#ffe5d0"],
    ["#d63384", "#f08bbc", "#fce4f0"],
    ["#20c997", "#79dfc8", "#d2f4ea"],
  ][Math.floor(rand() * 6)];

  const bg = palette[2];
  const mid = palette[0];
  const acc = palette[1];
  const cx = size / 2;
  const cy = size / 2;

  const polygon = (n: number, r: number, ox: number, oy: number, rot: number) => {
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + rot;
      return `${(ox + Math.cos(a) * r).toFixed(1)},${(oy + Math.sin(a) * r).toFixed(1)}`;
    }).join(" ");
  };

  const r1 = 30 + rand() * 20;
  const r2 = 18 + rand() * 15;
  const r3 = 10 + rand() * 10;
  const n1 = Math.floor(rand() * 3) + 3;
  const n2 = Math.floor(rand() * 3) + 4;
  const rot1 = rand() * Math.PI;
  const rot2 = rand() * Math.PI;
  const ox2 = cx + (rand() - 0.5) * 20;
  const oy2 = cy + (rand() - 0.5) * 20;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${bg}"/>
    <polygon points="${polygon(n1, r1, cx, cy, rot1)}" fill="${mid}" opacity="0.85"/>
    <polygon points="${polygon(n2, r2, ox2, oy2, rot2)}" fill="${acc}" opacity="0.9"/>
    <circle cx="${cx + (rand() - 0.5) * 24}" cy="${cy + (rand() - 0.5) * 24}" r="${r3}" fill="${mid}" opacity="0.6"/>
    <circle cx="${cx}" cy="${cy}" r="${r3 * 0.55}" fill="white" opacity="0.5"/>
  </svg>`;
}

function svgToDataUrl(svg: string) {
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

type AvatarMode = "generated";

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  //console.log("ProfilePage userId:", userId);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load user profile on mount
  useEffect(() => {
  if (!userId) return;

  const token = getCookie("access_token");

  fetch(`${API_URL}/profiles/${userId}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((data) => {
      const name = data.username ?? data.user?.username ?? null;
      if (name) setUsername(name);
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

    const token = getCookie("access_token");


    try {
      const response = await fetch(`${API_URL}/profiles/${userId}`, {
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

    const token = getCookie("access_token");

    try {
      const response = await fetch(`${API_URL}/profiles/${userId}`, {
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

      // Read updated tokens from cookies if your API sets them
      const accessToken = getCookie("access_token");
      const expiresIn = getCookie("expires_in");
      console.log("Tokens after password update:", { accessToken, expiresIn });

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
    <div className="profile-root">

      <Link href="/" className="back-link">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      <div className="profile-card">

        {/* ── Avatar ── */}
        <div className="avatar-section">
          <div className="avatar-ring">
            <img src={avatarSrc} alt="Profile avatar" className="avatar-img" />
          </div>
          <h1 className="profile-name">{username}</h1>
          <p className="profile-sub">Your profile</p>

        </div>

        <div className="divider" />

        {/* ── Username ── */}
        <section className="form-section">
          <h2 className="section-title">Username</h2>

          {editingUsername ? (
            <div className="inline-edit">
              <input
                autoFocus
                className="field-input"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUsernameSave();
                  if (e.key === "Escape") setEditingUsername(false);
                }}
                maxLength={32}
              />
              <div className="inline-edit-actions">
                <button className="btn-ghost" onClick={() => setEditingUsername(false)} disabled={isLoading}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleUsernameSave} disabled={isLoading}>
                  {isLoading ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div className="username-display">
              <span className="username-value">{username}</span>
              <button className="edit-btn" onClick={startEditUsername}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 0110 16H8v-2a2 2 0 01.586-1.414z" />
                </svg>
                Edit
              </button>
            </div>
          )}

          {usernameMsg && (
            <p className={`pw-msg ${usernameMsg.type}`} style={{ marginTop: 10 }}>{usernameMsg.text}</p>
          )}
        </section>

        <div className="divider" />

        {/* ── Password ── */}
        <section className="form-section">
          <h2 className="section-title">Change Password</h2>
          <form onSubmit={handlePasswordSave} className="password-form">

            <label className="field-label">Current password
              <input
                className="field-input"
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>

            <label className="field-label">New password
              <input
                className="field-input"
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
              />
            </label>

            <label className="field-label">Confirm new password
              <input
                className="field-input"
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
              />
            </label>

            <label className="show-pw-toggle">
              <input type="checkbox" checked={showPasswords} onChange={(e) => setShowPasswords(e.target.checked)} />
              Show passwords
            </label>

            {passwordMsg && (
              <p className={`pw-msg ${passwordMsg.type}`}>{passwordMsg.text}</p>
            )}

            <button type="submit" className="btn-primary full" disabled={isLoading}>
              {isLoading ? "Updating…" : "Update password"}
            </button>
          </form>
        </section>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700;800&display=swap');

        .profile-root {
          min-height: 100vh;
          background: #efeae2;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 28px 16px 60px;
          font-family: 'DM Sans', sans-serif;
        }

        .back-link {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #3b4a54;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          align-self: flex-start;
          margin-bottom: 20px;
          transition: color 0.15s;
        }
        .back-link:hover { color: #00a884; }

        .profile-card {
          width: 100%;
          max-width: 600px;
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 4px 32px rgba(0,0,0,0.08);
          overflow: hidden;
        }

        .avatar-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 36px 24px 28px;
          background: #1f2c34;
        }

        .avatar-ring {
          width: 104px;
          height: 104px;
          border-radius: 50%;
          padding: 3px;
          background: linear-gradient(135deg, #00a884, #25d366);
          margin-bottom: 14px;
          box-shadow: 0 8px 24px rgba(0,168,132,0.35);
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          display: block;
          background: #2a3942;
        }

        .profile-name {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #e9edef;
          margin: 0 0 4px;
          letter-spacing: -0.3px;
        }

        .profile-sub {
          font-size: 12px;
          color: #8696a0;
          margin: 0 0 18px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .avatar-tabs {
          display: flex;
          gap: 8px;
          background: #2a3942;
          border-radius: 10px;
          padding: 4px;
        }

        .avatar-tab {
          padding: 6px 18px;
          border: none;
          border-radius: 7px;
          font-size: 13px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          color: #8696a0;
          background: transparent;
          transition: all 0.15s;
        }

        .avatar-tab.active {
          background: #00a884;
          color: #fff;
          box-shadow: 0 2px 8px rgba(0,168,132,0.4);
        }

        .avatar-tab:not(.active):hover { color: #e9edef; }

        .divider { height: 1px; background: #f0f2f5; }

        .form-section { padding: 24px; }

        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #00a884;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin: 0 0 16px;
        }

        .username-display {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f0f2f5;
          border-radius: 10px;
          padding: 12px 16px;
        }

        .username-value { font-size: 15px; font-weight: 500; color: #1c1c1e; }

        .edit-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          font-weight: 500;
          color: #00a884;
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: opacity 0.15s;
        }
        .edit-btn:hover { opacity: 0.7; }

        .inline-edit { display: flex; flex-direction: column; gap: 10px; }

        .inline-edit-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .password-form { display: flex; flex-direction: column; gap: 14px; }

        .field-label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #667781;
        }

        .field-input {
          width: 100%;
          background: #f0f2f5;
          border: 1.5px solid transparent;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #1c1c1e;
          padding: 11px 14px;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
          box-sizing: border-box;
        }

        .field-input:focus { border-color: #00a884; background: #fff; }

        .show-pw-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #667781;
          cursor: pointer;
          user-select: none;
        }

        .show-pw-toggle input { accent-color: #00a884; width: 15px; height: 15px; }

        .pw-msg {
          font-size: 13px;
          font-weight: 500;
          padding: 10px 14px;
          border-radius: 8px;
          margin: 0;
        }
        .pw-msg.ok { background: #d9fdd3; color: #1a7a4a; }
        .pw-msg.err { background: #fde8e8; color: #c0392b; }

        .btn-primary {
          background: #00a884;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 11px 22px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }
        .btn-primary:hover:not(:disabled) { background: #008f71; }
        .btn-primary:active:not(:disabled) { transform: scale(0.98); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-primary.full { width: 100%; }

        .btn-ghost {
          background: #f0f2f5;
          color: #667781;
          border: none;
          border-radius: 10px;
          padding: 11px 22px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-ghost:hover:not(:disabled) { background: #e5e7eb; }
        .btn-ghost:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
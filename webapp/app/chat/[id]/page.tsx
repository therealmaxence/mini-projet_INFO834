"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import GifPicker from "@/components/GifPicker";
import type { IGif } from "@giphy/js-types";
import { generateAvatar, svgToDataUrl } from "@/utils/avatar";

const API_URL = "http://localhost:3002";

interface Message {
  _id: string;
  owner: any;
  channel: Object;
  type: string;
  content: string;
  created: string;
  updated: string;
}

const cookieString = typeof document !== 'undefined' ? document.cookie : "";
const getCookieValue = (name: string) => {
  const row = cookieString.split("; ").find((row) => row.startsWith(`${name}=`));
  return row ? row.split("=")[1] : null;
};

const token = getCookieValue("access_token");

export const getMessages = async (token: string, chatId: string) => {
  const response = await fetch(`${API_URL}/messages/channel/${chatId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error("Erreur lors de la récupération des messages");
  return response.json();
};

export const getUserConnected = async () => {
  const response = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error("Erreur lors de la récupération du user");
  return response.json();
};

export const postMessage = async (token: string, chatId: string, content: string) => {
  const response = await fetch(`${API_URL}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ channel: chatId, content }),
  });

  if (!response.ok) throw new Error("Erreur lors de l'envoi du message");
  return response.json();
};

export const getChanelName = async (token: string, chatId: string) => {
  const response = await fetch(`${API_URL}/channels/${chatId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error("Erreur lors de la récupération du nom du canal");
  return response.json().then((data) => data.name);
};

export default function ChatRoomPage() {
  const params = useParams();
  const chatId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [messageInput, setMessageInput] = useState("");
  const [chanelName, setChanelName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [pendingGif, setPendingGif] = useState<{ url: string; alt: string } | null>(null);

  const canSend = messageInput.trim().length > 0 || !!pendingGif;
  const [profileUsername, setProfileUsername] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");

  // Fetch connected user
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;
      try {
        const userData = await getUserConnected();
        setUser(userData);
      } catch (error) {
        console.error("Erreur lors de la récupération du user :", error);
      }
    };
    fetchUser();
  }, []);

  // Load profile info from localStorage on mount
  useEffect(() => {
    setProfileUsername(localStorage.getItem("profile_username") || "");
    setProfileAvatar(localStorage.getItem("profile_avatar") || "");
  }, []);

  // Fetch channel name
  useEffect(() => {
    const fetchChannelName = async () => {
      if (!token || !chatId) return;
      try {
        const name = await getChanelName(token, chatId);
        setChanelName(name);
      } catch (error) {
        console.error("Erreur lors de la récupération du nom du canal :", error);
      }
    };
    fetchChannelName();
  }, [chatId]);

  // Fetch messages
  useEffect(() => {
    if (!token || !chatId) {
      console.error("Aucun token disponible");
      return;
    }
    getMessages(token, chatId)
      .then((response) => setMessages(response))
      .catch((error) => console.error("Erreur :", error));
  }, [chatId]);

  // GIF handler
  const handleGifSelect = (gif: IGif, url: string) => {
    setPendingGif({ url, alt: gif.title || "GIF" });
    setShowGifPicker(false);
  };

  // Send message (text or GIF)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatId || !token) return;

    try {
      if (pendingGif) {
        const newMessage = await postMessage(token, chatId, pendingGif.url);
        setMessages((prev) => [...prev, newMessage]);
        setPendingGif(null);
      } else if (messageInput.trim()) {
        const newMessage = await postMessage(token, chatId, messageInput);
        setMessages((prev) => [...prev, newMessage]);
        setMessageInput("");
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du message :", error);
      alert("Impossible d'envoyer le message.");
    }
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex h-16 items-center border-b border-gray-200 bg-gray-50 px-4 py-3">
        <Link href="/home" className="mr-4 text-gray-500 hover:text-gray-900">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex items-center flex-1">
          
          {/* Updated Channel Icon */}
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-300 text-lg font-bold text-gray-700 uppercase">
            {chanelName ? chanelName[0] : "#"}
          </div>

          <div className="ml-3">
            <h2 className="text-base font-medium text-gray-900">{chanelName || `Chat #${chatId}`}</h2>
          </div>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto bg-[#efeae2] p-4 space-y-4">
        {user && messages.map((msg) => {
          const isMe = msg.owner._id === user._id;
          const senderIdentifier = msg.owner.username || msg.owner._id;
          
          const avatarUrl = isMe && profileAvatar 
            ? profileAvatar 
            : svgToDataUrl(generateAvatar(senderIdentifier, 40));

          // Calculate time formatting
          const msgDate = new Date(msg.created);
          const timeString = msgDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const isEdited = msg.updated && msg.updated !== msg.created;

          return (
            <div key={msg._id} className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
              
              {!isMe && (
                <Link href={`/profiles/${msg.owner._id}`}>
                  <img 
                    src={avatarUrl} 
                    alt={msg.owner.username || "User"} 
                    className="h-8 w-8 rounded-full flex-shrink-0 mb-1 cursor-pointer hover:opacity-80 transition-opacity"
                  />
                </Link>
              )}

              <div className={`relative min-w-[100px] max-w-[75%] rounded-lg px-4 py-2 shadow-sm flex flex-col ${isMe ? "bg-[#d9fdd3]" : "bg-white"}`}>
                
                {/* Username above message for others */}
                {!isMe && msg.owner.username && (
                  <span className="text-[11px] font-bold text-gray-500 block mb-1">
                    {msg.owner.username}
                  </span>
                )}
                
                {/* Content */}
                {msg.content.startsWith("http") ? (
                  <img src={msg.content} alt="GIF" className="max-w-[200px] rounded-lg" />
                ) : (
                  <p className="text-sm text-gray-900">{msg.content}</p>
                )}

                {/* Timestamp & Edit status */}
                <span className={`text-[10px] mt-1 self-end ${isMe ? "text-green-700/70" : "text-gray-400"}`}>
                  {timeString} {isEdited && <span className="italic ml-1">(edited)</span>}
                </span>
              </div>

              {isMe && (
                <Link href={`/profiles/${user._id}`}>
                  <img 
                    src={avatarUrl} 
                    alt="Me" 
                    className="h-8 w-8 rounded-full flex-shrink-0 mb-1 cursor-pointer hover:opacity-80 transition-opacity"
                  />
                </Link>
              )}

            </div>
          );
        })}
      </div>

      {/* GIF Picker */}
      {showGifPicker && (
        <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
      )}

      {/* Input Area */}
      <div className="flex items-center bg-gray-50 px-4 py-3 gap-2">
        {/* GIF Button */}
        <button
          type="button"
          onClick={() => setShowGifPicker((prev) => !prev)}
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border transition-colors ${
            showGifPicker
              ? "border-black bg-black text-white"
              : "border-gray-300 bg-white text-gray-500 hover:border-gray-400 hover:text-gray-700"
          }`}
          aria-label="Open GIF picker"
          aria-expanded={showGifPicker}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M7 12h2v2H7v-4h3" />
            <path d="M13 10h3" />
            <path d="M13 12h2" />
            <path d="M13 10v4" />
            <path d="M19 10v4" />
            <path d="M19 12h-2v0" />
          </svg>
        </button>

        <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-2">
          {/* GIF preview or text input */}
          {pendingGif ? (
            <div className="flex-1 flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm">
              <div className="relative flex-shrink-0">
                <img
                  src={pendingGif.url}
                  alt={pendingGif.alt}
                  className="h-14 w-auto max-w-[160px] rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPendingGif(null)}
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-700 text-white text-[10px] hover:bg-gray-900 transition-colors"
                  aria-label="Remove GIF"
                >
                  ✕
                </button>
              </div>
              <span className="text-xs text-gray-400 italic">GIF ready to send</span>
            </div>
          ) : (
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message"
              className="w-full rounded-full border-none bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300 shadow-sm"
            />
          )}

          {/* Send button */}
          <button
            type="submit"
            disabled={!canSend}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-black text-white disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
          >
            <svg className="h-5 w-5 translate-x-[-1px] translate-y-[1px]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
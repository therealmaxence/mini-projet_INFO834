"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import GifPicker from "@/components/GifPicker";
import type { IGif } from "@giphy/js-types";

const MESSAGES = [
  { id: 1, text: "Hey! How is the new app coming along?", time: "10:30 AM", isMe: false },
  { id: 2, text: "It's going really well! Just building the UI now.", time: "10:35 AM", isMe: true },
  { id: 3, text: "That's awesome. Send screenshots when you can.", time: "10:38 AM", isMe: false },
  { id: 4, text: "Are we still on for tomorrow?", time: "10:42 AM", isMe: false },
  { id: 5, text: "Yes, looking forward to it!", time: "10:45 AM", isMe: true },
];

export default function ChatRoomPage() {
  const params = useParams();
  const chatId = params.id;
  const [messageInput, setMessageInput] = useState("");
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [pendingGif, setPendingGif] = useState<{ url: string; alt: string } | null>(null);

  const handleGifSelect = (gif: IGif, url: string) => {
    setPendingGif({ url, alt: gif.title || "GIF" });
    setMessageInput("");
    setShowGifPicker(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() && !pendingGif) return;

    if (pendingGif) {
      console.log("Sending GIF:", pendingGif.url);
      // TODO: dispatch GIF message to your backend
      setPendingGif(null);
    } else {
      console.log(`Sending message to chat ${chatId}:`, messageInput);
      // TODO: dispatch text message to your backend
      setMessageInput("");
    }
  };

  const canSend = !!messageInput.trim() || !!pendingGif;

  return (
    <div className="flex h-screen flex-col">

      {/* Header */}
      <div className="flex h-16 items-center border-b border-gray-200 bg-gray-50 px-4 py-3">
        <Link href="/" className="mr-4 text-gray-500 hover:text-gray-900">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex items-center flex-1">
          <div className="h-10 w-10 rounded-full bg-gray-300"></div>
          <div className="ml-3">
            <h2 className="text-base font-medium text-gray-900">Chat #{chatId}</h2>
          </div>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto bg-[#efeae2] p-4 space-y-4">
        {MESSAGES.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}>
            <div className={`relative max-w-[75%] rounded-lg px-4 py-2 shadow-sm ${msg.isMe ? "bg-[#d9fdd3] text-gray-900" : "bg-white text-gray-900"}`}>
              <p className="text-sm">{msg.text}</p>
              <span className="mt-1 block text-right text-[10px] text-gray-500">{msg.time}</span>
            </div>
          </div>
        ))}
      </div>

      {/* GIF Picker */}
      {showGifPicker && (
        <GifPicker
          onSelect={handleGifSelect}
          onClose={() => setShowGifPicker(false)}
        />
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
            </div>
          ) : (
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message"
              className="w-full rounded-full border-none bg-white px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 shadow-sm"
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
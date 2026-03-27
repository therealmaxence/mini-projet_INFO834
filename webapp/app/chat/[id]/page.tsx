"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// Dummy data
const MESSAGES = [
  { id: 1, text: "Hey! How is the new app coming along?", time: "10:30 AM", isMe: false },
  { id: 2, text: "It's going really well! Just building the UI now.", time: "10:35 AM", isMe: true },
  { id: 3, text: "That's awesome. Send screenshots when you can.", time: "10:38 AM", isMe: false },
  { id: 4, text: "Are we still on for tomorrow?", time: "10:42 AM", isMe: false },
  { id: 5, text: "Yes, looking forward to it!", time: "10:45 AM", isMe: true },
];

export default function ChatRoomPage() {
  const params = useParams();
  const chatId = params.id; // You can use this to fetch the right chat from your DB
  const [messageInput, setMessageInput] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    console.log(`Sending message to chat ${chatId}:`, messageInput);
    setMessageInput("");
  };

  return (
    <div className="flex h-screen flex-col">
      
      {/* Header */}
      <div className="flex h-16 items-center border-b border-gray-200 bg-gray-50 px-4 py-3">
        <Link href="/" className="mr-4 text-gray-500 hover:text-gray-900">
          {/* Back Arrow Icon */}
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div className="flex items-center flex-1">
          <div className="h-10 w-10 rounded-full bg-gray-300"></div>
          <div className="ml-3">
            {/* In reality, fetch the name using the ID */}
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

      {/* Input Area */}
      <div className="flex items-center bg-gray-50 px-4 py-3">
        <form onSubmit={handleSendMessage} className="flex-1 flex items-center">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message"
            className="w-full rounded-full border-none bg-white px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 shadow-sm"
          />
          <button 
            type="submit" 
            disabled={!messageInput.trim()}
            className="ml-4 flex h-10 w-10 items-center justify-center rounded-full bg-black text-white disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
          >
            {/* Send Icon */}
            <svg className="h-5 w-5 translate-x-[-1px] translate-y-[1px]" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
          </button>
        </form>
      </div>

    </div>
  );
}
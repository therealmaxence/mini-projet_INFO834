"use client";

import { useState } from "react";

// Dummy data to populate the UI
const CHATS = [
  { id: 1, name: "Alice Smith", lastMessage: "Are we still on for tomorrow?", time: "10:42 AM", unread: 2 },
  { id: 2, name: "Bob Johnson", lastMessage: "Sent an attachment", time: "Yesterday", unread: 0 },
  { id: 3, name: "Design Team", lastMessage: "The new mockups look great!", time: "Tuesday", unread: 5 },
  { id: 4, name: "Mom", lastMessage: "Call me when you get home ❤️", time: "Monday", unread: 0 },
];

const MESSAGES = [
  { id: 1, sender: "Alice Smith", text: "Hey! How is the new app coming along?", time: "10:30 AM", isMe: false },
  { id: 2, sender: "Me", text: "It's going really well! Just building the UI now.", time: "10:35 AM", isMe: true },
  { id: 3, sender: "Alice Smith", text: "That's awesome. Send screenshots when you can.", time: "10:38 AM", isMe: false },
  { id: 4, sender: "Alice Smith", text: "Are we still on for tomorrow?", time: "10:42 AM", isMe: false },
];

export default function ChatPage() {
  const [activeChat, setActiveChat] = useState(CHATS[0]);
  const [messageInput, setMessageInput] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    console.log("Sending message:", messageInput);
    setMessageInput(""); // Clear input after sending
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      
      {/* Sidebar (Left Pane) */}
      <div className="flex w-full flex-col border-r border-gray-200 bg-white md:w-1/3 lg:w-1/4">
        
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="h-10 w-10 rounded-full bg-gray-300"></div> {/* User Avatar */}
          <div className="flex space-x-4 text-gray-500">
            <button className="hover:text-gray-700">
              {/* Status Icon */}
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
            <button className="hover:text-gray-700">
              {/* New Chat Icon */}
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="border-b border-gray-200 bg-white p-3">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="Search or start new chat"
              className="block w-full rounded-lg bg-gray-100 py-2 pl-10 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto bg-white">
          {CHATS.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setActiveChat(chat)}
              className={`flex cursor-pointer items-center border-b border-gray-100 p-3 hover:bg-gray-50 transition-colors ${
                activeChat.id === chat.id ? "bg-gray-100" : ""
              }`}
            >
              <div className="h-12 w-12 flex-shrink-0 rounded-full bg-gray-300"></div> {/* Avatar */}
              <div className="ml-4 flex-1 overflow-hidden">
                <div className="flex items-baseline justify-between">
                  <h3 className="truncate text-base font-medium text-gray-900">{chat.name}</h3>
                  <span className="ml-2 flex-shrink-0 text-xs text-gray-500">{chat.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm text-gray-600">{chat.lastMessage}</p>
                  {chat.unread > 0 && (
                    <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area (Right Pane) */}
      <div className="hidden flex-1 flex-col md:flex">
        
        {/* Active Chat Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gray-300"></div>
            <div className="ml-4">
              <h2 className="text-base font-medium text-gray-900">{activeChat.name}</h2>
              <p className="text-xs text-gray-500">Click here for contact info</p>
            </div>
          </div>
          <div className="flex space-x-4 text-gray-500">
            <button className="hover:text-gray-700">
              {/* Search Icon */}
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
            <button className="hover:text-gray-700">
              {/* Menu Icon */}
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            </button>
          </div>
        </div>

        {/* Message Feed (WhatsApp signature background color) */}
        <div className="flex-1 overflow-y-auto bg-[#efeae2] p-4 space-y-4">
          {MESSAGES.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`relative max-w-[70%] rounded-lg px-4 py-2 shadow-sm ${
                  msg.isMe ? "bg-[#d9fdd3] text-gray-900" : "bg-white text-gray-900"
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <span className="mt-1 block text-right text-[10px] text-gray-500">
                  {msg.time}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input Area */}
        <div className="flex items-center bg-gray-50 px-4 py-3">
          <button className="mr-4 text-gray-500 hover:text-gray-700">
            {/* Emoji/Attachment Icon */}
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
          
          <form onSubmit={handleSendMessage} className="flex-1 flex items-center">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message"
              className="w-full rounded-lg border-none bg-white px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 shadow-sm"
            />
            {messageInput.trim() ? (
              <button type="submit" className="ml-4 text-gray-500 hover:text-green-600 transition-colors">
                {/* Send Icon */}
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
              </button>
            ) : (
              <button type="button" className="ml-4 text-gray-500 hover:text-gray-700">
                {/* Mic Icon */}
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </button>
            )}
          </form>
        </div>

      </div>
    </div>
  );
}
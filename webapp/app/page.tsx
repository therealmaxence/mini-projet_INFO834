"use client";

import { useState, useEffect, useRef } from "react";

type Message = {
  _id?: string;
  sender: string;
  recipient: string;
  content: string;
  msg_type?: string;
  timestamp?: string;
  edited?: boolean;
  expires_at?: string;
  ttl?: number;
};

type Analytics = {
  total_messages: number;
  most_active_sender: [string, number] | null;
  most_solicited_user: [string, number] | null;
};

export default function ChatApp() {
  const [username, setUsername] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [targetUser, setTargetUser] = useState("all");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [selectedTtl, setSelectedTtl] = useState<number | null>(null); // null means no TTL
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch history and analytics when joining
  useEffect(() => {
    if (isJoined) {
      fetch(`http://${window.location.hostname}:8000/messages`)
        .then((res) => res.json())
        .then((data) => setMessages(data))
        .catch(console.error);

      fetch(`http://${window.location.hostname}:8000/channels`)
        .then((res) => res.json())
        .then((data) => setChannels(data))
        .catch(console.error);

      fetchAnalytics();
    }
  }, [isJoined]);

  // Connect to Websocket
  useEffect(() => {
    if (isJoined && username) {
      ws.current = new WebSocket(`ws://${window.location.hostname}:8000/ws/${username}`);
      
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "users") {
          setOnlineUsers(data.data);
        } else if (data.type === "message") {
          setMessages((prev) => [...prev, data.data]);
          fetchAnalytics(); // Update stats gently
        } else if (data.type === "message_edited") {
          setMessages((prev) => 
            prev.map((msg) => msg._id === data.data._id ? data.data : msg)
          );
        } else if (data.type === "message_deleted") {
          setMessages((prev) => 
            prev.filter((msg) => msg._id !== data.data._id)
          );
        }
      };

      return () => {
        ws.current?.close();
      };
    }
  }, [isJoined, username]);

  // Timer to drive disappearing messages countdowns
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter out messages that have expired locally
  useEffect(() => {
    const checkExpiry = () => {
      const now = new Date();
      setMessages((prev) => prev.filter(msg => {
        if (!msg.expires_at) return true;
        return new Date(msg.expires_at) > now;
      }));
    };
    const interval = setInterval(checkExpiry, 1000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchAnalytics = () => {
    fetch(`http://${window.location.hostname}:8000/analytics`)
      .then((res) => res.json())
      .then((data) => setAnalytics(data))
      .catch(console.error);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawingActive(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = (e as React.TouchEvent<HTMLCanvasElement>).touches[0].clientX;
      clientY = (e as React.TouchEvent<HTMLCanvasElement>).touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent<HTMLCanvasElement>).clientX;
      clientY = (e as React.MouseEvent<HTMLCanvasElement>).clientY;
    }

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = (e as React.TouchEvent<HTMLCanvasElement>).touches[0].clientX;
      clientY = (e as React.TouchEvent<HTMLCanvasElement>).touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent<HTMLCanvasElement>).clientX;
      clientY = (e as React.MouseEvent<HTMLCanvasElement>).clientY;
    }

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#4f46e5';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawingActive(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const sendDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    if (ws.current) {
      if (editingMessageId) {
        ws.current.send(
          JSON.stringify({
            action: "edit",
            message_id: editingMessageId,
            content: dataUrl
          })
        );
        setEditingMessageId(null);
      } else {
        ws.current.send(
          JSON.stringify({
            action: "send",
            recipient: targetUser,
            content: dataUrl,
            msg_type: "image",
            ttl: selectedTtl
          })
        );
      }
    }
    setIsDrawing(false);
    clearCanvas();
  };

  const startEditing = (msg: Message) => {
    setEditingMessageId(msg._id || null);
    if (msg.msg_type === "image") {
      setIsDrawing(true);
      // Wait for canvas to mount then draw the image onto it
      setTimeout(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = msg.content;
        }
      }, 100);
    } else {
      setCurrentMessage(msg.content);
      setIsDrawing(false);
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) setIsJoined(true);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMessage.trim() && ws.current) {
      if (editingMessageId) {
        ws.current.send(
          JSON.stringify({
            action: "edit",
            message_id: editingMessageId,
            content: currentMessage,
          })
        );
        setEditingMessageId(null);
      } else {
        ws.current.send(
          JSON.stringify({
            action: "send",
            recipient: targetUser,
            content: currentMessage,
            msg_type: "text",
            ttl: selectedTtl,
          })
        );
      }
      setCurrentMessage("");
    }
  };

  if (!isJoined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-900 transition-colors">
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-white dark:bg-zinc-800 p-10 shadow-xl border border-gray-100 dark:border-zinc-700">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Join the Chat
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">INFO834 Mini-Project</p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleJoin}>
            <div>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-zinc-900 dark:ring-zinc-700 dark:text-white transition-all"
                placeholder="Enter your username..."
              />
            </div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-xl bg-indigo-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-transform active:scale-95"
            >
              Start Chatting
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-zinc-900 font-sans text-gray-900 dark:text-gray-100 antialiased overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-zinc-800 border-r border-gray-200 dark:border-zinc-700 flex flex-col shadow-lg z-10 transition-colors">
        <div className="p-6 border-b border-gray-200 dark:border-zinc-700">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
            INFO834 Chat
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Logged in as <span className="font-semibold text-gray-800 dark:text-gray-200">{username}</span></p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Channels Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                Channels
              </h3>
              <button 
                onClick={() => {
                  const name = prompt("Enter channel name:");
                  if (name && name.trim()) {
                    const cname = name.trim().startsWith("#") ? name.trim() : "#" + name.trim();
                    fetch(`http://${window.location.hostname}:8000/channels/${encodeURIComponent(cname)}`, { method: "POST" })
                      .then(() => {
                        if (!channels.includes(cname)) setChannels((prev) => [...prev, cname]);
                        setTargetUser(cname);
                      })
                      .catch(console.error);
                  }
                }}
                className="text-xs text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer font-semibold"
              >
                + NEW
              </button>
            </div>
            <ul className="space-y-2 mb-6">
              <li 
                onClick={() => setTargetUser("all")}
                className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${targetUser === "all" ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" : "hover:bg-gray-100 dark:hover:bg-zinc-700"}`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                  All
                </div>
                <span className="font-medium text-sm">Everyone (General)</span>
              </li>
              {channels.map((channel) => (
                <li 
                  key={channel}
                  onClick={() => setTargetUser(channel)}
                  className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${targetUser === channel ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" : "hover:bg-gray-100 dark:hover:bg-zinc-700"}`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-400 to-gray-500 dark:from-zinc-600 dark:to-zinc-500 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                    #
                  </div>
                  <span className="font-medium text-sm">{channel}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-4">
              Online Users ({onlineUsers.length})
            </h3>
            <ul className="space-y-2">
              {onlineUsers.filter(u => u !== username).map((user) => (
                <li 
                  key={user}
                  onClick={() => setTargetUser(user)}
                  className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${targetUser === user ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" : "hover:bg-gray-100 dark:hover:bg-zinc-700"}`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-inner uppercase">
                    {user.charAt(0)}
                  </div>
                  <span className="font-medium text-sm">{user}</span>
                  <div className="w-2 h-2 rounded-full bg-green-500 ml-auto shadow-[0_0_5px_rgba(34,197,94,0.6)]"></div>
                </li>
              ))}
            </ul>
          </div>

          {analytics && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-4">
                Global Statistics (Redis)
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm">
                  <p className="text-xs text-gray-500 dark:text-zinc-400">Total Messages</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{analytics.total_messages}</p>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm">
                  <p className="text-xs text-gray-500 dark:text-zinc-400">Most Active Sender</p>
                  <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                    {analytics.most_active_sender ? `${analytics.most_active_sender[0]} (${analytics.most_active_sender[1]} msgs)` : "N/A"}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm">
                  <p className="text-xs text-gray-500 dark:text-zinc-400">Most Solicited</p>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                    {analytics.most_solicited_user ? `${analytics.most_solicited_user[0]} (${analytics.most_solicited_user[1]} msgs)` : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-black/50 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
        
        {/* Chat Header */}
        <div className="h-20 border-b border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex items-center px-8 shrink-0 z-10 shadow-sm">
          <h2 className="text-lg font-semibold">
            {targetUser === "all" ? "General Chat" : `Private Chat with ${targetUser}`}
          </h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 z-10">
          {messages
            .filter((msg) => {
              if (targetUser === "all") return msg.recipient === "all";
              if (targetUser.startsWith("#")) return msg.recipient === targetUser;
              return (msg.sender === username && msg.recipient === targetUser) || (msg.sender === targetUser && msg.recipient === username);
            })
            .map((msg, i) => {
              const isMe = msg.sender === username;
              return (
                <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`flex items-end space-x-2 max-w-[70%] ${isMe ? "flex-row-reverse space-x-reverse" : "flex-row"}`}>
                    {!isMe && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-md uppercase">
                        {msg.sender.charAt(0)}
                      </div>
                    )}
                    <div
                      className={`relative px-5 py-3.5 max-w-full text-sm shadow-sm md:max-w-md break-words group/msg transition-all duration-300 ${
                        isMe
                          ? "bg-indigo-600 text-white rounded-2xl rounded-br-sm"
                          : "bg-white text-gray-800 border border-gray-100 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 rounded-2xl rounded-bl-sm"
                      } ${editingMessageId === msg._id ? "ring-2 ring-amber-400 ring-offset-2 scale-[1.02]" : ""}`}
                    >
                      {!isMe && <div className="font-semibold text-xs mb-1 opacity-75">{msg.sender}</div>}
                      {msg.msg_type === "image" ? (
                        <div className="relative">
                          <img src={msg.content} alt="Drawing" className="max-w-[200px] h-auto rounded-lg bg-white border border-gray-200" />
                          {isMe && (
                            <button
                              onClick={() => startEditing(msg)}
                              className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg opacity-0 group-hover/msg:opacity-100 transition-opacity hover:bg-black/80 backdrop-blur-sm shadow-sm"
                              title="Edit drawing"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-start gap-3 w-full">
                          <p className="leading-relaxed flex-1 whitespace-pre-wrap">{msg.content}</p>
                          {isMe && (
                            <button
                              onClick={() => startEditing(msg)}
                              className={`p-1 mt-0.5 shrink-0 transition-opacity ${
                                isMe ? "text-indigo-200 hover:text-white" : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                              } opacity-0 group-hover/msg:opacity-100`}
                              title="Edit message"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      )}
                      
                      {msg.timestamp && (
                        <div className={`flex items-center gap-1.5 justify-end mt-1 text-[10px] ${isMe ? "text-indigo-200" : "text-gray-400 dark:text-zinc-500"}`}>
                          {msg.expires_at && (
                            <div className="flex items-center gap-1 bg-black/10 px-1.5 py-0.5 rounded-md font-medium">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                              </svg>
                              <span>{Math.max(0, Math.ceil((new Date(msg.expires_at).getTime() - currentTime.getTime()) / 1000))}s</span>
                            </div>
                          )}
                          {msg.edited && <span className="italic font-medium opacity-90">(edited)</span>}
                          <span>{new Date(msg.timestamp!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 shrink-0 z-10 relative">
          {isDrawing && (
            <div className="absolute bottom-full right-6 mb-4 bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 z-50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold">Scribble a drawing</span>
                <button type="button" onClick={clearCanvas} className="text-xs text-red-500 hover:underline">Clear</button>
              </div>
              <canvas 
                ref={canvasRef}
                width={250}
                height={250}
                className="bg-gray-50 dark:bg-zinc-900 rounded-lg cursor-crosshair border border-gray-200 dark:border-zinc-700 aspect-square"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <div className="mt-3 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsDrawing(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 dark:text-zinc-400 font-medium hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={sendDrawing}
                  className="px-4 py-1.5 text-xs bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-500 transition-colors shadow-sm"
                >
                  Send
                </button>
              </div>
            </div>
          )}
          <form onSubmit={sendMessage} className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={() => setIsDrawing(!isDrawing)}
              className="p-3 bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:text-indigo-600 rounded-full transition-colors flex items-center justify-center shrink-0"
              title="Send a drawing"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
              </svg>
            </button>
            <div className="relative">
              <select
                value={selectedTtl === null ? "null" : selectedTtl}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedTtl(val === "null" ? null : parseInt(val));
                }}
                className="appearance-none bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 text-[10px] font-bold py-3 px-4 pr-8 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all border-none"
                title="Message expiration"
              >
                <option value="null">PERM</option>
                <option value="5">5S</option>
                <option value="10">10S</option>
                <option value="30">30S</option>
                <option value="60">60S</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder={editingMessageId ? "Edit message..." : targetUser === "all" ? "Message everyone..." : `Message ${targetUser}...`}
                className={`w-full rounded-full border-0 py-4 px-6 pr-14 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white shadow-inner focus:outline-none focus:ring-2 placeholder-gray-400 sm:text-sm transition-all ${
                  editingMessageId ? "focus:ring-amber-500 bg-amber-50 dark:bg-amber-900/20" : "focus:ring-indigo-500"
                }`}
              />
              {editingMessageId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingMessageId(null);
                    setCurrentMessage("");
                  }}
                  className="absolute right-14 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              )}
              <button
                type="submit"
                disabled={!currentMessage.trim() && !isDrawing}
                className={`absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center rounded-full text-white shadow-md transition-transform active:scale-95 ${
                  !currentMessage.trim() && !isDrawing
                    ? "bg-indigo-300 cursor-not-allowed" 
                    : editingMessageId 
                      ? "bg-amber-500 hover:bg-amber-400"
                      : "bg-indigo-600 hover:bg-indigo-500"
                }`}
              >
                {editingMessageId ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

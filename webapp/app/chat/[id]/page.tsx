"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { API_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/cookies";


interface Message {
  _id: string;
  owner: Object;
  channel: Object;
  type: string;
  content: string;
}

export const getMessages = async (authToken: string, chatId: string) => {
  const response = await  fetch(`${API_URL}/messages/channel/${chatId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des messages');
  }

  return response.json();
};

export const getUserConnected = async () => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Aucun token disponible');
  }

  const response = await  fetch(`${API_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération du user');
  }

  return response.json();
};

export const postMessage = async (token: string, chatId: string, content: string) => {
  const response = await fetch(`${API_URL}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      channel: chatId,
      content: content
    })
  });

  if (!response.ok) {
    throw new Error('Erreur lors de l\'envoi du message');
  }

  return response.json();
};

export const getChanelName = async (authToken: string, chatId: string) => {
  const response = await fetch(`${API_URL}/channels/${chatId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération du nom du canal');
  }

  return response.json().then((data) => data.name);
};

export default function ChatRoomPage() {
  const params = useParams();
  const chatId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [Messages, setMessages] = useState<Message[]>([]);
  const [channelUsers, setChannelUsers] = useState(0);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  };

  // Socket setup for real-time messages
  useEffect(() => {
    if (!chatId) return;
    const socket = getSocket();

    const onChannelUsers = (payload: { channelId: string; count: number }) => {
      if (payload.channelId === chatId) {
        setChannelUsers(payload.count);
      }
    };

    socket.on("channel_presence_count", onChannelUsers);

    socket.emit("join_channel", { channelId: chatId }, (response: { count?: number; error?: string }) => {
      if (response?.error) {
        console.error("Erreur lors de la récupération du compteur de channel :", response.error);
        return;
      }

      if (typeof response?.count === "number") {
        setChannelUsers(response.count);
      }
    });

    const onMessage = (msg: Message) => {
      if (msg.channel === chatId) {
        if (msg.type === "text") {
          setMessages((prev: Message[]) => [...prev, msg]);
          let audio = new Audio('/whatsapp.mp3');
          audio.play();
        } else {
          // ToDo : fetch message content with id
        }
        setTimeout(scrollToBottom, 0);
      }
    };

    socket.on("message", onMessage);
    return () => {
      socket.off("message", onMessage);
      socket.off("channel_presence_count", onChannelUsers);
      socket.emit("leave_channel", { channelId: chatId });
    };
  }, [chatId]);

  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const token = getAccessToken();

    const fetchUser = async () => {
      if (token) {
        try {
          const userData = await getUserConnected();
          setUser(userData);
        } catch (error) {
          console.error('Erreur lors de la récupération du user :', error);
        }
      }
    };
    fetchUser();
  }, []);

  const [chanelName, setChanelName] = useState("");
  useEffect(() => {
    const token = getAccessToken();

    const fetchChannelName = async () => {
      if (token && chatId) {
        try {
          const name = await getChanelName(token, chatId);
          setChanelName(name);
        } catch (error) {
          console.error('Erreur lors de la récupération du nom du canal :', error);
        }
      }
    };
    fetchChannelName();
  }, [chatId]);

  const canSend = messageInput.trim().length > 0;
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();

    if (!messageInput.trim() || !chatId || !token) return;

    try {
      const data = await postMessage(token, chatId, messageInput);
      const socket = getSocket();

      socket.emit('message', {
        _id: data._id,
        owner: data.owner,
        channel: chatId,
        type: data.type,
        content: data.content
      });

      setMessageInput("");
    } catch (error) {
      console.error("Erreur lors de l'envoi du message :", error);
      alert("Impossible d'envoyer le message.");
    }
  };

  useEffect(() => {
    const token = getAccessToken();

    if (token && chatId) {
      getMessages(token, chatId)
        .then(response => {
          console.log('Messages récupérés :', response);
          setMessages(response);
          setTimeout(scrollToBottom, 100);
          console.log('id :', response[0]._id);
          console.log('owner :', response[0].owner);
          console.log('type :', response[0].type);
        })
        .catch(error => {
          console.error('Erreur :', error);
        });
    } else {
      console.error('Aucun token disponible');
    }
  }, [chatId]);

  return (
    <div className="flex h-screen flex-col">

      {/* Header */}
      <div className="flex h-16 items-center border-b border-gray-200 bg-gray-50 px-4 py-3">
        <Link href="/home" className="mr-4 text-gray-500 hover:text-gray-900">
          {/* Back Arrow Icon */}
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div className="flex items-center flex-1">
          <div className="h-10 w-10 rounded-full bg-gray-300"></div>
          <div className="ml-3">
            {/* In reality, fetch the name using the ID */}
            <h2 className="text-base font-medium text-gray-900">{chanelName || chatId}</h2>
            <p className="text-xs text-gray-500">{channelUsers} utilisateur(s) connecté(s)</p>
          </div>
        </div>
      </div>

      {/* Message Feed */}
      <div ref={messagesEndRef} className="flex-1 overflow-y-auto bg-[#efeae2] p-4 space-y-4">
        {user && Messages.map((msg) => {
          const owner_id = msg.owner._id;
          return (
            <div key={msg._id} className={`flex ${owner_id === user._id ? "justify-end" : "justify-start"}`}>
              <div className={`relative max-w-[75%] rounded-lg px-4 py-2 shadow-sm ${owner_id === user._id ? "bg-[#d9fdd3]" : "bg-white"}`}>
                <p className="text-sm">{msg.content}</p>
                <span className="mt-1 block text-right text-[10px] text-gray-500"></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="flex items-center bg-gray-50 px-4 py-3 gap-2">       

        <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-2">

          {/* Text input */}
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message"
            className="w-full rounded-full border-none bg-white px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 shadow-sm"
          />

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
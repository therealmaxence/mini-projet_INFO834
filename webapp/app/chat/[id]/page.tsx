"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getSocket } from "@/lib/socket";

const API_URL = 'http://localhost:3002';

interface Message {
  _id: string;
  owner: string;
  channel: string;
  type: string;
  content: string;
}

const cookieString=document.cookie;
const getCookieValue = (name : string) => {
  const row = cookieString.split('; ').find(row => row.startsWith(`${name}=`));
  return row ? row.split('=')[1] : null;
};

const token = getCookieValue('access_token');

const socket = getSocket();

export const getMessages = async (token: string, chatId: string) => {
  const response = await  fetch(`${API_URL}/messages/channel/${chatId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des messages');
  }

  return response.json();
};

export const getUserConnected = async () => {
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

const user = getUserConnected();

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

  if (response.ok) {
    const data: Message = await response.json();
    
    socket.emit('message', { channel: chatId, id: data._id });

    return data;
  }
  else {
    throw new Error('Erreur lors de l\'envoi du message');
  }
};


export default function ChatRoomPage() {
  const params = useParams();
  const chatId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [messageInput, setMessageInput] = useState("");

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !chatId || !token) return;

    try {
      const newMessage = await postMessage(token, chatId, messageInput);
      setMessages((prevMessages) => [...prevMessages, newMessage]);

      setMessageInput("");
    } catch (error) {
      console.error("Erreur lors de l'envoi du message :", error);
      alert("Impossible d'envoyer le message.");
    }
  };

  const [Messages, setMessages] = useState<Message[]>([]);
    useEffect(() => {
      if (token && chatId) {
        getMessages(token, chatId)
          .then(response => {
            console.log('Messages récupérés :', response);
            setMessages(response);
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
    }, []);

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
            <h2 className="text-base font-medium text-gray-900">{Messages[0]?.channel.name || chatId}</h2>
          </div>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto bg-[#efeae2] p-4 space-y-4">
        {Messages.map((msg) => (
          <div key={msg._id} className={`flex ${msg.owner._id === user._id ? "justify-end" : "justify-start"}`}>
            <div className={`relative max-w-[75%] rounded-lg px-4 py-2 shadow-sm ${msg.owner.id === user._id ? "bg-[#d9fdd3]" : "bg-white"}`}>
              <p className="text-sm">{msg.content}</p>
              <span className="mt-1 block text-right text-[10px] text-gray-500"></span>
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
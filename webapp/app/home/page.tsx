'use client';

import Link from "next/link";
import { useEffect } from "react";

const API_URL = 'http://localhost:3002';

// Exemple de token JWT (généré pour l'utilisateur "john_doe")
let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOnsiX2lkIjoiNjljNjdlZTI2MmJiMTM1YmQwY2MzM2QwIiwidXNlcm5hbWUiOiJqb2huX2RvZSIsInBhc3N3b3JkIjoiJDJiJDEwJEVJSTdJSUxHQnR4OENhLkE3RThFTC5IbW96aHRGY1hJTjdtZlFadC9MV2RObkhaR0RXaUtpIiwicm9sZSI6InVzZXIiLCJfX3YiOjB9LCJpYXQiOjE3NzQ2MjAzMDgsImV4cCI6MTc3NDYyMzkwOH0.31Ew309A5sH_RnGmiIq_1KHWaTHFeYcB3h2-8ZdCtRg"; 

export const getChannels = async (token: string) => {
  const response = await  fetch(`${API_URL}/channels`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des canaux');
  }

  return response.json();
};



// Dummy data
const CHATS = [
  { id: 1, name: "Alice Smith", lastMessage: "Are we still on for tomorrow?", time: "10:42 AM", unread: 2 },
  { id: 2, name: "Bob Johnson", lastMessage: "Sent an attachment", time: "Yesterday", unread: 0 },
  { id: 3, name: "Design Team", lastMessage: "The new mockups look great!", time: "Tuesday", unread: 5 },
  { id: 4, name: "Mom", lastMessage: "Call me when you get home ❤️", time: "Monday", unread: 0 },
];

export default function HomePage() {
  useEffect(() => {
    if (token) {
      getChannels(token)
        .then(channels => {
          console.log('Canaux récupérés :', channels);
        })
        .catch(error => {
          console.error('Erreur :', error);
        });
    } else {
      console.error('Aucun token disponible');
    }
  }, []);

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <div className="flex h-16 items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Chats</h1>
        <div className="flex space-x-4 text-gray-500">
          <button className="hover:text-gray-700 focus:outline-none">
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
            placeholder="Search"
            className="block w-full rounded-lg bg-gray-100 py-2 pl-10 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {CHATS.map((chat) => (
          <Link
            href={`/chat/${chat.id}`}
            key={chat.id}
            className="flex items-center border-b border-gray-100 p-3 hover:bg-gray-50 transition-colors"
          >
            <div className="h-12 w-12 flex-shrink-0 rounded-full bg-gray-300"></div>
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
          </Link>
        ))}
      </div>
    </div>
  );
}
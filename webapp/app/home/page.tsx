'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/cookies";

interface Channel {
  _id: string;
  name: string;
  owner: string;
  members: string[];
  visibility: string;
}

export const getUserConnected = async (token: string) => {
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

export const getUserId_withUsername = async (username: string) => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Aucun token disponible');
  }

  const response = await fetch(`${API_URL}/profiles/search?username=${username}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération du userId avec le UserName');
  }

  return await response.json();
};

export const postChanel = async (token: string, memberId: Array<string>, chanelName : String, visibility : String) => {
  const response = await fetch(`${API_URL}/channels`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: chanelName,
      members: [...memberId],
      visibility: visibility
    })
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la creation du chanel');
  }

  return response.json();
};

export const getChannels = async (token: string) => {
  const response = await fetch(`${API_URL}/channels`, {
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



export default function HomePage() {
  const [REAL_CHANELS, setREAL_CHANELS] = useState<Channel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChanelName, setNewChanelName] = useState("");
  const [searchUsername, setSearchUsername] = useState("");
  const [visibility, setVisibility] = useState("public");
  
  useEffect(() => {
    const token = getAccessToken();

    if (token) {
      getChannels(token)
        .then(channels => {
          setREAL_CHANELS(channels);
        })
        .catch(error => {
          console.error('Erreur :', error);
        });
    } else {
      console.error('Aucun token disponible');
    }
  }, []);

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();

    if (!token) return;

    try {
      const member = await getUserId_withUsername(searchUsername);
      const memberId = member[0]._id;
      const newChannel = await postChanel(token, [memberId], newChanelName, visibility);

      setREAL_CHANELS((prev) => [...prev, newChannel]);
      setIsModalOpen(false);
      setNewChanelName("");
      setSearchUsername("");
    } catch (error) {
      console.error("Erreur lors de la création :", error);
      alert("Utilisateur non trouvé ou erreur de création");
      }
  };

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <div className="flex h-16 items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Chats</h1>
        <div className="flex space-x-4 text-gray-500">
          <button onClick={() => setIsModalOpen(true)} className="hover:text-gray-700 focus:outline-none">
            
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <Link
            href="/logout"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Logout
          </Link>
        </div>
      </div>
      {isModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-lg font-bold">Nouveau Canal</h2>
          <form onSubmit={handleCreateChannel} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Nom du canal</label>
              <input
                type="text"
                required
                className="w-full rounded border p-2"
                value={newChanelName}
                onChange={(e) => setNewChanelName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Inviter un utilisateur (Username)</label>
              <input
                type="text"
                required
                className="w-full rounded border p-2"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Visibilité</label>
              <select 
                className="w-full rounded border p-2"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
              >
                <option value="public">Public</option>
                <option value="private">Privé</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700"
              >
                Annuler
              </button>
              <button 
                type="submit"
                className="rounded bg-black px-4 py-2 text-white"
              >
                Créer
              </button>
            </div>
          </form>
        </div>
      </div>
      )}
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
       <div className="flex-1 overflow-y-auto">
         {REAL_CHANELS.map((channel) => (
          <Link
             href={`/chat/${channel._id}`}
             key={channel._id}
             className="flex items-center border-b border-gray-100 p-3 hover:bg-gray-50 transition-colors"
           >
             {/* Updated Channel Icon */}
             <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-300 text-xl font-bold text-gray-700 uppercase">
               {channel.name ? channel.name[0] : "#"}
             </div>
             
             <div className="ml-4 flex-1 overflow-hidden">
               <div className="flex items-baseline justify-between">
                 <h3 className="truncate text-base font-medium text-gray-900">{channel.name}</h3>
                 {/* <span className="ml-2 flex-shrink-0 text-xs text-gray-500">{channel.time}</span> */}
               </div>
               <div className="flex items-center justify-between">
                 {/* <p className="truncate text-sm text-gray-600">{channel.lastMessage}</p> */}
                 {/* {channel.unread > 0 && (
                   <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
                     {channel.unread}
                   </span>
                 )} */}
               </div>
             </div>
           </Link>
          ))}
        </div>
    </div>
  );
}
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import type { IGif } from "@giphy/js-types";
import GifPicker from "@/components/GifPicker";
import { API_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/cookies";
import { getSocket } from "@/lib/socket";
import { getUserId_withUsername } from "@/app/home/page";
import { generateAvatar, svgToDataUrl } from "@/utils/avatar";

interface Message {
  _id: string;
  owner: {
    _id: string;
    username?: string;
  };
  channel: string | { _id?: string };
  type: string;
  content: string;
  created: string;
  updated: string;
}

interface ChannelMember {
  _id: string;
  username: string;
}

interface UserProfile {
  _id: string;
  username?: string;
}

export const getMessages = async (authToken: string, chatId: string) => {
  const response = await fetch(`${API_URL}/messages/channel/${chatId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des messages");
  }

  return response.json();
};

export const getUserConnected = async (authToken?: string) => {
  const token = authToken ?? getAccessToken();

  if (!token) {
    throw new Error("Aucun token disponible");
  }

  const response = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la récupération du user");
  }

  return response.json();
};

export const getMembers = async (authToken: string, chatId: string) => {
  const response = await fetch(`${API_URL}/channels/${chatId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des membres du canal");
  }

  const data = await response.json();
  return data.members ?? [];
};

export const postMessage = async (authToken: string, chatId: string, content: string) => {
  const response = await fetch(`${API_URL}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ channel: chatId, content }),
  });

  if (!response.ok) {
    throw new Error("Erreur lors de l'envoi du message");
  }

  return response.json();
};

export const updateChannel = async (
  authToken: string,
  chatId: string,
  channelData: Record<string, unknown>,
) => {
  const response = await fetch(`${API_URL}/channels/${chatId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(channelData),
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la mise à jour du canal");
  }

  return response.json();
};

export const getChanelName = async (authToken: string, chatId: string) => {
  const response = await fetch(`${API_URL}/channels/${chatId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la récupération du nom du canal");
  }

  return response.json().then((data) => data.name);
};

export default function ChatRoomPage() {
  const params = useParams();
  const chatId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [pendingGif, setPendingGif] = useState<{ url: string; alt: string } | null>(null);
  const [profileUsername, setProfileUsername] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [editChanelName, setEditChanelName] = useState("");
  const [editVisibility, setEditVisibility] = useState("public");
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [searchUsername, setSearchUsername] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [channelUsers, setChannelUsers] = useState(0);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [chanelName, setChanelName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const token = getAccessToken();
  const canSend = messageInput.trim().length > 0 || !!pendingGif;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  const handleOpenEditModal = async () => {
    if (!token || !chatId) return;

    try {
      const channelMembers = await getMembers(token, chatId);
      setMembers(channelMembers);
      setEditChanelName(chanelName);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Erreur lors de l'ouverture des paramètres :", error);
    }
  };

  const handleAddMember = async () => {
    if (!searchUsername.trim() || !token) return;

    try {
      const users = await getUserId_withUsername(searchUsername);

      if (users && users.length > 0) {
        const newUser = users[0];
        if (!members.some((member: ChannelMember) => member._id === newUser._id)) {
          setMembers([...members, { _id: newUser._id, username: newUser.username }]);
        }
        setSearchUsername("");
      } else {
        alert("Utilisateur non trouvé");
      }
    } catch (error) {
      console.error("Erreur lors de la recherche :", error);
      alert("Erreur lors de l'ajout de l'utilisateur");
    }
  };

  const handleUpdateChannelSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token || !chatId) return;

    try {
      const memberIds = members.map((member: ChannelMember) => member._id);

      await updateChannel(token, chatId, {
        name: editChanelName,
        visibility: editVisibility,
        members: memberIds,
      });

      setChanelName(editChanelName);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
      alert("Erreur lors de la mise à jour du canal");
    }
  };

  const handleRemoveMember = (idToRemove: string) => {
    setMembers(members.filter((member: ChannelMember) => member._id !== idToRemove));
  };

  const handleGifSelect = (gif: IGif, url: string) => {
    setPendingGif({ url, alt: gif.title || "GIF" });
    setShowGifPicker(false);
  };

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!chatId || !token) return;

    const content = pendingGif?.url ?? messageInput.trim();
    if (!content) return;

    try {
      const newMessage = await postMessage(token, chatId, content);
      setMessages((prev: Message[]) => [...prev, newMessage]);

      const socket = getSocket();
      socket.emit("message", {
        _id: newMessage._id,
        owner: newMessage.owner,
        channel: chatId,
        type: newMessage.type,
        content: newMessage.content,
      });

      setMessageInput("");
      setPendingGif(null);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message :", error);
      alert("Impossible d'envoyer le message.");
    }
  };

  useEffect(() => {
    if (!chatId || !token) return;

    let cancelled = false;

    const loadInitialData = async () => {
      try {
        const [userData, channelMessages, channelName] = await Promise.all([
          getUserConnected(token),
          getMessages(token, chatId),
          getChanelName(token, chatId),
        ]);

        if (cancelled) {
          return;
        }

        setUser(userData);
        setMessages(channelMessages);
        setChanelName(channelName);
        setTimeout(scrollToBottom, 0);
      } catch (error) {
        console.error("Erreur lors du chargement du chat :", error);
      }
    };

    loadInitialData();

    const socket = getSocket();

    const onChannelUsers = (payload: { channelId: string; count: number }) => {
      if (payload.channelId === chatId) {
        setChannelUsers(payload.count);
      }
    };

    const onMessage = (msg: Message) => {
      const channelMatches = typeof msg.channel === "string" ? msg.channel === chatId : msg.channel?._id === chatId;

      if (!channelMatches) {
        return;
      }

      setMessages((prev: Message[]) => [...prev, msg]);
      setTimeout(scrollToBottom, 0);
    };

    socket.on("channel_presence_count", onChannelUsers);
    socket.on("message", onMessage);
    socket.emit("join_channel", { channelId: chatId });

    return () => {
      cancelled = true;
      socket.off("channel_presence_count", onChannelUsers);
      socket.off("message", onMessage);
      socket.emit("leave_channel", { channelId: chatId });
    };
  }, [chatId, token]);

  useEffect(() => {
    setProfileUsername(localStorage.getItem("profile_username") || "");
    setProfileAvatar(localStorage.getItem("profile_avatar") || "");
  }, []);

  const avatarFor = (name: string) => svgToDataUrl(generateAvatar(name, 40));

  return (
    <div className="flex h-screen flex-col">
      <div className="flex h-16 items-center border-b border-gray-200 bg-gray-50 px-4 py-3">
        <Link href="/home" className="mr-4 text-gray-500 hover:text-gray-900">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex flex-1 items-center">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-300 text-lg font-bold uppercase text-gray-700">
            {chanelName ? chanelName[0] : "#"}
          </div>
          <div className="ml-3">
            <h2 className="text-base font-medium text-gray-900">{chanelName || `Chat #${chatId}`}</h2>
            <p className="text-xs text-gray-500">{channelUsers} utilisateur(s) connecté(s)</p>
          </div>
          <div className="ml-auto flex space-x-4 text-gray-500">
            <button onClick={handleOpenEditModal} className="px-4 py-2 text-black hover:text-gray-700 focus:outline-none" type="button">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">Modifier le Canal</h2>

            <form onSubmit={handleUpdateChannelSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Nom du canal</label>
                <input
                  type="text"
                  required
                  className="w-full rounded border p-2"
                  value={editChanelName}
                  onChange={(event) => setEditChanelName(event.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Membres du canal</label>
                <div className="mb-3 flex min-h-[32px] flex-wrap gap-2 rounded border bg-gray-50 p-2">
                  {members.map((member) => (
                    <span key={member._id} className="flex items-center gap-1 rounded-full bg-black px-3 py-1 text-xs text-white">
                      {member.username}
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member._id)}
                        className="ml-1 font-bold text-gray-300 hover:text-red-400 focus:outline-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {members.length === 0 && <span className="text-sm text-gray-400">Aucun membre</span>}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Inviter via Username"
                    className="flex-1 rounded border p-2"
                    value={searchUsername}
                    onChange={(event) => setSearchUsername(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleAddMember();
                      }
                    }}
                  />
                  <button type="button" onClick={handleAddMember} className="rounded bg-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-300">
                    Ajouter
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Visibilité</label>
                <select className="w-full rounded border p-2" value={editVisibility} onChange={(event) => setEditVisibility(event.target.value)}>
                  <option value="public">Public</option>
                  <option value="private">Privé</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700">
                  Annuler
                </button>
                <button type="submit" className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto bg-[#efeae2] p-4">
        {user && messages.map((msg) => {
          const isMe = msg.owner._id === user._id;
          const senderIdentifier = msg.owner.username || msg.owner._id;
          const avatarUrl = isMe && profileAvatar ? profileAvatar : avatarFor(senderIdentifier);
          const msgDate = new Date(msg.created);
          const timeString = msgDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const isEdited = msg.updated && msg.updated !== msg.created;
          const channelValue = typeof msg.channel === "string" ? msg.channel : msg.channel?._id;

          if (channelValue && channelValue !== chatId) {
            return null;
          }

          return (
            <div key={msg._id} className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
              {!isMe && (
                <Link href={`/profiles/${msg.owner._id}`}>
                  <img
                    src={avatarUrl}
                    alt={msg.owner.username || "User"}
                    className="mb-1 h-8 w-8 flex-shrink-0 cursor-pointer rounded-full transition-opacity hover:opacity-80"
                  />
                </Link>
              )}

              <div className={`relative flex min-w-[100px] max-w-[75%] flex-col rounded-lg px-4 py-2 shadow-sm ${isMe ? "bg-[#d9fdd3]" : "bg-white"}`}>
                {!isMe && msg.owner.username && (
                  <span className="mb-1 block text-[11px] font-bold text-gray-500">{msg.owner.username}</span>
                )}

                {msg.content.startsWith("http") ? (
                  <img src={msg.content} alt="GIF" className="max-w-[200px] rounded-lg" />
                ) : (
                  <p className="text-sm text-gray-900">{msg.content}</p>
                )}

                <span className={`mt-1 self-end text-[10px] ${isMe ? "text-green-700/70" : "text-gray-400"}`}>
                  {timeString} {isEdited && <span className="ml-1 italic">(edited)</span>}
                </span>
              </div>

              {isMe && (
                <Link href={`/profiles/${user._id}`}>
                  <img
                    src={avatarUrl}
                    alt="Me"
                    className="mb-1 h-8 w-8 flex-shrink-0 cursor-pointer rounded-full transition-opacity hover:opacity-80"
                  />
                </Link>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {showGifPicker && <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />}

      <div className="flex items-center gap-2 bg-gray-50 px-4 py-3">
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

        <form onSubmit={handleSendMessage} className="flex flex-1 items-center gap-2">
          {pendingGif ? (
            <div className="flex flex-1 items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm">
              <div className="relative flex-shrink-0">
                <img src={pendingGif.url} alt={pendingGif.alt} className="h-14 w-auto max-w-[160px] rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => setPendingGif(null)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-700 text-[10px] text-white transition-colors hover:bg-gray-900"
                  aria-label="Remove GIF"
                >
                  ✕
                </button>
              </div>
              <span className="text-xs italic text-gray-400">GIF ready to send</span>
            </div>
          ) : (
            <input
              type="text"
              value={messageInput}
              onChange={(event) => setMessageInput(event.target.value)}
              placeholder="Type a message"
              className="w-full rounded-full border-none bg-white px-4 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          )}

          <button
            type="submit"
            disabled={!canSend}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-black text-white transition-colors disabled:bg-gray-300 disabled:text-gray-500"
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

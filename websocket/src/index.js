import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';


const app = express();
const server = createServer(app);
const redisUrl = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
const presenceKey = 'presence:connected_users';
const channelKeyPrefix = 'channel:connected_users:';
const redis = createClient({ url: redisUrl });

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST'],
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 60000, // 1 minute
  },
});

redis.on('error', (error) => {
  console.error('[redis] error', error);
});

async function getPresenceCount() {
  const rawValue = await redis.get(presenceKey);
  return Number(rawValue ?? 0);
}

async function setPresenceCount(count) {
  const normalizedCount = Math.max(0, count);
  await redis.set(presenceKey, String(normalizedCount));
  return normalizedCount;
}

async function incrementPresence() {
  return redis.incr(presenceKey);
}

async function decrementPresence() {
  const count = await redis.decr(presenceKey);
  if (count < 0) {
    return setPresenceCount(0);
  }

  return count;
}

async function broadcastPresenceCount() {
  const count = await getPresenceCount();
  io.emit('presence_count', count);
  return count;
}

function getChannelKey(channelId) {
  return `${channelKeyPrefix}${channelId}`;
}

async function getChannelCount(channelId) {
  const rawValue = await redis.get(getChannelKey(channelId));
  return Number(rawValue ?? 0);
}

async function setChannelCount(channelId, count) {
  const normalizedCount = Math.max(0, count);
  await redis.set(getChannelKey(channelId), String(normalizedCount));
  return normalizedCount;
}

async function incrementChannelCount(channelId) {
  return redis.incr(getChannelKey(channelId));
}

async function decrementChannelCount(channelId) {
  const count = await redis.decr(getChannelKey(channelId));
  if (count < 0) {
    return setChannelCount(channelId, 0);
  }

  return count;
}

async function broadcastChannelCount(channelId, count) {
  io.to(`channel:${channelId}`).emit('channel_presence_count', {
    channelId,
    count,
  });
  return count;
}

await redis.connect();

if (!(await redis.exists(presenceKey))) {
  await redis.set(presenceKey, '0');
}


io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('AUTH_REQUIRED'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});


io.on('connection', (socket) => {
  const username = socket.user?.sub?.username || 'unknown-user';
  socket.data.presenceTracked = false;
  socket.data.joinedChannels = new Set();
  console.log(`[+] ${username} connecté (${socket.id})`);

  broadcastPresenceCount()
    .then((count) => {
      socket.emit('presence_count', count);
    })
    .catch((error) => {
      console.error('[presence] unable to send current count', error);
    });

  socket.on('presence:login', async (ack) => {
    try {
      if (!socket.data.presenceTracked) {
        const count = await incrementPresence();
        socket.data.presenceTracked = true;
        io.emit('presence_count', count);

        if (typeof ack === 'function') {
          ack({ count });
        }

        return;
      }

      const count = await getPresenceCount();
      io.emit('presence_count', count);

      if (typeof ack === 'function') {
        ack({ count });
      }
    } catch (error) {
      console.error('[presence] login increment failed', error);

      if (typeof ack === 'function') {
        ack({ error: 'presence_update_failed' });
      }
    }
  });

  socket.on('presence:logout', async (ack) => {
    try {
      if (socket.data.presenceTracked) {
        const count = await decrementPresence();
        socket.data.presenceTracked = false;
        io.emit('presence_count', count);

        if (typeof ack === 'function') {
          ack({ count });
        }

        return;
      }

      const count = await getPresenceCount();

      if (typeof ack === 'function') {
        ack({ count });
      }
    } catch (error) {
      console.error('[presence] logout decrement failed', error);

      if (typeof ack === 'function') {
        ack({ error: 'presence_update_failed' });
      }
    }
  });

  socket.on('join_channel', async ({ channelId }, ack) => {
    if (!channelId) return;
    const roomName = `channel:${channelId}`;
    socket.join(roomName);
    if (socket.data.joinedChannels.has(channelId)) {
      const count = await getChannelCount(channelId);
      if (typeof ack === 'function') {
        ack({ count });
      }
      return;
    }

    socket.data.joinedChannels.add(channelId);
    const count = await incrementChannelCount(channelId);
    await broadcastChannelCount(channelId, count);

    if (typeof ack === 'function') {
      ack({ count });
    }
    console.log(`[ROOM] ${username} rejoint ${roomName}`);
  });

  socket.on('leave_channel', async ({ channelId }, ack) => {
    if (!channelId) return;
    const roomName = `channel:${channelId}`;
    socket.leave(roomName);
    if (!socket.data.joinedChannels.has(channelId)) {
      const count = await getChannelCount(channelId);
      if (typeof ack === 'function') {
        ack({ count });
      }
      return;
    }

    socket.data.joinedChannels.delete(channelId);
    const count = await decrementChannelCount(channelId);
    await broadcastChannelCount(channelId, count);

    if (typeof ack === 'function') {
      ack({ count });
    }
    console.log(`[ROOM] ${username} quitte ${roomName}`);
  });

  socket.on('message', (msg) => {
    if (!msg?.channel) return;
    const roomName = `channel:${msg.channel}`;
    io.to(roomName).emit('message', msg);
    console.log(`[MSG] ${username} -> ${roomName}`);
  });

  socket.on('disconnecting', () => {
    console.log('disconnecting');
    console.log(`[~] ${username} est entrain d'être déconnecté (${socket.id})`);
  });

  socket.on('disconnect', () => {
    console.log('disconnect');
    if (socket.data.presenceTracked) {
      socket.data.presenceTracked = false;
      decrementPresence()
        .then((count) => {
          io.emit('presence_count', count);
        })
        .catch((error) => {
          console.error('[presence] disconnect decrement failed', error);
        });
    }
    if (socket.data.joinedChannels?.size) {
      for (const channelId of socket.data.joinedChannels) {
        decrementChannelCount(channelId)
          .then((count) => broadcastChannelCount(channelId, count))
          .catch((error) => {
            console.error('[channel] disconnect decrement failed', channelId, error);
          });
      }
      socket.data.joinedChannels.clear();
    }
    console.log(`[-] ${username} déconnecté (${socket.id})`);
  });
});

server.listen(3001, () => {
  console.log('Server running on :3001')
});
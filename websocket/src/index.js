import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';


const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST'],
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 60000, // 1 minute
  },
});


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
  console.log(`[+] ${username} connecté (${socket.id})`);

  socket.on('message', (msg) => {
    console.log(msg);
    console.log(`[MSG] ${username}: ${msg.content}`);
  });

  socket.on('disconnecting', () => {
    console.log('disconnecting');
    console.log(`[~] ${username} est entrain d'être déconnecté (${socket.id})`);
  });

  socket.on('disconnect', () => {
    console.log('disconnect');
    console.log(`[-] ${username} déconnecté (${socket.id})`);
  });
});

server.listen(3001, () => {
  console.log('Server running on :3001')
});
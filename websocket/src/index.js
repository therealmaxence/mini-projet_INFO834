const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST'],
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
  console.log(`[+] ${socket.user.username} connecté (${socket.id})`);

  socket.on('disconnecting', () => {
    console.log(`[~] ${socket.user.username} est entrain d'être déconnecté (${socket.id})`);
  });

  socket.on('disconnect', () => {
    console.log(`[-] ${socket.user.username} déconnecté (${socket.id})`);
  });
});

httpServer.listen(3001, () => console.log('🚀 Server ready on :3001'));
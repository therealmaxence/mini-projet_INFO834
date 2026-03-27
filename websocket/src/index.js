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
});

app.get('/', (req, res) => {
  res.send(`
    <script src="/socket.io/socket.io.js"></script>
    <script>
      const socket = io();
    </script>
  `);
});

// io.use((socket, next) => {
//   const token = socket.handshake.auth.token;
//   if (!token) return next(new Error('AUTH_REQUIRED'));

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     socket.user = decoded;
//     next();
//   } catch (err) {
//     next(new Error('Authentication error'));
//   }
// });


io.on('connection', (socket) => {
  console.log('connection');
  // console.log(`[+] ${socket.user.username} connecté (${socket.id})`);

  socket.on('message', (msg) => {
    console.log(msg);
    // console.log(`[MSG] ${socket.user.username}: ${msg}`);
    // io.emit('message', { user: socket.user.username, text: msg });
  });

  socket.on('disconnecting', () => {
    console.log('disconnecting');
    // console.log(`[~] ${socket.user.username} est entrain d'être déconnecté (${socket.id})`);
  });

  socket.on('disconnect', () => {
    console.log('disconnect');
    // console.log(`[-] ${socket.user.username} déconnecté (${socket.id})`);
  });
});

server.listen(3001, () => {
  console.log('Server running on :3001')
});
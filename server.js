const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./messages.js');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./users.js');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));


// Run when client connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // General Welcome
  socket.emit('message', formatMessage("ChatCord", 'Welcome to ChatCord!'));

  // Broadcast when user connects
  socket.broadcast.to(user.room).emit('message', formatMessage("ChatCord", `${user.username} has joined the chat!`));

  // Send users and room info
  io.to(user.room).emit('roomUsers', {
    room: user.room,
    users: getRoomUsers(user.room)
  });
  });

  // Listen for chat message
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // Run when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
    io.to(user.room).emit('message', formatMessage("ChatCord", `${user.username} has left the chat!`));

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
   }
  });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, ()  => console.log(`Server running on ${PORT}`));
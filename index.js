require('dotenv').config();

// dependencies for basic server setup
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const port = process.env.PORT || 3424;
const cors = require('cors');
app.use(cors());

console.log(process.env.WEB_APP_ORIGIN);
// dependencies for socket.io integration
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: process.env.WEB_APP_ORIGIN,
    }
});

// other dependencies
const path = require('path');

app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'index.html');
    res.sendFile(filePath);
});

io.on('connection', socket => {
    console.log('someone connected');
    socket.on('dialogue:send-message', message => {
        io.emit('dialogue:update', message);
    });

    socket.on('disconnect', () => {
        console.log('someone disconnected');
    });
});

server.listen(port, () => {
    console.log(`[server] - server listening on port ${port}`);
});
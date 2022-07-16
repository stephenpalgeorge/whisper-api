require('dotenv').config();
// ----------
// IMPORTS
// ----------

const path = require('path');
const http = require('http');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const { dialogue: dialogueRoutes } = require('./src/routes');

// ----------
// APPLY MIDDLEWARE
// ----------
app.use(bodyParser.json());
app.use(cors({origin: process.env.WEB_APP_ORIGIN, credentials: true}));
app.use(cookieParser());

// ----------
// VARIABLE DECLARATIONS
// ----------
const server = http.createServer(app);
const port = process.env.PORT || 3424;
const io = new Server(server, {
    cors: {
        origin: process.env.WEB_APP_ORIGIN,
    }
});

// ----------
// ROUTES
// ----------
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'index.html');
    res.sendFile(filePath);
});

// mount the routes
app.use('/api/dialogue', dialogueRoutes);

// ----------
// SOCKET IMPLEMENTATION
// ----------
io.on('connection', socket => {
    console.log('someone connected');
    // we expect `data` from the client to have properties `username`,
    // `message` and `timestamp`.
    socket.on('dialogue:send-message', data => {
        io.emit('dialogue:update', data);
    });

    // we expect `data` from the client to have properties `username` && `key`.
    // `username` is the name that the user has chosen when joining the chat,
    // `key` is the value stored in the DB against Dialogue.key
    socket.on('dialogue:join', data => {
        // `join` the user to the dialogue using the `key` as the channel identifier.
        socket.join(data.key);
        // send a `join` event back to the client with the user's username.
        io.to(data.key).emit('dialogue:join', {username: data.username});
    });

    socket.on('disconnect', () => {
        console.log('someone disconnected');
    });
});

// ----------
// START LISTENING
// ----------
server.listen(port, async () => {
    console.log(`[server] - server listening on port ${port}`);
    // server has started successfully, we try a db connection
    await mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.klglc.mongodb.net/?retryWrites=true&w=majority`);
});

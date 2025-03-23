import { Server } from "socket.io";
import express from "express";
import http from "http";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
    },
});

const userSocketMap = new Map(); // Using Map instead of object for better key-value handling

export const getReceiverSocketId = (receiverId) => {
    const socketId = userSocketMap.get(receiverId);
    console.log(`Getting socket ID for user ${receiverId}:`, socketId);
    return socketId;
};

io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    
    if (userId) {
        console.log(`New connection attempt - UserId: ${userId}, SocketId: ${socket.id}`);
        
        // Remove any existing socket connection for this user
        if (userSocketMap.has(userId)) {
            const existingSocket = io.sockets.sockets.get(userSocketMap.get(userId));
            if (existingSocket) {
                console.log(`Disconnecting previous socket for UserId=${userId}`);
                existingSocket.disconnect();
            }
        }

        // Store new socket connection
        userSocketMap.set(userId, socket.id);
        console.log(`User connected successfully - UserId: ${userId}, SocketId: ${socket.id}`);
        console.log('Current connected users:', Array.from(userSocketMap.entries()));

        // Emit online users
        io.emit('getOnlineUsers', Array.from(userSocketMap.keys()));

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`User disconnecting - UserId: ${userId}, SocketId: ${socket.id}`);
            userSocketMap.delete(userId);
            io.emit('getOnlineUsers', Array.from(userSocketMap.keys()));
        });
    }
});

export { app, server, io };
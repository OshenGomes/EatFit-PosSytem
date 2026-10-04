// utils/socket.js
const { Server } = require('socket.io');

let io = null;

function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`⚡ Kitchen/Client connected to socket: ${socket.id}`);

        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });

    return io;
}

function getIO() {
    return io;
}

function emitOrderEvent(event, data) {
    if (io) {
        io.emit(event, data);
        console.log(`📢 Emitted socket event "${event}" for order ${data.orderId || data._id || ''}`);
    }
}

module.exports = {
    initSocket,
    getIO,
    emitOrderEvent
};

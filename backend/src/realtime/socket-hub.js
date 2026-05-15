import { Server } from "socket.io";
import mongoose from "mongoose";

let io = null;

function pollRoom(pollId) {
    return `poll:${String(pollId)}`;
}

function allowedOrigins() {
    const raw = process.env.CORS_ORIGINS;
    if (raw && raw.trim()) {
        return raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return ["http://localhost:5173", "http://127.0.0.1:5173"];
}

/**
 * Attach Socket.IO to the same HTTP server as Express.
 * Clients join per-poll rooms to receive live result and metadata updates.
 */
export function initSocketHub(httpServer) {
    const origins = allowedOrigins();
    io = new Server(httpServer, {
        path: "/socket.io/",
        cors: {
            origin: origins.length === 1 ? origins[0] : origins,
            methods: ["GET", "HEAD", "POST"],
        },
    });

    io.on("connection", (socket) => {
        socket.on("poll:join", (pollId) => {
            if (pollId == null || !mongoose.Types.ObjectId.isValid(String(pollId))) {
                return;
            }
            socket.join(pollRoom(pollId));
        });

        socket.on("poll:leave", (pollId) => {
            if (pollId == null) return;
            socket.leave(pollRoom(pollId));
        });
    });

    return io;
}

export function getSocketHub() {
    return io;
}

export function emitToPoll(pollId, event, payload) {
    if (!io || pollId == null) return;
    const id = String(pollId);
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    io.to(pollRoom(id)).emit(event, payload ?? {});
}

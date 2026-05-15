import { Server } from "socket.io";
import mongoose from "mongoose";
import { getCorsOrigins, isOriginAllowed } from "../common/config/cors-origins.js";

let io = null;

function pollRoom(pollId) {
    return `poll:${String(pollId)}`;
}

/**
 * Attach Socket.IO to the same HTTP server as Express.
 * Clients join per-poll rooms to receive live result and metadata updates.
 */
export function initSocketHub(httpServer) {
    const origins = getCorsOrigins();
    io = new Server(httpServer, {
        path: "/socket.io/",
        cors: {
            origin: (origin, callback) => {
                if (isOriginAllowed(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error("Not allowed by CORS"));
                }
            },
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

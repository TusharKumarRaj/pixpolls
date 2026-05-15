import "dotenv/config";
import http from "http";
import app from "./src/app.js";
import connectDB from "./src/common/config/db.js";
import { initSocketHub } from "./src/realtime/socket-hub.js";

const PORT = Number(process.env.PORT) || 3000;

const start = async () => {
    await connectDB();

    const httpServer = http.createServer(app);
    initSocketHub(httpServer);

    // 0.0.0.0: required on Railway/Docker so the proxy can reach the process
    httpServer.listen(PORT, "0.0.0.0", () => {
        console.log(`Listening on 0.0.0.0:${PORT} (set public domain target port to ${PORT})`);
    });
};

start().catch((err) => {
    console.error("Failed to start server", err);
    process.exit(1);
});

import "dotenv/config";
import http from "http";
import app from "./src/app.js";
import connectDB from "./src/common/config/db.js";
import { initSocketHub } from "./src/realtime/socket-hub.js";

const PORT = process.env.PORT || 3000;

const start = async () => {
    await connectDB();

    const httpServer = http.createServer(app);
    initSocketHub(httpServer);

    httpServer.listen(PORT, () => {
        console.log("started");
    });
};

start().catch((err) => {
    console.error("Failed to start server", err);
    process.exit(1);
});

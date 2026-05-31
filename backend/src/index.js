import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { bootstrap } from "./app.controller.js";
import { initDatabase } from "./db/setupdb.js";
import { createServer } from 'http';
import { initSocket } from './socket.js';

const start = async () => {
    try {
        await initDatabase();
        console.log("Database ready 🗄️");
    } catch (err) {
        console.error("Failed to initialise database:", err);
        process.exit(1);
    }

    const app = bootstrap();
    const PORT = process.env.PORT;

    // Create HTTP server and attach Socket.IO
    const server = createServer(app);
    initSocket(server);

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT} 🚀`);
    });
};

start();
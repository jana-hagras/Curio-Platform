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
    const app = bootstrap();
    const PORT = process.env.PORT || 7000;

    // Create HTTP server and attach Socket.IO
    const server = createServer(app);
    initSocket(server);

    server.listen(PORT, '0.0.0.0', async () => {
        console.log(`Server running on port ${PORT} 🚀`);
        
        console.log("Initializing database connection...");
        try {
            await initDatabase();
            console.log("Database ready 🗄️");
        } catch (err) {
            console.error("====================================================");
            console.error("CRITICAL: Failed to initialise database on startup!");
            console.error(err);
            console.error("Please verify your environment variables (DB_HOST, DB_USER, DB_PASSWORD, etc.).");
            console.error("====================================================");
            // DO NOT exit process. This keeps the server running so it can bind to the port,
            // allowing health checks to pass and enabling developers to see logs and query health status.
        }
    });
};

start();
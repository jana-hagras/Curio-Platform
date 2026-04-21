import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
    path: path.resolve(__dirname, '../.env')
});

import { bootstrap } from "./app.controller.js";
import { initDatabase } from "./db/setupdb.js";

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

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} 🚀`);
    });
};

start();
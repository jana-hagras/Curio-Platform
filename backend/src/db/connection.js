import mysql from "mysql2/promise";

const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "CURIO",
    waitForConnections: true,
    connectionLimit: 10,
    multipleStatements: true,
};

if (process.env.DB_SSL === 'true') {
    dbConfig.ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: true };
}

const pool = mysql.createPool(dbConfig);

export default pool;    
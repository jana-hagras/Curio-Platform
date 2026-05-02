import mysql from 'mysql2/promise';
import pool from './connection.js';

// Function to create all tables
const createAllTables = async (conn) => {
    const queries = [
        // USER
        `CREATE TABLE IF NOT EXISTS user (
            User_id INT AUTO_INCREMENT PRIMARY KEY,
            FName VARCHAR(50),
            MName VARCHAR(50),
            LName VARCHAR(50),
            Email VARCHAR(100) UNIQUE NOT NULL,
            Password VARCHAR(255) NOT NULL,
            Address VARCHAR(255),
            Phone VARCHAR(20),
            JoinDate DATE,
            ProfileImage VARCHAR(255),
            Type ENUM('Buyer', 'Artisan') NOT NULL
        )`,
        // BUYER
        `CREATE TABLE IF NOT EXISTS Buyer (
            Buyer_id INT PRIMARY KEY,
            Country VARCHAR(100),
            FOREIGN KEY (Buyer_id) REFERENCES user(User_id) ON DELETE CASCADE
        )`,
        // ARTISAN
        `CREATE TABLE IF NOT EXISTS Artisan (
            Artisan_id INT PRIMARY KEY,
            Bio TEXT,
            Status ENUM('Active','Inactive') DEFAULT 'Active',
            Verified BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (Artisan_id) REFERENCES user(User_id) ON DELETE CASCADE
        )`,
        // PORTFOLIO PROJECTS
        `CREATE TABLE IF NOT EXISTS PortfolioProjects (
            Project_id INT AUTO_INCREMENT PRIMARY KEY,
            ProjectName VARCHAR(100),
            Description TEXT,
            Artisan_id INT,
            FOREIGN KEY (Artisan_id) REFERENCES Artisan(Artisan_id) ON DELETE CASCADE
        )`,
        // GALLERY
        `CREATE TABLE IF NOT EXISTS Gallery (
            Image_id INT AUTO_INCREMENT PRIMARY KEY,
            Project_id INT,
            Image VARCHAR(255),
            Caption VARCHAR(255),
            FOREIGN KEY (Project_id) REFERENCES PortfolioProjects(Project_id) ON DELETE CASCADE
        )`,
        // MARKET ITEM
        `CREATE TABLE IF NOT EXISTS MarketItem (
            Item_id INT AUTO_INCREMENT PRIMARY KEY,
            Artisan_id INT,
            Item VARCHAR(100),
            Description TEXT,
            AvailQuantity INT,
            Price DECIMAL(10,2),
            Category VARCHAR(50),
            DateAdded DATE,
            FOREIGN KEY (Artisan_id) REFERENCES Artisan(Artisan_id) ON DELETE CASCADE
        )`,
        // MARKET ITEM IMAGE
        `CREATE TABLE IF NOT EXISTS Market_Item_Image (
            id INT AUTO_INCREMENT PRIMARY KEY,
            item_id INT,
            image_url VARCHAR(255) NOT NULL,
            is_primary BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (item_id) REFERENCES MarketItem(Item_id) ON DELETE CASCADE
        )`,
        // FAVORITE
        `CREATE TABLE IF NOT EXISTS Favorite (
            Favorite_id INT AUTO_INCREMENT PRIMARY KEY,
            Buyer_id INT,
            Item_id INT,
            DateAdded DATE DEFAULT (CURRENT_DATE),
            UNIQUE KEY unique_favorite (Buyer_id, Item_id),
            FOREIGN KEY (Buyer_id) REFERENCES Buyer(Buyer_id) ON DELETE CASCADE,
            FOREIGN KEY (Item_id) REFERENCES MarketItem(Item_id) ON DELETE CASCADE
        )`,
        // REQUEST
        `CREATE TABLE IF NOT EXISTS Request (
            Request_id INT AUTO_INCREMENT PRIMARY KEY,
            Buyer_id INT,
            Title VARCHAR(100),
            Description TEXT,
            Request_Date DATE,
            Budget DECIMAL(10,2),
            \`3D_Model\` VARCHAR(255),
            Category VARCHAR(50),
            FOREIGN KEY (Buyer_id) REFERENCES Buyer(Buyer_id) ON DELETE CASCADE
        )`,
        // MILESTONE
        `CREATE TABLE IF NOT EXISTS Milestone (
            Milestone_id INT AUTO_INCREMENT PRIMARY KEY,
            Request_id INT,
            Title VARCHAR(100),
            Description TEXT,
            DueDate DATE,
            EscrowAmount DECIMAL(10,2),
            EscrowReleaseDate DATE,
            Status ENUM('Pending', 'Released', 'Completed') DEFAULT 'Pending',
            FOREIGN KEY (Request_id) REFERENCES Request(Request_id) ON DELETE CASCADE
        )`,
        // APPLICATION
        `CREATE TABLE IF NOT EXISTS Application (
            Application_id INT AUTO_INCREMENT PRIMARY KEY,
            Request_id INT,
            Artisan_id INT,
            ApplicationDate DATE,
            Proposal TEXT,
            Status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
            FOREIGN KEY (Request_id) REFERENCES Request(Request_id) ON DELETE CASCADE,
            FOREIGN KEY (Artisan_id) REFERENCES Artisan(Artisan_id) ON DELETE CASCADE
        )`,
        // ORDER
        `CREATE TABLE IF NOT EXISTS \`Order\` (
            Order_id INT AUTO_INCREMENT PRIMARY KEY,
            Buyer_id INT,
            OrderDate DATE,
            DeliveryAddress VARCHAR(255),
            Status ENUM('Pending','Completed') DEFAULT 'Pending',
            FOREIGN KEY (Buyer_id) REFERENCES Buyer(Buyer_id) ON DELETE CASCADE
        )`,
        // ORDER ITEM
        `CREATE TABLE IF NOT EXISTS OrderItem (
            OrderItem_id INT AUTO_INCREMENT PRIMARY KEY,
            Order_id INT,
            Item_id INT,
            Quantity INT,
            FOREIGN KEY (Order_id) REFERENCES \`Order\`(Order_id) ON DELETE CASCADE,
            FOREIGN KEY (Item_id) REFERENCES MarketItem(Item_id) ON DELETE CASCADE
        )`,
        // PAYMENT
        `CREATE TABLE IF NOT EXISTS Payment (
            Payment_id INT AUTO_INCREMENT PRIMARY KEY,
            Order_id INT,
            Request_id INT,
            TotalAmount DECIMAL(10,2),
            PaymentMethod VARCHAR(50),
            TransactionDate DATE,
            Status ENUM('Pending','Completed','Failed') DEFAULT 'Pending',
            FOREIGN KEY (Order_id) REFERENCES \`Order\`(Order_id) ON DELETE SET NULL,
            FOREIGN KEY (Request_id) REFERENCES Request(Request_id) ON DELETE SET NULL
        )`,
        // REVIEW
        `CREATE TABLE IF NOT EXISTS Review (
            Review_id INT AUTO_INCREMENT PRIMARY KEY,
            Buyer_id INT,
            Item_id INT,
            Rating INT CHECK(Rating BETWEEN 1 AND 5),
            Comment TEXT,
            Attachment VARCHAR(255),
            ReviewDate DATE DEFAULT (CURRENT_DATE),
            FOREIGN KEY (Buyer_id) REFERENCES Buyer(Buyer_id) ON DELETE CASCADE,
            FOREIGN KEY (Item_id) REFERENCES MarketItem(Item_id) ON DELETE CASCADE
        )`
    ];

    // Sequential execution to respect FK constraints
    for (const query of queries) {
        await conn.query(query);
    }
    console.log("All tables created/verified successfully ✅");
};


// Initialize database at startup
export const initDatabase = async () => {
    // 1. Create DB with a temp connection (pool can't connect to a DB that doesn't exist yet)
    const tempConn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
    });

    await tempConn.query("CREATE DATABASE IF NOT EXISTS CURIO");
    console.log("Database CURIO checked/created");
    await tempConn.end();

    // 2. Now the pool can connect (it targets CURIO)
    const conn = await pool.getConnection();
    try {
        await createAllTables(conn);


    } finally {
        conn.release();
    }
};
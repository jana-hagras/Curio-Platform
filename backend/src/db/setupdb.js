import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import pool from './connection.js';

const SALT_ROUNDS = 10;

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
            Artisan_id INT,
            TotalAmount DECIMAL(10,2),
            PaymentMethod VARCHAR(50),
            TransactionDate DATE,
            Status ENUM('Pending','Completed','Failed') DEFAULT 'Pending',
            PaymentType ENUM('product','escrow') DEFAULT 'product',
            EscrowHeld DECIMAL(10,2) DEFAULT 0.00,
            EscrowReleased DECIMAL(10,2) DEFAULT 0.00,
            EscrowStatus ENUM('none','pending','held','partially_released','fully_released','refunded') DEFAULT 'none',
            FOREIGN KEY (Order_id) REFERENCES \`Order\`(Order_id) ON DELETE SET NULL,
            FOREIGN KEY (Request_id) REFERENCES Request(Request_id) ON DELETE SET NULL,
            FOREIGN KEY (Artisan_id) REFERENCES Artisan(Artisan_id) ON DELETE SET NULL
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
        )`,
        // MENTORSHIP
        `CREATE TABLE IF NOT EXISTS Mentorship (
            Mentorship_id INT AUTO_INCREMENT PRIMARY KEY,
            Artisan_id INT NOT NULL,
            Category VARCHAR(50),
            SessionPrice DECIMAL(10,2) NOT NULL,
            Duration INT NOT NULL,
            Description TEXT,
            Status ENUM('Active','Inactive','Full') DEFAULT 'Active',
            MaxStudents INT DEFAULT 10,
            StartDate DATE,
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (Artisan_id) REFERENCES Artisan(Artisan_id) ON DELETE CASCADE
        )`,
        // MENTORSHIP APPLICATION
        `CREATE TABLE IF NOT EXISTS MentorshipApplication (
            Application_id INT AUTO_INCREMENT PRIMARY KEY,
            Mentorship_id INT NOT NULL,
            Buyer_id INT NOT NULL,
            ApplicationDate DATE DEFAULT (CURRENT_DATE),
            Message TEXT,
            Status ENUM('Pending','Accepted','Rejected','Completed') DEFAULT 'Pending',
            FOREIGN KEY (Mentorship_id) REFERENCES Mentorship(Mentorship_id) ON DELETE CASCADE,
            FOREIGN KEY (Buyer_id) REFERENCES Buyer(Buyer_id) ON DELETE CASCADE,
            UNIQUE KEY unique_mentorship_app (Mentorship_id, Buyer_id)
        )`,
        // MENTORSHIP SESSION
        `CREATE TABLE IF NOT EXISTS MentorshipSession (
            Session_id INT AUTO_INCREMENT PRIMARY KEY,
            Application_id INT NOT NULL,
            ScheduledAt DATETIME,
            Duration INT,
            MeetingLink VARCHAR(500),
            MeetingProvider ENUM('zoom','google_meet','teams','custom') DEFAULT 'custom',
            Status ENUM('Scheduled','Completed','Cancelled','NoShow') DEFAULT 'Scheduled',
            SessionNotes TEXT,
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (Application_id) REFERENCES MentorshipApplication(Application_id) ON DELETE CASCADE
        )`,
        // WORKSHOP
        `CREATE TABLE IF NOT EXISTS Workshop (
            Workshop_id INT AUTO_INCREMENT PRIMARY KEY,
            Artisan_id INT NOT NULL,
            Title VARCHAR(100) NOT NULL,
            Description TEXT,
            WorkshopDate DATE,
            Duration INT,
            Price DECIMAL(10,2),
            Category VARCHAR(50),
            MaxParticipants INT DEFAULT 20,
            Status ENUM('Upcoming','Ongoing','Completed','Cancelled') DEFAULT 'Upcoming',
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (Artisan_id) REFERENCES Artisan(Artisan_id) ON DELETE CASCADE
        )`,
        // WORKSHOP REGISTRATION
        `CREATE TABLE IF NOT EXISTS WorkshopRegistration (
            Registration_id INT AUTO_INCREMENT PRIMARY KEY,
            Workshop_id INT NOT NULL,
            Buyer_id INT NOT NULL,
            RegistrationDate DATE DEFAULT (CURRENT_DATE),
            Status ENUM('Registered','Confirmed','Cancelled') DEFAULT 'Registered',
            FOREIGN KEY (Workshop_id) REFERENCES Workshop(Workshop_id) ON DELETE CASCADE,
            FOREIGN KEY (Buyer_id) REFERENCES Buyer(Buyer_id) ON DELETE CASCADE,
            UNIQUE KEY unique_workshop_reg (Workshop_id, Buyer_id)
        )`
    ];

    // Sequential execution to respect FK constraints
    for (const query of queries) {
        await conn.query(query);
    }
    console.log("All tables created/verified successfully ✅");
};

// Ensure the user.Type ENUM includes 'Admin' (for pre-existing databases)
const ensureAdminEnum = async (conn) => {
    await conn.query(
        `ALTER TABLE user MODIFY COLUMN Type ENUM('Buyer', 'Artisan', 'Admin') NOT NULL`
    );
    console.log("User Type ENUM updated to include Admin ✅");
};

// Seed admin account from environment variables
const seedAdmin = async (conn) => {
    const email = (process.env.ADMIN_EMAIL || 'admin@curio.com').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'Admin123!';
    const fName = process.env.ADMIN_FNAME || 'System';
    const lName = process.env.ADMIN_LNAME || 'Admin';

    // Check if admin already exists
    const [existing] = await conn.query(
        'SELECT User_id, Type FROM user WHERE Email = ? LIMIT 1',
        [email]
    );

    if (existing.length) {
        // Fix admin type if it was stored as empty string (pre-ENUM-migration)
        if (!existing[0].Type || existing[0].Type !== 'Admin') {
            await conn.query(
                'UPDATE user SET Type = ? WHERE User_id = ?',
                ['Admin', existing[0].User_id]
            );
            console.log(`Admin account type fixed (${email}) 🔧`);
        } else {
            console.log(`Admin account already exists (${email}) ✅`);
        }
        return;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await conn.query(
        `INSERT INTO user (FName, LName, Email, Password, Type, JoinDate)
         VALUES (?, ?, ?, ?, 'Admin', CURRENT_DATE)`,
        [fName, lName, email, hashedPassword]
    );

    console.log(`Admin account seeded (${email}) 🔑`);
};


// Migrate Payment table to add escrow columns (safe for existing DBs)
const migratePaymentTable = async (conn) => {
    const migrations = [
        { column: 'PaymentType', sql: "ALTER TABLE Payment ADD COLUMN PaymentType ENUM('product','escrow') DEFAULT 'product'" },
        { column: 'EscrowHeld', sql: "ALTER TABLE Payment ADD COLUMN EscrowHeld DECIMAL(10,2) DEFAULT 0.00" },
        { column: 'EscrowReleased', sql: "ALTER TABLE Payment ADD COLUMN EscrowReleased DECIMAL(10,2) DEFAULT 0.00" },
        { column: 'EscrowStatus', sql: "ALTER TABLE Payment ADD COLUMN EscrowStatus ENUM('none','pending','held','partially_released','fully_released','refunded') DEFAULT 'none'" },
        { column: 'Artisan_id', sql: "ALTER TABLE Payment ADD COLUMN Artisan_id INT, ADD FOREIGN KEY (Artisan_id) REFERENCES Artisan(Artisan_id) ON DELETE SET NULL" },
    ];

    const [columns] = await conn.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'CURIO' AND TABLE_NAME = 'Payment'"
    );
    const existing = new Set(columns.map(c => c.COLUMN_NAME));

    for (const m of migrations) {
        if (!existing.has(m.column)) {
            try {
                await conn.query(m.sql);
                console.log(`  ✅ Added Payment.${m.column}`);
            } catch (e) {
                // Column might already exist from a partial migration
                if (!e.message.includes('Duplicate column')) console.warn(`  ⚠️ Migration warning for ${m.column}:`, e.message);
            }
        }
    }
    console.log("Payment table escrow migration complete ✅");
};

// ─── Review table migration: add EditedAt column ───
const migrateReviewTable = async (conn) => {
    const [columns] = await conn.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'CURIO' AND TABLE_NAME = 'Review'"
    );
    const existing = new Set(columns.map(c => c.COLUMN_NAME));

    if (!existing.has('EditedAt')) {
        try {
            await conn.query("ALTER TABLE Review ADD COLUMN EditedAt DATETIME DEFAULT NULL");
            console.log("  ✅ Added Review.EditedAt");
        } catch (e) {
            if (!e.message.includes('Duplicate column')) console.warn("  ⚠️ Review migration warning:", e.message);
        }
    }
    console.log("Review table migration complete ✅");
};

// ─── Payment table migration: add Mentorship_id + Workshop_id columns ───
const migratePaymentForMentorshipWorkshop = async (conn) => {
    const [columns] = await conn.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'CURIO' AND TABLE_NAME = 'Payment'"
    );
    const existing = new Set(columns.map(c => c.COLUMN_NAME));

    // Expand PaymentType ENUM to include mentorship and workshop
    try {
        await conn.query(
            "ALTER TABLE Payment MODIFY COLUMN PaymentType ENUM('product','escrow','mentorship','workshop') DEFAULT 'product'"
        );
        console.log("  ✅ Payment.PaymentType ENUM expanded");
    } catch (e) {
        if (!e.message.includes('Duplicate')) console.warn("  ⚠️ PaymentType ENUM expansion warning:", e.message);
    }

    const migrations = [
        { column: 'Mentorship_id', sql: "ALTER TABLE Payment ADD COLUMN Mentorship_id INT, ADD FOREIGN KEY (fk_payment_mentorship) REFERENCES Mentorship(Mentorship_id) ON DELETE SET NULL" },
        { column: 'Workshop_id', sql: "ALTER TABLE Payment ADD COLUMN Workshop_id INT, ADD FOREIGN KEY (fk_payment_workshop) REFERENCES Workshop(Workshop_id) ON DELETE SET NULL" },
    ];

    for (const m of migrations) {
        if (!existing.has(m.column)) {
            try {
                // Use simpler ALTER for safer execution
                await conn.query(`ALTER TABLE Payment ADD COLUMN ${m.column} INT DEFAULT NULL`);
                console.log(`  ✅ Added Payment.${m.column}`);
            } catch (e) {
                if (!e.message.includes('Duplicate column')) console.warn(`  ⚠️ Payment migration warning for ${m.column}:`, e.message);
            }
        }
    }
    console.log("Payment mentorship/workshop migration complete ✅");
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
        await ensureAdminEnum(conn);
        await seedAdmin(conn);
        await migratePaymentTable(conn);
        await migrateReviewTable(conn);
        await migrateOrderTable(conn);
        await migrateMilestoneTable(conn);
        await migratePaymentForMentorshipWorkshop(conn);

    } finally {
        conn.release();
    }
};

// ─── Order table migration: add Phone + DeliveryNotes columns ───
async function migrateOrderTable(conn) {
    const migrations = [
        { column: 'Phone', sql: "ALTER TABLE `Order` ADD COLUMN Phone VARCHAR(30) DEFAULT NULL" },
        { column: 'DeliveryNotes', sql: "ALTER TABLE `Order` ADD COLUMN DeliveryNotes TEXT DEFAULT NULL" },
    ];
    const [columns] = await conn.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'CURIO' AND TABLE_NAME = 'Order'"
    );
    const existing = new Set(columns.map(c => c.COLUMN_NAME));
    for (const m of migrations) {
        if (!existing.has(m.column)) {
            try {
                await conn.query(m.sql);
                console.log(`  ✅ Added Order.${m.column}`);
            } catch (e) {
                if (!e.message.includes('Duplicate column')) console.warn(`  ⚠️ Order migration warning for ${m.column}:`, e.message);
            }
        }
    }
    console.log("Order table migration complete ✅");
}

// ─── Milestone table migration: add Application_id column + backfill ───
async function migrateMilestoneTable(conn) {
    const [columns] = await conn.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'CURIO' AND TABLE_NAME = 'Milestone'"
    );
    const existing = new Set(columns.map(c => c.COLUMN_NAME));

    // Step 1: Add Artisan_id if missing (older migration, kept for safety)
    if (!existing.has('Artisan_id')) {
        try {
            await conn.query(
                "ALTER TABLE Milestone ADD COLUMN Artisan_id INT, ADD FOREIGN KEY (Artisan_id) REFERENCES Artisan(Artisan_id) ON DELETE SET NULL"
            );
            console.log("  ✅ Added Milestone.Artisan_id");
        } catch (e) {
            if (!e.message.includes('Duplicate column')) console.warn("  ⚠️ Milestone migration warning:", e.message);
        }
    }

    // Step 2: Add Application_id column if missing
    if (!existing.has('Application_id')) {
        try {
            await conn.query(
                "ALTER TABLE Milestone ADD COLUMN Application_id INT, ADD CONSTRAINT fk_milestone_application FOREIGN KEY (Application_id) REFERENCES Application(Application_id) ON DELETE SET NULL"
            );
            console.log("  ✅ Added Milestone.Application_id");
        } catch (e) {
            if (!e.message.includes('Duplicate column') && !e.message.includes('Duplicate key')) {
                console.warn("  ⚠️ Milestone Application_id migration warning:", e.message);
            }
        }
    }

    // Step 3: Backfill BOTH Artisan_id and Application_id for existing milestone rows.
    // We join ONLY on Request_id because:
    //   - Only ONE application per request can have Status='Approved'
    //   - Legacy milestone rows have Artisan_id = NULL (inserted before the column existed)
    //     so we cannot join on Artisan_id — that would match nothing.
    try {
        const [backfillResult] = await conn.query(`
            UPDATE Milestone m
            INNER JOIN Application ap
                ON  ap.Request_id = m.Request_id
                AND ap.Status     = 'Approved'
            SET m.Application_id = ap.Application_id,
                m.Artisan_id     = ap.Artisan_id
            WHERE m.Application_id IS NULL
               OR m.Artisan_id     IS NULL
        `);
        if (backfillResult.affectedRows > 0) {
            console.log(`  ✅ Backfilled Milestone.Application_id + Artisan_id for ${backfillResult.affectedRows} row(s)`);
        } else {
            console.log("  ✅ Milestone backfill: all rows already have Application_id + Artisan_id");
        }
    } catch (e) {
        console.warn("  ⚠️ Milestone backfill warning:", e.message);
    }

    console.log("Milestone table migration complete ✅");
}
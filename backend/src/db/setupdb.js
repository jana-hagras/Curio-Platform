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
            EnhancedPrompt TEXT,
            Status ENUM('Open','In Progress','Completed','Cancelled') DEFAULT 'Open',
            FOREIGN KEY (Buyer_id) REFERENCES Buyer(Buyer_id) ON DELETE CASCADE
        )`,
        // REQUEST AI GENERATION
        `CREATE TABLE IF NOT EXISTS RequestAIGeneration (
            Generation_id INT AUTO_INCREMENT PRIMARY KEY,
            Request_id INT NOT NULL,
            MeshyTaskId VARCHAR(100),
            GeneratedImageUrl TEXT,
            GenerationStatus ENUM('Pending','Processing','Completed','Failed') DEFAULT 'Pending',
            ErrorMessage TEXT,
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CompletedAt TIMESTAMP NULL,
            FOREIGN KEY (Request_id) REFERENCES Request(Request_id) ON DELETE CASCADE
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
        )`,
        // ══════════════════════════════════════════
        // CHAT SYSTEM TABLES
        // ══════════════════════════════════════════
        // CHAT
        `CREATE TABLE IF NOT EXISTS Chat (
            chat_id INT AUTO_INCREMENT PRIMARY KEY,
            type ENUM('private','workshop','mentorship','custom_request') NOT NULL,
            created_by INT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_message_id INT DEFAULT NULL,
            last_message_at DATETIME DEFAULT NULL,
            workshop_id INT DEFAULT NULL,
            mentorship_id INT DEFAULT NULL,
            FOREIGN KEY (created_by) REFERENCES user(User_id) ON DELETE SET NULL,
            FOREIGN KEY (workshop_id) REFERENCES Workshop(Workshop_id) ON DELETE CASCADE,
            FOREIGN KEY (mentorship_id) REFERENCES Mentorship(Mentorship_id) ON DELETE CASCADE
        )`,
        // CHAT MEMBER
        `CREATE TABLE IF NOT EXISTS ChatMember (
            id INT AUTO_INCREMENT PRIMARY KEY,
            chat_id INT NOT NULL,
            user_id INT NOT NULL,
            role ENUM('member','admin') DEFAULT 'member',
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_read_at DATETIME DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            UNIQUE KEY unique_chat_member (chat_id, user_id),
            FOREIGN KEY (chat_id) REFERENCES Chat(chat_id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES user(User_id) ON DELETE CASCADE
        )`,
        // MESSAGE
        `CREATE TABLE IF NOT EXISTS Message (
            message_id INT AUTO_INCREMENT PRIMARY KEY,
            chat_id INT NOT NULL,
            sender_id INT NOT NULL,
            content TEXT,
            message_type ENUM('text','image','file','system') DEFAULT 'text',
            attachment_url VARCHAR(500) DEFAULT NULL,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            edited_at DATETIME DEFAULT NULL,
            deleted_at DATETIME DEFAULT NULL,
            status ENUM('sent','delivered','read') DEFAULT 'sent',
            FOREIGN KEY (chat_id) REFERENCES Chat(chat_id) ON DELETE CASCADE,
            FOREIGN KEY (sender_id) REFERENCES user(User_id) ON DELETE CASCADE
        )`,
        // MESSAGE READ RECEIPT
        `CREATE TABLE IF NOT EXISTS MessageReadReceipt (
            id INT AUTO_INCREMENT PRIMARY KEY,
            message_id INT NOT NULL,
            user_id INT NOT NULL,
            read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_read_receipt (message_id, user_id),
            FOREIGN KEY (message_id) REFERENCES Message(message_id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES user(User_id) ON DELETE CASCADE
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
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        connectTimeout: 60000,
    };
    if (process.env.DB_SSL === 'true') {
        dbConfig.ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: true };
    }
    
    let tempConn;
    let retries = 3;
    while (retries > 0) {
        try {
            tempConn = await mysql.createConnection(dbConfig);
            break;
        } catch (err) {
            console.error(`DB connection failed. Retries left: ${retries - 1}. Error: ${err.message}`);
            retries--;
            if (retries === 0) throw err;
            await new Promise(res => setTimeout(res, 5000));
        }
    }

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
        await migrateChatTables(conn);
        await migratePaymentCommission(conn);
        await migrateWorkshopPaymentStatus(conn);
        await migrateMentorshipAwaitingPayment(conn);
        await migrateUserCountry(conn);
        await migrateRequestAI(conn);
        await migrateRequestAIVersioning(conn);
        await migrateRequestImageAndSelection(conn);
        await migrateWorkshopMeetingLink(conn);
        await migrateChatbotKnowledge(conn);

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

// ─── Chat system tables migration (safe for existing DBs) ───
async function migrateChatTables(conn) {
    const chatTables = ['Chat', 'ChatMember', 'Message', 'MessageReadReceipt'];
    const [rows] = await conn.query(
        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'CURIO' AND TABLE_NAME IN (?)",
        [chatTables]
    );
    const existing = new Set(rows.map(r => r.TABLE_NAME));

    if (chatTables.every(t => existing.has(t))) {
        console.log("Chat tables already exist ✅");
        return;
    }

    // Tables are created in createAllTables(), but if DB existed before chat feature,
    // we need to create them here for safety
    const creates = [];

    if (!existing.has('Chat')) {
        creates.push(`CREATE TABLE IF NOT EXISTS Chat (
            chat_id INT AUTO_INCREMENT PRIMARY KEY,
            type ENUM('private','workshop','mentorship','custom_request') NOT NULL,
            created_by INT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_message_id INT DEFAULT NULL,
            last_message_at DATETIME DEFAULT NULL,
            workshop_id INT DEFAULT NULL,
            mentorship_id INT DEFAULT NULL,
            FOREIGN KEY (created_by) REFERENCES user(User_id) ON DELETE SET NULL,
            FOREIGN KEY (workshop_id) REFERENCES Workshop(Workshop_id) ON DELETE CASCADE,
            FOREIGN KEY (mentorship_id) REFERENCES Mentorship(Mentorship_id) ON DELETE CASCADE
        )`);
    }

    if (!existing.has('ChatMember')) {
        creates.push(`CREATE TABLE IF NOT EXISTS ChatMember (
            id INT AUTO_INCREMENT PRIMARY KEY,
            chat_id INT NOT NULL,
            user_id INT NOT NULL,
            role ENUM('member','admin') DEFAULT 'member',
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_read_at DATETIME DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            UNIQUE KEY unique_chat_member (chat_id, user_id),
            FOREIGN KEY (chat_id) REFERENCES Chat(chat_id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES user(User_id) ON DELETE CASCADE
        )`);
    }

    if (!existing.has('Message')) {
        creates.push(`CREATE TABLE IF NOT EXISTS Message (
            message_id INT AUTO_INCREMENT PRIMARY KEY,
            chat_id INT NOT NULL,
            sender_id INT NOT NULL,
            content TEXT,
            message_type ENUM('text','image','file','system') DEFAULT 'text',
            attachment_url VARCHAR(500) DEFAULT NULL,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            edited_at DATETIME DEFAULT NULL,
            deleted_at DATETIME DEFAULT NULL,
            status ENUM('sent','delivered','read') DEFAULT 'sent',
            FOREIGN KEY (chat_id) REFERENCES Chat(chat_id) ON DELETE CASCADE,
            FOREIGN KEY (sender_id) REFERENCES user(User_id) ON DELETE CASCADE
        )`);
    }

    if (!existing.has('MessageReadReceipt')) {
        creates.push(`CREATE TABLE IF NOT EXISTS MessageReadReceipt (
            id INT AUTO_INCREMENT PRIMARY KEY,
            message_id INT NOT NULL,
            user_id INT NOT NULL,
            read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_read_receipt (message_id, user_id),
            FOREIGN KEY (message_id) REFERENCES Message(message_id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES user(User_id) ON DELETE CASCADE
        )`);
    }

    for (const sql of creates) {
        await conn.query(sql);
    }
    console.log("Chat system tables migration complete ✅");
}

// ─── Payment commission columns migration ───
async function migratePaymentCommission(conn) {
    const [columns] = await conn.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'CURIO' AND TABLE_NAME = 'Payment'"
    );
    const existing = new Set(columns.map(c => c.COLUMN_NAME));

    const migrations = [
        { column: 'PlatformCommissionAmount', sql: "ALTER TABLE Payment ADD COLUMN PlatformCommissionAmount DECIMAL(10,2) DEFAULT 0.00" },
        { column: 'ArtisanAmount', sql: "ALTER TABLE Payment ADD COLUMN ArtisanAmount DECIMAL(10,2) DEFAULT 0.00" },
        { column: 'Buyer_id', sql: "ALTER TABLE Payment ADD COLUMN Buyer_id INT DEFAULT NULL" },
    ];

    for (const m of migrations) {
        if (!existing.has(m.column)) {
            try {
                await conn.query(m.sql);
                console.log(`  ✅ Added Payment.${m.column}`);
            } catch (e) {
                if (!e.message.includes('Duplicate column')) console.warn(`  ⚠️ Payment commission migration warning for ${m.column}:`, e.message);
            }
        }
    }

    // Backfill existing payments: set commission = 10% of TotalAmount where not set
    try {
        await conn.query(`
            UPDATE Payment 
            SET PlatformCommissionAmount = ROUND(TotalAmount * 0.10, 2),
                ArtisanAmount = ROUND(TotalAmount * 0.90, 2)
            WHERE PlatformCommissionAmount = 0 AND ArtisanAmount = 0 AND TotalAmount > 0
        `);
        console.log("  ✅ Backfilled Payment commission values");
    } catch (e) {
        console.warn("  ⚠️ Payment commission backfill warning:", e.message);
    }

    console.log("Payment commission migration complete ✅");
}

// ─── WorkshopRegistration: add PaymentStatus column ───
async function migrateWorkshopPaymentStatus(conn) {
    const [columns] = await conn.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'CURIO' AND TABLE_NAME = 'WorkshopRegistration'"
    );
    const existing = new Set(columns.map(c => c.COLUMN_NAME));

    if (!existing.has('PaymentStatus')) {
        try {
            await conn.query(
                "ALTER TABLE WorkshopRegistration ADD COLUMN PaymentStatus ENUM('Pending','Completed','Failed') DEFAULT 'Pending'"
            );
            console.log("  ✅ Added WorkshopRegistration.PaymentStatus");
        } catch (e) {
            if (!e.message.includes('Duplicate column')) console.warn("  ⚠️ WorkshopRegistration PaymentStatus migration warning:", e.message);
        }
    }
    console.log("WorkshopRegistration payment status migration complete ✅");
}

// ─── MentorshipApplication: expand Status ENUM to include AwaitingPayment ───
async function migrateMentorshipAwaitingPayment(conn) {
    try {
        await conn.query(
            "ALTER TABLE MentorshipApplication MODIFY COLUMN Status ENUM('Pending','Accepted','AwaitingPayment','Rejected','Completed') DEFAULT 'Pending'"
        );
        console.log("  ✅ MentorshipApplication.Status ENUM expanded with AwaitingPayment");
    } catch (e) {
        if (!e.message.includes('Duplicate')) console.warn("  ⚠️ MentorshipApplication Status migration warning:", e.message);
    }
    console.log("MentorshipApplication AwaitingPayment migration complete ✅");
}

// ─── User table: add Country column (for all users, primarily used by Buyers) ───
async function migrateUserCountry(conn) {
    const [columns] = await conn.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'CURIO' AND TABLE_NAME = 'user'"
    );
    const existing = new Set(columns.map(c => c.COLUMN_NAME));

    if (!existing.has('Country')) {
        try {
            await conn.query("ALTER TABLE user ADD COLUMN Country VARCHAR(100) DEFAULT NULL");
            console.log("  ✅ Added user.Country");
        } catch (e) {
            if (!e.message.includes('Duplicate column')) console.warn("  ⚠️ User Country migration warning:", e.message);
        }
    }

    // Backfill: copy Buyer.Country to user.Country for existing buyers
    try {
        const [result] = await conn.query(`
            UPDATE user u
            INNER JOIN Buyer b ON u.User_id = b.Buyer_id
            SET u.Country = b.Country
            WHERE u.Country IS NULL AND b.Country IS NOT NULL
        `);
        if (result.affectedRows > 0) {
            console.log(`  ✅ Backfilled user.Country for ${result.affectedRows} buyer(s)`);
        }
    } catch (e) {
        console.warn("  ⚠️ User Country backfill warning:", e.message);
    }

    console.log("User Country migration complete ✅");
}

// ─── Request AI: add EnhancedPrompt + Status columns, create RequestAIGeneration table ───
async function migrateRequestAI(conn) {
    const [columns] = await conn.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'CURIO' AND TABLE_NAME = 'Request'"
    );
    const existing = new Set(columns.map(c => c.COLUMN_NAME));

    if (!existing.has('EnhancedPrompt')) {
        try {
            await conn.query("ALTER TABLE Request ADD COLUMN EnhancedPrompt TEXT DEFAULT NULL");
            console.log("  ✅ Added Request.EnhancedPrompt");
        } catch (e) {
            if (!e.message.includes('Duplicate column')) console.warn("  ⚠️ Request EnhancedPrompt migration warning:", e.message);
        }
    }

    if (!existing.has('Status')) {
        try {
            await conn.query("ALTER TABLE Request ADD COLUMN Status ENUM('Open','In Progress','Completed','Cancelled') DEFAULT 'Open'");
            console.log("  ✅ Added Request.Status");
        } catch (e) {
            if (!e.message.includes('Duplicate column')) console.warn("  ⚠️ Request Status migration warning:", e.message);
        }
    }

    // Create RequestAIGeneration table if it doesn't exist
    try {
        await conn.query(`CREATE TABLE IF NOT EXISTS RequestAIGeneration (
            Generation_id INT AUTO_INCREMENT PRIMARY KEY,
            Request_id INT NOT NULL,
            MeshyTaskId VARCHAR(100),
            GeneratedImageUrl TEXT,
            GenerationStatus ENUM('Pending','Processing','Completed','Failed') DEFAULT 'Pending',
            ErrorMessage TEXT,
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CompletedAt TIMESTAMP NULL,
            FOREIGN KEY (Request_id) REFERENCES Request(Request_id) ON DELETE CASCADE
        )`);
        console.log("  ✅ RequestAIGeneration table ready");

        // Widen GeneratedImageUrl from VARCHAR(500) to TEXT for long signed URLs
        try {
            await conn.query("ALTER TABLE RequestAIGeneration MODIFY COLUMN GeneratedImageUrl TEXT");
        } catch (e) {
            // Ignore if already TEXT
        }
    } catch (e) {
        console.warn("  ⚠️ RequestAIGeneration table warning:", e.message);
    }

    console.log("Request AI migration complete ✅");
}

// ─── RequestAIGeneration: add versioning columns (VersionNumber, RefinementPrompt, EnhancedPrompt, IsPreferred) ───
async function migrateRequestAIVersioning(conn) {
    const [columns] = await conn.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'CURIO' AND TABLE_NAME = 'RequestAIGeneration'"
    );
    const existing = new Set(columns.map(c => c.COLUMN_NAME));

    const migrations = [
        { column: 'VersionNumber', sql: "ALTER TABLE RequestAIGeneration ADD COLUMN VersionNumber INT DEFAULT 1" },
        { column: 'RefinementPrompt', sql: "ALTER TABLE RequestAIGeneration ADD COLUMN RefinementPrompt TEXT DEFAULT NULL" },
        { column: 'EnhancedPrompt', sql: "ALTER TABLE RequestAIGeneration ADD COLUMN EnhancedPrompt TEXT DEFAULT NULL" },
        { column: 'IsPreferred', sql: "ALTER TABLE RequestAIGeneration ADD COLUMN IsPreferred BOOLEAN DEFAULT FALSE" },
        { column: 'ModelGlbUrl', sql: "ALTER TABLE RequestAIGeneration ADD COLUMN ModelGlbUrl TEXT DEFAULT NULL" },
    ];

    for (const m of migrations) {
        if (!existing.has(m.column)) {
            try {
                await conn.query(m.sql);
                console.log(`  ✅ Added RequestAIGeneration.${m.column}`);
            } catch (e) {
                if (!e.message.includes('Duplicate column')) console.warn(`  ⚠️ RequestAIGeneration versioning migration warning for ${m.column}:`, e.message);
            }
        }
    }

    // Backfill: set VersionNumber = 1 for existing records that have NULL
    try {
        await conn.query("UPDATE RequestAIGeneration SET VersionNumber = 1 WHERE VersionNumber IS NULL");
    } catch (e) {
        console.warn("  ⚠️ VersionNumber backfill warning:", e.message);
    }

    console.log("RequestAIGeneration versioning migration complete ✅");
}

// ─── Request table: add ImageSourceType, UploadedImageUrl, FinalGeneration_id columns ───
async function migrateRequestImageAndSelection(conn) {
    const [columns] = await conn.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'CURIO' AND TABLE_NAME = 'Request'"
    );
    const existing = new Set(columns.map(c => c.COLUMN_NAME));

    if (!existing.has('ImageSourceType')) {
        try {
            await conn.query("ALTER TABLE Request ADD COLUMN ImageSourceType ENUM('Upload', 'AI') DEFAULT 'AI'");
            console.log("  ✅ Added Request.ImageSourceType");
        } catch (e) {
            if (!e.message.includes('Duplicate column')) console.warn("  ⚠️ Request ImageSourceType migration warning:", e.message);
        }
    }

    if (!existing.has('UploadedImageUrl')) {
        try {
            await conn.query("ALTER TABLE Request ADD COLUMN UploadedImageUrl TEXT DEFAULT NULL");
            console.log("  ✅ Added Request.UploadedImageUrl");
        } catch (e) {
            if (!e.message.includes('Duplicate column')) console.warn("  ⚠️ Request UploadedImageUrl migration warning:", e.message);
        }
    }

    if (!existing.has('FinalGeneration_id')) {
        try {
            await conn.query("ALTER TABLE Request ADD COLUMN FinalGeneration_id INT DEFAULT NULL");
            await conn.query("ALTER TABLE Request ADD CONSTRAINT fk_request_final_generation FOREIGN KEY (FinalGeneration_id) REFERENCES RequestAIGeneration(Generation_id) ON DELETE SET NULL");
            console.log("  ✅ Added Request.FinalGeneration_id with foreign key");
        } catch (e) {
            if (!e.message.includes('Duplicate column') && !e.message.includes('Duplicate key')) {
                console.warn("  ⚠️ Request FinalGeneration_id migration warning:", e.message);
            }
        }
    }

    console.log("Request image source and selection migration complete ✅");
}

// ─── Workshop table: add MeetingLink column ───
async function migrateWorkshopMeetingLink(conn) {
    const [columns] = await conn.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'CURIO' AND TABLE_NAME = 'Workshop'"
    );
    const existing = new Set(columns.map(c => c.COLUMN_NAME));

    if (!existing.has('MeetingLink')) {
        try {
            await conn.query("ALTER TABLE Workshop ADD COLUMN MeetingLink VARCHAR(500) DEFAULT NULL");
            console.log("  ✅ Added Workshop.MeetingLink");
        } catch (e) {
            if (!e.message.includes('Duplicate column')) console.warn("  ⚠️ Workshop MeetingLink migration warning:", e.message);
        }
    }
    console.log("Workshop MeetingLink migration complete ✅");
}

// ─── ChatbotKnowledge table: create and seed default instructions and FAQs ───
async function migrateChatbotKnowledge(conn) {
    try {
        await conn.query(`
            CREATE TABLE IF NOT EXISTS ChatbotKnowledge (
                id INT AUTO_INCREMENT PRIMARY KEY,
                key_name VARCHAR(50) UNIQUE NOT NULL,
                content TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log("  ✅ ChatbotKnowledge table verified");

        const defaultInstructions = "You are Curio AI, the official assistant for Curio (a premium Egyptian handcrafts marketplace). Use the provided database query results (if any) as the absolute source of truth. If database records are provided, speak about them accurately and politely. If no records are found or if query results are empty, inform the user clearly without inventing fake records. Be conversational, professional, and support both English and Arabic. When answering policy or workflow questions, use the platform details: 10% platform fee, escrow held for custom requests and released on milestone completion, workshops hosted by artisans, mentorships offered as 1-on-1 sessions.";
        
        const defaultFaqs = "FAQ Guidelines:\n1. Custom Requests: Buyers can submit design ideas. AI creates a 3D preview. Artisans bid. Payments are held in Escrow.\n2. Milestones: Custom order budgets are split into milestones. Payouts release when buyers approve milestone completion.\n3. Workshops: Live group learning hosted by artisans. Fee required on registration.\n4. Mentorships: 1-on-1 training. Status can be Active, Inactive, or Full.\n5. Commission: Curio retains a standard 10% platform fee on sales, workshops, and mentorships. Artisans receive 90%.";

        await conn.query(`
            INSERT INTO ChatbotKnowledge (key_name, content)
            VALUES ('instructions', ?), ('faq', ?)
            ON DUPLICATE KEY UPDATE content = VALUES(content)
        `, [defaultInstructions, defaultFaqs]);
        
        console.log("  ✅ ChatbotKnowledge seeded successfully");
    } catch (e) {
        console.warn("  ⚠️ ChatbotKnowledge migration/seeding warning:", e.message);
    }
}
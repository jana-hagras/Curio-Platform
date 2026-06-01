import pool from "../../db/connection.js";

const GEMINI_API_URL = "https://genergener-dummy-url"; // Fallback URL or resolved from environment if configured
const REAL_GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Fetch dynamic chatbot configuration/knowledge from the DB.
 */
export async function getKnowledge(keyName) {
  try {
    const [rows] = await pool.query("SELECT content FROM ChatbotKnowledge WHERE key_name = ?", [keyName]);
    return rows[0]?.content || null;
  } catch (err) {
    console.error(`[AI Assistant] Failed to fetch knowledge for ${keyName}:`, err.message);
    return null;
  }
}

/**
 * Update dynamic chatbot configuration/knowledge in the DB.
 */
export async function updateKnowledge(keyName, content) {
  await pool.query(
    "INSERT INTO ChatbotKnowledge (key_name, content) VALUES (?, ?) ON DUPLICATE KEY UPDATE content = VALUES(content)",
    [keyName, content]
  );
  return { ok: true };
}

// ─── LEVEL 2 DATABASE QUERIES ───────────────────────────────────

async function getUserOrders(userId) {
  const [rows] = await pool.query(
    `SELECT o.Order_id, o.OrderDate, o.DeliveryAddress, o.Status, 
            GROUP_CONCAT(CONCAT(mi.Item, ' (x', oi.Quantity, ')') SEPARATOR ', ') as items
     FROM \`Order\` o
     LEFT JOIN OrderItem oi ON o.Order_id = oi.Order_id
     LEFT JOIN MarketItem mi ON oi.Item_id = mi.Item_id
     WHERE o.Buyer_id = ?
     GROUP BY o.Order_id
     ORDER BY o.OrderDate DESC LIMIT 5`,
    [userId]
  );
  return rows;
}

async function getUserRequests(userId) {
  const [rows] = await pool.query(
    `SELECT Request_id, Title, Description, Request_Date, Budget, Status, Category 
     FROM Request 
     WHERE Buyer_id = ? 
     ORDER BY Request_Date DESC LIMIT 5`,
    [userId]
  );
  return rows;
}

async function getUserPayments(userId) {
  const [rows] = await pool.query(
    `SELECT Payment_id, TotalAmount, PaymentMethod, TransactionDate, Status, PaymentType, EscrowStatus
     FROM Payment 
     WHERE Buyer_id = ? 
     ORDER BY TransactionDate DESC LIMIT 5`,
    [userId]
  );
  return rows;
}

async function getUserWorkshops(userId) {
  const [rows] = await pool.query(
    `SELECT wr.Registration_id, wr.RegistrationDate, wr.Status as RegistrationStatus, wr.PaymentStatus,
            w.Title, w.WorkshopDate, w.Price
     FROM WorkshopRegistration wr
     INNER JOIN Workshop w ON wr.Workshop_id = w.Workshop_id
     WHERE wr.Buyer_id = ?
     ORDER BY w.WorkshopDate DESC LIMIT 5`,
    [userId]
  );
  return rows;
}

async function getUserMentorships(userId) {
  const [rows] = await pool.query(
    `SELECT ma.Application_id, ma.ApplicationDate, ma.Status as ApplicationStatus, ma.Message,
            m.Category, m.SessionPrice, m.Duration
     FROM MentorshipApplication ma
     INNER JOIN Mentorship m ON ma.Mentorship_id = m.Mentorship_id
     WHERE ma.Buyer_id = ?
     ORDER BY ma.ApplicationDate DESC LIMIT 5`,
    [userId]
  );
  return rows;
}

async function getArtisanProducts(artisanId) {
  const [rows] = await pool.query(
    `SELECT Item_id, Item, Description, AvailQuantity, Price, Category, DateAdded 
     FROM MarketItem 
     WHERE Artisan_id = ? 
     ORDER BY DateAdded DESC`,
    [artisanId]
  );
  return rows;
}

async function getArtisanEarnings(artisanId) {
  const [rows] = await pool.query(
    `SELECT 
       COUNT(Payment_id) as salesCount,
       COALESCE(SUM(TotalAmount), 0) as grossEarnings,
       COALESCE(SUM(PlatformCommissionAmount), 0) as totalCommission,
       COALESCE(SUM(ArtisanAmount), 0) as netEarnings
     FROM Payment 
     WHERE Artisan_id = ? AND Status = 'Completed'`,
    [artisanId]
  );
  return rows[0];
}

async function getArtisanProposals(artisanId) {
  const [rows] = await pool.query(
    `SELECT a.Application_id, a.ApplicationDate, a.Proposal, a.Status, r.Title as requestTitle, r.Budget as requestBudget
     FROM Application a
     INNER JOIN Request r ON a.Request_id = r.Request_id
     WHERE a.Artisan_id = ?
     ORDER BY a.ApplicationDate DESC LIMIT 5`,
    [artisanId]
  );
  return rows;
}

async function getArtisanWorkshops(artisanId) {
  const [rows] = await pool.query(
    `SELECT Workshop_id, Title, WorkshopDate, Price, Category, MaxParticipants, Status
     FROM Workshop 
     WHERE Artisan_id = ? 
     ORDER BY WorkshopDate DESC`,
    [artisanId]
  );
  return rows;
}

async function getArtisanMentorships(artisanId) {
  const [rows] = await pool.query(
    `SELECT Mentorship_id, Category, SessionPrice, Duration, Status, MaxStudents 
     FROM Mentorship 
     WHERE Artisan_id = ?`,
    [artisanId]
  );
  return rows;
}

async function getAdminStats() {
  const [userCount] = await pool.query("SELECT COUNT(*) as count FROM user");
  const [buyerCount] = await pool.query("SELECT COUNT(*) as count FROM Buyer");
  const [artisanCount] = await pool.query("SELECT COUNT(*) as count FROM Artisan");
  const [productCount] = await pool.query("SELECT COUNT(*) as count FROM MarketItem");
  const [orderCount] = await pool.query("SELECT COUNT(*) as count FROM \`Order\`");
  
  const [revenueStats] = await pool.query(
    `SELECT 
       COUNT(Payment_id) as totalTransactions,
       COALESCE(SUM(TotalAmount), 0) as totalVolume,
       COALESCE(SUM(PlatformCommissionAmount), 0) as totalCommission,
       COALESCE(SUM(ArtisanAmount), 0) as artisanPayouts
     FROM Payment 
     WHERE Status = 'Completed'`
  );

  const [escrowStats] = await pool.query(
    `SELECT 
       COUNT(Payment_id) as count,
       COALESCE(SUM(EscrowHeld), 0) as held,
       COALESCE(SUM(EscrowReleased), 0) as released,
       COALESCE(SUM(TotalAmount), 0) as totalBudget
     FROM Payment 
     WHERE PaymentType = 'escrow'`
  );

  return {
    totalUsers: userCount[0].count,
    totalBuyers: buyerCount[0].count,
    totalArtisans: artisanCount[0].count,
    totalProducts: productCount[0].count,
    totalOrders: orderCount[0].count,
    financials: revenueStats[0],
    escrow: escrowStats[0]
  };
}

// ─── INTENT DETECTION AND EXECUTION ──────────────────────────────

export async function detectIntentAndQuery(message, role, userId) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[AI Assistant] GEMINI_API_KEY missing");
    return { data: null, queryExplanation: "No API key configured." };
  }

  // Define valid tools based on roles
  let validTools = ["none"];
  if (role === "Buyer") {
    validTools.push("getUserOrders", "getUserRequests", "getUserPayments", "getUserWorkshops", "getUserMentorships");
  } else if (role === "Artisan") {
    validTools.push("getArtisanProducts", "getArtisanEarnings", "getArtisanProposals", "getArtisanWorkshops", "getArtisanMentorships");
  } else if (role === "Admin") {
    validTools.push("getAdminStats");
  }

  const systemPrompt = `You are an intent classifier for Curio handcrafts platform.
Given a user query and their platform role, identify if they are asking about their own live data (or global analytics if Admin).
Select ONLY ONE of the following valid tools for this role (${role}):
Valid choices: ${validTools.join(", ")}

Mapping Guide:
- orders, latest order status, order list -> getUserOrders
- requests, custom request, AI design status -> getUserRequests
- payments, invoice, transactions -> getUserPayments
- registered workshops, workshops joined -> getUserWorkshops
- registered mentorships, mentorship applications -> getUserMentorships
- artisan earnings, revenue, commission, how much I made -> getArtisanEarnings
- artisan products, my products -> getArtisanProducts
- proposals, bids, artisan bids on requests -> getArtisanProposals
- artisan workshops created -> getArtisanWorkshops
- artisan mentorships offered -> getArtisanMentorships
- platform overall statistics, revenue, user count, orders count (Admin only) -> getAdminStats

Return ONLY a JSON object format. No explanations. No markdown formatting. No backticks.
Example: {"tool": "getUserOrders"}`;

  try {
    const response = await fetch(`${REAL_GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\nUser Question: " + message }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 100 }
      })
    });

    if (!response.ok) {
      console.warn("[AI Assistant] Intent detection failed, fallback to none");
      return { data: null, queryExplanation: "Intent detection error status " + response.status };
    }

    const resJson = await response.json();
    let text = resJson?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Clean JSON string wrappers
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(text);
    const chosenTool = result.tool || "none";

    console.log(`[AI Assistant] Detected tool: ${chosenTool} for role: ${role}`);

    if (chosenTool === "none" || !validTools.includes(chosenTool)) {
      return { data: null, queryExplanation: "General platform inquiry." };
    }

    let data = null;
    if (chosenTool === "getUserOrders") data = await getUserOrders(userId);
    else if (chosenTool === "getUserRequests") data = await getUserRequests(userId);
    else if (chosenTool === "getUserPayments") data = await getUserPayments(userId);
    else if (chosenTool === "getUserWorkshops") data = await getUserWorkshops(userId);
    else if (chosenTool === "getUserMentorships") data = await getUserMentorships(userId);
    else if (chosenTool === "getArtisanProducts") data = await getArtisanProducts(userId);
    else if (chosenTool === "getArtisanEarnings") data = await getArtisanEarnings(userId);
    else if (chosenTool === "getArtisanProposals") data = await getArtisanProposals(userId);
    else if (chosenTool === "getArtisanWorkshops") data = await getArtisanWorkshops(userId);
    else if (chosenTool === "getArtisanMentorships") data = await getArtisanMentorships(userId);
    else if (chosenTool === "getAdminStats" && role === "Admin") data = await getAdminStats();

    return { data, queryExplanation: `Executed database lookup: ${chosenTool}` };
  } catch (err) {
    console.error("[AI Assistant] Intent execution error:", err.message);
    return { data: null, queryExplanation: "Fallback due to: " + err.message };
  }
}

// ─── FINAL RESPONSE LAYER ────────────────────────────────────────

export async function getAssistantResponse(message, role, userId) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return "The AI assistant is currently offline because the Gemini API key is not configured. Please contact the administrator.";
  }

  // 1. Fetch instructions and FAQs from DB
  const instructions = await getKnowledge("instructions");
  const faqs = await getKnowledge("faq");

  // 2. Classify intent and query database if required
  let dbResult = { data: null, queryExplanation: "General query" };
  if (role && userId) {
    dbResult = await detectIntentAndQuery(message, role, userId);
  }

  const systemInstructions = `${instructions || "You are the Curio Platform AI Assistant."}

Here is the general platform knowledge base and FAQ reference:
${faqs || "Platform fee is 10%, escrow system handles custom requests."}

CRITICAL SECURITY RULES:
- You are strictly locked to the user's authenticated identity and role: ${role || "Guest"}.
- Under no circumstances can you leak data belonging to other users.
- If the user asks for details that require database lookup, refer to the provided 'Database Context' below.
- If the 'Database Context' is empty or null, it means no records exist. Say so clearly. Do not make up fake order numbers, balances, or product listings.
- If the user's role is 'Guest', they have no personal database records. Inform them they must sign in to view their orders, products, or wallet details.`;

  const userContent = `User Role: ${role || "Guest"}
User Question: "${message}"

Database Context:
${dbResult.data ? JSON.stringify(dbResult.data, null, 2) : "No database query results available (general query or empty/no records found)."}

Please provide a helpful, natural response to the user in their language (Arabic or English). Keep it brief, professional, and matching Curio's premium aesthetic.`;

  try {
    const response = await fetch(`${REAL_GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: systemInstructions + "\n\n" + userContent }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 800
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini status ${response.status}`);
    }

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble connecting to my brain. Please try again in a moment.";
  } catch (err) {
    console.error("[AI Assistant] Gemini API error:", err.message);
    return "I'm sorry, I'm experiencing temporary service issues. Please check back later.";
  }
}

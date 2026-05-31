import pool from "../../db/connection.js";
import { createWorkshopGroupChat, addMemberToWorkshopChat } from "../chat/chat.service.js";

const PLATFORM_COMMISSION_RATE = 0.10; // 10% platform commission

const sanitizeRegistration = (row) => {
  if (!row) return null;
  return {
    id: row.Registration_id,
    workshop_id: row.Workshop_id,
    buyer_id: row.Buyer_id,
    registrationDate: row.RegistrationDate,
    status: row.Status,
    paymentStatus: row.PaymentStatus || 'Pending',
    buyerName: row.BuyerFName ? `${row.BuyerFName} ${row.BuyerLName}` : null,
    buyerProfileImage: row.BuyerProfileImage || null,
    workshopTitle: row.WorkshopTitle || null,
    workshopDate: row.WorkshopDate || null,
    workshopCategory: row.WorkshopCategory || null,
    workshopPrice: row.WorkshopPrice || null,
    artisan_id: row.Artisan_id || null,
    artisanName: row.ArtisanFName ? `${row.ArtisanFName} ${row.ArtisanLName}` : null,
  };
};

const REG_QUERY = `
  SELECT 
    wr.*,
    buyU.FName AS BuyerFName, buyU.LName AS BuyerLName,
    buyU.ProfileImage AS BuyerProfileImage,
    w.Title AS WorkshopTitle, w.WorkshopDate, w.Category AS WorkshopCategory, 
    w.Price AS WorkshopPrice, w.Artisan_id,
    artU.FName AS ArtisanFName, artU.LName AS ArtisanLName
  FROM WorkshopRegistration wr
  LEFT JOIN Buyer b ON wr.Buyer_id = b.Buyer_id
  LEFT JOIN user buyU ON b.Buyer_id = buyU.User_id
  LEFT JOIN Workshop w ON wr.Workshop_id = w.Workshop_id
  LEFT JOIN Artisan a ON w.Artisan_id = a.Artisan_id
  LEFT JOIN user artU ON a.Artisan_id = artU.User_id
`;

// =============================
// 📋 GET ALL
// =============================
export const getAllRegistrations = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`${REG_QUERY} ORDER BY wr.RegistrationDate DESC`);
    return res.status(200).json({ ok: true, data: { registrations: rows.map(sanitizeRegistration) } });
  } catch (err) { next(err); }
};

// =============================
// 📖 GET BY WORKSHOP
// =============================
export const getByWorkshop = async (req, res, next) => {
  try {
    const id = Number(req.query.workshop_id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'workshop_id' is required." });

    const [rows] = await pool.query(`${REG_QUERY} WHERE wr.Workshop_id = ?`, [id]);
    return res.status(200).json({ ok: true, data: { registrations: rows.map(sanitizeRegistration) } });
  } catch (err) { next(err); }
};

// =============================
// 📖 GET BY BUYER
// =============================
export const getByBuyer = async (req, res, next) => {
  try {
    const id = Number(req.query.buyer_id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'buyer_id' is required." });

    const [rows] = await pool.query(`${REG_QUERY} WHERE wr.Buyer_id = ? ORDER BY wr.RegistrationDate DESC`, [id]);
    return res.status(200).json({ ok: true, data: { registrations: rows.map(sanitizeRegistration) } });
  } catch (err) { next(err); }
};

// =============================
// 📖 GET BY ARTISAN (all registrations for artisan's workshops)
// =============================
export const getByArtisan = async (req, res, next) => {
  try {
    const id = Number(req.query.artisan_id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'artisan_id' is required." });

    const [rows] = await pool.query(`${REG_QUERY} WHERE w.Artisan_id = ? ORDER BY wr.RegistrationDate DESC`, [id]);
    return res.status(200).json({ ok: true, data: { registrations: rows.map(sanitizeRegistration) } });
  } catch (err) { next(err); }
};

// =============================
// ➕ CREATE REGISTRATION (with payment for paid workshops)
// =============================
export const createRegistration = async (req, res, next) => {
  try {
    const { workshop_id, buyer_id } = req.body;
    if (!workshop_id || !buyer_id) {
      return res.status(400).json({ ok: false, message: "workshop_id and buyer_id are required." });
    }

    // Check workshop exists and is upcoming
    const [workshop] = await pool.query("SELECT * FROM Workshop WHERE Workshop_id = ?", [workshop_id]);
    if (!workshop.length) return res.status(404).json({ ok: false, message: "Workshop not found." });
    if (workshop[0].Status === 'Cancelled' || workshop[0].Status === 'Completed') {
      return res.status(400).json({ ok: false, message: "This workshop is no longer accepting registrations." });
    }

    // Check capacity
    const [countRows] = await pool.query(
      "SELECT COUNT(*) as cnt FROM WorkshopRegistration WHERE Workshop_id = ? AND Status != 'Cancelled'",
      [workshop_id]
    );
    if (countRows[0].cnt >= workshop[0].MaxParticipants) {
      return res.status(400).json({ ok: false, message: "This workshop is full." });
    }

    // Check duplicate
    const [existing] = await pool.query(
      "SELECT * FROM WorkshopRegistration WHERE Workshop_id = ? AND Buyer_id = ?",
      [workshop_id, buyer_id]
    );
    if (existing.length) return res.status(400).json({ ok: false, message: "You are already registered for this workshop." });

    const workshopPrice = Number(workshop[0].Price || 0);
    const isFree = workshopPrice === 0;
    const artisanId = workshop[0].Artisan_id;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Create registration
      const paymentStatus = isFree ? 'Completed' : 'Completed'; // Card payment is immediate
      const [regResult] = await conn.query(
        "INSERT INTO WorkshopRegistration (Workshop_id, Buyer_id, RegistrationDate, Status, PaymentStatus) VALUES (?, ?, CURRENT_DATE, 'Registered', ?)",
        [workshop_id, buyer_id, paymentStatus]
      );

      // Create payment record for paid workshops (Card only — enforced server-side)
      if (!isFree) {
        const platformCommission = parseFloat((workshopPrice * PLATFORM_COMMISSION_RATE).toFixed(2));
        const artisanAmount = parseFloat((workshopPrice - platformCommission).toFixed(2));

        await conn.query(
          `INSERT INTO Payment (Workshop_id, Artisan_id, Buyer_id, TotalAmount, PlatformCommissionAmount, ArtisanAmount, PaymentMethod, TransactionDate, Status, PaymentType, EscrowHeld, EscrowReleased, EscrowStatus)
           VALUES (?, ?, ?, ?, ?, ?, 'Card', CURRENT_DATE, 'Completed', 'workshop', 0, 0, 'none')`,
          [workshop_id, artisanId, buyer_id, workshopPrice, platformCommission, artisanAmount]
        );
      }

      await conn.commit();

      // ─── Auto group chat: create or join workshop chat ───
      try {
        const chatConn = await pool.getConnection();
        try {
          await createWorkshopGroupChat(chatConn, workshop_id, artisanId);
          const [buyerUser] = await chatConn.query('SELECT FName FROM user WHERE User_id = ?', [buyer_id]);
          const buyerName = buyerUser[0]?.FName || 'A buyer';
          await addMemberToWorkshopChat(chatConn, workshop_id, buyer_id, buyerName);
        } finally {
          chatConn.release();
        }
      } catch (chatErr) {
        console.warn('Workshop chat auto-sync warning:', chatErr.message);
      }

    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    const [rows] = await pool.query(`${REG_QUERY} WHERE wr.Registration_id = ?`, [
      (await pool.query("SELECT LAST_INSERT_ID() as id"))[0][0].id
    ]);
    
    // Get the actual registration
    const [regRows] = await pool.query(
      `${REG_QUERY} WHERE wr.Workshop_id = ? AND wr.Buyer_id = ? ORDER BY wr.Registration_id DESC LIMIT 1`,
      [workshop_id, buyer_id]
    );

    return res.status(201).json({ ok: true, data: { registration: sanitizeRegistration(regRows[0]) } });
  } catch (err) { next(err); }
};

// =============================
// ✏️ UPDATE REGISTRATION
// =============================
export const updateRegistration = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const { status } = req.body;

    const [existing] = await pool.query("SELECT * FROM WorkshopRegistration WHERE Registration_id = ?", [id]);
    if (!existing.length) return res.status(404).json({ ok: false, message: "Registration not found." });

    await pool.query("UPDATE WorkshopRegistration SET Status=COALESCE(?,Status) WHERE Registration_id=?", [status, id]);

    const [rows] = await pool.query(`${REG_QUERY} WHERE wr.Registration_id = ?`, [id]);
    return res.status(200).json({ ok: true, data: { registration: sanitizeRegistration(rows[0]) } });
  } catch (err) { next(err); }
};

// =============================
// 🗑️ DELETE
// =============================
export const deleteRegistration = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [result] = await pool.query("DELETE FROM WorkshopRegistration WHERE Registration_id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, message: "Registration not found." });

    return res.status(200).json({ ok: true, message: "Registration deleted successfully." });
  } catch (err) { next(err); }
};

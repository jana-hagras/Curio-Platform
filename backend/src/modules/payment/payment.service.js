import pool from "../../db/connection.js";

const PLATFORM_COMMISSION_RATE = 0.10; // 10% platform commission

const sanitizePayment = (row) => {
  if (!row) return null;
  return {
    id: row.Payment_id,
    order_id: row.Order_id,
    request_id: row.Request_id,
    artisan_id: row.Artisan_id,
    buyer_id: row.Buyer_id || null,
    mentorship_id: row.Mentorship_id || null,
    workshop_id: row.Workshop_id || null,
    totalAmount: row.TotalAmount,
    platformCommissionAmount: row.PlatformCommissionAmount || 0,
    artisanAmount: row.ArtisanAmount || 0,
    paymentMethod: row.PaymentMethod,
    transactionDate: row.TransactionDate,
    status: row.Status,
    paymentType: row.PaymentType || 'product',
    escrowHeld: row.EscrowHeld || 0,
    escrowReleased: row.EscrowReleased || 0,
    escrowStatus: row.EscrowStatus || 'none',
    // Joined buyer info (if available from enriched queries)
    buyerName: row.BuyerFName ? `${row.BuyerFName} ${row.BuyerLName}` : null,
    buyerCountry: row.BuyerCountry || null,
    artisanName: row.ArtisanFName ? `${row.ArtisanFName} ${row.ArtisanLName}` : null,
  };
};

// Helper: calculate commission
function calculateCommission(totalAmount) {
  const amount = Number(totalAmount);
  const platformCommission = parseFloat((amount * PLATFORM_COMMISSION_RATE).toFixed(2));
  const artisanAmount = parseFloat((amount - platformCommission).toFixed(2));
  return { platformCommission, artisanAmount };
}

// Helper: get buyer country from DB
async function getBuyerCountry(buyerId) {
  if (!buyerId) return null;
  const [rows] = await pool.query(
    "SELECT u.Country, b.Country AS BuyerCountry FROM user u LEFT JOIN Buyer b ON u.User_id = b.Buyer_id WHERE u.User_id = ? LIMIT 1",
    [buyerId]
  );
  if (!rows.length) return null;
  return rows[0].Country || rows[0].BuyerCountry || null;
}

// Helper: validate payment method based on context
function validatePaymentMethod(paymentMethod, paymentType, buyerCountry) {
  const allowedCardMethods = ['Card'];
  const allowedEgyptMethods = ['COD', 'Card'];
  const allowedInternationalMethods = ['Card'];
  // Legacy support
  const legacyMethods = ['Cash', 'Visa', 'MasterCard', 'PayPal'];

  // Workshop and Mentorship: Card only, regardless of country
  if (paymentType === 'workshop' || paymentType === 'mentorship') {
    if (!allowedCardMethods.includes(paymentMethod)) {
      return 'Workshop and Mentorship payments require Bank Card payment only.';
    }
    return null;
  }

  // Marketplace/product/escrow: country-based
  if (buyerCountry && buyerCountry.toLowerCase() === 'egypt') {
    if (!allowedEgyptMethods.includes(paymentMethod) && !legacyMethods.includes(paymentMethod)) {
      return 'Invalid payment method. Egyptian buyers can use Cash on Delivery or Bank Card.';
    }
  } else if (buyerCountry) {
    if (!allowedInternationalMethods.includes(paymentMethod) && !legacyMethods.includes(paymentMethod)) {
      return 'International buyers can only use Bank Card for payment.';
    }
  }

  return null; // Valid
}

// Enriched query with buyer + artisan info
const PAYMENT_QUERY = `
  SELECT p.*,
    buyU.FName AS BuyerFName, buyU.LName AS BuyerLName, buyU.Country AS BuyerCountry,
    artU.FName AS ArtisanFName, artU.LName AS ArtisanLName
  FROM Payment p
  LEFT JOIN user buyU ON p.Buyer_id = buyU.User_id
  LEFT JOIN user artU ON p.Artisan_id = artU.User_id
`;

// =============================
// 📋 GET ALL PAYMENTS
// =============================
export const getAllPayments = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`${PAYMENT_QUERY} ORDER BY p.TransactionDate DESC, p.Payment_id DESC`);
    return res.status(200).json({
      ok: true,
      data: { payments: rows.map(sanitizePayment) }
    });
  } catch (err) {
    next(err);
  }
};

// =============================
// 🔍 SEARCH PAYMENTS
// =============================
export const searchPayments = async (req, res, next) => {
  try {
    const value = req.query.value;

    if (!value) {
      return res.status(400).json({
        ok: false,
        message: "Search value is required"
      });
    }

    const searchValue = `%${value}%`;

    const query = `
      ${PAYMENT_QUERY}
      WHERE 
        p.Payment_id LIKE ?
        OR p.Order_id LIKE ?
        OR p.Request_id LIKE ?
        OR p.TotalAmount LIKE ?
        OR p.PaymentMethod LIKE ?
        OR p.TransactionDate LIKE ?
        OR p.Status LIKE ?
        OR p.PaymentType LIKE ?
        OR p.EscrowStatus LIKE ?
        OR buyU.FName LIKE ?
        OR buyU.LName LIKE ?
      ORDER BY p.TransactionDate DESC, p.Payment_id DESC
    `;

    const values = Array(11).fill(searchValue);

    const [rows] = await pool.query(query, values);

    return res.status(200).json({
      ok: true,
      data: {
        payments: rows.map(sanitizePayment)
      }
    });

  } catch (err) {
    next(err);
  }
};

// =============================
// ➕ CREATE PAYMENT
// =============================
export const createPayment = async (req, res, next) => {
  try {
    const { order_id, request_id, artisan_id, mentorship_id, workshop_id, buyer_id, totalAmount, paymentMethod, status, paymentType } = req.body;

    if (!totalAmount || !paymentMethod) {
      return res.status(400).json({
        ok: false,
        message: "totalAmount and paymentMethod are required."
      });
    }

    if (Number(totalAmount) < 0) {
      return res.status(400).json({
        ok: false,
        message: "Total amount cannot be negative."
      });
    }

    if (!order_id && !request_id && !mentorship_id && !workshop_id) {
      return res.status(400).json({
        ok: false,
        message: "At least one of order_id, request_id, mentorship_id, or workshop_id is required."
      });
    }

    // Determine payment type
    let type = paymentType || 'product';
    if (mentorship_id) type = 'mentorship';
    else if (workshop_id) type = 'workshop';
    else if (request_id && !order_id) type = 'escrow';

    // ✅ Country-based payment method validation
    const buyerCountry = buyer_id ? await getBuyerCountry(buyer_id) : null;
    const methodError = validatePaymentMethod(paymentMethod, type, buyerCountry);
    if (methodError) {
      return res.status(400).json({ ok: false, message: methodError });
    }

    const finalStatus = status && ['Pending', 'Completed', 'Failed'].includes(status) ? status : 'Pending';

    // ✅ Server-side commission calculation
    const amount = Number(totalAmount);
    const { platformCommission, artisanAmount } = calculateCommission(amount);

    const isEscrow = type === 'escrow';

    // For escrow: if payment is completed at creation, funds go to EscrowHeld
    let escrowHeld = 0;
    let escrowReleased = 0;
    let escrowStatus = 'none';

    if (isEscrow) {
      if (finalStatus === 'Completed') {
        escrowHeld = amount;
        escrowStatus = 'held';
      } else if (finalStatus === 'Pending') {
        escrowHeld = 0;
        escrowStatus = 'pending';
      }
    }

    const [result] = await pool.query(
      `INSERT INTO Payment (Order_id, Request_id, Artisan_id, Buyer_id, Mentorship_id, Workshop_id, TotalAmount, PlatformCommissionAmount, ArtisanAmount, PaymentMethod, TransactionDate, Status, PaymentType, EscrowHeld, EscrowReleased, EscrowStatus) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE, ?, ?, ?, ?, ?)`,
      [order_id || null, request_id || null, artisan_id || null, buyer_id || null, mentorship_id || null, workshop_id || null, totalAmount, platformCommission, artisanAmount, paymentMethod, finalStatus, type, escrowHeld, escrowReleased, escrowStatus]
    );

    const [rows] = await pool.query(
      `${PAYMENT_QUERY} WHERE p.Payment_id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      ok: true,
      data: { payment: sanitizePayment(rows[0]) }
    });

  } catch (err) {
    next(err);
  }
};

// =============================
// 📖 READ BY BUYER (via Order or Request or direct Buyer_id)
// =============================
export const getPaymentsByBuyer = async (req, res, next) => {
  try {
    const buyerId = Number(req.query.buyer_id);
    if (!buyerId) return res.status(400).json({ ok: false, message: "Query parameter 'buyer_id' is required." });

    const query = `
      ${PAYMENT_QUERY}
      WHERE p.Buyer_id = ?
         OR EXISTS (SELECT 1 FROM \`Order\` o WHERE o.Order_id = p.Order_id AND o.Buyer_id = ?)
         OR EXISTS (SELECT 1 FROM Request r WHERE r.Request_id = p.Request_id AND r.Buyer_id = ?)
      ORDER BY p.TransactionDate DESC
    `;

    const [rows] = await pool.query(query, [buyerId, buyerId, buyerId]);
    return res.status(200).json({ ok: true, data: { payments: rows.map(sanitizePayment) } });
  } catch (err) { next(err); }
};

// =============================
// 📖 READ BY ARTISAN
// =============================
export const getPaymentsByArtisan = async (req, res, next) => {
  try {
    const artisanId = Number(req.query.artisan_id);
    if (!artisanId) return res.status(400).json({ ok: false, message: "Query parameter 'artisan_id' is required." });

    const [rows] = await pool.query(
      `${PAYMENT_QUERY} WHERE p.Artisan_id = ? ORDER BY p.TransactionDate DESC`,
      [artisanId]
    );
    return res.status(200).json({ ok: true, data: { payments: rows.map(sanitizePayment) } });
  } catch (err) { next(err); }
};

// =============================
// 📖 READ BY ID
// =============================
export const getPaymentById = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [rows] = await pool.query(`${PAYMENT_QUERY} WHERE p.Payment_id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ ok: false, message: "Payment not found." });

    return res.status(200).json({ ok: true, data: { payment: sanitizePayment(rows[0]) } });
  } catch (err) { next(err); }
};

// =============================
// 📖 READ BY ORDER
// =============================
export const getPaymentsByOrder = async (req, res, next) => {
  try {
    const orderId = Number(req.query.order_id);
    if (!orderId) return res.status(400).json({ ok: false, message: "Query parameter 'order_id' is required." });

    const [rows] = await pool.query(`${PAYMENT_QUERY} WHERE p.Order_id = ?`, [orderId]);
    return res.status(200).json({ ok: true, data: { payments: rows.map(sanitizePayment) } });
  } catch (err) { next(err); }
};

// =============================
// 📖 READ BY REQUEST
// =============================
export const getPaymentsByRequest = async (req, res, next) => {
  try {
    const requestId = Number(req.query.request_id);
    if (!requestId) return res.status(400).json({ ok: false, message: "Query parameter 'request_id' is required." });

    const [rows] = await pool.query(`${PAYMENT_QUERY} WHERE p.Request_id = ?`, [requestId]);
    return res.status(200).json({ ok: true, data: { payments: rows.map(sanitizePayment) } });
  } catch (err) { next(err); }
};

// =============================
// 📖 READ BY MENTORSHIP
// =============================
export const getPaymentsByMentorship = async (req, res, next) => {
  try {
    const mentorshipId = Number(req.query.mentorship_id);
    if (!mentorshipId) return res.status(400).json({ ok: false, message: "Query parameter 'mentorship_id' is required." });

    const [rows] = await pool.query(`${PAYMENT_QUERY} WHERE p.Mentorship_id = ?`, [mentorshipId]);
    return res.status(200).json({ ok: true, data: { payments: rows.map(sanitizePayment) } });
  } catch (err) { next(err); }
};

// =============================
// 📊 ANALYTICS (Admin Dashboard)
// =============================
export const getPaymentAnalytics = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) as totalTransactions,
        SUM(TotalAmount) as totalRevenue,
        SUM(PlatformCommissionAmount) as totalPlatformCommission,
        SUM(ArtisanAmount) as totalArtisanPayouts,
        SUM(CASE WHEN PaymentType = 'workshop' THEN TotalAmount ELSE 0 END) as workshopRevenue,
        SUM(CASE WHEN PaymentType = 'workshop' THEN PlatformCommissionAmount ELSE 0 END) as workshopCommission,
        SUM(CASE WHEN PaymentType = 'mentorship' THEN TotalAmount ELSE 0 END) as mentorshipRevenue,
        SUM(CASE WHEN PaymentType = 'mentorship' THEN PlatformCommissionAmount ELSE 0 END) as mentorshipCommission,
        SUM(CASE WHEN PaymentType = 'product' THEN TotalAmount ELSE 0 END) as productRevenue,
        SUM(CASE WHEN PaymentType = 'escrow' THEN TotalAmount ELSE 0 END) as escrowRevenue,
        SUM(CASE WHEN Status = 'Completed' THEN TotalAmount ELSE 0 END) as completedRevenue,
        SUM(CASE WHEN Status = 'Pending' THEN TotalAmount ELSE 0 END) as pendingRevenue
      FROM Payment
    `);

    // Monthly breakdown (last 6 months)
    const [monthly] = await pool.query(`
      SELECT 
        DATE_FORMAT(TransactionDate, '%Y-%m') as month,
        SUM(TotalAmount) as revenue,
        SUM(PlatformCommissionAmount) as commission,
        COUNT(*) as count
      FROM Payment
      WHERE TransactionDate >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(TransactionDate, '%Y-%m')
      ORDER BY month DESC
    `);

    return res.status(200).json({
      ok: true,
      data: {
        analytics: {
          ...rows[0],
          totalRevenue: Number(rows[0].totalRevenue || 0),
          totalPlatformCommission: Number(rows[0].totalPlatformCommission || 0),
          totalArtisanPayouts: Number(rows[0].totalArtisanPayouts || 0),
          workshopRevenue: Number(rows[0].workshopRevenue || 0),
          workshopCommission: Number(rows[0].workshopCommission || 0),
          mentorshipRevenue: Number(rows[0].mentorshipRevenue || 0),
          mentorshipCommission: Number(rows[0].mentorshipCommission || 0),
          productRevenue: Number(rows[0].productRevenue || 0),
          escrowRevenue: Number(rows[0].escrowRevenue || 0),
          completedRevenue: Number(rows[0].completedRevenue || 0),
          pendingRevenue: Number(rows[0].pendingRevenue || 0),
        },
        monthlyBreakdown: monthly.map(m => ({
          month: m.month,
          revenue: Number(m.revenue || 0),
          commission: Number(m.commission || 0),
          count: m.count,
        })),
      }
    });
  } catch (err) { next(err); }
};

// =============================
// ✏️ UPDATE PAYMENT
// =============================
export const updatePayment = async (req, res, next) => {
  try {
    const id = Number(req.query.id);

    if (!id) {
      return res.status(400).json({
        ok: false,
        message: "Query parameter 'id' is required."
      });
    }

    const { status, paymentMethod } = req.body;

    // Allow both old and new payment methods
    const allAllowedMethods = ["Cash", "Visa", "MasterCard", "PayPal", "COD", "Card"];

    if (paymentMethod && !allAllowedMethods.includes(paymentMethod)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid payment method."
      });
    }

    // ✅ only allow Completed or Failed
    if (status && !['completed', 'failed'].includes(status.toLowerCase())) {
      return res.status(400).json({
        ok: false,
        message: "Wrong status. Only 'Completed' or 'Failed' is allowed."
      });
    }

    // ✅ first fetch current payment
    const [rows] = await pool.query(
      "SELECT * FROM Payment WHERE Payment_id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        ok: false,
        message: "Payment not found."
      });
    }

    const current = rows[0];

    // ✅ block update if already completed
    if (current.Status === "Completed" && status?.toLowerCase() === 'completed') {
      return res.status(400).json({
        ok: false,
        message: "Payment is already completed and cannot be updated."
      });
    }

    // Build update for escrow fields when completing an escrow payment
    let escrowHeld = current.EscrowHeld;
    let escrowStatus = current.EscrowStatus;

    if (status?.toLowerCase() === 'completed' && current.PaymentType === 'escrow') {
      escrowHeld = Number(current.TotalAmount);
      escrowStatus = 'held';
    } else if (status?.toLowerCase() === 'failed' && current.PaymentType === 'escrow') {
      escrowHeld = 0;
      escrowStatus = 'refunded';
    }

    // ✅ update
    await pool.query(
      `UPDATE Payment SET 
        Status=COALESCE(?,Status), 
        PaymentMethod=COALESCE(?,PaymentMethod),
        EscrowHeld=?,
        EscrowStatus=?
       WHERE Payment_id=?`,
      [status, paymentMethod, escrowHeld, escrowStatus, id]
    );

    return getPaymentById(req, res, next);

  } catch (err) {
    next(err);
  }
};

// =============================
// 🗑️ DELETE PAYMENT
// =============================
export const deletePayment = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [result] = await pool.query("DELETE FROM Payment WHERE Payment_id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, message: "Payment not found." });

    return res.status(200).json({ ok: true, message: "Payment deleted successfully." });
  } catch (err) { next(err); }
};

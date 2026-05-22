import pool from "../../db/connection.js";

const sanitizePayment = (row) => {
  if (!row) return null;
  return {
    id: row.Payment_id,
    order_id: row.Order_id,
    request_id: row.Request_id,
    artisan_id: row.Artisan_id,
    mentorship_id: row.Mentorship_id || null,
    workshop_id: row.Workshop_id || null,
    totalAmount: row.TotalAmount,
    paymentMethod: row.PaymentMethod,
    transactionDate: row.TransactionDate,
    status: row.Status,
    paymentType: row.PaymentType || 'product',
    escrowHeld: row.EscrowHeld || 0,
    escrowReleased: row.EscrowReleased || 0,
    escrowStatus: row.EscrowStatus || 'none',
  };
};

// =============================
// 📋 GET ALL PAYMENTS
// =============================
export const getAllPayments = async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Payment ORDER BY TransactionDate DESC, Payment_id DESC");
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
      SELECT p.*, u.FName, u.LName FROM Payment p
      LEFT JOIN \`Order\` o ON p.Order_id = o.Order_id
      LEFT JOIN Request r ON p.Request_id = r.Request_id
      LEFT JOIN Buyer bOrd ON o.Buyer_id = bOrd.Buyer_id
      LEFT JOIN Buyer bReq ON r.Buyer_id = bReq.Buyer_id
      LEFT JOIN user u ON COALESCE(bOrd.Buyer_id, bReq.Buyer_id) = u.User_id
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
        OR u.FName LIKE ?
        OR u.LName LIKE ?
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
    const { order_id, request_id, artisan_id, mentorship_id, workshop_id, totalAmount, paymentMethod, status, paymentType } = req.body;

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

    // ✅ payment method validation
    const allowedMethods = ["Cash", "Visa", "MasterCard", "PayPal"];

    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid payment method."
      });
    }

    const finalStatus = status && ['Pending', 'Completed', 'Failed'].includes(status) ? status : 'Pending';

    // Determine payment type
    let type = paymentType || 'product';
    if (mentorship_id) type = 'mentorship';
    else if (workshop_id) type = 'workshop';
    else if (request_id && !order_id) type = 'escrow';

    const isEscrow = type === 'escrow';
    const amount = Number(totalAmount);

    // For escrow: if payment is completed at creation, funds go to EscrowHeld
    // If pending, escrow awaits payment completion
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
      `INSERT INTO Payment (Order_id, Request_id, Artisan_id, Mentorship_id, Workshop_id, TotalAmount, PaymentMethod, TransactionDate, Status, PaymentType, EscrowHeld, EscrowReleased, EscrowStatus) 
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_DATE, ?, ?, ?, ?, ?)`,
      [order_id || null, request_id || null, artisan_id || null, mentorship_id || null, workshop_id || null, totalAmount, paymentMethod, finalStatus, type, escrowHeld, escrowReleased, escrowStatus]
    );

    const [rows] = await pool.query(
      "SELECT * FROM Payment WHERE Payment_id = ?",
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
// 📖 READ BY BUYER (via Order or Request)
// =============================
export const getPaymentsByBuyer = async (req, res, next) => {
  try {
    const buyerId = Number(req.query.buyer_id);
    if (!buyerId) return res.status(400).json({ ok: false, message: "Query parameter 'buyer_id' is required." });

    const query = `
      SELECT p.* FROM Payment p
      LEFT JOIN \`Order\` o ON p.Order_id = o.Order_id
      LEFT JOIN Request r ON p.Request_id = r.Request_id
      WHERE o.Buyer_id = ? OR r.Buyer_id = ?
      ORDER BY p.TransactionDate DESC
    `;

    const [rows] = await pool.query(query, [buyerId, buyerId]);
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

    const [rows] = await pool.query("SELECT * FROM Payment WHERE Payment_id = ?", [id]);
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

    const [rows] = await pool.query("SELECT * FROM Payment WHERE Order_id = ?", [orderId]);
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

    const [rows] = await pool.query("SELECT * FROM Payment WHERE Request_id = ?", [requestId]);
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

    const [rows] = await pool.query("SELECT * FROM Payment WHERE Mentorship_id = ?", [mentorshipId]);
    return res.status(200).json({ ok: true, data: { payments: rows.map(sanitizePayment) } });
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

    const allowedMethods = ["Cash", "Visa", "MasterCard", "PayPal"];

    if (paymentMethod && !allowedMethods.includes(paymentMethod)) {
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

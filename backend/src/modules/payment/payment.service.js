import pool from "../../db/connection.js";

const sanitizePayment = (row) => {
  if (!row) return null;
  return {
    id: row.Payment_id,
    order_id: row.Order_id,
    request_id: row.Request_id,
    totalAmount: row.TotalAmount,
    paymentMethod: row.PaymentMethod,
    transactionDate: row.TransactionDate,
    status: row.Status,
  };
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
      SELECT * FROM Payment
      WHERE 
        Payment_id LIKE ?
        OR Order_id LIKE ?
        OR Request_id LIKE ?
        OR TotalAmount LIKE ?
        OR PaymentMethod LIKE ?
        OR TransactionDate LIKE ?
        OR Status LIKE ?
    `;

    const values = Array(7).fill(searchValue);

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

// CREATE
export const createPayment = async (req, res, next) => {
  try {
    const { order_id, request_id, totalAmount, paymentMethod, status } = req.body;

    if (!totalAmount || !paymentMethod) {
      return res.status(400).json({
        ok: false,
        message: "totalAmount and paymentMethod are required."
      });
    }

    if (!order_id && !request_id) {
      return res.status(400).json({
        ok: false,
        message: "Either order_id or request_id is required."
      });
    }

    // ✅ payment method validation here
    const allowedMethods = ["Cash", "Visa", "MasterCard", "PayPal"];

    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid payment method."
      });
    }

    const finalStatus = status && ['Pending', 'Completed', 'Failed'].includes(status) ? status : 'Pending';

    const [result] = await pool.query(
      "INSERT INTO Payment (Order_id, Request_id, TotalAmount, PaymentMethod, TransactionDate, Status) VALUES (?, ?, ?, ?, CURRENT_DATE, ?)",
      [order_id || null, request_id || null, totalAmount, paymentMethod, finalStatus]
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


// READ BY ID
export const getPaymentById = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [rows] = await pool.query("SELECT * FROM Payment WHERE Payment_id = ?", [id]);
    if (!rows.length) return res.status(404).json({ ok: false, message: "Payment not found." });

    return res.status(200).json({ ok: true, data: { payment: sanitizePayment(rows[0]) } });
  } catch (err) { next(err); }
};

// READ BY ORDER
export const getPaymentsByOrder = async (req, res, next) => {
  try {
    const orderId = Number(req.query.order_id);
    if (!orderId) return res.status(400).json({ ok: false, message: "Query parameter 'order_id' is required." });

    const [rows] = await pool.query("SELECT * FROM Payment WHERE Order_id = ?", [orderId]);
    return res.status(200).json({ ok: true, data: { payments: rows.map(sanitizePayment) } });
  } catch (err) { next(err); }
};

// READ BY REQUEST
export const getPaymentsByRequest = async (req, res, next) => {
  try {
    const requestId = Number(req.query.request_id);
    if (!requestId) return res.status(400).json({ ok: false, message: "Query parameter 'request_id' is required." });

    const [rows] = await pool.query("SELECT * FROM Payment WHERE Request_id = ?", [requestId]);
    return res.status(200).json({ ok: true, data: { payments: rows.map(sanitizePayment) } });
  } catch (err) { next(err); }
};

// update request
//---------------------------------------------------------------------------------
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

    // ✅ block update if already completed
    if (rows[0].Status == "Completed".toLowerCase()) {
      return res.status(400).json({
        ok: false,
        message: "Payment is already completed and cannot be updated."
      });
    }

    // ✅ update allowed only if pending
    await pool.query(
      "UPDATE Payment SET Status=COALESCE(?,Status), PaymentMethod=COALESCE(?,PaymentMethod) WHERE Payment_id=?",
      [status, paymentMethod, id]
    );

    return getPaymentById(req, res, next);

  } catch (err) {
    next(err);
  }
};
// DELETE
export const deletePayment = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [result] = await pool.query("DELETE FROM Payment WHERE Payment_id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, message: "Payment not found." });

    return res.status(200).json({ ok: true, message: "Payment deleted successfully." });
  } catch (err) { next(err); }
};

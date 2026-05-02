import pool from "../../db/connection.js";

const sanitizeOrder = (row) => {
  if (!row) return null;
  return {
    id: row.Order_id,
    buyer_id: row.Buyer_id,
    orderDate: row.OrderDate,
    deliveryAddress: row.DeliveryAddress,
    status: row.Status,
    buyerName: row.FName ? `${row.FName} ${row.LName}` : null,
    totalAmount: row.TotalAmount || 0,
  };
};

const ORDER_QUERY = `
  SELECT o.*, u.FName, u.LName, (SELECT TotalAmount FROM Payment WHERE Order_id = o.Order_id LIMIT 1) AS TotalAmount
  FROM \`Order\` o
  LEFT JOIN Buyer b ON o.Buyer_id = b.Buyer_id
  LEFT JOIN user u ON b.Buyer_id = u.User_id
`;


// =============================
// 🔍 SEARCH ORDERS (NEW)
// =============================
export const searchOrders = async (req, res, next) => {
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
      ${ORDER_QUERY}
      WHERE 
        o.Order_id LIKE ?
        OR o.Buyer_id LIKE ?
        OR o.OrderDate LIKE ?
        OR o.DeliveryAddress LIKE ?
        OR o.Status LIKE ?
        OR u.FName LIKE ?
        OR u.LName LIKE ?
    `;

    const values = Array(7).fill(searchValue);

    const [rows] = await pool.query(query, values);

    return res.status(200).json({
      ok: true,
      data: {
        orders: rows.map(sanitizeOrder)
      }
    });

  } catch (err) {
    next(err);
  }
};



// CREATE
export const createOrder = async (req, res, next) => {
  try {
    const { buyer_id, deliveryAddress } = req.body;
    if (!buyer_id) {
      return res.status(400).json({ ok: false, message: "buyer_id is required." });
    }

    const [result] = await pool.query(
      "INSERT INTO `Order` (Buyer_id, OrderDate, DeliveryAddress, Status) VALUES (?, CURRENT_DATE, ?, 'Pending')",
      [buyer_id, deliveryAddress || null]
    );

    const [rows] = await pool.query(`${ORDER_QUERY} WHERE o.Order_id = ?`, [result.insertId]);
    return res.status(201).json({ ok: true, data: { order: sanitizeOrder(rows[0]) } });
  } catch (err) { next(err); }
};

// READ ALL
export const getAllOrders = async (req, res, next) => {
  try {
    const [rows] = await pool.query(ORDER_QUERY);
    return res.status(200).json({ ok: true, data: { orders: rows.map(sanitizeOrder) } });
  } catch (err) { next(err); }
};

// READ BY ID
export const getOrderById = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [rows] = await pool.query(`${ORDER_QUERY} WHERE o.Order_id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ ok: false, message: "Order not found." });

    return res.status(200).json({ ok: true, data: { order: sanitizeOrder(rows[0]) } });
  } catch (err) { next(err); }
};

// READ BY BUYER
export const getOrdersByBuyer = async (req, res, next) => {
  try {
    const buyerId = Number(req.query.buyer_id);
    if (!buyerId) return res.status(400).json({ ok: false, message: "Query parameter 'buyer_id' is required." });

    const [rows] = await pool.query(`${ORDER_QUERY} WHERE o.Buyer_id = ?`, [buyerId]);
    return res.status(200).json({ ok: true, data: { orders: rows.map(sanitizeOrder) } });
  } catch (err) { next(err); }
};

// READ BY ARTISAN
export const getOrdersByArtisan = async (req, res, next) => {
  try {
    const artisanId = Number(req.query.artisan_id);
    if (!artisanId) return res.status(400).json({ ok: false, message: "Query parameter 'artisan_id' is required." });

    const query = `
      SELECT o.Order_id, o.Buyer_id, o.OrderDate, o.DeliveryAddress, o.Status, u.FName, u.LName, 
             oi.Item_id, oi.Quantity, mi.Price, (oi.Quantity * mi.Price) AS TotalAmount
      FROM \`Order\` o
      JOIN OrderItem oi ON o.Order_id = oi.Order_id
      JOIN MarketItem mi ON oi.Item_id = mi.Item_id
      LEFT JOIN Buyer b ON o.Buyer_id = b.Buyer_id
      LEFT JOIN user u ON b.Buyer_id = u.User_id
      WHERE mi.Artisan_id = ?
    `;

    const [rows] = await pool.query(query, [artisanId]);
    const orders = rows.map(row => ({
      id: row.Order_id,
      buyer_id: row.Buyer_id,
      orderDate: row.OrderDate,
      deliveryAddress: row.DeliveryAddress,
      status: row.Status,
      buyerName: row.FName ? `${row.FName} ${row.LName}` : null,
      totalAmount: row.TotalAmount || 0,
      item_id: row.Item_id
    }));

    return res.status(200).json({ ok: true, data: { orders } });
  } catch (err) { next(err); }
};

// UPDATE STATUS
export const updateOrder = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const { deliveryAddress, status } = req.body;
    await pool.query(
      "UPDATE `Order` SET DeliveryAddress=COALESCE(?,DeliveryAddress), Status=COALESCE(?,Status) WHERE Order_id=?",
      [deliveryAddress, status, id]
    );
    return getOrderById(req, res, next);
  } catch (err) { next(err); }
};

// DELETE
export const deleteOrder = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [result] = await pool.query("DELETE FROM `Order` WHERE Order_id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, message: "Order not found." });

    return res.status(200).json({ ok: true, message: "Order deleted successfully." });
  } catch (err) { next(err); }
};

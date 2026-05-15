import pool from "../../db/connection.js";

const sanitizeOrder = (row) => {
  if (!row) return null;
  return {
    id: row.Order_id,
    buyer_id: row.Buyer_id,
    orderDate: row.OrderDate,
    deliveryAddress: row.DeliveryAddress,
    phone: row.Phone,
    deliveryNotes: row.DeliveryNotes,
    status: row.Status,
    buyerName: row.BuyerFName ? `${row.BuyerFName} ${row.BuyerLName}` : null,
    buyerEmail: row.BuyerEmail || null,
    totalAmount: row.TotalAmount || 0,
    paymentStatus: row.PaymentStatus || null,
    paymentMethod: row.PaymentMethod || null,
  };
};

// Rich JOIN — buyer info + payment aggregate
const ORDER_QUERY = `
  SELECT o.*,
    u.FName AS BuyerFName, u.LName AS BuyerLName, u.Email AS BuyerEmail,
    p.TotalAmount, p.Status AS PaymentStatus, p.PaymentMethod
  FROM \`Order\` o
  LEFT JOIN Buyer b ON o.Buyer_id = b.Buyer_id
  LEFT JOIN user u ON b.Buyer_id = u.User_id
  LEFT JOIN Payment p ON p.Order_id = o.Order_id AND p.PaymentType = 'product'
`;


// =============================
// 📋 GET ALL ORDERS
// =============================
export const getAllOrders = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`${ORDER_QUERY} ORDER BY o.OrderDate DESC, o.Order_id DESC`);
    return res.status(200).json({ ok: true, data: { orders: rows.map(sanitizeOrder) } });
  } catch (err) { next(err); }
};


// =============================
// 🔍 SEARCH ORDERS
// =============================
export const searchOrders = async (req, res, next) => {
  try {
    const value = req.query.value;
    if (!value) return res.status(400).json({ ok: false, message: "Search value is required" });

    const searchValue = `%${value}%`;
    const query = `
      ${ORDER_QUERY}
      WHERE 
        o.Order_id LIKE ?
        OR o.Buyer_id LIKE ?
        OR o.OrderDate LIKE ?
        OR o.DeliveryAddress LIKE ?
        OR o.Phone LIKE ?
        OR o.Status LIKE ?
        OR u.FName LIKE ?
        OR u.LName LIKE ?
        OR p.PaymentMethod LIKE ?
      ORDER BY o.OrderDate DESC, o.Order_id DESC
    `;
    const values = Array(9).fill(searchValue);
    const [rows] = await pool.query(query, values);
    return res.status(200).json({ ok: true, data: { orders: rows.map(sanitizeOrder) } });
  } catch (err) { next(err); }
};


// =============================
// 📦 CREATE ORDER
// =============================
export const createOrder = async (req, res, next) => {
  try {
    // Accept BOTH field names for backward compat
    const { buyer_id, deliveryAddress, shippingAddress, phone, deliveryNotes } = req.body;
    if (!buyer_id) {
      return res.status(400).json({ ok: false, message: "buyer_id is required." });
    }

    const address = deliveryAddress || shippingAddress || null;

    const [result] = await pool.query(
      "INSERT INTO `Order` (Buyer_id, OrderDate, DeliveryAddress, Phone, DeliveryNotes, Status) VALUES (?, CURRENT_DATE, ?, ?, ?, 'Pending')",
      [buyer_id, address, phone || null, deliveryNotes || null]
    );

    const [rows] = await pool.query(`${ORDER_QUERY} WHERE o.Order_id = ?`, [result.insertId]);
    return res.status(201).json({ ok: true, data: { order: sanitizeOrder(rows[0]) } });
  } catch (err) { next(err); }
};


// =============================
// 📖 READ BY ID
// =============================
export const getOrderById = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [rows] = await pool.query(`${ORDER_QUERY} WHERE o.Order_id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ ok: false, message: "Order not found." });

    // Also fetch order items with product names
    const [items] = await pool.query(`
      SELECT oi.*, mi.Item AS itemName, mi.Price AS unitPrice, mi.Category AS itemCategory
      FROM OrderItem oi
      LEFT JOIN MarketItem mi ON oi.Item_id = mi.Item_id
      WHERE oi.Order_id = ?
    `, [id]);

    const order = sanitizeOrder(rows[0]);
    order.items = items.map(i => ({
      id: i.OrderItem_id,
      item_id: i.Item_id,
      quantity: i.Quantity,
      itemName: i.itemName,
      unitPrice: i.unitPrice,
      itemCategory: i.itemCategory,
    }));

    return res.status(200).json({ ok: true, data: { order } });
  } catch (err) { next(err); }
};


// =============================
// 📖 READ BY BUYER
// =============================
export const getOrdersByBuyer = async (req, res, next) => {
  try {
    const buyerId = Number(req.query.buyer_id);
    if (!buyerId) return res.status(400).json({ ok: false, message: "Query parameter 'buyer_id' is required." });

    const [rows] = await pool.query(`${ORDER_QUERY} WHERE o.Buyer_id = ? ORDER BY o.OrderDate DESC`, [buyerId]);
    return res.status(200).json({ ok: true, data: { orders: rows.map(sanitizeOrder) } });
  } catch (err) { next(err); }
};


// =============================
// 📖 READ BY ARTISAN
// =============================
export const getOrdersByArtisan = async (req, res, next) => {
  try {
    const artisanId = Number(req.query.artisan_id);
    if (!artisanId) return res.status(400).json({ ok: false, message: "Query parameter 'artisan_id' is required." });

    const query = `
      SELECT o.Order_id, o.Buyer_id, o.OrderDate, o.DeliveryAddress, o.Phone, o.DeliveryNotes, o.Status,
             u.FName AS BuyerFName, u.LName AS BuyerLName,
             oi.Item_id, oi.Quantity, mi.Price, mi.Item AS ItemName,
             (oi.Quantity * mi.Price) AS TotalAmount
      FROM \`Order\` o
      JOIN OrderItem oi ON o.Order_id = oi.Order_id
      JOIN MarketItem mi ON oi.Item_id = mi.Item_id
      LEFT JOIN Buyer b ON o.Buyer_id = b.Buyer_id
      LEFT JOIN user u ON b.Buyer_id = u.User_id
      WHERE mi.Artisan_id = ?
      ORDER BY o.OrderDate DESC
    `;

    const [rows] = await pool.query(query, [artisanId]);
    const orders = rows.map(row => ({
      id: row.Order_id,
      buyer_id: row.Buyer_id,
      orderDate: row.OrderDate,
      deliveryAddress: row.DeliveryAddress,
      phone: row.Phone,
      deliveryNotes: row.DeliveryNotes,
      status: row.Status,
      buyerName: row.BuyerFName ? `${row.BuyerFName} ${row.BuyerLName}` : null,
      totalAmount: row.TotalAmount || 0,
      item_id: row.Item_id,
      itemName: row.ItemName,
    }));

    return res.status(200).json({ ok: true, data: { orders } });
  } catch (err) { next(err); }
};


// =============================
// ✏️ UPDATE ORDER (with ownership + status logic)
// =============================
export const updateOrder = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const { deliveryAddress, shippingAddress, phone, deliveryNotes, status, buyer_id } = req.body;
    const address = deliveryAddress || shippingAddress;

    // Ownership validation for buyer edits (not for admin status changes)
    if (buyer_id) {
      const [existing] = await pool.query("SELECT Buyer_id, Status, OrderDate FROM `Order` WHERE Order_id = ?", [id]);
      if (!existing.length) return res.status(404).json({ ok: false, message: "Order not found." });
      if (existing[0].Buyer_id !== Number(buyer_id)) {
        return res.status(403).json({ ok: false, message: "You can only edit your own orders." });
      }
      // Business logic: buyer can only edit within 24 hours of order creation
      if (!status) {
        const orderTime = new Date(existing[0].OrderDate).getTime();
        const now = Date.now();
        const hoursSinceOrder = (now - orderTime) / (1000 * 60 * 60);
        if (hoursSinceOrder > 24) {
          return res.status(400).json({ ok: false, message: "Orders can only be edited within 24 hours of placement." });
        }
      }
    }

    await pool.query(
      "UPDATE `Order` SET DeliveryAddress=COALESCE(?,DeliveryAddress), Phone=COALESCE(?,Phone), DeliveryNotes=COALESCE(?,DeliveryNotes), Status=COALESCE(?,Status) WHERE Order_id=?",
      [address, phone, deliveryNotes, status, id]
    );
    return getOrderById(req, res, next);
  } catch (err) { next(err); }
};


// =============================
// 🗑️ DELETE ORDER
// =============================
export const deleteOrder = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [result] = await pool.query("DELETE FROM `Order` WHERE Order_id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, message: "Order not found." });

    return res.status(200).json({ ok: true, message: "Order deleted successfully." });
  } catch (err) { next(err); }
};

import pool from "../../db/connection.js";

const sanitizeOrderItem = (row) => {
  if (!row) return null;
  return {
    id: row.OrderItem_id,
    order_id: row.Order_id,
    item_id: row.Item_id,
    quantity: row.Quantity,
    itemName: row.Item || null,
    price: row.Price || null,
  };
};

const OI_QUERY = `
  SELECT oi.*, mi.Item, mi.Price
  FROM OrderItem oi
  LEFT JOIN MarketItem mi ON oi.Item_id = mi.Item_id
`;

// =============================
// 🔍 SEARCH ORDER ITEMS
// =============================
export const searchOrderItems = async (req, res, next) => {
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
      ${OI_QUERY}
      WHERE 
        oi.OrderItem_id LIKE ?
        OR oi.Order_id LIKE ?
        OR oi.Item_id LIKE ?
        OR oi.Quantity LIKE ?
        OR mi.Item LIKE ?
        OR mi.Price LIKE ?
    `;

    const values = Array(6).fill(searchValue);

    const [rows] = await pool.query(query, values);

    return res.status(200).json({
      ok: true,
      data: {
        orderItems: rows.map(sanitizeOrderItem)
      }
    });

  } catch (err) {
    next(err);
  }
};

// CREATE (add item to order)
export const createOrderItem = async (req, res, next) => {
  try {
    const { order_id, item_id, quantity } = req.body;
    if (!order_id || !item_id || !quantity) {
      return res.status(400).json({ ok: false, message: "order_id, item_id, and quantity are required." });
    }
    if (Number(quantity) < 1) {
      return res.status(400).json({ ok: false, message: "Quantity must be at least 1." });
    }

    const [result] = await pool.query(
      "INSERT INTO OrderItem (Order_id, Item_id, Quantity) VALUES (?, ?, ?)",
      [order_id, item_id, quantity]
    );

    // Decrement the available quantity in MarketItem
    await pool.query(
      "UPDATE MarketItem SET AvailQuantity = GREATEST(AvailQuantity - ?, 0) WHERE Item_id = ?",
      [quantity, item_id]
    );

    const [rows] = await pool.query(`${OI_QUERY} WHERE oi.OrderItem_id = ?`, [result.insertId]);
    return res.status(201).json({ ok: true, data: { orderItem: sanitizeOrderItem(rows[0]) } });
  } catch (err) { next(err); }
};

// READ BY ORDER
export const getOrderItemsByOrder = async (req, res, next) => {
  try {
    const orderId = Number(req.query.order_id);
    if (!orderId) return res.status(400).json({ ok: false, message: "Query parameter 'order_id' is required." });

    const [rows] = await pool.query(`${OI_QUERY} WHERE oi.Order_id = ?`, [orderId]);
    return res.status(200).json({ ok: true, data: { orderItems: rows.map(sanitizeOrderItem) } });
  } catch (err) { next(err); }
};

// DELETE
export const deleteOrderItem = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [result] = await pool.query("DELETE FROM OrderItem WHERE OrderItem_id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, message: "Order item not found." });

    return res.status(200).json({ ok: true, message: "Order item removed successfully." });
  } catch (err) { next(err); }
};

// UPDATE
export const updateOrderItem = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const { quantity } = req.body;
    if (!quantity) return res.status(400).json({ ok: false, message: "Field 'quantity' is required." });
    if (Number(quantity) < 1) {
      return res.status(400).json({ ok: false, message: "Quantity must be at least 1." });
    }

    const [result] = await pool.query(
      "UPDATE OrderItem SET Quantity = ? WHERE OrderItem_id = ?",
      [quantity, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, message: "Order item not found." });

    const [rows] = await pool.query(`${OI_QUERY} WHERE oi.OrderItem_id = ?`, [id]);
    return res.status(200).json({ ok: true, data: { orderItem: sanitizeOrderItem(rows[0]) } });
  } catch (err) { next(err); }
};
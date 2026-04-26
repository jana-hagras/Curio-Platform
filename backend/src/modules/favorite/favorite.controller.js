import { Router } from 'express';
import pool from '../../db/connection.js';

const router = Router();

router.get('/user', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ message: "user_id is required" });

        const [rows] = await pool.query(`
            SELECT f.Favorite_id, f.Buyer_id, m.*, u.FName as artisanFirstName, u.LName as artisanLastName
            FROM Favorite f
            JOIN MarketItem m ON f.Item_id = m.Item_id
            JOIN Artisan a ON m.Artisan_id = a.Artisan_id
            JOIN user u ON a.Artisan_id = u.User_id
            WHERE f.Buyer_id = ?
        `, [user_id]);

        const formatted = rows.map(r => ({
            favoriteId: r.Favorite_id,
            id: r.Item_id,
            item: r.Item,
            itemName: r.Item,
            description: r.Description,
            image: r.Image,
            availQuantity: r.AvailQuantity,
            price: r.Price,
            category: r.Category,
            artisan_id: r.Artisan_id,
            artisanName: `${r.artisanFirstName} ${r.artisanLastName}`,
        }));

        res.json({ favorites: formatted });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { user_id, item_id } = req.body;
        if (!user_id || !item_id) return res.status(400).json({ message: "user_id and item_id are required" });

        const [result] = await pool.query(
            'INSERT INTO Favorite (Buyer_id, Item_id, DateAdded) VALUES (?, ?, CURRENT_DATE)',
            [user_id, item_id]
        );
        res.status(201).json({ message: "Favorite added successfully", id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "Item is already in favorites" });
        }
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.delete('/', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ message: "id is required" });

        await pool.query('DELETE FROM Favorite WHERE Favorite_id = ?', [id]);
        res.json({ message: "Favorite removed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.delete('/item', async (req, res) => {
    try {
        const { user_id, item_id } = req.query;
        if (!user_id || !item_id) return res.status(400).json({ message: "user_id and item_id are required" });

        await pool.query('DELETE FROM Favorite WHERE Buyer_id = ? AND Item_id = ?', [user_id, item_id]);
        res.json({ message: "Favorite removed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

export default router;

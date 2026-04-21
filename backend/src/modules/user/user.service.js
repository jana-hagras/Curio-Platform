import pool from "../../db/connection.js";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;


// VALIDATION HELPERS


const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s\-()]{11}$/;
const NAME_RE = /^[A-Za-z\u0600-\u06FF\s'-]{2,50}$/;   
const URL_RE = /^https?:\/\/.+/i;

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

/**
 * Collect all validation errors and return them at once.
 * Returns null when everything is valid.
 */
const validateRegister = ({ fName, mName, lName, email, password, type, phone, address, country, bio }) => {
  const errors = [];

  // ── Required fields ──
  if (!fName || !fName.trim())
    errors.push("First name is required.");
  else if (!NAME_RE.test(fName.trim()))
    errors.push("First name must be 2-50 characters and contain only letters, spaces, hyphens, or apostrophes.");

  if (!lName || !lName.trim())
    errors.push("Last name is required.");
  else if (!NAME_RE.test(lName.trim()))
    errors.push("Last name must be 2-50 characters and contain only letters, spaces, hyphens, or apostrophes.");

  if (!email || !email.trim())
    errors.push("Email is required.");
  else if (!EMAIL_RE.test(email.trim()))
    errors.push("Email format is invalid.");

  if (!password)
    errors.push("Password is required.");
  else {
    if (password.length < 8)
      errors.push("Password must be at least 8 characters.");
    if (!/[A-Z]/.test(password))
      errors.push("Password must contain at least one uppercase letter.");
    if (!/[a-z]/.test(password))
      errors.push("Password must contain at least one lowercase letter.");
    if (!/\d/.test(password))
      errors.push("Password must contain at least one number.");
  }

  if (!type)
    errors.push("Type is required.");
  else if (!["Buyer", "Artisan"].includes(type))
    errors.push("Type must be 'Buyer' or 'Artisan'.");

  // ── Optional fields (validate only when provided) ──
  if (mName !== undefined && mName !== null && mName.trim() !== "" && !NAME_RE.test(mName.trim()))
    errors.push("Middle name must be 2-50 characters and contain only letters, spaces, hyphens, or apostrophes.");

  if (phone !== undefined && phone !== null && phone.trim() !== "" && !PHONE_RE.test(phone.trim()))
    errors.push("Phone format is invalid. Use digits, spaces, dashes, or parentheses (7-20 chars).");

  if (address !== undefined && address !== null && address.trim() !== "") {
    if (address.trim().length < 5)
      errors.push("Address must be at least 5 characters.");
    if (address.trim().length > 255)
      errors.push("Address must not exceed 255 characters.");
  }

  // ── Type-specific fields ──
  if (type === "Buyer") {
    if (country !== undefined && country !== null && country.trim() !== "" && country.trim().length > 100)
      errors.push("Country must not exceed 100 characters.");
  }

  if (type === "Artisan") {
    if (bio !== undefined && bio !== null && bio.trim() !== "" && bio.trim().length > 2000)
      errors.push("Bio must not exceed 2000 characters.");
  }

  return errors.length ? errors : null;
};

const validateLogin = ({ email, password }) => {
  const errors = [];

  if (!email || !email.trim())
    errors.push("Email is required.");
  else if (!EMAIL_RE.test(email.trim()))
    errors.push("Email format is invalid.");

  if (!password)
    errors.push("Password is required.");

  return errors.length ? errors : null;
};

const validateUpdate = ({ fName, mName, lName, phone, address, profileImage, country, bio, status }) => {
  const errors = [];

  if (fName !== undefined && fName !== null) {
    if (!fName.trim()) errors.push("First name cannot be empty.");
    else if (!NAME_RE.test(fName.trim())) errors.push("First name must be 2-50 characters and contain only letters, spaces, hyphens, or apostrophes.");
  }

  if (mName !== undefined && mName !== null && mName.trim() !== "" && !NAME_RE.test(mName.trim()))
    errors.push("Middle name must be 2-50 characters and contain only letters, spaces, hyphens, or apostrophes.");

  if (lName !== undefined && lName !== null) {
    if (!lName.trim()) errors.push("Last name cannot be empty.");
    else if (!NAME_RE.test(lName.trim())) errors.push("Last name must be 2-50 characters and contain only letters, spaces, hyphens, or apostrophes.");
  }

  if (phone !== undefined && phone !== null && phone.trim() !== "" && !PHONE_RE.test(phone.trim()))
    errors.push("Phone format is invalid.");

  if (address !== undefined && address !== null && address.trim() !== "") {
    if (address.trim().length < 5) errors.push("Address must be at least 5 characters.");
    if (address.trim().length > 255) errors.push("Address must not exceed 255 characters.");
  }

  if (profileImage !== undefined && profileImage !== null && profileImage.trim() !== "" && !URL_RE.test(profileImage.trim()))
    errors.push("Profile image must be a valid URL (http:// or https://).");

  if (country !== undefined && country !== null && country.trim() !== "" && country.trim().length > 100)
    errors.push("Country must not exceed 100 characters.");

  if (bio !== undefined && bio !== null && bio.trim() !== "" && bio.trim().length > 2000)
    errors.push("Bio must not exceed 2000 characters.");

  if (status !== undefined && status !== null && status.trim() !== "" && status.trim().length > 50)
    errors.push("Status must not exceed 50 characters.");

  return errors.length ? errors : null;
};

// ───────────────────────────────
// RESPONSE HELPER
// ───────────────────────────────

const sanitizeUser = (row) => {
  if (!row) return null;
  return {
    id: row.User_id,
    firstName: row.FName,
    middleName: row.MName,
    lastName: row.LName,
    email: row.Email,
    address: row.Address,
    phone: row.Phone,
    type: row.Type,
    joinDate: row.JoinDate,
    profileImage: row.ProfileImage,
    ...(row.Type === "Buyer" && { country: row.Country }),
    ...(row.Type === "Artisan" && {
      bio: row.Bio,
      status: row.Status,
      verified: !!row.Verified,
    }),
  };
};

// ----------------------------
// REGISTER
// ----------------------------
export const register = async (req, res, next) => {
  try {
    let { fName, mName, lName, email, password, type, phone, address, country, bio } = req.body;

    // ── Validate ──
    const errors = validateRegister({ fName, mName, lName, email, password, type, phone, address, country, bio });
    if (errors) return res.status(400).json({ ok: false, message: "Validation failed.", errors });

    email = normalizeEmail(email);

    const [existing] = await pool.query("SELECT User_id FROM user WHERE Email = ? LIMIT 1", [email]);
    if (existing.length) return res.status(409).json({ ok: false, message: "Email already exists." });

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Insert user
      const [userRes] = await conn.query(
        `INSERT INTO user (FName, MName, LName, Email, Password, Phone, Address, Type, JoinDate)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE)`,
        [fName.trim(), mName?.trim() || null, lName.trim(), email, hashedPassword, phone?.trim() || null, address?.trim() || null, type]
      );
      const userId = userRes.insertId;

      // Insert subtype
      if (type === "Buyer") {
        await conn.query("INSERT INTO Buyer (Buyer_id, Country) VALUES (?, ?)", [userId, country?.trim() || null]);
      } else {
        await conn.query("INSERT INTO Artisan (Artisan_id, Bio, Status) VALUES (?, ?, 'Active')", [userId, bio?.trim() || null]);
      }

      await conn.commit();
      return res.status(201).json({ ok: true, message: "Account created successfully.", data: { userId } });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    next(err);
  }
};

// ----------------------------
// LOGIN
// ----------------------------
export const login = async (req, res, next) => {
  try {
    let { email, password } = req.body;

    // Validate
    const errors = validateLogin({ email, password });
    if (errors) return res.status(400).json({ ok: false, message: "Validation failed.", errors });

    email = normalizeEmail(email);

    const query = `
      SELECT u.*, b.Country, a.Bio, a.Status, a.Verified
      FROM user u
      LEFT JOIN Buyer b ON u.User_id = b.Buyer_id
      LEFT JOIN Artisan a ON u.User_id = a.Artisan_id
      WHERE u.Email = ?
      LIMIT 1
    `;

    const [rows] = await pool.query(query, [email]);
    if (!rows.length) return res.status(401).json({ ok: false, message: "Invalid credentials." });

    const match = await bcrypt.compare(password, rows[0].Password);
    if (!match) return res.status(401).json({ ok: false, message: "Invalid credentials." });

    return res.status(200).json({ ok: true, message: "Logged in successfully.", data: { user: sanitizeUser(rows[0]) } });
  } catch (err) {
    next(err);
  }
};

// ----------------------------
// GET CURRENT USER
// ----------------------------
export const me = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (!userId) return res.status(400).json({ ok: false, message: "A valid user ID is required." });

    const query = `
      SELECT u.*, b.Country, a.Bio, a.Status, a.Verified
      FROM user u
      LEFT JOIN Buyer b ON u.User_id = b.Buyer_id
      LEFT JOIN Artisan a ON u.User_id = a.Artisan_id
      WHERE u.User_id = ?
    `;
    const [rows] = await pool.query(query, [userId]);
    if (!rows.length) return res.status(404).json({ ok: false, message: "User not found." });
    return res.status(200).json({ ok: true, data: { user: sanitizeUser(rows[0]) } });
  } catch (err) {
    next(err);
  }
};

// ----------------------------
// SEARCH USERS
// ----------------------------
export const searchUsers = async (req, res, next) => {
  try {
    const value = req.query.value;
    if (!value || !value.trim()) return res.status(400).json({ ok: false, message: "Search value is required." });

    const searchValue = `%${value.trim()}%`;
    const query = `
      SELECT u.*, b.Country, a.Bio, a.Status, a.Verified
      FROM user u
      LEFT JOIN Buyer b ON u.User_id = b.Buyer_id
      LEFT JOIN Artisan a ON u.User_id = a.Artisan_id
      WHERE u.FName LIKE ? OR u.MName LIKE ? OR u.LName LIKE ? OR u.Email LIKE ?
         OR u.Phone LIKE ? OR u.Address LIKE ? OR u.Type LIKE ? OR b.Country LIKE ?
         OR a.Bio LIKE ? OR a.Status LIKE ?
      ORDER BY u.User_id ASC
    `;
    const values = Array(10).fill(searchValue);
    const [rows] = await pool.query(query, values);

    return res.status(200).json({ ok: true, data: { users: rows.map(sanitizeUser) } });
  } catch (err) {
    next(err);
  }
};

// ----------------------------
// GET ALL USERS
// ----------------------------
export const getAllUsers = async (req, res, next) => {
  try {
    const query = `
      SELECT u.*, b.Country, a.Bio, a.Status, a.Verified
      FROM user u
      LEFT JOIN Buyer b ON u.User_id = b.Buyer_id
      LEFT JOIN Artisan a ON u.User_id = a.Artisan_id
      ORDER BY u.User_id ASC
    `;
    const [rows] = await pool.query(query);
    return res.status(200).json({ ok: true, data: { users: rows.map(sanitizeUser) } });
  } catch (err) {
    next(err);
  }
};

// ----------------------------
// GET USER BY ID
// ----------------------------
export const getUserById = async (req, res, next) => {
  try {
    const userId = Number(req.query.id);
    if (!userId) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const query = `
      SELECT u.*, b.Country, a.Bio, a.Status, a.Verified
      FROM user u
      LEFT JOIN Buyer b ON u.User_id = b.Buyer_id
      LEFT JOIN Artisan a ON u.User_id = a.Artisan_id
      WHERE u.User_id = ?
    `;
    const [rows] = await pool.query(query, [userId]);
    if (!rows.length) return res.status(404).json({ ok: false, message: "User not found." });

    return res.status(200).json({ ok: true, data: { user: sanitizeUser(rows[0]) } });
  } catch (err) {
    next(err);
  }
};

// ----------------------------
// UPDATE USER
// ----------------------------
export const updateUser = async (req, res, next) => {
  try {
    const userId = Number(req.query.id);
    if (!userId) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const { fName, mName, lName, address, phone, profileImage, country, bio, status } = req.body;

    // ── Validate ──
    const errors = validateUpdate({ fName, mName, lName, phone, address, profileImage, country, bio, status });
    if (errors) return res.status(400).json({ ok: false, message: "Validation failed.", errors });

    const [userRows] = await pool.query("SELECT Type FROM user WHERE User_id = ?", [userId]);
    if (!userRows.length) return res.status(404).json({ ok: false, message: "User not found." });

    const user = userRows[0];
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      await conn.query(
        `UPDATE user
         SET FName = COALESCE(?, FName),
             MName = COALESCE(?, MName),
             LName = COALESCE(?, LName),
             Address = COALESCE(?, Address),
             Phone = COALESCE(?, Phone),
             ProfileImage = COALESCE(?, ProfileImage)
         WHERE User_id = ?`,
        [fName?.trim() ?? null, mName?.trim() ?? null, lName?.trim() ?? null, address?.trim() ?? null, phone?.trim() ?? null, profileImage?.trim() ?? null, userId]
      );

      if (user.Type === "Buyer") {
        await conn.query("UPDATE Buyer SET Country = COALESCE(?, Country) WHERE Buyer_id = ?", [country?.trim() ?? null, userId]);
      } else {
        await conn.query("UPDATE Artisan SET Bio = COALESCE(?, Bio), Status = COALESCE(?, Status) WHERE Artisan_id = ?", [bio?.trim() ?? null, status?.trim() ?? null, userId]);
      }

      await conn.commit();
      return getUserById(req, res, next);
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (err) {
    next(err);
  }
};

// ----------------------------
// DELETE USER
// ----------------------------
export const deleteUser = async (req, res, next) => {
  try {
    const userId = Number(req.query.id);
    if (!userId) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [result] = await pool.query("DELETE FROM user WHERE User_id = ?", [userId]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, message: "User not found." });

    return res.status(200).json({ ok: true, message: "User deleted successfully." });
  } catch (err) {
    next(err);
  }
};
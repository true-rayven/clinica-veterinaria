const router  = require("express").Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const db      = require("../config/db");

// Generate 6-digit code
const genCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { full_name, email, phone_number, address, date_of_birth, username, password } = req.body;
  if (!full_name || !email || !phone_number || !username || !password)
    return res.status(400).json({ message: "All required fields must be filled" });
  if (password.length < 6 || password.length > 8)
    return res.status(400).json({ message: "Password must be 6–8 characters (R11)" });
  try {
    const [exists] = await db.query(
      "SELECT client_id FROM client WHERE email=? OR username=?", [email, username]
    );
    if (exists.length) return res.status(409).json({ message: "Email or username already in use" });

    const hash  = await bcrypt.hash(password, 10);
    const token = genCode();
    await db.query(
      `INSERT INTO client (full_name,email,phone_number,address,date_of_birth,username,password_hash,verify_token)
       VALUES (?,?,?,?,?,?,?,?)`,
      [full_name, email, phone_number, address, date_of_birth, username, hash, token]
    );
    // In production: send token via email/SMS (R10)
    res.status(201).json({ message: "Registered! Check email/SMS for verification code.", token });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/auth/verify
router.post("/verify", async (req, res) => {
  const { email, code } = req.body;
  const [rows] = await db.query(
    "SELECT * FROM client WHERE email=? AND verify_token=?", [email, code]
  );
  if (!rows.length) return res.status(400).json({ message: "Invalid or expired code" });
  await db.query("UPDATE client SET is_verified=1, verify_token=NULL WHERE email=?", [email]);
  res.json({ message: "Account verified! You can now log in." });
});

// POST /api/auth/login  (client)
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const [rows] = await db.query(
    "SELECT * FROM client WHERE username=? OR email=?", [username, username]
  );
  if (!rows.length) return res.status(401).json({ message: "Invalid credentials" });
  const user = rows[0];
  if (!user.is_verified) return res.status(403).json({ message: "Please verify your account first" });
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });
  const token = jwt.sign(
    { id: user.client_id, role: "client", name: user.full_name },
    process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN }
  );
  res.json({ token, user: { id: user.client_id, name: user.full_name, email: user.email, role: "client" } });
});

// POST /api/auth/admin/login
router.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await db.query("SELECT * FROM admin WHERE email=?", [email]);
  if (!rows.length) return res.status(401).json({ message: "Invalid credentials" });
  const admin = rows[0];
  const match = await bcrypt.compare(password, admin.password_hash);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });
  const token = jwt.sign(
    { id: admin.admin_id, role: "admin", name: admin.full_name },
    process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN }
  );
  res.json({ token, user: { id: admin.admin_id, name: admin.full_name, email: admin.email, role: "admin" } });
});

// POST /api/auth/forgot-password  (R13)
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const [rows] = await db.query("SELECT * FROM client WHERE email=?", [email]);
  if (!rows.length) return res.status(404).json({ message: "No account found with that email" });
  const code = genCode();
  await db.query("UPDATE client SET verify_token=? WHERE email=?", [code, email]);
  // In production: send reset link via email
  res.json({ message: "Reset code sent to your email.", code });
});

module.exports = router;

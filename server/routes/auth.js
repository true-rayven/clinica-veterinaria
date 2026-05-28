const router  = require("express").Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const db      = require("../config/db");
const nodemailer = require("nodemailer");

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    tls: { rejectUnauthorized: false }
  });
}

async function sendVerificationEmail(email, code, name) {
  await getTransporter().sendMail({
    from: `"Clinica Veterinaria de Figura" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Verification Code - Clinica Veterinaria de Figura",
    html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;"><div style="background:#8B0000;padding:24px;text-align:center;"><h1 style="color:white;margin:0;">Clinica Veterinaria de Figura</h1></div><div style="padding:32px;background:#fff;"><h2 style="color:#2C1F1F;">Hello, ${name}!</h2><p>Your verification code is:</p><div style="background:#F5F0F0;border-radius:10px;padding:24px;text-align:center;margin:20px 0;"><span style="font-size:36px;font-weight:bold;color:#8B0000;letter-spacing:10px;">${code}</span></div><p>Enter this code on the verification page to activate your account.</p><p style="color:#999;font-size:12px;">This code expires in 10 minutes.</p></div></div>`
  });
}

async function sendAppointmentEmail(email, name, subject, message) {
  await getTransporter().sendMail({
    from: `"Clinica Veterinaria de Figura" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${subject} - Clinica Veterinaria de Figura`,
    html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;"><div style="background:#8B0000;padding:24px;text-align:center;"><h1 style="color:white;margin:0;">Clinica Veterinaria de Figura</h1></div><div style="padding:32px;background:#fff;"><h2 style="color:#2C1F1F;">Hello, ${name}!</h2><p>${message}</p></div></div>`
  });
}

const genCode = () => Math.floor(100000 + Math.random() * 900000).toString();

router.post("/register", async (req, res) => {
  const { full_name, email, phone_number, address, date_of_birth, password } = req.body;
  if (!full_name || !email || !phone_number || !password)
    return res.status(400).json({ message: "All required fields must be filled" });
  if (password.length < 6 || password.length > 8)
    return res.status(400).json({ message: "Password must be 6-8 characters (R11)" });
  try {
    const [exists] = await db.query("SELECT client_id, is_verified FROM client WHERE email=?", [email]);
    if (exists.length) {
      if (exists[0].is_verified) {
        return res.status(409).json({ message: "Email already in use" });
      } else {
        await db.query("DELETE FROM client WHERE email=?", [email]);
      }
    }
    const hash  = await bcrypt.hash(password, 10);
    const token = genCode();
    await db.query(
      `INSERT INTO client (full_name,email,phone_number,address,date_of_birth,password_hash,verify_token) VALUES (?,?,?,?,?,?,?)`,
      [full_name, email, phone_number, address, date_of_birth, hash, token]
    );
    try {
      await sendVerificationEmail(email, token, full_name);
      res.status(201).json({ message: "Registered! Check your email for the verification code." });
    } catch (emailErr) {
      console.error("Email error:", emailErr.message);
      res.status(201).json({ message: "Registered! Use this code to verify:", token });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/verify", async (req, res) => {
  const { email, code } = req.body;
  const [rows] = await db.query("SELECT * FROM client WHERE email=? AND verify_token=?", [email, code]);
  if (!rows.length) return res.status(400).json({ message: "Invalid or expired code" });
  await db.query("UPDATE client SET is_verified=1, verify_token=NULL WHERE email=?", [email]);
  res.json({ message: "Account verified! You can now log in." });
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query("SELECT * FROM client WHERE email=?", [email]);
    if (!rows.length) return res.status(401).json({ message: "Incorrect email or password. Please try again." });
    const user = rows[0];
    if (!user.is_verified) return res.status(403).json({ message: "Please verify your account first." });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: "Incorrect email or password. Please try again." });
    const token = jwt.sign(
      { id: user.client_id, role: "client", name: user.full_name },
      process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({ token, user: { id: user.client_id, name: user.full_name, email: user.email, role: "client" } });
  } catch (err) {
    console.error("Client login error:", err.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query("SELECT * FROM admin WHERE email=?", [email]);
    if (!rows.length) return res.status(401).json({ message: "Invalid credentials" });
    const admin = rows[0];
    if (admin.locked_until && new Date() < new Date(admin.locked_until))
      return res.status(403).json({ message: "Account locked. Try again after 15 minutes." });
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      const attempts = (admin.failed_attempts || 0) + 1;
      if (attempts >= 3) {
        const lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        await db.query("UPDATE admin SET failed_attempts=?, locked_until=? WHERE email=?", [attempts, lockedUntil, email]);
        return res.status(403).json({ message: "Account locked after 3 failed attempts. Try again after 15 minutes." });
      }
      await db.query("UPDATE admin SET failed_attempts=? WHERE email=?", [attempts, email]);
      return res.status(401).json({ message: `Invalid credentials. ${3 - attempts} attempt(s) remaining.` });
    }
    await db.query("UPDATE admin SET failed_attempts=0, locked_until=NULL WHERE email=?", [email]);
    const token = jwt.sign(
      { id: admin.admin_id, role: admin.role, name: admin.full_name },
      process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({ token, user: { id: admin.admin_id, name: admin.full_name, email: admin.email, role: admin.role } });
  } catch (err) {
    console.error("Admin login error:", err.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

router.post("/admin/register", async (req, res) => {
  const { full_name, email, password, role } = req.body;
  if (!full_name || !email || !password)
    return res.status(400).json({ message: "All fields required" });
  try {
    const [exists] = await db.query("SELECT admin_id FROM admin WHERE email=?", [email]);
    if (exists.length) return res.status(409).json({ message: "Email already in use" });
    const hash = await bcrypt.hash(password, 10);
    await db.query("INSERT INTO admin (full_name, email, role, password_hash) VALUES (?,?,?,?)",
      [full_name, email, role || "admin", hash]);
    res.status(201).json({ message: "Admin account created successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  let [rows] = await db.query("SELECT * FROM client WHERE email=?", [email]);
  let isAdmin = false;
  if (!rows.length) {
    [rows] = await db.query("SELECT * FROM admin WHERE email=?", [email]);
    isAdmin = true;
  }
  if (!rows.length) return res.status(404).json({ message: "No account found with that email" });
  const code = genCode();
  if (isAdmin) {
    await db.query("UPDATE admin SET verify_token=? WHERE email=?", [code, email]);
  } else {
    await db.query("UPDATE client SET verify_token=? WHERE email=?", [code, email]);
  }
  try {
    await sendAppointmentEmail(email, rows[0].full_name, "Password Reset Code",
      `Your password reset code is: <strong style="font-size:24px;color:#8B0000;">${code}</strong><br><br>Do not share this code. It expires in 10 minutes.`
    );
    res.json({ message: "Reset code sent to your email." });
  } catch (err) {
    res.json({ message: "Reset code generated.", code });
  }
});

router.post("/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword)
    return res.status(400).json({ message: "All fields are required" });
  if (newPassword.length < 6 || newPassword.length > 8)
    return res.status(400).json({ message: "Password must be 6-8 characters (R11)" });
  let [rows] = await db.query("SELECT * FROM client WHERE email=? AND verify_token=?", [email, code]);
  let isAdmin = false;
  if (!rows.length) {
    [rows] = await db.query("SELECT * FROM admin WHERE email=? AND verify_token=?", [email, code]);
    isAdmin = true;
  }
  if (!rows.length) return res.status(400).json({ message: "Invalid or expired reset code" });
  const hash = await bcrypt.hash(newPassword, 10);
  if (isAdmin) {
    await db.query("UPDATE admin SET password_hash=?, verify_token=NULL WHERE email=?", [hash, email]);
  } else {
    await db.query("UPDATE client SET password_hash=?, verify_token=NULL WHERE email=?", [hash, email]);
  }
  res.json({ message: "Password reset successfully! You can now log in." });
});

module.exports = { router, sendAppointmentEmail };
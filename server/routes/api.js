const router = require("express").Router();
const db     = require("../config/db");
const { auth, adminOnly } = require("../middleware/auth");

// ── CLIENTS (R27) ─────────────────────────────────────────
router.get("/clients", auth, adminOnly, async (req, res) => {
  const [rows] = await db.query(
    "SELECT client_id,full_name,email,phone_number,address,date_of_birth,username,created_at FROM client"
  );
  res.json(rows);
});

router.get("/clients/me", auth, async (req, res) => {
  const [rows] = await db.query(
    "SELECT client_id,full_name,email,phone_number,address,date_of_birth,username FROM client WHERE client_id=?",
    [req.user.id]
  );
  res.json(rows[0] || {});
});

router.put("/clients/me", auth, async (req, res) => {
  const { full_name, phone_number, address } = req.body;
  await db.query(
    "UPDATE client SET full_name=?,phone_number=?,address=? WHERE client_id=?",
    [full_name, phone_number, address, req.user.id]
  );
  res.json({ message: "Profile updated" });
});

router.delete("/clients/:id", auth, adminOnly, async (req, res) => {
  await db.query("DELETE FROM client WHERE client_id=?", [req.params.id]);
  res.json({ message: "Client deleted" });
});

// ── PETS (R7) ─────────────────────────────────────────────
router.get("/pets", auth, async (req, res) => {
  const isAdmin = req.user.role === "admin" || req.user.role === "superadmin";
  const [rows] = isAdmin
    ? await db.query("SELECT p.*, c.full_name AS owner FROM pet p JOIN client c ON p.client_id=c.client_id")
    : await db.query("SELECT * FROM pet WHERE client_id=?", [req.user.id]);
  res.json(rows);
});

router.post("/pets", auth, async (req, res) => {
  const { pet_name, type, breed } = req.body;
  const [r] = await db.query(
    "INSERT INTO pet (client_id,pet_name,type,breed) VALUES (?,?,?,?)",
    [req.user.id, pet_name, type, breed]
  );
  res.status(201).json({ message: "Pet added", pet_id: r.insertId });
});

router.patch("/pets/:id/register", auth, adminOnly, async (req, res) => {
  await db.query("UPDATE pet SET registered_in_clinic=1 WHERE pet_id=?", [req.params.id]);
  res.json({ message: "Pet registered in clinic" });
});

// ── SERVICES ──────────────────────────────────────────────
router.get("/services", async (_req, res) => {
  const [rows] = await db.query("SELECT * FROM service");
  res.json(rows);
});

router.post("/services", auth, adminOnly, async (req, res) => {
  const { service_name, price, description } = req.body;
  const [r] = await db.query(
    "INSERT INTO service (service_name,price,description) VALUES (?,?,?)",
    [service_name, price, description]
  );
  res.status(201).json({ message: "Service added", service_id: r.insertId });
});

// ── NOTIFICATIONS (R15-R18) ───────────────────────────────
router.get("/notifications", auth, async (req, res) => {
  const isAdmin = req.user.role === "admin" || req.user.role === "superadmin";
  const [rows] = isAdmin
    ? await db.query("SELECT n.*,c.full_name FROM notification n LEFT JOIN client c ON n.client_id=c.client_id ORDER BY n.notif_id DESC LIMIT 50")
    : await db.query("SELECT * FROM notification WHERE client_id=? ORDER BY notif_id DESC", [req.user.id]);
  res.json(rows);
});

// ── BLACKOUT DATES (R2) ───────────────────────────────────
router.get("/blackouts", async (_req, res) => {
  const [rows] = await db.query("SELECT * FROM blackout_date ORDER BY blackout_date ASC");
  res.json(rows);
});

router.post("/blackouts", auth, adminOnly, async (req, res) => {
  const { blackout_date, reason } = req.body;
  await db.query(
    "INSERT INTO blackout_date (admin_id,blackout_date,reason) VALUES (?,?,?)",
    [req.user.id, blackout_date, reason]
  );
  res.status(201).json({ message: "Blackout date added" });
});

router.delete("/blackouts/:id", auth, adminOnly, async (req, res) => {
  await db.query("DELETE FROM blackout_date WHERE blackout_id=?", [req.params.id]);
  res.json({ message: "Blackout date removed" });
});

// ── REPORT (R25, R4) ──────────────────────────────────────
router.get("/report", auth, adminOnly, async (req, res) => {
  const { month, year } = req.query;
  let where = "";
  const params = [];
  if (month && year) {
    where = "WHERE a.appt_date LIKE ?";
    params.push(`${year}-${String(month).padStart(2,"0")}%`);
  }
  const [rows] = await db.query(`
    SELECT a.appointment_id, c.full_name AS client_name, p.pet_name, p.breed,
           a.appt_date, a.appt_time, a.reason_for_visit, a.status,
           GROUP_CONCAT(s.service_name SEPARATOR ', ') AS services
    FROM appointment a
    JOIN client c ON a.client_id=c.client_id
    JOIN pet    p ON a.pet_id=p.pet_id
    LEFT JOIN appointment_service aps ON a.appointment_id=aps.appointment_id
    LEFT JOIN service s ON aps.service_id=s.service_id
    ${where}
    GROUP BY a.appointment_id
    ORDER BY a.appt_date ASC, a.appt_time ASC
  `, params);
  res.json(rows);
});

// ── DASHBOARD STATS (admin) ───────────────────────────────
router.get("/dashboard", auth, adminOnly, async (req, res) => {
  const [[{ total }]]     = await db.query("SELECT COUNT(*) AS total FROM appointment WHERE appt_date=CURDATE()");
  const [[{ confirmed }]] = await db.query("SELECT COUNT(*) AS confirmed FROM appointment WHERE appt_date=CURDATE() AND status='confirmed'");
  const [[{ pending }]]   = await db.query("SELECT COUNT(*) AS pending FROM appointment WHERE appt_date=CURDATE() AND status='pending'");
  const [[{ cancelled }]] = await db.query("SELECT COUNT(*) AS cancelled FROM appointment WHERE appt_date=CURDATE() AND status='cancelled'");
  res.json({ today: total, confirmed, pending, cancelled });
});

// ── ADMIN MANAGEMENT (superadmin only) ───────────────────
router.get("/admins", auth, async (req, res) => {
  if (req.user.role !== "superadmin") return res.status(403).json({ message: "Forbidden" });
  const [rows] = await db.query("SELECT admin_id, full_name, email, role FROM admin");
  res.json(rows);
});

router.delete("/admins/:id", auth, async (req, res) => {
  if (req.user.role !== "superadmin") return res.status(403).json({ message: "Forbidden" });
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ message: "You cannot terminate yourself!" });
  }
  await db.query("DELETE FROM admin WHERE admin_id=?", [req.params.id]);
  res.json({ message: "Admin terminated" });
});

module.exports = router;
const router = require("express").Router();
const db     = require("../config/db");
const { auth, adminOnly } = require("../middleware/auth");

// GET /api/appointments — admin sees all, client sees own
router.get("/", auth, async (req, res) => {
  try {
    let rows;
    if (req.user.role === "admin") {
      [rows] = await db.query(`
        SELECT a.*, c.full_name AS client_name, p.pet_name, p.breed,
               GROUP_CONCAT(s.service_name SEPARATOR ', ') AS services
        FROM appointment a
        JOIN client c ON a.client_id = c.client_id
        JOIN pet    p ON a.pet_id    = p.pet_id
        LEFT JOIN appointment_service aps ON a.appointment_id = aps.appointment_id
        LEFT JOIN service s ON aps.service_id = s.service_id
        GROUP BY a.appointment_id
        ORDER BY a.appt_date DESC, a.appt_time ASC
      `);
    } else {
      [rows] = await db.query(`
        SELECT a.*, p.pet_name, p.breed,
               GROUP_CONCAT(s.service_name SEPARATOR ', ') AS services
        FROM appointment a
        JOIN pet p ON a.pet_id = p.pet_id
        LEFT JOIN appointment_service aps ON a.appointment_id = aps.appointment_id
        LEFT JOIN service s ON aps.service_id = s.service_id
        WHERE a.client_id = ?
        GROUP BY a.appointment_id
        ORDER BY a.appt_date DESC
      `, [req.user.id]);
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/appointments/available?date=YYYY-MM-DD
router.get("/available", async (req, res) => {
  const { date } = req.query;
  const slots = ["09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00"];
  try {
    // Check blackout
    const [blk] = await db.query(
      "SELECT * FROM blackout_date WHERE blackout_date=?", [date]
    );
    if (blk.length) return res.json({ blackout: true, slots: [] });

    const [booked] = await db.query(
      "SELECT appt_time FROM appointment WHERE appt_date=? AND status != 'cancelled'", [date]
    );
    const bookedTimes = booked.map(r => r.appt_time);
    const available = slots.map(t => ({ time: t, available: !bookedTimes.includes(t) }));
    res.json({ blackout: false, slots: available });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/appointments — book (R19, R20)
router.post("/", auth, async (req, res) => {
  const { pet_id, appt_date, appt_time, reason_for_visit, notif_preference, service_ids } = req.body;
  try {
    // Check slot still free
    const [taken] = await db.query(
      "SELECT * FROM appointment WHERE appt_date=? AND appt_time=? AND status != 'cancelled'",
      [appt_date, appt_time]
    );
    if (taken.length) return res.status(409).json({ message: "Slot already taken. Please choose another." });

    const [result] = await db.query(
      `INSERT INTO appointment (client_id,pet_id,appt_date,appt_time,reason_for_visit,notif_preference,status)
       VALUES (?,?,?,?,?,?,'pending')`,
      [req.user.id, pet_id, appt_date, appt_time, reason_for_visit, notif_preference || "both"]
    );
    const apptId = result.insertId;

    // Insert services (R20)
    if (service_ids?.length) {
      const vals = service_ids.map(sid => [apptId, sid]);
      await db.query("INSERT INTO appointment_service (appointment_id,service_id) VALUES ?", [vals]);
    }

    // Log notification (R15)
    await db.query(
      `INSERT INTO notification (appointment_id,client_id,type,channel,message,sent_at,status)
       VALUES (?,?,'confirmation',?,?,NOW(),'sent')`,
      [apptId, req.user.id, notif_preference || "both",
       `Appointment booked for ${appt_date} at ${appt_time}`]
    );

    res.status(201).json({ message: "Appointment booked!", appointment_id: apptId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/appointments/:id/status — admin update (R3)
router.patch("/:id/status", auth, adminOnly, async (req, res) => {
  const { status } = req.body;
  await db.query("UPDATE appointment SET status=? WHERE appointment_id=?", [status, req.params.id]);
  res.json({ message: "Status updated" });
});

// PATCH /api/appointments/:id/cancel — client cancel with 24hr check (R21)
router.patch("/:id/cancel", auth, async (req, res) => {
  const [rows] = await db.query(
    "SELECT * FROM appointment WHERE appointment_id=? AND client_id=?",
    [req.params.id, req.user.id]
  );
  if (!rows.length) return res.status(404).json({ message: "Appointment not found" });
  const appt = rows[0];
  const apptDateTime = new Date(`${appt.appt_date}T${appt.appt_time}`);
  const hoursUntil   = (apptDateTime - Date.now()) / 36e5;
  if (hoursUntil < 24)
    return res.status(400).json({ message: "Cancellations must be made at least 24 hours in advance (R21)" });
  await db.query("UPDATE appointment SET status='cancelled' WHERE appointment_id=?", [req.params.id]);
  await db.query(
    `INSERT INTO notification (appointment_id,client_id,type,channel,message,sent_at,status)
     VALUES (?,?,'cancellation','both',?,NOW(),'sent')`,
    [req.params.id, req.user.id, `Appointment on ${appt.appt_date} has been cancelled`]
  );
  res.json({ message: "Appointment cancelled" });
});

// PATCH /api/appointments/:id/reschedule (R21)
router.patch("/:id/reschedule", auth, async (req, res) => {
  const { appt_date, appt_time } = req.body;
  const [rows] = await db.query(
    "SELECT * FROM appointment WHERE appointment_id=? AND client_id=?",
    [req.params.id, req.user.id]
  );
  if (!rows.length) return res.status(404).json({ message: "Appointment not found" });
  const appt = rows[0];
  const apptDateTime = new Date(`${appt.appt_date}T${appt.appt_time}`);
  const hoursUntil   = (apptDateTime - Date.now()) / 36e5;
  if (hoursUntil < 24)
    return res.status(400).json({ message: "Reschedule must be at least 24 hours in advance (R21)" });
  await db.query(
    "UPDATE appointment SET appt_date=?, appt_time=?, status='pending' WHERE appointment_id=?",
    [appt_date, appt_time, req.params.id]
  );
  res.json({ message: "Appointment rescheduled" });
});

module.exports = router;

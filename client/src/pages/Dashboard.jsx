import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats]   = useState({ today:0, confirmed:0, pending:0, cancelled:0 });
  const [appts, setAppts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get("/api/dashboard"),
      axios.get("/api/appointments"),
    ]).then(([s, a]) => {
      setStats(s.data);
      const todayStr = new Date().toISOString().split("T")[0];
      setAppts(a.data.filter(a => a.appt_date === todayStr));
    }).finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("en-PH", { weekday:"long", year:"numeric", month:"long", day:"numeric" });

  const updateStatus = async (id, status) => {
    await axios.patch(`/api/appointments/${id}/status`, { status });
    setAppts(prev => prev.map(a => a.appointment_id === id ? {...a, status} : a));
  };

  if (loading) return <div className="spinner"/>;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.name}. Here's today's overview — {today}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Today's Appointments</div>
          <div className="stat-value">{stats.today}</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">Pending</div>
          <div className="stat-value">{stats.pending}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Confirmed</div>
          <div className="stat-value">{stats.confirmed}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Cancelled Today</div>
          <div className="stat-value">{stats.cancelled}</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-title">Today's Schedule</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th><th>Client</th><th>Pet</th><th>Services</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {appts.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-muted" style={{ padding:24 }}>No appointments today</td></tr>
                )}
                {appts.map(a => (
                  <tr key={a.appointment_id}>
                    <td style={{ fontWeight:600 }}>{a.appt_time}</td>
                    <td>{a.client_name}</td>
                    <td><div>{a.pet_name}</div><div className="text-muted">{a.breed}</div></td>
                    <td style={{ fontSize:12 }}>{a.services || "—"}</td>
                    <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                    <td>
                      {a.status === "pending" && (
                        <button className="btn btn-success btn-sm"
                          onClick={() => updateStatus(a.appointment_id, "confirmed")}>
                          Confirm
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <QuickControl/>
        </div>
      </div>
    </div>
  );
}

function QuickControl() {
  const [blackouts, setBlackouts] = useState([]);
  const [newDate, setNewDate]     = useState("");
  const [newReason, setNewReason] = useState("");

  useEffect(() => { axios.get("/api/blackouts").then(r => setBlackouts(r.data)); }, []);

  const addBlackout = async () => {
    if (!newDate) return;
    await axios.post("/api/blackouts", { blackout_date: newDate, reason: newReason });
    const r = await axios.get("/api/blackouts");
    setBlackouts(r.data); setNewDate(""); setNewReason("");
  };

  const removeBlackout = async id => {
    await axios.delete(`/api/blackouts/${id}`);
    setBlackouts(b => b.filter(x => x.blackout_id !== id));
  };

  return (
    <>
      <div className="card">
        <div className="card-title">Clinic Hours</div>
        <div style={{ fontSize:13 }}>
          <div className="flex-between mb-4"><span>Mon–Sat</span><strong>8:00 AM – 6:00 PM</strong></div>
          <div className="flex-between"><span>Sunday</span><strong style={{ color:"var(--muted)" }}>Closed</strong></div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Blackout Dates (R2)</div>
        {blackouts.map(b => (
          <div key={b.blackout_id} className="flex-between" style={{ marginBottom:8, fontSize:13 }}>
            <span>{b.blackout_date} — <span className="text-muted">{b.reason || "No reason"}</span></span>
            <button className="btn btn-danger btn-sm" onClick={() => removeBlackout(b.blackout_id)}>Remove</button>
          </div>
        ))}
        <div className="divider"/>
        <div className="form-grid" style={{ marginBottom:8 }}>
          <input className="form-input" type="date" value={newDate} onChange={e=>setNewDate(e.target.value)}/>
          <input className="form-input" placeholder="Reason" value={newReason} onChange={e=>setNewReason(e.target.value)}/>
        </div>
        <button className="btn btn-primary btn-sm" onClick={addBlackout}>+ Add Blackout Date</button>
      </div>

      <div className="card">
        <div className="card-title">Cancellation Policy (R21)</div>
        <div className="alert alert-info" style={{ margin:0 }}>
          Clients must cancel at least <strong>24 hours</strong> before their appointment. Enforced automatically.
        </div>
      </div>
    </>
  );
}
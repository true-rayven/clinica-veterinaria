import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats]   = useState({ today:0, confirmed:0, pending:0, cancelled:0 });
  const [appts, setAppts]   = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get("/api/dashboard"),
      axios.get("/api/appointments"),
    ]).then(([s, a]) => {
      setStats(s.data);
      const todayStr = new Date().toISOString().split("T")[0];
      setAppts(a.data.filter(a => a.appt_date === todayStr));
      setPending(a.data.filter(a => a.status === "pending"));
    }).finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("en-PH", { weekday:"long", year:"numeric", month:"long", day:"numeric" });

  const updateStatus = async (id, status) => {
    await axios.patch(`/api/appointments/${id}/status`, { status });
    setAppts(prev => prev.map(a => a.appointment_id === id ? {...a, status} : a));
    setPending(prev => prev.filter(a => a.appointment_id !== id));
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
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Today's Schedule */}
          <div className="card">
            <div className="card-title">Today's Schedule</div>
            {appts.length === 0
              ? <p className="text-muted" style={{ padding:"12px 0" }}>No appointments today</p>
              : appts.map(a => (
                <div key={a.appointment_id} className="appt-card-mobile">
                  <div className="appt-card-row">
                    <span className="appt-card-label">Time</span>
                    <span className="appt-card-value">{a.appt_time}</span>
                  </div>
                  <div className="appt-card-row">
                    <span className="appt-card-label">Client</span>
                    <span className="appt-card-value">{a.client_name}</span>
                  </div>
                  <div className="appt-card-row">
                    <span className="appt-card-label">Pet</span>
                    <span className="appt-card-value">{a.pet_name} <span className="text-muted">({a.breed})</span></span>
                  </div>
                  <div className="appt-card-row">
                    <span className="appt-card-label">Services</span>
                    <span className="appt-card-value">{a.services || "—"}</span>
                  </div>
                  <div className="appt-card-row">
                    <span className="appt-card-label">Status</span>
                    <span className={`badge badge-${a.status}`}>{a.status}</span>
                  </div>
                  {a.status === "pending" && (
                    <div className="appt-card-actions">
                      <button className="btn btn-success btn-sm"
                        onClick={() => updateStatus(a.appointment_id, "confirmed")}>
                        Confirm
                      </button>
                    </div>
                  )}
                </div>
              ))
            }
          </div>

          {/* Pending Appointments */}
          {pending.length > 0 && (
            <div className="card">
              <div className="card-title">
                🕐 Pending Appointments
                <span style={{ marginLeft:8, background:"var(--amber)", color:"#fff",
                  borderRadius:99, padding:"2px 10px", fontSize:12 }}>
                  {pending.length}
                </span>
              </div>
              {pending.map(a => (
                <div key={a.appointment_id} className="appt-card-mobile">
                  <div className="appt-card-row">
                    <span className="appt-card-label">Date</span>
                    <span className="appt-card-value">{a.appt_date}</span>
                  </div>
                  <div className="appt-card-row">
                    <span className="appt-card-label">Time</span>
                    <span className="appt-card-value">{a.appt_time || "—"}</span>
                  </div>
                  <div className="appt-card-row">
                    <span className="appt-card-label">Client</span>
                    <span className="appt-card-value">{a.client_name}</span>
                  </div>
                  <div className="appt-card-row">
                    <span className="appt-card-label">Pet</span>
                    <span className="appt-card-value">{a.pet_name} <span className="text-muted">({a.breed})</span></span>
                  </div>
                  <div className="appt-card-row">
                    <span className="appt-card-label">Services</span>
                    <span className="appt-card-value">{a.services || "—"}</span>
                  </div>
                  <div className="appt-card-actions">
                    <button className="btn btn-success btn-sm"
                      onClick={() => updateStatus(a.appointment_id, "confirmed")}>
                      ✓ Confirm
                    </button>
                    <button className="btn btn-danger btn-sm"
                      onClick={() => updateStatus(a.appointment_id, "cancelled")}>
                      ✕ Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
          <div className="flex-between" style={{ marginBottom:8 }}>
            <span>Mon–Sat</span><strong>8:00 AM – 6:00 PM</strong>
          </div>
          <div className="flex-between">
            <span>Sunday</span><strong style={{ color:"var(--muted)" }}>Closed</strong>
          </div>
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
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:8 }}>
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
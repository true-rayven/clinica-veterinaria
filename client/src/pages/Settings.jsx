import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user } = useAuth();
  const [form, setForm] = useState({ full_name:"", email:"", password:"", role:"admin" });
  const [admins, setAdmins] = useState([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadAdmins = () => {
    axios.get("/api/admins").then(r => setAdmins(r.data)).catch(() => {});
  };

  useEffect(() => { loadAdmins(); }, []);

  const submit = async () => {
    setMsg(""); setError(""); setLoading(true);
    try {
      await axios.post("/api/auth/admin/register", form);
      setMsg("Admin account created successfully!");
      setForm({ full_name:"", email:"", password:"", role:"admin" });
      loadAdmins();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create admin");
    } finally { setLoading(false); }
  };

  const terminate = async (id, name) => {
    if (!window.confirm(`Terminate ${name}? This cannot be undone.`)) return;
    try {
      await axios.delete(`/api/admins/${id}`);
      setMsg(`${name} has been terminated.`);
      loadAdmins();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to terminate admin");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Super Admin system settings</p>
      </div>

      <div className="two-col">
        <div className="card" style={{ maxWidth:500 }}>
          <div className="card-title">Create Admin Account</div>
          {msg   && <div className="alert alert-success">{msg}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={form.full_name}
              onChange={e=>setForm(f=>({...f,full_name:e.target.value}))}
              placeholder="Dr. Juan dela Cruz"/>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email}
              onChange={e=>setForm(f=>({...f,email:e.target.value}))}
              placeholder="admin@clinica.com"/>
          </div>
          <div className="form-group">
            <label className="form-label">Password (6-8 characters)</label>
            <input className="form-input" type="password" value={form.password}
              onChange={e=>setForm(f=>({...f,password:e.target.value}))}
              placeholder="••••••••"/>
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={form.role}
              onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? "Creating…" : "Create Admin Account"}
          </button>
        </div>

        <div className="card">
          <div className="card-title">Admin Accounts</div>
          {admins.length === 0 && <p className="text-muted">No admins found.</p>}
          {admins.map(a => (
            <div key={a.admin_id} className="flex-between" style={{
              padding:"12px 0", borderBottom:"1px solid var(--mid-gray)"
            }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div className="avatar" style={{ width:36, height:36, fontSize:13 }}>
                    {a.full_name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <strong>{a.full_name}</strong>
                    {a.admin_id === user?.id && (
                      <span style={{ fontSize:11, color:"var(--green)", marginLeft:6 }}>(You)</span>
                    )}
                    <div className="text-muted">{a.email}</div>
                  </div>
                </div>
              </div>
              <div className="flex-gap">
                <span className={`badge ${a.role==="superadmin"?"badge-confirmed":"badge-pending"}`}>
                  {a.role === "superadmin" ? "Super Admin" : "Admin"}
                </span>
                {a.admin_id !== user?.id && (
                  <button className="btn btn-danger btn-sm"
                    onClick={() => terminate(a.admin_id, a.full_name)}>
                    Terminate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
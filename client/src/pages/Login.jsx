import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

const LOGO = process.env.PUBLIC_URL + "/logo.jpg";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
    const url = isAdmin ? "/auth/admin/login" : "/auth/login";
      const payload = isAdmin
        ? { email: form.username, password: form.password }
        : { username: form.username, password: form.password };
      const { data } = await api.post(url, payload);
      login(data.token, data.user);
      navigate(data.user.role === "admin" ? "/dashboard" : "/home");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <img src={LOGO} alt="logo" onError={e=>e.target.style.display="none"}/>
        <h1>Clinica Veterinaria de Figura</h1>
        <p>Your trusted partner in pet care.<br/>Book appointments 24 / 7 with ease.</p>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <h2>Sign In</h2>
          <p>Enter your credentials to access the system</p>

          <div style={{ display:"flex", gap:8, marginBottom:20 }}>
            <button className={`btn ${!isAdmin?"btn-primary":"btn-outline"}`} style={{ flex:1 }}
              onClick={() => setIsAdmin(false)}>Client</button>
            <button className={`btn ${isAdmin?"btn-primary":"btn-outline"}`} style={{ flex:1 }}
              onClick={() => setIsAdmin(true)}>Admin</button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">{isAdmin ? "Email Address" : "Email or Username"}</label>
              <input className="form-input" name="username" value={form.username}
                onChange={handle} placeholder={isAdmin ? "admin@clinica.com" : "you@email.com or username"}
                required autoComplete="username"/>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" name="password" type="password" value={form.password}
                onChange={handle} placeholder="6–8 alphanumeric characters" required/>
            </div>
            <div style={{ textAlign:"right", marginBottom:16 }}>
              <Link to="/forgot-password" className="auth-link" style={{ fontSize:12 }}>Forgot password?</Link>
            </div>
            <button className="btn btn-primary" style={{ width:"100%", justifyContent:"center" }}
              type="submit" disabled={loading}>
              {loading ? "Signing in…" : "SIGN IN"}
            </button>
          </form>

          <div className="divider"/>
          <p className="text-center text-muted">
            Don't have an account?{" "}
            <Link to="/register" className="auth-link">Create one</Link>
          </p>
          <div className="alert alert-warning" style={{ marginTop:16 }}>
            After 3 failed attempts, your account will be locked (R12). Password: 6–8 chars (R11).
          </div>
        </div>
      </div>
    </div>
  );
}

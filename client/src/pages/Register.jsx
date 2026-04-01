import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const LOGO = process.env.PUBLIC_URL + "/logo.jpg";

// ── REGISTER ──────────────────────────────────────────────
export function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    full_name:"", email:"", phone_number:"", address:"",
    date_of_birth:"", username:"", password:"", confirm:""
  });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault(); setError("");
    if (form.password !== form.confirm) return setError("Passwords do not match");
    if (form.password.length < 6 || form.password.length > 8)
      return setError("Password must be 6–8 characters (R11)");
    setLoading(true);
    try {
      await axios.post("/api/auth/register", form);
      navigate(`/verify?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  const steps = ["Account Info", "Contact", "Password"];
  return (
    <div className="auth-page">
      <div className="auth-left">
        <img src={LOGO} alt="logo" onError={e=>e.target.style.display="none"}/>
        <h1>Create Account</h1>
        <p>Join Clinica Veterinaria de Figura and book appointments for your pets anytime.</p>
      </div>
      <div className="auth-right">
        <div className="auth-card" style={{ maxWidth:520 }}>
          <h2>Create Account</h2>
          <p>Fill in all required fields</p>

          <div className="steps" style={{ marginBottom:24 }}>
            {steps.map((st, i) => (
              <>
                <div style={{ display:"flex",flexDirection:"column",alignItems:"center" }}>
                  <div className={`step-dot ${i+1<step?"done":i+1===step?"active":""}`}>
                    {i+1 < step ? "✓" : i+1}
                  </div>
                  <span style={{ fontSize:10,color:"var(--muted)",marginTop:4 }}>{st}</span>
                </div>
                {i < steps.length-1 && <div className={`step-line ${i+1<step?"done":""}`}/>}
              </>
            ))}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={submit}>
            {step === 1 && (
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn:"1/-1" }}>
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" name="full_name" value={form.full_name}
                    onChange={handle} placeholder="Maria Santos" required/>
                </div>
                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input className="form-input" name="username" value={form.username}
                    onChange={handle} placeholder="mariasantos" required/>
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input className="form-input" name="date_of_birth" value={form.date_of_birth}
                    onChange={handle} placeholder="YYYY-MM-DD"/>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn:"1/-1" }}>
                  <label className="form-label">Email Address *</label>
                  <input className="form-input" name="email" type="email" value={form.email}
                    onChange={handle} placeholder="you@email.com" required/>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input className="form-input" name="phone_number" value={form.phone_number}
                    onChange={handle} placeholder="+63 912 345 6789" required/>
                </div>
                <div className="form-group">
                  <label className="form-label">Home Address</label>
                  <input className="form-input" name="address" value={form.address}
                    onChange={handle} placeholder="Street, City, Province"/>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Password * (6–8 chars)</label>
                  <input className="form-input" name="password" type="password" value={form.password}
                    onChange={handle} placeholder="••••••••" required/>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <input className="form-input" name="confirm" type="password" value={form.confirm}
                    onChange={handle} placeholder="••••••••" required/>
                </div>
                <div className="alert alert-info" style={{ gridColumn:"1/-1" }}>
                  A 6-digit verification code will be sent to your email/phone (R10)
                </div>
              </div>
            )}

            <div className="flex-gap" style={{ justifyContent:"flex-end", marginTop:16 }}>
              {step > 1 && (
                <button type="button" className="btn btn-outline" onClick={() => setStep(s=>s-1)}>
                  ← Back
                </button>
              )}
              {step < 3 ? (
                <button type="button" className="btn btn-primary" onClick={() => setStep(s=>s+1)}>
                  Continue →
                </button>
              ) : (
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Creating…" : "Create Account"}
                </button>
              )}
            </div>
          </form>

          <div className="divider"/>
          <p className="text-center text-muted">
            Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── VERIFY ────────────────────────────────────────────────
export function Verify() {
  const [code, setCode]   = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const email = new URLSearchParams(window.location.search).get("email") || "";

  const submit = async e => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      await axios.post("/api/auth/verify", { email, code });
      setSuccess("Account verified! Redirecting to login…");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid code");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <img src={LOGO} alt="logo" onError={e=>e.target.style.display="none"}/>
        <h1>Verify Account</h1>
        <p>Enter the 6-digit code sent to your email or phone number.</p>
      </div>
      <div className="auth-right">
        <div className="auth-card" style={{ textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>✉️</div>
          <h2>Check your inbox</h2>
          <p>We sent a verification code to <strong>{email}</strong></p>

          {error   && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={submit}>
            <div className="form-group" style={{ marginTop:20 }}>
              <label className="form-label" style={{ textAlign:"left" }}>Verification Code (R10)</label>
              <input className="form-input" value={code} onChange={e=>setCode(e.target.value)}
                placeholder="Enter 6-digit code" maxLength={6} required
                style={{ textAlign:"center", fontSize:22, letterSpacing:8 }}/>
            </div>
            <button className="btn btn-primary" style={{ width:"100%",justifyContent:"center",marginTop:8 }}
              type="submit" disabled={loading}>
              {loading ? "Verifying…" : "VERIFY & CONTINUE"}
            </button>
          </form>
          <p className="text-muted mt-4">
            Didn't receive a code?{" "}
            <span className="auth-link" onClick={() => alert("Resend feature — connect to backend")}>
              Resend Code
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

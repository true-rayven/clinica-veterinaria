import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const LOGO = process.env.PUBLIC_URL + "/logo.jpg";

export default function ForgotPassword() {
  const [email, setEmail]     = useState("");
  const [msg, setMsg]         = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault(); setError(""); setMsg(""); setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/forgot-password", { email });
      setMsg(data.message + (data.code ? ` (Dev mode code: ${data.code})` : ""));
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <img src={LOGO} alt="logo" onError={e => e.target.style.display="none"}/>
        <h1>Reset Password</h1>
        <p>Enter your email and we'll send you a reset link (R13).</p>
      </div>
      <div className="auth-right">
        <div className="auth-card" style={{ textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
          <h2>Forgot your password?</h2>
          <p>Enter the email address linked to your account.</p>

          {error && <div className="alert alert-error" style={{ textAlign:"left" }}>{error}</div>}
          {msg   && <div className="alert alert-success" style={{ textAlign:"left" }}>{msg}</div>}

          <form onSubmit={submit}>
            <div className="form-group" style={{ marginTop:20, textAlign:"left" }}>
              <label className="form-label">Email Address (R13)</label>
              <input className="form-input" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com" required/>
            </div>
            <button className="btn btn-primary"
              style={{ width:"100%", justifyContent:"center", marginTop:8 }}
              type="submit" disabled={loading}>
              {loading ? "Sending…" : "SEND RESET LINK"}
            </button>
          </form>
          <div className="divider"/>
          <Link to="/login" className="auth-link">← Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}

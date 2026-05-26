import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
const LOGO = process.env.PUBLIC_URL + "/logo.jpg";

export default function ForgotPassword() {
  const [step, setStep]       = useState(1);
  const [email, setEmail]     = useState("");
  const [code, setCode]       = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg]         = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const sendCode = async e => {
    e.preventDefault(); setError(""); setMsg(""); setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/forgot-password", { email });
      setMsg(data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  const resetPass = async e => {
    e.preventDefault(); setError(""); setMsg(""); setLoading(true);
    if (newPass !== confirm) {
      setError("Passwords do not match."); setLoading(false); return;
    }
    if (newPass.length < 6 || newPass.length > 8) {
      setError("Password must be 6–8 characters (R11)."); setLoading(false); return;
    }
    try {
      const { data } = await axios.post("/api/auth/reset-password", { email, code, newPassword: newPass });
      setMsg(data.message);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <img src={LOGO} alt="logo" onError={e => e.target.style.display="none"}/>
        <h1>Reset Password</h1>
        <p>Enter your email and we'll send you a reset code (R13).</p>
      </div>
      <div className="auth-right">
        <div className="auth-card" style={{ textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
          <h2>Forgot your password?</h2>

          {step === 1 && (
            <>
              <p>Enter the email address linked to your account.</p>
              {error && <div className="alert alert-error" style={{ textAlign:"left" }}>{error}</div>}
              {msg   && <div className="alert alert-success" style={{ textAlign:"left" }}>{msg}</div>}
              <form onSubmit={sendCode}>
                <div className="form-group" style={{ marginTop:20, textAlign:"left" }}>
                  <label className="form-label">Email Address (R13)</label>
                  <input className="form-input" type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@email.com" required/>
                </div>
                <button className="btn btn-primary"
                  style={{ width:"100%", justifyContent:"center", marginTop:8 }}
                  type="submit" disabled={loading}>
                  {loading ? "Sending…" : "SEND RESET CODE"}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <p>Enter the 6-digit code sent to <strong>{email}</strong> and your new password.</p>
              {error && <div className="alert alert-error" style={{ textAlign:"left" }}>{error}</div>}
              {msg   && <div className="alert alert-success" style={{ textAlign:"left" }}>{msg}</div>}
              <form onSubmit={resetPass}>
                <div className="form-group" style={{ marginTop:20, textAlign:"left" }}>
                  <label className="form-label">Reset Code</label>
                  <input className="form-input" type="text" value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="Enter 6-digit code" maxLength={6} required/>
                </div>
                <div className="form-group" style={{ textAlign:"left" }}>
                  <label className="form-label">New Password (6–8 characters)</label>
                  <input className="form-input" type="password" value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    placeholder="New password" required/>
                </div>
                <div className="form-group" style={{ textAlign:"left" }}>
                  <label className="form-label">Confirm New Password</label>
                  <input className="form-input" type="password" value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Confirm password" required/>
                </div>
                <button className="btn btn-primary"
                  style={{ width:"100%", justifyContent:"center", marginTop:8 }}
                  type="submit" disabled={loading}>
                  {loading ? "Resetting…" : "RESET PASSWORD"}
                </button>
                <button type="button" className="btn btn-outline"
                  style={{ width:"100%", justifyContent:"center", marginTop:8 }}
                  onClick={() => { setStep(1); setError(""); setMsg(""); }}>
                  ← Resend Code
                </button>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <div className="alert alert-success" style={{ textAlign:"left", marginTop:16 }}>
                ✅ Password reset successfully! You can now log in with your new password.
              </div>
              <Link to="/login" className="btn btn-primary"
                style={{ width:"100%", justifyContent:"center", marginTop:16, textDecoration:"none" }}>
                Go to Login
              </Link>
            </>
          )}

          <div className="divider"/>
          <Link to="/login" className="auth-link">← Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}
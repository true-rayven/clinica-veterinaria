import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Topbar from "./components/Topbar";
import Login from "./pages/Login";
import { Register, Verify } from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import {
  CalendarPage, BookAppointment, MyAppointments,
  ClientRecords, Notifications, Profile, Report, ClientHome
} from "./pages/Pages";
import "./index.css";

function ProtectedRoute({ children, adminOnly, superAdminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" style={{ marginTop:80 }}/>;
  if (!user) return <Navigate to="/login" replace/>;
  if (superAdminOnly && user.role !== "superadmin") return <Navigate to="/dashboard" replace/>;
  if (adminOnly && user.role !== "admin" && user.role !== "superadmin") return <Navigate to="/home" replace/>;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Topbar/>
      <main className="page-content">{children}</main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  const wrap = (el) => <AppLayout>{el}</AppLayout>;
  return (
    <Routes>
      <Route path="/login"           element={<Login/>}/>
      <Route path="/register"        element={<Register/>}/>
      <Route path="/verify"          element={<Verify/>}/>
      <Route path="/forgot-password" element={<ForgotPassword/>}/>

      <Route path="/dashboard"    element={<ProtectedRoute adminOnly>{wrap(<Dashboard/>)}</ProtectedRoute>}/>
      <Route path="/clients"      element={<ProtectedRoute adminOnly>{wrap(<ClientRecords/>)}</ProtectedRoute>}/>
      <Route path="/report"       element={<ProtectedRoute adminOnly>{wrap(<Report/>)}</ProtectedRoute>}/>
      <Route path="/settings"     element={<ProtectedRoute superAdminOnly>{wrap(<Settings/>)}</ProtectedRoute>}/>

      <Route path="/calendar"        element={<ProtectedRoute>{wrap(<CalendarPage/>)}</ProtectedRoute>}/>
      <Route path="/notifications"   element={<ProtectedRoute>{wrap(<Notifications/>)}</ProtectedRoute>}/>
      <Route path="/home"            element={<ProtectedRoute>{wrap(<ClientHome/>)}</ProtectedRoute>}/>
      <Route path="/book"            element={<ProtectedRoute>{wrap(<BookAppointment/>)}</ProtectedRoute>}/>
      <Route path="/my-appointments" element={<ProtectedRoute>{wrap(<MyAppointments/>)}</ProtectedRoute>}/>
      <Route path="/profile"         element={<ProtectedRoute>{wrap(<Profile/>)}</ProtectedRoute>}/>

      <Route path="/" element={
        <Navigate to={user?.role==="superadmin" || user?.role==="admin" ? "/dashboard" : user ? "/home" : "/login"} replace/>}/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  );
}

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes/>
        <button
          onClick={() => setDark(d => !d)}
          title="Toggle Dark Mode"
          style={{
            position: "fixed", bottom: 24, right: 24,
            width: 44, height: 44, borderRadius: "50%",
            background: dark ? "#f0eded" : "#1c1c1c",
            color: dark ? "#1c1c1c" : "#f0eded",
            border: "none", cursor: "pointer",
            fontSize: 20, display: "flex",
            alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
            zIndex: 9999, transition: "all 0.2s"
          }}
        >
          {dark ? "☀️" : "🌙"}
        </button>
      </BrowserRouter>
    </AuthProvider>
  );
}
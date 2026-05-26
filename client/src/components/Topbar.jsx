import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, Calendar, Users, Bell,
  FileText, Settings, Home, PlusCircle,
  ClipboardList, User, LogOut
} from "lucide-react";

const LOGO = process.env.PUBLIC_URL + "/logo.jpg";

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/login"); };
  const initials = user?.name?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() || "?";

  const adminLinks = [
    { to: "/dashboard",     label: "Dashboard",     icon: <LayoutDashboard size={15}/> },
    { to: "/calendar",      label: "Calendar",      icon: <Calendar size={15}/> },
    { to: "/clients",       label: "Clients",       icon: <Users size={15}/> },
    { to: "/notifications", label: "Notifications", icon: <Bell size={15}/> },
    { to: "/report",        label: "Report",        icon: <FileText size={15}/> },
    ...(user?.role === "superadmin" ? [{ to: "/settings", label: "Settings", icon: <Settings size={15}/> }] : []),
  ];

  const clientLinks = [
    { to: "/home",            label: "Home",         icon: <Home size={15}/> },
    { to: "/calendar",        label: "Calendar",     icon: <Calendar size={15}/> },
    { to: "/book",            label: "Book",         icon: <PlusCircle size={15}/> },
    { to: "/my-appointments", label: "Appointments", icon: <ClipboardList size={15}/> },
    { to: "/notifications",   label: "Notifs",       icon: <Bell size={15}/> },
    { to: "/profile",         label: "Profile",      icon: <User size={15}/> },
  ];

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const links = isAdmin ? adminLinks : clientLinks;
  const roleLabel = user?.role === "superadmin" ? "Super Admin"
    : user?.role === "admin" ? "Administrator"
    : "Client";

  return (
    <>
      {/* ── Top bar (desktop) ── */}
      <nav className="topbar">
        <div className="topbar-brand">
          <img src={LOGO} alt="Clinica logo" onError={e => e.target.style.display="none"}/>
          <div className="topbar-brand-text">
            <div className="topbar-brand-name">Clinica Veterinaria</div>
            <div className="topbar-brand-sub">de Figura</div>
          </div>
        </div>
        <div className="topbar-nav desktop-nav">
          {links.map(l => (
            <NavLink key={l.to} to={l.to}
              className={({ isActive }) => "nav-tab" + (isActive ? " active" : "")}>
              {l.icon}
              {l.label}
            </NavLink>
          ))}
        </div>
        <div className="topbar-user">
          <div style={{ textAlign:"right" }}>
            <div className="topbar-user-name">{user?.name}</div>
            <div className="topbar-user-role">{roleLabel}</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
            <div className="avatar">{initials}</div>
            <span style={{
              fontSize:8, fontWeight:700, color:"#fff",
              background:"rgba(255,255,255,0.25)",
              borderRadius:99, padding:"1px 6px",
              textTransform:"uppercase", letterSpacing:"0.5px",
              whiteSpace:"nowrap"
            }}>{roleLabel}</span>
          </div>
          <button className="btn btn-outline btn-sm"
            style={{ color:"#EF9A9A", borderColor:"rgba(255,255,255,0.3)", display:"flex", alignItems:"center", gap:6 }}
            onClick={handleLogout}>
            <LogOut size={14}/> Sign out
          </button>
        </div>
      </nav>

      {/* ── Bottom tab bar (mobile only) ── */}
      <nav className="bottom-nav">
        {links.map(l => (
          <NavLink key={l.to} to={l.to}
            className={({ isActive }) => "bottom-nav-tab" + (isActive ? " active" : "")}>
            <span className="bottom-nav-icon">{l.icon}</span>
            <span className="bottom-nav-label">{l.label}</span>
          </NavLink>
        ))}
        <button className="bottom-nav-tab" onClick={handleLogout}>
          <span className="bottom-nav-icon"><LogOut size={20}/></span>
          <span className="bottom-nav-label">Sign out</span>
        </button>
      </nav>
    </>
  );
}
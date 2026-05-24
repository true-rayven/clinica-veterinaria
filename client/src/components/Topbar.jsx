import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LOGO = process.env.PUBLIC_URL + "/logo.jpg";

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };
  const initials = user?.name?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() || "?";

  const adminLinks = [
    { to: "/dashboard",     label: "Dashboard" },
    { to: "/calendar",      label: "Calendar" },
    { to: "/clients",       label: "Clients" },
    { to: "/notifications", label: "Notifications" },
    { to: "/report",        label: "Report" },
    ...(user?.role === "superadmin" ? [{ to: "/settings", label: "Settings" }] : []),
  ];

  const clientLinks = [
    { to: "/home",            label: "Home" },
    { to: "/calendar",        label: "Calendar" },
    { to: "/book",            label: "Book" },
    { to: "/my-appointments", label: "My Appointments" },
    { to: "/notifications",   label: "Notifications" },
    { to: "/profile",         label: "Profile" },
  ];

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const links = isAdmin ? adminLinks : clientLinks;

  const roleLabel = user?.role === "superadmin" ? "Super Admin"
    : user?.role === "admin" ? "Administrator"
    : "Client";

  return (
    <nav className="topbar">
      <div className="topbar-brand">
        <img src={LOGO} alt="Clinica logo" onError={e => e.target.style.display="none"}/>
        <div className="topbar-brand-text">
          <div className="topbar-brand-name">Clinica Veterinaria</div>
          <div className="topbar-brand-sub">de Figura</div>
        </div>
      </div>

      <div className="topbar-nav">
        {links.map(l => (
          <NavLink key={l.to} to={l.to}
            className={({ isActive }) => "nav-tab" + (isActive ? " active" : "")}>
            {l.label}
          </NavLink>
        ))}
      </div>

      <div className="topbar-user">
        <div style={{ textAlign: "right" }}>
          <div className="topbar-user-name">{user?.name}</div>
          <div className="topbar-user-role">{roleLabel}</div>
        </div>
        <div className="avatar">{initials}</div>
        <button className="btn btn-outline btn-sm" style={{ color:"#EF9A9A", borderColor:"rgba(255,255,255,0.3)" }}
          onClick={handleLogout}>Sign out</button>
      </div>
    </nav>
  );
}
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Topbar from "./components/Topbar";
import Login from "./pages/Login";
import { Register, Verify } from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import {
  CalendarPage, BookAppointment, MyAppointments,
  ClientRecords, Notifications, Profile, Report, ClientHome
} from "./pages/Pages";
import "./index.css";

function ProtectedRoute({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" style={{ marginTop:80 }}/>;
  if (!user) return <Navigate to="/login" replace/>;
  if (adminOnly && user.role !== "admin") return <Navigate to="/home" replace/>;
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
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"          element={<Login/>}/>
      <Route path="/register"       element={<Register/>}/>
      <Route path="/verify"         element={<Verify/>}/>
      <Route path="/forgot-password" element={<ForgotPassword/>}/>

      {/* Admin */}
      <Route path="/dashboard" element={
        <ProtectedRoute adminOnly><AppLayout><Dashboard/></AppLayout></ProtectedRoute>}/>
      <Route path="/clients" element={
        <ProtectedRoute adminOnly><AppLayout><ClientRecords/></AppLayout></ProtectedRoute>}/>
      <Route path="/report" element={
        <ProtectedRoute adminOnly><AppLayout><Report/></AppLayout></ProtectedRoute>}/>
      <Route path="/settings" element={
        <ProtectedRoute adminOnly><AppLayout>
          <div className="page-header"><h1>Settings</h1><p>Admin system settings — coming soon</p></div>
        </AppLayout></ProtectedRoute>}/>

      {/* Shared */}
      <Route path="/calendar" element={
        <ProtectedRoute><AppLayout><CalendarPage/></AppLayout></ProtectedRoute>}/>
      <Route path="/notifications" element={
        <ProtectedRoute><AppLayout><Notifications/></AppLayout></ProtectedRoute>}/>

      {/* Client */}
      <Route path="/home" element={
        <ProtectedRoute><AppLayout><ClientHome/></AppLayout></ProtectedRoute>}/>
      <Route path="/book" element={
        <ProtectedRoute><AppLayout><BookAppointment/></AppLayout></ProtectedRoute>}/>
      <Route path="/my-appointments" element={
        <ProtectedRoute><AppLayout><MyAppointments/></AppLayout></ProtectedRoute>}/>
      <Route path="/profile" element={
        <ProtectedRoute><AppLayout><Profile/></AppLayout></ProtectedRoute>}/>

      {/* Default redirect */}
      <Route path="/" element={
        <Navigate to={user?.role==="admin" ? "/dashboard" : user ? "/home" : "/login"} replace/>}/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes/>
      </BrowserRouter>
    </AuthProvider>
  );
}

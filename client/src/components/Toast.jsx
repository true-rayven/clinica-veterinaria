import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const icons = {
    success: <CheckCircle size={16}/>,
    error:   <XCircle size={16}/>,
    warning: <AlertTriangle size={16}/>,
    info:    <Info size={16}/>,
  };

  const colors = {
    success: { bg:"var(--green-light)",  color:"var(--green)",  border:"#A5D6A7" },
    error:   { bg:"var(--red-light)",    color:"#C62828",       border:"#EF9A9A" },
    warning: { bg:"var(--amber-light)",  color:"var(--amber)",  border:"#FFCC80" },
    info:    { bg:"var(--blue-light)",   color:"var(--blue)",   border:"#90CAF9" },
  };

  const isMobile = window.innerWidth <= 768;

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div style={{
        position:"fixed", top:20,
        right: isMobile ? 10 : 20,
        left: isMobile ? 10 : "auto",
        display:"flex", flexDirection:"column", gap:10,
        zIndex:9999, pointerEvents:"none"
      }}>
        {toasts.map(t => {
          const c = colors[t.type] || colors.info;
          return (
            <div key={t.id} style={{
              padding:"12px 18px",
              borderRadius:"var(--radius)",
              fontSize:13, fontWeight:600,
              minWidth: isMobile ? "auto" : 260,
              maxWidth: isMobile ? "100%" : 360,
              boxShadow:"0 4px 16px rgba(0,0,0,0.15)",
              animation:"slideInRight 0.3s ease",
              pointerEvents:"auto",
              display:"flex", alignItems:"center", gap:8,
              background:c.bg, color:c.color,
              border:`1px solid ${c.border}`
            }}>
              {icons[t.type]}
              {t.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
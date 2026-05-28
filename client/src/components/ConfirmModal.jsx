import { AlertTriangle, HelpCircle } from "lucide-react";

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmLabel="Confirm", danger=false }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position:"fixed", inset:0,
      background:"rgba(0,0,0,0.5)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:2000, animation:"fadeIn 0.2s ease"
    }}>
      <div className="card" style={{ width:380, margin:0, animation:"scaleIn 0.25s ease" }}>
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{
            width:56, height:56, borderRadius:"50%",
            background: danger ? "var(--red-light)" : "var(--blue-light)",
            display:"flex", alignItems:"center", justifyContent:"center",
            margin:"0 auto 14px",
          }}>
            {danger
              ? <AlertTriangle size={26} color="#C62828"/>
              : <HelpCircle size={26} color="var(--blue)"/>
            }
          </div>
          <div className="card-title" style={{ margin:0, fontSize:16 }}>{title}</div>
          <p className="text-muted" style={{ marginTop:8, fontSize:13, lineHeight:1.6 }}>{message}</p>
        </div>
        <div className="flex-gap" style={{ justifyContent:"center" }}>
          <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
          <button
            className="btn btn-primary"
            style={danger ? { background:"#C62828", border:"none" } : {}}
            onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
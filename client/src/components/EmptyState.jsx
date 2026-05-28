export function EmptyState({ icon, title, message, action, actionLabel }) {
  return (
    <div style={{
      textAlign:"center",
      padding:"40px 20px",
      animation:"fadeInUp 0.3s ease"
    }}>
      <div style={{
        width:60, height:60, borderRadius:"50%",
        background:"var(--mid-gray)",
        display:"flex", alignItems:"center", justifyContent:"center",
        margin:"0 auto 14px", opacity:0.5
      }}>
        {icon}
      </div>
      <div style={{ fontSize:15, fontWeight:700, color:"var(--charcoal)", marginBottom:6 }}>
        {title}
      </div>
      {message && (
        <p className="text-muted" style={{ marginBottom:16, fontSize:13, lineHeight:1.6 }}>
          {message}
        </p>
      )}
      {action && (
        <button className="btn btn-primary btn-sm" onClick={action}>{actionLabel}</button>
      )}
    </div>
  );
}
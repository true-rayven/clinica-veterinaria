export function Skeleton({ width="100%", height=16, borderRadius=6, style={} }) {
  return (
    <div style={{
      width, height, borderRadius,
      background:"linear-gradient(90deg, var(--mid-gray) 25%, var(--off-white) 50%, var(--mid-gray) 75%)",
      backgroundSize:"200% 100%",
      animation:"shimmer 1.4s infinite",
      ...style
    }}/>
  );
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <Skeleton height={18} width="40%"/>
      <Skeleton height={13}/>
      <Skeleton height={13} width="80%"/>
      <Skeleton height={13} width="60%"/>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr>
      {[80, 100, 100, 60, 50].map((w,i) => (
        <td key={i} style={{ padding:"12px 14px" }}>
          <Skeleton height={13} width={`${w}%`}/>
        </td>
      ))}
    </tr>
  );
}
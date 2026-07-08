export function Ring({
  fraction,
  size = 132,
  thickness = 12,
  color = "#FFC72C",
  trackColor = "rgba(255,255,255,0.1)",
  innerBg = "var(--color-navy-light)",
  children,
}: {
  fraction: number;
  size?: number;
  thickness?: number;
  color?: string;
  trackColor?: string;
  innerBg?: string;
  children: React.ReactNode;
}) {
  const deg = Math.round(Math.min(1, Math.max(0, fraction)) * 360);
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} 0deg ${deg}deg, ${trackColor} ${deg}deg 360deg)`,
      }}
    >
      <div
        className="flex flex-col items-center justify-center rounded-full"
        style={{ width: size - thickness * 2, height: size - thickness * 2, background: innerBg }}
      >
        {children}
      </div>
    </div>
  );
}

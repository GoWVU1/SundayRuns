export function Ring({
  fraction,
  size = 132,
  thickness = 12,
  children,
}: {
  fraction: number;
  size?: number;
  thickness?: number;
  children: React.ReactNode;
}) {
  const deg = Math.round(Math.min(1, Math.max(0, fraction)) * 360);
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(#FFC72C 0deg ${deg}deg, rgba(255,255,255,0.1) ${deg}deg 360deg)`,
      }}
    >
      <div
        className="flex flex-col items-center justify-center rounded-full bg-navy-light"
        style={{ width: size - thickness * 2, height: size - thickness * 2 }}
      >
        {children}
      </div>
    </div>
  );
}

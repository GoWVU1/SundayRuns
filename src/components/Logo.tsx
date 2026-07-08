export function Logo({ size = 168 }: { size?: number }) {
  const scale = size / 176;
  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 176,
          height: 176,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <div className="relative flex h-[176px] w-[176px] items-center justify-center overflow-hidden rounded-full border-4 border-gold bg-navy shadow-[0_6px_20px_rgba(4,30,66,0.2)]">
          <div className="absolute -bottom-[3px] -left-[22px] h-[110px] w-[220px] rounded-t-[110px] border-t-[3px] border-gold/35" />
          <div className="relative flex items-center">
            <span className="font-display text-[96px] leading-none text-gold">S</span>
            <span className="-ml-[22px] font-display text-[96px] leading-none text-cream">R</span>
          </div>
          <span className="absolute top-[30px] font-display text-[10px] tracking-[4px] text-gold">SUNDAY RUNS</span>
          <span className="absolute bottom-6 text-[9px] font-bold tracking-[2px] text-muted-navy">EST. 2019</span>
        </div>
      </div>
    </div>
  );
}

export function HeaderMark() {
  return (
    <div className="flex items-center leading-none">
      <span className="font-display text-[30px] text-gold">S</span>
      <span className="-ml-1.5 font-display text-[30px] text-cream">R</span>
    </div>
  );
}

export function AvatarBadge({ initials, isChampion = false }: { initials?: string; isChampion?: boolean }) {
  return (
    <div className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-gold bg-navy-light leading-none">
      {initials ? (
        <span className="font-display text-sm text-gold">{initials}</span>
      ) : (
        <>
          <span className="font-display text-sm text-gold">S</span>
          <span className="-ml-[3px] font-display text-sm text-cream">R</span>
        </>
      )}
      {isChampion && (
        <div className="absolute -top-[7px] left-1/2 flex h-[15px] w-[18px] -translate-x-1/2 items-center justify-center rounded-[4px] bg-navy">
          <svg width="13" height="11" viewBox="0 0 24 20">
            <path
              d="M2 18L2 7L7.5 11.5L12 3L16.5 11.5L22 7L22 18Z"
              fill="#FFC72C"
              stroke="#041E42"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

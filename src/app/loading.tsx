export default function Loading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-cream" role="status" aria-live="polite">
      <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded-full border-[3px] border-gold bg-navy">
        <span className="font-display text-xl tracking-wide text-gold">SR</span>
      </div>
      <span className="text-[10px] font-extrabold tracking-[3px] text-muted">LOADING…</span>
    </div>
  );
}

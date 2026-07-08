export function StreakBadge({ count }: { count: number }) {
  if (count < 2) return null;
  return (
    <span
      className="flex flex-shrink-0 items-center gap-[3px] rounded-full bg-gold/20 px-[7px] py-[3px]"
      title={`${count}-week attendance streak`}
    >
      <svg width="10" height="12" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M6 0C6 2.2 3 3.8 3 7.5C3 9.9 4.3 12 6 12C7.7 12 9 9.9 9 7.5C9 6.1 8.3 5 7.6 4.3C7.75 5.5 7.05 6.05 6.5 5.6C7.2 3.2 6 1.6 6 0Z"
          fill="#FFC72C"
        />
      </svg>
      <span className="text-[9px] font-extrabold text-[#8a6a00]">{count}</span>
    </span>
  );
}

import Link from "next/link";

export function BottomNav({
  items,
}: {
  items: { label: string; href: string; active: boolean }[];
}) {
  return (
    <div className="flex flex-shrink-0 border-t border-gold/20 bg-navy">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="flex-1 py-3 pb-2.5 text-center">
          <span
            className={`block font-display text-xs tracking-wide ${
              item.active ? "text-gold" : "text-cream/50"
            }`}
          >
            {item.label}
          </span>
        </Link>
      ))}
    </div>
  );
}

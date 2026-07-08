import { InputHTMLAttributes } from "react";

export function Field({
  label,
  name,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={name} className="text-[10px] font-extrabold tracking-[2px] text-muted">
        {label}
      </label>
      <input
        id={name}
        name={name}
        className="w-full rounded-[10px] border border-navy/20 bg-card px-3.5 py-3 text-[15px] text-navy outline-none focus:border-navy/50"
        {...props}
      />
    </div>
  );
}

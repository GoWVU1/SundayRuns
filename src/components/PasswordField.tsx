"use client";

import { useState, type InputHTMLAttributes } from "react";

export function PasswordField({
  label,
  name,
  className = "",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string; name: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={name} className="text-[10px] font-extrabold tracking-[2px] text-muted">
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          className="w-full rounded-[10px] border border-navy/20 bg-card px-3.5 py-3 pr-14 text-[15px] text-navy outline-none focus:border-navy/50"
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-extrabold tracking-wide text-muted"
        >
          {visible ? "HIDE" : "SHOW"}
        </button>
      </div>
    </div>
  );
}

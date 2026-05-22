"use client";

import { useEffect, useState } from "react";

const dias = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

export function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  if (!now) return <span className={className}>—</span>;

  const dia = dias[now.getDay()];
  const d = String(now.getDate()).padStart(2, "0");
  const m = meses[now.getMonth()];
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");

  return (
    <span className={className}>
      <span className="text-primary">●</span> {dia}{" "}
      <span className="opacity-50">·</span> {d} {m}{" "}
      <span className="opacity-50">·</span> {hh}:{mm}
    </span>
  );
}

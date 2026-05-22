import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
}

export function Logo({ className, showText = true, size = 32 }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/icon.png"
        alt="Quita aí"
        width={size}
        height={size}
        priority
        className="shrink-0 rounded-lg"
        style={{ width: size, height: size }}
      />
      {showText && (
        <div className="flex items-baseline gap-1.5 leading-none">
          <span className="text-xl font-bold tracking-tight">Quita</span>
          <span className="text-xl font-bold tracking-tight text-primary italic">
            aí
          </span>
        </div>
      )}
    </div>
  );
}

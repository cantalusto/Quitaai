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
        className="shrink-0 rounded-xl"
        style={{ width: size, height: size }}
      />
      {showText && (
        <span className="text-base font-medium tracking-tight lowercase">
          quita<span className="text-primary">.aí</span>
        </span>
      )}
    </div>
  );
}

import Image from "next/image";
import { cn } from "@/lib/utils";

export interface BrandLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export function BrandLogo({
  size = 32,
  className,
  showText = true,
  textClassName,
}: BrandLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <div
        className="relative overflow-hidden rounded-[8px] shrink-0 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Light theme logo */}
        <Image
          src="/logo_light_mode.png"
          alt="ChatSense Logo"
          width={size * 2}
          height={size * 2}
          priority
          className="dark:hidden block object-contain w-full h-full"
        />
        {/* Dark theme logo */}
        <Image
          src="/logo_dark_mode.png"
          alt="ChatSense Logo"
          width={size * 2}
          height={size * 2}
          priority
          className="hidden dark:block object-contain w-full h-full"
        />
      </div>

      {showText && (
        <span
          className={cn(
            "font-heading font-bold tracking-tight text-[var(--foreground)]",
            textClassName || "text-lg"
          )}
        >
          ChatSense
        </span>
      )}
    </div>
  );
}

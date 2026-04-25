import type { ReactNode } from "react";
import { GOLDMIND_AI_LOGO_SRC, GOLDMIND_APP_NAME, GOLDMIND_BRAND_NAME_IMAGE_SRC } from "@/lib/company";
import { cn } from "@/lib/utils";

const logoSizes = {
  xs: "h-9 w-9",
  sm: "h-11 w-11",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-20 w-20",
} as const;

export type GoldMindLogoSize = keyof typeof logoSizes;

export function GoldMindLogoMark({ size = "md", className }: { size?: GoldMindLogoSize; className?: string }) {
  return (
    <img
      src={GOLDMIND_AI_LOGO_SRC}
      alt={`${GOLDMIND_APP_NAME} logo`}
      className={cn("shrink-0 object-contain", logoSizes[size], className)}
      width={512}
      height={512}
      decoding="async"
    />
  );
}

export function GoldMindBrandLockup({
  size = "md",
  showName = true,
  subtitle,
  className,
  nameClassName,
}: {
  size?: GoldMindLogoSize;
  showName?: boolean;
  subtitle?: ReactNode;
  className?: string;
  nameClassName?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <GoldMindLogoMark size={size} />
      {showName && (
        <div className="min-w-0">
          <img
            src={GOLDMIND_BRAND_NAME_IMAGE_SRC}
            alt={GOLDMIND_APP_NAME}
            className={cn(
              "h-12 w-auto max-w-full object-contain",
              size === "xs" ? "h-8" : size === "sm" ? "h-9" : size === "md" ? "h-10" : size === "lg" ? "h-12" : "h-14",
              nameClassName,
            )}
            width={800}
            height={250}
            decoding="async"
          />
          {subtitle ? <div className="mt-0.5">{subtitle}</div> : null}
        </div>
      )}
    </div>
  );
}

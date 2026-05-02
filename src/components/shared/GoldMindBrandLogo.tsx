import type { ReactNode } from "react";
import {
  GOLDMIND_AI_LOGO_SRC,
  GOLDMIND_APP_NAME,
  GOLDMIND_BRAND_NAME_IMAGE_SRC,
  GOLDMIND_PUBLIC_TAGLINE,
} from "@/lib/company";
import { cn } from "@/lib/utils";

/** Text wordmark for public nav - AI mark image + gradient “Gold” / “Mind”. */
export function GoldMindNavbarWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5 sm:gap-3", className)}>
      <img
        src={GOLDMIND_AI_LOGO_SRC}
        alt=""
        className="h-10 w-10 shrink-0 rounded-xl object-contain shadow-sm ring-1 ring-violet-200/70 sm:h-11 sm:w-11"
        width={512}
        height={512}
        decoding="async"
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex flex-wrap items-baseline gap-x-0 drop-shadow-sm">
          <span className="inline-block bg-gradient-to-r from-amber-400 via-amber-500 to-orange-600 bg-clip-text font-extrabold tracking-tight text-[1.35rem] leading-none text-transparent sm:text-[1.55rem]">
            Gold
          </span>
          <span className="inline-block bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-700 bg-clip-text font-extrabold tracking-tight text-[1.35rem] leading-none text-transparent sm:text-[1.55rem]">
            Mind
          </span>
        </div>
        <p className="hidden font-medium leading-snug tracking-wide text-violet-950/85 sm:block sm:text-[0.62rem]">
          {GOLDMIND_PUBLIC_TAGLINE}
        </p>
      </div>
    </div>
  );
}

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

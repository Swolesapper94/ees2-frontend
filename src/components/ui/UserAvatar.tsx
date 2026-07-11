"use client";

import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  initials?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-12 w-12 text-base",
} as const;

/**
 * User avatar — displays picture if available, falls back to initials.
 * For MS365 integration: pass `src={userPhotoUrl}` from MS Graph endpoint
 * e.g. src={`https://graph.microsoft.com/v1.0/me/photo/$value`}
 */
export function UserAvatar({
  src,
  alt = "User avatar",
  initials = "?",
  size = "md",
  className,
}: UserAvatarProps) {
  if (src) {
    return (
      <div
        className={cn(
          "relative flex-shrink-0 overflow-hidden rounded-full bg-muted",
          SIZE_MAP[size],
          className,
        )}
        suppressHydrationWarning
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 32px, 48px"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white",
        SIZE_MAP[size],
        className,
      )}
      suppressHydrationWarning
    >
      {initials}
    </div>
  );
}

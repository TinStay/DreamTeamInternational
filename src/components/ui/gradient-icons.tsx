"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function GradientSvg({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  const id = React.useId();
  const gradientId = `brand-grad-${id}`;

  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-5 w-5", className)}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="24" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--primary-gradient-start)" />
          <stop offset="1" stopColor="var(--primary-gradient-end)" />
        </linearGradient>
      </defs>
      <g fill={`url(#${gradientId})`}>{children}</g>
    </svg>
  );
}

export function GradientMailIcon({ className }: { className?: string }) {
  return (
    <GradientSvg className={className} title="Email">
      {/* Tabler IconMailFilled */}
      <path d="M22 7.535v9.465a3 3 0 0 1 -2.824 2.995l-.176 .005h-14a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-9.465l9.445 6.297l.116 .066a1 1 0 0 0 .878 0l.116 -.066l9.445 -6.297z" />
      <path d="M19 4c1.08 0 2.027 .57 2.555 1.427l-9.555 6.37l-9.555 -6.37a2.999 2.999 0 0 1 2.354 -1.42l.201 -.007h14z" />
    </GradientSvg>
  );
}

export function GradientPhoneIcon({ className }: { className?: string }) {
  return (
    <GradientSvg className={className} title="Phone">
      {/* Tabler IconPhoneFilled */}
      <path d="M9 3a1 1 0 0 1 .877 .519l.051 .11l2 5a1 1 0 0 1 -.313 1.16l-.1 .068l-1.674 1.004l.063 .103a10 10 0 0 0 3.132 3.132l.102 .062l1.005 -1.672a1 1 0 0 1 1.113 -.453l.115 .039l5 2a1 1 0 0 1 .622 .807l.007 .121v4c0 1.657 -1.343 3 -3.06 2.998c-8.579 -.521 -15.418 -7.36 -15.94 -15.998a3 3 0 0 1 2.824 -2.995l.176 -.005h4z" />
    </GradientSvg>
  );
}

export function GradientMapPinIcon({ className }: { className?: string }) {
  return (
    <GradientSvg className={className} title="Address">
      {/* Tabler IconMapPinFilled */}
      <path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203 .21l-4.243 4.242a3 3 0 0 1 -4.097 .135l-.144 -.135l-4.244 -4.243a9 9 0 0 1 12.728 -12.728zm-6.364 3.364a3 3 0 1 0 0 6a3 3 0 0 0 0 -6" />
    </GradientSvg>
  );
}


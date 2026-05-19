"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface AnimatedFeatureCardProps {
  className?: string;
  index: string;
  tag: string;
  title: React.ReactNode;
  imageSrc: string;
  color: "orange" | "purple" | "blue";
}

const colorVariants = {
  orange: {
    "--feature-color": "hsl(35, 91%, 55%)",
    "--feature-color-light": "hsl(41, 100%, 85%)",
    "--feature-color-dark": "hsl(24, 98%, 98%)",
  },
  purple: {
    "--feature-color": "hsl(262, 85%, 60%)",
    "--feature-color-light": "hsl(261, 100%, 87%)",
    "--feature-color-dark": "hsl(264, 100%, 98%)",
  },
  blue: {
    "--feature-color": "hsl(211, 100%, 60%)",
    "--feature-color-light": "hsl(210, 100%, 83%)",
    "--feature-color-dark": "hsl(216, 100%, 98%)",
  },
} as const;

const AnimatedFeatureCard = React.forwardRef<HTMLDivElement, AnimatedFeatureCardProps>(
  ({ className, index, tag, title, imageSrc, color }, ref) => {
    const cardStyle = colorVariants[color] as React.CSSProperties;

    return (
      <motion.div
        ref={ref}
        style={cardStyle}
        className={cn(
          "relative flex h-[400px] w-full flex-col gap-3 overflow-hidden rounded-2xl border bg-card p-4 shadow-sm",
          className
        )}
        whileHover="hover"
        initial="initial"
        variants={{
          initial: { y: 0 },
          hover: {
            y: -8,
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          },
        }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[55%] opacity-40 dark:opacity-25"
          style={{
            background:
              "radial-gradient(circle at 50% 40%, var(--feature-color-light) 0%, transparent 72%)",
          }}
        />

        <div className="relative z-10 shrink-0 font-mono text-lg font-bold text-muted-foreground">
          {index}
        </div>

        <motion.div
          className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-1"
          variants={{
            initial: { scale: 1, y: 0 },
            hover: { scale: 1.06, y: -4 },
          }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <img
            src={imageSrc}
            alt={tag}
            className="h-[min(240px,42vw)] w-full max-w-[min(100%,300px)] rounded-xl object-cover object-center shadow-md sm:h-[250px]"
          />
        </motion.div>

        <div className="relative z-20 mt-auto shrink-0 rounded-xl border border-border/40 bg-[#f6f4f0] p-3.5 dark:border-border/30 dark:bg-background/75">
          <span
            className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{
              backgroundColor: "var(--feature-color-dark)",
              color: "var(--feature-color)",
            }}
          >
            {tag}
          </span>
          <p className="text-sm leading-snug text-card-foreground sm:text-[0.9375rem]">{title}</p>
        </div>
      </motion.div>
    );
  }
);
AnimatedFeatureCard.displayName = "AnimatedFeatureCard";

export { AnimatedFeatureCard };

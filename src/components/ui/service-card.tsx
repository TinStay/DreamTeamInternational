"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { ButtonWithIcon } from "@/components/ui/button-with-icon";
import {
  SERVICE_CARD_ICON_PX,
  SERVICE_CARD_ICON_SIZES,
} from "@/lib/services/constants";

/**
 * Card surfaces per service: near-white with a breath of tint in the light
 * theme, the same tint over the dark card ground in the dark theme - blue
 * (AI video), warm yellow (mascot), peach (AI images), mint (automation),
 * each with its own ink. The quote CTA is the arrow-disc pill.
 */
const cardVariants = cva(
  "relative flex w-full p-6 sm:p-7 overflow-hidden rounded-[1.75rem] border border-transparent shadow-[0_4px_18px_rgba(15,23,42,0.08)] transition-shadow duration-300 ease-in-out group cursor-pointer hover:shadow-[0_12px_34px_rgba(15,23,42,0.16)] dark:border-white/[0.06] dark:shadow-[0_6px_24px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_14px_40px_rgba(0,0,0,0.5)]",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        blue: "bg-gradient-to-br from-white via-[#f8fafe] to-[#eef3fb] text-[#12325a] dark:from-[#111a2e] dark:via-[#121f3a] dark:to-[#15284a] dark:text-white",
        amber: "bg-gradient-to-br from-white via-[#fffbf2] to-[#fdf3dc] text-[#5a3d05] dark:from-[#1b1530] dark:via-[#251c44] dark:to-[#33265c] dark:text-white",
        coral: "bg-gradient-to-br from-white via-[#fff7f4] to-[#fdeae2] text-[#6b2a12] dark:from-[#1e1412] dark:via-[#261816] dark:to-[#33201c] dark:text-white",
        green: "bg-gradient-to-br from-white via-[#f6fcf8] to-[#eaf7ee] text-[#164a2a] dark:from-[#10201a] dark:via-[#13291f] dark:to-[#173628] dark:text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const TILT_SPRING = { stiffness: 160, damping: 18, mass: 0.5 };

export interface ServiceCardProps extends VariantProps<typeof cardVariants> {
  title: string;
  imgSrc: string;
  imgAlt: string;
  linkLabel?: string;
  /**
   * Makes the "learn more" label a real link. Without it the label is plain
   * text and the parent wraps the whole card in a link (`/services`).
   */
  href?: string;
  /** Primary pill under the label - the quote wizard's "request a quote" (home). */
  cta?: { label: string; onClick: () => void };
  className?: string;
}

/**
 * A service card: picture on the right (on top on phones), title on the left,
 * the "learn more" link and the quote pill at the bottom. The card itself sits
 * still; only the picture is 3D - it tilts toward the pointer and comes
 * forward while the pointer is over the card (springs, none under reduced
 * motion). With `href` the whole card opens the service page (a click
 * anywhere but on the pill / link); the pill picks the service in the wizard.
 */
const ServiceCard = React.forwardRef<HTMLDivElement, ServiceCardProps>(
  ({ className, variant, title, imgSrc, imgAlt, linkLabel = "Learn more", href, cta }, ref) => {
    const router = useRouter();
    const reduceMotion = useReducedMotion();
    const rotateX = useSpring(useMotionValue(0), TILT_SPRING);
    const rotateY = useSpring(useMotionValue(0), TILT_SPRING);
    const lift = useSpring(useMotionValue(0), TILT_SPRING);
    const scale = useTransform(lift, [0, 1], [1, 1.06]);
    const z = useTransform(lift, [0, 1], [0, 30]);

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (reduceMotion || e.pointerType === "touch") return;
      const r = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      rotateY.set(x * 22);
      rotateX.set(-y * 16);
      lift.set(1);
    };
    const onPointerLeave = () => {
      rotateX.set(0);
      rotateY.set(0);
      lift.set(0);
    };

    // The card is the link's hit area; the real link (keyboard, right-click) is the "learn more" below.
    const onCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!href || (e.target as Element).closest("a, button")) return;
      router.push(href);
    };

    return (
      <div
        className={cn(cardVariants({ variant, className }), "min-h-[248px] flex-col gap-5 sm:flex-row-reverse sm:items-center sm:gap-6")}
        ref={ref}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onClick={onCardClick}
      >
        {/* The picture, in its own perspective: tilts toward the pointer and lifts a little. */}
        <div className="pointer-events-none relative z-20 flex h-36 w-full shrink-0 items-center justify-center [perspective:900px] sm:h-auto sm:w-[42%] sm:self-stretch sm:p-1">
          <motion.div
            className="h-full w-full opacity-90 transition-opacity duration-300 group-hover:opacity-100 [transform-style:preserve-3d]"
            style={{ rotateX, rotateY, z, scale }}
          >
            <Image
              src={imgSrc}
              alt={imgAlt}
              width={SERVICE_CARD_ICON_PX}
              height={SERVICE_CARD_ICON_PX}
              sizes={SERVICE_CARD_ICON_SIZES}
              quality={100}
              className="h-full max-h-44 w-full object-contain drop-shadow-[0_14px_22px_rgba(2,6,23,0.35)] transition-[filter] duration-300 ease-out group-hover:drop-shadow-[0_26px_36px_rgba(2,6,23,0.5)] sm:max-h-52"
            />
          </motion.div>
        </div>

        <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-5 sm:gap-6">
          <h3 className="relative z-10 w-full text-xl font-bold tracking-tight sm:text-2xl">{title}</h3>

          {/* "Learn more" first, the quote pill under it at the bottom of the card. */}
          <div className="relative z-10 mt-auto flex w-full flex-col items-start gap-3.5">
            {href ? (
              <Link href={href} className="inline-flex items-center text-sm font-semibold underline-offset-4 hover:underline">
                {linkLabel}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
              </Link>
            ) : (
              <span className="inline-flex items-center text-sm font-semibold group-hover:underline">
                {linkLabel}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
              </span>
            )}
            {cta ? (
              <ButtonWithIcon onClick={cta.onClick} surface="auto">
                {cta.label}
              </ButtonWithIcon>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
);
ServiceCard.displayName = "ServiceCard";

export { ServiceCard };

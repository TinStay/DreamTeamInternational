import * as React from "react";
import Image from "next/image";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { CardItem } from "@/components/ui/3d-card";
import {
  SERVICE_CARD_ICON_PX,
  SERVICE_CARD_ICON_SIZES,
} from "@/lib/services/constants";

const cardVariants = cva(
  "relative flex flex-col justify-between w-full p-6 sm:p-7 overflow-hidden rounded-xl shadow-[0_4px_18px_rgba(15,23,42,0.07)] transition-shadow duration-300 ease-in-out group cursor-pointer hover:shadow-[0_8px_28px_rgba(15,23,42,0.12)] dark:shadow-[0_4px_18px_rgba(0,0,0,0.28)] dark:hover:shadow-[0_8px_28px_rgba(0,0,0,0.38)]",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        red: "bg-red-500/90 text-primary-foreground",
        orange:
          "bg-orange-200 text-orange-800 [&_h3]:text-orange-950 dark:bg-orange-950 dark:text-orange-300 dark:[&_h3]:text-orange-100",
        blue: "bg-blue-500/90 text-primary-foreground",
        gray: "bg-secondary text-secondary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/** `CardItem` (3D lift) when `depth` is on, a plain element otherwise. */
function Layer({
  as = "div",
  depth,
  z,
  className,
  children,
}: {
  as?: "div" | "h3" | "span";
  depth: boolean;
  z: number;
  className: string;
  children: React.ReactNode;
}) {
  if (depth) {
    return (
      <CardItem as={as} translateZ={z} className={className}>
        {children}
      </CardItem>
    );
  }
  const Tag = as;
  return <Tag className={className}>{children}</Tag>;
}

export interface ServiceCardProps extends VariantProps<typeof cardVariants> {
  title: string;
  imgSrc: string;
  imgAlt: string;
  linkLabel?: string;
  className?: string;
  /**
   * Lift the title / icon / link out of the card plane on hover. Only valid
   * inside a `CardContainer` (it drives the shared pointer state).
   */
  depth?: boolean;
}

const ServiceCard = React.forwardRef<HTMLDivElement, ServiceCardProps>(
  ({ className, variant, title, imgSrc, imgAlt, linkLabel = "Learn more", depth = false }, ref) => {
    const cardAnimation = {
      hover: {
        scale: 1.02,
        transition: { duration: 0.3 },
      },
    };

    const imageAnimation = {
      hover: {
        scale: 1.08,
        rotate: 2,
        transition: { duration: 0.4, ease: "easeInOut" as const },
      },
    };

    return (
      <motion.div
        className={cn(
          cardVariants({ variant, className }),
          "min-h-[248px]",
          // `overflow-hidden` (from the base variant) FLATTENS 3D children, so
          // the lifted icon never leaves the card plane. Depth mode needs
          // `overflow-visible` — which also lets the icon float past the edge.
          depth && "overflow-visible [transform-style:preserve-3d]"
        )}
        ref={ref}
        variants={cardAnimation}
        // In `depth` mode the pointer tilt owns the transform - a competing
        // scale on the card (and on the icon) fights it and jitters.
        whileHover={depth ? undefined : "hover"}
      >
        {/* Mobile stacks title → icon → CTA in their own rows; sm+ keeps the
            two-column layout with the icon absolutely placed on the right. */}
        {/* `pr-[56%]` + the card's own padding keep the lifted title clear of the
            icon column and inside the card edge while it is scaled up in 3D. */}
        <Layer as="h3" depth={depth} z={50} className="relative z-10 w-full text-xl font-bold tracking-tight sm:pr-[56%] sm:text-2xl">
          {title}
        </Layer>

        <Layer
          depth={depth}
          // The icon travels furthest forward — straight toward the viewer.
          z={140}
          className="pointer-events-none relative z-20 my-4 flex h-36 w-full items-center justify-center sm:absolute sm:inset-y-0 sm:right-0 sm:my-0 sm:h-auto sm:w-[54%] sm:p-2"
        >
          <motion.div
            className={cn(
              "h-full w-full opacity-90 transition-opacity duration-300 group-hover:opacity-100",
              // Depth mode: the CardItem lift does the moving; only scale a touch here.
              depth && "transition-[opacity,transform] duration-300 ease-out group-hover:scale-[1.06]"
            )}
            variants={depth ? undefined : imageAnimation}
          >
            <Image
              src={imgSrc}
              alt={imgAlt}
              width={SERVICE_CARD_ICON_PX}
              height={SERVICE_CARD_ICON_PX}
              sizes={SERVICE_CARD_ICON_SIZES}
              quality={100}
              className={cn(
                "h-full w-full object-contain transition-[filter] duration-300 ease-out",
                depth
                  ? "drop-shadow-[0_10px_18px_rgba(15,23,42,0.22)] group-hover:drop-shadow-[0_34px_44px_rgba(15,23,42,0.42)]"
                  : "drop-shadow-[0_18px_28px_rgba(15,23,42,0.28)]"
              )}
            />
          </motion.div>
        </Layer>

        <Layer
          as="span"
          depth={depth}
          z={20}
          className="relative z-10 mt-auto flex w-full items-center pt-3 text-sm font-semibold group-hover:underline sm:pr-[56%]"
        >
          {linkLabel}
          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
        </Layer>
      </motion.div>
    );
  }
);
ServiceCard.displayName = "ServiceCard";

export { ServiceCard };

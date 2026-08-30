import * as React from "react";
import Image from "next/image";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  SERVICE_CARD_ICON_PX,
  SERVICE_CARD_ICON_SIZES,
} from "@/lib/services/constants";

const cardVariants = cva(
  "relative flex flex-col justify-between w-full p-5 overflow-hidden rounded-xl shadow-[0_4px_18px_rgba(15,23,42,0.07)] transition-shadow duration-300 ease-in-out group cursor-pointer hover:shadow-[0_8px_28px_rgba(15,23,42,0.12)] dark:shadow-[0_4px_18px_rgba(0,0,0,0.28)] dark:hover:shadow-[0_8px_28px_rgba(0,0,0,0.38)]",
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

export interface ServiceCardProps extends VariantProps<typeof cardVariants> {
  title: string;
  imgSrc: string;
  imgAlt: string;
  linkLabel?: string;
  className?: string;
}

const ServiceCard = React.forwardRef<HTMLDivElement, ServiceCardProps>(
  ({ className, variant, title, imgSrc, imgAlt, linkLabel = "Learn more" }, ref) => {
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

    const arrowAnimation = {
      hover: {
        x: 5,
        transition: {
          duration: 0.3,
          ease: "easeInOut" as const,
          repeat: Infinity,
          repeatType: "reverse" as const,
        },
      },
    };

    return (
      <motion.div
        className={cn(cardVariants({ variant, className }), "min-h-[248px]")}
        ref={ref}
        variants={cardAnimation}
        whileHover="hover"
      >
        {/* Mobile stacks title → icon → CTA in their own rows; sm+ keeps the
            two-column layout with the icon absolutely placed on the right. */}
        <h3 className="relative z-10 text-xl font-bold tracking-tight sm:pr-[54%] sm:text-2xl">
          {title}
        </h3>

        <div className="pointer-events-none relative z-0 my-4 flex h-36 w-full items-center justify-center sm:absolute sm:inset-y-0 sm:right-0 sm:my-0 sm:h-auto sm:w-[54%] sm:p-2">
          <motion.div
            className="h-full w-full opacity-90 group-hover:opacity-100"
            variants={imageAnimation}
          >
            <Image
              src={imgSrc}
              alt={imgAlt}
              width={SERVICE_CARD_ICON_PX}
              height={SERVICE_CARD_ICON_PX}
              sizes={SERVICE_CARD_ICON_SIZES}
              quality={100}
              className="h-full w-full object-contain"
            />
          </motion.div>
        </div>

        <span className="relative z-10 mt-auto flex items-center pt-3 text-sm font-semibold group-hover:underline sm:pr-[54%]">
          {linkLabel}
          <motion.div variants={arrowAnimation}>
            <ArrowRight className="ml-2 h-4 w-4" />
          </motion.div>
        </span>
      </motion.div>
    );
  }
);
ServiceCard.displayName = "ServiceCard";

export { ServiceCard };

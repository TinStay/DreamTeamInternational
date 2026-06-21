import * as React from "react";
import Image from "next/image";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  SERVICE_CARD_ICON_PX,
  SERVICE_CARD_ICON_SIZES,
} from "@/lib/services/constants";

const cardVariants = cva(
  "relative flex flex-col justify-between w-full p-6 overflow-hidden rounded-xl shadow-sm transition-shadow duration-300 ease-in-out group hover:shadow-lg cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        red: "bg-red-500/90 text-primary-foreground",
        orange:
          "bg-orange-100/95 text-orange-700 [&_h3]:text-orange-900 dark:bg-orange-950/50 dark:text-orange-300 dark:[&_h3]:text-orange-100",
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
        className={cn(cardVariants({ variant, className }), "min-h-[200px]")}
        ref={ref}
        variants={cardAnimation}
        whileHover="hover"
      >
        <div className="relative z-10 flex min-h-[200px] flex-1 flex-col pr-[52%]">
          <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
          <span className="mt-auto flex items-center pt-4 text-sm font-semibold group-hover:underline">
            {linkLabel}
            <motion.div variants={arrowAnimation}>
              <ArrowRight className="ml-2 h-4 w-4" />
            </motion.div>
          </span>
        </div>

        <div className="pointer-events-none absolute inset-y-0 right-0 z-0 flex w-[52%] items-center justify-center p-2 sm:p-3">
          <motion.div
            className="h-56 w-56 max-h-full max-w-full opacity-90 group-hover:opacity-100 sm:h-72 sm:w-72"
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
      </motion.div>
    );
  }
);
ServiceCard.displayName = "ServiceCard";

export { ServiceCard };

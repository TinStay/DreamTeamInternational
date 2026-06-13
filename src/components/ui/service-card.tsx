import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "relative flex flex-col justify-between w-full p-6 overflow-hidden rounded-xl shadow-sm transition-shadow duration-300 ease-in-out group hover:shadow-lg cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        red: "bg-red-500/90 text-primary-foreground",
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
        scale: 1.1,
        rotate: 3,
        x: 10,
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
        className={cn(cardVariants({ variant, className }), "min-h-[180px]")}
        ref={ref}
        variants={cardAnimation}
        whileHover="hover"
      >
        <div className="relative z-10 flex min-h-[180px] flex-1 flex-col">
          <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
          <span className="mt-auto flex items-center pt-4 text-sm font-semibold group-hover:underline">
            {linkLabel}
            <motion.div variants={arrowAnimation}>
              <ArrowRight className="ml-2 h-4 w-4" />
            </motion.div>
          </span>
        </div>

        <motion.img
          src={imgSrc}
          alt={imgAlt}
          className="absolute -bottom-8 -right-8 h-40 w-40 object-contain opacity-90 group-hover:opacity-100"
          variants={imageAnimation}
        />
      </motion.div>
    );
  }
);
ServiceCard.displayName = "ServiceCard";

export { ServiceCard };

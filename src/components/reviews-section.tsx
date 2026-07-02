"use client";

import { motion } from "motion/react";
import { useLanguage } from "@/lib/i18n/language-context";
import { Testimonial } from "@/components/ui/testimonial";
import { cn } from "@/lib/utils";

const MARQUEE_DURATION_SEC = 90;

export function ReviewsSection({ className }: { className?: string }) {
  const { t } = useLanguage();
  const r = t.reviews;
  // Duplicated so the marquee loops seamlessly (translate 0% -> -50%).
  const items = [...r.items, ...r.items];

  return (
    <section
      id="reviews"
      className={cn(
        "relative w-full overflow-x-hidden overflow-y-visible py-16 sm:py-20",
        className
      )}
    >
      <div className="relative z-10 mx-auto mb-8 w-full max-w-7xl px-4 lg:mb-10">
        <h2 className="font-heading text-4xl font-bold text-foreground md:text-5xl">
          {r.title1}{" "}
          <span className="text-section-accent">{r.title2}</span>
        </h2>
      </div>

      {/* Auto-scrolling marquee of review cards. */}
      <div className="relative flex w-full overflow-x-hidden overflow-y-visible py-10">
        <motion.div
          className="flex items-start gap-6 pl-6 will-change-transform md:pl-10"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ ease: "linear", duration: MARQUEE_DURATION_SEC, repeat: Infinity }}
        >
          {items.map((review, idx) => (
            <Testimonial
              key={`${review.name}-${idx}`}
              name={review.name}
              role={review.role}
              text={review.text}
              rating={review.rating}
              initials={review.initials}
              color={review.color}
              className="shrink-0"
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

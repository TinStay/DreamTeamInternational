"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronRight, ChevronLeft, Lightbulb, UserCheck, MessageSquare, CheckCircle2, Sparkles, ExternalLink, Clock, Zap } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { motion, AnimatePresence } from "framer-motion";

// ─── Pricing Data ─────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "starter",
    nameBG: "Старт",
    nameEN: "Starter",
    durationBG: "до 15 секунди",
    durationEN: "up to 15 seconds",
    price: 150,
    popular: false,
    icon: <Zap size={22} />,
    featuresBG: [
      "Съдържание до 15с",
      "Срок 2-3 дни",
      "1 итерация",
      "Базово редактиране",
      "FullHD (1920×1080)",
      "16:9 или 9:16",
      "Video Prompt Engineering",
      "Субтитри (SRT)",
      "Пост-продукция на звук",
      "Insta, TikTok, Linkedin",
      "Съответства с AI Act (EU 2024/1689)",
    ],
    featuresEN: [
      "Content up to 15s",
      "Deadline 2-3 days",
      "1 iteration",
      "Basic editing",
      "FullHD (1920×1080)",
      "16:9 or 9:16",
      "Video Prompt Engineering",
      "Film/SRT subtitles",
      "Sound post-production",
      "Insta, TikTok, Linkedin",
      "Compliant with AI Act (EU 2024/1689)",
    ],
    exampleUrl: "#",
  },
  {
    id: "standard",
    nameBG: "Стандарт",
    nameEN: "Standard",
    durationBG: "до 30 секунди",
    durationEN: "up to 30 seconds",
    price: 450,
    popular: true,
    icon: <Sparkles size={22} />,
    featuresBG: [
      "Съдържание до 30с",
      "Срок 3-5 дни",
      "До 3 итерации",
      "Разширено редактиране",
      "4K (3840×2160)",
      "16:9 + 9:16",
      "Сценарий + визия",
      "Video Prompt Engineering",
      "Сторителинг",
      "AI лектор",
      "Субтитри (SRT)",
      "Пост-продукция на изображения + звук",
      "Insta, YouTube, TikTok, Linkedin",
      "Digital Signage",
      "Съответства с AI Act (EU 2024/1689)",
    ],
    featuresEN: [
      "Content up to 30s",
      "Deadline 3-5 days",
      "Up to 3 iterations",
      "Expanded keyframe editing",
      "4K (3840×2160)",
      "16:9 + 9:16",
      "Script + visual",
      "Video Prompt Engineering",
      "Storytelling",
      "AI lecturer",
      "Film/SRT subtitles",
      "Image + sound post-production",
      "Insta, YouTube, TikTok, Linkedin",
      "Digital Signage",
      "Compliant with AI Act (EU 2024/1689)",
    ],
    exampleUrl: "#",
  },
  {
    id: "pro",
    nameBG: "Про",
    nameEN: "Pro",
    durationBG: "до 1 минута",
    durationEN: "up to 1 minute",
    price: 750,
    popular: false,
    icon: <Clock size={22} />,
    featuresBG: [
      "Съдържание до 60с",
      "Срок 5-8 дни",
      "До 5 итерации",
      "Напреднало редактиране",
      "4K (3840×2160)",
      "16:9 + 9:16",
      "Сценарий + сторибоард",
      "Video Prompt Engineering",
      "Реално маркетингово съдържание",
      "Сторителинг",
      "AI лектор",
      "Субтитри (SRT)",
      "Пост-продукция на изображения + звук",
      "Insta, YouTube, TikTok, Linkedin",
      "Digital Signage / TV реклама",
      "Персонален аватар",
      "Съответства с AI Act (EU 2024/1689)",
    ],
    featuresEN: [
      "Content up to 60s",
      "Deadline 5-8 days",
      "Up to 5 iterations",
      "Advanced keyframe editing",
      "4K (3840×2160)",
      "16:9 + 9:16",
      "Script + storyboard",
      "Video Prompt Engineering",
      "Real Time Marketing",
      "Storytelling",
      "AI lecturer",
      "Film/SRT subtitles",
      "Image + sound post-production",
      "Insta, YouTube, TikTok, Linkedin",
      "Digital Signage / TV advertising",
      "Custom avatar",
      "Compliant with AI Act (EU 2024/1689)",
    ],
    exampleUrl: "#",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export function OrderFormSection() {
  const [step, setStep] = useState(1);
  const totalSteps = 2; // only step 1 (idea) + step 2 (summary/contact)
  const { t, language } = useLanguage();
  const isBG = language === "bg";

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const [formData, setFormData] = useState({
    hasIdea: "",
    ideaText: "",
    name: "",
    email: "",
    company: "",
    phone: "",
    termsAccepted: false,
  });

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));
  const handleUpdate = (key: string, value: unknown) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const formDict = t.order.steps;

  return (
    <section id="order-form" className="py-24 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 z-10 relative">

        {/* ── Section Header ── */}
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-4xl md:text-5xl mb-4 text-foreground">
            {t.pricing.title1}{" "}
            <span className="text-primary">{t.pricing.title2}</span>
          </h2>
          <p className="text-muted-foreground text-lg">{t.pricing.subtitle}</p>
        </div>

        {/* ── Pricing Cards — horizontal row on desktop ── */}
        <div className="flex flex-col lg:flex-row gap-5 mb-16 overflow-x-auto pb-2">
          {PLANS.map((plan) => {
            const name = isBG ? plan.nameBG : plan.nameEN;
            const duration = isBG ? plan.durationBG : plan.durationEN;
            const features = isBG ? plan.featuresBG : plan.featuresEN;
            const isSelected = selectedPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border flex flex-col transition-all duration-300 overflow-hidden flex-shrink-0 lg:flex-1
                  ${plan.popular
                    ? "border-primary/60 shadow-xl shadow-primary/20"
                    : "border-border/30"
                  }
                  ${isSelected
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]"
                    : ""
                  }
                  bg-card/50 backdrop-blur-sm`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-primary to-fuchsia-400" />
                )}
                {plan.popular && (
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-1 rounded-full">
                      {t.pricing.popular}
                    </span>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  {/* Icon + Name */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-primary">{plan.icon}</span>
                    <span className="font-heading font-bold text-lg text-foreground">{name}</span>
                  </div>

                  {/* Duration tag */}
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 mb-4 self-start">
                    <Clock size={11} />
                    {duration}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-6 flex-1">
                    {features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 size={13} className="text-primary flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTAs */}
                  <div className="flex flex-col gap-2 mt-auto">
                    <Button
                      variant={plan.popular ? "default" : "secondary"}
                      onClick={() => {
                        setSelectedPlan(plan.id);
                        setShowCustomInput(false);
                        // scroll to form
                        setTimeout(() => {
                          document.getElementById("quote-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
                        }, 100);
                      }}
                      className={`w-full rounded-full font-bold h-10 text-sm transition-all ${
                        plan.popular
                          ? "shadow-lg shadow-indigo-500/25"
                          : "border border-transparent hover:border-white/10 hover:bg-gradient-to-br hover:from-indigo-600 hover:via-violet-600 hover:to-[#7033ff] hover:text-primary-foreground hover:brightness-105"
                      } ${isSelected ? "ring-2 ring-indigo-400/50" : ""}`}
                    >
                      {t.pricing.order}
                    </Button>
                    <a
                      href={plan.exampleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full rounded-full font-semibold h-10 text-sm border border-border/40 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-1.5"
                    >
                      {t.pricing.example} <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Custom Card — on desktop sits at the far right */}
          <div
            className={`relative rounded-2xl border flex flex-col transition-all duration-300 overflow-hidden bg-card/30 backdrop-blur-sm cursor-pointer flex-shrink-0 lg:w-64
              ${showCustomInput
                ? "border-primary/60 ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]"
                : "border-dashed border-border/40 hover:border-primary/40"
              }`}
            onClick={() => {
              setShowCustomInput(true);
              setSelectedPlan(null);
              setTimeout(() => {
                document.getElementById("quote-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
              }, 100);
            }}
          >
            <div className="p-6 flex flex-col flex-1 items-center justify-center text-center gap-4 min-h-[200px]">
              <div className="w-12 h-12 rounded-full border border-dashed border-primary/40 flex items-center justify-center text-primary">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="font-heading font-bold text-foreground mb-2">{t.pricing.custom}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{t.pricing.customDesc}</p>
              </div>
              {showCustomInput && (
                <Textarea
                  placeholder={t.pricing.customPlaceholder}
                  value={customText}
                  onChange={(e) => { e.stopPropagation(); setCustomText(e.target.value); }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full min-h-[80px] bg-background/40 border-border/50 focus:border-primary text-xs mt-2"
                  autoFocus
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Quote Form (temporarily hidden) ──
        <div id="quote-form">
          FORM CONTENT COMMENTED OUT
        </div>
        */}



      </div>
    </section>
  );
}

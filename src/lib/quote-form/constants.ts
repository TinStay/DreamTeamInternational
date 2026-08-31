/**
 * Quote form (multi-step "request a quote" on the home page) — option
 * definitions and limits, shared by the step components and `/api/quote`.
 *
 * Labels live in the i18n dictionaries (`quoteForm.*`); this file only holds
 * the stable option keys, their icons, and numeric/config constants, so the
 * catalogue can change without touching the step components.
 */
import type { ComponentType } from "react";
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandYoutube,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconDeviceTv,
  IconDots,
  IconFileCheck,
  IconMicrophone,
  IconMicrophoneOff,
  IconPencil,
  IconRocket,
  IconSchool,
  IconShieldCheck,
  IconShoppingCart,
  IconSpeakerphone,
  IconWorld,
} from "@tabler/icons-react";

export type QuoteOptionIcon = ComponentType<{ className?: string }>;

export type QuoteOption<K extends string> = {
  key: K;
  icon: QuoteOptionIcon;
};

/** Step order — one entry per step component in `src/components/quote-form/steps`. */
export const QUOTE_STEPS = ["script", "goal", "video", "details", "contact"] as const;
export type QuoteStepKey = (typeof QUOTE_STEPS)[number];

/** „Имате ли готов сюжет?“ */
export const SCRIPT_OPTIONS = [
  { key: "ready", icon: IconFileCheck },
  { key: "none", icon: IconPencil },
] as const satisfies readonly QuoteOption<string>[];
export type ScriptOptionKey = (typeof SCRIPT_OPTIONS)[number]["key"];

/** „Каква е основната цел?“ */
export const GOAL_OPTIONS = [
  { key: "sales", icon: IconShoppingCart },
  { key: "awareness", icon: IconSpeakerphone },
  { key: "launch", icon: IconRocket },
  { key: "trust", icon: IconShieldCheck },
  { key: "education", icon: IconSchool },
  { key: "other", icon: IconDots },
] as const satisfies readonly QuoteOption<string>[];
export type GoalOptionKey = (typeof GOAL_OPTIONS)[number]["key"];

/** „В какъв формат ви трябва?“ (multi-select) */
export const FORMAT_OPTIONS = [
  { key: "vertical", icon: IconDeviceMobile },
  { key: "horizontal", icon: IconDeviceDesktop },
] as const satisfies readonly QuoteOption<string>[];
export type FormatOptionKey = (typeof FORMAT_OPTIONS)[number]["key"];

/** „Ще има ли глас зад кадър?“ */
export const VOICEOVER_OPTIONS = [
  { key: "yes", icon: IconMicrophone },
  { key: "no", icon: IconMicrophoneOff },
] as const satisfies readonly QuoteOption<string>[];
export type VoiceoverOptionKey = (typeof VOICEOVER_OPTIONS)[number]["key"];

/** „Къде ще се публикува видеото?“ (multi-select) */
export const PLATFORM_OPTIONS = [
  { key: "instagram", icon: IconBrandInstagram },
  { key: "tiktok", icon: IconBrandTiktok },
  { key: "facebook", icon: IconBrandFacebook },
  { key: "youtube", icon: IconBrandYoutube },
  { key: "website", icon: IconWorld },
  { key: "screens", icon: IconDeviceTv },
] as const satisfies readonly QuoteOption<string>[];
export type PlatformOptionKey = (typeof PLATFORM_OPTIONS)[number]["key"];

/** Video length bounds; the max position renders as "5+ min". */
export const LENGTH_SLIDER = {
  min: 5,
  /** 300s = 5:00; the extra tick (305) means "5+ minutes". */
  max: 305,
  default: 30,
} as const;

/**
 * Slider tick values (seconds): 5s steps up to 1 minute, then 10s steps to
 * 5 minutes; the final tick (305) renders as "5+ min". The slider itself moves
 * over tick INDICES so the step size can change mid-range.
 */
export const LENGTH_TICKS: readonly number[] = [
  ...Array.from({ length: 12 }, (_, i) => 5 + i * 5), // 5..60
  ...Array.from({ length: 24 }, (_, i) => 70 + i * 10), // 70..300
  LENGTH_SLIDER.max,
];

/**
 * Upload limits. Vercel serverless HARD-rejects request bodies over 4.5 MB
 * (platform limit — cannot be lifted from our side), so the whole submission
 * (both upload fields together, plus multipart/JSON overhead) must stay just
 * under it. To accept truly large files the uploads would have to go directly
 * to blob storage (e.g. Vercel Blob) instead of through this endpoint.
 */
export const UPLOAD_MAX_TOTAL_BYTES = 4_400_000; // ≈4.4 MB, leaves overhead headroom
export const UPLOAD_MAX_FILES_PER_FIELD = 5;
export const UPLOAD_ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "txt",
  "rtf",
  "md",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
] as const;

/** `accept` attribute for the file inputs — derived so the lists can't drift. */
export const UPLOAD_ACCEPT = UPLOAD_ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",");

export function isAllowedUploadName(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return (UPLOAD_ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
}

/** All quote form answers except the uploaded files (kept in component state). */
export type QuoteFormData = {
  script: ScriptOptionKey | "";
  scriptText: string;
  goal: GoalOptionKey | "";
  /** Free text shown/collected when goal === "other". */
  goalOther: string;
  lengthSec: number;
  /** "Не знам — вие препоръчайте" overrides the slider value. */
  lengthFlexible: boolean;
  formats: FormatOptionKey[];
  voiceover: VoiceoverOptionKey | "";
  refLinks: string;
  platforms: PlatformOptionKey[];
  /** yyyy-mm-dd from the mini calendar; empty = not chosen. */
  deadline: string;
  /** "Нямам краен срок" — overrides any picked date. */
  deadlineFlexible: boolean;
  notes: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  /** "Как ни намерихте?" — option key from `contact.foundUsOptions`; optional. */
  foundUs: string;
  termsAccepted: boolean;
  /** Honeypot — must stay empty for real users. */
  website: string;
};

export const QUOTE_FORM_DEFAULTS: QuoteFormData = {
  script: "",
  scriptText: "",
  goal: "",
  goalOther: "",
  lengthSec: LENGTH_SLIDER.default,
  lengthFlexible: false,
  formats: [],
  voiceover: "",
  refLinks: "",
  platforms: [],
  deadline: "",
  deadlineFlexible: false,
  notes: "",
  name: "",
  email: "",
  phone: "",
  company: "",
  foundUs: "",
  termsAccepted: false,
  website: "",
};

/**
 * Field setter handed to every step. Accepts a value OR an updater function
 * (like `setState`). Handlers that derive the next value from the current one
 * — the multi-select toggles — MUST use the updater form: reading `data.x`
 * inside a handler captures the array from that render, and `OptionCard` is
 * memoized on props only, so an unchanged card keeps its stale closure and
 * would clobber selections made since.
 */
export type QuoteFieldUpdater = <K extends keyof QuoteFormData>(
  field: K,
  value: QuoteFormData[K] | ((prev: QuoteFormData[K]) => QuoteFormData[K])
) => void;

/** Add/remove `key` in a multi-select array field — safe inside stale closures. */
export function toggleInArray<T>(values: readonly T[], key: T): T[] {
  return values.includes(key) ? values.filter((v) => v !== key) : [...values, key];
}

/** Per-step gating for the wizard's Next/Submit buttons (server mirrors this). */
export function isQuoteStepValid(
  step: QuoteStepKey,
  data: QuoteFormData,
  emailRe: RegExp
): boolean {
  switch (step) {
    case "script":
      return data.script !== "";
    case "goal":
      return data.goal !== "";
    case "video":
      return data.formats.length > 0 && data.voiceover !== "";
    case "details":
      return true;
    case "contact":
      return (
        data.name.trim() !== "" &&
        emailRe.test(data.email.trim()) &&
        data.termsAccepted
      );
  }
}

/** Human-readable length for emails/summary: "45 сек" / "1:30 мин" / "5+ мин". */
export function formatLengthSec(
  sec: number,
  units: { seconds: string; minutes: string; lengthMax: string }
): string {
  if (sec >= LENGTH_SLIDER.max) return units.lengthMax;
  if (sec < 60) return `${sec} ${units.seconds}`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")} ${units.minutes}`;
}

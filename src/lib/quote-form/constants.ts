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

/** Video length slider: 5s steps; the max position renders as "5+ min". */
export const LENGTH_SLIDER = {
  min: 5,
  /** 300s = 5:00; the extra step (305) means "5+ minutes". */
  max: 305,
  step: 5,
  default: 30,
} as const;

/**
 * Upload limits. Vercel serverless caps request bodies at ~4.5 MB, so the
 * whole submission (both upload fields together) must stay under 4 MB.
 */
export const UPLOAD_MAX_TOTAL_BYTES = 4 * 1024 * 1024;
export const UPLOAD_MAX_FILES_PER_FIELD = 3;
export const UPLOAD_ACCEPT =
  ".pdf,.doc,.docx,.txt,.rtf,.md,.png,.jpg,.jpeg,.webp,.gif";
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
  voiceDetails: string;
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
  voiceDetails: "",
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

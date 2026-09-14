/**
 * Service-specific part of the quote email: which answers `/api/quote`
 * validates/echoes per service, and how they are grouped in the notification.
 * Labels come from the Bulgarian dictionary (the internal email is in
 * Bulgarian), so the form copy and the email stay in sync.
 */
import { dictionaries } from "@/lib/i18n/config";
import {
  AUTOMATION_INPUT_OPTIONS,
  AUTOMATION_TASK_OPTIONS,
  AUTOMATION_VOLUME_OPTIONS,
  FORMAT_OPTIONS,
  GOAL_OPTIONS,
  IMAGE_COUNT_OPTIONS,
  IMAGE_RATIO_OPTIONS,
  IMAGE_RESOLUTION_OPTIONS,
  IMAGE_USAGE_OPTIONS,
  MASCOT_DELIVERABLE_OPTIONS,
  MASCOT_STYLE_OPTIONS,
  MASCOT_TYPE_OPTIONS,
  MASCOT_USAGE_OPTIONS,
  PLATFORM_OPTIONS,
  SCRIPT_OPTIONS,
  VOICEOVER_OPTIONS,
  formatLengthSec,
  type QuoteServiceKey,
} from "@/lib/quote-form/constants";
import type { QuoteEmailSection } from "./email-template";

/** Option keys already narrowed to the allowed catalogue by the route. */
export type ServiceAnswers = {
  service: QuoteServiceKey;
  /* video */
  script: string;
  goal: string;
  goalOther: string;
  scriptText: string;
  scriptFileNames: string[];
  lengthSec: number;
  lengthFlexible: boolean;
  formats: string[];
  voiceover: string;
  platforms: string[];
  /* images / mascot / automation */
  brief: string;
  imageCount: string;
  imageResolution: string;
  imageRatios: string[];
  imageUsage: string[];
  mascotType: string;
  mascotStyle: string;
  mascotUsage: string[];
  mascotDeliverables: string[];
  automationTasks: string[];
  automationVolume: string;
  automationInputs: string[];
  /* shared */
  refLinks: string;
  refFileNames: string[];
  deadlineText: string;
  notes: string;
};

/** Resolve an option key to its Bulgarian label, or "-". */
function label(map: Record<string, string>, key: string): string {
  return key ? (map[key] ?? key) : "-";
}
function labels(map: Record<string, string>, keys: string[]): string {
  return keys.map((k) => label(map, k)).join(", ");
}

/** Which required option fields are missing for the service (mirrors the wizard's step gating). */
export function missingServiceFields(a: ServiceAnswers): string[] {
  const missing: string[] = [];
  switch (a.service) {
    case "video":
      if (!a.script) missing.push("script");
      if (!a.goal) missing.push("goal");
      if (a.formats.length === 0) missing.push("formats");
      if (!a.voiceover) missing.push("voiceover");
      break;
    case "images":
      if (!a.imageCount) missing.push("imageCount");
      if (!a.imageResolution) missing.push("imageResolution");
      if (a.imageRatios.length === 0) missing.push("imageRatios");
      if (!a.brief) missing.push("brief");
      break;
    case "mascot":
      if (!a.mascotType) missing.push("mascotType");
      if (!a.mascotStyle) missing.push("mascotStyle");
      if (!a.brief) missing.push("brief");
      break;
    case "automation":
      if (a.automationTasks.length === 0) missing.push("automationTasks");
      if (!a.automationVolume) missing.push("automationVolume");
      if (!a.brief) missing.push("brief");
      break;
  }
  return missing;
}

/** Email headline / subject prefix per service. */
export const SERVICE_EMAIL_TITLE: Record<QuoteServiceKey, string> = {
  video: "Заявка за видео",
  images: "Заявка за AI изображения",
  mascot: "Заявка за бранд талисман",
  automation: "Заявка за автоматизация",
};

/** The service-specific sections of the email (contact / notes are added by the route). */
export function serviceEmailSections(a: ServiceAnswers): QuoteEmailSection[] {
  const bgQuote = dictionaries.bg.quoteForm;
  const references: QuoteEmailSection = {
    title: "Референции и материали",
    fields: [
      { label: "Линкове", value: a.refLinks, multiline: true },
      { label: "Прикачени материали", value: a.refFileNames.join(", ") },
    ],
  };

  switch (a.service) {
    case "video": {
      const goalLabels: Record<string, string> = bgQuote.video.goals;
      const scriptLabels: Record<string, string> = Object.fromEntries(
        SCRIPT_OPTIONS.map((o) => [o.key, bgQuote.script.options[o.key].label])
      );
      const formatLabels: Record<string, string> = Object.fromEntries(
        FORMAT_OPTIONS.map((o) => [
          o.key,
          `${bgQuote.video.formats[o.key].label} (${bgQuote.video.formats[o.key].hint})`,
        ])
      );
      const voiceLabels: Record<string, string> = bgQuote.style.voices;
      const platformLabels: Record<string, string> = bgQuote.details.platforms;
      const lengthText = a.lengthFlexible
        ? bgQuote.video.lengthFlexibleLabel
        : formatLengthSec(a.lengthSec, bgQuote.video);
      return [
        {
          title: "Видео",
          fields: [
            {
              label: "Основна цел",
              value: `${label(goalLabels, a.goal)}${a.goal === "other" && a.goalOther ? ` - ${a.goalOther}` : ""}`,
            },
            { label: "Дължина", value: lengthText },
            { label: "Формат", value: labels(formatLabels, a.formats) },
            { label: "Войсоувър", value: label(voiceLabels, a.voiceover) },
          ],
        },
        {
          title: "Сюжет",
          fields: [
            { label: "Има ли готов сюжет", value: label(scriptLabels, a.script) },
            { label: "Описание на идеята / сюжета", value: a.scriptText, multiline: true },
            { label: "Файлове със сюжета", value: a.scriptFileNames.join(", ") },
          ],
        },
        {
          title: "Разпространение и срокове",
          fields: [
            { label: "Платформи", value: labels(platformLabels, a.platforms) },
            { label: "Краен срок", value: a.deadlineText },
          ],
        },
        references,
      ];
    }
    case "images": {
      const im = bgQuote.images;
      const ratioLabels: Record<string, string> = Object.fromEntries(
        IMAGE_RATIO_OPTIONS.map((o) => [o.key, im.ratios[o.key].label])
      );
      return [
        {
          title: "Изображения",
          fields: [
            { label: im.countLabel, value: label(im.counts, a.imageCount) },
            { label: im.resolutionLabel, value: label(im.resolutions, a.imageResolution) },
            { label: im.ratioLabel, value: labels(ratioLabels, a.imageRatios) },
            { label: im.usageLabel, value: labels(im.usages, a.imageUsage) },
          ],
        },
        {
          title: "Задание",
          fields: [
            { label: im.briefLabel, value: a.brief, multiline: true },
            { label: im.deadlineLabel, value: a.deadlineText },
          ],
        },
        references,
      ];
    }
    case "mascot": {
      const m = bgQuote.mascot;
      const typeLabels: Record<string, string> = Object.fromEntries(
        MASCOT_TYPE_OPTIONS.map((o) => [o.key, m.types[o.key].label])
      );
      return [
        {
          title: "Талисман",
          fields: [
            { label: m.typeLabel, value: label(typeLabels, a.mascotType) },
            { label: m.styleLabel, value: label(m.styles, a.mascotStyle) },
            { label: m.usageLabel, value: labels(m.usages, a.mascotUsage) },
            { label: m.deliverablesLabel, value: labels(m.deliverables, a.mascotDeliverables) },
          ],
        },
        {
          title: "Задание",
          fields: [
            { label: m.briefLabel, value: a.brief, multiline: true },
            { label: m.deadlineLabel, value: a.deadlineText },
          ],
        },
        references,
      ];
    }
    case "automation": {
      const au = bgQuote.automation;
      const platformLabels: Record<string, string> = bgQuote.details.platforms;
      return [
        {
          title: "Автоматизация",
          fields: [
            { label: au.tasksLabel, value: labels(au.tasks, a.automationTasks) },
            { label: au.volumeLabel, value: label(au.volumes, a.automationVolume) },
            { label: au.inputsLabel, value: labels(au.inputs, a.automationInputs) },
            { label: au.platformsLabel, value: labels(platformLabels, a.platforms) },
          ],
        },
        {
          title: "Задание",
          fields: [
            { label: au.briefLabel, value: a.brief, multiline: true },
            { label: au.deadlineLabel, value: a.deadlineText },
          ],
        },
        references,
      ];
    }
  }
}

/** Catalogues the route narrows the payload against, per field. */
export const SERVICE_OPTION_CATALOGUES = {
  script: SCRIPT_OPTIONS,
  goal: GOAL_OPTIONS,
  voiceover: VOICEOVER_OPTIONS,
  formats: FORMAT_OPTIONS,
  platforms: PLATFORM_OPTIONS,
  imageCount: IMAGE_COUNT_OPTIONS,
  imageResolution: IMAGE_RESOLUTION_OPTIONS,
  imageRatios: IMAGE_RATIO_OPTIONS,
  imageUsage: IMAGE_USAGE_OPTIONS,
  mascotType: MASCOT_TYPE_OPTIONS,
  mascotStyle: MASCOT_STYLE_OPTIONS,
  mascotUsage: MASCOT_USAGE_OPTIONS,
  mascotDeliverables: MASCOT_DELIVERABLE_OPTIONS,
  automationTasks: AUTOMATION_TASK_OPTIONS,
  automationVolume: AUTOMATION_VOLUME_OPTIONS,
  automationInputs: AUTOMATION_INPUT_OPTIONS,
} as const;

import { getDictionary, type Language } from "@/lib/i18n/config";
import { EMAIL_PRIMARY, GOOGLE_REVIEWS, PHONE_PRIMARY, PHONE_SECONDARY } from "@/lib/contact-info";
import { PROJECTS } from "@/lib/projects";
import {
  contactProcessPath,
  homePath,
  portfolioPath,
  projectPath,
  projectsPath,
  servicePath,
  servicesPath,
  trainingPath,
} from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo";
import { getServiceSlug } from "@/lib/services/constants";
import { SOCIAL_LINKS } from "@/lib/social-links";

/*
 * `/llms.txt` and `/llms-full.txt` - the brief an AI assistant reads to
 * describe DreamTeam (the llms.txt convention: a Markdown index of what the
 * site is and where its key pages are; the "full" file carries the content
 * itself). Both are rendered from the dictionaries and the project data, so
 * they can never fall behind the pages: the index is the company in one
 * screen - what it does, where, for whom, the services, the case studies
 * with their results, the numbers, the process, the facts clients ask about
 * (pricing, delivery, rights), training, contact - in English with a
 * Bulgarian summary; the full file repeats every section in both languages
 * and adds the complete FAQ and the service descriptions.
 */

const HEADINGS: Record<Language, Record<string, string>> = {
  en: {
    summary: "Summary",
    facts: "Key facts",
    services: "Services",
    cases: "Client case studies",
    numbers: "DreamTeam in numbers",
    process: "How we work",
    faq: "Frequently asked questions",
    training: "Training",
    contact: "Contact",
    pages: "Key pages",
  },
  bg: {
    summary: "Резюме",
    facts: "Основни факти",
    services: "Услуги",
    cases: "Казуси на клиенти",
    numbers: "DreamTeam в числа",
    process: "Как работим",
    faq: "Често задавани въпроси",
    training: "Обучения",
    contact: "Контакти",
    pages: "Основни страници",
  },
};

const LANGUAGE_NAME: Record<Language, string> = { en: "English", bg: "Български (Bulgarian)" };

function services(lang: Language) {
  return getDictionary(lang).services.items.flatMap((item) => {
    const slug = getServiceSlug(item.imgSrc);
    return slug ? [{ ...item, url: absoluteUrl(servicePath(lang, slug)) }] : [];
  });
}

/** One language's brief; `full` adds the service descriptions, every case study's highlight + tags and the whole FAQ. */
function section(lang: Language, full: boolean) {
  const t = getDictionary(lang);
  const h = HEADINGS[lang];
  const lines: string[] = [];

  lines.push(`## ${LANGUAGE_NAME[lang]}`, "", `> ${t.seo.organizationDescription}`, "", t.hero.seoHeading, "");

  lines.push(`### ${h.facts}`, "");
  lines.push(`- ${t.contact.address}: ${t.contact.addressVal}`);
  lines.push(`- ${t.contact.email}: ${EMAIL_PRIMARY.label}`);
  lines.push(`- ${t.contact.phone}: ${PHONE_PRIMARY.label}, ${PHONE_SECONDARY.label}`);
  lines.push(`- Google: ${GOOGLE_REVIEWS.rating}/5 (${GOOGLE_REVIEWS.count} ${t.footer.googleReviews}) - ${GOOGLE_REVIEWS.reviewsUrl}`);
  lines.push(`- ${t.footer.reviews}: Clutch, Google`);
  lines.push(`- ${t.header.portfolio}: ${absoluteUrl(portfolioPath(lang))}`);
  lines.push("");

  lines.push(`### ${h.services}`, "");
  for (const service of services(lang)) {
    lines.push(`- **${service.title}** - ${service.seoDescription} ${service.url}`);
    if (full) lines.push(`  - ${service.modal.eyebrow}`);
  }
  lines.push("");

  lines.push(`### ${h.cases}`, "");
  for (const project of PROJECTS) {
    const item = t.projects.items[project.id];
    lines.push(`- **${item.name}** - ${item.headline}. ${item.description} ${absoluteUrl(projectPath(lang, project.id))}`);
    if (full) lines.push(`  - ${item.highlight} (${item.tags.join(" · ")})`);
  }
  lines.push("");

  lines.push(`### ${h.numbers}`, "");
  for (const stat of t.stats.items) lines.push(`- ${stat.value} ${stat.label}`);
  lines.push("");

  lines.push(`### ${h.process}`, "");
  t.process.steps.forEach((step, index) => lines.push(`${index + 1}. **${step.title}** - ${step.description}`));
  lines.push("");

  lines.push(`### ${h.faq}`, "");
  for (const group of t.faq.groups) {
    // The index keeps the questions clients ask first (pricing, delivery, rights); the full file has every topic.
    if (!full && group.key !== "pricing") continue;
    if (full) lines.push(`#### ${group.label}`, "");
    for (const item of group.items) lines.push(`- **${item.q}** ${item.a}`);
    lines.push("");
  }

  lines.push(`### ${h.training}`, "");
  lines.push(`- **${t.training.cards.individual.title}** - ${t.training.cards.individual.featureSummary} ${absoluteUrl(`${trainingPath(lang)}/individual`)}`);
  lines.push(`- **${t.training.cards.team.title}** - ${t.training.cards.team.featureSummary} ${absoluteUrl(`${trainingPath(lang)}/team`)}`);
  lines.push("");

  lines.push(`### ${h.pages}`, "");
  lines.push(`- ${t.legal.home}: ${absoluteUrl(homePath(lang))}`);
  lines.push(`- ${t.header.services}: ${absoluteUrl(servicesPath(lang))}`);
  lines.push(`- ${t.header.projects}: ${absoluteUrl(projectsPath(lang))}`);
  lines.push(`- ${t.header.portfolio}: ${absoluteUrl(portfolioPath(lang))}`);
  lines.push(`- ${t.header.training}: ${absoluteUrl(trainingPath(lang))}`);
  lines.push(`- ${t.header.contact}: ${absoluteUrl(contactProcessPath(lang))}`);
  lines.push("");

  return lines.join("\n");
}

function head() {
  return [
    "# DreamTeam — AI Video Production",
    "",
    `> ${getDictionary("en").seo.organizationDescription}`,
    "",
    `- Website: ${absoluteUrl("/en")} (English) · ${absoluteUrl("/bg")} (Bulgarian)`,
    `- Email: ${EMAIL_PRIMARY.label}`,
    `- Profiles: ${SOCIAL_LINKS.map((social) => social.href).join(", ")}`,
    `- Full brief with every service, case study and FAQ in both languages: ${absoluteUrl("/llms-full.txt")}`,
    "",
  ].join("\n");
}

/** `/llms.txt`: the index - the English brief and a Bulgarian summary. */
export function llmsIndex() {
  const bg = getDictionary("bg");
  return [
    head(),
    section("en", false),
    `## ${LANGUAGE_NAME.bg}`,
    "",
    `> ${bg.seo.organizationDescription}`,
    "",
    bg.hero.seoHeading,
    "",
    ...services("bg").map((service) => `- **${service.title}** - ${service.seoDescription} ${service.url}`),
    "",
  ].join("\n");
}

/** `/llms-full.txt`: everything, in both languages. */
export function llmsFull() {
  return [head(), section("en", true), section("bg", true)].join("\n");
}

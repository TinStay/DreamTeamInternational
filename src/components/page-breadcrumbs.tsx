"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { homePath } from "@/lib/routes";
import { absoluteUrl, breadcrumbList, jsonLd } from "@/lib/seo";
import { getServiceIconBySlug } from "@/lib/services/constants";
import { isProjectKey } from "@/lib/projects";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcramb";

const dot = (
  <div className="mx-1 size-1 rounded-full bg-zinc-400 dark:bg-zinc-600" />
);

function segmentToLabel(
  segment: string,
  t: ReturnType<typeof useLanguage>["t"]
) {
  switch (segment) {
    case "portfolio":
      return t.header.portfolio;
    case "projects":
      return t.header.projects;
    case "contact":
      return t.header.contact;
    case "training":
      return t.header.training;
    case "services":
      return t.header.services;
    case "pricing":
      return t.header.pricingPage;
    case "individual":
      return t.training.cards.individual.title;
    case "skool":
      return t.training.cards.skool.title;
    case "team":
    case "corporate":
      return t.training.cards.team.title;
    case "privacy":
      return t.legal.privacyTitle;
    case "terms":
      return t.legal.termsTitle;
    default: {
      // Project slug -> client name (e.g. "boleron" -> "Boleron").
      if (isProjectKey(segment)) return t.projects.items[segment].name;
      // Service slug -> service title (e.g. "ai-video" -> "AI Видео Продукция").
      const icon = getServiceIconBySlug(segment);
      const service = icon
        ? t.services.items.find((item) => item.imgSrc === icon)
        : undefined;
      if (service) return service.title;
      return segment
        .split("-")
        .map((s) => s.slice(0, 1).toUpperCase() + s.slice(1))
        .join(" ");
    }
  }
}

export function PageBreadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  const { language, t } = useLanguage();

  const parts = pathname.split("/").filter(Boolean);
  const isLocalizedHome =
    pathname === "/en" || pathname === "/bg" || pathname === "/";

  if (isLocalizedHome) return null;

  const langPrefix = homePath(language);
  const trimmed =
    parts[0] === "en" || parts[0] === "bg" ? parts.slice(1) : parts;
  const crumbs = trimmed.map((seg, idx) => {
    const href = `${langPrefix}/${trimmed.slice(0, idx + 1).join("/")}`;
    return { seg, href, label: segmentToLabel(seg, t) };
  });

  // The same trail as structured data (rendered on the server like the rest of this component), so every inner
  // page carries a BreadcrumbList without each page building its own.
  const trail = breadcrumbList([
    { name: t.legal.home, url: absoluteUrl(langPrefix) },
    ...crumbs.map((c) => ({ name: c.label, url: absoluteUrl(c.href) })),
  ]);

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(trail)} />
    <Breadcrumb className={cn("mt-2 mb-5 sm:mt-0", className)}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={langPrefix} aria-label={t.legal.home}>
              <Home className="size-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={`${c.href}-${c.seg}`} className="inline-flex items-center">
              <BreadcrumbSeparator>{dot}</BreadcrumbSeparator>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{c.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={c.href}>{c.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
    </>
  );
}


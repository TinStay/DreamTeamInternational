import { getDictionary, type Language } from "@/lib/i18n/config";
import { EMAIL_PRIMARY, GOOGLE_REVIEWS, PHONE_PRIMARY } from "@/lib/contact-info";
import { PARTNERS } from "@/lib/partners";
import { youtubeThumbnailUrl } from "@/lib/portfolio-highlights";
import { PROJECTS, type Project } from "@/lib/projects";
import { projectPath, projectsPath, servicePath, trainingPath } from "@/lib/routes";
import { ORGANIZATION_ID, OG_IMAGE_PATH, SITE_URL, WEBSITE_ID, absoluteUrl } from "@/lib/seo";
import { getServiceSlug } from "@/lib/services/constants";
import { SOCIAL_LINKS } from "@/lib/social-links";

/*
 * The structured data (JSON-LD) the pages render, built from the same
 * dictionaries and data the pages themselves read, so it can never drift
 * from what is on the page: the organization + website graph in the root
 * layout, a `Service` per service page, a case study's `WebPage` +
 * `VideoObject` + client `Organization`, and the lists on the listings
 * (`ItemList`s of services, case studies, trainings). Every node points its
 * `provider` / `publisher` at the one organization `@id`, so search engines
 * and AI answer engines connect the pages to the company. Server-side only
 * (it imports the catalogue); the client-safe helpers are in `seo.ts`.
 */

const CONTEXT = "https://schema.org";

/** Where the company sells: named so an engine can match "in Bulgaria", "in Europe", "in the US" alike. */
const AREA_SERVED = [
  { "@type": "Country", name: "Bulgaria" },
  { "@type": "Place", name: "Europe" },
  { "@type": "Country", name: "United States" },
  "Worldwide",
];
const LANGUAGES = ["Bulgarian", "English"];

const telephone = PHONE_PRIMARY.href.replace(/^tel:/, "");

/** The services with their slugs, in the dictionary's order. */
function services(lang: Language) {
  return getDictionary(lang).services.items.flatMap((item) => {
    const slug = getServiceSlug(item.imgSrc);
    return slug ? [{ ...item, slug, url: absoluteUrl(servicePath(lang, slug)) }] : [];
  });
}

/** A `Service` node for a service page (the `@id` is the page + `#service`). */
export function serviceNode(lang: Language, slug: string) {
  const service = services(lang).find((item) => item.slug === slug);
  if (!service) return null;
  return {
    "@type": "Service",
    "@id": `${service.url}#service`,
    name: service.title,
    serviceType: service.modal.eyebrow,
    description: service.seoDescription,
    url: service.url,
    inLanguage: lang,
    provider: { "@id": ORGANIZATION_ID },
    areaServed: AREA_SERVED,
    availableLanguage: LANGUAGES,
  };
}

/** The organization (a `ProfessionalService` - a business with an address) and the website, for the root layout. */
export function organizationGraph(lang: Language) {
  const t = getDictionary(lang);
  return {
    "@context": CONTEXT,
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": ORGANIZATION_ID,
        name: "DreamTeam",
        alternateName: ["DreamTeam AI Video Production", "DreamTeam Video", "Дрийм Тийм"],
        url: SITE_URL,
        logo: absoluteUrl("/logo/logo_short_black.png"),
        image: absoluteUrl(OG_IMAGE_PATH),
        description: t.seo.organizationDescription,
        slogan: t.hero.subtitle,
        email: EMAIL_PRIMARY.label,
        telephone,
        address: {
          "@type": "PostalAddress",
          streetAddress: t.seo.streetAddress,
          addressLocality: t.seo.city,
          addressCountry: "BG",
        },
        hasMap: GOOGLE_REVIEWS.mapUrl,
        foundingLocation: { "@type": "Place", name: `${t.seo.city}, ${t.seo.country}` },
        areaServed: AREA_SERVED,
        knowsLanguage: ["bg", "en"],
        knowsAbout: t.seo.topics,
        sameAs: [...SOCIAL_LINKS.map((social) => social.href), GOOGLE_REVIEWS.mapUrl],
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "sales",
            telephone,
            email: EMAIL_PRIMARY.label,
            availableLanguage: LANGUAGES,
            areaServed: "Worldwide",
          },
        ],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: t.services.metaTitle,
          itemListElement: services(lang).map((service) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              "@id": `${service.url}#service`,
              name: service.title,
              description: service.seoDescription,
              url: service.url,
            },
          })),
        },
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE_URL,
        name: "DreamTeam",
        description: t.seo.home.description,
        inLanguage: ["bg", "en"],
        publisher: { "@id": ORGANIZATION_ID },
      },
    ],
  };
}

/** The `/services` listing: every service as a list item, each a full `Service` node. */
export function servicesListGraph(lang: Language) {
  const t = getDictionary(lang);
  return {
    "@context": CONTEXT,
    "@type": "ItemList",
    name: t.services.metaTitle,
    itemListElement: services(lang).map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: service.url,
      name: service.title,
      item: serviceNode(lang, service.slug),
    })),
  };
}

/** The share / schema image of a case study: the film's YouTube poster, else the branded share image. */
export function projectImage(project: Project) {
  return project.videoId ? youtubeThumbnailUrl(project.videoId) : absoluteUrl(OG_IMAGE_PATH);
}

/**
 * A case study: the page, about the client (an `Organization` with its site), with the project's film as a
 * `VideoObject` when it is on YouTube (its poster + embed; `uploadDate` only once the project carries `published`).
 */
export function caseStudyGraph(project: Project, lang: Language) {
  const t = getDictionary(lang);
  const item = t.projects.items[project.id];
  const partner = PARTNERS.find((candidate) => candidate.id === project.partnerId);
  const url = absoluteUrl(projectPath(lang, project.id));
  const name = `${item.name} — ${item.headline}`;
  const image = projectImage(project);
  const video = project.videoId
    ? {
        "@type": "VideoObject",
        "@id": `${url}#video`,
        name,
        description: item.description,
        thumbnailUrl: [image],
        embedUrl: `https://www.youtube.com/embed/${project.videoId}`,
        contentUrl: `https://www.youtube.com/watch?v=${project.videoId}`,
        inLanguage: lang,
        publisher: { "@id": ORGANIZATION_ID },
        ...(project.published ? { uploadDate: project.published } : {}),
      }
    : null;
  return {
    "@context": CONTEXT,
    "@graph": [
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name,
        description: item.description,
        inLanguage: lang,
        isPartOf: { "@id": WEBSITE_ID },
        publisher: { "@id": ORGANIZATION_ID },
        about: { "@type": "Organization", name: item.name, ...(partner?.href ? { url: partner.href } : {}) },
        primaryImageOfPage: { "@type": "ImageObject", url: image },
        keywords: item.tags.join(", "),
        ...(video ? { mainEntity: { "@id": video["@id"] } } : {}),
      },
      ...(video ? [video] : []),
    ],
  };
}

/** The `/projects` listing: a collection page whose list is every case study. */
export function projectsCollectionGraph(lang: Language) {
  const t = getDictionary(lang);
  const url = absoluteUrl(projectsPath(lang));
  return {
    "@context": CONTEXT,
    "@type": "CollectionPage",
    "@id": url,
    url,
    name: t.projects.metaTitle,
    description: t.projects.metaDescription,
    inLanguage: lang,
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORGANIZATION_ID },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: PROJECTS.map((project, index) => {
        const item = t.projects.items[project.id];
        return {
          "@type": "ListItem",
          position: index + 1,
          url: absoluteUrl(projectPath(lang, project.id)),
          name: `${item.name} — ${item.headline}`,
          image: projectImage(project),
        };
      }),
    },
  };
}

/** The trainings as `Course`s (the two on offer - the Skool course stays hidden with its card). */
export function trainingGraph(lang: Language) {
  const t = getDictionary(lang);
  const courses = [
    { slug: "individual", card: t.training.cards.individual },
    { slug: "team", card: t.training.cards.team },
  ];
  return {
    "@context": CONTEXT,
    "@type": "ItemList",
    name: t.training.metaTitle,
    itemListElement: courses.map(({ slug, card }, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Course",
        name: card.title,
        description: card.featureSummary,
        url: absoluteUrl(`${trainingPath(lang)}/${slug}`),
        inLanguage: lang,
        provider: { "@id": ORGANIZATION_ID },
      },
    })),
  };
}

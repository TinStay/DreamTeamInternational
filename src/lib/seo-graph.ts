import { BRAND_NAME, LEGAL_ENTITY } from "@/lib/brand";
import { getDictionary, LOCALES, type Language } from "@/lib/i18n/config";
import { EMAIL_PRIMARY, GOOGLE_REVIEWS, PHONE_PRIMARY } from "@/lib/contact-info";
import { PARTNERS } from "@/lib/partners";
import { youtubeThumbnailUrl } from "@/lib/portfolio-highlights";
import { AUDIENCES, type Audience, formatPrice } from "@/lib/pricing";
import { planFacts, priceHighlights, type PlanFacts } from "@/lib/pricing-summary";
import { PROJECTS, type Project } from "@/lib/projects";
import { pricingPath, projectPath, projectsPath, servicePath, trainingPath } from "@/lib/routes";
import { ORGANIZATION_ID, OG_IMAGE_PATH, SITE_URL, WEBSITE_ID, absoluteUrl } from "@/lib/seo";
import { SERVICE_ICONS, getServiceSlug } from "@/lib/services/constants";
import { SOCIAL_LINKS } from "@/lib/social-links";

/*
 * The structured data (JSON-LD) the pages render, built from the same
 * dictionaries and data the pages themselves read, so it can never drift
 * from what is on the page: the organization + website graph in the root
 * layout, a `Service` per service page, a case study's `WebPage` +
 * `VideoObject` + client `Organization`, the lists on the listings
 * (`ItemList`s of services, case studies, trainings) and the price list on
 * `/pricing` (an `OfferCatalog` of priced `Offer`s, from `lib/pricing.ts`).
 * Every node points its `provider` / `publisher` / `seller` at the one
 * organization `@id`, so search engines and AI answer engines connect the
 * pages - and the prices - to the company. Server-side only (it imports the
 * catalogue); the client-safe helpers are in `seo.ts`.
 */

const CONTEXT = "https://schema.org";

/** Where the company sells - the United States first: named so an engine can match "in the US", "in Europe" alike. */
const AREA_SERVED = [
  { "@type": "Country", name: "United States" },
  { "@type": "Place", name: "Europe" },
  { "@type": "Country", name: "Bulgaria" },
  "Worldwide",
];
const LANGUAGES = ["English", "Bulgarian"];
/** Every price on the site is in US dollars (`lib/pricing.ts`). */
const CURRENCY = "USD";

const telephone = PHONE_PRIMARY.href.replace(/^tel:/, "");

/** The pricing page opened on a plan's audience (`?for=` picks the tab). */
function planUrl(lang: Language, audience: Audience) {
  return absoluteUrl(`${pricingPath(lang)}?for=${audience}`);
}

/**
 * A plan's price as schema.org reads it: a one-time order runs from its base price to its longest length, a
 * subscription is billed monthly or annually (a year for ten months), and a custom plan has no list price.
 */
function planPriceSpecification(lang: Language, plan: PlanFacts) {
  const t = getDictionary(lang).plans;
  if (plan.custom || plan.price === undefined) {
    return { "@type": "PriceSpecification", priceCurrency: CURRENCY, description: t.customPer };
  }
  if (plan.oneTime) {
    return {
      "@type": "PriceSpecification",
      price: plan.price,
      minPrice: plan.price,
      maxPrice: plan.maxPrice,
      priceCurrency: CURRENCY,
      description: t.lengthSlider.hint,
    };
  }
  const unit = (price: number, name: string, billingDuration: string, unitCode: string) => ({
    "@type": "UnitPriceSpecification",
    name,
    price,
    priceCurrency: CURRENCY,
    billingDuration,
    referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode },
  });
  return [
    unit(plan.price, t.billing.monthly, "P1M", "MON"),
    ...(plan.annualTotal ? [unit(plan.annualTotal, t.billing.annual, "P1Y", "ANN")] : []),
  ];
}

/** A plan as an `Offer` - `full` adds the `@id`, everything it includes and leaves out, and the service offered. */
function planOffer(lang: Language, plan: PlanFacts, full: boolean) {
  const t = getDictionary(lang).plans;
  const offer = {
    "@type": "Offer",
    name: plan.name,
    category: t.audience[plan.audience],
    url: planUrl(lang, plan.audience),
    ...(plan.price !== undefined ? { price: plan.price, priceCurrency: CURRENCY } : {}),
    priceSpecification: planPriceSpecification(lang, plan),
  };
  if (!full) return { ...offer, description: plan.for };
  const description = [
    `${plan.for}.`,
    `${plan.volume}.`,
    `${plan.features.join("; ")}.`,
    ...(plan.missing.length ? [`${t.notIncluded} ${plan.missing.join("; ")}.`] : []),
  ].join(" ");
  return {
    "@id": `${absoluteUrl(pricingPath(lang))}#plan-${plan.key}`,
    ...offer,
    description,
    availability: "https://schema.org/InStock",
    seller: { "@id": ORGANIZATION_ID },
    itemOffered: {
      "@type": "Service",
      name: `${BRAND_NAME} ${plan.name}`,
      serviceType: t.eyebrow,
      description: plan.for,
      provider: { "@id": ORGANIZATION_ID },
      areaServed: AREA_SERVED,
    },
  };
}

/** The plans in two catalogues, individual and business (`full` as in `planOffer`). */
function planCatalogs(lang: Language, full: boolean) {
  const t = getDictionary(lang).plans;
  const plans = planFacts(lang);
  return AUDIENCES.map((audience) => ({
    "@type": "OfferCatalog",
    name: `${t.audience[audience]} - ${t.eyebrow}`,
    description: t.note[audience],
    url: planUrl(lang, audience),
    itemListElement: plans.filter((plan) => plan.audience === audience).map((plan) => planOffer(lang, plan, full)),
  }));
}

/**
 * `/pricing`: the page, whose main entity is the whole price list - every plan an `Offer` in USD with its billing
 * (monthly / annual), its volume of video, what it includes and what it leaves out.
 */
export function pricingGraph(lang: Language) {
  const t = getDictionary(lang).plans;
  const url = absoluteUrl(pricingPath(lang));
  return {
    "@context": CONTEXT,
    "@graph": [
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: t.metaTitle,
        description: t.metaDescription,
        inLanguage: lang,
        isPartOf: { "@id": WEBSITE_ID },
        publisher: { "@id": ORGANIZATION_ID },
        about: { "@id": ORGANIZATION_ID },
        mainEntity: { "@id": `${url}#plans` },
      },
      {
        "@type": "OfferCatalog",
        "@id": `${url}#plans`,
        name: t.seoHeading,
        url,
        itemListElement: planCatalogs(lang, true),
      },
    ],
  };
}

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
    // AI video is what the plans on /pricing buy: its price range is theirs.
    ...(service.imgSrc === SERVICE_ICONS.video ? { offers: planPriceRange(lang) } : {}),
  };
}

/** The plans' list prices as one range, for the AI video service. */
function planPriceRange(lang: Language) {
  const prices = priceHighlights();
  return {
    "@type": "AggregateOffer",
    priceCurrency: CURRENCY,
    lowPrice: prices.oneTimeFrom,
    highPrice: prices.highest,
    offerCount: planFacts(lang).filter((plan) => plan.price !== undefined).length,
    url: absoluteUrl(pricingPath(lang)),
  };
}

/** The organization (a `ProfessionalService` - a business with an address) and the website, for the root layout. */
export function organizationGraph(lang: Language) {
  const t = getDictionary(lang);
  const prices = priceHighlights();
  return {
    "@context": CONTEXT,
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": ORGANIZATION_ID,
        name: BRAND_NAME,
        legalName: LEGAL_ENTITY,
        alternateName: ["Keplerbay AI Video Production", "Keplerbay Video"],
        url: SITE_URL,
        logo: absoluteUrl("/keplerbay-logo-v4.png"),
        image: absoluteUrl(OG_IMAGE_PATH),
        description: t.seo.organizationDescription,
        slogan: t.hero.subtitle,
        email: EMAIL_PRIMARY.label,
        telephone,
        // San Francisco, as the footer and the contact section show it (no street yet, so none here either).
        address: {
          "@type": "PostalAddress",
          addressLocality: t.seo.city,
          addressRegion: t.seo.region,
          addressCountry: "US",
        },
        areaServed: AREA_SERVED,
        knowsLanguage: ["en", "bg"],
        knowsAbout: t.seo.topics,
        // The list prices, from a one-time video to the top monthly plan (Enterprise is custom, hence the "+").
        priceRange: `${formatPrice(prices.oneTimeFrom)} - ${formatPrice(prices.highest)}+`,
        currenciesAccepted: CURRENCY,
        // The social profiles (none while they are parked - `SOCIAL_LINKS`) and the Google listing.
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
        // What the company sells: the services, and the plans with their list prices (the full price list, with what
        // each plan includes, is `pricingGraph` on /pricing).
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: BRAND_NAME,
          itemListElement: [
            {
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
            {
              "@type": "OfferCatalog",
              name: t.plans.metaTitle,
              url: absoluteUrl(pricingPath(lang)),
              itemListElement: planCatalogs(lang, false),
            },
          ],
        },
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE_URL,
        name: BRAND_NAME,
        description: t.seo.home.description,
        inLanguage: [...LOCALES],
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

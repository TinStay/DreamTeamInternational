export const en = {
  header: {
    process: "Process",
    portfolio: "Portfolio",
    services: "Services",
    pricing: "Get a Quote",
    contact: "Contact",
    quoteCta: "Request a quote",
    contactCta: "Contact us",
    training: "Training",
    projects: "Customers",
    pricingPage: "Pricing",
    // The mega menu's tabs (`site-header.tsx`): Explore (home), the video services, Pricing, and "Other" for the rest.
    nav: {
      explore: "Explore",
      socialAds: "Social Media Ads",
      corporate: "Corporate Videos",
      tvAds: "TV Ads",
      productVideos: "Product Videos",
      brandMascots: "Brand Mascots",
      other: "Custom Services"
    },
    login: "Log in",
    signup: "Sign up",
    pricingItems: {
      individual: "Individual",
      business: "Business"
    },
    // The English mega menu's first column (`mega-header.tsx`) - the home page's sections, until there is an About page.
    about: "About Us",
    aboutItems: {
      stats: "Our numbers",
      reviews: "Reviews",
      process: "How we work",
      faq: "FAQ"
    },
    phoneCopy: "Copy phone number",
    emailCopy: "Copy email",
    phoneCopied: "Copied!"
  },
  hero: {
    titleBefore: "Your",
    titleGlow: "imagination",
    titleAfter: "is the limit.",
    seoHeading:
      "DreamTeam - AI video production and AI-powered video ads for brands in Bulgaria and worldwide",
    subtitle: "If you can imagine it, we can deliver it - AI video and media production for your brand.",
    cta1: "Request a quote",
    cta2: "View Our Work",
    // The English home page's tiger hero (`en-hero-section.tsx`).
    // The tiger hero's copy on the English home page (`en-hero-section.tsx`).
    mission: {
      title: "On a mission",
      text:
        "Our mission is to bring great AI video to everyone - without pricey subscriptions, a learning curve, endless prompting or budgets burned on credits and platforms. You give us the direction; we deliver the best video for your personal project, your business, or whatever you need. Our team has delivered hundreds of videos for clients around the world.",
      nudge: "Still not convinced? See for yourself."
    },
    tiger: {
      cta: "Let’s talk",
      hint: "Move or touch to wake it",
      trustedBy: "Trusted by partners in the USA, Europe and Worldwide",
      regions: {
        usa: "USA",
        europe: "Europe",
        worldwide: "Worldwide"
      }
    }
  },
  // The plans page (`/pricing`, `components/pricing/`) - the client's "AI Video Subscription Plans" file; the numbers are
  // in `lib/pricing.ts`. `{x}` placeholders are filled in by the cards.
  plans: {
    metaTitle: "AI Video Subscription Plans & Pricing | DreamTeam",
    metaDescription:
      "AI video subscription plans for creators and businesses - from a one-time $299 video to monthly plans with voiceover, subtitles, sound design and revisions included. No filming needed.",
    eyebrow: "AI video subscription",
    title: "Next-generation video, every month",
    subtitle: {
      individual: "AI-produced videos for creators and personal projects. No filming, no crew - just share your idea.",
      business: "Professional AI-produced video ads for your business. No filming, no crew - just send a brief."
    },
    audience: {
      label: "Plan type",
      individual: "Individual",
      business: "Business"
    },
    billing: {
      label: "Billing period",
      monthly: "Monthly",
      annual: "Annual"
    },
    off: "{n}% off",
    mostPopular: "Most popular",
    oneTimeTag: "One-time",
    perMonth: "per month",
    perMonthAnnual: "per mo · annual",
    oneTimePer: "one-time · no subscription",
    customPrice: "Let's talk",
    customPer: "custom volume & terms",
    saveAnnual: "Save {amount}/yr ({n}%) with annual billing",
    savedAnnual: "You save {amount} a year · billed {total}/yr",
    vsOneTime: "Save {n}% vs one-time orders",
    notIncluded: "Not included:",
    buy: {
      notConfigured: "Payments aren't switched on yet - please contact us and we'll set your pack up by hand.",
      error: "We couldn't start the checkout. Please try again."
    },
    cta: {
      subscribe: "Get started",
      oneTime: "Order now",
      custom: "Contact us"
    },
    scriptAddon: "Scriptwriting - available as add-on",
    scriptTip: {
      title: "$100 per 30 sec of video",
      text: "Without it, you provide the script or voiceover text.",
      label: "Scriptwriting add-on price"
    },
    tiers: {
      personal: {
        name: "Personal",
        for: "One video, one payment - for personal projects, gifts & occasions",
        volume: "1 video",
        volumeUnit: "up to 20 seconds",
        volumeNote: "Longer? +$119 per extra 10 seconds",
        features: [
          "No subscription - order once",
          "720p HD resolution",
          "Any aspect ratio - 1 per video (9:16 · 16:9 · 1:1 · 4:5)",
          "Social-media ready quality",
          "Voiceover included - 1 language per video",
          "1 free revision"
        ],
        missing: ["Subtitles", "Sound design", "Color grading", "Scriptwriting - available as add-on"]
      },
      creator: {
        name: "Creator",
        for: "Consistent content for creators & influencers",
        volume: "40 sec",
        volumeUnit: "of video / month",
        volumeNote: "≈ two 20-second videos",
        features: [
          "1080p Full HD resolution",
          "Any aspect ratio - 1 per video (9:16 · 16:9 · 1:1 · 4:5)",
          "Social-media ready quality",
          "Voiceover included - 1 language per video",
          "Subtitles included",
          "1 free revision per video"
        ],
        missing: ["Sound design", "Color grading", "Scriptwriting - available as add-on"]
      },
      pro: {
        name: "Pro",
        for: "More content for serious creators & personal brands",
        volume: "1 min",
        volumeUnit: "of video / month",
        volumeNote: "≈ four 15-second videos",
        features: [
          "1080p Full HD resolution",
          "Any aspect ratio - 1 per video (9:16 · 16:9 · 1:1 · 4:5)",
          "Social-media ready quality",
          "Voiceover included - 1 language per video",
          "Subtitles included",
          "Sound design",
          "Color grading",
          "2 free revisions per video"
        ],
        missing: ["Scriptwriting - available as add-on"]
      },
      local: {
        name: "Local",
        for: "Simple, effective videos for solo traders, consultants & small businesses",
        volume: "1.5 min",
        volumeUnit: "of video / month",
        volumeNote: "≈ six 15-second or three 30-second videos",
        features: [
          "1080p Full HD resolution",
          "Any aspect ratio - 1 per video (9:16 · 16:9 · 1:1 · 4:5)",
          "Social-media ready quality",
          "Voiceover included - 1 language per video",
          "Subtitles included",
          "Sound design",
          "Color grading",
          "2 free revisions per video"
        ],
        missing: ["Enhanced quality + advanced effects", "Scriptwriting - available as add-on", "Dedicated producer"]
      },
      brand: {
        name: "Brand",
        for: "Stronger concepts & ad campaigns for growing mid-sized businesses",
        volume: "3 min",
        volumeUnit: "of video / month",
        volumeNote: "≈ six 30-second videos",
        features: [
          "Up to 4K resolution",
          "Any aspect ratio - 1 per video (9:16 · 16:9 · 1:1 · 4:5)",
          "Enhanced quality + advanced effects",
          "Scriptwriting included",
          "Voiceover included - 1 language per video",
          "Subtitles included",
          "Sound design",
          "Color grading",
          "3 free revisions per video"
        ],
        missing: ["Cinematic quality + premium effects", "Dedicated producer"]
      },
      enterprise: {
        name: "Enterprise",
        for: "Cinematic productions at scale for established companies, brands & agencies",
        volume: "Custom",
        volumeUnit: "monthly volume",
        volumeNote: "Built around your campaigns",
        features: [
          "Up to 4K resolution",
          "Any aspect ratio - 1 per video (9:16 · 16:9 · 1:1 · 4:5)",
          "Cinematic quality + premium effects",
          "Full creative concept + campaign strategy",
          "Voiceover included - 1 language per video",
          "Subtitles included",
          "Sound design",
          "Color grading",
          "4+ free revisions per video",
          "Dedicated producer",
          "Priority delivery",
          "Custom terms & invoicing"
        ],
        missing: []
      }
    },
    everyPlan: {
      title: "Every plan includes",
      items: [
        "No filming or footage needed",
        "One aspect ratio per video, your choice",
        "Delivered in 3-10 days, by complexity",
        "Unlimited requests, one in production at a time",
        "You own all videos & source files",
        "Pause or cancel anytime"
      ],
      revisionTerm: "1 revision",
      revisionText:
        "= one round of changes per video, covering up to 30% of the video's length (e.g. up to 9 seconds of a 30-second video). Fixes for errors on our side are always free and don't count as a revision.",
      scriptTerm: "Scriptwriting add-on",
      scriptText: "= $100 per 30 seconds of video (included in Brand). Without it, you provide the script or voiceover text."
    },
    note: {
      individual:
        "Prices in USD. Individual plans are for personal and creator use - advertising a business requires a Business plan.",
      business: "Prices in USD. Business plans include full commercial use."
    }
  },
  // The English home page's rail of video categories, right after the hero (`video-pack-section.tsx`, `lib/video-pack.ts`).
  videoPack: {
    title: "Get your AI video pack now",
    subtitle:
      "Professional AI videos made by our experienced team - in one click. No credits, no prompting, no learning curve: tell us what you need, and we deliver.",
    preview: "Preview",
    startOne: "Start with one video",
    orSubscribe: "or get a subscription",
    pauseAnytime: "pause or cancel anytime",
    previous: "Previous videos",
    next: "Next videos",
    items: {
      socialAds: {
        title: "Social Media Ads",
        line: "Scroll-stopping Reels, TikToks and Shorts built to convert"
      },
      tvAds: {
        title: "TV Ads",
        line: "Broadcast-ready commercials with cinematic quality"
      },
      corporate: {
        title: "Corporate Videos",
        line: "Brand films, explainers and presentations that build trust"
      },
      brandCampaigns: {
        title: "Brand Video Campaigns",
        line: "A full series of on-brand videos for every channel"
      },
      ugc: {
        title: "UGC",
        line: "Authentic creator-style ads, without hiring creators"
      }
    }
  },
  // The English home page's "find the package" grid (`packages-section.tsx`), in place of the services + quote wizard.
  // The sign-up / log-in popup (`auth-dialog.tsx`), opened by the header's Sign up and Log in.
  signup: {
    tag: "IzI Video",
    filmTitle1: "Your next video",
    filmTitle2: "starts here",
    signupCopy: {
      title1: "Create your",
      title2: "account",
      subtitle: "Start with one video, or a subscription you can pause anytime.",
      google: "Sign up with Google",
      microsoft: "Sign up with Microsoft",
      email: "Continue with email",
      switchLead: "Already have an account?",
      switchAction: "Log in"
    },
    loginCopy: {
      title1: "Welcome",
      title2: "back",
      subtitle: "Log in to your IzI Video account.",
      google: "Log in with Google",
      microsoft: "Log in with Microsoft",
      email: "Log in with email",
      switchLead: "New to IzI Video?",
      switchAction: "Sign up"
    },
    google: "Google",
    microsoft: "Microsoft",
    or: "or",
    emailLabel: "Email address",
    emailPlaceholder: "you@company.com",
    consent1: "I agree to the",
    terms: "Terms of Use",
    consent2: ", acknowledge the",
    privacy: "Privacy Policy",
    consent3: ", and confirm I'm at least 18 years old.",
    consentHint: "Please tick the box above to continue.",
    sentTitle: "Check your inbox.",
    sentBefore: "We sent a one-time sign-in link to",
    sentAfter: ". Open it on this device to finish - it works once and expires soon.",
    providerOff: "{provider} sign-in isn't switched on yet. Please use another option or your email.",
    noAccount: "We couldn't find an account with that email. Sign up first.",
    errorGeneric: "Something went wrong. Please try again.",
    notReady: "Sign-in isn't available just yet. Please check back soon.",
    close: "Close"
  },
  // The signed-in header menu and the account pages (/account, /profile, /my-projects).
  account: {
    menu: "Account menu",
    logout: "Sign out",
    metaTitle: "Manage account | IzI Video",
    profileMetaTitle: "Your profile | IzI Video",
    projectsMetaTitle: "Your Projects | IzI Video",
    eyebrow: "Your account",
    manageTitle1: "Manage",
    manageTitle2: "account",
    currentPlan: "Current plan",
    timeLeft: "Video time left",
    noTime: "No video time yet. Buy a pack and your seconds appear here at once.",
    upgrade: "Upgrade",
    buyPack: "Buy a pack",
    noPlan: "No pack yet",
    yourProjects: "Your Projects",
    viewProfile: "View profile",
    manageAccount: "Manage account",
    signedInWith: "Signed in with",
    email: "Email",
    memberSince: "Member since",
    deleteAccount: "Need your account deleted? Contact us",
    ordersEmpty: "Nothing here yet. Your orders and finished videos will appear here.",
    startOrder: "Start with one video",
    providers: { google: "Google", azure: "Microsoft", email: "Email link" },
    // The header's Your Projects button and the /my-projects page.
    projectsButton: "Your Projects",
    projectsPage: {
      trySample: "Want to see how it will look? Preview with sample projects",
      purchased: "Payment received - thank you! Your video seconds are being added to your account and will show in the menu in a few seconds. You can submit your first project now.",
      sampleBanner: "Sample projects - made up, to preview this page.",
      subtitle: "Every video we're making for you, and every one we've delivered. Select a project to see its details and timeline.",
      status: {
        brief: "Brief received",
        scripting: "Scripting",
        production: "In production",
        review: "In review",
        delivered: "Delivered"
      },
      due: "Due",
      length: "Length",
      format: "Format",
      started: "Started",
      tbd: "To be confirmed",
      tabs: { overview: "Overview", timeline: "Timeline", files: "Files", comments: "Comments" },
      askedFor: "What you told us",
      revisionsTitle: "Revisions",
      left: "left",
      noRevisions: "No revisions requested yet.",
      requestRevision: "Request a revision",
      producer: "Your producer",
      teamName: "The IzI Video team",
      producerLine: "Questions? We reply within a working day.",
      messageUs: "Message us",
      whereWeAre: "Where we are",
      nextStep: "Next step",
      nextStepDefault: "We will let you know here as soon as there is something for you to review.",
      notReady: "Your video will appear here as soon as it's ready.",
      noFiles: "Your files will appear here when the video is delivered.",
      download: "Download",
      panelDescription: "Details, brief, revisions and timeline of this project.",
      comments: {
        intro: "Questions, notes and revision requests go here. We reply on this page - it is not a chat, so there is no need to wait online.",
        loading: "Loading comments…",
        empty: "No comments yet. Ask a question or leave a note for the team - we reply here.",
        emptyTeam: "No comments yet from the client.",
        label: "Write a comment",
        placeholder: "Write a comment for the team - a question, a note, a revision request…",
        placeholderTeam: "Reply to the client - they see this on their project.",
        post: "Post comment",
        error: "We couldn't post your comment. Please try again.",
        you: "You",
        client: "Client",
        teamName: "IzI Video team",
        teamBadge: "Team",
        revisionPrefill: "Revision request: "
      },
      submit: {
        button: "Submit a project",
        title1: "Submit a",
        title2: "project",
        kind: "AI video",
        submit: "Submit project",
        close: "Close",
        error: "We couldn't save your project. Please check your connection and try again.",
        done: "Thank you - your project is in. We're reviewing your brief and will confirm the details within one working day.",
        doneNoFiles: "Your project is saved, but we couldn't send your attached files. Please email them to info@dreamteam.technology and mention the project name.",
        nextStep: "We're reviewing your brief and will confirm the details within one working day.",
        available: "Video time available",
        cost: "This project uses {needed} of your {available}.",
        notEnough: "This project needs {needed}, but you have {available}.",
        buyPack: "Buy a pack",
        insufficient: "You don't have enough video time for this length. Buy a pack or choose a shorter video.",
        nameLabel: "Project name (optional)",
        namePlaceholder: "For example: Spring campaign reel",
        autoTitleDefault: "New video project",
        autoTitles: {
          sales: "Sales video",
          awareness: "Brand awareness video",
          launch: "Product launch video",
          trust: "Image & trust video",
          education: "Educational video",
          other: "New video project"
        } as Record<string, string>,
        answers: {
          goal: "Goal",
          script: "Script",
          length: "Length",
          format: "Format",
          voiceover: "Voice-over",
          platforms: "Where it runs",
          examples: "Examples",
          deadline: "Deadline",
          notes: "Notes",
          files: "Files you sent"
        }
      },
      close: "Close"
    }
  },
  // The About page (/about), linked from the footer and the menu.
  // The announcement bar above every English page (`components/promo-bar.tsx`).
  promo: {
    badge: "-20%",
    text: "We're launching in the US - take 20% off your first order.",
    short: "20% off your first order",
    cta: "Claim discount",
    ctaShort: "Claim"
  },
  about: {
    metaTitle: "About us | IzI Video",
    metaDescription:
      "IzI Video is an AI video production company: we write, direct and produce your video with the best AI tools - for brands and creators in the USA, Europe and worldwide.",
    eyebrow: "About us",
    title1: "We make",
    title2: "AI video",
    crossed: ["no learning curve", "no prompts"],
    imageAlt: "The San Francisco skyline at dusk under the Bay Bridge",
    story:
      "We're a team of AI video professionals from across the world, with roots in entrepreneurship, IT, video production, filmmaking and editing. At IzI Video, we take your idea, write it, direct it and produce the finished film with the best AI tools - so you don't need to write a single prompt, learn any software or hire a crew. Social media ads, corporate videos, TV ads, product videos, brand mascots, launch and explainer videos, UGC-style ads, real estate and music videos: all made fully online, for brands and creators in the USA, Europe and worldwide. Choose a pack, send your brief, and get your video in 3-10 days - yours to use anywhere. Our team is ready to make your next video.",
    team: {
      eyebrow: "Our team",
      title1: "The people behind",
      title2: "the videos",
      linkedin: "LinkedIn profile of {name}"
    },
    mission: {
      eyebrow: "Our mission",
      title: "Great AI video, without the complexity",
      text: "To put great AI video within reach of everyone. No pricey subscriptions, no learning curve, no endless prompting, no budgets burned on credits and platforms. You bring the direction; we deliver the finished video - for your business, your brand or your own project."
    },
    vision: {
      eyebrow: "Our vision",
      title: "AI video of every kind, easy for everyone",
      text: "A world where every business and every individual can create any kind of video - ads, films, mascots, product stories - as easily as sending a message. Accessible in price, simple in process, and fast enough to be part of everyday work."
    },
    updates: {
      eyebrow: "Latest updates",
      tag: "New",
      title: "We're launching in the US",
      text: "IzI Video is opening to clients across the United States. Create your account now and take 20% off your first order.",
      cta: "Claim your 20% discount on your first order"
    },
    hiring: {
      eyebrow: "Join our team",
      badge: "Coming soon",
      title: "We're hiring soon",
      text: "We're growing. Roles for AI video producers, editors and creative directors will appear here - check back soon.",
      cta: "Check upcoming options"
    }
  },
  // "Powered by the world's best AI" under the packages (`components/ai-partners-section.tsx`).
  aiPartners: {
    eyebrow: "AI partners",
    title1: "Technology",
    title2: "we use",
    line: "Partnering with global industry leaders to create your videos."
  },
  // /careers: the roles we will open soon (`components/careers-page-view.tsx`).
  careers: {
    title: "Careers",
    metaTitle: "Careers | IzI Video",
    metaDescription:
      "Join IzI Video: upcoming roles for a Partnership Manager, AI Video Filmmaker, Marketing Manager and Sales Manager. Fully remote, working with clients in the USA, Europe and worldwide.",
    eyebrow: "Careers",
    title1: "Build the future of",
    title2: "AI video with us",
    lead: "We're growing and opening new roles soon. Here is what's coming - register your interest and we'll write to you the moment a role opens.",
    badge: "Opening soon",
    tag: "Fully remote",
    apply: "Register your interest",
    applySubject: "Career interest: {role}",
    roles: [
      {
        title: "Partnership Manager",
        summary: "Build and grow the relationships with agencies, platforms and brands that bring IzI Video to more people.",
        points: ["Find, pitch and sign new partners", "Plan joint campaigns and co-marketing", "Keep every partnership growing and healthy"]
      },
      {
        title: "AI Video Filmmaker",
        summary: "Turn a client's brief into a finished film with the best AI tools - from script and storyboard to the final cut.",
        points: ["Write, direct and edit AI-made videos", "Choose the right tools for each brief", "Keep the look, sound and story at a high level"]
      },
      {
        title: "Marketing Manager",
        summary: "Grow the IzI Video brand across the USA and Europe with content, campaigns and community.",
        points: ["Plan and run campaigns across channels", "Create content that shows what AI video can do", "Track what works and do more of it"]
      },
      {
        title: "Sales Manager",
        summary: "Turn interest into clients: talk to businesses and creators and guide them from the first question to the first video.",
        points: ["Meet and qualify new leads", "Recommend the right pack for each client", "Close deals and keep clients coming back"]
      }
    ],
    otherTitle: "Don't see your role?",
    otherText: "Tell us who you are and what you'd like to build with us - send your portfolio or profile and we'll keep it on file.",
    otherCta: "Get in touch",
    otherSubject: "Career interest: open application"
  },
  // The team dashboard (/team): every client's projects and the files they submitted.
  team: {
    metaTitle: "Team dashboard | IzI Video",
    eyebrow: "Internal",
    title: "Team",
    title2: "dashboard",
    menu: "Team dashboard",
    sampleBanner: "Sample data - made up, to preview this page.",
    stats: { total: "All projects", new: "New briefs", inWork: "In work", inReview: "In review", delivered: "Delivered", overdue: "Overdue" },
    search: "Search project or client",
    stageFilter: "Filter by stage",
    all: "All",
    sortBy: "Sort by",
    sort: { newest: "Newest first", due: "Due date", client: "Client" },
    cols: { project: "Project", client: "Client", stage: "Stage", due: "Due", submitted: "Submitted", files: "Files", comments: "Comments" },
    reply: "Reply",
    awaiting: "{n} project(s) with a client comment waiting for your reply",
    commentsTitle: "Comments",
    commentsHint: "The client sees your replies on their project, in the Comments tab. This is a thread, not a chat.",
    credits: {
      title: "Video seconds",
      hint: "The client's balance. Add minutes and seconds for a custom pack or a gift, or take some back for a refund.",
      balance: "Balance",
      action: "Add or take back",
      add: "Add",
      take: "Take back",
      minutes: "min",
      seconds: "sec",
      note: "Note",
      notePlaceholder: "Note (for example: Enterprise pack, or refund for the cancelled reel)",
      apply: "Apply",
      done: "Done - the client's balance is updated.",
      error: "We couldn't change the balance. Are you signed in as a team member?"
    },
    empty: "No projects yet. They appear here as soon as a client submits one.",
    noMatch: "No project matches this search or filter.",
    unknownClient: "Unknown client",
    client: "Client",
    emailClient: "Email the client",
    submitted: "Submitted",
    brief: "What the client told us",
    filesTitle: "Files from the client",
    filesHint: "Everything they attached when they submitted the project. Links open for two minutes.",
    noFiles: "The client didn't attach any files.",
    sampleFile: "This is a sample file - real ones download here.",
    fileError: "We couldn't open that file. Please try again.",
    manageTitle: "Manage this project",
    manageHint: "Changes save to the client's Your Projects page right away.",
    stage: "Stage",
    nextStep: "Next step (the client sees this)",
    nextStepHint: "For example: We're generating the scenes. Nothing needed from you right now.",
    producer: "Producer",
    revisionsUsed: "Revisions used",
    included: "included",
    videoId: "Finished video (Bunny video id)",
    save: "Save changes",
    saved: "Saved",
    saveError: "We couldn't save. Are you signed in as a team member? Please try again.",
    popupDescription: "The client's information, brief and files, and the controls to update this project."
  },
  packages: {
    eyebrow: "What we make",
    title1: "Find the package that",
    title2: "fits your needs",
    subtitle: "Every kind of video your brand needs - scripted, produced and delivered by our team. Pick a format, then the plan that fits.",
    getPackage: "Get your package",
    seeExamples: "See examples",
    compare: "Compare all packages",
    custom: "Need something else? Tell us about it",
    items: {
      socialAds: { title: "Social Media Ads", line: "Reels, TikToks and Shorts that stop the scroll" },
      corporate: { title: "Corporate Videos", line: "Brand films, presentations and internal comms" },
      tvAds: { title: "TV Ads", line: "Broadcast-ready commercials with cinematic polish" },
      productVideos: { title: "Product Videos", line: "Your product in any setting, from any angle" },
      brandMascots: { title: "Brand Mascots", line: "A character that becomes the face of your brand" },
      motionGraphics: { title: "Motion Graphics", line: "Type, logos and data that move with purpose" },
      launchVideos: { title: "Launch Videos", line: "Make your product or feature launch land" },
      explainerVideos: { title: "Explainer Videos", line: "Complex ideas made simple in under a minute" },
      ugcAds: { title: "UGC Ads", line: "Creator-style ads, without hiring creators" },
      realEstate: { title: "Real Estate Videos", line: "Homes and developments shown before they're built" },
      musicVideos: { title: "Music Videos", line: "Cinematic visuals for artists and labels" }
    }
  },
  contactPage: {
    metaTitle: "Contact & Process | DreamTeam",
    metaDescription:
      "How we work from brief to delivery, and how to reach DreamTeam for AI video production.",
  },
  // The SEO copy: the home page's title / description / keywords (the layout's defaults too), the organization's
  // description for the structured data and `llms.txt`, the address split for the schema, the topics it knows.
  seo: {
    home: {
      title: "AI Video Production Company in Bulgaria | DreamTeam",
      description:
        "AI video production company in Sofia, Bulgaria: AI-generated video ads, product videos, brand mascots and AI avatars for brands in Bulgaria, Europe and the US. Delivered in 5–12 working days, with full commercial rights.",
      keywords: [
        "AI video production",
        "AI video company",
        "AI video ads",
        "AI video production Bulgaria",
        "AI video production company Europe",
        "product videos",
        "brand mascots",
        "AI avatars",
        "social media video",
        "corporate video",
        "DreamTeam",
      ],
    },
    organizationDescription:
      "DreamTeam is an AI video production company based in Sofia, Bulgaria. It creates AI-generated advertising and brand video - TV and social media ads, product videos, brand mascots, explainer videos and AI avatars - for clients in Bulgaria, across Europe and in the United States, and trains individuals and teams in AI video production.",
    streetAddress: "27–29 Nikola Kopernik St., Floor 2, Office 17",
    city: "Sofia",
    country: "Bulgaria",
    topics: [
      "AI video production",
      "AI-generated video advertising",
      "AI product videos",
      "AI brand mascots",
      "AI avatars",
      "explainer videos",
      "generative AI video",
      "AI images and graphic design",
      "video and image automation",
      "AI video training",
    ],
  },
  // The process, for the package way of working (home, right after the packages; the contact page too).
  process: {
    eyebrow: "The process",
    stepLabel: "Step",
    title1: "How it",
    title2: "works",
    subtitle: "No prompting, no credits, no learning curve. Four simple steps from idea to finished video - we do the heavy lifting.",
    steps: [
      {
        title: "Choose Your Package",
        description: "Pick a one-off video or a monthly plan that matches how much content you need. Pause or cancel anytime.",
        more: [
          "Individual or business plans, billed monthly or annually",
          "A one-off video if you only need a single project",
          "Pause, change or cancel a subscription whenever you like"
        ]
      },
      {
        title: "Send Your Brief",
        description: "Tell us what you want in a few lines - your goal, your audience, any references. No scripts or prompts needed from you.",
        more: [
          "Share your goal, your audience and the feeling you want",
          "Add logos, product photos or reference videos if you have them",
          "Not sure what to write? We ask the right questions for you"
        ]
      },
      {
        title: "We Create",
        description: "Our team writes, directs and produces your video with the best AI tools, adds voiceover, music and subtitles.",
        more: [
          "Script and shot-by-shot storyboard written by our team",
          "Scenes generated and directed with the best AI tools for your idea",
          "Voiceover, music, subtitles and colour finished for you"
        ]
      },
      {
        title: "Review & Receive",
        description: "You watch, request changes within your revisions, and get the final files in 3-10 days - yours to use anywhere.",
        more: [
          "Watch the cut and send your notes in one place",
          "Changes are included within your plan's revisions",
          "Final files in every format you need, with full commercial rights"
        ]
      }
    ]
  },
  portfolio: {
    metaTitle: "AI Video Portfolio | DreamTeam",
    metaDescription:
      "Watch AI videos by IzI Video: social media ads, corporate videos, TV ads, product videos, brand mascots, motion graphics, launch and explainer videos, UGC ads, real estate and music videos.",
    eyebrow: "Portfolio",
    title1: "Our",
    title2: "work",
    subtitle: "Every kind of video we make - pick a category and open any film full screen.",
    play: "Play",
    close: "Close",
    empty: "More films in this category are on their way.",
    categories: {
      all: "All",
      construction: "Construction",
      mascots: "Mascots",
      tv: "Cinema advertising",
      cars: "Cars",
      product: "Product",
      services: "Services",
      animated: "Animated"
    },
    format: {
      all: "All",
      desktop: "Desktop",
      mobile: "Mobile (9:16)",
      ratio169: "16:9",
      ratio916: "9:16",
    },
    pagination: {
      previous: "Previous",
      next: "See more",
      page: "Page"
    }
  },
  pricing: {
    title1: "Simple",
    title2: "Pricing",
    subtitle: "Choose the package that fits your brand's vision.",
    order: "Order Now",
    example: "See Example",
    custom: "Custom Package",
    customPlaceholder: "Tell us about your project...",
    customDesc: "Need something unique? Describe your project and we'll craft a tailored offer.",
    perProject: "per project",
    popular: "Most Popular"
  },
  partners: {
    title: "Trusted By"
  },
  projects: {
    metaTitle: "Customers & Case Studies | DreamTeam",
    metaDescription:
      "The brands DreamTeam makes AI video for, and case studies of campaigns we produced for clients in software, products and construction - goals, results and where each video ran.",
    title1: "Our",
    title2: "Customers",
    // The Customers page (/projects): the logo wall, then the case studies as windows.
    customers: {
      eyebrow: "Customers",
      title1: "Brands that",
      title2: "trust us",
      subtitle: "From software to construction - the companies we make AI video for.",
      studiesTitle1: "Case",
      studiesTitle2: "studies",
      studiesSubtitle: "A closer look at videos we produced for clients, each with its own story. Hover a window to watch.",
      ctaPricing: "See pricing",
      ctaWork: "Our work"
    },
    subtitle:
      "A closer look at videos we produced for clients - software, products and construction, each with its own story.",
    explore: "Explore the case studies",
    categoriesLabel: "Categories",
    cta: "Request a quote",
    viewProject: "View case study",
    visitSite: "Visit website",
    viewAll: "View all case studies",
    scrollHint: "Scroll to explore",
    watch: "Watch the video",
    similar: "Want a similar video?",
    showcase: {
      eyebrow: "Our case studies",
      title1: "Step into the",
      title2: "cinema",
      subtitle: "Real brands, real campaigns - each with a world of its own.",
      railLabel: "Jump to a case study",
      highlights: "Highlights",
      scenes: {
        boleron: { tagline: "Online insurance" },
        emblema: {
          // District Living is parked until its film is made: { name: "District Living", place: "Chavdar bridge" }
          buildings: [{ name: "Eria", place: "Ovcha Kupel" }]
        },
        mindguard: {
          shownTo: {
            label: "Shown to",
            items: ["Klaus Schwab", "The President of Switzerland", "Ukraine's largest TV channel"]
          }
        }
      }
    },
    /** Long-form case studies (only the projects that have one); structure per project - see `Project.story`. */
    stories: {
      emblema: {
        hero: {
          eyebrow: "Case study · Emblema",
          // With District Living: titleLines ["Two buildings."], titleAccent "Three short films.", sub "…in buildings that
          // do not exist yet.", Projects ["ERIA", "District Living"], Format "3 short films".
          titleLines: ["One building."],
          titleAccent: "Two short films.",
          sub: "How we sold the feeling of living in a building that does not exist yet.",
          meta: [
            { label: "Client", value: "Emblema" },
            { label: "Project", value: "ERIA" },
            { label: "Format", value: "2 short films" },
            { label: "Role", value: "Full production" },
            { label: "Year", value: "2026" }
          ]
        },
        client: {
          eyebrow: "The client",
          title: "Emblema builds homes. We build the feeling of them.",
          lead:
            "Emblema is a Sofia-based residential developer with projects in Ovcha Kupel, Manastirski Livadi and the city centre. Italian ceramic facades, Reynaers aluminium windows and an eye for detail.",
          // With District Living: "The two projects we worked on are at different stages and speak to different buyers.
          // ERIA is … District Living is a mixed-use city block by the Chavdar bridge, with a retail ground floor, an
          // aparthotel and a gated inner courtyard." / "They share one thing: both are sold before they exist."
          body: [
            "ERIA is a complex of two sixteen-storey buildings in Ovcha Kupel with 217 apartments and five decares of landscaped courtyard.",
            "And it is sold before it exists."
          ]
        },
        films: {
          eyebrow: "The work",
          title: "Two films.",
          placeholder: "Film {n} · coming soon",
          items: [
            {
              project: "ERIA · 55 President Lincoln Blvd",
              title: "Live on the next level",
              text: "The first ERIA film sets the tone: calm, premium, not a single spare move. The focus is the ventilated ceramic facade, the panoramic views and the car-free inner courtyard.",
              tags: ["Cinematic", "Exterior & interior", "Voice-over"]
            },
            {
              project: "ERIA · 55 President Lincoln Blvd",
              title: "Everything within reach",
              text: "The second film turns from the building to its location. Four minutes' walk to the metro, twelve to the centre, schools and cafés within two. Told through movement, not a map.",
              tags: ["Location", "Dynamic edit", "Social media"]
            }
            // District Living, parked until its film is made:
            // {
            //   project: "District Living · by the Chavdar bridge",
            //   title: "Sofia's new rhythm",
            //   text: "A two-minute documentary about the 15-minute city. From the coffee machine in the morning, through a flight down Dondukov Blvd, to sunset on the terrace. The longest and most complex production of the three.",
            //   tags: ["2 minutes", "Aerial shots", "Full voice-over", "Macro details"]
            // }
          ]
        },
        challenge: {
          eyebrow: "The challenge",
          title: "The buyer has to feel a home that is not there yet.",
          lead:
            "3D visualisations show what there will be. They do not show what it will feel like. And that is exactly what someone buying an apartment at the shell stage is paying for.",
          body: [
            "The task was not a prettier render. The task was to take the buyer inside the building: the morning light through the windows, the quiet of the inner courtyard, the coffee on the ground floor, the evening on the terrace.",
            // With District Living: "…three times in a row without the buildings looking like three different buildings."
            "That is direction, not visualisation. And it had to happen twice in a row without the building looking like two different buildings."
          ]
        },
        principles: {
          eyebrow: "The approach",
          title: "Cinematic documentary, not a tour of renders.",
          items: [
            {
              title: "Emotion before specification",
              text: "Every shot answers \"what is it like to live here\", not \"what is it made of\". Materials enter the film through detail and light, not through a list."
            },
            {
              title: "A directed camera",
              text: "Every move is logical and motivated, as in a feature film. The camera follows a person, the light or a direction of movement - it never moves just to move."
            },
            {
              title: "One building, one world",
              // With District Living: "…That is how three films read as one project instead of three separate attempts."
              text: "Time of day, season, colour grade and architectural details stay identical in every shot. That is how two films read as one project instead of two separate attempts."
            }
          ]
        },
        process: {
          eyebrow: "The process",
          // With District Living: "How we made these three films." / "For District Living we wrote a two-minute narrative
          // around the idea of the 15-minute city. For ERIA two shorter ones: …" / "…District Living alone ran to over
          // fifty shots. …"
          title: "How we made these two films.",
          steps: [
            {
              title: "The story",
              text: "For ERIA we wrote two short narratives: one about the building itself, one about what surrounds it."
            },
            {
              title: "Shot-by-shot storyboard",
              text: "Every shot is described on its own: frame, light, movement and exact duration. The client approves here, not at the end."
            },
            {
              title: "Images, frame by frame",
              text: "For every shot the final image is built: facade, materials, time of day, people in frame. It is approved as a picture before it goes anywhere near video. This is where consistency gets locked."
            },
            {
              title: "Video from the approved frame",
              text: "The approved image becomes the first frame. Only the motion is directed: camera, people, light, leaves. Nothing in the frame itself changes."
            },
            {
              title: "Voice, music and sound",
              text: "A Bulgarian voice-over written to picture and fitted to the cut, so every key word lands on its shot. Plus music and sound design."
            },
            {
              title: "Edit, grade and formats",
              text: "Final rhythm and a colour grade shared by both films. Delivered in 16:9 for screens and 9:16 for social media."
            }
          ]
        },
        problems: {
          eyebrow: "The hard parts",
          title: "The three problems that decide everything else.",
          problemLabel: "Problem",
          solutionLabel: "Solution",
          pairs: [
            {
              problem: "Consistency. Shots are generated one by one, but the viewer watches them back to back. The slightest difference in time of day, season or facade colour and the building stops being one building.",
              solution: "We locked light, season and colour grade at the image stage. Every shot is approved before it becomes video. Materials and architectural details are described identically in every shot, no exceptions."
            },
            {
              problem: "Direction. Automatically generated motion looks arbitrary. The camera drifts for no reason, people stand as in a photo and the clip starts to look like a visualisation.",
              solution: "Every move is motivated. The camera follows a person, the light or an architectural line. The pace is deliberately slower, no jolts. People in frame do something specific instead of posing."
            },
            {
              problem: "Duration. The cost of AI video grows linearly with every second, unlike traditional production.",
              // With District Living: "…The two-minute District Living film is assembled from shots with a predetermined length."
              solution: "The length of every shot is fixed at storyboard level. Nothing is generated \"just in case\". Every film is assembled from shots with a predetermined length."
            }
          ]
        },
        results: {
          eyebrow: "The result",
          title: "Two films that work everywhere.",
          lead:
            "The films run on social media and on screens in fitness centres, and accompany the projects' printed materials. The same footage serves the digital campaign and the sales office.",
          stats: [
            // With District Living: { num: "3", label: "Short films" }, { num: "2", label: "Projects" }
            { num: "2", label: "Short films" },
            { num: "2", label: "Buildings" },
            { num: "2", label: "Delivery formats" }
          ],
          body: [
            "The real effect is not in the production but at the moment of sale. The buyer does not watch what the building will look like - they watch what living in it will be like. That is the difference between a 3D visualisation and a film.",
            "AI-generated video turns out more natural than a classic render precisely here. The light is photographic, the people are alive, the motion is soft. The viewer stops looking at a project and starts looking at a home."
          ]
        },
        cta: {
          eyebrow: "The next project",
          title: "Have a building that is not built yet?",
          lead: "We make the film before you pour the first slab.",
          quote: "Request a quote",
          contact: "Contact us"
        }
      },
      osmo: {
        hero: {
          eyebrow: "Case study · OSMO Bulgaria",
          title: "AI video ads for Bulgaria's leading importer of wood oils",
          lead: "How we created a series of product video ads for OSMO's natural oils for Meta Ads — made entirely with artificial intelligence."
        },
        facts: [
          { label: "Client", value: ["OSMO Bulgaria"] },
          { label: "Industry", value: ["Building materials", "and wood protection"] },
          { label: "Partnership", value: ["6+ months"] },
          { label: "Products", value: ["Wood stain oil", "One-coat stain", "UV protection oil", "Decking oil"] },
          { label: "Delivered", value: ["A series of product video ads, optimised for Meta Ads"] }
        ],
        challenge: {
          eyebrow: "Challenge",
          title: "Explain and show every product — its purpose and its specifics",
          body: [
            "OSMO is a German maker of natural wood oils and waxes with a history going back to 1878. The products soak into the wood and protect it from within — an advantage that is hard to explain in a few seconds on screen.",
            "A traditional product photo shows a can and a surface. It does not show the rain, the sun and the years the oil keeps the wood safe from, nor the difference between a treated and an untreated facade. On top of that, OSMO's range is varied, each product with its own specifics, and every one of them is unique.",
            "The brief was for each ad to tell the story of one product's specifics on its own, in about 30 seconds, in a social-media ad format — and to work for awareness and for sales at the same time."
          ]
        },
        solution: {
          eyebrow: "Solution",
          title: "Real situations and real product benefits — visualised with artificial intelligence",
          body: [
            "Instead of a studio shot of the packaging, we placed every product in the environment it was made for: a terrace under the summer sun, a facade in the rain, a wooden house in the mountains. Its benefits we explained visually — through the way it is applied, before-and-after comparisons and the result on real wood.",
            "Attention to detail was critical: the labels, the stain tones and the texture of the treated wood have to be recognisable to a craftsman who works with them every day. So we built product references before generating the videos.",
            "Every video is short, opens with a visual problem and ends with the product as the answer — a format that reads without sound, works across every social network and is optimised for Meta Ads."
          ]
        },
        collage: ["Wood stain oil", "One-coat stain", "UV protection oil", "Decking oil"],
        metaLabels: { format: "Format", length: "Length", channels: "Channels" },
        products: [
          {
            eyebrow: "Protective wood stain oil",
            title: "We showed the protection through macro shots and a palette on real samples",
            body: [
              "The oil soaking in is an invisible process, so we made it visible: macro shots of the brush along the grain, the oil sinking into the wood's structure, drops stopping on the surface. Every scene is generated from a product reference so the can, label and tone match.",
              "We showed the colours with a fan of real samples and one facade in different tones, and the applications — facades, fences, garden furniture — as a run of short scenes with on-screen text. Protection from rain, rot and UV is the finale: stylised macro shots of water on treated wood."
            ],
            meta: { format: "4:5", length: "32 s", channels: "Meta Ads" }
          },
          {
            eyebrow: "One-coat stain",
            title: "Before and after in a single shot, and a time-lapse of the application",
            body: [
              "The benefit is in the name, so we built the clip around one transformation: a grey, cracked board on a dark background, the brush passes once and right behind the bristles the wood saturates. The before-and-after happens in one continuous shot, with no narration.",
              "Then the board slots into place in a real fence — a transition from the studio to the real world — and a craftsman finishes the whole fence in fast motion. That is how we showed the application, while the coverage (up to 26 m² per litre), the time saved and the 14 colours came in as short text accents over the finished fence and the lined-up cans."
            ],
            meta: { format: "9:16", length: "31 s", channels: "Meta Ads" }
          },
          {
            eyebrow: "UV protection oil",
            title: "Summer heat, a sunbeam across six colours and slow-motion rain",
            body: [
              "We started from the problem, not the product: a drone shot towards a modern house with a wooden facade, a pool and air shimmering in the heat. The can only appears in the second scene, set on boards by the facade with the yard blurred behind it — the product in the centre, the setting still real.",
              "We showed the application with macro tracking behind the roller along the grain, and the six colours as six vertical boards on the facade that a sunbeam lights up one by one. The protection is summer rain in slow motion: drops beading down the wood without soaking in. The finale is golden hour, the house, the can and the logo."
            ],
            meta: { format: "4:5", length: "32 s", channels: "Meta Ads" }
          },
          {
            eyebrow: "Decking oil",
            title: "One terrace, split in two, through the four seasons",
            body: [
              "The whole video is one and the same shot: a low viewpoint at board level, the terrace treated with Decking-Oil on the left, unprotected on the right. We never change the location — we change the season. Spring rain that beads on the left and soaks in on the right; summer sun bleaching the right half; autumn leaves, stains and the first cracks; snow on grey, split wood.",
              "Between the seasons there is a macro of the seam between the two boards — living grain under a satin coat against a rough, grey surface. The finale closes the story: a brush passes over the untreated half and the colour evens out, then the can and the ten tones fanned out on the terrace at golden hour."
            ],
            meta: { format: "4:5", length: "34 s", channels: "Meta Ads" }
          }
        ],
        results: {
          eyebrow: "Result",
          title: "Ads ready in weeks, not months",
          stats: [
            { num: "4", suffix: "", label: "products in one visual series" },
            { num: "4", suffix: "", label: "finished video ads" },
            { num: "250", suffix: "K+", label: "views on Meta" }
          ],
          closing: "Today OSMO Bulgaria's videos run in the company's Instagram and Meta campaigns — for brand awareness and for sales. The product is no longer a can on a shelf, but a solution in a real situation."
        },
        quote: {
          eyebrow: "Client testimonial",
          text: "I was impressed by their ability to get the job done fast. They made me very good, professionally produced videos. The message is clear, the look is modern and the editing holds your attention through the whole video.",
          name: "Dimitar Vladikov",
          role: "Owner and general manager, OSMO Bulgaria"
        },
        cta: { title: "Want us to present your product in a new, innovative way?", quote: "Request a quote", contact: "Contact us" }
      },
      boleron: {
        hero: {
          eyebrow: "Case study · Boleron",
          title: "A brand mascot and AI ads for Bulgaria's largest online insurer",
          lead: "How we created a brand mascot for Boleron and turned it into ad campaigns for television, social media and YouTube."
        },
        facts: [
          { label: "Client", value: ["Boleron"] },
          { label: "Industry", value: ["Insurance"] },
          { label: "Partnership", value: ["6+ months"] },
          { label: "Delivered", value: ["Brand mascot · TV ad · Social media videos and posts · YouTube ad"] }
        ],
        challenge: {
          eyebrow: "Challenge",
          title: "A brand everyone knows",
          body: [
            "Boleron is Bulgaria's leading digital insurance broker — insurance in minutes, entirely online. But in a sector dominated by traditional companies with decades of history, the digital leader also has to be the most recognisable one.",
            "Boleron had to become a brand people remember and like — a character with personality, friendly, modern and unlike anything in insurance, and ads that establish it wherever the audience is.",
            "We proposed an innovative route — a mascot and ad campaigns created entirely with artificial intelligence."
          ]
        },
        solution: {
          eyebrow: "Solution",
          title: "Character first, picture second",
          body: [
            "We started with what matters most — who the hero is. Together with the Boleron team we defined the character, and only then did we develop the visual directions. Out of a few concepts the client chose the final mascot.",
            "After the approval we turned the hero into a complete system of poses, expressions and scenes, so it stays the same in every asset — from a TV ad to a social media post."
          ]
        },
        collage: ["At the beach", "In the city", "In the mountains", "At home", "In the sky"],
        tv: {
          eyebrow: "TV ad",
          title: "The hero on air",
          body: [
            "An ad for broadcast, aired on bTV before the weather and the sports news — in the most-watched minutes of the day. In 12 seconds the mascot introduces Boleron to the whole of Bulgaria, with the script, animation, voice-over and editing all made with artificial intelligence.",
            "The result is a TV ad of animation-studio quality, produced in days instead of months and for a fraction of a traditional production's budget."
          ],
          meta: [
            { label: "Channel", value: "bTV" },
            { label: "Slot", value: "Before the weather and sports" },
            { label: "Length", value: "12 s" }
          ]
        },
        social: {
          eyebrow: "Social media",
          title: "One hero, every format",
          note: "9:16 · Shorts, Reels, TikTok",
          body: [
            "Vertical cuts for Shorts, Reels and TikTok — the same hero and the same character, with a rhythm of its own for each platform."
          ],
          items: ["YouTube Shorts", "Facebook", "TikTok"],
          placeholder: "Coming soon"
        },
        ads: {
          eyebrow: "The ads",
          title: "Eight ads, one hero",
          body: [
            "Casco, third-party liability, property insurance, travel insurance, a summer campaign — every insurance got its own ad with Roni, in one style and with one character."
          ],
          items: {
            summer: { title: "Summer campaign", note: "Ad" },
            casco4: { title: "Casco", note: "Ad II" },
            liability3: { title: "Third-party liability", note: "Ad II · 4K" },
            property: { title: "Property insurance", note: "Ad" },
            travel: { title: "Travel insurance", note: "Ad" },
            liabilityApp: { title: "Third-party liability", note: "The app" },
            casco3: { title: "Casco", note: "Ad I" },
            liability2: { title: "Third-party liability", note: "Ad I" }
          }
        },
        youtube: {
          eyebrow: "YouTube",
          title: "The hero on YouTube",
          note: "YouTube · 16:9 · 4K",
          body: [
            "A YouTube ad in which the hero introduces Boleron in seconds — short, clear and memorable, at the platform's pace."
          ]
        },
        results: {
          eyebrow: "Result",
          title: "From the first meeting to the airwaves",
          stats: [
            { num: "20+", suffix: "", label: "videos in 7 months" },
            { num: "75", suffix: "M+", label: "views" },
            { num: "1", suffix: "", label: "hero the whole of Bulgaria recognises" }
          ],
          closing: "Boleron now has a brand hero that lives everywhere — on the website, on social media, on TV and, above all, in the minds of people all over Bulgaria."
        },
        cta: {
          eyebrow: "The next hero",
          title: "Want a brand hero for your business?",
          lead: "Tell us about your business — we will propose a character, a style and a plan for the first ads.",
          quote: "Request a quote",
          contact: "Contact us"
        }
      },
      plasico: {
        hero: {
          title: "Premium feel. With humour.",
          lead: "Three AI ads for the Plasico IT superstore — gaming gear told like cinema, with a premium look and a sense of humour."
        },
        challenge: {
          eyebrow: "The brief",
          title: "Content on a new level",
          body: [
            "Plasico came to us with a clear brief: take their marketing content to a new level. They wanted a premium feel, humour and their products — all in one.",
            "The answer was three ads, each building on what the previous one taught us."
          ]
        },
        ads: [
          {
            eyebrow: "Ad 01",
            title: "Gaming details. A word to the office.",
            body: [
              "Plasico's products are for gamers — so the first ad grabs the eye with gaming details in every frame. It also carries a message to the people at the office. Two audiences, blended into one story."
            ],
            note: "16:9 · 4K"
          },
          {
            eyebrow: "Ad 02",
            title: "Catchier. Sharper.",
            body: [
              "For the second video we went for a catchier concept and catchier lines — not just entertaining, but speaking straight to the viewer's problem. Again with top-tier AI visuals. The result is a video that is one of a kind in the industry."
            ],
            note: "16:9 · 4K"
          },
          {
            eyebrow: "Ad 03",
            title: "From the beach to the gaming room",
            body: [
              "The third video is a dynamic 15-second ad with everything we had learned so far poured into it. In fifteen seconds the viewer travels from the beach to the gaming room — and feels both."
            ],
            note: "9:16 · vertical · subtitled"
          }
        ],
        method: {
          eyebrow: "How we work",
          title: "Together, down to the last detail",
          body: [
            "Our work with Plasico rests on one method: we actively discuss the concepts and develop them, and their details, together. When both sides bring ideas, the highest quality on the market is only a matter of time."
          ],
          points: ["Concepts discussed actively", "Ideas from both sides", "Quality with no equal on the market"]
        },
        placeholder: "Coming soon",
        cta: { title: "Want your products in cinema style too?", quote: "Request a quote", contact: "Contact us" }
      },
      mindguard: {
        hero: {
          eyebrow: "Case study · MindGuard",
          title: "AI presentation videos for one of Switzerland's most promising start-ups",
          lead: "How we prepared MindGuard's presentation videos - shown on television and at key meetings with the President of Switzerland, Guy Parmelin, and with Klaus Schwab."
        },
        facts: [
          { label: "Client", value: ["MindGuard AG"] },
          { label: "Industry", value: ["Mental health tech"] },
          { label: "Product", value: ["A mental-resilience app built with veterans from Ukraine"] },
          { label: "Delivered", value: ["Presentation videos", "User interface video", "PR video", "Corporate videos"] },
          { label: "Partnership", value: ["1+ year"] }
        ],
        challenge: {
          eyebrow: "Challenge",
          title: "Videos for key strategic meetings and national television",
          body: [
            "MindGuard is a Swiss start-up building a mental-resilience platform together with veterans from Ukraine - short daily actions for body, mind and spirit that reduce stress and bring back discipline. Behind the project stands its founder and CEO, Benjamin B. Bargetzi.",
            "The task was to prepare corporate presentation videos for his key meetings - with Klaus Schwab, the founder of the World Economic Forum, and with the President of Switzerland, Guy Parmelin. The videos had to present the platform clearly and convincingly within minutes, to an audience that gives no second chances, and look like the work of a company of a far bigger scale.",
            "Alongside that, a separate video was needed for Ukraine's leading TV channel 1+1 - for Benjamin's interview during his visit to Ukraine. A different audience, a different language and format, but the same high bar for quality and the same short deadlines."
          ]
        },
        solutions: {
          eyebrow: "Solution",
          schwab: {
            title: "The presentation to Klaus Schwab",
            body: [
              "The video was presented in person to Klaus Schwab - the founder of the World Economic Forum, who sits on MindGuard's board of directors. In a few minutes it tells why the platform exists, how it works and the scale of the problem it solves.",
              "We built it entirely with artificial intelligence - scenes with veterans, the app's interface in real use and cinematic shots that give the start-up the visual weight of an established company."
            ],
            meta: [
              { label: "Format", value: "16:9" },
              { label: "Length", value: "1:33 min" },
              { label: "Use", value: "Live presentation" }
            ]
          },
          parmelin: {
            title: "The presentation to the President of Switzerland, Guy Parmelin",
            body: [
              "The second presentation was for a meeting with the President of Switzerland, Guy Parmelin - for feedback from the very top, institutional support and access to investors. An audience before which the video has to sound like state policy, not a start-up pitch.",
              "So we moved the emphasis from the product to the mission: the scale of the post-war mental-health problem, Switzerland's role as Ukraine's partner, and MindGuard as a concrete, measurable answer. The visual language stayed the same, so the brand is recognised from one meeting to the next."
            ],
            meta: [
              { label: "Format", value: "16:9" },
              { label: "Length", value: "1:43 min" },
              { label: "Use", value: "Live presentation" }
            ]
          },
          tv: {
            title: "The presentation on Ukrainian TV channel 1+1",
            body: [
              "After the meeting with the President, Benjamin's next task was to present the app directly to the Ukrainian market - in an interview for the leading national TV channel 1+1.",
              "For it we prepared a user interface video assembled from real footage of the workshops with veterans that Benjamin took part in himself - not generated scenes but the real people the platform was built for. With it came an updated UI/UX design of the platform, fully translated into Ukrainian, so viewers would see it the way they will use it.",
              "The challenge was the deadline: everything had to be ready in three days, right before the broadcast. Editing, translation, the new interface and the final export - delivered on time, with no compromise on quality."
            ],
            meta: [
              { label: "Format", value: "16:9" },
              { label: "Language", value: "Ukrainian" },
              { label: "Deadline", value: "3 days" }
            ],
            caption: "An excerpt from the TV segment on 1+1 with Benjamin B. Bargetzi's interview"
          }
        },
        results: {
          eyebrow: "Result",
          title: "Videos on a short deadline for strategic meetings and broadcast",
          stats: [
            { num: "3", suffix: "", label: "videos delivered on short deadlines" },
            { num: "3", suffix: " days", label: "from the brief to the broadcast on TV channel 1+1" },
            { num: "1", suffix: "M+", label: "views on air and before key figures" }
          ],
          closing: "MindGuard's videos were shown to Klaus Schwab, to the President of Switzerland, Guy Parmelin, and to the viewers of Ukraine's most-watched TV channel. Three different audiences, one recognisable visual language - created with artificial intelligence and delivered professionally on short deadlines by Dream Team."
        },
        testimonials: {
          eyebrow: "Client testimonial",
          items: [
            {
              quote: "I am literally 100% happy! Will recommend you to literally anyone asking me for a video/creative. I love you!",
              name: "Benjamin B. Bargetzi",
              role: "Founder & CEO, MindGuard"
            },
            { quote: "Their process was structured and easy to follow.", name: "Denis Müller", role: "Co-Founder & CTO, MindGuard" }
          ]
        },
        placeholder: "The film — coming soon",
        cta: {
          title: "Need corporate videos for strategic presentations and meetings with investors and key figures?",
          contact: "Contact us"
        }
      }
    },
    categories: {
      all: "All",
      software: "Software",
      products: "Products",
      construction: "Construction"
    },
    styles: {
      animated: "Animated",
      realistic: "Realistic",
      "semi-realistic": "Semi-realistic"
    },
    facts: {
      industry: "Industry",
      campaign: "Campaign",
      style: "Style",
      format: "Format",
      deliverable: "Deliverable"
    },
    detail: {
      metaTitle: "Case study | DreamTeam",
      eyebrow: "Case study",
      ctaTitle: "Want a project like this for your brand?",
      ctaQuote: "Request a quote",
      ctaContact: "Contact us",
      client: "Client",
      mission: "The mission",
      about: "About the campaign",
      details: "Project details",
      published: "Where the video ran",
      views: "Total views",
      viewsShort: "views",
      viewsHint: "Across all platforms",
      platforms: "Platforms",
      partnership: "Partnership",
      since: "Since",
      months: "months together",
      tbd: "-",
      noPlatforms: "Publishing details will be added once the campaign goes live.",
      backToProjects: "Back to all case studies",
      platformNames: {
        youtube: "YouTube",
        instagram: "Instagram",
        tiktok: "TikTok",
        facebook: "Facebook"
      }
    },
    items: {
      boleron: {
        name: "Boleron",
        headline: "Insurance explained in 15 seconds",
        description:
          "Proof that new technology can reinvent an old industry - insurance told with fresh ideas, in over 20 AI videos and 75 million views.",
        highlight: "A brand mascot and AI ads for Boleron - on air, on social media and on YouTube.",
        tags: ["75M+ views", "Mascot", "20+ videos", "Software ad"],
        mission:
          "Make a mandatory, dry insurance product feel simple and human, so visitors understand it in seconds and finish the purchase online instead of calling an agent.",
        industry: "Online insurance",
        campaign: "Brand development",
        format: "16:9 + 9:16",
        deliverable: "Product spot"
      },
      plasico: {
        name: "Plasico",
        headline: "An IT superstore, cinematic",
        description:
          "Three AI video concepts in 4K for Plasico's IT superstore - technology told cinematically, built entirely from AI-generated scenes.",
        highlight: "Technology, told cinematically - three video concepts in 4K.",
        tags: ["Online store ads", "4K"],
        mission:
          "Give an online electronics store the cinematic presence of a global brand - premium visuals that make the catalogue feel exciting rather than transactional.",
        industry: "IT retail",
        campaign: "Brand campaign",
        format: "16:9",
        deliverable: "Brand video"
      },
      mindguard: {
        name: "Mindguard",
        headline: "Calm you can see",
        description:
          "A 60-second animated explainer that makes the Mindguard mental-health platform instantly understandable - shown to Klaus Schwab, the President of Switzerland and Ukraine's largest TV channel.",
        highlight: "Calm you can see - a mental-health platform made clear in 60 seconds.",
        tags: ["Software showcase", "Mental health", "Shown to Klaus Schwab"],
        mission:
          "Explain an abstract mental-health platform without screenshots - a story-driven animated explainer that makes the value obvious in the first ten seconds.",
        industry: "Mental-health software",
        campaign: "Product explainer",
        format: "16:9",
        deliverable: "Explainer video"
      },
      emblema: {
        name: "Emblema",
        headline: "The emotion of a home, told cinematically",
        description:
          // With District Living: "…for Emblema's residential projects - District Living by Chavdar bridge and Eria in Ovcha Kupel - …"
          "Two cinematic AI films for Emblema's residential project - Eria in Ovcha Kupel - so buyers feel the building before the first brick is laid.",
        highlight: "The emotion of home, told cinematically.",
        tags: ["Construction", "Cinema ad"],
        mission:
          "Sell homes off-plan by letting buyers feel the finished building - light, materials and atmosphere - long before construction is complete.",
        industry: "Home construction",
        campaign: "Off-plan sales",
        format: "16:9",
        deliverable: "Property visualization"
      },
      osmo: {
        name: "OSMO",
        headline: "Four product videos that sell",
        description:
          "Four vertical AI promo videos for OSMO's products, made for TikTok, Reels and Shorts - and they lifted sales of the featured products.",
        highlight: "Each product in the setting it was made for - entirely with AI.",
        tags: ["Social spots", "Product ad"],
        mission:
          "Cut through crowded social feeds with a fast, vertical product spot that stops the scroll and drives traffic to the online shop.",
        industry: "Consumer products",
        campaign: "Social media campaign",
        format: "9:16",
        deliverable: "Social spot"
      }
    }
  },
  services: {
    title1: "Our",
    title2: "Services",
    subtitle: "End-to-end AI production - from video and mascots to stills and automated pipelines.",
    learnMore: "Learn more",
    quoteCta: "Request a quote",
    metaTitle: "AI Video Services for Business | DreamTeam",
    metaDescription:
      "AI video production, brand mascots, AI images, and automations. AI-powered video ads for brands in Bulgaria and worldwide.",
    ctaHeading: "Ready to get started?",
    ctaSubtitle:
      "Tell us your idea and we'll send a personalized quote for your video.",
    modal: {
      close: "Close",
      contactCta: "Get a quote",
      goToPortfolio: "View portfolio",
    },
    items: [
      {
        title: "AI Video Production",
        imgSrc: "/services/icons/ai_video.png",
        imgAlt: "Video production studio equipment",
        seoTitle: "AI Video Production | DreamTeam",
        seoDescription:
          "AI-powered video ads for TV, social media, product and corporate video. AI avatars and unique scenes on a smaller budget.",
        modal: {
          eyebrow: "AI Video Production",
          title: "AI videos from product shots or built from scratch",
          description:
            "We create AI videos for TV ads, social media campaigns, tutorials, internal communications, and stories in settings traditional filming can't easily reach - from product scenes to AI avatars in unique environments.",
          stats: ["TV ads", "Social ads", "Tutorials", "AI avatars"],
          steps: [
            {
              id: "ai-video-use",
              title: "Use cases",
              text: "AI video for product and service advertising - including TV and social media campaigns - plus educational tutorials and internal campaigns. For example, showing your team in creative settings (Olympics, football match, and more).",
            },
            {
              id: "ai-video-scenes",
              title: "What's possible",
              text: "We place your products in environments that are hard or costly to shoot in real life.",
              items: [
                {
                  id: "ai-video-scenes-1",
                  title: "Project visualization",
                  content:
                    "Show how a building is constructed and how it will look finished inside and out - before it's built.",
                },
                {
                  id: "ai-video-scenes-2",
                  title: "Stories with AI avatars",
                  content:
                    "Tell your story through AI characters who move through the space, interact, and explain your offer.",
                },
              ],
            },
            {
              id: "ai-video-benefits",
              title: "Benefits",
              items: [
                {
                  id: "ai-video-benefits-1",
                  title: "Unique settings",
                  content:
                    "Your products and services appear in memorable environments that help you stand out in your industry.",
                },
                {
                  id: "ai-video-benefits-2",
                  title: "More accessible pricing",
                  content:
                    "No film crews, extras, or props to hire - achieve a high-end look at a lower production cost.",
                },
              ],
            },
            {
              id: "ai-video-needs",
              title: "What we need from you",
              items: [
                {
                  id: "ai-video-needs-1",
                  title: "Idea and message",
                  content:
                    "Your concept - or we propose one that fits your company and audience.",
                },
                {
                  id: "ai-video-needs-2",
                  title: "Assets",
                  content: "Product photos, brand guidelines, logo, and details about your services.",
                },
                {
                  id: "ai-video-needs-3",
                  title: "Style and feedback",
                  content:
                    "Expectations for look - realistic, animated, or with VFX - plus feedback at key production stages.",
                },
                {
                  id: "ai-video-needs-4",
                  title: "Industry context",
                  content: "Sector-specific information so we communicate your message clearly and accurately.",
                },
              ],
            },
            {
              id: "ai-video-pricing",
              title: "Pricing and scope",
              text: "We work across industries and styles. Pricing is tailored to complexity and video length. After discussing your needs, we send a personalized quote.",
            },
          ],
          tabs: [
            {
              value: "products",
              label: "Products",
              src: "/services/video/video1.jpeg",
              alt: "Product AI video",
            },
            {
              value: "services",
              label: "Services",
              src: "/services/video/video2.jpeg",
              alt: "Services AI video",
            },
            {
              value: "corporate",
              label: "Corporate",
              src: "/services/video/video3.jpeg",
              alt: "Corporate AI video",
            },
          ],
          defaultTab: "products",
        },
      },
      {
        title: "Brand Mascot",
        imgSrc: "/services/icons/ai_mascot.png",
        imgAlt: "Colorful character illustration",
        seoTitle: "AI Brand Mascots | DreamTeam",
        seoDescription:
          "We create AI mascots that carry your brand message - animated or realistic, with male and female voice, for posts, stories, and video.",
        modal: {
          eyebrow: "AI Brand Mascot",
          title: "A talisman your audience will remember",
          description:
            "We create mascots that carry your company message, showcase your products, and capture attention - one of the most effective ways for people to remember your brand.",
          stats: ["Animated", "Realistic", "Photos & video", "Male & female voice"],
          steps: [
            {
              id: "mascot-why",
              title: "Why a mascot",
              text: "A mascot gives your brand a face and personality - used in campaigns, on your site, in social content and videos to build recognition and trust.",
            },
            {
              id: "mascot-options",
              title: "Capabilities",
              items: [
                {
                  id: "mascot-options-1",
                  title: "Style",
                  content: "Animated or realistic look - matched to your brand tone and target audience.",
                },
                {
                  id: "mascot-options-2",
                  title: "Formats",
                  content: "Ready for stills, posts, stories, and AI video with one consistent, recognizable character.",
                },
                {
                  id: "mascot-options-3",
                  title: "Voice",
                  content: "Multiple voice options - male and female - for video and spoken content.",
                },
              ],
            },
            {
              id: "mascot-process",
              title: "Process",
              items: [
                {
                  id: "mascot-process-1",
                  title: "Brief and quote",
                  content: "Tell us the type and style you want. We send a personalized quote and start after approval.",
                },
                {
                  id: "mascot-process-2",
                  title: "Looks and voices",
                  content: "We present several visual directions and suitable voice options to choose from.",
                },
                {
                  id: "mascot-process-3",
                  title: "Finalization",
                  content: "You confirm the final look and voice. We develop the chosen style across different settings.",
                },
                {
                  id: "mascot-process-4",
                  title: "Handover",
                  content: "You receive finished image assets and voice files of the mascot for ongoing use.",
                },
              ],
            },
          ],
          tabs: [
            {
              value: "animated",
              label: "Animated",
              src: "/services/mascot/mascot1.jpeg",
              alt: "Animated brand mascot",
            },
            {
              value: "influencer",
              label: "Influencer",
              src: "/services/mascot/mascot2.jpeg",
              alt: "Influencer mascot",
            },
            {
              value: "semi-realistic",
              label: "Semi-realistic",
              src: "/services/mascot/mascot3.jpeg",
              alt: "Semi-realistic brand mascot",
            },
          ],
          defaultTab: "animated",
        },
      },
      {
        title: "AI Graphic Design",
        imgSrc: "/services/icons/ai_images.png",
        imgAlt: "Camera and photography setup",
        seoTitle: "AI Images & Graphic Design | DreamTeam",
        seoDescription:
          "AI images and AI graphic design for posts, stories, web, presentations, logos, and brand documents - matched to your brand style.",
        modal: {
          eyebrow: "AI Graphic Design",
          title: "Images crafted for every touchpoint",
          description:
            "We create AI graphic design for online posts, stories, websites, presentations, logos, and any visual material your brand needs - aligned with your identity.",
          stats: ["Posts", "Stories", "Web", "Logos", "Documents"],
          steps: [
            {
              id: "images-what",
              title: "What we create",
              text: "Visuals for social, web, ads, and corporate documents - ready to publish in the sizes and formats you need.",
            },
            {
              id: "images-process",
              title: "Process",
              items: [
                {
                  id: "images-process-1",
                  title: "Brief and assets",
                  content:
                    "Share what you need and send materials - logo, colors, references, and brand tone guidelines.",
                },
                {
                  id: "images-process-2",
                  title: "Quote and kickoff",
                  content: "We send a personalized quote and begin work after your confirmation.",
                },
                {
                  id: "images-process-3",
                  title: "Delivery and revisions",
                  content:
                    "We deliver finished images and refine based on your feedback until you're satisfied.",
                },
              ],
            },
          ],
          tabs: [
            {
              value: "products",
              label: "Products",
              src: "/services/images/image1.jpeg",
              alt: "Product AI imagery",
            },
            {
              value: "logos",
              label: "Logos",
              src: "/services/images/image2.jpeg",
              alt: "AI logo design",
            },
            {
              value: "graphics",
              label: "Graphics",
              src: "/services/images/image3.jpeg",
              alt: "AI graphic design",
            },
          ],
          defaultTab: "products",
        },
      },
      {
        title: "Video & Image Automation",
        imgSrc: "/services/icons/ai_automation.png",
        imgAlt: "Robotics and automation concept",
        seoTitle: "Video & Image Automation | DreamTeam",
        seoDescription:
          "A repeatable process for generating AI video and AI images in a uniform style - ideal for catalogs, social feeds, and seasonal campaigns.",
        modal: {
          eyebrow: "AI Video Automation",
          title: "From a few images to video - the same way every time",
          description:
            "When you have many products to show in a uniform, standardized way, we build a workflow that simplifies your work and quickly generates images and videos to the same standard.",
          stats: ["Catalogs", "Social media", "Templates", "Batch output"],
          steps: [
            {
              id: "auto-what",
              title: "What it's for",
              text: "Automations are ideal for online catalogs, social posts, seasonal campaigns, and anywhere volume and consistent style matter equally.",
            },
            {
              id: "auto-process",
              title: "Process",
              items: [
                {
                  id: "auto-process-1",
                  title: "Consultation",
                  content: "We define scope, goals, and the level of automation you need.",
                },
                {
                  id: "auto-process-2",
                  title: "Quote",
                  content: "We send a personalized quote based on complexity and project volume.",
                },
                {
                  id: "auto-process-3",
                  title: "Workflow design",
                  content:
                    "We define the pipeline, templates, and brand rules - similar to video production, but built for repeatable output.",
                },
                {
                  id: "auto-process-4",
                  title: "Testing and feedback",
                  content: "We test with your real assets, refine, and finalize before handover.",
                },
                {
                  id: "auto-process-5",
                  title: "Handover and support",
                  content:
                    "You receive documentation, a setup guide, and a ready-to-use tool. We also offer long-term support and improvements.",
                },
              ],
            },
          ],
          tabs: [
            {
              value: "video",
              label: "Video",
              src: "/services/automation/automation1.jpeg",
              alt: "Automated AI video",
            },
            {
              value: "photos",
              label: "Photos",
              src: "/services/automation/automation2.jpeg",
              alt: "Automated AI photos",
            },
          ],
          defaultTab: "video",
        },
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title1: "Frequently",
    title2: "Asked Questions",
    subtitle:
      "Answers to the questions clients ask us most - about pricing, timelines, rights, and how we work.",
    // The questions in topics: the menu on the left of the FAQ (`key` picks the icon).
    groups: [
      {
        key: "pricing",
        label: "Packs & pricing",
        items: [
          {
            q: "How much does an AI video cost?",
            a: "Personal is a single video for $299 (up to 20 seconds, +$119 for every extra 10 seconds). Monthly plans start at $389 a month for individuals (Creator, 40 seconds of video a month; Pro, 1 minute for $629) and at $990 a month for businesses (Local, 1.5 minutes; Brand, 3 minutes for $3,490). Enterprise is priced around your campaigns. All prices are in US dollars on the Pricing page.",
          },
          {
            q: "What is the difference between a one-time video and a subscription?",
            a: "A one-time Personal video is a single order with a single payment and no subscription. A monthly plan gives you a set amount of video time every month - for example 40 seconds with Creator or 3 minutes with Brand - plus more included extras such as subtitles, sound design and colour grading on the higher plans. You can pause or cancel a subscription anytime.",
          },
          {
            q: "Is there a discount for paying annually?",
            a: "Yes. With annual billing you pay for ten months and get twelve - two months free, about 17% off - on every monthly plan. Your video time for the whole year is added to your account when you pay.",
          },
          {
            q: "Is AI video cheaper than traditional filming?",
            a: "In most cases, yes. There are no film crews, actors, locations or props to hire, so you get a high-end look on a smaller budget. It's especially cost-effective for scenes that would be expensive or hard to shoot in real life.",
          },
          {
            q: "Can I use an Individual plan to advertise my business?",
            a: "No - Individual plans are for personal projects and creators. Advertising a business needs a Business plan, which includes full commercial use.",
          },
        ],
      },
      {
        key: "account",
        label: "Your account & video time",
        items: [
          {
            q: "How does video time work?",
            a: "When you buy a pack, its seconds of video are added to your account and shown as minutes and seconds in your account menu. When you submit a project, its length is taken from that balance - for example a 30-second video uses 30 seconds. If you don't have enough, we show it before you submit, and you can buy another pack.",
          },
          {
            q: "How do I order a video?",
            a: "Sign up, buy a pack, then open Your Projects and press Submit a project. A short form asks whether you have a script, what the goal is, the length, format, voice-over, where it will run and your deadline - and you can attach files. Then we get to work.",
          },
          {
            q: "Where do I follow my project and talk to you?",
            a: "In Your Projects. Each project shows its stage from brief to delivery, a timeline, your revisions, the files to download and a Comments tab. We use comments instead of a chat: write a question or a revision request and we reply on the same page, so you never have to wait online.",
          },
        ],
      },
      {
        key: "process",
        label: "How we work",
        items: [
          {
            q: "How long does a video take?",
            a: "Most videos are delivered in 3-10 days, depending on the complexity and length. Enterprise clients get priority delivery. If you want the highest quality, we take the time it needs - meeting your expectations always comes first.",
          },
          {
            q: "What do you need from me to get started?",
            a: "Your idea and a few assets are enough - product photos, your logo and brand guidelines. If you don't have a script, choose \"No, I want you to write it\" in the form and we propose one based on your brief. Scriptwriting is an add-on at $100 per 30 seconds of video (included in the Brand plan).",
          },
          {
            q: "How do revisions work?",
            a: "One revision is one round of changes per video, covering up to 30% of the video's length - up to 9 seconds of a 30-second video. Personal includes 1 free revision, Creator 1 per video, Pro and Local 2, Brand 3 and Enterprise 4 or more. Fixes for mistakes on our side are always free and don't count.",
          },
          {
            q: "Can you match my brand style and provide voiceover?",
            a: "Yes. We work from your colours, logo and tone so the video looks like part of your brand. Voiceover is included in every plan - one language per video, male or female voice - and subtitles are included from Creator up.",
          },
          {
            q: "Do you work with clients around the world?",
            a: "Yes. We work fully online with clients in the USA, Europe and worldwide. The whole process - from brief to delivery - runs remotely, with no need to meet in person.",
          },
        ],
      },
      {
        key: "videos",
        label: "Videos & rights",
        items: [
          {
            q: "What types of videos can you make?",
            a: "Social media ads (Reels, TikTok, Shorts), corporate videos, TV ads, product videos, brand mascots, motion graphics, launch and explainer videos, UGC-style ads, real estate videos and music videos. We can show your product in settings traditional filming can't easily reach.",
          },
          {
            q: "Which tools and AI models do you use?",
            a: "We use the best tools on the market and pick the right one for each scenario. We work with different AI and video models and know the strengths and weaknesses of each, so we choose the one that fits your project.",
          },
          {
            q: "What resolution and formats do I get?",
            a: "Personal is delivered in 720p HD, Creator, Pro and Local in 1080p Full HD, and Brand and Enterprise up to 4K. You choose one aspect ratio per video - 9:16, 16:9, 1:1 or 4:5 - and the final files come ready for social media, your website or TV.",
          },
          {
            q: "Do I get full commercial usage rights to the video?",
            a: "Business plans include full commercial use, and every plan means you own your videos and source files. After final delivery the video is yours to use for advertising, social media, your website, TV and any commercial purpose.",
          },
        ],
      },
      {
        key: "training",
        label: "Training & more",
        items: [
          {
            q: "Do you teach AI video production?",
            a: "Yes. We offer training in AI video production - individual lessons, a community on Skool and workshops for teams - so you can learn to make your own videos. Find the details on our Training page.",
          },
          {
            q: "Can you make a brand mascot?",
            a: "Yes. We create an AI brand mascot - a character that becomes the face of your brand - and bring it to life in your videos. Tell us about your brand when you submit a project or contact us.",
          },
        ],
      },
    ],
  },
  reviews: {
    eyebrow: "Reviews",
    title1: "What our",
    title2: "clients say",
    // The English home page's MindGuard spotlight above the reviews (`client-spotlight.tsx`).
    spotlight: {
      eyebrow: "Client spotlight",
      line: "AI presentation films for one of Switzerland's most promising startups."
    },
    // Google reviews. `initials` + `color` mirror the avatar letter icons on
    // Google; rating/color stay identical across locales.
    items: [
      {
        name: "iSupport",
        role: "Client",
        initials: "i",
        color: "#3949AB",
        rating: 5,
        text: "They understood exactly what I wanted from the very beginning and did an excellent job. They also went above and beyond with the revisions to make sure everything was exactly as expected. Thank you very much. I'll definitely be back for more. Great work!",
      },
      {
        name: "Raibranch",
        role: "Client",
        initials: "R",
        color: "#D81B60",
        rating: 5,
        text: "Professional work, delivery on time. The criteria was perfectly met! I will be using this service again!",
      },
      {
        name: "chargecloud",
        role: "Client",
        initials: "c",
        color: "#00897B",
        rating: 5,
        text: "Thank you a lot for your support and for responding to our individual wishes! You were reachable for us anytime and helped us out a lot.",
      },
      {
        name: "Iceheart",
        role: "Client",
        initials: "I",
        color: "#7E57C2",
        rating: 5,
        text: "Great to work with and quick to understand the need.",
      },
      {
        name: "BG BROKER",
        role: "Real estate agency",
        initials: "BG",
        color: "#D81B60",
        rating: 5,
        text: "Extremely happy with the team's work! Great videos, fast turnaround, and reasonable prices. I recommend them!",
      },
    ],
  },
  stats: {
    title1: "DreamTeam",
    title2: "in numbers",
    subline:
      "The AI video production industry is evolving fast. Together with you, we are shaping its future.",
    items: [
      { id: "views", value: "30M+", label: "Views" },
      { id: "clients", value: "50+", label: "Clients" },
      { id: "projects", value: "270+", label: "Realized Projects" },
    ],
  },
  order: {
    title1: "Get a",
    title2: "Quote",
    subtitle: "Fill out the form below to receive a personalized quote.",
    stepNames: ["Idea", "Details", "Budget", "Summary"],
    steps: {
      idea: {
        title: "Do you have an idea or plot for the video?",
        yes: "Yes, I have an idea",
        no: "No, let DreamTeam think of one",
        placeholder: "Briefly describe your idea..."
      },
      details: {
        title: "Video Details",
        length: "Duration",
        style: "Visual Style",
        tone: "Tone & Voiceover",
        styles: {
          realistic: "Photorealistic AI",
          animated: "3D / 2D Animated",
          hybrid: "Hybrid (Real + AI)"
        },
        lengths: {
          short: "Short (15-30s)",
          medium: "Standard (60s)",
          long: "Long (120s+)"
        },
        tones: {
          dynamic: "Dynamic & Clean",
          cinematic: "Epic & Cinematic"
        }
      },
      budget: {
        title: "Budget Range",
        note: "* Affects 3D render qualities, revisions, and human hours."
      },
      summary: {
        title: "Summary & Checkout",
        contact: "Your Details",
        name: "Full Name",
        email: "Email Address",
        company: "Company",
        phone: "Phone Number",
        terms: "I accept the terms and conditions"
      }
    },
    buttons: {
      back: "Back",
      next: "Continue",
      submit: "Submit Request"
    }
  },
  contact: {
    title1: "Get In",
    title2: "Touch",
    subtitle: "Have a project in mind, or just want to explore what AI can do for your brand? Reach out to our team.",
    email: "Email",
    phone: "Phone",
    address: "Address",
    hours: "Hours",
    hoursVal: "Mon-Fri, 9am - 6pm",
    addressVal:
      "27–29 Nikola Kopernik St., Floor 2, Office 17, Geo Milev, Sofia, Bulgaria",
    copyAddress: "Copy address",
    formTitle: "Send a Message",
    name: "Name",
    emailLbl: "Email",
    subject: "Subject",
    subjectPh: "",
    aboutOptions: {
      order_video: "I want to order a video",
      question: "I want to ask a question",
      collaborate: "I want to collaborate",
      partner: "I want to partner",
      other: "Other",
    },
    foundUs: "How did you find us?",
    foundUsPh: "",
    foundUsOptions: {
      google: "Google Search",
      social: "Social media",
      instagram: "Instagram",
      tiktok: "TikTok",
      youtube: "YouTube",
      referral: "Recommendation / referral",
      event: "Event / conference",
      other: "Other",
    },
    phoneLbl: "Phone",
    message: "Message",
    messagePh: "Tell us about it...",
    terms: {
      prefix: "I agree to the",
      link: "Terms and Conditions",
      suffix: ".",
    },
    send: "Send",
    sending: "Sending…",
    sendSuccessTitle: "Message sent",
    sendSuccessBody: "Thank you - we have received your message and will get back to you shortly.",
    sendErrorTitle: "Something went wrong",
    sendErrorBody: "We could not send your message. Please try again in a moment or email us directly."
  },
  quoteForm: {
    title1: "Request a",
    title2: "Quote",
    /** Eyebrow above the wizard once a service is picked: "{service} · step 2 of 5". */
    stepOf: "step {current} of {total}",
    serviceNames: {
      video: "AI video",
      images: "AI images",
      mascot: "Brand mascot",
      automation: "Automation",
    },
    steps: {
      service: "Service",
      script: "Script",
      goal: "Goal",
      video: "Video",
      details: "Details",
      contact: "Contact",
    },
    back: "Back",
    next: "Next",
    submit: "Send request",
    sending: "Sending…",
    script: {
      title: "Do you have a script ready?",
      options: {
        ready: {
          label: "Yes, I have a script",
          hint: "Attach it or paste it as text",
        },
        none: {
          label: "No, I want you to write it",
          hint: "We'll propose a script based on your brief",
        },
      },
      textLabel: "Describe your idea or script",
      textPh: "Tell us what should happen in the video…",
      uploadLabel: "Attach a file with your script or idea",
    },
    video: {
      title: "What is the main goal of the video?",
      specsTitle: "Video details",
      goalLabel: "What is the main goal?",
      goalOtherLabel: "What is the goal?",
      goalOtherPh: "Briefly describe the goal of the video",
      goals: {
        sales: "Increase sales",
        awareness: "Raise brand awareness",
        launch: "Introduce a new product/service",
        trust: "Build image & trust",
        education: "Educate customers or your team",
        other: "Other",
      },
      lengthLabel: "How long should the video be?",
      lengthFlexibleLabel: "I don't know - you recommend",
      seconds: "sec",
      minutes: "min",
      lengthMax: "5+ min",
      formatLabel: "What format do you need?",
      formats: {
        vertical: { label: "Vertical", hint: "9:16 - Reels, TikTok, Stories" },
        horizontal: { label: "Horizontal", hint: "16:9 - YouTube, website, TV" },
      },
    },
    style: {
      title: "Look & style",
      voiceLabel: "Will there be a voice-over?",
      voices: {
        yes: "Yes",
        no: "No",
      },
      refsLabel: "Do you have example videos? Share a link",
      refsPh: "Link to an example video - your own or another ad…",
      refsUploadLabel: "Attach materials for the video",
      refsUploadHint:
        "The product, person or service to be visualized in the video, or examples of the visual style.",
    },
    details: {
      title: "Distribution & timing",
      platformsLabel: "Where will the video be published?",
      platforms: {
        instagram: "Instagram",
        tiktok: "TikTok",
        facebook: "Facebook",
        youtube: "YouTube",
        website: "Website",
        screens: "Venue / event screen",
      },
      deadlineLabel: "When do you need the finished video?",
      noDeadline: "No hard deadline",
      prevWeek: "Previous week",
      nextWeek: "Next week",
      notesLabel: "Anything else important we should know?",
      notesPh: "An upcoming event, partner requirements, past experience with video…",
    },
    contactStep: {
      title: "Contact details",
      subtitle: "We'll send your quote to the email you provide.",
      company: "Company",
    },
    images: {
      specsTitle: "What images do you need?",
      countLabel: "How many images?",
      counts: {
        few: "1-5",
        some: "6-20",
        many: "21-50",
        bulk: "50+",
      },
      resolutionLabel: "Resolution",
      resolutions: {
        "1080p": "1080p",
        "2k": "2K",
        "4k": "4K",
      },
      ratioLabel: "Aspect ratio",
      ratioHint: "Pick every format you need.",
      ratios: {
        "16:9": { label: "16:9", hint: "Landscape - web, banners, TV" },
        "9:16": { label: "9:16", hint: "Portrait - Stories, Reels, TikTok" },
        "4:5": { label: "4:5", hint: "Feed posts" },
        "1:1": { label: "1:1", hint: "Square - profile, catalogue" },
        "3:2": { label: "3:2", hint: "Photo - print, hero images" },
        other: { label: "Other / mixed", hint: "Tell us in the brief" },
      },
      briefTitle: "Describe the images",
      briefLabel: "What should the images show?",
      briefPh: "Products, scenes, mood, colours, text on the image, what they are for…",
      uploadLabel: "Products for the images / example images",
      uploadHint: "Photos of the product, your logo, or examples of the look you want.",
      linksLabel: "Links to examples (optional)",
      linksPh: "Instagram post, website, Pinterest board…",
      timingTitle: "Usage & timing",
      usageLabel: "Where will the images be used?",
      usages: {
        website: "Website",
        social: "Social media",
        ads: "Paid ads",
        shop: "Online shop / marketplace",
        print: "Print",
      },
      deadlineLabel: "When do you need the images?",
    },
    mascot: {
      styleTitle: "What kind of mascot?",
      typeLabel: "Type",
      types: {
        "2d": { label: "2D", hint: "Illustrated, flat or shaded" },
        "3d": { label: "3D", hint: "Rendered character with depth" },
        unsure: { label: "Not sure yet", hint: "We'll recommend" },
      },
      styleLabel: "Style",
      styles: {
        cartoon: "Cartoon / playful",
        realistic: "Realistic",
        minimal: "Minimal / geometric",
        open: "Open - surprise me",
      },
      usageLabel: "Where will the mascot live?",
      usages: {
        video: "Videos & ads",
        social: "Social media",
        website: "Website & app",
        merch: "Print & merchandise",
      },
      briefTitle: "Tell us about the character",
      briefLabel: "Who is the mascot and what is it like?",
      briefPh: "Your brand, audience, the character's personality, a name if you have one…",
      uploadLabel: "Brand assets & references",
      uploadHint: "Logo, brand colours, sketches or examples of mascots you like.",
      linksLabel: "Links to references (optional)",
      linksPh: "Website, Instagram, a mascot you like…",
      timingTitle: "Deliverables & timing",
      deliverablesLabel: "What do you need at the end?",
      deliverables: {
        poses: "Set of poses",
        expressions: "Facial expressions",
        animation: "Animated versions",
        stickers: "Stickers / emoji",
        model: "3D model file",
      },
      deadlineLabel: "When do you need the mascot?",
    },
    automation: {
      scopeTitle: "What should we automate?",
      tasksLabel: "What do you want to produce automatically?",
      tasks: {
        productVideos: "Product videos",
        socialPosts: "Social media posts",
        adVariations: "Ad variations",
        imageVariations: "Image variations & backgrounds",
        personalized: "Personalized videos",
        other: "Something else",
      },
      volumeLabel: "Volume per month",
      volumes: {
        small: "up to 10",
        medium: "10-50",
        large: "50-200",
        xl: "200+",
      },
      briefTitle: "Describe the pipeline",
      inputsLabel: "What do you already have?",
      inputs: {
        feed: "Product feed / catalogue",
        images: "Product images",
        texts: "Texts & scripts",
        brandKit: "Brand kit",
        none: "Nothing yet",
      },
      briefLabel: "How should it work?",
      briefPh: "What goes in, what comes out, how often, where it gets published…",
      uploadLabel: "Examples & materials",
      uploadHint: "A sample of the input (feed, images) or of the result you expect.",
      linksLabel: "Links to examples (optional)",
      linksPh: "Your shop, a competitor's feed, an example video…",
      timingTitle: "Destinations & timing",
      platformsLabel: "Where will the output be published?",
      deadlineLabel: "When would you like to start?",
    },
    timing: {
      noDeadline: "No hard deadline",
      notesLabel: "Anything else important we should know?",
      notesPh: "Budget range, an upcoming launch, requirements from a partner…",
    },
    upload: {
      drop: "Drop a file here or",
      browse: "browse",
      hint: "PDF, Word, text or images - up to 4.4 MB total",
      remove: "Remove file",
      errorTooLarge: "The files exceed the 4.4 MB total limit.",
      errorType: "This file type is not supported.",
      errorCount: "You can attach up to 5 files.",
    },
    successTitle: "We received your request!",
    successBody:
      "We'll review the details and send you a personalized quote as soon as possible.",
    successAgain: "New request",
    successCta: "Explore our other services",
  },
  footer: {
    desc: "At DreamTeam, we handle end-to-end video production using the latest AI technologies.",
    orderVideo: "Order a video",
    pricing: "Pricing",
    company: "Company",
    aboutUs: "About us",
    careers: "Careers",
    policies: "Policies",
    cookies: "Cookies",
    terms: "Terms and conditions",
    resources: "Resources",
    customers: "Customers",
    ourWork: "Our work",
    socials: "Socials",
    contact: "Contact",
    address: "San Francisco, Silicon Valley, CA, USA",
    reviews: "Reviews",
    googleReviews: "reviews on Google",
    copy: "DreamTeam. All rights reserved.",
    made: "Made with ♥ and AI."
  },
  legal: {
    home: "Home",
    backToHome: "Back to home",
    lastUpdated: "Last updated:",
    privacyTitle: "Privacy Policy",
    termsTitle: "Terms and Conditions",
  },
  // The cookie banner (`components/consent/consent-banner.tsx`). The `cookies` lines name what each category
  // stores and for how long - keep them in step with the vendors in `tracking-scripts.tsx` / `posthog-provider.tsx`
  // and with the privacy policy.
  consent: {
    title: "Cookies",
    // Short on purpose: it sits right under the "Cookies" heading and carries the settings / policy links, so the
    // whole block stays two lines (a longer line wrapped to three and the card grew by 16px).
    text: "Analytics and ads — only with your consent.",
    privacy: "Privacy policy",
    acceptAll: "Accept all",
    necessaryOnly: "Necessary only",
    save: "Save choices",
    settings: "Settings",
    close: "Close",
    embeds:
      "Videos play from Bunny Stream and YouTube (privacy-enhanced mode: YouTube sets its cookies only when you press play). The Clutch review badge loads from clutch.co.",
    categories: {
      necessary: {
        name: "Necessary",
        status: "Always on",
        desc: "Remember your language, theme and this cookie choice, and keep you signed in if you log in. The site does not work properly without them.",
        cookies: "dt_consent (6 months) · sb-* sign-in session (until log out) · app-lang, theme (browser storage)",
      },
      analytics: {
        name: "Analytics",
        desc: "PostHog, on servers in the EU: how the site is used - pages, clicks and session recordings - so we can improve it.",
        cookies: "ph_* (1 year)",
      },
      marketing: {
        name: "Marketing",
        desc: "Google Ads and OpenAI: whether our ads lead to inquiries, and audiences for remarketing.",
        cookies: "_gcl_au (90 days) · __obref (1 year)",
      },
    },
  },
  training: {
    metaTitle: "AI Video Training | DreamTeam",
    // Skool training temporarily hidden. Original:
    // "Individual AI video consultations, Skool community courses, and team workshops from DreamTeam."
    metaDescription:
      "Individual AI video consultations and team workshops from DreamTeam.",
    eyebrow: "Hands-on AI video training",
    title: "Training for AI production",
    title1: "Training",
    title2: "for AI production",
    subtitle:
      "Learn the workflows we ship for clients - from briefing and prompt design to look development, editing, and delivery. Pick the format that matches your pace and team size.",
    viewAll: "View all programs",
    comingSoon: "Coming soon",
    modalInquiryTitle: "Interested in this program?",
    modalInquirySubtitle: "Leave your details and we'll get back to you shortly.",
    inquirySubjectPrefix: "Training inquiry:",
    inquiryFormStatePrefix: "Form: Training (page) - ",
    inquiryForm: {
      targetLabel: "What do you want to learn?",
      targetPlaceholder: "e.g. prompt workflows, editing, producing short ads…",
      whyLabel: "Why do you want to learn it?",
      whyPlaceholder: "What are you trying to achieve / ship?",
    },
    cards: {
      individual: {
        title: "Individual lessons",
        featureTag: "Private lessons",
        featureSummary:
          "Personal lessons to learn AI video creation - from idea and script to prompts, look, editing, and delivery.",
        suitableFor:
          "1:1 training for people who want to learn how to create AI videos - from idea and script to prompts, look, editing, and delivery.",
        cta: "Contact us",
        image: "/trainings/individual_banner.jpeg",
        modalIntro:
          "Personal step-by-step lessons. We work on your style (or a sample brief) and teach you how to produce AI videos yourself with clear exercises and homework.",
        features: [
          { icon: "book", text: "From zero to a finished AI video: script → shots → edit → export" },
          { icon: "wand", text: "Prompts + style: consistent characters/looks and better shot control" },
          { icon: "tool", text: "Tools & settings: what to use and how to set it up for your goals" },
          { icon: "message", text: "Feedback on your videos with concrete fixes (pace, VO, captions, composition)" },
          { icon: "checklist", text: "Homework + a repeatable checklist you can follow after the lesson" },
        ],
        modalTabs: { highlights: "What's included", more: "Practical details" },
        outcomesTitle: "",
        outcomesSubtitle: "",
        outcomes: [
          { icon: "sparkles", text: "Your first AI video created by you (with guidance during the lesson)." },
          { icon: "stack", text: "A mini-system: brief/script templates + a prompt & shot structure you can reuse." },
          { icon: "shield", text: "Basics for brand, rights, and disclosure so you can ship safer, publish-ready versions." },
        ],
        logisticsTitle: "How it works",
        logistics: [
          "60–90 minutes on Google Meet/Zoom. Optional recording + short recap after.",
          "Beginner-friendly and advanced-friendly - we adapt the pace to your level.",
          "Best results: book 2–4 sessions so practice compounds between calls.",
        ],
      },
      skool: {
        title: "Online course (Skool)",
        featureTag: "SKOOL",
        featureSummary:
          "Structured path with modules, templates, and community critique as you build real AI video projects.",
        suitableFor:
          "For learners who want a structured path with templates and community critique while building their first real AI videos.",
        cta: "Open Skool",
        image: "/trainings/skool_banner.jpeg",
        modalIntro:
          "A structured program through our AI video stack. Designed to help you build a repeatable process - not just consume theory.",
        features: [
          { icon: "book", text: "Modules from brief → prompts → shots → edit → delivery" },
          { icon: "sparkles", text: "Assignments applied to your brand or a portfolio piece" },
          { icon: "users", text: "Community Q&A + critique between milestones" },
          { icon: "clock", text: "Updates as tooling and model options change" },
          { icon: "rocket", text: "Templates + checklists we use before client reviews" },
        ],
        modalTabs: { highlights: "What's included", more: "Practical details" },
        outcomesTitle: "",
        outcomesSubtitle: "",
        outcomes: [
          { icon: "stack", text: "A personal playbook (templates + checklists) for brief → prompts → shots → edit → delivery." },
          { icon: "users", text: "A feedback loop: critique, iterations, and improvements between milestones." },
          { icon: "certificate", text: "A finished portfolio piece/campaign with clear quality criteria and next steps." },
        ],
        logisticsTitle: "Format & access",
        logistics: [
          "Hosted on Skool: async lessons plus scheduled live touchpoints and community threads.",
          "Expect several hours per week when a module is active - you control depth vs. speed.",
          "Materials include Notion templates, shot lists, and export checklists you can clone.",
        ],
      },
      team: {
        title: "Team training",
        featureTag: "TEAM",
        featureSummary:
          "Workshops for groups: design ideas, generate scene images and clips, edit together, and keep style consistent.",
        suitableFor:
          "For teams learning how to create AI videos together - from shaping an idea to a finished edit, with shared steps everyone can repeat.",
        cta: "Request a proposal",
        image: "/trainings/corporate_banner.jpeg",
        modalIntro:
          "Hands-on workshops for your group: design and iterate on concepts, generate scene images and video clips, edit them into one piece, and keep look, characters, and pacing consistent.",
        features: [
          { icon: "wand", text: "Ideation & iteration: briefs, story beats, and feedback until the concept is clear" },
          { icon: "sparkles", text: "Scene images: prompts and settings for stills that match your look and shot list" },
          { icon: "video", text: "Video clips: generate motion shots, pick takes, and line them up for edit" },
          { icon: "tool", text: "Editing together: cuts, VO, captions, pacing, and export-ready delivery" },
          { icon: "book", text: "Consistency: lock characters, wardrobe, color, and style across every scene" },
        ],
        modalTabs: { highlights: "What's included", more: "Practical details" },
        outcomesTitle: "",
        outcomesSubtitle: "",
        outcomes: [
          { icon: "stack", text: "A shared workflow your team can repeat: idea → images → clips → edit → export." },
          { icon: "users", text: "Everyone aligned on prompts, shot lists, and QC so outputs stay on-brand." },
          { icon: "checklist", text: "Templates and checklists for consistency checks before you ship." },
        ],
        logisticsTitle: "How it works",
        logistics: [
          "Live sessions on Google Meet/Zoom - remote, on-site, or hybrid.",
          "We work from your real briefs or sample campaigns (NDA-friendly).",
          "Flexible format: half-day intensives or multi-week programs for teams of any size.",
        ],
      },
    },
    skoolUrl: "https://www.skool.com/dream-team-ai-video-2879/about",
  },
  mobileNav: {
    home: "Home",
    process: "Process",
    work: "Work",
    services: "Services",
    contact: "Contact",
    training: "Training"
  },
  a11y: {
    language: "Language",
    bulgarian: "Bulgarian",
    english: "English",
    chinese: "Chinese",
    toggleTheme: "Toggle color theme",
    menu: "Menu",
  },
};

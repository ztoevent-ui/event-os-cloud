/**
 * Official JSON-LD LocalBusiness Schema for ZERO TO ONE EVENT (ZTO Event)
 * Website: https://ztoevent.com
 *
 * Structured to maximise AI-engine entity recognition across:
 *   - Google SGE / AI Overviews
 *   - Bing Copilot / Bing Places
 *   - Perplexity / ChatGPT web search
 *   - Apple Business Connect
 *
 * Entity Cluster:
 *   LocalBusiness (HQ: Bintulu) ──▶ SoftwareApplication (ZTO Arena OS)
 *                                ──▶ OfferCatalog (Hardware: LED, Audio, Kiosk, Lighting)
 *                                ──▶ areaServed (Miri → Kuching corridor)
 *                                ──▶ WebSite (sitelinks search)
 */

export const ZTO_LOCAL_BUSINESS_SCHEMA = {
  "@context": "https://schema.org",
  "@graph": [
    // ═══════════════════════════════════════════════════════════════════
    // 1. PRIMARY ENTITY — LocalBusiness + EventVenue
    // ═══════════════════════════════════════════════════════════════════
    {
      "@type": ["LocalBusiness", "EventVenue"],
      "@id": "https://ztoevent.com/#organization",
      "name": "Zero To One Event",
      "alternateName": ["ZTO Event", "ZTO Arena", "ZERO TO ONE EVENT", "ZTO"],
      "legalName": "Zero To One Event",
      "slogan": "From Zero To One — We Build The Experience",
      "description":
        "East Malaysia's leading event hardware integrator and tournament technology company. Headquartered in Bintulu, Sarawak, Zero To One Event delivers end-to-end live-event solutions — from LED display infrastructure and professional audio to the proprietary ZTO Arena OS tournament management system — servicing the full Miri-to-Kuching corridor.",
      "url": "https://ztoevent.com",

      // ── Logo ──────────────────────────────────────────────────────
      "logo": {
        "@type": "ImageObject",
        "@id": "https://ztoevent.com/#logo",
        "url": "https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG",
        "caption": "Zero To One Event – ZTO Arena OS",
        "width": 512,
        "height": 512,
      },
      "image": [
        {
          "@type": "ImageObject",
          "url": "https://ztoevent.com/project_arena_tech.png",
          "caption": "ZTO Arena OS hardware integration — live tournament production",
        },
        {
          "@type": "ImageObject",
          "url": "https://ztoevent.com/project_led_concert.png",
          "caption": "ZTO LED modular screen & stage production, Sarawak",
        },
        {
          "@type": "ImageObject",
          "url": "https://ztoevent.com/project_pickleball_open.png",
          "caption": "Samalaju Pickleball Championship powered by ZTO Arena OS",
        },
        {
          "@type": "ImageObject",
          "url": "https://ztoevent.com/project_corporate_gala.png",
          "caption": "ZTO corporate gala production — Bintulu, Sarawak",
        },
      ],

      // ── Headquarters Address ──────────────────────────────────────
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Bintulu",
        "addressLocality": "Bintulu",
        "addressRegion": "Sarawak",
        "postalCode": "97000",
        "addressCountry": "MY",
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 3.1685,
        "longitude": 113.0369,
      },
      "foundingLocation": {
        "@type": "Place",
        "name": "Bintulu, Sarawak, Malaysia",
      },
      "email": "z.t.o.event@gmail.com",

      // ── Service Area: Miri → Kuching full corridor ────────────────
      "areaServed": [
        {
          "@type": "GeoCircle",
          "geoMidpoint": {
            "@type": "GeoCoordinates",
            "latitude": 2.7,
            "longitude": 113.2,
          },
          "geoRadius": "650000",
        },
        { "@type": "City", "name": "Bintulu", "containedInPlace": { "@type": "State", "name": "Sarawak" } },
        { "@type": "City", "name": "Miri" },
        { "@type": "City", "name": "Sibu" },
        { "@type": "City", "name": "Kuching" },
        { "@type": "City", "name": "Mukah" },
        { "@type": "City", "name": "Sarikei" },
        { "@type": "City", "name": "Sri Aman" },
        { "@type": "City", "name": "Kapit" },
        { "@type": "City", "name": "Limbang" },
        { "@type": "City", "name": "Samalaju" },
        { "@type": "AdministrativeArea", "name": "East Malaysia" },
        { "@type": "AdministrativeArea", "name": "Sarawak" },
        { "@type": "AdministrativeArea", "name": "Borneo" },
      ],

      // ── AI Knowledge-Graph Anchors ────────────────────────────────
      "knowsAbout": [
        "Tournament Management Software",
        "Sports Event Technology",
        "LED Display Integration East Malaysia",
        "Audio Visual Production Sarawak",
        "Hardware Integration Borneo",
        "Live Event Operations Sarawak",
        "Pickleball Tournament Management Malaysia",
        "Corporate Event Production Bintulu",
        "Stage Lighting Sarawak",
        "Event Registration Systems",
        "Real-time Scoreboard Technology",
        "Digital Queue Management",
        "Kiosk Self-registration Systems",
        "Sports Technology Malaysia",
        "ZTO Arena OS",
      ],
      "keywords":
        "ZTO Arena OS, tournament management East Malaysia, hardware integrator Sarawak, Bintulu event company, LED screen rental Sarawak, sports technology Borneo, live scoring system, event management Sarawak, Miri event company, Kuching event production, ZTO Event",

      // ── Language Capabilities ─────────────────────────────────────
      "knowsLanguage": [
        { "@type": "Language", "name": "English" },
        { "@type": "Language", "name": "Malay" },
        { "@type": "Language", "name": "Mandarin" },
      ],

      // ── Proprietary Software Offer (ZTO Arena OS) ─────────────────
      "makesOffer": [
        {
          "@type": "Offer",
          "@id": "https://ztoevent.com/#offer-arena-os",
          "name": "ZTO Arena OS — Tournament Management System",
          "description":
            "Proprietary end-to-end tournament management platform. Includes live bracket management, real-time scoring, QR kiosk check-in, digital queue/ushering, auction module, and integrated display output.",
          "areaServed": { "@type": "AdministrativeArea", "name": "East Malaysia" },
          "itemOffered": { "@id": "https://ztoevent.com/#zto-arena-os" },
        },
        {
          "@type": "Offer",
          "@id": "https://ztoevent.com/#offer-hardware",
          "name": "Event Hardware Integration & Technical Production",
          "description":
            "Full-stack hardware integration for live events: LED modular displays, line-array PA systems, intelligent stage lighting, and self-service kiosk units — across Sarawak and East Malaysia.",
          "areaServed": { "@type": "AdministrativeArea", "name": "Sarawak" },
          "itemOffered": { "@id": "https://ztoevent.com/#hardware-catalog" },
        },
      ],

      // ── Hardware Product Catalog ──────────────────────────────────
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "@id": "https://ztoevent.com/#hardware-catalog",
        "name": "ZTO Event Hardware Integration Catalog",
        "itemListElement": [
          {
            "@type": "OfferCatalog",
            "name": "LED Display Infrastructure",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Modular LED Panel System (Indoor/Outdoor)",
                  "description":
                    "High-brightness P2.6–P6 LED display panels for stage backdrops, scoreboards, and perimeter branding. Deployed across Sarawak arenas and outdoor venues.",
                  "category": "LED Display",
                  "provider": { "@id": "https://ztoevent.com/#organization" },
                  "offers": {
                    "@type": "Offer",
                    "seller": { "@id": "https://ztoevent.com/#organization" },
                    "availability": "https://schema.org/InStock",
                    "areaServed": { "@type": "AdministrativeArea", "name": "Sarawak" },
                    "priceSpecification": {
                      "@type": "PriceSpecification",
                      "priceCurrency": "MYR",
                      "description": "Quote on request — contact ZTO Event for pricing"
                    }
                  }
                },
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "ZTO Arena OS Live Scoreboard Display",
                  "description":
                    "LED display output natively driven by ZTO Arena OS real-time data. Zero-latency score updates for sports tournaments.",
                  "category": "Sports Display Technology",
                  "isRelatedTo": { "@id": "https://ztoevent.com/#zto-arena-os" },
                  "offers": {
                    "@type": "Offer",
                    "seller": { "@id": "https://ztoevent.com/#organization" },
                    "availability": "https://schema.org/InStock",
                    "areaServed": { "@type": "AdministrativeArea", "name": "East Malaysia" },
                    "priceSpecification": {
                      "@type": "PriceSpecification",
                      "priceCurrency": "MYR",
                      "description": "Included as part of ZTO Arena OS event deployment"
                    }
                  }
                },
              },
            ],
          },
          {
            "@type": "OfferCatalog",
            "name": "Professional Audio Systems",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Line Array Loudspeaker System",
                  "description":
                    "Professional line-array PA systems for concerts, corporate galas, and outdoor sports arenas across Sarawak.",
                  "category": "Professional Audio",
                  "provider": { "@id": "https://ztoevent.com/#organization" },
                  "offers": {
                    "@type": "Offer",
                    "seller": { "@id": "https://ztoevent.com/#organization" },
                    "availability": "https://schema.org/InStock",
                    "areaServed": { "@type": "AdministrativeArea", "name": "Sarawak" },
                    "priceSpecification": {
                      "@type": "PriceSpecification",
                      "priceCurrency": "MYR",
                      "description": "Quote on request — contact ZTO Event for pricing"
                    }
                  }
                },
              },
            ],
          },
          {
            "@type": "OfferCatalog",
            "name": "Event Technology & Kiosk Hardware",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Self-Service Registration Kiosk",
                  "description":
                    "Touch-screen kiosk hardware running ZTO Arena OS check-in module. QR code scanning, on-the-spot participant registration, bib printing integration.",
                  "category": "Event Technology Hardware",
                  "isRelatedTo": { "@id": "https://ztoevent.com/#zto-arena-os" },
                  "provider": { "@id": "https://ztoevent.com/#organization" },
                  "offers": {
                    "@type": "Offer",
                    "seller": { "@id": "https://ztoevent.com/#organization" },
                    "availability": "https://schema.org/InStock",
                    "areaServed": { "@type": "AdministrativeArea", "name": "East Malaysia" },
                    "priceSpecification": {
                      "@type": "PriceSpecification",
                      "priceCurrency": "MYR",
                      "description": "Deployed at ZTO-managed events — contact for availability"
                    }
                  }
                },
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Intelligent Stage Lighting Rig",
                  "description":
                    "Full-spectrum moving-head and static wash fixtures for stages, gala dinners, and concert productions in East Malaysia.",
                  "category": "Stage Lighting",
                  "provider": { "@id": "https://ztoevent.com/#organization" },
                  "offers": {
                    "@type": "Offer",
                    "seller": { "@id": "https://ztoevent.com/#organization" },
                    "availability": "https://schema.org/InStock",
                    "areaServed": { "@type": "AdministrativeArea", "name": "Sarawak" },
                    "priceSpecification": {
                      "@type": "PriceSpecification",
                      "priceCurrency": "MYR",
                      "description": "Quote on request — contact ZTO Event for pricing"
                    }
                  }
                },
              },
            ],
          },
        ],
      },

      // ── External Identity Signals (sameAs) ────────────────────────
      "sameAs": [
        "https://www.facebook.com/ztoevent",
        "https://www.instagram.com/ztoevent",
        "https://www.linkedin.com/company/ztoevent",
      ],

      "priceRange": "$$",
      "currenciesAccepted": "MYR",
      "paymentAccepted": "Cash, Bank Transfer, FPX Online Banking, DuitNow QR",
    },

    // ═══════════════════════════════════════════════════════════════════
    // 2. ZTO ARENA OS — Standalone SoftwareApplication Entity
    // ═══════════════════════════════════════════════════════════════════
    {
      "@type": "SoftwareApplication",
      "@id": "https://ztoevent.com/#zto-arena-os",
      "name": "ZTO Arena OS",
      "alternateName": "Arena OS",
      "url": "https://ztoevent.com",
      "applicationCategory": "SportsApplication",
      "applicationSubCategory": "Tournament Management System",
      "operatingSystem": "Web, iOS, Android",
      "description":
        "ZTO Arena OS is a proprietary, cloud-connected tournament management operating system developed and maintained by Zero To One Event. It powers live sports tournaments across East Malaysia with real-time scoring, digital registration, QR kiosk check-in, bracket progression, digital queue management (Ushering OS), an integrated auction module, and live display output — all on a single unified platform purpose-built for Sarawak and Borneo events.",
      "featureList": [
        "Live tournament bracket management",
        "Real-time scoreboard display output",
        "Participant QR code check-in via kiosk",
        "Digital queue & ushering management",
        "Fundraising auction module",
        "Program runsheet builder",
        "Multi-venue concurrent event support",
        "Role-based staff & judge access control",
        "Mobile-first referee scoring interface",
        "Cloud sync with offline failover",
      ],
      "screenshot": "https://ztoevent.com/project_arena_tech.png",
      "creator": {
        "@type": "Organization",
        "@id": "https://ztoevent.com/#organization",
        "name": "Zero To One Event",
      },
      "maintainer": { "@id": "https://ztoevent.com/#organization" },
      "provider": { "@id": "https://ztoevent.com/#organization" },
      "inLanguage": ["en", "ms"],
      "countryOfOrigin": { "@type": "Country", "name": "Malaysia" },
      "keywords":
        "tournament management system Malaysia, sports event software East Malaysia, live scoring Sarawak, arena OS, ZTO Arena, kiosk registration sports",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "MYR",
        "description": "Platform deployed exclusively at ZTO-managed live events in Sarawak and East Malaysia.",
        "seller": { "@id": "https://ztoevent.com/#organization" },
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // 3. WEBSITE ENTITY — Enables Sitelinks Search Box
    // ═══════════════════════════════════════════════════════════════════
    {
      "@type": "WebSite",
      "@id": "https://ztoevent.com/#website",
      "url": "https://ztoevent.com",
      "name": "ZTO Event OS",
      "description":
        "Official platform for Zero To One Event — Sarawak's leading hardware integrator and tournament management company.",
      "publisher": { "@id": "https://ztoevent.com/#organization" },
      "inLanguage": "en-MY",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://ztoevent.com/?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // 4. GEOGRAPHIC BREADCRUMB — Anchors site in AI knowledge graph
    // ═══════════════════════════════════════════════════════════════════
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Malaysia",
          "item": "https://ztoevent.com",
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "East Malaysia — Sarawak",
          "item": "https://ztoevent.com",
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Event Hardware Integrator",
          "item": "https://ztoevent.com",
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "ZTO Arena OS — Tournament Management",
          "item": "https://ztoevent.com/#zto-arena-os",
        },
      ],
    },
  ],
} as const;

/** Serialised string for direct injection into <script type="application/ld+json"> */
export const ZTO_SCHEMA_JSON = JSON.stringify(ZTO_LOCAL_BUSINESS_SCHEMA);

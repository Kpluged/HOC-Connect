export type Vehicle = {
  /** Plain-English one-line role description, e.g. "Compact crossover · 5 seats". */
  category: string;
  /** Grid-card + default detail-page-hero image. Treatment is governed by imageFit. */
  image: string;
  /**
   * "contain" = isolated product-plate cutout (transparent PNG), floated on
   * the neutral surface with padding — the house treatment. "cover" =
   * full-scene manufacturer photography, bled edge-to-edge with a
   * desaturated-at-rest/full-colour-on-hover treatment so varied source
   * lighting/backgrounds still read as one calm, monochrome-first system.
   * Defaults to "contain" when omitted.
   */
  imageFit?: "contain" | "cover";
  /**
   * Optional full-scene manufacturer photography for the detail-page hero.
   * When image itself is also a full photo (imageFit: "cover"), set this to
   * the same path so the hero gets the same full-bleed treatment.
   */
  heroPhoto?: string;
  name: string;
  slug: string;
  /** Manufacturer, for attribution — never used as a substitute for HOC's own confirmed sourcing. */
  manufacturer: string;
  segment: string;
  doors: number;
  specs: {
    /** 0 = not published by the manufacturer for this vehicle/segment, omit from display rather than showing a false "0". */
    accelSeconds: number;
    batteryKwh: number;
    drivetrain: string;
    powerKw: number;
    powerPs: number;
    /** Combined range in km. Basis (WLTP/CLTC) noted in rangeBasis — the two are not directly comparable. */
    rangeKm: number;
    rangeBasis: "WLTP" | "CLTC";
    seats: number;
    /** 0 = not published by the manufacturer, omit from display rather than showing a false "0". */
    topSpeedKmh: number;
  };
  /** Where the specs below were sourced — global manufacturer-published figures, not yet HOC-confirmed for the exact Lagos-market unit/trim. */
  sourceNote: string;
};

export const vehicles: Vehicle[] = [
  {
    category: "City hatchback · 4 seats",
    doors: 3,
    image: "/vehicles/cutouts/model-01-v2.png",
    manufacturer: "Geely",
    name: "Geely Panda Mini EV",
    segment: "City",
    slug: "geely-panda-mini-ev",
    specs: {
      accelSeconds: 0,
      batteryKwh: 17,
      drivetrain: "Rear-wheel drive",
      powerKw: 30,
      powerPs: 41,
      rangeBasis: "CLTC",
      rangeKm: 200,
      seats: 4,
      topSpeedKmh: 100,
    },
    sourceNote:
      "Long Range battery variant. Range is CLTC (Chinese test cycle) — typically more optimistic than WLTP for the same vehicle, and not directly comparable to the WLTP figures below. Manufacturer has not published a 0-100 km/h acceleration figure for this low-speed city segment. HOC's actual procured trim for Lagos is pending confirmation.",
  },
  {
    category: "City hatchback · 4 seats",
    doors: 3,
    image: "/vehicles/cutouts/model-04-v2.png",
    manufacturer: "Changan",
    name: "Changan Lumin",
    segment: "City",
    slug: "changan-lumin",
    specs: {
      accelSeconds: 0,
      batteryKwh: 28.1,
      drivetrain: "Rear-wheel drive",
      powerKw: 36,
      powerPs: 48,
      rangeBasis: "CLTC",
      rangeKm: 301,
      seats: 4,
      topSpeedKmh: 101,
    },
    sourceNote:
      "2026 long-range battery variant. Dimensions carried over from the prior generation's published figures (mini-city-car footprint, unlikely to have changed materially) — HOC should confirm against the current model year's spec sheet. Manufacturer has not published a 0-100 km/h acceleration figure for this low-speed city segment. HOC's actual procured trim for Lagos is pending confirmation.",
  },
  {
    category: "Subcompact hatchback · 5 seats",
    doors: 5,
    image: "/vehicles/cutouts/model-01-v2.png",
    manufacturer: "Dongfeng (Nammi)",
    name: "Dongfeng Nammi 01",
    segment: "City",
    slug: "dongfeng-nammi-01",
    specs: {
      accelSeconds: 0,
      batteryKwh: 42.3,
      drivetrain: "Front-wheel drive",
      powerKw: 70,
      powerPs: 94,
      rangeBasis: "CLTC",
      rangeKm: 430,
      seats: 5,
      topSpeedKmh: 0,
    },
    sourceNote:
      "2026 long-range battery variant, Dongfeng's Nammi sub-brand. Manufacturer has not published a 0-100 km/h acceleration figure or a top speed for this model. HOC's actual procured trim for Lagos is pending confirmation.",
  },
  {
    category: "Subcompact crossover SUV · 5 seats",
    doors: 5,
    image: "/vehicles/cutouts/model-02-v2.png",
    manufacturer: "Hyundai",
    name: "Hyundai Kona Electric",
    segment: "Everyday",
    slug: "hyundai-kona-electric",
    specs: {
      accelSeconds: 7.8,
      batteryKwh: 64.8,
      drivetrain: "Front-wheel drive",
      powerKw: 150,
      powerPs: 201,
      rangeBasis: "WLTP",
      rangeKm: 490,
      seats: 5,
      topSpeedKmh: 172,
    },
    sourceNote:
      "Second-generation (SX2) Kona Electric, Long Range battery. Figures are Hyundai's published global specifications; HOC's actual procured trim for Lagos is pending confirmation.",
  },
  {
    category: "Compact crossover SUV · 5 seats",
    doors: 5,
    heroPhoto: "/vehicles/byd/byd-yuan-plus.webp",
    image: "/vehicles/byd/byd-yuan-plus.webp",
    imageFit: "cover",
    manufacturer: "BYD",
    name: "BYD Atto 3",
    segment: "Everyday",
    slug: "byd-atto-3",
    specs: {
      accelSeconds: 7.3,
      batteryKwh: 60.48,
      drivetrain: "Front-wheel drive",
      powerKw: 150,
      powerPs: 204,
      rangeBasis: "WLTP",
      rangeKm: 420,
      seats: 5,
      topSpeedKmh: 160,
    },
    sourceNote:
      "Global-market Atto 3, Extended Range battery — the configuration exported to Asia/Europe/Australia/Latin America since 2022, not the China-domestic 2026 Evo variant. Figures are BYD's published global specifications; HOC's actual procured trim for Lagos is pending confirmation. Catalogue card and detail-page hero both use BYD's own press photography of the China-domestic Yuan Plus — the same underlying vehicle sold under the Atto 3 name in export markets; badge/plate visible in source image is China-domestic, not an HOC or Lagos market claim.",
  },
  {
    category: "Compact crossover SUV · 5 seats",
    doors: 5,
    image: "/vehicles/cutouts/model-03-v2.png",
    manufacturer: "GAC Aion",
    name: "GAC Aion Y",
    segment: "Everyday",
    slug: "gac-aion-y",
    specs: {
      accelSeconds: 0,
      batteryKwh: 68.2,
      drivetrain: "Front-wheel drive",
      powerKw: 150,
      powerPs: 204,
      rangeBasis: "CLTC",
      rangeKm: 600,
      seats: 5,
      topSpeedKmh: 0,
    },
    sourceNote:
      "Top LFP battery configuration; the 600 km figure is the approximate upper end of the documented 430–610 km CLTC range across trims, not a confirmed pairing with this exact battery size — treat as indicative. One of the most widely used EVs in Chinese ride-hailing fleets. Manufacturer has not published a 0-100 km/h acceleration figure or top speed. HOC's actual procured trim for Lagos is pending confirmation.",
  },
  {
    category: "Compact sedan · 5 seats",
    doors: 4,
    image: "/vehicles/hero-saloon-side-v1.png",
    manufacturer: "GAC Aion",
    name: "GAC Aion S",
    segment: "Premium",
    slug: "gac-aion-s",
    specs: {
      accelSeconds: 0,
      batteryKwh: 69.9,
      drivetrain: "Front-wheel drive",
      powerKw: 165,
      powerPs: 224,
      rangeBasis: "CLTC",
      rangeKm: 610,
      seats: 5,
      topSpeedKmh: 0,
    },
    sourceNote:
      "Aion S Plus, top battery/motor configuration. Manufacturer has not published a 0-100 km/h acceleration figure or top speed for this trim. HOC's actual procured trim for Lagos is pending confirmation.",
  },
  {
    category: "Mid-size crossover SUV · 5 seats",
    doors: 5,
    image: "/vehicles/cutouts/model-02-v2.png",
    manufacturer: "Changan (Deepal)",
    name: "Deepal S07",
    segment: "Premium",
    slug: "deepal-s07",
    specs: {
      accelSeconds: 6.7,
      batteryKwh: 68.8,
      drivetrain: "Rear-wheel drive",
      powerKw: 192,
      powerPs: 262,
      rangeBasis: "CLTC",
      rangeKm: 628,
      seats: 5,
      topSpeedKmh: 180,
    },
    sourceNote:
      "Pure-electric (BEV) configuration, top LFP battery — Deepal also offers a range-extender (EREV) variant not listed here. Deepal is Changan's EV subsidiary, developed jointly with Huawei and CATL. HOC's actual procured trim for Lagos is pending confirmation.",
  },
  {
    category: "Full-size liftback · 5 seats",
    doors: 5,
    image: "/vehicles/hero-saloon-side-v1.png",
    manufacturer: "Dongfeng (eπ)",
    name: "Dongfeng eπ 007",
    segment: "Premium",
    slug: "dongfeng-ep-007",
    specs: {
      accelSeconds: 6.8,
      batteryKwh: 73.5,
      drivetrain: "Rear-wheel drive",
      powerKw: 200,
      powerPs: 272,
      rangeBasis: "CLTC",
      rangeKm: 650,
      seats: 5,
      topSpeedKmh: 0,
    },
    sourceNote:
      "Single-motor RWD configuration, top LFP battery — Dongfeng also offers a dual-motor AWD performance variant (0-100 in 3.9s) and an EREV range-extender variant, neither listed here. Manufacturer has not published a top speed. HOC's actual procured trim for Lagos is pending confirmation.",
  },
  {
    category: "City hatchback · 5 seats",
    doors: 5,
    heroPhoto: "/vehicles/byd/byd-seagull.webp",
    image: "/vehicles/byd/byd-seagull.webp",
    imageFit: "cover",
    manufacturer: "BYD",
    name: "BYD Seagull",
    segment: "City",
    slug: "byd-seagull",
    specs: {
      accelSeconds: 0,
      batteryKwh: 0,
      drivetrain: "Rear-wheel drive",
      powerKw: 0,
      powerPs: 0,
      rangeBasis: "CLTC",
      rangeKm: 0,
      seats: 5,
      topSpeedKmh: 0,
    },
    sourceNote:
      "China-domestic Seagull, exported to some markets as Dolphin Surf/Dolphin Mini. BYD's Nigeria site has no product pages yet, and battery/range/power figures were not confirmed from BYD's accessible official pages during this pass — treat all numeric specs as pending HOC/manufacturer confirmation. Both the catalogue card and detail-page hero use BYD's own press photography (full-scene, not an isolated product-plate cutout like the rest of the catalogue).",
  },
  {
    category: "Mid-size pickup truck · 5 seats",
    doors: 4,
    heroPhoto: "/vehicles/byd/byd-shark-6.webp",
    image: "/vehicles/byd/byd-shark-6.webp",
    imageFit: "cover",
    manufacturer: "BYD",
    name: "BYD Shark 6",
    segment: "Premium",
    slug: "byd-shark-6",
    specs: {
      accelSeconds: 0,
      batteryKwh: 0,
      drivetrain: "All-wheel drive (plug-in hybrid)",
      powerKw: 321,
      powerPs: 431,
      rangeBasis: "CLTC",
      rangeKm: 0,
      seats: 5,
      topSpeedKmh: 0,
    },
    sourceNote:
      "DM-o plug-in hybrid double-cab pickup. Power (321 kW combined) and 2,500 kg braked towing capacity are confirmed from BYD's official South Africa product page; the PS figure is a standard kW-to-PS conversion of that published number, not independently stated by BYD. Battery capacity, electric/combined range, acceleration, and top speed were not published on the accessible page — treat as pending. Both the catalogue card and detail-page hero use BYD's own press photography (full-scene, not an isolated product-plate cutout like the rest of the catalogue). HOC's confirmed specs, pricing, and Lagos availability remain pending.",
  },
  {
    category: "Full-size off-road SUV · 5 seats",
    doors: 5,
    heroPhoto: "/vehicles/byd/bao-8.webp",
    image: "/vehicles/byd/bao-8.webp",
    imageFit: "cover",
    manufacturer: "BYD (Fang Cheng Bao)",
    name: "Fang Cheng Bao Bao 8",
    segment: "Premium",
    slug: "bao-8",
    specs: {
      accelSeconds: 0,
      batteryKwh: 0,
      drivetrain: "All-wheel drive (plug-in hybrid)",
      powerKw: 0,
      powerPs: 0,
      rangeBasis: "CLTC",
      rangeKm: 0,
      seats: 5,
      topSpeedKmh: 0,
    },
    sourceNote:
      "Fang Cheng Bao (方程豹) is BYD's dedicated off-road sub-brand — badged accordingly, not a separate manufacturer. Battery/range/power figures were not confirmed from an accessible official page during this pass — treat all numeric specs as pending. Both the catalogue card and detail-page hero use BYD's own press photography (full-scene, not an isolated product-plate cutout like the rest of the catalogue). HOC's confirmed specs, pricing, and Lagos availability remain pending.",
  },
  {
    category: "Compact crossover SUV · 5 seats",
    doors: 5,
    heroPhoto: "/vehicles/byd/byd-song-plus-ev.webp",
    image: "/vehicles/byd/byd-song-plus-ev.webp",
    imageFit: "cover",
    manufacturer: "BYD",
    name: "BYD Song Plus EV",
    segment: "Everyday",
    slug: "byd-song-plus-ev",
    specs: {
      accelSeconds: 0,
      batteryKwh: 0,
      drivetrain: "Front-wheel drive",
      powerKw: 0,
      powerPs: 0,
      rangeBasis: "CLTC",
      rangeKm: 0,
      seats: 5,
      topSpeedKmh: 0,
    },
    sourceNote:
      "China-domestic pure-electric Song Plus. Battery/range/power figures were not confirmed from an accessible official page during this pass — treat all numeric specs as pending. Both the catalogue card and detail-page hero use BYD's own press photography (full-scene, not an isolated product-plate cutout like the rest of the catalogue). HOC's confirmed specs, pricing, and Lagos availability remain pending.",
  },
  {
    category: "Compact crossover SUV · 5 seats",
    doors: 5,
    heroPhoto: "/vehicles/byd/byd-song-plus-dm-i.webp",
    image: "/vehicles/byd/byd-song-plus-dm-i.webp",
    imageFit: "cover",
    manufacturer: "BYD",
    name: "BYD Song Plus DM-i",
    segment: "Everyday",
    slug: "byd-song-plus-dm-i",
    specs: {
      accelSeconds: 0,
      batteryKwh: 0,
      drivetrain: "Front-wheel drive (plug-in hybrid)",
      powerKw: 0,
      powerPs: 0,
      rangeBasis: "CLTC",
      rangeKm: 0,
      seats: 5,
      topSpeedKmh: 0,
    },
    sourceNote:
      "DM-i plug-in hybrid variant of the Song Plus (distinct from the pure-electric Song Plus EV listed separately). Battery/range/power figures were not confirmed from an accessible official page during this pass — treat all numeric specs as pending. Both the catalogue card and detail-page hero use BYD's own press photography (full-scene, not an isolated product-plate cutout like the rest of the catalogue). HOC's confirmed specs, pricing, and Lagos availability remain pending.",
  },
  {
    category: "Subcompact crossover SUV · 5 seats",
    doors: 5,
    heroPhoto: "/vehicles/byd/byd-yuan-up.webp",
    image: "/vehicles/byd/byd-yuan-up.webp",
    imageFit: "cover",
    manufacturer: "BYD",
    name: "BYD Yuan Up",
    segment: "City",
    slug: "byd-yuan-up",
    specs: {
      accelSeconds: 0,
      batteryKwh: 0,
      drivetrain: "Front-wheel drive",
      powerKw: 0,
      powerPs: 0,
      rangeBasis: "CLTC",
      rangeKm: 0,
      seats: 5,
      topSpeedKmh: 0,
    },
    sourceNote:
      "China-domestic Yuan Up, BYD's entry-level crossover — sits below the Yuan Plus/Atto 3 in BYD's own lineup. Battery/range/power figures were not confirmed from an accessible official page during this pass — treat all numeric specs as pending. Both the catalogue card and detail-page hero use BYD's own press photography (full-scene, not an isolated product-plate cutout like the rest of the catalogue). HOC's confirmed specs, pricing, and Lagos availability remain pending.",
  },
  {
    category: "Mid-size off-road SUV · 5 seats",
    doors: 5,
    heroPhoto: "/vehicles/byd/bao-5.webp",
    image: "/vehicles/byd/bao-5.webp",
    imageFit: "cover",
    manufacturer: "BYD (Fang Cheng Bao)",
    name: "Fang Cheng Bao Bao 5",
    segment: "Premium",
    slug: "bao-5",
    specs: {
      accelSeconds: 0,
      batteryKwh: 0,
      drivetrain: "All-wheel drive (plug-in hybrid)",
      powerKw: 0,
      powerPs: 0,
      rangeBasis: "CLTC",
      rangeKm: 0,
      seats: 5,
      topSpeedKmh: 0,
    },
    sourceNote:
      "Fang Cheng Bao (方程豹) is BYD's dedicated off-road sub-brand — badged accordingly, not a separate manufacturer. Battery/range/power figures were not confirmed from an accessible official page during this pass — treat all numeric specs as pending. Both the catalogue card and detail-page hero use BYD's own press photography (full-scene, not an isolated product-plate cutout like the rest of the catalogue). HOC's confirmed specs, pricing, and Lagos availability remain pending.",
  },
];

export function getVehicle(slug: string) {
  return vehicles.find((vehicle) => vehicle.slug === slug);
}

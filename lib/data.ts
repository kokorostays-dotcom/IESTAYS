export type Amenity =
  | "wifi"
  | "tatami"
  | "kitchen"
  | "garden"
  | "bath"
  | "parking"
  | "sauna"
  | "washer"
  | "heating";

export type Property = {
  slug: string;
  name: string;
  area: string;
  prefecture: "Kyoto" | "Nara" | "Toyama" | "Niigata" | "Okayama";
  character: string;
  status: string;
  bookable: boolean;
  tagline: string;
  description: string;
  gallery: number; // count of extra photos beyond the hero
  // Everything below is placeholder until Kokoro supplies real figures.
  guests: number;
  bedrooms: number;
  baths: number;
  baseRate: number;
  cleaningFee: number;
  minStay: number;
  amenities: Amenity[];
};

const IMG = "https://kokoro.co/assets/properties";

export const heroOf = (p: Property) => `${IMG}/${p.slug}-hero.jpg`;
export const photosOf = (p: Property) => [
  heroOf(p),
  ...Array.from({ length: p.gallery }, (_, i) => `${IMG}/${p.slug}-${i + 1}.jpg`),
];

const machiya = {
  guests: 4,
  bedrooms: 2,
  baths: 1,
  cleaningFee: 8000,
  minStay: 2,
  amenities: ["wifi", "tatami", "kitchen", "garden", "bath", "washer"] as Amenity[],
};

export const properties: Property[] = [
  {
    slug: "toma-estate",
    name: "TOMA Estate",
    area: "Sanjo",
    prefecture: "Niigata",
    character: "Wellness Estate",
    status: "Operational",
    bookable: true,
    tagline: "The flagship countryside wellness estate.",
    description:
      "Kokoro's flagship countryside wellness estate, set within a historic kominka compound surrounded by kura storehouses, gardens, and expansive grounds. Heritage accommodation, thermal bathing, sauna culture and culinary experiences, shaped by the rhythms of the Japanese countryside.",
    gallery: 6,
    guests: 8,
    bedrooms: 4,
    baths: 3,
    baseRate: 128000,
    cleaningFee: 20000,
    minStay: 2,
    amenities: ["wifi", "tatami", "kitchen", "garden", "bath", "sauna", "parking", "heating"],
  },
  {
    slug: "ie-nakakashiwano",
    name: "Ie Nakakashiwano",
    area: "Nakakashiwano",
    prefecture: "Kyoto",
    character: "Kyoto Machiya",
    status: "Operational",
    bookable: true,
    tagline: "A restored heritage townhouse for northern Kyoto.",
    description:
      "A restored heritage townhouse offering a refined residential experience in northern Kyoto. Blending traditional architecture with understated modern comfort, it embodies the spirit of Quiet Kyoto: intimate, place-connected, and measured in pace.",
    gallery: 3,
    baseRate: 48000,
    ...machiya,
  },
  {
    slug: "ie-gonouecho-north",
    name: "Ie Gonouecho North",
    area: "Gonouecho",
    prefecture: "Kyoto",
    character: "Kyoto Machiya",
    status: "Operational",
    bookable: true,
    tagline: "A machiya residence near Kinkaku-ji and Daitoku-ji.",
    description:
      "An operational machiya residence in northwest Kyoto, anchoring Kokoro's Gonouecho cluster near Kinkaku-ji and Daitoku-ji.",
    gallery: 0,
    baseRate: 42000,
    ...machiya,
  },
  {
    slug: "ie-gonouecho-middle",
    name: "Ie Gonouecho Middle",
    area: "Gonouecho",
    prefecture: "Kyoto",
    character: "Kyoto Machiya",
    status: "Operational",
    bookable: true,
    tagline: "Quiet residential stays in northwest Kyoto.",
    description:
      "An operational heritage townhouse in Kokoro's Gonouecho cluster, designed for quiet residential stays in northwest Kyoto.",
    gallery: 0,
    baseRate: 38000,
    ...machiya,
    guests: 3,
  },
  {
    slug: "ie-gonouecho-south",
    name: "Ie Gonouecho South",
    area: "Gonouecho",
    prefecture: "Kyoto",
    character: "Kyoto Machiya",
    status: "Operational",
    bookable: true,
    tagline: "The machiya completing the Gonouecho trio.",
    description:
      "An operational machiya residence completing the Gonouecho trio, part of Kokoro's neighbourhood-led Kyoto hospitality strategy.",
    gallery: 0,
    baseRate: 40000,
    ...machiya,
  },
  {
    slug: "ie-sujikaibashi",
    name: "Ie Sujikaibashi",
    area: "Sujikaibashi",
    prefecture: "Kyoto",
    character: "Kyoto Machiya",
    status: "Opening Dec 2026",
    bookable: false,
    tagline: "A contemplative machiya for slower, longer stays.",
    description:
      "A contemplative machiya designed for slower, longer stays, the residential and intimate side of Kyoto within Kokoro's growing district portfolio.",
    gallery: 3,
    baseRate: 46000,
    ...machiya,
  },
  {
    slug: "ie-hananbo-cho",
    name: "Ie Hananbo-cho",
    area: "Hananbo-cho",
    prefecture: "Kyoto",
    character: "Kyoto Machiya",
    status: "Opening Mar 2027",
    bookable: false,
    tagline: "Intimate heritage accommodation by the temple district.",
    description:
      "Intimate heritage accommodation near Kyoto's historic temple district, with craftsmanship, atmosphere, and cultural authenticity within the northwest Kyoto cluster.",
    gallery: 3,
    baseRate: 46000,
    ...machiya,
  },
  {
    slug: "ie-fushimi",
    name: "Ie Fushimi",
    area: "Fushimi",
    prefecture: "Kyoto",
    character: "Sake, Tea & Fermentation",
    status: "Opening Mar 2027",
    bookable: false,
    tagline: "Tea, sake and ritual in Kyoto's brewing district.",
    description:
      "Set within Kyoto's historic sake district, Ie Fushimi is a hospitality, tea, and cultural destination centred on fermentation, craftsmanship, and ritual.",
    gallery: 1,
    baseRate: 52000,
    ...machiya,
  },
  {
    slug: "ie-maruyama-park",
    name: "Ie Maruyama Park",
    area: "Maruyama Park",
    prefecture: "Kyoto",
    character: "Sake, Tea & Fermentation",
    status: "Under restoration",
    bookable: false,
    tagline: "A century-old machiya overlooking Maruyama Park.",
    description:
      "A century-old machiya overlooking Kyoto's historic Maruyama Park, reimagined as a contemporary tea house and cultural destination.",
    gallery: 2,
    baseRate: 58000,
    ...machiya,
  },
  {
    slug: "ie-uda",
    name: "Ie Uda",
    area: "Uda",
    prefecture: "Nara",
    character: "Sake, Tea & Fermentation",
    status: "Under restoration",
    bookable: false,
    tagline: "Future home of the Kokoro Sake Academy.",
    description:
      "On historic Maruyama Street in rural Nara, opposite a partner sake brewery, and the future home of the Kokoro Sake Academy.",
    gallery: 0,
    baseRate: 44000,
    ...machiya,
  },
  {
    slug: "neokawa-imizu",
    name: "Neo Kawa",
    area: "Imizu",
    prefecture: "Toyama",
    character: "Rural & Adaptive Reuse",
    status: "Under development",
    bookable: false,
    tagline: "Canal landscapes and merchant culture in Toyama.",
    description:
      "A contemporary rural hospitality concept inspired by Toyama's historic canal landscapes and merchant culture.",
    gallery: 2,
    baseRate: 50000,
    ...machiya,
  },
  {
    slug: "izumozaki",
    name: "Izumozaki",
    area: "Izumozaki",
    prefecture: "Niigata",
    character: "Coastal",
    status: "Under restoration",
    bookable: false,
    tagline: "A maritime town on the Sea of Japan.",
    description:
      "A coastal hospitality project in one of Niigata's historic merchant and maritime towns along the Sea of Japan.",
    gallery: 2,
    baseRate: 54000,
    ...machiya,
  },
  {
    slug: "stonegate-estate",
    name: "Stonegate Estate",
    area: "Ikegahara",
    prefecture: "Okayama",
    character: "Countryside Estate",
    status: "Under restoration",
    bookable: false,
    tagline: "Stone walls, a nagaya-mon gatehouse and mature gardens.",
    description:
      "A rare countryside estate distinguished by imposing stone walls, a traditional nagaya-mon gatehouse, mature gardens, and preserved rural architecture.",
    gallery: 4,
    baseRate: 98000,
    ...machiya,
    guests: 8,
    bedrooms: 4,
  },
];

export const prefectures = ["Kyoto", "Niigata", "Nara", "Toyama", "Okayama"] as const;

export const getProperty = (slug: string) => properties.find((p) => p.slug === slug);

export const amenityLabel: Record<Amenity, string> = {
  wifi: "Wi-Fi",
  tatami: "Tatami rooms",
  kitchen: "Kitchen",
  garden: "Garden",
  bath: "Soaking bath",
  parking: "Parking",
  sauna: "Sauna",
  washer: "Washer",
  heating: "Wood stove",
};

export const CHECK_IN_TIME = "15:00";
export const CHECK_OUT_TIME = "11:00";
export const SUPPORT_PHONE = "+81 75 000 0000"; // placeholder
export const SUPPORT_EMAIL = "hello@kokoro.co";

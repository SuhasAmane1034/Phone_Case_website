export type ProductVariant = {
  id: string;
  name: string;
  sku: string;
  colour: string;
  colourHex: string;
  device: string;
  price: number;
  originalPrice: number;
  stock: number;
};

export type CatalogProduct = {
  id?: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  compatibility: string;
  supportedDevices: string[];
  colours: string[];
  colourHexes?: string[];
  price: number;
  originalPrice: number;
  badge?: string;
  tone: "black" | "silver" | "blue" | "brown";
  bestseller?: boolean;
  newArrival?: boolean;
  featured?: boolean;
  category?: "fold" | "samsung" | "iphone" | "protection" | "leather";
  tags: string[];
  imageUrl?: string | null;
  images?: string[];
  variants: ProductVariant[];
};

export const catalogue: CatalogProduct[] = [
  // --- SAMSUNG GALAXY Z FOLD SERIES ---
  {
    name: "Handcrafted Titanium & Carbon Armor Case for Samsung Galaxy Z Fold 8",
    slug: "handcrafted-titanium-carbon-fold-8-case",
    compatibility: "Samsung Galaxy Z Fold 8 / Fold 7",
    shortDescription: "Ultra-luxurious aerospace titanium alloy case with carbon fiber armor backplate.",
    description: "Handcrafted with precision CNC-machined titanium alloy rails, real carbon fiber backplate, and ultra-slim scratch-resistant polycarbonate. Designed exclusively for the Galaxy Z Fold 8 hinge mechanics.",
    supportedDevices: ["Samsung Galaxy Z Fold 8", "Samsung Galaxy Z Fold 7"],
    colours: ["Titanium Silver", "Space Grey", "Stealth Black", "Deep Blue"],
    colourHexes: ["#C0C0C0", "#55565d", "#1A1A1A", "#1e2e42"],
    price: 1890,
    originalPrice: 2990,
    badge: "Titanium Luxury",
    tone: "silver",
    bestseller: true,
    featured: true,
    category: "fold",
    imageUrl: "https://www.seasonmade.com/cdn/shop/files/Seasonmade_Homepage_Square_2.png?v=1753986121&width=800",
    tags: ["fold", "samsung", "luxury", "titanium", "bestseller"],
    variants: [
      { id: "ti-fold-8-slv", name: "Z Fold 8 — Titanium Silver", sku: "TI-ZF8-SLV", colour: "Titanium Silver", colourHex: "#C0C0C0", device: "Samsung Galaxy Z Fold 8", price: 1890, originalPrice: 2990, stock: 15 },
      { id: "ti-fold-8-blk", name: "Z Fold 8 — Stealth Black", sku: "TI-ZF8-BLK", colour: "Stealth Black", colourHex: "#1A1A1A", device: "Samsung Galaxy Z Fold 8", price: 1890, originalPrice: 2990, stock: 12 },
      { id: "ti-fold-8-gry", name: "Z Fold 8 — Space Grey", sku: "TI-ZF8-GRY", colour: "Space Grey", colourHex: "#55565d", device: "Samsung Galaxy Z Fold 8", price: 1890, originalPrice: 2990, stock: 10 },
    ],
  },
  {
    name: "Smart-View Interactive Display Flip Leather Case for Galaxy Z Fold 8",
    slug: "smart-view-interactive-flip-leather-case",
    compatibility: "Samsung Galaxy Z Fold 8",
    shortDescription: "Interactive front display window with genuine calfskin leather cover.",
    description: "Check notifications, answer calls, and control music playback without unfolding your device. Lined with microfiber interior and equipped with an auto wake/sleep smart sensor.",
    supportedDevices: ["Samsung Galaxy Z Fold 8", "Samsung Galaxy Z Fold 7"],
    colours: ["Midnight Navy", "Matte Black", "Forest Green"],
    colourHexes: ["#1B263B", "#1C1C1C", "#1E3F20"],
    price: 1890,
    originalPrice: 2890,
    badge: "Smart View",
    tone: "blue",
    newArrival: true,
    featured: true,
    category: "fold",
    imageUrl: "https://www.seasonmade.com/cdn/shop/files/Seasonmade_Homepage_Square_2.png?v=1753986121&width=800",
    tags: ["fold", "samsung", "smart-view", "leather"],
    variants: [
      { id: "smart-flip-navy", name: "Z Fold 8 — Midnight Navy", sku: "SMR-ZF8-NVY", colour: "Midnight Navy", colourHex: "#1B263B", device: "Samsung Galaxy Z Fold 8", price: 1890, originalPrice: 2890, stock: 14 },
      { id: "smart-flip-blk", name: "Z Fold 8 — Matte Black", sku: "SMR-ZF8-BLK", colour: "Matte Black", colourHex: "#1C1C1C", device: "Samsung Galaxy Z Fold 8", price: 1890, originalPrice: 2890, stock: 18 },
      { id: "smart-flip-grn", name: "Z Fold 8 — Forest Green", sku: "SMR-ZF8-GRN", colour: "Forest Green", colourHex: "#1E3F20", device: "Samsung Galaxy Z Fold 8", price: 1890, originalPrice: 2890, stock: 8 },
    ],
  },
  {
    name: "All-in-One Case | Leather Texture with S-Pen Slot for Galaxy Z Fold 8",
    slug: "all-in-one-leather-case-with-pen-holder",
    compatibility: "Samsung Galaxy Z Fold 8",
    shortDescription: "Integrated magnetic S-Pen holster, kickstand, and hinge armor.",
    description: "The ultimate productivity companion for Galaxy Z Fold 8. Features a secure slide-out S-Pen holder, aerospace-grade magnetic hinge protection, and a multi-angle kickstand.",
    supportedDevices: ["Samsung Galaxy Z Fold 8"],
    colours: ["Titanium Silver", "Vintage Brown", "Onyx Black", "Military Green"],
    colourHexes: ["#A8A9AD", "#6F4E37", "#171717", "#4A5D4E"],
    price: 2290,
    originalPrice: 3490,
    badge: "Bestseller",
    tone: "silver",
    bestseller: true,
    category: "fold",
    imageUrl: "https://www.seasonmade.com/cdn/shop/files/Seasonmade_Homepage_Square_2.png?v=1753986121&width=800",
    tags: ["fold", "samsung", "s-pen", "leather", "kickstand"],
    variants: [
      { id: "aio-pen-slv", name: "Z Fold 8 — Titanium Silver", sku: "AIO-ZF8-SLV", colour: "Titanium Silver", colourHex: "#A8A9AD", device: "Samsung Galaxy Z Fold 8", price: 2290, originalPrice: 3490, stock: 20 },
      { id: "aio-pen-brn", name: "Z Fold 8 — Vintage Brown", sku: "AIO-ZF8-BRN", colour: "Vintage Brown", colourHex: "#6F4E37", device: "Samsung Galaxy Z Fold 8", price: 2290, originalPrice: 3490, stock: 16 },
      { id: "aio-pen-blk", name: "Z Fold 8 — Onyx Black", sku: "AIO-ZF8-BLK", colour: "Onyx Black", colourHex: "#171717", device: "Samsung Galaxy Z Fold 8", price: 2290, originalPrice: 3490, stock: 25 },
    ],
  },

  // --- SCREEN & CAMERA LENS PROTECTION SECTION ---
  {
    name: "Individual Diamond Camera Lens Kit Protector for Galaxy Z Fold 8 & S26 Ultra",
    slug: "samsung-galaxy-diamond-camera-lens-kit",
    compatibility: "Galaxy Z Fold 8 / S26 Ultra",
    shortDescription: "Sapphire glass individual lens rings with 9H diamond hardness.",
    description: "Protect each camera lens individually without flash glare or photo distortion. Engineered with aviation aluminum alloy bezel and 9H sapphire optical glass.",
    supportedDevices: ["Samsung Galaxy Z Fold 8", "Samsung Galaxy S26 Ultra", "Samsung Galaxy S25 Ultra"],
    colours: ["Titanium Silver", "Deep Matte Black", "Graphite Grey", "Cobalt Blue"],
    colourHexes: ["#C0C0C0", "#1C1C1C", "#55565d", "#1E3F66"],
    price: 299,
    originalPrice: 599,
    badge: "Hot Deal • 50% OFF",
    tone: "black",
    bestseller: true,
    featured: true,
    category: "protection",
    imageUrl: "http://www.seasonmade.com/cdn/shop/files/71iU1pzVgfL._SX569.jpg?v=1785919087",
    tags: ["screen protection", "camera lens", "samsung", "bestseller"],
    variants: [
      { id: "lens-kit-slv", name: "Lens Kit — Titanium Silver", sku: "LENS-S26-SLV", colour: "Titanium Silver", colourHex: "#C0C0C0", device: "Samsung Galaxy S26 Ultra", price: 299, originalPrice: 599, stock: 45 },
      { id: "lens-kit-blk", name: "Lens Kit — Deep Black", sku: "LENS-S26-BLK", colour: "Deep Matte Black", colourHex: "#1C1C1C", device: "Samsung Galaxy S26 Ultra", price: 299, originalPrice: 599, stock: 50 },
      { id: "lens-kit-gry", name: "Lens Kit — Graphite Grey", sku: "LENS-S26-GRY", colour: "Graphite Grey", colourHex: "#55565d", device: "Samsung Galaxy S26 Ultra", price: 299, originalPrice: 599, stock: 30 },
    ],
  },
  {
    name: "Sapphire Crystal Individual Camera Lens Protector for iPhone 18 Pro Max",
    slug: "iphone-sapphire-crystal-camera-lens-protector",
    compatibility: "iPhone 18 Pro Max / 18 Pro",
    shortDescription: "Ultra-hard sapphire camera rings precision-color-matched to Apple Titanium.",
    description: "Engineered specifically for the upgraded iPhone 18 Pro camera module. Features night-circle anti-glare ring, oleophobic smudge resistance, and easy alignment tray installation.",
    supportedDevices: ["iPhone 18 Pro Max", "iPhone 18 Pro", "iPhone 17 Pro Max"],
    colours: ["Natural Titanium", "Desert Titanium", "Black Titanium", "White Titanium"],
    colourHexes: ["#A4A39F", "#C5A687", "#2A2A2B", "#F5F5F3"],
    price: 299,
    originalPrice: 599,
    badge: "50% OFF",
    tone: "silver",
    bestseller: true,
    category: "protection",
    imageUrl: "http://www.seasonmade.com/cdn/shop/files/71iU1pzVgfL._SX569.jpg?v=1785919087",
    tags: ["screen protection", "camera lens", "iphone", "bestseller"],
    variants: [
      { id: "lens-18pm-natural", name: "iPhone 18 Pro Max — Natural Titanium", sku: "LENS-18PM-NAT", colour: "Natural Titanium", colourHex: "#A4A39F", device: "iPhone 18 Pro Max", price: 299, originalPrice: 599, stock: 60 },
      { id: "lens-18pm-desert", name: "iPhone 18 Pro Max — Desert Titanium", sku: "LENS-18PM-DSR", colour: "Desert Titanium", colourHex: "#C5A687", device: "iPhone 18 Pro Max", price: 299, originalPrice: 599, stock: 55 },
      { id: "lens-18pm-black", name: "iPhone 18 Pro Max — Black Titanium", sku: "LENS-18PM-BLK", colour: "Black Titanium", colourHex: "#2A2A2B", device: "iPhone 18 Pro Max", price: 299, originalPrice: 599, stock: 40 },
    ],
  },
  {
    name: "OptiShield 9H Oleophobic 28° Anti-Peeping Privacy Tempered Glass",
    slug: "optishield-privacy-screen-guard",
    compatibility: "iPhone & Galaxy Series",
    shortDescription: "High-grade 28° two-way privacy screen guard with electroplated touch coating.",
    description: "Keeps your sensitive transactions, chats, and banking completely invisible from side angles. Features military 9H drop impact resistance and silky-smooth glass coating.",
    supportedDevices: ["iPhone 18 Pro Max", "iPhone 18 Pro", "iPhone 17 Pro Max", "Samsung Galaxy S26 Ultra"],
    colours: ["Matte Privacy", "Crystal HD Clear"],
    colourHexes: ["#2B2B2B", "#EAEAEA"],
    price: 399,
    originalPrice: 899,
    badge: "Privacy 28°",
    tone: "black",
    featured: true,
    category: "protection",
    imageUrl: "https://www.seasonmade.com/cdn/shop/files/Seasonmade_Homepage_Square_1.png?v=1753986121&width=800",
    tags: ["screen protection", "privacy", "tempered glass", "accessory"],
    variants: [
      { id: "priv-18pm", name: "iPhone 18 Pro Max — 28° Privacy Glass", sku: "PRV-18PM-MAT", colour: "Matte Privacy", colourHex: "#2B2B2B", device: "iPhone 18 Pro Max", price: 399, originalPrice: 899, stock: 80 },
      { id: "priv-s26u", name: "Samsung Galaxy S26 Ultra — 28° Privacy Glass", sku: "PRV-S26U-MAT", colour: "Matte Privacy", colourHex: "#2B2B2B", device: "Samsung Galaxy S26 Ultra", price: 399, originalPrice: 899, stock: 70 },
    ],
  },

  // --- SAMSUNG GALAXY S SERIES ---
  {
    name: "Aero-Space Titanium MagSafe Armor Case for Samsung Galaxy S26 Ultra",
    slug: "s26-ultra-cyber-armor-magsafe-case",
    compatibility: "Samsung Galaxy S26 Ultra",
    shortDescription: "Aircraft-grade metal alloy bumper with built-in N52 MagSafe ring.",
    description: "Engineered with machined aluminum alloy corners, carbon fiber textured backplate, and high-strength N52 neodymium magnetic ring compatible with all MagSafe accessories.",
    supportedDevices: ["Samsung Galaxy S26 Ultra"],
    colours: ["Natural Titanium", "Onyx Black", "Cobalt Violet", "Silver Metal"],
    colourHexes: ["#A4A39F", "#1A1A1A", "#3E3253", "#C0C0C0"],
    price: 1490,
    originalPrice: 2490,
    badge: "MagSafe Ready",
    tone: "silver",
    bestseller: true,
    category: "samsung",
    imageUrl: "https://www.seasonmade.com/cdn/shop/files/Seasonmade_Homepage_Square_2.png?v=1753986121&width=800",
    tags: ["samsung", "s26-ultra", "magsafe", "titanium"],
    variants: [
      { id: "s26-titanium-nat", name: "S26 Ultra — Natural Titanium", sku: "S26-MAG-NAT", colour: "Natural Titanium", colourHex: "#A4A39F", device: "Samsung Galaxy S26 Ultra", price: 1490, originalPrice: 2490, stock: 25 },
      { id: "s26-titanium-blk", name: "S26 Ultra — Onyx Black", sku: "S26-MAG-BLK", colour: "Onyx Black", colourHex: "#1A1A1A", device: "Samsung Galaxy S26 Ultra", price: 1490, originalPrice: 2490, stock: 35 },
      { id: "s26-titanium-slv", name: "S26 Ultra — Silver Metal", sku: "S26-MAG-SLV", colour: "Silver Metal", colourHex: "#C0C0C0", device: "Samsung Galaxy S26 Ultra", price: 1490, originalPrice: 2490, stock: 18 },
    ],
  },

  // --- IPHONE SERIES ---
  {
    name: "Cyber-Armor Titanium MagSafe Case for iPhone 18 Pro Max",
    slug: "iphone-18-pro-max-cyber-titanium-case",
    compatibility: "iPhone 18 Pro Max / 18 Pro",
    shortDescription: "Mechanical textured armor case with integrated kickstand & MagSafe ring.",
    description: "CNC-milled dual-layer polycarbonate and TPU armor featuring high-precision tactile volume rocker covers, action button cutout, and 15W MagSafe magnetic alignment.",
    supportedDevices: ["iPhone 18 Pro Max", "iPhone 18 Pro", "iPhone 17 Pro Max"],
    colours: ["Natural Titanium", "Desert Titanium", "Graphite Black", "Alpine White"],
    colourHexes: ["#A4A39F", "#C5A687", "#171717", "#F0F0F0"],
    price: 1490,
    originalPrice: 2490,
    badge: "Top Seller",
    tone: "black",
    bestseller: true,
    featured: true,
    category: "iphone",
    imageUrl: "https://www.seasonmade.com/cdn/shop/files/Seasonmade_Homepage_Square_1.png?v=1753986121&width=800",
    tags: ["iphone", "iphone-18", "magsafe", "bestseller"],
    variants: [
      { id: "ip18-cyber-nat", name: "iPhone 18 Pro Max — Natural Titanium", sku: "IP18-CYB-NAT", colour: "Natural Titanium", colourHex: "#A4A39F", device: "iPhone 18 Pro Max", price: 1490, originalPrice: 2490, stock: 40 },
      { id: "ip18-cyber-desert", name: "iPhone 18 Pro Max — Desert Titanium", sku: "IP18-CYB-DSR", colour: "Desert Titanium", colourHex: "#C5A687", device: "iPhone 18 Pro Max", price: 1490, originalPrice: 2490, stock: 35 },
      { id: "ip18-cyber-blk", name: "iPhone 18 Pro Max — Graphite Black", sku: "IP18-CYB-BLK", colour: "Graphite Black", colourHex: "#171717", device: "iPhone 18 Pro Max", price: 1490, originalPrice: 2490, stock: 50 },
    ],
  },
  {
    name: "Monza Heritage Leather Case",
    slug: "monza-leather-case",
    compatibility: "iPhone & Galaxy Series",
    shortDescription: "A motorsport-inspired textured leather case with tactile metal buttons.",
    description: "Premium top-grain textured leather, precision metal lens bezel, and raised-edge camera safety. Designed around GHYAMAJHA's motorsport identity.",
    supportedDevices: ["iPhone 18 Pro Max", "iPhone 18 Pro", "Samsung Galaxy S26 Ultra"],
    colours: ["Cognac Brown", "Racing Black", "Midnight Blue"],
    colourHexes: ["#70533a", "#171717", "#1E3F66"],
    price: 799,
    originalPrice: 1499,
    badge: "Heritage",
    tone: "brown",
    bestseller: true,
    category: "leather",
    imageUrl: "https://www.seasonmade.com/cdn/shop/files/Seasonmade_Homepage_Square_2.png?v=1753986121&width=800",
    tags: ["leather", "motorsport", "iphone", "samsung"],
    variants: [
      { id: "monza-brown-18pm", name: "iPhone 18 Pro Max — Cognac Brown", sku: "MONZA-18PM-BRN", colour: "Cognac Brown", colourHex: "#70533a", device: "iPhone 18 Pro Max", price: 799, originalPrice: 1499, stock: 22 },
      { id: "monza-black-18pm", name: "iPhone 18 Pro Max — Racing Black", sku: "MONZA-18PM-BLK", colour: "Racing Black", colourHex: "#171717", device: "iPhone 18 Pro Max", price: 799, originalPrice: 1499, stock: 30 },
      { id: "monza-blue-s26", name: "Galaxy S26 Ultra — Midnight Blue", sku: "MONZA-S26-BLU", colour: "Midnight Blue", colourHex: "#1E3F66", device: "Samsung Galaxy S26 Ultra", price: 849, originalPrice: 1499, stock: 15 },
    ],
  },
];

export function getProduct(slug: string) {
  return catalogue.find((product) => product.slug === slug);
}

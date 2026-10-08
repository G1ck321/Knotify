export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
}

export interface Reservation {
  id: string;
  name: string;
  phone: string;
  email?: string;
  color: string;
  quantity: number;
  hall: string;
  productNames: string;
  originalPrice: number;
  status: 'Reserved' | 'Ready for Pickup' | 'Collecte, Or by delivery. Join community for info';
  pickupPoint: string;
  dateAdded: string;
}

export interface Product {
  id: string;
  name: string;
  seller: string;
  sellerRating: number;
  sellerHall: string
  /**
   * STATIC list price hard-coded in INITIAL_PRODUCTS below.
   * It NEVER changes at runtime — treat it as the "full / strikethrough" price.
   * It is NOT what the customer should be charged.
   */
  originalPrice: number;
  /**
   * LIVE price fetched from the backend (`GET /quantity/ties`) and merged into
   * the product by App.tsx (`loadInventory`). The backend applies the discount
   * logic there (Backend/routers/quantity.py -> disount_logic()), so this is
   * the price the customer should SEE and PAY.
   *
   * It is OPTIONAL because:
   *   1. INITIAL_PRODUCTS entries have no live price until the fetch completes.
   *   2. Products persisted in localStorage (cart/marketplace cache) may
   *      predate this field.
   *
   * ALWAYS read it with a fallback: `product.price ?? product.originalPrice`.
   * When adding a discount/price change, update the BACKEND logic — never
   * hard-code a discounted value here, or the same stale-price bug returns.
   */
  price?: number;
  condition: 'Brand New' | 'Like New' | 'Gently Used' | 'Used';
  category: 'Official Tie' | 'Premium' | 'Department' | 'Bow Tie' | 'Corporate' | 'Vintage';
  color: 'Navy' | 'Crimson' | 'Gold' | 'Forest Green' | 'Black' | 'Wine' | 'Stripes';
  stock: number | string;
  description: string;
  materials: string;
  pickupProcess: string;
  image: string;
  rating: number;
  reviewsCount: number;
  isFeatured: boolean;
  reviews: Review[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export const COVENANT_HALLS = [
  'Daniel Hall',
  'Joseph Hall',
  'Peter Hall',
  'Paul Hall',
  'Esther Hall',
  'Lydia Hall',
  'Mary Hall'
];

export const INITIAL_PRODUCTS: Product[] = [
  // ── NEW TIES ────────────────────────────────────────────────────────────────
  {
    id: 'new-blue-regimental',
    name: 'Blue Regimental White Striped Tie',
    seller: 'Knotify Official',
    sellerRating: 4.8,
    sellerHall: 'Admin Office',
    originalPrice: 3500,
    condition: 'Brand New',
    category: 'Corporate',
    color: 'Stripes',
    stock: 1,
    description: 'A classic regimental tie featuring bold diagonal white stripes across a rich blue background. Perfect for class presentations and executive styling.',
    materials: 'A classic regimental tie featuring bold diagonal white stripes across a rich blue background.',
    pickupProcess: 'Reserve with a full deposit. Collect from our designated pickup point at your hall lobby upon resumption, Or by delivery. Join community for info',
    image: '/ties/new ties/Blue Regimental White Striped Tie.png',
    rating: 4.8,
    reviewsCount: 14,
    isFeatured: true,
    reviews: []
  },
    {
    id: 'navy-tricolor-blue',
    name: 'Navy Tricolor Striped Silk Tie',
    seller: 'Knotify Official',
    sellerRating: 4.75,
    sellerHall: 'Admin Office',
    originalPrice: 3500,
    condition: 'Brand New',
    category: 'Corporate',
    color: 'Stripes',
    stock: 1,
    description: 'A classic regimental tie featuring bold diagonal red, white and green stripes across a rich blue background. Perfect for class presentations and executive styling.',
    materials: 'A classic regimental tie featuring bold diagonal red, white and green stripes across a rich blue background.',
    pickupProcess: 'Reserve with a full deposit. Collect from our designated pickup point at your hall lobby upon resumption, Or by delivery. Join community for info',
    image: '/ties/new ties/latest/Navy Tricolor Striped Silk Tie.png',
    rating: 4.8,
    reviewsCount: 14,
    isFeatured: true,
    reviews: []
  },
  {
    id: 'new-navy-wine-striped',
    name: 'Navy and Wine Striped Tie',
    seller: 'Knotify Official',
    sellerRating: 4.85,
    sellerHall: 'Admin Office',
    originalPrice: 4000,
    condition: 'Brand New',
    category: 'Corporate',
    color: 'Stripes',
    stock: 1,
    description: 'A classic academic striped tie in navy and deep wine. Fully chapel-compliant and extremely smart.',
    materials: 'A classic academic striped tie in navy and deep wine.',
    pickupProcess: 'Reserve with a full deposit. Collect from our designated pickup point at your hall lobby, Or by delivery. Join community for info',
    image: '/ties/new ties/Nave and WIne Striped Tie.png',
    rating: 4.9,
    reviewsCount: 19,
    isFeatured: true,
    reviews: []
  },
  {
    id: 'new-plain-wine',
    name: 'Plain Wine Tie',
    seller: 'Knotify Official',
    sellerRating: 4.9,
    sellerHall: 'Admin Office',
    originalPrice: 2200,
    condition: 'Brand New',
    category: 'Corporate',
    color: 'Wine',
    stock: 22,
    description: 'A solid rich wine-colored tie, offering a smooth matte texture that pairs wonderfully with cream and white shirts.',
    materials: "A solid rich wine-colored tie, aside from plain black, he's the right man for the job.",
    pickupProcess: 'Pay via transfer, pick up at school.',
    image: '/ties/new ties/Plain Wine Tie.png',
    rating: 4.7,
    reviewsCount: 25,
    isFeatured: true,
    reviews: []
  },
  {
    id: 'burgundy-striped-satin',
    name: 'Burgundy Striped Satin Necktie',
    seller: 'Knotify Official',
    sellerRating: 4.7,
    sellerHall: 'Admin Office',
    originalPrice: 3500,
    condition: 'Brand New',
    category: 'Corporate',
    color: 'Wine',
    stock: 1,
    description: 'Smart diagonal stripes on a deep wine backdrop. Add class to your weekly academic wardrobe.',
    materials: 'Smart diagonal stripes on a deep wine backdrop.',
    pickupProcess: 'Pay via transfer, pick up at school.',
    image: '/ties/new ties/latest/Burgundy Striped Satin Necktie.png',
    rating: 4.8,
    reviewsCount: 8,
    isFeatured: true,
    reviews: []
  },
    {
    id: 'new-wine-striped',
    name: 'Wine Striped Tie',
    seller: 'Knotify Official',
    sellerRating: 4.6,
    sellerHall: 'Admin Office',
    originalPrice: 3500,
    condition: 'Brand New',
    category: 'Corporate',
    color: 'Wine',
    stock: 1,
    description: 'Smart diagonal stripes on a deep wine backdrop. Add class to your weekly academic wardrobe.',
    materials: 'Smart diagonal stripes on a deep wine backdrop, and a unique logo.',
    pickupProcess: 'Pay via transfer, pick up at school.',
    image: '/ties/new ties/Wine Striped Tie.png',
    rating: 4.8,
    reviewsCount: 8,
    isFeatured: true,
    reviews: []
  },   {
    id: 'wine-blue-striped',
    name: 'Wine Blue Striped Tie',
    seller: 'Knotify Official',
    sellerRating: 4.9,
    sellerHall: 'Admin Office',
    originalPrice: 3500,
    condition: 'Brand New',
    category: 'Corporate',
    color: 'Wine',
    stock: 1,
    description: 'Smart Blue diagonal stripes on a deep wine backdrop. Add class to your weekly academic wardrobe.',
    materials: "Smart Blue diagonal stripes on a deep wine backdrop. Run it on Sunday, you'll see",
    pickupProcess: 'Pay via transfer, pick up at school.',
    image: '/ties/new ties/latest/wine-blue.png',
    rating: 4.8,
    reviewsCount: 8,
    isFeatured: true,
    reviews: []
  },{
    id: 'wine-pattern-striped',
    name: 'Wine Patterned Tie',
    seller: 'Knotify Official',
    sellerRating: 4.9,
    sellerHall: 'Admin Office',
    originalPrice: 3500,
    condition: 'Brand New',
    category: 'Corporate',
    color: 'Wine',
    stock: 1,
    description: 'Calm white patterns on a deep wine backdrop. Add class to your weekly academic wardrobe.',
    materials: "Calm white patterns on a deep wine backdrop. They won't see you coming",
    pickupProcess: 'Pay via transfer, pick up at school.',
    image: '/ties/new ties/latest/wine-pattern.png',
    rating: 4.8,
    reviewsCount: 8,
    isFeatured: true,
    reviews: []
  },
  {
    id: 'new-plain-black',
    name: 'Plain Black Tie',
    seller: 'Knotify Official',
    sellerRating: 4.9,
    sellerHall: 'Admin Office',
    originalPrice: 2100,
    condition: 'Brand New',
    category: 'Corporate',
    color: 'Black',
    stock: 35,
    description: "The extremely versatile Black Tie, you can't go wrong with him.",
    materials: "The extremely versatile Black Tie, you can't go wrong with it.",
    pickupProcess: 'Pay via transfer, pick up at school.',
    image: '/ties/new ties/Plain Black Tie.png',
    rating: 5.0,
    reviewsCount: 31,
    isFeatured: true,
    reviews: []
  },{
    id: 'wine-gold-crest',
    name: 'Wine Gold Crest Tie',
    seller: 'Knotify Official',
    sellerRating: 4.8,
    sellerHall: 'Admin Office',
    originalPrice: 3500,
    condition: 'Brand New',
    category: 'Corporate',
    color: 'Wine',
    stock: 1,
    description: 'Royal wine tie, very minimal. Add class to your weekly academic wardrobe.',
    materials: "Royal wine tie with gold crest, very minimal",
    pickupProcess: 'Pay via transfer, pick up at school.',
    image: '/ties/new ties/latest/wine-gold-crest.png',
    rating: 4.8,
    reviewsCount: 8,
    isFeatured: true,
    reviews: []
  },
  {
    id: 'new-black-striped',
    name: 'Black Stripped Tie',
    seller: 'Knotify Official',
    sellerRating: 4.9,
    sellerHall: 'Admin Office',
    originalPrice: 2100,
    condition: 'Brand New',
    category: 'Corporate',
    color: 'Black',
    stock: 35,
    description: "The black that stands out! It's giving. vintage, formal, and matching virtually every suit or blazer in your collection, Or by delivery. Join community for info",
    materials: "The black that stands out! It's giving smart corporate.",
    pickupProcess: 'Pay via transfer, pick up at school.',
    image: '/ties/new ties/latest/black stripped.png',
    rating: 5.0,
    reviewsCount: 31,
    isFeatured: true,
    reviews: []
  },
  
  // ── CORPORATE TIES ──────────────────────────────────────────────────────────
  {
    id: 'corp-blue-floral',
    name: 'Blue Floral Corporate Tie',
    seller: 'Knotify Official',
    sellerRating: 4.9,
    sellerHall: 'Admin Office',
    originalPrice: 4000,
    condition: 'Brand New',
    category: 'Corporate',
    color: 'Navy',
    stock: 0,
    description: 'A refined navy blue floral-patterned corporate tie. Crisp, professional and chapel-compliant — ideal for formal lectures, executive presentations and Sunday chapel services.',
    materials: "A refined navy blue floral-patterned corporate tie.",
    pickupProcess: 'Reserve with a full deposit. Collect from our designated pickup point at your hall lobby upon resumption and pay the outstanding balance, Or by delivery. Join community for info',
    image: '/ties/Corporate Ties/Blue Floral Corporate Tie.jpg',
    rating: 4.8,
    reviewsCount: 42,
    isFeatured: true,
    reviews: [
      { id: 'r-cf1', author: 'KnotifyCu', rating: 5, date: '2026-06-10', comment: 'Very smart looking. The floral pattern is subtle and elegant — perfect for chapel.' },
      { id: 'r-cf2', author: 'KnotifyCu', rating: 5, date: '2026-06-08', comment: 'Great quality. Ordered for my brother and it fits perfectly.' }
    ]
  },
  {
    id: 'corp-blue-logo',
    name: 'Blue Logo Corporate Tie',
    seller: 'Knotify Official',
    sellerRating: 4.9,
    sellerHall: 'Admin Office',
    originalPrice: 4500,
    condition: 'Brand New',
    category: 'Corporate',
    color: 'Navy',
    stock: 1,
    description: 'A sleek navy tie featuring a distinctive logo motif — a hallmark of sartorial precision. Approved for chapel, executive functions and departmental presentations.',
    materials: "A sleek navy tie featuring a distinctive logo motif.",
    pickupProcess: 'Reserve with a full deposit. Collect from our designated pickup point at your hall lobby upon resumption and pay the outstanding balance, Or by delivery. Join community for info',
    image: "/ties/new ties/latest/dark-blue-logo.jpg",
    rating: 4.9,
    reviewsCount: 38,
    isFeatured: true,
    reviews: [
      { id: 'r-cl1', author: 'KnotifyCu', rating: 5, date: '2026-06-05', comment: 'Clean and professional. The logo pattern is understated and classy.' }
    ]
  },
  {
    id: 'wine-cup-logo',
    name: 'Wine Cup Logo Corporate Tie',
    seller: 'Knotify Official',
    sellerRating: 4.9,
    sellerHall: 'Admin Office',
    originalPrice: 4500,
    condition: 'Brand New',
    category: 'Corporate',
    color: 'Navy',
    stock: 1,
    description: 'A sleek navy tie featuring a distinctive logo motif — a hallmark of sartorial precision. Approved for chapel, executive functions and departmental presentations.',
    materials: "What'd you win?, well you got people asking, you go explain tire",
    pickupProcess: 'Reserve with a full deposit. Collect from our designated pickup point at your hall lobby upon resumption and pay the outstanding balance, Or by delivery. Join community for info',
    image: "/ties/new ties/latest/wine cup logo.png",
    rating: 4.9,
    reviewsCount: 38,
    isFeatured: true,
    reviews: [
      { id: 'r-cl1', author: 'KnotifyCu', rating: 5, date: '2026-06-05', comment: 'Clean and professional. The logo pattern is understated and classy.' }
    ]
  },
  {
    id: 'corp-dark-wine',
    name: 'Dark Wine Dotted Tie',
    seller: 'Knotify Official',
    sellerRating: 4.9,
    sellerHall: 'Admin Office',
    originalPrice: 3000,
    condition: 'Brand New',
    category: 'Corporate',
    color: 'Navy',
    stock: 1,
    description: 'The classic plain navy blue tie — a timeless staple for any Covenant scholar. Matches every formal shirt and fulfils all chapel dress requirements effortlessly.',
    materials: 'Smooth matte polyester satin, double-lined for a firm Windsor knot, wrinkle-resistant weave.',
    pickupProcess: 'Reserve with a full deposit. Collect from our designated pickup point at your hall lobby upon resumption and pay the outstanding balance, Or by delivery. Join community for info',
    image: "/ties/new ties/latest/darkwine.jpg",
    rating: 4.7,
    reviewsCount: 91,
    isFeatured: true,
    reviews: [
      { id: 'r-pb1', author: 'KnotifyCu', rating: 5, date: '2026-06-18', comment: 'Simple, clean, and works with everything. Exactly what I needed for resumption.' },
      { id: 'r-pb2', author: 'KnotifyCu', rating: 4, date: '2026-06-14', comment: 'Good quality for the price. Ties a neat knot easily.' }
    ]
  },
  {
    id: 'corp-plain-blue',
    name: 'Plain Blue Corporate Tie',
    seller: 'Knotify Official',
    sellerRating: 4.9,
    sellerHall: 'Admin Office',
    originalPrice: 3000,
    condition: 'Brand New',
    category: 'Corporate',
    color: 'Navy',
    stock: 0,
    description: 'The classic plain navy blue tie — a timeless staple for any Covenant scholar. Matches every formal shirt and fulfils all chapel dress requirements effortlessly.',
    materials: 'Smooth matte polyester satin, double-lined for a firm Windsor knot, wrinkle-resistant weave.',
    pickupProcess: 'Reserve with a full deposit. Collect from our designated pickup point at your hall lobby upon resumption and pay the outstanding balance, Or by delivery. Join community for info',
    image: "ties/Corporate Ties/Plain Blue  Corporate Tie.jpg",
    rating: 4.7,
    reviewsCount: 91,
    isFeatured: true,
    reviews: [
      { id: 'r-pb1', author: 'KnotifyCu', rating: 5, date: '2026-06-18', comment: 'Simple, clean, and works with everything. Exactly what I needed for resumption.' },
      { id: 'r-pb2', author: 'KnotifyCu', rating: 4, date: '2026-06-14', comment: 'Good quality for the price. Ties a neat knot easily.' }
    ]
  },

 // ── VINTAGE TIES ─────────────────────────────────────────────────────────────
  {
    id: 'dark-blue-copter',
    name: 'Dark Blue Copter Tie.png',
    seller: 'Emeka Williams',
    sellerRating: 4.7,
    sellerHall: 'Peter Hall',
    originalPrice: 4000,
    condition: 'Like New',
    category: 'Vintage',
    color: 'Navy',
    stock: 1,
    description: 'A fun and charming vintage tie featuring a playful helicopter character on a rich navy background.',
    materials: 'A fun and charming vintage tie featuring a playful helicopter character on a rich navy background.',
    pickupProcess: 'Reserve with a N1,000 deposit. Meet seller in Peter Hall lobby at an agreed time to inspect and collect, Or by delivery. Join community for info',
    image: '/ties/new ties/latest/dark-blue copter tie.png',
    rating: 4.6,
    reviewsCount: 7,
    isFeatured: true,
    reviews: [
      { id: 'r-bd1', author: 'KnotifyCu', rating: 5, date: '2026-05-30', comment: 'So unique! Got so many compliments at chapel. Love it.' }
    ]
  },
  {
    id: 'vint-blue-pattern-char',
    name: 'Blue Pattern Embroidered Tie',
    seller: 'Chukwudi A.',
    sellerRating: 4.5,
    sellerHall: 'Daniel Hall',
    originalPrice: 3500,
    condition: 'Gently Used',
    category: 'Vintage',
    color: 'Navy',
    stock: 1,
    description: 'A vintage patterned character tie with rich blue tones and intricate detailing. A rare find from a graduating senior — pairs beautifully with a crisp white shirt.',
    materials: 'A vintage patterned character tie with rich blue tones and intricate detailing.',
    pickupProcess: 'Reserve with a N800 deposit. Meet seller in Daniel Hall lobby to inspect and collect, Or by delivery. Join community for info',
    image: "ties/new ties/latest/Navy Tie with Embroidered Motifs.png",
    rating: 4.4,
    reviewsCount: 5,
    isFeatured: false,
    reviews: []
  },
  //----- DOne ----
  {
    id: 'vint-blue-pattern',
    name: 'Blue Pattern Vintage Tie',
    seller: 'Adaeze M.',
    sellerRating: 4.6,
    sellerHall: 'Esther Hall',
    originalPrice: 3800,
    condition: 'Like New',
    category: 'Vintage',
    color: 'Navy',
    stock: 0,
    description: 'A graceful vintage tie with a repeating geometric blue pattern — understated elegance meeting classic craftsmanship. Perfect for formal chapel attendance.',
    materials: '100% woven polyester, structured vintage lining, excellent knot stability.',
    pickupProcess: 'Reserve with a N900 deposit. Meet seller in Esther Hall lobby to inspect and collect, Or by delivery. Join community for info',
    image: '/ties/Vintage Ties/Blue Pattern Vintage Tie.jpg',
    rating: 4.7,
    reviewsCount: 9,
    isFeatured: true,
    reviews: [
      { id: 'r-bpv1', author: 'KnotifyCu', rating: 5, date: '2026-06-01', comment: 'Gorgeous vintage piece. Condition is excellent.' }
    ]
  },
  {
    id: 'vint-bright-abstract',
    name: 'Bright Abstract Vintage Tie',
    seller: 'Segun F.',
    sellerRating: 4.8,
    sellerHall: 'Paul Hall',
    originalPrice: 4500,
    condition: 'Like New',
    category: 'Vintage',
    color: 'Stripes',
    stock: 0,
    description: 'A bold, eye-catching vintage tie with bright abstract art — for the scholar who dresses with intention. A premium collector piece sourced from a graduating senior, Or by delivery. Join community for info',
    materials: 'Silk-polyester blend, vivid print, original vintage backing intact.',
    pickupProcess: 'Reserve with a N1,000 deposit. Meet seller in Paul Hall lobby to inspect and collect, Or by delivery. Join community for info',
    image: '/ties/Vintage Ties/Bright Abstract Vintage Tie.jpg',
    rating: 4.9,
    reviewsCount: 11,
    isFeatured: true,
    reviews: [
      { id: 'r-ba1', author: 'KnotifyCu', rating: 5, date: '2026-06-03', comment: 'Absolutely stunning. Very unique piece. 10/10 would recommend.' }
    ]
  },
  {
    id: 'vint-cool-abstract',
    name: 'Cool Abstract Vintage Tie',
    seller: 'Bola A.',
    sellerRating: 4.5,
    sellerHall: 'Lydia Hall',
    originalPrice: 4000,
    condition: 'Gently Used',
    category: 'Vintage',
    color: 'Navy',
    stock: 0,
    description: 'A cool-toned abstract vintage tie with smooth artistic patterns. A sophisticated choice for the style-forward Covenant scholar who wants to stand out gracefully.',
    materials: 'Polyester with abstract print overlay, sturdy vintage inner lining.',
    pickupProcess: 'Reserve with a N1,000 deposit. Meet seller in Lydia Hall lobby to inspect and collect, Or by delivery. Join community for info',
    image: '/ties/Vintage Ties/Cool Abstract Vintage Tie.jpg',
    rating: 4.5,
    reviewsCount: 6,
    isFeatured: false,
    reviews: []
  },
  {
    id: 'vint-ducky',
    name: 'Ducky Character Vintage Tie',
    seller: 'Kelvin U.',
    sellerRating: 4.4,
    sellerHall: 'Joseph Hall',
    originalPrice: 3200,
    condition: 'Gently Used',
    category: 'Vintage',
    color: 'Gold',
    stock: 0,
    description: 'A whimsical and fun vintage tie adorned with duck characters — a cheerful, nostalgic piece for the scholar with a great sense of humour and confident personal style.',
    materials: 'Vintage polyester satin, novelty character print, intact original lining.',
    pickupProcess: 'Reserve with a N700 deposit. Meet seller in Joseph Hall lobby to inspect and collect, Or by delivery. Join community for info',
    image: '/ties/Vintage Ties/Ducky Character Vintage Tie.jpg',
    rating: 4.3,
    reviewsCount: 4,
    isFeatured: false,
    reviews: []
  },
  {
    id: 'vint-floral',
    name: 'Floral Vintage Tie',
    seller: 'Amara E.',
    sellerRating: 4.7,
    sellerHall: 'Mary Hall',
    originalPrice: 4200,
    condition: 'Like New',
    category: 'Vintage',
    color: 'Crimson',
    stock: 0,
    description: 'An exquisite vintage floral tie — rich botanicals woven into fine silk-like fabric. Elegant and chapel-approved, ideal for formal occasions and Sunday services.',
    materials: 'Vintage woven silk-polyester, botanical jacquard pattern, soft inner lining.',
    pickupProcess: 'Reserve with a N1,000 deposit. Meet seller in Mary Hall lobby to inspect and collect, Or by delivery. Join community for info',
    image: '/ties/Vintage Ties/Floral Vintage Tie.jpg',
    rating: 4.8,
    reviewsCount: 13,
    isFeatured: true,
    reviews: [
      { id: 'r-fv1', author: 'KnotifyCu', rating: 5, date: '2026-06-07', comment: 'So beautiful. The colours are vibrant and it looks really premium.' }
    ]
  },
  {
    id: 'vint-green-diamond',
    name: 'Green Diamond Vintage Tie',
    seller: 'Tobi R.',
    sellerRating: 4.6,
    sellerHall: 'Daniel Hall',
    originalPrice: 3800,
    condition: 'Like New',
    category: 'Vintage',
    color: 'Forest Green',
    stock: 0,
    description: 'A distinguished vintage tie in forest green with a bold diamond geometric pattern. A rare colour that commands respect and sets you apart in chapel and formal settings.',
    materials: 'Woven polyester with diamond-knit pattern, full vintage lining, crisp blade.',
    pickupProcess: 'Reserve with a N900 deposit. Meet seller in Daniel Hall lobby to inspect and collect, Or by delivery. Join community for info',
    image: '/ties/Vintage Ties/Green Diamond Vintage Tie.jpg',
    rating: 4.6,
    reviewsCount: 8,
    isFeatured: true,
    reviews: []
  },
  {
    id: 'vint-green-eye',
    name: 'Green Eye Pattern Vintage Tie',
    seller: 'Sola B.',
    sellerRating: 4.5,
    sellerHall: 'Peter Hall',
    originalPrice: 3600,
    condition: 'Gently Used',
    category: 'Vintage',
    color: 'Forest Green',
    stock: 0,
    description: 'A striking vintage tie with a repeating eye-motif pattern in deep green tones. Unique and artful — the kind of tie that starts conversations at chapel and beyond.',
    materials: 'Polyester satin weave with novelty eye pattern, reinforced vintage lining.',
    pickupProcess: 'Reserve with a N850 deposit. Meet seller in Peter Hall lobby to inspect and collect, Or by delivery. Join community for info',
    image: '/ties/Vintage Ties/Green Eye Pattern Vintage Tie.jpg',
    rating: 4.5,
    reviewsCount: 5,
    isFeatured: false,
    reviews: []
  },
  {
    id: 'vint-wavy-sea',
    name: 'Wavy Sea Blue Pattern Vintage Tie',
    seller: 'Nnamdi O.',
    sellerRating: 4.8,
    sellerHall: 'Paul Hall',
    originalPrice: 4300,
    condition: 'Like New',
    category: 'Vintage',
    color: 'Navy',
    stock: 0,
    description: 'A fluid, mesmerising vintage tie with wavy oceanic blue patterns — calm, distinguished, and unforgettable. A premium piece for the scholar with impeccable taste.',
    materials: 'Vintage silk-touch polyester with wave-print jacquard, smooth finish, intact lining.',
    pickupProcess: 'Reserve with a N1,000 deposit. Meet seller in Paul Hall lobby to inspect and collect, Or by delivery. Join community for info',
    image: '/ties/Vintage Ties/Wavy Sea Blue Pattern Vintage Tie.jpg',
    rating: 4.8,
    reviewsCount: 14,
    isFeatured: true,
    reviews: [
      { id: 'r-ws1', author: 'KnotifyCu', rating: 5, date: '2026-06-09', comment: 'This is beautiful. The wavy pattern is so elegant. Definitely a head-turner.' }
    ]
  },
  {
    id: 'vint-wine-pattern',
    name: 'Wine Pattern Character Tie',
    seller: 'David K.',
    sellerRating: 4.7,
    sellerHall: 'Esther Hall',
    originalPrice: 4000,
    condition: 'Like New',
    category: 'Vintage',
    color: 'Wine',
    stock: 0,
    description: 'A rich wine-coloured vintage tie with character motif patterns — sophisticated yet expressive. Perfect for chapel services, formal dinners and departmental events.',
    materials: 'Woven polyester with character jacquard pattern, wine satin reverse, robust lining.',
    pickupProcess: 'Reserve with a N950 deposit. Meet seller in Esther Hall lobby to inspect and collect, Or by delivery. Join community for info',
    image: '/ties/Vintage Ties/Wine Pattern Character Tie.jpg',
    rating: 4.7,
    reviewsCount: 10,
    isFeatured: true,
    reviews: [
      { id: 'r-wp1', author: 'KnotifyCu', rating: 5, date: '2026-06-11', comment: 'The wine colour is deep and rich. Very classy looking piece.' }
    ]
  }
];

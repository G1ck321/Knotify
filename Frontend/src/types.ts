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
  deposit: number;
  outstanding: number;
  status: 'Reserved' | 'Ready for Pickup' | 'Collected';
  pickupPoint: string;
  dateAdded: string;
}

export interface Product {
  id: string;
  name: string;
  seller: string;
  sellerRating: number;
  sellerHall: string;
  price: number;
  deposit: number;
  originalPrice: number;
  condition: 'Brand New' | 'Like New' | 'Gently Used' | 'Used';
  category: 'Official Tie' | 'Premium' | 'Department' | 'Bow Tie' | 'Corporate' | 'Vintage';
  color: 'Navy' | 'Crimson' | 'Gold' | 'Forest Green' | 'Black' | 'Wine' | 'Stripes';
  stock: number;
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
  // ── CORPORATE TIES ──────────────────────────────────────────────────────────
  {
    id: 'corp-blue-floral',
    name: 'Blue Floral Corporate Tie',
    seller: 'Knotify Official',
    sellerRating: 4.9,
    sellerHall: 'Admin Office',
    price: 4000,
    deposit: 1500,
    originalPrice: 6000,
    condition: 'Brand New',
    category: 'Corporate',
    color: 'Navy',
    stock: 30,
    description: 'A refined navy blue floral-patterned corporate tie. Crisp, professional and chapel-compliant — ideal for formal lectures, executive presentations and Sunday chapel services.',
    materials: '100% woven polyester with fine floral jacquard weave, smooth matte finish, stay-knot interlining.',
    pickupProcess: 'Reserve with a N1,500 deposit. Collect from our designated pickup point at your hall lobby upon resumption and pay the outstanding balance.',
    image: '/ties/Corporate Ties/Blue Floral Corporate Tie.jpg',
    rating: 4.8,
    reviewsCount: 42,
    isFeatured: true,
    reviews: [
      { id: 'r-cf1', author: 'Emmanuel A.', rating: 5, date: '2026-06-10', comment: 'Very smart looking. The floral pattern is subtle and elegant — perfect for chapel.' },
      { id: 'r-cf2', author: 'Grace O.', rating: 5, date: '2026-06-08', comment: 'Great quality. Ordered for my brother and it fits perfectly.' }
    ]
  },
  {
    id: 'corp-blue-logo',
    name: 'Blue Logo Corporate Tie',
    seller: 'Knotify Official',
    sellerRating: 4.9,
    sellerHall: 'Admin Office',
    price: 4500,
    deposit: 1500,
    originalPrice: 6500,
    condition: 'Brand New',
    category: 'Corporate',
    color: 'Navy',
    stock: 25,
    description: 'A sleek navy tie featuring a distinctive logo motif — a hallmark of sartorial precision. Approved for chapel, executive functions and departmental presentations.',
    materials: 'Premium satin-backed polyester, logo-embossed jacquard pattern, structured knot lining.',
    pickupProcess: 'Reserve with a N1,500 deposit. Collect from our designated pickup point at your hall lobby upon resumption and pay the outstanding balance.',
    image: '/ties/Corporate Ties/Blue Logo Corporate Tie.jpg',
    rating: 4.9,
    reviewsCount: 38,
    isFeatured: true,
    reviews: [
      { id: 'r-cl1', author: 'Joshua I.', rating: 5, date: '2026-06-05', comment: 'Clean and professional. The logo pattern is understated and classy.' }
    ]
  },
  {
    id: 'corp-plain-blue',
    name: 'Plain Blue Corporate Tie',
    seller: 'Knotify Official',
    sellerRating: 4.9,
    sellerHall: 'Admin Office',
    price: 3500,
    deposit: 1500,
    originalPrice: 5000,
    condition: 'Brand New',
    category: 'Corporate',
    color: 'Navy',
    stock: 50,
    description: 'The classic plain navy blue tie — a timeless staple for any Covenant scholar. Matches every formal shirt and fulfils all chapel dress requirements effortlessly.',
    materials: 'Smooth matte polyester satin, double-lined for a firm Windsor knot, wrinkle-resistant weave.',
    pickupProcess: 'Reserve with a N1,500 deposit. Collect from our designated pickup point at your hall lobby upon resumption and pay the outstanding balance.',
    image: '/ties/Corporate Ties/Plain Blue  Corporate Tie.jpg',
    rating: 4.7,
    reviewsCount: 91,
    isFeatured: true,
    reviews: [
      { id: 'r-pb1', author: 'Faith N.', rating: 5, date: '2026-06-18', comment: 'Simple, clean, and works with everything. Exactly what I needed for resumption.' },
      { id: 'r-pb2', author: 'Osas B.', rating: 4, date: '2026-06-14', comment: 'Good quality for the price. Ties a neat knot easily.' }
    ]
  },

  // ── VINTAGE TIES ─────────────────────────────────────────────────────────────
  {
    id: 'vint-blue-dolphin',
    name: 'Blue Dolphin Character Vintage Tie',
    seller: 'Emeka Williams',
    sellerRating: 4.7,
    sellerHall: 'Peter Hall',
    price: 2500,
    deposit: 1000,
    originalPrice: 4000,
    condition: 'Like New',
    category: 'Vintage',
    color: 'Navy',
    stock: 1,
    description: 'A fun and charming vintage tie featuring playful dolphin characters on a rich navy background. A conversation starter and a personality statement in any chapel or lecture hall.',
    materials: 'Vintage 100% silk blend, hand-finished edges, original lining intact.',
    pickupProcess: 'Reserve with a N1,000 deposit. Meet seller in Peter Hall lobby at an agreed time to inspect and collect.',
    image: '/ties/Vintage Ties/Blue Dolphin Character Vintage Tie.jpg',
    rating: 4.6,
    reviewsCount: 7,
    isFeatured: true,
    reviews: [
      { id: 'r-bd1', author: 'Temi L.', rating: 5, date: '2026-05-30', comment: 'So unique! Got so many compliments at chapel. Love it.' }
    ]
  },
  {
    id: 'vint-blue-pattern-char',
    name: 'Blue Pattern Character Tie',
    seller: 'Chukwudi A.',
    sellerRating: 4.5,
    sellerHall: 'Daniel Hall',
    price: 2000,
    deposit: 800,
    originalPrice: 3500,
    condition: 'Gently Used',
    category: 'Vintage',
    color: 'Navy',
    stock: 1,
    description: 'A vintage patterned character tie with rich blue tones and intricate detailing. A rare find from a graduating senior — pairs beautifully with a crisp white shirt.',
    materials: 'Polyester satin blend with vintage woven pattern, original keeper loop intact.',
    pickupProcess: 'Reserve with a N800 deposit. Meet seller in Daniel Hall lobby to inspect and collect.',
    image: '/ties/Vintage Ties/Blue Pattern Character Tie.jpg',
    rating: 4.4,
    reviewsCount: 5,
    isFeatured: false,
    reviews: []
  },
  {
    id: 'vint-blue-pattern',
    name: 'Blue Pattern Vintage Tie',
    seller: 'Adaeze M.',
    sellerRating: 4.6,
    sellerHall: 'Esther Hall',
    price: 2200,
    deposit: 900,
    originalPrice: 3800,
    condition: 'Like New',
    category: 'Vintage',
    color: 'Navy',
    stock: 1,
    description: 'A graceful vintage tie with a repeating geometric blue pattern — understated elegance meeting classic craftsmanship. Perfect for formal chapel attendance.',
    materials: '100% woven polyester, structured vintage lining, excellent knot stability.',
    pickupProcess: 'Reserve with a N900 deposit. Meet seller in Esther Hall lobby to inspect and collect.',
    image: '/ties/Vintage Ties/Blue Pattern Vintage Tie.jpg',
    rating: 4.7,
    reviewsCount: 9,
    isFeatured: true,
    reviews: [
      { id: 'r-bpv1', author: 'Miracle O.', rating: 5, date: '2026-06-01', comment: 'Gorgeous vintage piece. Condition is excellent.' }
    ]
  },
  {
    id: 'vint-bright-abstract',
    name: 'Bright Abstract Vintage Tie',
    seller: 'Segun F.',
    sellerRating: 4.8,
    sellerHall: 'Paul Hall',
    price: 2800,
    deposit: 1000,
    originalPrice: 4500,
    condition: 'Like New',
    category: 'Vintage',
    color: 'Stripes',
    stock: 1,
    description: 'A bold, eye-catching vintage tie with bright abstract art — for the scholar who dresses with intention. A premium collector piece sourced from a graduating senior.',
    materials: 'Silk-polyester blend, vivid print, original vintage backing intact.',
    pickupProcess: 'Reserve with a N1,000 deposit. Meet seller in Paul Hall lobby to inspect and collect.',
    image: '/ties/Vintage Ties/Bright Abstract Vintage Tie.jpg',
    rating: 4.9,
    reviewsCount: 11,
    isFeatured: true,
    reviews: [
      { id: 'r-ba1', author: 'Ifeoma C.', rating: 5, date: '2026-06-03', comment: 'Absolutely stunning. Very unique piece. 10/10 would recommend.' }
    ]
  },
  {
    id: 'vint-cool-abstract',
    name: 'Cool Abstract Vintage Tie',
    seller: 'Bola A.',
    sellerRating: 4.5,
    sellerHall: 'Lydia Hall',
    price: 2500,
    deposit: 1000,
    originalPrice: 4000,
    condition: 'Gently Used',
    category: 'Vintage',
    color: 'Navy',
    stock: 1,
    description: 'A cool-toned abstract vintage tie with smooth artistic patterns. A sophisticated choice for the style-forward Covenant scholar who wants to stand out gracefully.',
    materials: 'Polyester with abstract print overlay, sturdy vintage inner lining.',
    pickupProcess: 'Reserve with a N1,000 deposit. Meet seller in Lydia Hall lobby to inspect and collect.',
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
    price: 1800,
    deposit: 700,
    originalPrice: 3200,
    condition: 'Gently Used',
    category: 'Vintage',
    color: 'Gold',
    stock: 1,
    description: 'A whimsical and fun vintage tie adorned with duck characters — a cheerful, nostalgic piece for the scholar with a great sense of humour and confident personal style.',
    materials: 'Vintage polyester satin, novelty character print, intact original lining.',
    pickupProcess: 'Reserve with a N700 deposit. Meet seller in Joseph Hall lobby to inspect and collect.',
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
    price: 2600,
    deposit: 1000,
    originalPrice: 4200,
    condition: 'Like New',
    category: 'Vintage',
    color: 'Crimson',
    stock: 1,
    description: 'An exquisite vintage floral tie — rich botanicals woven into fine silk-like fabric. Elegant and chapel-approved, ideal for formal occasions and Sunday services.',
    materials: 'Vintage woven silk-polyester, botanical jacquard pattern, soft inner lining.',
    pickupProcess: 'Reserve with a N1,000 deposit. Meet seller in Mary Hall lobby to inspect and collect.',
    image: '/ties/Vintage Ties/Floral Vintage Tie.jpg',
    rating: 4.8,
    reviewsCount: 13,
    isFeatured: true,
    reviews: [
      { id: 'r-fv1', author: 'Chiamaka N.', rating: 5, date: '2026-06-07', comment: 'So beautiful. The colours are vibrant and it looks really premium.' }
    ]
  },
  {
    id: 'vint-green-diamond',
    name: 'Green Diamond Vintage Tie',
    seller: 'Tobi R.',
    sellerRating: 4.6,
    sellerHall: 'Daniel Hall',
    price: 2300,
    deposit: 900,
    originalPrice: 3800,
    condition: 'Like New',
    category: 'Vintage',
    color: 'Forest Green',
    stock: 1,
    description: 'A distinguished vintage tie in forest green with a bold diamond geometric pattern. A rare colour that commands respect and sets you apart in chapel and formal settings.',
    materials: 'Woven polyester with diamond-knit pattern, full vintage lining, crisp blade.',
    pickupProcess: 'Reserve with a N900 deposit. Meet seller in Daniel Hall lobby to inspect and collect.',
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
    price: 2100,
    deposit: 850,
    originalPrice: 3600,
    condition: 'Gently Used',
    category: 'Vintage',
    color: 'Forest Green',
    stock: 1,
    description: 'A striking vintage tie with a repeating eye-motif pattern in deep green tones. Unique and artful — the kind of tie that starts conversations at chapel and beyond.',
    materials: 'Polyester satin weave with novelty eye pattern, reinforced vintage lining.',
    pickupProcess: 'Reserve with a N850 deposit. Meet seller in Peter Hall lobby to inspect and collect.',
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
    price: 2700,
    deposit: 1000,
    originalPrice: 4300,
    condition: 'Like New',
    category: 'Vintage',
    color: 'Navy',
    stock: 1,
    description: 'A fluid, mesmerising vintage tie with wavy oceanic blue patterns — calm, distinguished, and unforgettable. A premium piece for the scholar with impeccable taste.',
    materials: 'Vintage silk-touch polyester with wave-print jacquard, smooth finish, intact lining.',
    pickupProcess: 'Reserve with a N1,000 deposit. Meet seller in Paul Hall lobby to inspect and collect.',
    image: '/ties/Vintage Ties/Wavy Sea Blue Pattern Vintage Tie.jpg',
    rating: 4.8,
    reviewsCount: 14,
    isFeatured: true,
    reviews: [
      { id: 'r-ws1', author: 'Rukayat A.', rating: 5, date: '2026-06-09', comment: 'This is beautiful. The wavy pattern is so elegant. Definitely a head-turner.' }
    ]
  },
  {
    id: 'vint-wine-pattern',
    name: 'Wine Pattern Character Tie',
    seller: 'David K.',
    sellerRating: 4.7,
    sellerHall: 'Esther Hall',
    price: 2400,
    deposit: 950,
    originalPrice: 4000,
    condition: 'Like New',
    category: 'Vintage',
    color: 'Wine',
    stock: 1,
    description: 'A rich wine-coloured vintage tie with character motif patterns — sophisticated yet expressive. Perfect for chapel services, formal dinners and departmental events.',
    materials: 'Woven polyester with character jacquard pattern, wine satin reverse, robust lining.',
    pickupProcess: 'Reserve with a N950 deposit. Meet seller in Esther Hall lobby to inspect and collect.',
    image: '/ties/Vintage Ties/Wine Pattern Character Tie.jpg',
    rating: 4.7,
    reviewsCount: 10,
    isFeatured: true,
    reviews: [
      { id: 'r-wp1', author: 'Oluwaseun D.', rating: 5, date: '2026-06-11', comment: 'The wine colour is deep and rich. Very classy looking piece.' }
    ]
  }
];

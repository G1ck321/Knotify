import { Product } from '../types';

/**
 * A row from `GET /quantity/ties`. Kept here (not imported from App.tsx) so the
 * catalog merge and the admin dashboard can share one shape.
 */
export interface InventoryRow {
  tie_id: string;
  tie_name: string;
  image_url?: string | null;
  price: number;
  /** Pre-discount price, present only when the backend applied a discount. */
  list_price?: number | null;
  quantity: number;
  is_active: boolean;
  is_sold_out: boolean;
  added_at?: string | null;
}

const COLOR_RULES: Array<[RegExp, Product['color']]> = [
  [/\bwine|burgundy|maroon\b/i, 'Wine'],
  [/\bnavy|blue\b/i, 'Navy'],
  [/\bgold|amber|mustard\b/i, 'Gold'],
  [/\bgreen|forest\b/i, 'Forest Green'],
  [/\bblack\b/i, 'Black'],
  [/\bred|crimson\b/i, 'Crimson'],
];

function inferColor(name: string): Product['color'] {
  for (const [pattern, color] of COLOR_RULES) {
    if (pattern.test(name)) return color;
  }
  return 'Black';
}

/**
 * Build a storefront product from a `ties` row.
 *
 * This is what lets a tie added straight in Supabase appear in the store
 * without hand-editing `INITIAL_PRODUCTS` in types.ts. Defaults are deliberately
 * boring: the DB row has no merchandising copy, and inventing per-tie prose
 * would just rot.
 */
export function productFromTie(tie: InventoryRow): Product {
  const name = (tie.tie_name || tie.tie_id || '').trim() || tie.tie_id;
  const price = Number(tie.price) || 0;

  return {
    id: tie.tie_id,
    name,
    seller: 'Knotify',
    sellerRating: 5,
    sellerHall: 'Main Administration Station',
    originalPrice: Number(tie.list_price ?? price) || price,
    price,
    condition: 'Student-Ready',
    category: 'Official Tie',
    color: inferColor(name),
    stock: Number(tie.quantity) || 0,
    description: `${name} — available now for direct Covenant hall delivery.`,
    materials: 'Woven fabric',
    pickupProcess: 'Delivered to your residence hall lobby',
    image: tie.image_url || '',
    rating: 5,
    reviewsCount: 0,
    isFeatured: false,
    addedAt: tie.added_at || undefined,
    reviews: [],
  };
}

/** Live price/stock patch for a product that already exists locally. */
export function applyLiveTie(product: Product, tie: InventoryRow): Product {
  const livePrice = Number(tie.price ?? product.originalPrice) || 0;

  return {
    ...product,
    name: tie.tie_name || product.name,
    image: tie.image_url || product.image,
    price: livePrice,
    // Only show a strike-through when the BACKEND reports a list price. Keeping
    // the hard-coded types.ts `originalPrice` above a live price invented a
    // discount the customer was never actually offered.
    originalPrice: Number(tie.list_price ?? livePrice) || livePrice,
    stock: Number(tie.quantity ?? product.stock),
    addedAt: tie.added_at || product.addedAt,
  };
}

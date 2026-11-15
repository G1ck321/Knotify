/**
 * Client-side mirror of Backend/pricing.py. These numbers MUST match; the
 * backend re-prices every order from its own copy, so a drift here shows a
 * wrong total at checkout while charging the right one (that was the
 * ₦250-vs-₦350 delivery bug).
 */

/** Knotted-tie photo request: delivery of the photo + the service behind it. */
export const PIC_FEE = 200;

/**
 * Optional priority restock/delivery alerts add-on, charged once per order.
 * NOT the receipt email: that one is required, always sent, and free. Only
 * routers/orders.py adds this when the buyer explicitly opts in.
 */
export const UPDATES_FEE = 100;

/** Flat hall delivery + handoff fee. */
export const DELIVERY_FEE = 200;

/** One order may not contain more than this many of a single tie. */
export const MAX_PER_TIE = 4;

export function formatNaira(amount: number): string {
  return `₦${Math.round(Number(amount) || 0).toLocaleString('en-NG')}`;
}

export type StockTone = 'out' | 'low' | 'ok';

/**
 * Bucket a raw stock number for display.
 *
 * The catalog has legacy rows with absurd counts (one static entry claims
 * 2800), so raw numbers are never printed above the "low" band: what a shopper
 * needs to know is whether it is available and roughly how scarce it is.
 * Never use this for cart maths - clamp against the real `stock`.
 */
export function stockLabel(stock: number): { label: string; tone: StockTone } {
  const value = Number(stock) || 0;
  if (value <= 0) return { label: 'Out of stock', tone: 'out' };
  if (value <= 3) return { label: `Only ${value} left`, tone: 'low' };
  if (value <= 9) return { label: 'Low stock', tone: 'low' };
  return { label: 'In stock', tone: 'ok' };
}

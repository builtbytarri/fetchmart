import { Product, ProductUnit, UNIT_LABEL } from '../types';

/**
 * Round to 3 decimal places — the precision the backend stores quantities at.
 *
 * Repeatedly adding a step like 0.1 in floating point drifts
 * (0.1 + 0.2 === 0.30000000000000004), which would then fail the backend's
 * "must be a whole multiple of stepSize" check. Rounding after every step
 * keeps the value exact.
 */
export function roundQty(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** The increment for a product, defaulting to whole units. */
export function stepFor(product: Pick<Product, 'stepSize'>): number {
  const step = Number(product.stepSize);
  return step > 0 ? step : 1;
}

/**
 * Format a quantity for display. Measured goods read better as fractions
 * ("½ mudu" rather than "0.5 mudu"); whole numbers drop the decimals.
 */
export function formatQty(quantity: number, unit?: ProductUnit): string {
  const q = roundQty(quantity);
  const whole = Math.floor(q);
  const frac = roundQty(q - whole);

  let text: string;
  if (frac === 0) text = String(whole);
  else if (frac === 0.5) text = whole === 0 ? '½' : `${whole}½`;
  else if (frac === 0.25) text = whole === 0 ? '¼' : `${whole}¼`;
  else if (frac === 0.75) text = whole === 0 ? '¾' : `${whole}¾`;
  else text = String(q);

  const label = unit ? UNIT_LABEL[unit] : '';
  return label ? `${text} ${label}` : text;
}

/** "₦2,500 / mudu" for measured goods, plain price for countable ones. */
export function formatUnitPrice(price: number, unit?: ProductUnit): string {
  const base = `₦${Number(price).toLocaleString()}`;
  const label = unit ? UNIT_LABEL[unit] : '';
  return label ? `${base} / ${label}` : base;
}

/**
 * Quick-pick amounts offered next to the stepper. Only useful for measured
 * goods sold in fractions — a countable item just uses +/-.
 */
export function quickPicks(step: number): number[] {
  if (step >= 1) return [];
  return [step, 1, roundQty(1 + step), 2];
}

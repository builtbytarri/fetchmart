import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PlatformSettings, Product } from '@prisma/client';
import { PrismaService } from '../database';
import { AppConfigService } from '../config';
import { SettingsService } from '../settings';
import { DeliveryBreakdown, OrderQuote, QuoteItem } from './pricing.types';

/**
 * Central money math: delivery-fee computation + full order financial breakdown.
 *
 * All parameters are read from PlatformSettings so pricing stays admin-tunable.
 * The same methods are used by the checkout flow and the customer-facing
 * quote endpoint, so what the customer sees is exactly what gets charged.
 */
@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly config: AppConfigService,
  ) {}

  // ── Public: full quote for a cart (store → customer) ─────────────────────
  async getQuote(params: {
    storeId: string;
    destLat: number;
    destLng: number;
    items: QuoteItem[];
    when?: Date;
  }): Promise<OrderQuote> {
    const { storeId, destLat, destLng, items, when } = params;

    if (!items?.length) {
      throw new BadRequestException('Cannot quote an empty cart');
    }

    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');

    const productIds = items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, storeId },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    let bulkyCount = 0;
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found in this store`);
      }
      subtotal += Number(product.price) * item.quantity;
      if (product.isBulky) bulkyCount += 1; // surcharge applied per bulky line item
    }

    const settings = await this.settingsService.getSettings();
    const distanceKm = await this.getDistanceKm(
      store.latitude,
      store.longitude,
      destLat,
      destLng,
    );

    const { deliveryFee, breakdown } = this.computeDeliveryFee(settings, distanceKm, {
      bulkyCount,
      extraStops: 0,
      when: when ?? new Date(),
    });

    const financials = this.computeOrderFinancials(settings, subtotal, deliveryFee);

    return {
      distanceKm: round2(distanceKm),
      subtotal: round2(subtotal),
      deliveryFee,
      deliveryBreakdown: breakdown,
      ...financials,
    };
  }

  // ── Delivery fee from distance + params ──────────────────────────────────
  computeDeliveryFee(
    settings: PlatformSettings,
    distanceKm: number,
    opts: { bulkyCount: number; extraStops: number; when: Date },
  ): { deliveryFee: number; breakdown: DeliveryBreakdown } {
    const base = Number(settings.deliveryBaseFee);
    const freeRadiusKm = Number(settings.freeRadiusKm);
    const perKmRate = Number(settings.perKmRate);
    const extraStopFee = Number(settings.extraStopFee);
    const bulkyItemFee = Number(settings.bulkyItemFee);

    // Charge per whole km beyond the free radius (rounded up).
    const extraKm = Math.max(0, Math.ceil(distanceKm - freeRadiusKm));
    const distanceFee = extraKm * perKmRate;

    const bulkyFee = opts.bulkyCount * bulkyItemFee;
    const extraStopTotal = opts.extraStops * extraStopFee;
    const nightSurcharge = this.isNight(settings, opts.when)
      ? Number(settings.nightSurcharge)
      : 0;

    const breakdown: DeliveryBreakdown = {
      base: round2(base),
      distanceFee: round2(distanceFee),
      bulkyFee: round2(bulkyFee),
      nightSurcharge: round2(nightSurcharge),
      extraStopFee: round2(extraStopTotal),
    };

    const deliveryFee = round2(
      base + distanceFee + bulkyFee + extraStopTotal + nightSurcharge,
    );

    return { deliveryFee, breakdown };
  }

  // ── Service fee, commission, payouts, admin profit ───────────────────────
  computeOrderFinancials(
    settings: PlatformSettings,
    subtotal: number,
    deliveryFee: number,
  ): Omit<OrderQuote, 'distanceKm' | 'subtotal' | 'deliveryFee' | 'deliveryBreakdown'> {
    const serviceFee = round2((subtotal * Number(settings.serviceFeePercent)) / 100);
    const commissionAmount = round2((subtotal * Number(settings.commissionPercent)) / 100);
    const storePayout = round2(subtotal - commissionAmount);
    const riderPayout = round2(
      (deliveryFee * Number(settings.riderDeliverySharePercent)) / 100,
    );
    const adminProfit = round2(
      serviceFee + commissionAmount + (deliveryFee - riderPayout),
    );
    const total = round2(subtotal + serviceFee + deliveryFee);

    return {
      serviceFee,
      commissionAmount,
      storePayout,
      riderPayout,
      adminProfit,
      total,
    };
  }

  /** Count bulky line items in a set of products (used by the order flow). */
  countBulky(products: Product[]): number {
    return products.filter((p) => p.isBulky).length;
  }

  // ── Distance: Mapbox driving distance with haversine fallback ────────────
  async getDistanceKm(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<number> {
    const { provider, apiKey } = this.config.getMapConfig();

    if (provider?.toLowerCase() === 'mapbox' && apiKey) {
      try {
        const url =
          `https://api.mapbox.com/directions/v5/mapbox/driving/` +
          `${originLng},${originLat};${destLng},${destLat}` +
          `?access_token=${apiKey}&overview=false`;
        const res = await fetch(url);
        const json = (await res.json()) as {
          routes?: Array<{ distance: number }>;
        };
        const meters = json.routes?.[0]?.distance;
        if (typeof meters === 'number' && meters > 0) {
          return meters / 1000;
        }
        this.logger.warn('Mapbox returned no route; falling back to haversine');
      } catch (err) {
        this.logger.warn(`Mapbox distance lookup failed; using haversine: ${err}`);
      }
    }

    return haversineKm(originLat, originLng, destLat, destLng);
  }

  private isNight(settings: PlatformSettings, when: Date): boolean {
    const hour = lagosHour(when);
    const start = settings.nightStartHour;
    const end = settings.nightEndHour;
    // Window may wrap midnight (e.g. 20:00 → 06:00).
    return start <= end ? hour >= start && hour < end : hour >= start || hour < end;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Hour-of-day (0–23) in Africa/Lagos, regardless of server timezone. */
function lagosHour(when: Date): number {
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Lagos',
    hour: 'numeric',
    hour12: false,
  }).format(when);
  const hour = parseInt(formatted, 10);
  return Number.isNaN(hour) ? when.getHours() : hour % 24;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

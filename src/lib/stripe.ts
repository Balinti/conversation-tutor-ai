import Stripe from 'stripe';

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  : null;

export function getStripePublishableKey(): string | null {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null;
}

export function getPriceIds() {
  return {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || null,
    annual: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID || null,
  };
}

export function hasStripeConfig(): boolean {
  return !!stripe && !!getStripePublishableKey();
}

export function hasPriceIds(): boolean {
  const prices = getPriceIds();
  return !!prices.monthly || !!prices.annual;
}

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServiceRoleClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

interface SubscriptionWithPeriod extends Stripe.Subscription {
  current_period_end: number;
}

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      console.log('Stripe not configured, returning 200');
      return NextResponse.json({ received: true });
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    let event: Stripe.Event;

    // Verify signature if webhook secret is configured
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json({ received: true, error: 'Invalid signature' });
      }
    } else {
      try {
        event = JSON.parse(body) as Stripe.Event;
      } catch {
        return NextResponse.json({ received: true, error: 'Invalid JSON' });
      }
    }

    const serviceClient = await createServiceRoleClient();

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;

          if (session.mode === 'subscription' && session.subscription) {
            const subscriptionData = await stripe.subscriptions.retrieve(
              session.subscription as string
            ) as unknown as SubscriptionWithPeriod;

            const customerId = session.customer as string;

            const { data: existingSub } = await serviceClient
              .from('subscriptions')
              .select('user_id')
              .eq('stripe_customer_id', customerId)
              .single();

            if (existingSub) {
              await serviceClient
                .from('subscriptions')
                .update({
                  stripe_subscription_id: subscriptionData.id,
                  status: subscriptionData.status === 'active' ? 'active' : 'inactive',
                  price_id: subscriptionData.items.data[0]?.price?.id || null,
                  current_period_end: subscriptionData.current_period_end
                    ? new Date(subscriptionData.current_period_end * 1000).toISOString()
                    : null,
                  updated_at: new Date().toISOString(),
                })
                .eq('stripe_customer_id', customerId);
            }
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscriptionData = event.data.object as unknown as SubscriptionWithPeriod;
          const customerId = subscriptionData.customer as string;

          await serviceClient
            .from('subscriptions')
            .update({
              status: subscriptionData.status === 'active' ? 'active' :
                      subscriptionData.status === 'past_due' ? 'past_due' : 'inactive',
              price_id: subscriptionData.items.data[0]?.price?.id || null,
              current_period_end: subscriptionData.current_period_end
                ? new Date(subscriptionData.current_period_end * 1000).toISOString()
                : null,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscriptionData = event.data.object as Stripe.Subscription;
          const customerId = subscriptionData.customer as string;

          await serviceClient
            .from('subscriptions')
            .update({
              status: 'canceled',
              stripe_subscription_id: null,
              price_id: null,
              current_period_end: null,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId);
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Webhook processing error:', error);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ received: true });
  }
}

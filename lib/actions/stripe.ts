'use server'

import { stripe } from '@/lib/stripe'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-plans'

/**
 * Crea una sessione di checkout per un abbonamento
 */
export async function createSubscriptionCheckout(
  planId: string, 
  billingPeriod: 'monthly' | 'yearly',
  customerEmail?: string
) {
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId)
  if (!plan) {
    throw new Error(`Plan with id "${planId}" not found`)
  }

  if (plan.tier === 'free') {
    throw new Error('Cannot checkout free plan')
  }

  const price = billingPeriod === 'yearly' ? plan.priceYearly : plan.priceMonthly
  const interval = billingPeriod === 'yearly' ? 'year' : 'month'

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    customer_email: customerEmail,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: plan.name,
            description: plan.description,
          },
          unit_amount: price,
          recurring: {
            interval: interval,
          },
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    subscription_data: {
      metadata: {
        plan_id: plan.id,
        plan_tier: plan.tier,
      },
    },
  })

  return session.client_secret
}

/**
 * Crea una sessione di checkout per un pagamento singolo (es. consulenza)
 */
export async function createOneTimeCheckout(
  productName: string,
  priceInCents: number,
  description?: string,
  customerEmail?: string
) {
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    customer_email: customerEmail,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: productName,
            description: description || '',
          },
          unit_amount: priceInCents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
  })

  return session.client_secret
}

/**
 * Recupera lo stato di una sessione di checkout
 */
export async function getCheckoutSession(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  return {
    status: session.status,
    customerEmail: session.customer_email,
    subscriptionId: session.subscription as string | null,
  }
}

/**
 * Crea un portal session per gestire l'abbonamento
 */
export async function createCustomerPortalSession(customerId: string, returnUrl: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
  return session.url
}

/**
 * Cancella un abbonamento
 */
export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.cancel(subscriptionId)
  return subscription.status
}

/**
 * Aggiorna un abbonamento a un piano superiore
 */
export async function upgradeSubscription(
  subscriptionId: string, 
  newPlanId: string,
  billingPeriod: 'monthly' | 'yearly'
) {
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === newPlanId)
  if (!plan) {
    throw new Error(`Plan with id "${newPlanId}" not found`)
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const price = billingPeriod === 'yearly' ? plan.priceYearly : plan.priceMonthly
  const interval = billingPeriod === 'yearly' ? 'year' : 'month'

  // Crea nuovo prezzo e aggiorna subscription
  const newPrice = await stripe.prices.create({
    currency: 'eur',
    unit_amount: price,
    recurring: { interval },
    product_data: {
      name: plan.name,
    },
  })

  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPrice.id,
      },
    ],
    metadata: {
      plan_id: plan.id,
      plan_tier: plan.tier,
    },
    proration_behavior: 'create_prorations',
  })

  return updatedSubscription.status
}

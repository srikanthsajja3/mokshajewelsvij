import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Stripe } from "https://esm.sh/stripe@12.0.0?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    const { amount, currency, customerEmail } = await req.json()
    console.log(`Processing payment for ${customerEmail}: ${amount} ${currency}`);

    if (!Deno.env.get('STRIPE_SECRET_KEY')) {
      throw new Error("STRIPE_SECRET_KEY is not set in Supabase Secrets");
    }

    // Create or retrieve a customer
    const customers = await stripe.customers.list({ email: customerEmail })
    let customer
    if (customers.data.length > 0) {
      customer = customers.data[0]
    } else {
      customer = await stripe.customers.create({ email: customerEmail })
    }

    // Create an ephemeral key
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2022-11-15' }
    )

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency || 'usd',
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return new Response(
      JSON.stringify({
        paymentIntent: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customer.id,
        publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY'),
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' 
        },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Stripe Function Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' 
        },
        status: 400,
      }
    )
  }
})

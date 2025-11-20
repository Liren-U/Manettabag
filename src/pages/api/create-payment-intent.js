// src/pages/api/create-payment-intent.js

export const POST = async () => {
  // Cloudflare Pages + Astro 推荐用 import.meta.env 读取环境变量
  const secretKey = import.meta.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    console.error('STRIPE_SECRET_KEY is missing');
    return new Response(
      JSON.stringify({ error: 'Server config error: STRIPE_SECRET_KEY is missing.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 这里用 Stripe 官方 REST API，而不是 node SDK
    const params = new URLSearchParams({
      amount: '500', // 单位“分”
      currency: 'usd',
      'automatic_payment_methods[enabled]': 'true',
      description: 'Manetta VIP Subscription - $5 USD',
    });

    const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error('Stripe API error:', data);
      return new Response(
        JSON.stringify({ error: data.error?.message || 'Stripe API error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ clientSecret: data.client_secret }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Payment intent create failed:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to create payment intent.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

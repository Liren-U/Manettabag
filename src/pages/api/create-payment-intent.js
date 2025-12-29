// src/pages/api/create-payment-intent.js

export const POST = async (context) => {
  // 1. Cloudflare 运行时环境里的变量（线上）
  const runtimeEnv = context?.locals?.runtime?.env;

  // 2. 优先用 Cloudflare 的 env，其次用本地的 import.meta.env（本地 dev 时用）
  const secretKey =
    (runtimeEnv && runtimeEnv.STRIPE_SECRET_KEY) ||
    import.meta.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    console.error('STRIPE_SECRET_KEY is missing (Cloudflare runtime & import.meta.env both empty)');
    return new Response(
      JSON.stringify({
        error: 'Server config error: STRIPE_SECRET_KEY is missing.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const params = new URLSearchParams({
      amount: '100', // 单位是 “分”
      currency: 'usd',
      'automatic_payment_methods[enabled]': 'true',
      description: 'Manetta VIP Subscription - $1 USD',
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

// 文件路径：src/pages/api/create-payment-intent.js

import Stripe from 'stripe';

// 临时使用 'any' 以便在没有密钥的情况下也能编译，但运行时会失败
const secretKey = process.env.STRIPE_SECRET_KEY;

// ******************************************************
// *** DEBUG: 检查密钥是否加载 ***
// ******************************************************
if (!secretKey) {
    console.error('CRITICAL ERROR: STRIPE_SECRET_KEY environment variable is NOT set.');
}
// ******************************************************

const stripe = new Stripe(secretKey as string, {
    apiVersion: '2023-10-16',
});

export const POST = async ({ request }) => {
    try {
        if (!secretKey) {
            // 如果密钥缺失，返回一个更清晰的 500 响应
            return new Response(
                JSON.stringify({ error: 'Server configuration error: Stripe key is missing.' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const amount = 500; 

        // 1. Create the PaymentIntent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            payment_method_types: ['card'],
            description: 'Manetta VIP Subscription - $5 USD',
        });

        // 2. Success Response
        return new Response(
            JSON.stringify({ clientSecret: paymentIntent.client_secret }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Stripe PaymentIntent Creation Error:', error);

        // 错误响应
        return new Response(
            JSON.stringify({ error: 'Failed to create payment intent. Check server logs for details.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
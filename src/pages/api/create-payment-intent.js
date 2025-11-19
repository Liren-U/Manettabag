// 文件路径：src/pages/api/create-payment-intent.js

import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;

export const POST = async ({ request }) => {
    try {
        // *** 1. 明确检查密钥是否存在 ***
        if (!secretKey) {
            console.error('DEBUG: STRIPE_SECRET_KEY is undefined or empty!');
            return new Response(
                JSON.stringify({ error: 'Server Config Error: Stripe Secret Key is missing from ENV.' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // *** 2. 只有密钥存在时才初始化 Stripe ***
        const stripe = new Stripe(secretKey, {
            apiVersion: '2023-10-16',
        });

        const amount = 500;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            payment_method_types: ['card'],
            description: 'Manetta VIP Subscription - $5 USD',
        });

        // Success Response
        return new Response(
            JSON.stringify({ clientSecret: paymentIntent.client_secret }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        // 如果 Stripe 初始化成功但 PaymentIntent 创建失败，会在这里捕获
        console.error('Stripe PaymentIntent Creation Error:', error);

        return new Response(
            JSON.stringify({ error: 'Failed to create payment intent. Check server logs for details.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
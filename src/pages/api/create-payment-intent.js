// 文件路径：src/pages/api/create-payment-intent.js

import Stripe from 'stripe';

// 移除顶层的 const secretKey = process.env.STRIPE_SECRET_KEY;

export const POST = async ({ request }) => {
    // *** 1. 在请求处理函数内部读取变量 ***
    // 这样做可以确保在变量被注入 Worker 运行时后才尝试访问它。
    const secretKey = process.env.STRIPE_SECRET_KEY; 

    try {
        // 明确检查密钥是否存在
        if (!secretKey) {
            // 尽管它可能现在能读到，但保持检查是良好的做法。
            console.error('DEBUG: STRIPE_SECRET_KEY is undefined or empty! (Inside POST)');
            return new Response(
                JSON.stringify({ error: 'Server Config Error: Stripe Secret Key is missing from ENV.' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // 只有密钥存在时才初始化 Stripe
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
        // ... (错误处理保持不变)
        console.error('Stripe PaymentIntent Creation Error:', error);

        return new Response(
            JSON.stringify({ error: 'Failed to create payment intent. Check server logs for details.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
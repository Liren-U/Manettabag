// 文件路径：src/pages/api/create-payment-intent.js

import Stripe from 'stripe';

// Initializes Stripe using the secret key set in Cloudflare's environment variables.
// Astro/Cloudflare 适配器会自动读取 process.env.STRIPE_SECRET_KEY
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});

// Astro API 路由格式：使用 HTTP 方法（POST）命名导出
// context 对象被解构，但我们实际上只需要它提供运行环境（如 process.env）
export const POST = async ({ request }) => {
    try {
        // 由于我们使用了 POST 导出，Astro 已经帮我们过滤了请求方法，
        // 原始的 'if (context.request.method !== "POST")' 检查可以省略。

        // 定义支付金额 ($5.00 USD)，单位为分
        const amount = 500;

        // 1. Create the PaymentIntent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            payment_method_types: ['card'],
            description: 'Manetta VIP Subscription - $5 USD',
        });

        // 2. Return the clientSecret to the frontend to authorize the form
        // Astro 的 Response 遵循标准 Web API Response
        return new Response(
            JSON.stringify({ clientSecret: paymentIntent.client_secret }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

    } catch (error) {
        console.error('Stripe PaymentIntent Creation Error:', error);

        // 错误响应
        return new Response(
            JSON.stringify({ error: 'Failed to create payment intent.' }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
}
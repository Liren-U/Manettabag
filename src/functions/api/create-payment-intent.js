// functions/api/create-payment-intent.js

// This file handles the secure transaction logic on the server (Cloudflare Worker)
import Stripe from 'stripe';

// Initializes Stripe using the secret key set in Cloudflare's environment variables.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});

// Cloudflare Pages Function Handler
export async function onRequest(context) {
    try {
        // Only allow POST requests
        if (context.request.method !== 'POST') {
            return new Response('Method Not Allowed', { status: 405 });
        }

        // Define the payment amount ($5.00 USD)
        const amount = 500;

        // 1. Create the PaymentIntent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            payment_method_types: ['card'],
            description: 'Manetta VIP Subscription - $5 USD',
        });

        // 2. Return the clientSecret to the frontend to authorize the form
        return new Response(
            JSON.stringify({ clientSecret: paymentIntent.client_secret }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Stripe PaymentIntent Creation Error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to create payment intent.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
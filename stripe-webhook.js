// functions/stripe-webhook.js
//
// Stripe appelle cette fonction automatiquement dès qu'un événement se
// produit (paiement confirmé, etc). Ici on ne traite que
// "checkout.session.completed" : on récupère les IDs produits mis dans
// les métadonnées par create-checkout-session.js, et on les enregistre
// comme "vendus" dans Cloudflare KV.
//
// Nécessite :
//   - une variable d'environnement STRIPE_WEBHOOK_SECRET (fournie par Stripe
//     quand tu crées le endpoint webhook dans son dashboard)
//   - un espace KV lié au projet Pages, avec le nom de binding "SOLD_KV"

import Stripe from 'stripe';

export async function onRequestPost(context) {
    const stripe = new Stripe(context.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16',
    });

    const signature = context.request.headers.get('stripe-signature');
    const rawBody = await context.request.text();

    let event;
    try {
        // constructEventAsync = version compatible avec l'environnement
        // Cloudflare Workers (pas de module "crypto" Node classique ici)
        event = await stripe.webhooks.constructEventAsync(
            rawBody,
            signature,
            context.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return new Response(`Signature webhook invalide : ${err.message}`, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const productIds = (session.metadata?.product_ids || '')
            .split(',')
            .map(id => id.trim())
            .filter(Boolean);

        for (const id of productIds) {
            // On stocke la date de vente, utile pour un futur suivi
            await context.env.SOLD_KV.put(`sold:${id}`, new Date().toISOString());
        }
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
    });
}

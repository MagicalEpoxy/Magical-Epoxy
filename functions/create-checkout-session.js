// functions/create-checkout-session.js
import Stripe from 'stripe';

export async function onRequestPost(context) {
    try {
        const stripe = new Stripe(context.env.STRIPE_SECRET_KEY, {
            apiVersion: '2023-10-16',
        });

        const body = await context.request.json();
        const { items, isHandDelivery } = body;

        if (!items || items.length === 0) {
            return new Response(JSON.stringify({ error: "Le panier est vide" }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Calcul du sous-total
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Transformation des articles pour Stripe
        const lineItems = items.map(item => ({
            price_data: {
                currency: 'eur',
                product_data: {
                    name: item.name,
                    images: item.image ? [new URL(item.image, context.request.url).toString()] : [],
                },
                unit_amount: Math.round(item.price * 100), // En centimes
            },
            quantity: item.quantity || 1,
        }));

        // Gestion des frais de port (si non remis en main propre et sous 40€)
        if (!isHandDelivery && subtotal < 40) {
            lineItems.push({
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: 'Frais de livraison',
                    },
                    unit_amount: 590, // 5.90 €
                },
                quantity: 1,
            });
        }

        const domainURL = new URL(context.request.url).origin;

        // On garde la liste des IDs produits (data-id) pour que le webhook
        // sache quels articles marquer comme vendus après paiement confirmé.
        const productIds = items.map(item => item.id).join(',');

        const sessionParams = {
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            allow_promotion_codes: true, // Permet d'utiliser vos codes promos Stripe
            success_url: `${domainURL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${domainURL}/index.html`,
            metadata: {
                product_ids: productIds,
            },
            // Génère et envoie automatiquement une vraie facture PDF
            // après chaque paiement (obligatoire pour une auto-entreprise).
            invoice_creation: {
                enabled: true,
            },
            // Email toujours demandé automatiquement par Stripe Checkout.
            // On demande aussi systématiquement un numéro de téléphone,
            // que ce soit une remise en main propre ou un envoi postal.
            phone_number_collection: {
                enabled: true,
            },
        };

        // Si ce n'est PAS une remise en main propre, on a en plus besoin
        // d'une adresse postale ET du point relais Mondial Relay choisi
        // par la cliente (Stripe ne propose pas de sélecteur de points
        // relais nativement, donc un champ texte).
        if (!isHandDelivery) {
            sessionParams.shipping_address_collection = {
                allowed_countries: ['FR'],
            };
            sessionParams.custom_fields = [
                {
                    key: 'point_relais',
                    label: {
                        type: 'custom',
                        custom: 'Point Relais Mondial Relay (nom + ville)',
                    },
                    type: 'text',
                    optional: false,
                },
            ];
        }

        // Création de la session Stripe avec code promo activé
        const session = await stripe.checkout.sessions.create(sessionParams);

        return new Response(JSON.stringify({ url: session.url }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

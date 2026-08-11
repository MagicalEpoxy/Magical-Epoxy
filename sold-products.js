// functions/sold-products.js
//
// Le site (index.html) appelle cette fonction à chaque chargement de page
// pour savoir quels produits sont vendus, et afficher le badge / les
// déplacer dans l'onglet "Vendus" automatiquement, sans avoir besoin de
// modifier le HTML.

export async function onRequestGet(context) {
    const list = await context.env.SOLD_KV.list({ prefix: 'sold:' });

    const soldIds = list.keys.map(key => key.name.replace('sold:', ''));

    return new Response(JSON.stringify({ soldIds }), {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store', // toujours la donnée la plus fraîche
        },
    });
}

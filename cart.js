// Système de panier local pour Mag'ical Epoxy
// Hébergement Cloudflare Pages avec fonctions Serverless Stripe

console.log('Cart.js: Script chargé');

class ShoppingCart {
    constructor() {
        console.log('Cart.js: Constructor appelé');
        this.cart = JSON.parse(localStorage.getItem('magicalEpoxyCart')) || [];
        this.isHandDelivery = false;
        this.init();
        this.closeCartModal();
    }

    init() {
        this.updateCartIcon();
        this.setupEventListeners();
        
        if (window.location.pathname.includes('success.html')) {
            this.clearCart();
        }
    }

    setupEventListeners() {
        console.log('Cart.js: setupEventListeners appelé');
        
        document.addEventListener('click', (e) => {
            const button = e.target.closest('.add-to-cart');
            if (button) {
                e.preventDefault();
                this.addToCart(button);
            }
        });

        document.addEventListener('click', (e) => {
            const cartButton = e.target.closest('#cart-toggle-btn');
            if (cartButton) {
                e.preventDefault();
                e.stopPropagation();
                this.toggleCartModal();
            }
        });

        document.addEventListener('click', (e) => {
            const closeBtn = e.target.closest('.cart-modal-close');
            if (closeBtn) {
                e.preventDefault();
                e.stopPropagation();
                this.closeCartModal();
            }
        });

        document.addEventListener('click', (e) => {
            const modal = document.getElementById('cartModal');
            if (modal && modal.style.display === 'block') {
                if (!e.target.closest('.cart-modal-content') && !e.target.closest('#cart-toggle-btn') && !e.target.closest('.add-to-cart') && !e.target.closest('.cart-item')) {
                    this.closeCartModal();
                }
            }
        });
    }

    addToCart(button) {
        const productId = button.getAttribute('data-id');
        const productName = button.getAttribute('data-name');
        const productPrice = parseFloat(button.getAttribute('data-price'));
        const productImage = button.closest('.product')?.querySelector('img')?.getAttribute('src') || '';
        
        const existingItem = this.cart.find(item => item.id === productId);

        if (existingItem) {
            this.showNotification(`⚠️ ${productName} est déjà dans votre panier (pièce unique)`);
            return;
        }
        
        this.cart.push({
            id: productId,
            name: productName,
            price: productPrice,
            image: productImage,
            quantity: 1
        });

        this.saveCart();
        this.updateCartIcon();
        this.renderCartModal();
        this.showNotification(`✨ ${productName} ajouté au panier !`);
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartIcon();
        this.renderCartModal();
        
        const modal = document.getElementById('cartModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartIcon();
    }

    saveCart() {
        localStorage.setItem('magicalEpoxyCart', JSON.stringify(this.cart));
    }

    getSubtotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    calculateShipping(subtotal) {
        if (this.isHandDelivery) return 0;
        return subtotal >= 40 ? 0 : 5.90;
    }

    getFinalTotal() {
        let subtotal = this.getSubtotal();
        let shipping = this.calculateShipping(subtotal);
        return subtotal + shipping;
    }

    toggleHandDelivery(checkbox) {
        this.isHandDelivery = checkbox.checked;
        this.renderCartModal();
    }

    getCartCount() {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
    }

    updateCartIcon() {
        const cartCount = this.getCartCount();
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = cartCount;
        }
        const fullButton = document.getElementById('cart-toggle-btn');
        if (fullButton) {
            fullButton.innerHTML = `🛒 PANIER (${cartCount})`;
        }
    }

    toggleCartModal() {
        const modal = document.getElementById('cartModal');
        if (modal) {
            if (modal.style.display === 'block') {
                this.closeCartModal();
            } else {
                this.openCartModal();
            }
        }
    }

    openCartModal() {
        const modal = document.getElementById('cartModal');
        if (modal) {
            modal.style.display = 'block';
            this.renderCartModal();
        }
    }

    closeCartModal() {
        const modal = document.getElementById('cartModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    renderCartModal() {
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        
        if (!cartItems || !cartTotal) return;

        if (this.cart.length === 0) {
            cartItems.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7); margin-top: 30px;">Votre panier est vide</p>';
            cartTotal.textContent = '0,00 €';
        } else {
            const subtotal = this.getSubtotal();
            const shipping = this.calculateShipping(subtotal);
            const finalTotal = this.getFinalTotal();

            cartItems.innerHTML = `
                <div>
                    ${this.cart.map(item => `
                        <div class="cart-item" style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,105,180,0.2);">
                            <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; margin-right: 12px;">
                            <div style="flex: 1;">
                                <h4 style="color: #ff9ec6; margin: 0 0 3px 0; font-size: 0.95rem;">${item.name}</h4>
                                <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 0.85rem;">${item.price.toFixed(2)} €</p>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="color: rgba(255,255,255,0.6); font-size: 0.75rem; font-style: italic;">Unique</span>
                                <button onclick="event.stopPropagation(); cart.removeFromCart('${item.id}')" style="background: rgba(255,0,0,0.3); color: white; border: none; width: 25px; height: 25px; border-radius: 50%; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; justify-content: center;">×</button>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- OPTIONS : Rappel Code Promo & Remise en main propre -->
                <div style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,105,180,0.15);">
                    <div style="margin-bottom: 12px; font-size: 0.85rem; color: #ff9ec6; background: rgba(255,105,180,0.1); padding: 8px 12px; border-radius: 8px; text-align: center;">
                        🎁 Code promo <strong>BIENVENUE10</strong> (-10%) à saisir sur la page de paiement Stripe !
                    </div>

                    <div>
                        <label style="font-size: 0.85rem; color: white; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="hand-delivery-checkbox" ${this.isHandDelivery ? 'checked' : ''} onchange="cart.toggleHandDelivery(this)" style="accent-color: #ff69b4; width: 16px; height: 16px;">
                            Remise en main propre (Frais de port offerts)
                        </label>
                    </div>

                    ${!this.isHandDelivery ? `
                    <div style="margin-top: 10px; font-size: 0.8rem; color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.03); padding: 8px 10px; border-radius: 8px;">
                        📦 Livraison Mondial Relay : trouvez votre point relais sur <strong style="color:#ff9ec6;">mondialrelay.fr</strong> avant de valider, vous devrez l'indiquer à l'étape suivante.
                    </div>
                    ` : ''}
                </div>

                <!-- DÉTAILS DES PRIX -->
                <div style="margin-top: 15px; font-size: 0.9rem; color: rgba(255,255,255,0.8);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Sous-total :</span>
                        <span>${subtotal.toFixed(2)} €</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Livraison :</span>
                        <span>${shipping === 0 ? 'Gratuite' : shipping.toFixed(2) + ' €'}</span>
                    </div>
                </div>
            `;
            
            cartTotal.textContent = finalTotal.toFixed(2) + ' €';
        }
    }

    async checkout() {
        if (this.cart.length === 0) {
            this.showNotification('Votre panier est vide !');
            return;
        }
        
        this.showNotification('🔄 Préparation du paiement sécurisé...');

        try {
            const response = await fetch('/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: this.cart,
                    isHandDelivery: this.isHandDelivery || false
                })
            });

            const textResponse = await response.text();
            
            if (!textResponse) {
                throw new Error("Le serveur Cloudflare a renvoyé une réponse vide.");
            }

            const data = JSON.parse(textResponse);

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'Erreur lors de la création de la session de paiement.');
            }
        } catch (error) {
            console.error('Erreur Checkout:', error);
            this.showNotification('❌ ' + error.message);
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #ff69b4;
            color: black;
            padding: 15px 25px;
            border-radius: 30px;
            font-weight: bold;
            z-index: 2000;
            box-shadow: 0 4px 15px rgba(255,105,180,0.4);
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 2500);
    }
}

// Fonction de tri par prix
function sortProductsByPrice(order) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    const products = Array.from(grid.getElementsByClassName('product'));

    products.sort((a, b) => {
        const priceA = parseFloat(a.querySelector('[itemprop="price"]').getAttribute('content'));
        const priceB = parseFloat(b.querySelector('[itemprop="price"]').getAttribute('content'));

        if (order === 'asc') return priceA - priceB;
        if (order === 'desc') return priceB - priceA;
        return 0;
    });

    products.forEach(product => grid.appendChild(product));
}

// Masquer automatiquement les articles vendus
function hideSoldProducts() {
    const products = document.querySelectorAll('.product');
    products.forEach(product => {
        if (product.getAttribute('data-sold') === 'true') {
            product.classList.add('hidden');
        }
    });
}

let cart;
document.addEventListener('DOMContentLoaded', () => {
    cart = new ShoppingCart();
    hideSoldProducts();
});

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 1; }
    }
`;
document.head.appendChild(style);
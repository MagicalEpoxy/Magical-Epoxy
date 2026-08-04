// PANIER SIMPLE ET FONCTIONNEL
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let total = parseFloat(localStorage.getItem("total")) || 0;

// Fonction pour afficher une notification
function afficherNotif(message) {
    const notif = document.createElement("div");
    notif.textContent = message;
    notif.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #ff69b4;
        color: black;
        padding: 15px 20px;
        border-radius: 25px;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.remove();
    }, 3000);
}

// Mettre à jour le compteur du panier
function updateCartCount() {
    const cartCountEl = document.getElementById("cart-count");
    if (cartCountEl) {
        cartCountEl.textContent = cart.length;
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    localStorage.setItem("total", total.toFixed(2));
}

// Afficher le panier
function showCart() {
    // Supprimer l'ancienne fenêtre si elle existe
    const oldModal = document.getElementById("cart-modal");
    if (oldModal) oldModal.remove();

    let cartHTML = `
        <div id="cart-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div style="
                background: #1a1a1a;
                border: 2px solid #ff69b4;
                border-radius: 20px;
                padding: 30px;
                max-width: 500px;
                width: 90%;
                color: white;
                text-align: center;
            ">
                <h2 style="color: #ff69b4; margin-bottom: 20px;">🛒 VOTRE PANIER</h2>
    `;

    if (cart.length === 0) {
        cartHTML += `<p style="margin: 20px 0;">Votre panier est vide 😢</p>`;
    } else {
        cartHTML += `<div style="text-align: left; margin: 20px 0;">`;
        cart.forEach((item, index) => {
            cartHTML += `
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px;
                    margin-bottom: 10px;
                    background: rgba(255,105,180,0.1);
                    border-radius: 10px;
                ">
                    <div>
                        <strong>${item.name}</strong><br>
                        <small style="color: #ffcae5;">${item.price.toFixed(2)}€</small>
                    </div>
                    <button onclick="removeFromCart(${index})" style="
                        background: #ff4444;
                        color: white;
                        border: none;
                        padding: 5px 10px;
                        border-radius: 5px;
                        cursor: pointer;
                    ">❌</button>
                </div>
            `;
        });
        cartHTML += `</div>`;
        
        cartHTML += `
            <div style="
                border-top: 2px solid #ff69b4;
                padding-top: 20px;
                margin: 20px 0;
            ">
                <strong style="font-size: 1.2rem;">Total: ${total.toFixed(2)}€</strong>
            </div>
            <div style="display: flex; gap: 10px; margin: 20px 0;">
                <button onclick="clearCart()" style="
                    background: #ff4444;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 25px;
                    cursor: pointer;
                    flex: 1;
                ">Vider</button>
                <button onclick="checkout()" style="
                    background: #ff69b4;
                    color: black;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: bold;
                    flex: 1;
                ">Commander</button>
            </div>
        `;
    }

    cartHTML += `
        <button onclick="closeCart()" style="
            background: transparent;
            color: #ff69b4;
            border: 2px solid #ff69b4;
            padding: 10px 20px;
            border-radius: 25px;
            cursor: pointer;
            margin-top: 20px;
            width: 100%;
        ">Fermer</button>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', cartHTML);
}

// Fonctions globales
window.closeCart = function() {
    const modal = document.getElementById("cart-modal");
    if (modal) modal.remove();
};

window.removeFromCart = function(index) {
    const item = cart[index];
    total -= item.price;
    cart.splice(index, 1);
    updateCartCount();
    showCart();
    afficherNotif("✨ Article retiré");
};

window.clearCart = function() {
    cart = [];
    total = 0;
    updateCartCount();
    showCart();
    afficherNotif("🗑️ Panier vidé !");
};

window.checkout = function() {
    if (cart.length === 0) {
        afficherNotif("⚠️ Panier vide !");
        return;
    }
    
    afficherNotif("🎉 Commande simulée !");
    setTimeout(() => {
        alert(`Commande de ${total.toFixed(2)}€\n\n${cart.map(item => `- ${item.name}: ${item.price.toFixed(2)}€`).join('\n')}`);
        clearCart();
    }, 1000);
};

// Initialisation quand le DOM est chargé
document.addEventListener("DOMContentLoaded", function() {
    
    // Ajout au panier
    document.querySelectorAll(".add-to-cart").forEach(button => {
        button.addEventListener("click", function(e) {
            const product = this.closest(".product");
            const name = product.querySelector("h2").textContent.trim();
            const priceText = product.querySelector(".price").textContent.trim();
            const id = this.dataset.id;
            
            const price = parseFloat(priceText.replace(',', '.').replace(/[^\d.]/g, '')) || 0;

            const exists = cart.find(item => item.id === id);
            if (exists) {
                afficherNotif("⚠️ Déjà dans le panier !");
            } else {
                cart.push({ id, name, price });
                total += price;
                updateCartCount();
                afficherNotif("✨ Ajouté au panier !");
            }
        });
    });

    // Ouvrir le panier
    const cartToggle = document.getElementById("cart-toggle");
    if (cartToggle) {
        cartToggle.addEventListener("click", function(e) {
            e.preventDefault();
            alert("Clic détecté ! Panier: " + JSON.stringify(cart, null, 2));
            showCart();
        });
    } else {
        alert("Bouton panier non trouvé !");
    }

    // Fermer en cliquant à l'extérieur
    document.addEventListener("click", function(e) {
        const modal = document.getElementById("cart-modal");
        if (modal && e.target === modal) {
            closeCart();
        }
    });

    // Initialiser le compteur
    updateCartCount();

    // Générer les étoiles
    const starContainer = document.getElementById('star-container');
    if (starContainer) {
        for (let i = 0; i < 100; i++) {
            const s = document.createElement("div");
            s.className = "star";
            const size = Math.random() * 2 + 1;
            s.style.width = size + "px";
            s.style.height = size + "px";
            s.style.top = Math.random() * 100 + "%";
            s.style.left = Math.random() * 100 + "%";
            s.style.background = ["#ffffff", "#ffcae5", "#ff69b4"][Math.floor(Math.random() * 3)];
            s.style.animation = `blink ${Math.random() * 5 + 3}s infinite ease-in-out`;
            starContainer.appendChild(s);
        }
    }
});

// Filtrage des produits
window.filterObjects = function(category) {
    const products = document.querySelectorAll('.product');
    const buttons = document.querySelectorAll('.filter-btn');
    
    buttons.forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    products.forEach(product => {
        if (category === 'all' || product.classList.contains(category)) {
            product.classList.remove('hidden');
        } else {
            product.classList.add('hidden');
        }
    });
};



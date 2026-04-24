/**
 * SiLu Naturals - Paystack Integration
 * Clean version for GitHub Pages
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        PAYSTACK_PUBLIC_KEY: 'pk_test_2e1695b313b66adacbee133ea7ab3a7168fa319c',
        API_BASE_URL: 'https://your-project.vercel.app/api',
        DELIVERY_FEE: 6000,

        PACKS: {
            silver: { id: 'silver', name: 'Silver Pack', price: 60000, priceDisplay: 'R600', includes: ['3x Hair Growth Oil','3x Hair Growth Serum','Distributor account access','Earn 100% profit on sales','Level 1 commission (10%)'], image: 'images/pack-silver.png' },
            gold: { id: 'gold', name: 'Gold Pack', price: 80000, priceDisplay: 'R800', includes: ['4x Hair Growth Oil','4x Hair Growth Serum','Distributor account access','Earn 100% profit on sales','Level 1 commission (10%)'], image: 'images/pack-gold.png', popular: true },
            platinum: { id: 'platinum', name: 'Platinum Pack', price: 100000, priceDisplay: 'R1000', includes: ['5x Hair Growth Oil','5x Hair Growth Serum','Distributor account access','Earn 100% profit on sales','Level 1 commission (10%)'], image: 'images/pack-platinum.png' }
        },

        PRODUCTS: {
            'hair-growth-oil': { id: 'hair-growth-oil', name: 'Hair Growth Oil', price: 20000, priceDisplay: 'R200', image: 'images/hair-growth-oil.jpg', inStock: true },
            'hair-growth-serum': { id: 'hair-growth-serum', name: 'Hair Growth Serum', price: 20000, priceDisplay: 'R200', image: 'images/hair-growth-serum.jpg', inStock: true }
        },

        RANKS: [
            { id: 0, name: 'Member', referralsRequired: 5, commissionPct: 10, levelsEarned: [1], monthlyMaintenance: 60000, potentialEarnings: 'R300 - R500', rankBonus: 0 },
            { id: 1, name: 'Team Player', referralsRequired: 10, commissionPct: 10, levelsEarned: [1,2,3], monthlyMaintenance: 60000, potentialEarnings: 'R600 - R1,000', rankBonus: 100000 },
            { id: 2, name: 'Team Leader', referralsRequired: 30, teamRequirements: '2 Team Players', commissionPct: 12, levelsEarned: [1,2,3], monthlyMaintenance: 80000, potentialEarnings: 'R2,160 - R3,600', rankBonus: 150000 },
            { id: 3, name: 'Manager', referralsRequired: 100, teamRequirements: '2 TPs + 2 TLs', commissionPct: 14, levelsEarned: [1,2,3], monthlyMaintenance: 80000, potentialEarnings: 'R8,400 - R14,000', rankBonus: 200000 },
            { id: 4, name: 'Director', referralsRequired: 500, teamRequirements: '2 TLs + 1 Mgr', commissionPct: 16, levelsEarned: [1,2,3], monthlyMaintenance: 100000, potentialEarnings: 'R48,000 - R80,000', rankBonus: 500000 },
            { id: 5, name: 'Chairperson', referralsRequired: 800, teamRequirements: '2 Mgrs + 1 Dir', commissionPct: 18, levelsEarned: [1,2,3,4], monthlyMaintenance: 100000, potentialEarnings: 'R480,000 - R800,000', rankBonus: 1000000 }
        ]
    };

    // State
    const State = {
        cart: JSON.parse(localStorage.getItem('silu_cart') || '[]'),
        user: JSON.parse(localStorage.getItem('silu_user') || 'null'),

        saveCart() {
            localStorage.setItem('silu_cart', JSON.stringify(this.cart));
            this.updateCartUI();
        },

        saveUser(userData) {
            this.user = userData;
            localStorage.setItem('silu_user', JSON.stringify(userData));
            this.updateAuthUI();
        },

        logout() {
            this.user = null;
            localStorage.removeItem('silu_user');
            this.updateAuthUI();
        },

        updateCartUI() {
            const cartCount = this.cart.reduce((sum, item) => sum + item.qty, 0);
            let cartBadge = document.getElementById('silu-cart-badge');
            if (!cartBadge) {
                const cartLink = document.querySelector('[data-silu-action="cart"]');
                if (cartLink) {
                    cartBadge = document.createElement('span');
                    cartBadge.id = 'silu-cart-badge';
                    cartBadge.style.cssText = 'background:#ff6b6b;color:white;border-radius:50%;padding:2px 8px;font-size:12px;margin-left:5px;font-weight:bold;';
                    cartLink.appendChild(cartBadge);
                }
            }
            if (cartBadge) {
                cartBadge.textContent = cartCount;
                cartBadge.style.display = cartCount > 0 ? 'inline-block' : 'none';
            }
        },

        updateAuthUI() {
            const authContainer = document.getElementById('silu-auth-container');
            if (authContainer) {
                if (this.user) {
                    authContainer.innerHTML = '<span style="margin-right:15px;color:#fff;">Hello, ' + this.user.name + '</span><a href="#" onclick="SiluApp.showDashboard()" style="color:#fff;margin-right:15px;">Dashboard</a><a href="#" onclick="SiluApp.logout()" style="color:#fff;">Logout</a>';
                } else {
                    authContainer.innerHTML = '<a href="#" onclick="SiluApp.showLoginModal()" style="color:#fff;margin-right:15px;">Login</a><a href="#" onclick="SiluApp.showPackSelection()" style="color:#000;background:#FFD700;padding:8px 16px;border-radius:4px;font-weight:bold;">Join</a>';
                }
            }
        }
    };

    // Paystack
    const PaystackAPI = {
        initializePayment(email, amount, metadata) {
            metadata = metadata || {};
            return new Promise((resolve, reject) => {
                if (!window.PaystackPop) {
                    reject({ success: false, message: 'Paystack not loaded' });
                    return;
                }
                const handler = PaystackPop.setup({
                    key: CONFIG.PAYSTACK_PUBLIC_KEY,
                    email: email,
                    amount: amount,
                    currency: 'ZAR',
                    ref: 'SILU_' + Date.now() + '_' + Math.floor(Math.random() * 1000000),
                    metadata: {
                        custom_fields: [
                            { display_name: "Customer Name", variable_name: "customer_name", value: metadata.name || email },
                            { display_name: "Order Type", variable_name: "order_type", value: metadata.orderType || 'retail' },
                            { display_name: "PEP Store", variable_name: "pep_store", value: metadata.pepStore || 'N/A' }
                        ]
                    },
                    callback: function(response) {
                        resolve({ success: true, reference: response.reference });
                    },
                    onClose: function() {
                        reject({ success: false, message: 'Payment window closed' });
                    }
                });
                handler.openIframe();
            });
        }
    };

    // Cart
    const Cart = {
        add(productId, qty) {
            qty = qty || 1;
            const product = CONFIG.PRODUCTS[productId];
            if (!product || !product.inStock) { alert('Product not available'); return; }
            const existing = State.cart.find(item => item.id === productId);
            if (existing) { existing.qty += qty; }
            else { State.cart.push({ id: productId, name: product.name, price: product.price, priceDisplay: product.priceDisplay, qty: qty, image: product.image, type: 'product' }); }
            State.saveCart();
            SiluApp.showToast(product.name + ' added to cart');
        },

        addPack(packId) {
            const pack = CONFIG.PACKS[packId];
            if (!pack) return;
            State.cart = [{ id: packId, name: pack.name, price: pack.price, priceDisplay: pack.priceDisplay, qty: 1, image: pack.image, type: 'pack', includes: pack.includes }];
            State.saveCart();
            SiluApp.showCartModal();
        },

        remove(productId) {
            State.cart = State.cart.filter(item => item.id !== productId);
            State.saveCart();
        },

        updateQty(productId, qty) {
            const item = State.cart.find(item => item.id === productId);
            if (item) { item.qty = Math.max(1, qty); State.saveCart(); }
        },

        getSubtotal() {
            return State.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        },

        getDeliveryFee() {
            return State.cart.length > 0 ? CONFIG.DELIVERY_FEE : 0;
        },

        getTotal() {
            return this.getSubtotal() + this.getDeliveryFee();
        },

        getTotalDisplay() {
            return 'R' + (this.getTotal() / 100).toFixed(2);
        },

        clear() {
            State.cart = [];
            State.saveCart();
        }
    };

    // UI
    const UI = {
        createModal(title, content, width) {
            width = width || '500px';
            const existing = document.getElementById('silu-modal');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'silu-modal';
            modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;font-family:inherit;';

            modal.innerHTML = '<div style="background:white;border-radius:12px;max-width:' + width + ';width:90%;max-height:90vh;overflow-y:auto;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.3);"><div style="padding:20px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;background:#000;color:#fff;"><h3 style="margin:0;color:#FFD700;">' + title + '</h3><button onclick="UI.closeModal()" style="background:none;border:none;font-size:24px;cursor:pointer;color:#FFD700;">&times;</button></div><div style="padding:20px;">' + content + '</div></div>';

            modal.addEventListener('click', function(e) { if (e.target === modal) UI.closeModal(); });
            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';
        },

        closeModal() {
            const modal = document.getElementById('silu-modal');
            if (modal) { modal.remove(); document.body.style.overflow = ''; }
        }
    };

    // Main App
    const SiluApp = {
        init: function() {
            console.log('[SiLu] Initializing...');
            this.loadPaystackScript();
            this.wireButtons();
            this.addAuthContainer();
            State.updateCartUI();
            State.updateAuthUI();
            console.log('[SiLu] Initialized successfully');
            console.log('[SiLu] Paystack key:', CONFIG.PAYSTACK_PUBLIC_KEY.substring(0, 20) + '...');
        },

        loadPaystackScript: function() {
            if (window.PaystackPop) { console.log('[SiLu] Paystack already loaded'); return; }
            const script = document.createElement('script');
            script.src = 'https://js.paystack.co/v1/inline.js';
            script.async = true;
            script.onload = function() { console.log('[SiLu] Paystack loaded'); };
            script.onerror = function() { console.error('[SiLu] Failed to load Paystack'); };
            document.head.appendChild(script);
        },

        wireButtons: function() {
            document.addEventListener('click', function(e) {
                const btn = e.target.closest('[data-silu-product]');
                if (btn) { e.preventDefault(); Cart.add(btn.dataset.siluProduct); SiluApp.showCartModal(); }

                const packBtn = e.target.closest('[data-silu-pack]');
                if (packBtn) { e.preventDefault(); Cart.addPack(packBtn.dataset.siluPack); }

                const cartBtn = e.target.closest('[data-silu-action="cart"]');
                if (cartBtn) { e.preventDefault(); SiluApp.showCartModal(); }

                const joinBtn = e.target.closest('[data-silu-action="join"]');
                if (joinBtn) { e.preventDefault(); SiluApp.showPackSelection(); }
            });
        },

        addAuthContainer: function() {
            const nav = document.querySelector('nav, header, .navbar, .menu, .nav-links');
            if (nav && !document.getElementById('silu-auth-container')) {
                const authDiv = document.createElement('div');
                authDiv.id = 'silu-auth-container';
                authDiv.style.cssText = 'display:inline-block;margin-left:20px;';
                nav.appendChild(authDiv);
                console.log('[SiLu] Auth container added');
            }
        },

        showPackSelection: function() {
            let packsHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;margin-bottom:20px;">';

            Object.keys(CONFIG.PACKS).forEach(function(key) {
                const pack = CONFIG.PACKS[key];
                const popularBadge = pack.popular ? '<div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#000;color:#FFD700;padding:5px 15px;font-size:12px;font-weight:bold;letter-spacing:1px;">MOST POPULAR</div>' : '';
                const borderStyle = pack.popular ? 'border:3px solid #FFD700;' : 'border:1px solid #ddd;';
                const icon = pack.id === 'silver' ? '🥈' : pack.id === 'gold' ? '🥇' : '💎';

                packsHTML += '<div style="position:relative;background:#fff;padding:30px 20px;border-radius:12px;' + borderStyle + 'text-align:center;">' + popularBadge + '<div style="font-size:40px;margin-bottom:10px;">' + icon + '</div><h3 style="margin:0 0 5px;font-size:24px;">' + pack.name.replace(' Pack','') + '</h3><div style="font-size:32px;font-weight:bold;margin-bottom:20px;">' + pack.priceDisplay + '</div><ul style="list-style:none;padding:0;margin:0 0 25px;text-align:left;">' + pack.includes.map(function(item) { return '<li style="padding:8px 0;border-bottom:1px solid #f0f0f0;">✓ ' + item + '</li>'; }).join('') + '</ul><button onclick="SiluApp.showPackCheckout('' + pack.id + '')" style="width:100%;padding:15px;background:#000;color:#FFD700;border:none;border-radius:6px;font-size:16px;font-weight:bold;cursor:pointer;text-transform:uppercase;letter-spacing:1px;">Register - ' + pack.priceDisplay + '</button></div>';
            });

            packsHTML += '</div>';
            UI.createModal('Choose Your Registration Pack', packsHTML, '900px');
        },

        showPackCheckout: function(packId) {
            const pack = CONFIG.PACKS[packId];
            const totalWithDelivery = pack.price + CONFIG.DELIVERY_FEE;

            const html = '<form id="silu-pack-form" onsubmit="SiluApp.processPackRegistration(event, '' + packId + '')"><div style="background:#f9f9f9;padding:15px;border-radius:8px;margin-bottom:20px;"><h4 style="margin:0 0 10px;">' + pack.name + '</h4><div style="display:flex;justify-content:space-between;padding:5px 0;"><span>Pack Price:</span><span>' + pack.priceDisplay + '</span></div><div style="display:flex;justify-content:space-between;padding:5px 0;"><span>Delivery Fee:</span><span>R60.00</span></div><div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #333;font-weight:bold;font-size:18px;margin-top:10px;"><span>Total:</span><span>R' + (totalWithDelivery/100).toFixed(2) + '</span></div></div><div style="margin-bottom:15px;"><label style="display:block;margin-bottom:5px;font-weight:bold;">Full Name *</label><input type="text" name="name" required style="width:100%;padding:12px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;"></div><div style="margin-bottom:15px;"><label style="display:block;margin-bottom:5px;font-weight:bold;">Email *</label><input type="email" name="email" required style="width:100%;padding:12px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;"></div><div style="margin-bottom:15px;"><label style="display:block;margin-bottom:5px;font-weight:bold;">Phone Number *</label><input type="tel" name="phone" required placeholder="+27..." style="width:100%;padding:12px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;"></div><div style="margin-bottom:15px;"><label style="display:block;margin-bottom:5px;font-weight:bold;">ID Number *</label><input type="text" name="idNumber" required placeholder="SA ID or Passport" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;"></div><div style="margin-bottom:15px;"><label style="display:block;margin-bottom:5px;font-weight:bold;">PEP Store Number for Delivery *</label><input type="text" name="pepStore" required placeholder="Enter your PEP store number (e.g., PEP12345)" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;"><small style="color:#666;">Your pack will be delivered to this PEP store for pickup.</small></div><div style="margin-bottom:20px;"><label style="display:block;margin-bottom:5px;font-weight:bold;">Sponsor Code (Optional)</label><input type="text" name="sponsorCode" placeholder="Enter if you were referred by someone" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;"></div><div style="margin-bottom:20px;"><label style="display:block;margin-bottom:5px;font-weight:bold;">Create Password *</label><input type="password" name="password" required minlength="6" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;"></div><button type="submit" style="width:100%;padding:15px;background:#000;color:#FFD700;border:none;border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer;">Pay ' + pack.priceDisplay + ' + R60 Delivery</button><p style="text-align:center;margin-top:10px;color:#666;font-size:12px;">Secured by Paystack</p></form>';

            UI.createModal('Complete Registration', html);
        },

        processPackRegistration: function(e, packId) {
            e.preventDefault();
            const form = e.target;
            const formData = new FormData(form);
            const pack = CONFIG.PACKS[packId];
            const totalAmount = pack.price + CONFIG.DELIVERY_FEE;

            const btn = form.querySelector('button[type="submit"]');
            btn.textContent = 'Processing...';
            btn.disabled = true;

            PaystackAPI.initializePayment(
                formData.get('email'),
                totalAmount,
                { name: formData.get('name'), orderType: 'registration_pack', pepStore: formData.get('pepStore'), packId: packId }
            ).then(function(payment) {
                SiluApp.showToast('Registration successful! Reference: ' + payment.reference);
                UI.closeModal();
            }).catch(function(err) {
                SiluApp.showToast('Payment failed: ' + (err.message || 'Unknown error'));
                btn.textContent = 'Pay ' + pack.priceDisplay + ' + R60 Delivery';
                btn.disabled = false;
            });
        },

        showCartModal: function() {
            if (State.cart.length === 0) {
                UI.createModal('Shopping Cart', '<p style="text-align:center;padding:20px;">Your cart is empty.</p>');
                return;
            }

            let cartHTML = '<div style="margin-bottom:20px;">';
            State.cart.forEach(function(item) {
                const isPack = item.type === 'pack';
                const includesList = isPack ? '<ul style="margin:5px 0 0 20px;font-size:12px;color:#666;">' + item.includes.map(function(i) { return '<li>' + i + '</li>'; }).join('') + '</ul>' : '';

                cartHTML += '<div style="display:flex;align-items:center;padding:15px 0;border-bottom:1px solid #eee;"><img src="' + item.image + '" style="width:70px;height:70px;object-fit:cover;border-radius:8px;margin-right:15px;"><div style="flex:1;"><div style="font-weight:bold;">' + item.name + '</div><div style="color:#666;">' + item.priceDisplay + ' each</div>' + includesList + '</div><div style="display:flex;align-items:center;gap:10px;">' + (!isPack ? '<button onclick="Cart.updateQty('' + item.id + '', ' + (item.qty - 1) + ')" style="width:32px;height:32px;border:1px solid #ddd;background:white;border-radius:4px;cursor:pointer;">-</button><span style="min-width:20px;text-align:center;font-weight:bold;">' + item.qty + '</span><button onclick="Cart.updateQty('' + item.id + '', ' + (item.qty + 1) + ')" style="width:32px;height:32px;border:1px solid #ddd;background:white;border-radius:4px;cursor:pointer;">+</button>' : '<span style="font-weight:bold;">x1</span>') + '<button onclick="Cart.remove('' + item.id + '');SiluApp.showCartModal();" style="background:none;border:none;color:#ff6b6b;cursor:pointer;margin-left:10px;font-size:18px;">🗑</button></div></div>';
            });
            cartHTML += '</div>';

            cartHTML += '<div style="background:#f9f9f9;padding:15px;border-radius:8px;margin-bottom:20px;"><div style="display:flex;justify-content:space-between;padding:8px 0;"><span>Subtotal:</span><span>R' + (Cart.getSubtotal()/100).toFixed(2) + '</span></div><div style="display:flex;justify-content:space-between;padding:8px 0;"><span>Delivery (PEP Store):</span><span>R60.00</span></div><div style="display:flex;justify-content:space-between;padding:12px 0;border-top:2px solid #333;font-size:20px;font-weight:bold;margin-top:10px;"><span>Total:</span><span>' + Cart.getTotalDisplay() + '</span></div></div><button onclick="SiluApp.showCheckoutModal()" style="width:100%;padding:16px;background:#000;color:#FFD700;border:none;border-radius:8px;font-size:18px;font-weight:bold;cursor:pointer;text-transform:uppercase;letter-spacing:1px;">Proceed to Checkout</button>';

            UI.createModal('Shopping Cart', cartHTML);
        },

        showCheckoutModal: function() {
            const html = '<form id="silu-checkout-form" onsubmit="SiluApp.processCheckout(event)"><div style="margin-bottom:15px;"><label style="display:block;margin-bottom:5px;font-weight:bold;">Full Name *</label><input type="text" name="name" required style="width:100%;padding:12px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;"></div><div style="margin-bottom:15px;"><label style="display:block;margin-bottom:5px;font-weight:bold;">Email *</label><input type="email" name="email" required style="width:100%;padding:12px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;"></div><div style="margin-bottom:15px;"><label style="display:block;margin-bottom:5px;font-weight:bold;">Phone Number *</label><input type="tel" name="phone" required placeholder="+27..." style="width:100%;padding:12px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;"></div><div style="margin-bottom:15px;"><label style="display:block;margin-bottom:5px;font-weight:bold;">PEP Store Number for Delivery *</label><input type="text" name="pepStore" required placeholder="Enter your PEP store number (e.g., PEP12345)" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;"><small style="color:#666;">Your order will be delivered to this PEP store.</small></div><div style="margin-bottom:20px;padding:15px;background:#f9f9f9;border-radius:8px;"><div style="display:flex;justify-content:space-between;padding:5px 0;"><span>Subtotal:</span><span>R' + (Cart.getSubtotal()/100).toFixed(2) + '</span></div><div style="display:flex;justify-content:space-between;padding:5px 0;"><span>Delivery:</span><span>R60.00</span></div><div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #333;font-size:18px;font-weight:bold;margin-top:10px;"><span>Total:</span><span>' + Cart.getTotalDisplay() + '</span></div></div><button type="submit" style="width:100%;padding:16px;background:#000;color:#FFD700;border:none;border-radius:8px;font-size:18px;font-weight:bold;cursor:pointer;">Pay with Paystack</button><p style="text-align:center;margin-top:10px;color:#666;font-size:12px;">Secured by Paystack - Cards, EFT & Mobile Money accepted</p></form>';

            UI.createModal('Checkout', html);
        },

        processCheckout: function(e) {
            e.preventDefault();
            const form = e.target;
            const formData = new FormData(form);

            const btn = form.querySelector('button[type="submit"]');
            btn.textContent = 'Processing...';
            btn.disabled = true;

            PaystackAPI.initializePayment(
                formData.get('email'),
                Cart.getTotal(),
                { name: formData.get('name'), orderType: 'retail', pepStore: formData.get('pepStore') }
            ).then(function(payment) {
                SiluApp.showToast('Payment successful! Reference: ' + payment.reference);
                Cart.clear();
                UI.closeModal();
            }).catch(function(err) {
                SiluApp.showToast('Payment failed: ' + (err.message || 'Unknown error'));
                btn.textContent = 'Pay with Paystack';
                btn.disabled = false;
            });
        },

        showMaintenanceTab: function() {
            if (!State.user || State.user.role !== 'distributor') {
                this.showToast('Please login as a distributor');
                return;
            }

            const userRank = CONFIG.RANKS.find(function(r) { return r.id === (State.user.rankLevel || 0); }) || CONFIG.RANKS[0];
            const lastPayment = State.user.lastMaintenancePayment ? new Date(State.user.lastMaintenancePayment) : null;
            const daysSince = lastPayment ? Math.floor((new Date() - lastPayment) / (1000 * 60 * 60 * 24)) : 999;
            const isDue = daysSince >= 30;

            const html = '<div style="max-width:500px;margin:0 auto;"><div style="background:' + (isDue ? '#fff3cd' : '#d4edda') + ';padding:20px;border-radius:10px;margin-bottom:20px;border:2px solid ' + (isDue ? '#ffc107' : '#28a745') + ';"><h3 style="margin:0 0 10px;color:' + (isDue ? '#856404' : '#155724') + ';">' + (isDue ? '⚠️ Maintenance Payment Due' : '✓ Maintenance Status') + '</h3><p style="margin:0;color:#333;">' + (isDue ? 'Your monthly maintenance of <strong>R' + (userRank.monthlyMaintenance/100).toFixed(0) + '</strong> is now due.' : 'Your maintenance is up to date. Next payment due in ' + (30 - daysSince) + ' days.') + '</p></div><div style="background:#f9f9f9;padding:20px;border-radius:10px;margin-bottom:20px;"><div style="display:flex;justify-content:space-between;margin-bottom:15px;"><span>Current Rank:</span><strong>' + userRank.name + '</strong></div><div style="display:flex;justify-content:space-between;margin-bottom:15px;"><span>Monthly Maintenance:</span><strong>R' + (userRank.monthlyMaintenance/100).toFixed(0) + '</strong></div><div style="display:flex;justify-content:space-between;margin-bottom:15px;"><span>Last Payment:</span><strong>' + (lastPayment ? lastPayment.toLocaleDateString('en-ZA') : 'Never') + '</strong></div><div style="display:flex;justify-content:space-between;"><span>Days Since Last Payment:</span><strong>' + (daysSince > 900 ? 'N/A' : daysSince) + '</strong></div></div><button onclick="SiluApp.payMaintenance()" style="width:100%;padding:16px;background:#000;color:#FFD700;border:none;border-radius:8px;font-size:18px;font-weight:bold;cursor:pointer;margin-bottom:10px;">Pay Maintenance - R' + (userRank.monthlyMaintenance/100).toFixed(0) + '</button></div>';

            UI.createModal('Monthly Maintenance', html, '600px');
        },

        payMaintenance: function() {
            if (!State.user) { this.showLoginModal(); return; }

            const userRank = CONFIG.RANKS.find(function(r) { return r.id === (State.user.rankLevel || 0); });
            if (!userRank) return;

            PaystackAPI.initializePayment(
                State.user.email,
                userRank.monthlyMaintenance,
                { name: State.user.name, orderType: 'maintenance', rank: userRank.name }
            ).then(function(payment) {
                State.user.lastMaintenancePayment = new Date().toISOString();
                State.saveUser(State.user);
                UI.closeModal();
                SiluApp.showToast('Maintenance paid! Your ' + userRank.name + ' status is active.');
            }).catch(function(err) {
                SiluApp.showToast('Payment failed: ' + (err.message || 'Unknown error'));
            });
        },

        showDashboard: function() {
            if (!State.user) { this.showLoginModal(); return; }

            const userRank = CONFIG.RANKS.find(function(r) { return r.id === (State.user.rankLevel || 0); }) || CONFIG.RANKS[0];
            const nextRank = CONFIG.RANKS.find(function(r) { return r.id === userRank.id + 1; });

            const lastPayment = State.user.lastMaintenancePayment ? new Date(State.user.lastMaintenancePayment) : null;
            const daysLeft = lastPayment ? Math.max(0, 30 - Math.floor((new Date() - lastPayment) / (1000 * 60 * 60 * 24))) : 0;
            const isDue = daysLeft <= 0;

            const html = '<div style="max-width:600px;margin:0 auto;"><div style="background:linear-gradient(135deg,#000 0%,#333 100%);color:#FFD700;padding:30px;border-radius:12px;text-align:center;margin-bottom:25px;"><div style="font-size:48px;margin-bottom:10px;">👤</div><h2 style="margin:0 0 5px;color:#fff;">' + State.user.name + '</h2><div style="font-size:14px;color:#ccc;">Distributor Code: <strong style="color:#FFD700;">' + (State.user.distributorCode || 'N/A') + '</strong></div><div style="margin-top:15px;display:inline-block;background:#FFD700;color:#000;padding:8px 20px;border-radius:20px;font-weight:bold;font-size:14px;">' + userRank.name + '</div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:25px;"><div style="background:#f9f9f9;padding:20px;border-radius:10px;text-align:center;"><div style="font-size:28px;font-weight:bold;color:#000;">' + (State.user.totalSales || 0) + '</div><div style="color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Total Sales</div></div><div style="background:#f9f9f9;padding:20px;border-radius:10px;text-align:center;"><div style="font-size:28px;font-weight:bold;color:#000;">' + (State.user.referrals || 0) + '</div><div style="color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Referrals</div></div></div><div style="background:#fff;border:2px solid ' + (isDue ? '#dc3545' : '#FFD700') + ';padding:20px;border-radius:10px;margin-bottom:25px;"><h4 style="margin:0 0 15px;color:#000;">Monthly Maintenance</h4><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;"><div><div style="font-size:24px;font-weight:bold;">R' + (userRank.monthlyMaintenance/100).toFixed(0) + '</div><div style="color:#666;font-size:12px;">' + (isDue ? 'OVERDUE - Pay now!' : daysLeft + ' days remaining') + '</div></div><button onclick="SiluApp.showMaintenanceTab()" style="background:#000;color:#FFD700;border:none;padding:12px 25px;border-radius:6px;font-weight:bold;cursor:pointer;">' + (isDue ? 'Pay Now' : 'View Details') + '</button></div><div style="width:100%;height:8px;background:#f0f0f0;border-radius:4px;overflow:hidden;"><div style="width:' + Math.min(100, (daysLeft/30)*100) + '%;height:100%;background:' + (isDue ? '#dc3545' : daysLeft > 7 ? '#28a745' : '#ffc107') + ';transition:width 0.3s;"></div></div></div>' + (nextRank ? '<div style="background:#f9f9f9;padding:20px;border-radius:10px;margin-bottom:25px;"><h4 style="margin:0 0 10px;">Next Rank: ' + nextRank.name + '</h4><p style="margin:0 0 15px;color:#666;font-size:14px;">You need ' + nextRank.referralsRequired + ' referrals' + (nextRank.teamRequirements ? ' and ' + nextRank.teamRequirements : '') + '.</p><div style="width:100%;height:8px;background:#e0e0e0;border-radius:4px;overflow:hidden;"><div style="width:' + Math.min(100, ((State.user.referrals || 0)/nextRank.referralsRequired)*100) + '%;height:100%;background:#FFD700;"></div></div><div style="text-align:center;margin-top:8px;font-size:12px;color:#666;">' + (State.user.referrals || 0) + ' / ' + nextRank.referralsRequired + ' referrals</div></div>' : '') + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"><button onclick="SiluApp.showReferralLink()" style="padding:12px;background:#000;color:#FFD700;border:none;border-radius:6px;font-weight:bold;cursor:pointer;">📋 Copy Referral Link</button><button onclick="SiluApp.showRankTable()" style="padding:12px;background:#fff;color:#000;border:2px solid #000;border-radius:6px;font-weight:bold;cursor:pointer;">📊 View Rank Table</button></div></div>';

            UI.createModal('Distributor Dashboard', html, '700px');
        },

        showReferralLink: function() {
            if (!State.user) return;
            const link = window.location.origin + '?ref=' + State.user.distributorCode;
            navigator.clipboard.writeText(link).then(function() {
                SiluApp.showToast('Referral link copied!');
            });
        },

        showRankTable: function() {
            let tableHTML = '<table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="background:#000;color:#FFD700;"><th style="padding:12px;text-align:left;">Rank</th><th style="padding:12px;text-align:center;">Referrals</th><th style="padding:12px;text-align:center;">Commission</th><th style="padding:12px;text-align:center;">Levels</th><th style="padding:12px;text-align:center;">Maintenance</th><th style="padding:12px;text-align:center;">Bonus</th></tr></thead><tbody>';

            CONFIG.RANKS.forEach(function(rank, i) {
                const isCurrent = State.user && State.user.rankLevel === rank.id;
                const bgStyle = isCurrent ? 'background:#fffde7;' : i % 2 === 0 ? 'background:#f9f9f9;' : 'background:#fff;';
                const levelsText = rank.levelsEarned.length === 1 ? 'Level 1 only' : 'Levels ' + rank.levelsEarned.join(', ').replace(/, ([^,]*)$/, ' & $1');

                tableHTML += '<tr style="' + bgStyle + '"><td style="padding:12px;font-weight:bold;">' + (isCurrent ? '▶ ' : '') + rank.name + '</td><td style="padding:12px;text-align:center;">' + rank.referralsRequired + (rank.teamRequirements ? '<br><small>' + rank.teamRequirements + '</small>' : '') + '</td><td style="padding:12px;text-align:center;font-weight:bold;">' + rank.commissionPct + '%</td><td style="padding:12px;text-align:center;">' + levelsText + '</td><td style="padding:12px;text-align:center;">R' + (rank.monthlyMaintenance/100).toFixed(0) + '</td><td style="padding:12px;text-align:center;">' + (rank.rankBonus > 0 ? 'R' + (rank.rankBonus/100).toFixed(0) : '—') + '</td></tr>';
            });

            tableHTML += '</tbody></table>';
            UI.createModal('Rank Progression Table', tableHTML, '900px');
        },

        showLoginModal: function() {
            const html = '<form id="silu-login-form" onsubmit="SiluApp.processLogin(event)"><div style="margin-bottom:15px;"><label style="display:block;margin-bottom:5px;font-weight:bold;">Email</label><input type="email" name="email" required style="width:100%;padding:12px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;"></div><div style="margin-bottom:20px;"><label style="display:block;margin-bottom:5px;font-weight:bold;">Password</label><input type="password" name="password" required style="width:100%;padding:12px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;"></div><button type="submit" style="width:100%;padding:15px;background:#000;color:#FFD700;border:none;border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer;">Login</button><p style="text-align:center;margin-top:15px;">New here? <a href="#" onclick="SiluApp.showPackSelection()" style="color:#000;font-weight:bold;">Join as Distributor</a></p></form>';
            UI.createModal('Distributor Login', html);
        },

        processLogin: function(e) {
            e.preventDefault();
            this.showToast('Login requires backend connection. Set up Supabase auth first.');
        },

        logout: function() {
            State.logout();
            this.showToast('Logged out successfully');
        },

        showToast: function(message) {
            const toast = document.createElement('div');
            toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#000;color:#FFD700;padding:14px 28px;border-radius:8px;z-index:10001;font-family:inherit;font-weight:bold;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(function() { toast.remove(); }, 4000);
        }
    };

    // Expose globally
    window.SiluApp = SiluApp;
    window.Cart = Cart;
    window.UI = UI;
    window.CONFIG = CONFIG;

    // Initialize when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { SiluApp.init(); });
    } else {
        SiluApp.init();
    }
})();


// ============================================================
// SILU NATURALS - SUPABASE BACKEND INTEGRATION
// ============================================================
// This file connects your existing frontend to Supabase backend
// WITHOUT changing any layout, tabs, or icons
//
// Place this BEFORE the closing </body> tag in your HTML
// ============================================================

// Initialize Supabase client
const SUPABASE_URL = 'https://utkgqnqugutzoyyxsxtk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_jgKuIK_GjA6xowWTyFSwWw_r2d_w2mg';

// Load Supabase JS library dynamically
const supabaseScript = document.createElement('script');
supabaseScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
supabaseScript.onload = function() {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase connected');
    initAuth();
    initDataFetching();
};
document.head.appendChild(supabaseScript);

// ============================================================
// PHASE 1: AUTHENTICATION (Login / Register)
// ============================================================

function initAuth() {
    // Check existing session on page load
    checkSession();

    // Setup form handlers
    setupLoginForm();
    setupRegisterForm();
    setupLogoutHandler();
}

async function checkSession() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();

    if (session) {
        console.log('🔓 User logged in:', session.user.email);
        updateUIForLoggedInUser(session.user);
        await fetchUserProfile(session.user.id);
    } else {
        console.log('🔒 No active session');
        updateUIForLoggedOutUser();
    }
}

function setupLoginForm() {
    // Find the login form in your modal
    const loginForm = document.querySelector('#portal .modal form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = loginForm.querySelector('input[type="email"]')?.value;
        const password = loginForm.querySelector('input[type="password"]')?.value;

        if (!email || !password) {
            showFormMessage(loginForm, 'Please fill in all fields', 'error');
            return;
        }

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            showFormMessage(loginForm, error.message, 'error');
            return;
        }

        showFormMessage(loginForm, 'Login successful!', 'success');
        closeModal();
        updateUIForLoggedInUser(data.user);
        await fetchUserProfile(data.user.id);
    });
}

function setupRegisterForm() {
    // Find register form - could be in same modal with tabs
    const registerForm = document.querySelector('#join form') || 
                         document.querySelector('form[action*="register"]');

    if (!registerForm) return;

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = registerForm.querySelector('input[type="email"]')?.value;
        const password = registerForm.querySelector('input[type="password"]')?.value;
        const fullName = registerForm.querySelector('input[name="name"]')?.value;

        if (!email || !password) {
            showFormMessage(registerForm, 'Email and password required', 'error');
            return;
        }

        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName || '',
                    role: 'distributor' // default role
                }
            }
        });

        if (error) {
            showFormMessage(registerForm, error.message, 'error');
            return;
        }

        showFormMessage(registerForm, 'Registration successful! Check your email.', 'success');

        // Auto-create profile in database
        if (data.user) {
            await createUserProfile(data.user.id, {
                full_name: fullName,
                email: email,
                role: 'distributor',
                rank: 'Member',
                commission_earned: 0,
                team_size: 0,
                total_sales: 0
            });
        }
    });
}

function setupLogoutHandler() {
    // Add logout functionality to dashboard
    document.addEventListener('click', async (e) => {
        if (e.target.matches('.dash-nav a[href="#logout"]') || 
            e.target.textContent.toLowerCase().includes('logout')) {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            updateUIForLoggedOutUser();
            window.location.reload();
        }
    });
}

// ============================================================
// USER PROFILE MANAGEMENT
// ============================================================

async function createUserProfile(userId, profileData) {
    const { error } = await supabaseClient
        .from('profiles')
        .insert([{ id: userId, ...profileData }]);

    if (error) console.error('Profile creation error:', error);
}

async function fetchUserProfile(userId) {
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Profile fetch error:', error);
        return;
    }

    if (data) {
        updateDashboardWithProfile(data);
    }
}

function updateDashboardWithProfile(profile) {
    // Update dashboard stats without changing layout
    const statVals = document.querySelectorAll('.stat-val');
    const statLbls = document.querySelectorAll('.stat-lbl');

    statVals.forEach((val, idx) => {
        const lbl = statLbls[idx]?.textContent?.toLowerCase() || '';
        if (lbl.includes('balance')) val.textContent = `R${profile.commission_earned || 0}`;
        if (lbl.includes('team')) val.textContent = profile.team_size || 0;
        if (lbl.includes('sales')) val.textContent = `R${profile.total_sales || 0}`;
        if (lbl.includes('rank')) val.textContent = profile.rank || 'Member';
    });

    // Update user name in sidebar
    const userNameEl = document.querySelector('.dash-user-name');
    if (userNameEl) userNameEl.textContent = profile.full_name || 'User';

    const userRankEl = document.querySelector('.dash-user-rank');
    if (userRankEl) userRankEl.textContent = profile.rank || 'Member';
}

// ============================================================
// UI UPDATES (No layout changes - just content updates)
// ============================================================

function updateUIForLoggedInUser(user) {
    // Show distributor portal tab
    const portalTab = document.querySelector('.tab-btn[data-tab="portal"]');
    if (portalTab) portalTab.style.display = 'inline-block';

    // Update nav button to show user menu
    const navBtn = document.querySelector('.nav-btn');
    if (navBtn) {
        navBtn.textContent = 'Dashboard';
        navBtn.onclick = () => switchTab('portal');
    }
}

function updateUIForLoggedOutUser() {
    // Hide distributor portal
    const portalTab = document.querySelector('.tab-btn[data-tab="portal"]');
    if (portalTab) portalTab.style.display = 'none';

    // Reset nav button
    const navBtn = document.querySelector('.nav-btn');
    if (navBtn) {
        navBtn.textContent = 'Join Now';
        navBtn.onclick = () => openModal('join');
    }
}

function showFormMessage(form, message, type) {
    let msgEl = form.querySelector('.form-msg');
    if (!msgEl) {
        msgEl = document.createElement('div');
        msgEl.className = 'form-msg';
        form.insertBefore(msgEl, form.firstChild);
    }
    msgEl.textContent = message;
    msgEl.className = `form-msg ${type}`;
    msgEl.style.display = 'block';
}

function closeModal() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.dataset.panel === tabName);
    });
}

// ============================================================
// PHASE 2: PRODUCTS & PAYMENTS (Stripe Integration)
// ============================================================

async function initDataFetching() {
    await fetchProducts();
    setupPaymentButtons();
}

async function fetchProducts() {
    const { data: products, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('active', true);

    if (error) {
        console.error('Products fetch error:', error);
        return;
    }

    if (products && products.length > 0) {
        renderProducts(products);
    }
}

function renderProducts(products) {
    const grid = document.querySelector('.products-grid');
    if (!grid) return;

    grid.innerHTML = products.map(product => `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-card-top">
                <div class="product-icon">${product.icon || '🧴'}</div>
                ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            </div>
            <div class="product-body">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">R${product.price} <span>${product.unit || 'each'}</span></div>
                <p class="product-desc">${product.description}</p>
                <button class="product-btn" onclick="initiateCheckout('${product.id}', ${product.price})">
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

async function initiateCheckout(productId, price) {
    // Check if user is logged in
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        alert('Please login first to make a purchase');
        openModal('login');
        return;
    }

    // Create Stripe checkout session via Supabase Edge Function
    try {
        const { data, error } = await supabaseClient.functions.invoke('create-checkout', {
            body: {
                product_id: productId,
                price: price,
                user_id: session.user.id,
                success_url: window.location.origin + '?payment=success',
                cancel_url: window.location.origin + '?payment=cancelled'
            }
        });

        if (error) throw error;

        // Redirect to Stripe Checkout
        if (data?.url) {
            window.location.href = data.url;
        }
    } catch (err) {
        console.error('Checkout error:', err);
        alert('Payment system temporarily unavailable. Please try again.');
    }
}

function setupPaymentButtons() {
    // Also handle pack purchases (registration packs)
    document.querySelectorAll('.pack-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const packCard = e.target.closest('.pack-card');
            const packName = packCard?.querySelector('.pack-name')?.textContent;
            const packPrice = packCard?.querySelector('.pack-price')?.textContent;

            // Extract numeric price
            const price = parseFloat(packPrice?.replace(/[^0-9.]/g, '')) || 0;

            if (packName && price > 0) {
                await initiateCheckout(`pack-${packName.toLowerCase().replace(/\s+/g, '-')}`, price);
            }
        });
    });
}

// ============================================================
// PHASE 3: COMMISSION TRACKING
// ============================================================

async function fetchCommissionData(userId) {
    // Fetch user's commission history
    const { data: commissions, error } = await supabaseClient
        .from('commissions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Commission fetch error:', error);
        return;
    }

    if (commissions) {
        updateCommissionTable(commissions);
    }

    // Fetch team/downline data
    const { data: team } = await supabaseClient
        .from('profiles')
        .select('id, full_name, rank, total_sales, created_at')
        .eq('referrer_id', userId);

    if (team) {
        updateTeamTree(team);
    }
}

function updateCommissionTable(commissions) {
    const tbody = document.querySelector('.comm-table tbody');
    if (!tbody) return;

    tbody.innerHTML = commissions.map(comm => `
        <tr>
            <td><span class="rank-badge ${comm.rank_class || ''}">${comm.rank || 'Member'}</span></td>
            <td>${comm.level || '-'}</td>
            <td class="comm-percent">${comm.percentage || '0%'}</td>
            <td class="comm-earn">R${comm.amount || 0}</td>
        </tr>
    `).join('');
}

function updateTeamTree(teamMembers) {
    const treeContainer = document.querySelector('.tree-children');
    if (!treeContainer) return;

    treeContainer.innerHTML = teamMembers.map(member => `
        <div class="tree-node">
            <div class="tree-node-name">${member.full_name || 'Unknown'}</div>
            <div class="tree-node-meta">${member.rank || 'Member'} • R${member.total_sales || 0} sales</div>
        </div>
    `).join('');
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function openModal(modalId) {
    const modal = document.querySelector(`#${modalId} .modal-overlay`) || 
                  document.querySelector('.modal-overlay');
    if (modal) modal.classList.add('active');
}

// Expose functions globally for onclick handlers
window.initiateCheckout = initiateCheckout;
window.switchTab = switchTab;
window.openModal = openModal;

console.log('🔧 Silu Naturals Backend Loaded');

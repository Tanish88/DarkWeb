/**
 * Privacy-focused E-commerce Website JavaScript
 * Handles cart management, form validation, and user interactions
 * No tracking, cookies, or external dependencies
 */

// Product data array - stored in memory only
const products = [
    {
        id: 1,
        name: "Ultimate Privacy Guide",
        description: "Comprehensive 200-page guide covering advanced anonymity techniques, secure communications, and digital privacy protection strategies.",
        priceUsd: 25.00,
        priceXmr: 0.15
    },
    {
        id: 2,
        name: "Secure Communication Toolkit",
        description: "Software package including encrypted messaging tools, secure email clients, and voice communication applications.",
        priceUsd: 35.00,
        priceXmr: 0.21
    },
    {
        id: 3,
        name: "Anonymous Web Browsing Course",
        description: "Video course series teaching advanced techniques for anonymous web browsing, including Tor usage and operational security.",
        priceUsd: 20.00,
        priceXmr: 0.12
    },
    {
        id: 4,
        name: "Cryptocurrency Privacy Manual",
        description: "Detailed guide on using cryptocurrencies privately, including mixing services, privacy coins, and transaction anonymization.",
        priceUsd: 30.00,
        priceXmr: 0.18
    },
    {
        id: 5,
        name: "Digital Forensics Protection Suite",
        description: "Software tools and guides for protecting against digital forensics, including secure deletion and anti-analysis techniques.",
        priceUsd: 45.00,
        priceXmr: 0.27
    },
    {
        id: 6,
        name: "Operational Security Handbook",
        description: "Comprehensive OPSEC manual covering threat modeling, secure communications, and maintaining anonymity in digital operations.",
        priceUsd: 40.00,
        priceXmr: 0.24
    }
];

// Cart management - stored in localStorage for persistence
class CartManager {
    constructor() {
        this.cart = this.loadCart();
        this.updateCartCount();
    }

    // Load cart from localStorage
    loadCart() {
        try {
            const cartData = localStorage.getItem('secureShopCart');
            return cartData ? JSON.parse(cartData) : [];
        } catch (error) {
            console.warn('Error loading cart from localStorage:', error);
            return [];
        }
    }

    // Save cart to localStorage
    saveCart() {
        try {
            localStorage.setItem('secureShopCart', JSON.stringify(this.cart));
        } catch (error) {
            console.warn('Error saving cart to localStorage:', error);
        }
    }

    // Add item to cart
    addItem(productId, quantity = 1) {
        const product = products.find(p => p.id === productId);
        if (!product) {
            console.error('Product not found:', productId);
            return false;
        }

        const existingItem = this.cart.find(item => item.productId === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                productId: productId,
                quantity: quantity,
                addedAt: new Date().toISOString()
            });
        }

        this.saveCart();
        this.updateCartCount();
        return true;
    }

    // Remove item from cart
    removeItem(productId) {
        this.cart = this.cart.filter(item => item.productId !== productId);
        this.saveCart();
        this.updateCartCount();
    }

    // Update item quantity
    updateQuantity(productId, quantity) {
        const item = this.cart.find(item => item.productId === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = quantity;
                this.saveCart();
                this.updateCartCount();
            }
        }
    }

    // Get cart items with product details
    getCartItems() {
        return this.cart.map(cartItem => {
            const product = products.find(p => p.id === cartItem.productId);
            return product ? { ...product, quantity: cartItem.quantity } : null;
        }).filter(item => item !== null);
    }

    // Calculate cart totals
    getCartTotals() {
        const items = this.getCartItems();
        const totalUsd = items.reduce((sum, item) => sum + (item.priceUsd * item.quantity), 0);
        const totalXmr = items.reduce((sum, item) => sum + (item.priceXmr * item.quantity), 0);
        
        return {
            totalUsd: totalUsd.toFixed(2),
            totalXmr: totalXmr.toFixed(3),
            itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
        };
    }

    // Update cart count in navigation
    updateCartCount() {
        const cartCountElements = document.querySelectorAll('#cart-count');
        const totals = this.getCartTotals();
        cartCountElements.forEach(element => {
            if (element) {
                element.textContent = totals.itemCount;
            }
        });
    }

    // Clear cart
    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartCount();
    }
}

// Input sanitization functions
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateXMRAddress(address) {
    // Basic Monero address validation (simplified)
    return address.length >= 90 && address.length <= 106 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(address);
}

// Initialize cart manager
const cartManager = new CartManager();

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

// Initialize page based on current location
function initializePage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    switch (currentPage) {
        case 'index.html':
        case '':
            initializeHomePage();
            break;
        case 'products.html':
            initializeProductsPage();
            break;
        case 'cart.html':
            initializeCartPage();
            break;
        case 'checkout.html':
            initializeCheckoutPage();
            break;
    }
}

// Initialize home page
function initializeHomePage() {
    console.log('Home page initialized');
    // Home page specific initialization if needed
}

// Initialize products page
function initializeProductsPage() {
    const productsContainer = document.getElementById('products-container');
    if (productsContainer) {
        renderProducts(productsContainer);
    }
}

// Render products in the products grid
function renderProducts(container) {
    container.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-info">
                <h4>${sanitizeHTML(product.name)}</h4>
                <p class="product-description">${sanitizeHTML(product.description)}</p>
                <div class="product-price">
                    <span class="price-usd">$${product.priceUsd.toFixed(2)} USD</span>
                    <span class="price-xmr">${product.priceXmr.toFixed(3)} XMR</span>
                </div>
                <button class="add-to-cart-btn" onclick="addToCart(${product.id})">Add to Cart</button>
            </div>
        `;
        container.appendChild(productCard);
    });
}

// Add to cart function (called from HTML)
function addToCart(productId) {
    if (cartManager.addItem(productId)) {
        showNotification('Product added to cart!', 'success');
    } else {
        showNotification('Error adding product to cart', 'error');
    }
}

// Initialize cart page
function initializeCartPage() {
    renderCartPage();
}

// Render cart page content
function renderCartPage() {
    const cartContainer = document.getElementById('cart-container');
    const cartSummary = document.getElementById('cart-summary');
    const emptyCart = document.getElementById('empty-cart');
    
    if (!cartContainer) return;
    
    const cartItems = cartManager.getCartItems();
    const totals = cartManager.getCartTotals();
    
    if (cartItems.length === 0) {
        cartContainer.style.display = 'none';
        cartSummary.style.display = 'none';
        emptyCart.style.display = 'block';
        return;
    }
    
    // Hide empty cart message
    emptyCart.style.display = 'none';
    cartContainer.style.display = 'block';
    cartSummary.style.display = 'block';
    
    // Render cart items
    cartContainer.innerHTML = '';
    cartItems.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <h4>${sanitizeHTML(item.name)}</h4>
                <p>${sanitizeHTML(item.description)}</p>
                <div class="product-price">
                    <span class="price-usd">$${item.priceUsd.toFixed(2)} USD</span>
                    <span class="price-xmr">${item.priceXmr.toFixed(3)} XMR</span>
                </div>
            </div>
            <div class="cart-item-controls">
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
                </div>
                <button class="remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        `;
        cartContainer.appendChild(cartItem);
    });
    
    // Update cart summary
    document.getElementById('cart-subtotal').textContent = `$${totals.totalUsd} USD`;
    document.getElementById('cart-subtotal-xmr').textContent = `${totals.totalXmr} XMR`;
    document.getElementById('cart-total').textContent = `$${totals.totalUsd} USD`;
}

// Update cart item quantity
function updateCartQuantity(productId, newQuantity) {
    cartManager.updateQuantity(productId, newQuantity);
    renderCartPage();
}

// Remove item from cart
function removeFromCart(productId) {
    cartManager.removeItem(productId);
    renderCartPage();
    showNotification('Item removed from cart', 'info');
}

// Initialize checkout page
function initializeCheckoutPage() {
    renderCheckoutSummary();
    initializeCheckoutForm();
    updateOwnerEmailDisplay();
}

// Update the displayed owner email configuration
function updateOwnerEmailDisplay() {
    const emailElement = document.getElementById('current-owner-email');
    if (emailElement && typeof CONFIG !== 'undefined') {
        emailElement.textContent = CONFIG.OWNER_EMAIL || 'owner@secureshop.example';
    }
}

// Render checkout order summary
function renderCheckoutSummary() {
    const checkoutItems = document.getElementById('checkout-items');
    const checkoutTotalUsd = document.getElementById('checkout-total-usd');
    const checkoutTotalXmr = document.getElementById('checkout-total-xmr');
    
    if (!checkoutItems) return;
    
    const cartItems = cartManager.getCartItems();
    const totals = cartManager.getCartTotals();
    
    // Render checkout items
    checkoutItems.innerHTML = '';
    cartItems.forEach(item => {
        const checkoutItem = document.createElement('div');
        checkoutItem.className = 'checkout-item';
        checkoutItem.innerHTML = `
            <span class="checkout-item-name">${sanitizeHTML(item.name)} (×${item.quantity})</span>
            <span class="checkout-item-price">$${(item.priceUsd * item.quantity).toFixed(2)}</span>
        `;
        checkoutItems.appendChild(checkoutItem);
    });
    
    // Update totals
    if (checkoutTotalUsd) checkoutTotalUsd.textContent = `$${totals.totalUsd} USD`;
    if (checkoutTotalXmr) checkoutTotalXmr.textContent = `${totals.totalXmr} XMR`;
}

// Initialize checkout form
function initializeCheckoutForm() {
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckoutSubmit);
    }
}

// Handle checkout form submission
async function handleCheckoutSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const contactMethod = formData.get('contactMethod');
    const contactInfo = formData.get('contactInfo');
    const termsAccepted = formData.get('terms-checkbox') === 'on';
    
    // Validate form
    if (!contactMethod) {
        showNotification('Please select a contact method', 'error');
        return;
    }
    
    if (!contactInfo || contactInfo.trim().length === 0) {
        showNotification('Please provide contact information', 'error');
        return;
    }
    
    if (!termsAccepted) {
        showNotification('Please accept the terms to continue', 'error');
        return;
    }
    
    // Validate contact info based on method
    const sanitizedContactInfo = sanitizeHTML(contactInfo.trim());
    
    if (contactMethod === 'email' && !validateEmail(sanitizedContactInfo)) {
        showNotification('Please provide a valid email address', 'error');
        return;
    }
    
    if (contactMethod === 'xmr-address' && !validateXMRAddress(sanitizedContactInfo)) {
        showNotification('Please provide a valid Monero address', 'error');
        return;
    }
    
    // Generate order ID
    const orderId = generateOrderId();
    const totals = cartManager.getCartTotals();
    
    // In a real implementation, this would send order details to the server
    // while maintaining customer privacy
    await sendOrderToServer(orderId, totals, contactMethod, sanitizedContactInfo);
    
    // Show order confirmation
    showOrderConfirmation(orderId, totals);
    
    // Clear cart after successful order
    cartManager.clearCart();
}

// Generate random order ID
function generateOrderId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'SS-';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Send order to server and notify website owner
async function sendOrderToServer(orderId, totals, contactMethod, contactInfo) {
    console.log('=== ORDER NOTIFICATION FOR WEBSITE OWNER ===');
    console.log(`Order ID: ${orderId}`);
    console.log(`Total: $${totals.totalUsd} USD (${totals.totalXmr} XMR)`);
    console.log(`Contact Method: ${contactMethod}`);
    console.log(`Contact Info: ${contactInfo}`);
    console.log('Items ordered:');
    
    const cartItems = cartManager.getCartItems();
    cartItems.forEach(item => {
        console.log(`- ${item.name} (x${item.quantity}) - $${(item.priceUsd * item.quantity).toFixed(2)}`);
    });
    
    console.log('=== END ORDER NOTIFICATION ===');
    
    // Send email notification to website owner
    if (typeof emailService !== 'undefined') {
        try {
            const emailSent = await emailService.sendOrderNotification(
                orderId, 
                cartItems, 
                totals, 
                contactMethod, 
                contactInfo
            );
            
            if (emailSent) {
                showNotification('Order notification sent to website owner', 'success');
            } else {
                showNotification('Order saved, but email notification failed', 'warning');
            }
        } catch (error) {
            console.error('Email notification error:', error);
            showNotification('Order saved, email requires SendGrid API key', 'info');
        }
    }
    
    // In a real implementation, this would also:
    // 1. Send encrypted order data to a secure server endpoint
    // 2. Store minimal order info (ID, total, timestamp) in database
    // 3. NOT store customer contact info permanently
    // 4. Use order ID to match payments to orders
}

// Show order confirmation
function showOrderConfirmation(orderId, totals) {
    const checkoutSection = document.querySelector('.checkout-section');
    const orderConfirmation = document.getElementById('order-confirmation');
    const orderIdElement = document.getElementById('order-id');
    const confirmedTotalElement = document.getElementById('confirmed-total');
    
    if (orderConfirmation && orderIdElement && confirmedTotalElement) {
        // Hide checkout form and payment info
        document.querySelector('.checkout-form-container').style.display = 'none';
        document.querySelector('.payment-info').style.display = 'none';
        document.querySelector('.checkout-summary').style.display = 'none';
        
        // Show confirmation
        orderIdElement.textContent = orderId;
        confirmedTotalElement.textContent = `$${totals.totalUsd} USD (${totals.totalXmr} XMR)`;
        orderConfirmation.style.display = 'block';
        
        // Scroll to confirmation
        orderConfirmation.scrollIntoView({ behavior: 'smooth' });
    }
}

// Copy to clipboard function
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        const text = element.textContent;
        
        // Try to use the modern clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                showNotification('Address copied to clipboard!', 'success');
            }).catch(() => {
                fallbackCopyToClipboard(text);
            });
        } else {
            fallbackCopyToClipboard(text);
        }
    }
}

// Fallback copy to clipboard for older browsers
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const result = document.execCommand('copy');
        if (result) {
            showNotification('Address copied to clipboard!', 'success');
        } else {
            showNotification('Copy failed. Please select and copy manually.', 'error');
        }
    } catch (err) {
        showNotification('Copy not supported. Please select and copy manually.', 'error');
    }
    
    document.body.removeChild(textArea);
}

// Show notification function
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${type === 'success' ? '#0d4159' : type === 'error' ? '#d32f2f' : '#1a4a5c'};
        color: #ffffff;
        padding: 1rem 1.5rem;
        border-radius: 6px;
        border: 1px solid ${type === 'success' ? '#00b7eb' : type === 'error' ? '#b71c1c' : '#00b7eb'};
        z-index: 10000;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // Add slide-in animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Keyboard navigation support
document.addEventListener('keydown', function(event) {
    // ESC key to close notifications
    if (event.key === 'Escape') {
        const notification = document.querySelector('.notification');
        if (notification) {
            notification.remove();
        }
    }
});

// Prevent common XSS vectors
window.addEventListener('error', function(event) {
    // Log errors without exposing sensitive information
    console.warn('Script error occurred - check console for details');
});

// Initialize page when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}

// Disable context menu for additional security (optional)
document.addEventListener('contextmenu', function(event) {
    // Uncomment to disable right-click context menu
    // event.preventDefault();
});

// Console warning for security
console.warn('SecureShop - Privacy-focused e-commerce platform. This is a demonstration site.');
console.warn('No real payments are processed. No personal data is collected or transmitted.');

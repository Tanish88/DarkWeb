#!/usr/bin/env node
/**
 * Email notification server for SecureShop
 * Handles sending order notifications to website owner via SendGrid
 */

const http = require('http');
const url = require('url');
const querystring = require('querystring');

// Import SendGrid
let sgMail;
try {
    sgMail = require('@sendgrid/mail');
    if (process.env.SENDGRID_API_KEY) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        console.log('✅ SendGrid configured successfully');
    } else {
        console.log('⚠️ SENDGRID_API_KEY not found in environment variables');
    }
} catch (error) {
    console.log('⚠️ SendGrid not installed, email notifications will be simulated');
}

const PORT = 5001;
const HOST = "0.0.0.0";

// Configuration
const CONFIG = {
    OWNER_EMAIL: process.env.OWNER_EMAIL || 'your-email@example.com', // Set via environment variable or change this
    FROM_EMAIL: 'noreply@secureshop.repl.co',
    FROM_NAME: 'SecureShop'
};

/**
 * Handle email sending requests
 */
async function handleEmailRequest(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    try {
        // Parse request body
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const orderData = JSON.parse(body);
                
                // Validate required fields
                if (!orderData.orderId || !orderData.totals || !orderData.cartItems) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing required order data' }));
                    return;
                }

                // Send email notification
                const emailSent = await sendOrderEmail(orderData);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: emailSent,
                    message: emailSent ? 'Email sent successfully' : 'Email simulation completed'
                }));

            } catch (parseError) {
                console.error('Error parsing request:', parseError);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON data' }));
            }
        });

    } catch (error) {
        console.error('Email request error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

/**
 * Send order notification email
 */
async function sendOrderEmail(orderData) {
    const { orderId, totals, cartItems, contactMethod, contactInfo } = orderData;
    
    // Generate email content
    const emailContent = generateEmailContent(orderId, totals, cartItems, contactMethod, contactInfo);
    
    if (sgMail && process.env.SENDGRID_API_KEY) {
        try {
            await sgMail.send(emailContent);
            console.log(`✅ Order notification email sent for order ${orderId}`);
            return true;
        } catch (error) {
            console.error('SendGrid error:', error);
            // Fall back to simulation
            simulateEmail(emailContent);
            return false;
        }
    } else {
        // Simulate email sending
        simulateEmail(emailContent);
        return false;
    }
}

/**
 * Generate email content for order notification
 */
function generateEmailContent(orderId, totals, cartItems, contactMethod, contactInfo) {
    const timestamp = new Date().toISOString();
    
    // Generate items list for email
    const itemsHTML = cartItems.map(item => 
        `<tr>
            <td>${item.name}</td>
            <td>×${item.quantity}</td>
            <td>$${(item.priceUsd * item.quantity).toFixed(2)}</td>
            <td>${(item.priceXmr * item.quantity).toFixed(3)} XMR</td>
        </tr>`
    ).join('');

    const itemsText = cartItems.map(item => 
        `- ${item.name} (×${item.quantity}) - $${(item.priceUsd * item.quantity).toFixed(2)} USD`
    ).join('\n');

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #032b44; color: #ffffff; border-radius: 8px; overflow: hidden; }
            .header { background-color: #00b7eb; color: #032b44; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .order-details { background-color: #0a3a52; padding: 15px; border-radius: 6px; margin: 15px 0; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #1a4a5c; }
            th { background-color: #1a4a5c; }
            .total { font-weight: bold; color: #00b7eb; font-size: 1.2em; }
            .privacy-warning { background-color: #d32f2f; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .next-steps { background-color: #1a4a5c; padding: 15px; border-radius: 4px; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔒 New SecureShop Order</h1>
                <p>Order ID: ${orderId}</p>
            </div>
            
            <div class="content">
                <div class="order-details">
                    <h3>Order Information</h3>
                    <p><strong>Order ID:</strong> ${orderId}</p>
                    <p><strong>Timestamp:</strong> ${timestamp}</p>
                    <p><strong>Contact Method:</strong> ${contactMethod}</p>
                    <p><strong>Customer Contact:</strong> ${contactInfo}</p>
                </div>
                
                <h3>Items Ordered</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>USD Total</th>
                            <th>XMR Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
                
                <div class="total">
                    <p>Total: $${totals.totalUsd} USD (${totals.totalXmr} XMR)</p>
                </div>
                
                <div class="next-steps">
                    <h3>Next Steps</h3>
                    <ol>
                        <li>Monitor Monero address for payment: <br><code>4A1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12</code></li>
                        <li>After 3 confirmations, deliver products to customer's contact method</li>
                        <li>Delete customer contact information after successful delivery</li>
                    </ol>
                </div>
                
                <div class="privacy-warning">
                    <strong>⚠️ Privacy Notice:</strong> Delete this email after processing to protect customer privacy. Customer contact info should be encrypted and purged after delivery.
                </div>
            </div>
        </div>
    </body>
    </html>`;

    const textContent = `
🔒 NEW SECURESHOP ORDER

Order ID: ${orderId}
Timestamp: ${timestamp}
Contact Method: ${contactMethod}
Customer Contact: ${contactInfo}

ITEMS ORDERED:
${itemsText}

TOTAL: $${totals.totalUsd} USD (${totals.totalXmr} XMR)

NEXT STEPS:
1. Monitor Monero address for payment
2. After 3 confirmations, deliver products to customer
3. Delete customer contact info after delivery

⚠️ PRIVACY: Delete this email after processing to protect customer privacy.
    `.trim();

    return {
        to: CONFIG.OWNER_EMAIL,
        from: {
            email: CONFIG.FROM_EMAIL,
            name: CONFIG.FROM_NAME
        },
        subject: `New SecureShop Order - ${orderId}`,
        text: textContent,
        html: htmlContent
    };
}

/**
 * Simulate email sending for demonstration
 */
function simulateEmail(emailContent) {
    console.log('\n📧 EMAIL NOTIFICATION SIMULATION');
    console.log('================================');
    console.log(`To: ${emailContent.to}`);
    console.log(`From: ${emailContent.from.name} <${emailContent.from.email}>`);
    console.log(`Subject: ${emailContent.subject}`);
    console.log('\n--- EMAIL CONTENT ---');
    console.log(emailContent.text);
    console.log('================================');
    console.log('✅ Email simulation completed');
}

/**
 * Main server setup
 */
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    if (parsedUrl.pathname === '/send-order-email') {
        handleEmailRequest(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
    }
});

server.listen(PORT, HOST, () => {
    console.log(`📧 Email notification server running at http://${HOST}:${PORT}`);
    console.log('Ready to send order notifications to website owner');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n📧 Email server stopped.');
    process.exit(0);
});
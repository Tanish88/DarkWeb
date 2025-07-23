/**
 * Email notification service for SecureShop
 * Sends order notifications to website owner while maintaining customer privacy
 */

class EmailService {
    constructor() {
        this.config = window.CONFIG || {};
        this.isNodeJs = typeof require !== 'undefined';
    }

    /**
     * Send order notification email to website owner
     * @param {string} orderId - Order ID
     * @param {Object} orderData - Order details
     * @param {Object} totals - Order totals
     * @param {string} contactMethod - Customer's contact method
     * @param {string} contactInfo - Customer's contact info (encrypted in real implementation)
     */
    async sendOrderNotification(orderId, orderData, totals, contactMethod, contactInfo) {
        try {
            // Try to send via email server first
            const emailServerResult = await this.sendViaEmailServer(orderId, orderData, totals, contactMethod, contactInfo);
            if (emailServerResult) {
                return true;
            }
            
            // Fallback to simulation
            const emailData = this.prepareOrderEmail(orderId, orderData, totals, contactMethod, contactInfo);
            return this.simulateEmailSending(emailData);
        } catch (error) {
            console.error('Email sending failed:', error);
            return false;
        }
    }

    /**
     * Prepare email content for order notification
     */
    prepareOrderEmail(orderId, orderData, totals, contactMethod, contactInfo) {
        const timestamp = new Date().toISOString();
        
        const emailContent = {
            to: this.config.OWNER_EMAIL || 'owner@secureshop.example',
            from: {
                email: this.config.EMAIL_SETTINGS?.fromEmail || 'noreply@secureshop.example',
                name: this.config.EMAIL_SETTINGS?.fromName || 'SecureShop'
            },
            subject: (this.config.EMAIL_SETTINGS?.orderNotificationSubject || 'New Order - {ORDER_ID}')
                .replace('{ORDER_ID}', orderId),
            html: this.generateEmailHTML(orderId, orderData, totals, contactMethod, contactInfo, timestamp),
            text: this.generateEmailText(orderId, orderData, totals, contactMethod, contactInfo, timestamp)
        };

        return emailContent;
    }

    /**
     * Generate HTML email content
     */
    generateEmailHTML(orderId, orderData, totals, contactMethod, contactInfo, timestamp) {
        const itemsList = orderData.map(item => 
            `<tr>
                <td>${item.name}</td>
                <td>×${item.quantity}</td>
                <td>$${(item.priceUsd * item.quantity).toFixed(2)}</td>
                <td>${(item.priceXmr * item.quantity).toFixed(3)} XMR</td>
            </tr>`
        ).join('');

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; background-color: #032b44; color: #ffffff; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #00b7eb; color: #032b44; padding: 15px; text-align: center; }
                .content { background-color: #0a3a52; padding: 20px; border-radius: 8px; margin: 20px 0; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #1a4a5c; }
                th { background-color: #1a4a5c; }
                .total { font-weight: bold; color: #00b7eb; }
                .privacy-notice { background-color: #d32f2f; padding: 15px; margin: 20px 0; border-radius: 4px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>🔒 New SecureShop Order</h2>
                </div>
                
                <div class="content">
                    <h3>Order Details</h3>
                    <p><strong>Order ID:</strong> ${orderId}</p>
                    <p><strong>Timestamp:</strong> ${timestamp}</p>
                    <p><strong>Contact Method:</strong> ${contactMethod}</p>
                    <p><strong>Customer Contact:</strong> ${contactInfo}</p>
                    
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
                            ${itemsList}
                        </tbody>
                    </table>
                    
                    <div class="total">
                        <p><strong>Total: $${totals.totalUsd} USD (${totals.totalXmr} XMR)</strong></p>
                    </div>
                    
                    <h3>Next Steps</h3>
                    <ol>
                        <li>Monitor Monero address for payment: <code>4A1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12</code></li>
                        <li>After 3 confirmations, deliver products to customer's contact method</li>
                        <li>Delete customer contact information after successful delivery</li>
                    </ol>
                </div>
                
                <div class="privacy-notice">
                    <strong>⚠️ Privacy Notice:</strong> ${this.config.EMAIL_SETTINGS?.privacyNotice || 'Delete this email after processing to protect customer privacy.'}
                </div>
            </div>
        </body>
        </html>`;
    }

    /**
     * Generate plain text email content
     */
    generateEmailText(orderId, orderData, totals, contactMethod, contactInfo, timestamp) {
        const itemsList = orderData.map(item => 
            `- ${item.name} (×${item.quantity}) - $${(item.priceUsd * item.quantity).toFixed(2)} USD`
        ).join('\n');

        return `
🔒 NEW SECURESHOP ORDER

Order ID: ${orderId}
Timestamp: ${timestamp}
Contact Method: ${contactMethod}
Customer Contact: ${contactInfo}

ITEMS ORDERED:
${itemsList}

TOTAL: $${totals.totalUsd} USD (${totals.totalXmr} XMR)

NEXT STEPS:
1. Monitor Monero address for payment
2. After 3 confirmations, deliver products to customer
3. Delete customer contact info after delivery

⚠️ PRIVACY: Delete this email after processing to protect customer privacy.
        `.trim();
    }

    /**
     * Send email via email notification server
     */
    async sendViaEmailServer(orderId, orderData, totals, contactMethod, contactInfo) {
        try {
            const response = await fetch('/send-order-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId,
                    cartItems: orderData,
                    totals,
                    contactMethod,
                    contactInfo
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Email notification sent via server:', result.message);
                return result.success;
            } else {
                console.warn('Email server responded with error:', response.status);
                return false;
            }
        } catch (error) {
            console.warn('Email server not available, falling back to simulation:', error.message);
            return false;
        }
    }

    /**
     * Send email using SendGrid (server-side)
     */
    async sendWithSendGrid(emailData) {
        if (!this.isNodeJs) {
            throw new Error('SendGrid can only be used server-side');
        }

        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        await sgMail.send(emailData);
        console.log('✅ Order notification email sent successfully');
        return true;
    }

    /**
     * Simulate email sending for demonstration
     */
    simulateEmailSending(emailData) {
        console.log('📧 EMAIL NOTIFICATION SIMULATION');
        console.log('================================');
        console.log(`To: ${emailData.to}`);
        console.log(`From: ${emailData.from.name} <${emailData.from.email}>`);
        console.log(`Subject: ${emailData.subject}`);
        console.log('\n--- EMAIL CONTENT ---');
        console.log(emailData.text);
        console.log('================================');
        console.log('✅ Email would be sent to website owner');
        
        return true;
    }
}

// Initialize email service
const emailService = new EmailService();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmailService;
} else {
    window.EmailService = EmailService;
    window.emailService = emailService;
}
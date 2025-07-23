/**
 * Configuration file for SecureShop
 * Website owner settings and email notifications
 */

const CONFIG = {
    // Website owner email for order notifications
    OWNER_EMAIL: 'your-email@example.com', // Change this to your actual email address
    
    // Email notification settings
    EMAIL_SETTINGS: {
        fromEmail: 'noreply@secureshop.example',
        fromName: 'SecureShop',
        replyTo: 'support@secureshop.example',
        
        // Email templates
        orderNotificationSubject: 'New Order Received - Order ID: {ORDER_ID}',
        
        // Privacy notice for emails
        privacyNotice: 'This notification contains encrypted customer data. Delete after processing.'
    },
    
    // Security settings
    SECURITY: {
        encryptCustomerData: true,
        deleteCustomerDataAfterDelivery: true,
        maxDataRetentionDays: 7
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
const twilio = require('twilio');

class PhoneVerificationService {
  constructor() {
    this.client = null;
    this.isInitialized = false;
    this.mockMode = process.env.NODE_ENV === 'development' && !process.env.TWILIO_ACCOUNT_SID;
    
    this.initializeClient();
  }

  initializeClient() {
    try {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        this.isInitialized = true;
        console.log('Twilio client initialized successfully');
      } else if (this.mockMode) {
        console.log('Running in mock mode - SMS verification disabled for development');
        this.isInitialized = true;
      } else {
        console.error('Twilio credentials not found. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.');
      }
    } catch (error) {
      console.error('Failed to initialize Twilio client:', error.message);
    }
  }

  /**
   * Send SMS verification code
   * @param {string} phoneNumber - Phone number to send SMS to
   * @param {string} verificationCode - The 6-digit verification code
   * @returns {Promise<object>} - Result of SMS send operation
   */
  async sendVerificationSMS(phoneNumber, verificationCode) {
    if (!this.isInitialized) {
      throw new Error('Phone verification service is not initialized');
    }

    // Format phone number (add country code if missing)
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    
    const message = `Your ServisbetA verification code is: ${verificationCode}. This code will expire in 10 minutes.`;

    try {
      if (this.mockMode) {
        // Mock mode for development
        console.log(`[MOCK SMS] To: ${formattedPhone}, Code: ${verificationCode}`);
        return {
          success: true,
          messageId: `mock_${Date.now()}`,
          phone: formattedPhone,
          code: verificationCode // Only in mock mode
        };
      }

      const twilioMessage = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone
      });

      console.log(`SMS sent successfully to ${formattedPhone}. Message SID: ${twilioMessage.sid}`);
      
      return {
        success: true,
        messageId: twilioMessage.sid,
        phone: formattedPhone
      };
      
    } catch (error) {
      console.error('Failed to send SMS:', error);
      
      // Handle specific Twilio errors
      if (error.code === 21211) {
        throw new Error('Invalid phone number format');
      } else if (error.code === 21408) {
        throw new Error('SMS sending is not allowed to this phone number');
      } else if (error.code === 21614) {
        throw new Error('Phone number is not a valid mobile number');
      }
      
      throw new Error('Failed to send verification code. Please try again later.');
    }
  }

  /**
   * Format phone number to international format
   * @param {string} phoneNumber - Raw phone number
   * @returns {string} - Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Add country code if missing (assuming US/CA for now)
    if (cleanPhone.length === 10) {
      return `+1${cleanPhone}`;
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
      return `+${cleanPhone}`;
    } else if (cleanPhone.startsWith('234') && cleanPhone.length === 13) {
      // Nigerian phone number format
      return `+${cleanPhone}`;
    } else if (cleanPhone.startsWith('234') && cleanPhone.length === 10) {
      return `+234${cleanPhone}`;
    }
    
    // Return as is if already in international format or unknown format
    return phoneNumber.startsWith('+') ? phoneNumber : `+${cleanPhone}`;
  }

  /**
   * Validate phone number format
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} - True if valid
   */
  isValidPhoneNumber(phoneNumber) {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Check for common valid formats
    if (cleanPhone.length >= 10 && cleanPhone.length <= 15) {
      return true;
    }
    
    return false;
  }

  /**
   * Generate a 6-digit verification code
   * @returns {string} - 6-digit verification code
   */
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Check rate limiting for phone number
   * @param {string} phoneNumber - Phone number to check
   * @param {number} windowMinutes - Time window in minutes
   * @param {number} maxAttempts - Maximum attempts allowed
   * @returns {Promise<boolean>} - True if within limits
   */
  async checkRateLimit(phoneNumber, windowMinutes = 60, maxAttempts = 5) {
    // This would typically use Redis or database to track attempts
    // For now, we'll implement basic memory-based rate limiting
    
    const key = `sms_rate_limit:${phoneNumber}`;
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    
    // In a production environment, you'd use Redis for this
    // For now, we'll return true and implement proper rate limiting later
    return true;
  }

  /**
   * Resend verification code with rate limiting
   * @param {string} phoneNumber - Phone number
   * @param {string} verificationCode - New verification code
   * @returns {Promise<object>} - Result of resend operation
   */
  async resendVerificationCode(phoneNumber, verificationCode) {
    // Check rate limiting
    const withinLimits = await this.checkRateLimit(phoneNumber, 5, 2); // 2 attempts per 5 minutes
    
    if (!withinLimits) {
      throw new Error('Too many SMS requests. Please wait before requesting another code.');
    }
    
    return this.sendVerificationSMS(phoneNumber, verificationCode);
  }
}

// Singleton instance
const phoneVerificationService = new PhoneVerificationService();

module.exports = phoneVerificationService;
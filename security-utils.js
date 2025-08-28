/* Security Utilities - XSS Protection and Safe DOM Manipulation */

// XSS Protection utility functions
const SecurityUtils = {
  // HTML sanitizer to prevent XSS attacks
  sanitizeHTML: function(html) {
    if (typeof html !== 'string') return '';
    
    // Create a temporary div element
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
  },

  // Safe innerHTML replacement that sanitizes content
  safeInnerHTML: function(element, content) {
    if (!element) return;
    
    // If content contains HTML tags, sanitize it
    if (/<[^>]*>/g.test(content)) {
      // Allow only safe HTML tags
      const allowedTags = ['p', 'br', 'strong', 'em', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
      const sanitized = content.replace(/<(\/?)([\w]+)([^>]*)>/g, (match, slash, tag, attributes) => {
        const lowerTag = tag.toLowerCase();
        if (allowedTags.includes(lowerTag)) {
          // Remove dangerous attributes
          const safeAttrs = attributes.replace(/(on\w+|javascript:|data:)/gi, '');
          return `<${slash}${lowerTag}${safeAttrs}>`;
        }
        return '';
      });
      element.innerHTML = sanitized;
    } else {
      // Plain text content
      element.textContent = content;
    }
  },

  // Safe attribute setter
  safeSetAttribute: function(element, attribute, value) {
    if (!element || !attribute) return;
    
    // Prevent dangerous attributes
    const dangerousAttrs = ['onclick', 'onload', 'onerror', 'javascript:', 'data:'];
    if (dangerousAttrs.some(danger => attribute.toLowerCase().includes(danger.toLowerCase()))) {
      console.warn(`⚠️ Blocked potentially dangerous attribute: ${attribute}`);
      return;
    }
    
    element.setAttribute(attribute, String(value));
  },

  // Safe URL validator
  isSafeURL: function(url) {
    if (!url) return false;
    
    try {
      const urlObj = new URL(url, window.location.origin);
      // Allow only safe protocols
      return ['http:', 'https:', 'mailto:', 'tel:'].includes(urlObj.protocol);
    } catch (e) {
      return false;
    }
  },

  // Safe window.open replacement
  safeWindowOpen: function(url, target = '_blank', features = '') {
    if (!this.isSafeURL(url)) {
      console.warn('⚠️ Blocked potentially unsafe URL:', url);
      return null;
    }
    
    const newWindow = window.open(url, target, features);
    
    // Security: Remove opener reference to prevent tab nabbing
    if (newWindow) {
      newWindow.opener = null;
    }
    
    return newWindow;
  },

  // Content Security Policy helper
  addCSPMeta: function() {
    if (document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      return; // CSP already set
    }
    
    const meta = document.createElement('meta');
    meta.setAttribute('http-equiv', 'Content-Security-Policy');
    meta.setAttribute('content', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://www.gstatic.com; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https://*.firebaseapp.com https://*.googleapis.com; " +
      "font-src 'self' data:; " +
      "object-src 'none'; " +
      "base-uri 'self';"
    );
    
    document.head.appendChild(meta);
  }
};

// Global helper functions for backward compatibility
window.sanitizeHTML = SecurityUtils.sanitizeHTML;
window.safeInnerHTML = SecurityUtils.safeInnerHTML;
window.safeSetAttribute = SecurityUtils.safeSetAttribute;
window.safeWindowOpen = SecurityUtils.safeWindowOpen;

// Initialize security measures when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    SecurityUtils.addCSPMeta();
  });
} else {
  SecurityUtils.addCSPMeta();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecurityUtils;
} else {
  window.SecurityUtils = SecurityUtils;
}
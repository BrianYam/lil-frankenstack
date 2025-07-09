/**
 * Authentication configuration
 */
export const AUTH_CONFIG = {
  /**
   * URLs that should not trigger a redirect to login when authentication fails
   * These include public pages and authentication-related pages
   */
  NON_AUTH_REDIRECT_URLS: [
    // Authentication related paths
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    // Public pages
    '/',
    '/about',
    '/contact',
    '/privacy-policy',
    '/terms-of-service',
  ],
};

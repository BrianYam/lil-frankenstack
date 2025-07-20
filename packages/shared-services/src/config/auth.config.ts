/**
 * Authentication configuration
 */
export const AUTH_CONFIG = {
  /**
   * Path that should not trigger a redirect to FE login when authentication fails
   * These include public pages and authentication-related pages
   */
  NON_FE_LOGIN_REDIRECT_PATHS: [
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

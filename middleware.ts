import { createAuthMiddleware } from 'cosmic-authentication';

// Create middleware with protected routes
// All configuration can now be optional - defaults are handled internally
export const middleware = createAuthMiddleware({
  protectedRoutes: [
    '/dashboard',
    '/studio',
    '/templates/launch',
  ]
});

// Use the default matcher config or customize as needed
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|api/|login|callback|auth/|images/|fonts/|static/|public/|favicon.ico).*)',
  ]
};
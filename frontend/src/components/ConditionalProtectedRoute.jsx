import React from 'react';
import ProtectedRoute from './ProtectedRoute';

/**
 * ConditionalProtectedRoute Component
 * 
 * Conditionally protects routes based on environment mode.
 * - In production (VITE_DEMO_MODE=false): Requires authentication via ProtectedRoute
 * - In demo mode (VITE_DEMO_MODE=true): Publicly accessible, no authentication required
 * 
 * This allows the same codebase to be deployed to:
 * - Production environment: Private site requiring login
 * - Demo environment: Public site for showcasing
 * 
 * Environment variables are set in Render Environment Groups:
 * - Production: VITE_DEMO_MODE=false
 * - Demo: VITE_DEMO_MODE=true
 * 
 * Usage:
 *   <ConditionalProtectedRoute>
 *     <YourComponent />
 *   </ConditionalProtectedRoute>
 */
const ConditionalProtectedRoute = ({ children }) => {
  // Check if we're in demo mode via environment variable
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  // If demo mode, don't require auth - just render children directly
  if (isDemoMode) {
    return children;
  }

  // Otherwise, require authentication via ProtectedRoute
  return <ProtectedRoute>{children}</ProtectedRoute>;
};

export default ConditionalProtectedRoute;




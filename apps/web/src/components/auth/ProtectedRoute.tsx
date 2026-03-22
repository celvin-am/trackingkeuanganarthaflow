import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../../lib/auth';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { data: session, isPending } = useSession();
  const location = useLocation();

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!session) {
    // Redirect them to the /sign-in page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience.
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

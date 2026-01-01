import { ReactNode, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, initializing } = useAuth();

    useEffect(() => {
        if (!initializing && !isAuthenticated) {
            window.location.href = '/login';
        }
    }, [initializing, isAuthenticated]);

    if (initializing) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <div className="min-h-screen flex items-center justify-center">Redirecting to login...</div>;
    }

    return <>{children}</>;
}

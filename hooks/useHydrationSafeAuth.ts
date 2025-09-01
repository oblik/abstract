/**
 * Hydration-safe authentication hook
 * Solves SSR-CSR auth state mismatch issues
 */
import { useState, useEffect } from 'react';
import { useSelector } from '@/store';
import { getAuthToken } from '@/lib/cookies';

export const useHydrationSafeAuth = () => {
    const [isHydrated, setIsHydrated] = useState(false);
    const { signedIn } = useSelector((state: any) => state.auth?.session);
    const data = useSelector((state: any) => state?.auth?.user);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    const isAuthenticated = () => {
        // During SSR or before hydration, return false to avoid mismatch
        if (!isHydrated) {
            return false;
        }

        // After hydration, check all auth requirements
        const token = getAuthToken();
        return signedIn && data && (data.id || data._id) && token;
    };

    return {
        isAuthenticated: isAuthenticated(),
        isHydrated,
        user: data,
        token: isHydrated ? getAuthToken() : null
    };
};

import { setCookie, getCookie } from "cookies-next";

export const setAuthToken = async (token: any) => {
    // Set cookie using cookies-next (for SSR compatibility)
    setCookie("user-token", token, {
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
    });

    // Also set cookie directly on document for immediate client-side access
    if (typeof document !== 'undefined') {
        const maxAge = 60 * 60 * 24 * 7; // 7 days in seconds
        const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
        document.cookie = `user-token=${token}; path=/; max-age=${maxAge}; expires=${expires}`;
    }
};

export const getAuthToken = () => {
    // Try document.cookie first for immediate client-side access
    if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        const userTokenCookie = cookies.find(cookie => cookie.trim().startsWith('user-token='));
        if (userTokenCookie) {
            const token = userTokenCookie.split('=')[1];
            if (token && token !== 'undefined' && token !== 'null') {
                return token;
            }
        }
    }

    // Fallback to cookies-next
    const token = getCookie("user-token");
    if (token && token !== 'undefined' && token !== 'null') {
        return token;
    }

    return null;
};

export const removeAuthToken = () => {
    // cookies.remove("user-token", { path: "/" });
};
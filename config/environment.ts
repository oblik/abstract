// RECOMMENDED: Centralized environment configuration
// config/environment.ts

export const getEnvironment = () => {
    return {
        isDevelopment: process.env.NODE_ENV !== "production",
        isProduction: process.env.NODE_ENV === "production",
        isServer: typeof window === "undefined",
        isClient: typeof window !== "undefined"
    };
};

export const getApiBaseUrl = () => {
    const env = getEnvironment();

    if (env.isProduction) {
        return "https://sonotradesdemo.wearedev.team";
    }

    // Development
    if (env.isServer) {
        // SSR needs full URL
        return "https://sonotradesdemo.wearedev.team";
    }

    // Client-side can use Next.js proxy
    return "";
};

export const getFreeIpApiBaseUrl = () => {
    const env = getEnvironment();

    if (env.isProduction) {
        return "https://freeipapi.com";
    }

    return "/freeipapi"; // Next.js proxy
};

// Replace all individual getApiBaseUrl functions with this centralized one

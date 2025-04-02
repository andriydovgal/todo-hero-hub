export const env = {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    baseUrl: import.meta.env.PROD
        ? "https://todo-hero-hub.lovable.app"
        : "http://localhost:8080",
    getResetPasswordUrl: () => {
        console.log('Environment:', {
            isDev: import.meta.env.DEV,
            isProd: import.meta.env.PROD,
            baseUrl: import.meta.env.PROD
                ? "https://todo-hero-hub.lovable.app"
                : "http://localhost:8080",
            finalUrl: `${env.baseUrl}/reset-password`
        });
        return `${env.baseUrl}/reset-password`;
    },
}; 
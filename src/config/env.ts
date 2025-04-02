export const env = {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    baseUrl: import.meta.env.PROD
        ? "https://todo-hero-hub.lovable.app"
        : "http://localhost:8080",
    getResetPasswordUrl: () => `${env.baseUrl}/reset-password`,
}; 
export const env = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  baseUrl: import.meta.env.VITE_BASE_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:8080'),
  getResetPasswordUrl: () => `${env.baseUrl}/reset-password`,
}; 
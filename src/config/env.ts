export const env = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  baseUrl: import.meta.env.VITE_BASE_URL,
  getResetPasswordUrl: () => `${env.baseUrl}/reset-password`,
}; 
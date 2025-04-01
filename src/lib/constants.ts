export const SUPABASE_URL = 'zbljejuuujfjgpcxainn';

export const STORAGE_KEYS = {
  AUTH_TOKEN: `sb-${SUPABASE_URL}-auth-token`,
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]; 
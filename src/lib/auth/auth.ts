/**
 * Authentication utilities for Laravel backend integration
 */

import { login as laravelLogin, logout as laravelLogout, getUser as laravelGetUser } from '@/lib/api/laravel';

export { auth, signIn, signOut, handlers } from '@/app/api/auth/[...nextauth]/authOptions';

// Re-export Laravel auth functions for easy access
export { laravelLogin, laravelLogout, laravelGetUser };
/**
 * Authentication Context for Laravel Backend
 * 
 * This provides a React context for managing authentication state
 * across your Next.js application when using Laravel backend.
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as laravelLogin, logout as laravelLogout, getUser as laravelGetUser } from '@/lib/api/laravel';

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const userData = await laravelGetUser();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const userData = await laravelLogin({ email, password });
    setUser(userData);
  }

  async function logout() {
    await laravelLogout();
    setUser(null);
  }

  async function refreshUser() {
    try {
      const userData = await laravelGetUser();
      setUser(userData);
    } catch (error) {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Example usage in layout.tsx:
// import { AuthProvider } from '@/lib/auth/AuthContext';
// 
// export default function RootLayout({ children }) {
//   return (
//     <html>
//       <body>
//         <AuthProvider>
//           {children}
//         </AuthProvider>
//       </body>
//     </html>
//   );
// }

// Example usage in components:
// import { useAuth } from '@/lib/auth/AuthContext';
// 
// export default function ProfilePage() {
//   const { user, loading, logout } = useAuth();
//   
//   if (loading) return <div>Loading...</div>;
//   if (!user) return <div>Not authenticated</div>;
//   
//   return (
//     <div>
//       <h1>Welcome, {user.name}</h1>
//       <button onClick={logout}>Logout</button>
//     </div>
//   );
// }

import React, { createContext, useState, useEffect } from 'react';

interface User {
  id: number;
  tenantId: number;
  email: string;
  firstName: string;
  lastName: string;
  tenantName?: string | null;
  roles?: string[];
  isSuperAdmin?: boolean;
  isTenantAdmin?: boolean;
}

interface AuthContextValue {
  user: User | null;
  login: (data: { accessToken: string; user: User }) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const login = ({ accessToken, user }: { accessToken: string; user: User }) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};


import React, { createContext, useState } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  function login(username, password) {
    // In a real app: call server, verify credentials, get token, etc.
    // For now, accept any non-empty username/password
    if (username && password) {
      setUser({ username });
      return true;
    }
    return false;
  }

  function logout() {
    setUser(null);
  }

  const value = {
    user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

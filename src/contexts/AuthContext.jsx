import { createContext, useContext, useEffect, useState } from "react";
import api from "@/api/client";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState(null);

  const fetchMe = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }
      const data = await api.get('/auth/me');
      setUser(data.user);
      setProfile(data.profile);
      setIsAdmin(data.isAdmin);
    } catch (err) {
      // Token invalid or expired
      localStorage.removeItem('auth_token');
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (localStorage.getItem('auth_token')) {
      await fetchMe();
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const signUp = async (email, password, fullName) => {
    try {
      const data = await api.post('/auth/register', { email, password, full_name: fullName });
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
      await fetchMe();
      return { error: null };
    } catch (err) {
      return { error: { message: err.message } };
    }
  };

  const signIn = async (email, password) => {
    try {
      const data = await api.post('/auth/login', { email, password });
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
      await fetchMe();
      return { error: null };
    } catch (err) {
      return { error: { message: err.message } };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, session: null, loading, isAdmin, profile, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

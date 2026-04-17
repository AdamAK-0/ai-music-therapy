import React, { createContext, useContext, useState, useEffect } from "react";
import { API_BASE_URL } from "../apiConfig";
import { authFetch, clearAuthToken } from "../authToken";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Function to check authentication status
  const checkAuthStatus = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/auth/check`, {
        method: "GET",
      });
      const data = await response.json();

      if (response.ok && data.authenticated) {
        setUser(data.user);
      } else {
        clearAuthToken();
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      clearAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // check when component mounts
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const signOut = async () => {
    try {
      await authFetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
      });
      clearAuthToken();
      setUser(null); // clear local state immediately
    } catch (error) {
      console.error("Logout failed:", error);
      clearAuthToken();
      setUser(null);
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, loading, setUser, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

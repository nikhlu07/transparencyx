"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";

type Role = "main-government" | "state-head" | "deputy" | "vendor" | "supplier" | "sub-supplier" | "public";

interface User {
  address: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  login: (address: string, role: Role) => void;
  logout: () => void;
  connectMetaMask: () => Promise<void>;
  isMetaMaskConnected: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on initial render
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("cleargov-user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setIsMetaMaskConnected(true); // Assume MetaMask is connected if user exists
      }
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (address: string, role: Role) => {
    const newUser = { address, role };
    setUser(newUser);
    setIsMetaMaskConnected(true); // Mark MetaMask as connected
    if (typeof window !== "undefined") {
      localStorage.setItem("cleargov-user", JSON.stringify(newUser));
    }
  };

  const logout = () => {
    setUser(null);
    setIsMetaMaskConnected(false); // Reset MetaMask connection state
    if (typeof window !== "undefined") {
      localStorage.removeItem("cleargov-user");
    }
  };

  const connectMetaMask = async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask not detected. Please install MetaMask.");
    }

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts.length > 0) {
        const address = accounts[0];
        setIsMetaMaskConnected(true);
        if (!user) {
          // If user is not logged in, default to "public" role
          login(address, "public");
        }
      } else {
        throw new Error("No accounts found. Please create an account in MetaMask.");
      }
    } catch (err: any) {
      console.error("MetaMask connection error:", err);
      throw new Error(err.message || "Failed to connect to MetaMask.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        connectMetaMask,
        isMetaMaskConnected,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { initWeb3Auth, loginWithGoogle, logout as web3Logout } from "@/lib/web3auth";
import { getSignerFromProvider, initSmartAccount } from "@/lib/biconomy";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  smartAccountAddress: string | null;
  userEmail: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  smartAccount: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [smartAccount, setSmartAccount] = useState<any>(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  async function initializeAuth() {
    try {
      await initWeb3Auth();
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to initialize auth:", error);
      setIsLoading(false);
    }
  }

  async function login() {
    try {
      setIsLoading(true);
      const provider = await loginWithGoogle();
      
      if (!provider) {
        throw new Error("No provider returned from login");
      }

      const signer = await getSignerFromProvider(provider);
      const { smartAccount: sa, saAddress } = await initSmartAccount(signer);
      
      setSmartAccount(sa);
      setSmartAccountAddress(saAddress);

      // Store user mapping in database
      const { data, error } = await supabase.functions.invoke("account-create", {
        body: { smartAccountAddress: saAddress },
      });

      if (error) {
        console.error("Failed to create account mapping:", error);
        throw error;
      }

      if (data?.email) {
        setUserEmail(data.email);
      }

      setIsAuthenticated(true);
      toast.success("Successfully logged in!");
    } catch (error: any) {
      console.error("Login failed:", error);
      toast.error(error.message || "Failed to login");
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    try {
      await web3Logout();
      setIsAuthenticated(false);
      setSmartAccountAddress(null);
      setUserEmail(null);
      setSmartAccount(null);
      toast.success("Successfully logged out");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Failed to logout");
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        smartAccountAddress,
        userEmail,
        login,
        logout,
        smartAccount,
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

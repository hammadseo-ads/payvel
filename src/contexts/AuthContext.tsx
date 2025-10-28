import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { initWeb3Auth, loginWithGoogle, logout as web3Logout } from "@/lib/web3auth";
import { initSimpleSmartAccount, shortenAddress } from "@/lib/biconomy-simple";
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
      const web3auth = await initWeb3Auth();
      
      // Check if user returned from redirect
      const isConnected = 
        (web3auth as any).connected === true ||
        (web3auth as any).status === "connected" ||
        !!web3auth.provider;
      
      console.log("🔍 Connection status:", { isConnected, provider: !!web3auth.provider });
      
      if (isConnected && web3auth.provider) {
        console.log("🔄 Resuming login after redirect...");
        
        // Get user info
        const userInfo = await web3auth.getUserInfo();
        
        if (!userInfo) {
          console.warn("⚠️ No user info after resume");
          setIsLoading(false);
          return;
        }
        
        console.log("👤 User email:", userInfo.email);
        
        // Check for ID token in user info
        const idToken = (userInfo as any)?.idToken;
        console.log("🔑 ID Token present:", !!idToken);
        
        if (!idToken) {
          console.warn("⚠️ No ID Token - proceeding without backend verification token");
        }
        
        // Initialize smart account
        console.log("🔧 Initializing smart account...");
        const { smartAccount, saAddress } = await initSimpleSmartAccount();
        setSmartAccount(smartAccount);
        setSmartAccountAddress(saAddress);
        console.log("✅ Smart account initialized:", saAddress);
        
        // Store user mapping in database
        const { data, error } = await supabase.functions.invoke("account-create", {
          body: { smartAccountAddress: saAddress },
        });
        
        if (error) {
          console.error("Failed to create account mapping:", error);
        }
        
        if (data?.email) {
          setUserEmail(data.email);
        }
        
        setIsAuthenticated(true);
        toast.success("Successfully logged in!");
      }
      
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

      // Initialize Biconomy smart account with Web3Auth provider
      const { smartAccount, saAddress } = await initSimpleSmartAccount();
      
      setSmartAccount(smartAccount);
      setSmartAccountAddress(saAddress);

      // Store user mapping in database
      const { data, error } = await supabase.functions.invoke("account-create", {
        body: { smartAccountAddress: saAddress },
      });

      if (error) {
        console.error("Failed to create account mapping:", error);
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

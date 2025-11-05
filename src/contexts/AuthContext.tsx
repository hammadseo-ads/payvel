import React, { createContext, useContext, useState, useEffect } from "react";
import { useWeb3Auth } from "@web3auth/modal/react";
import { initSimpleSmartAccount } from "@/lib/biconomy-simple";
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
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { web3Auth, isConnected, provider: web3AuthProvider, status } = useWeb3Auth();
  const [provider, setProvider] = useState<any>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);
  const [smartAccount, setSmartAccount] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Sync provider from Web3Auth hook
  useEffect(() => {
    if (web3AuthProvider) {
      setProvider(web3AuthProvider);
    }
  }, [web3AuthProvider]);

  // Initialize Biconomy when provider is available
  useEffect(() => {
    if (provider && !smartAccountAddress && !isInitializing) {
      initializeBiconomy();
    }
  }, [provider, smartAccountAddress]);

  const getIdToken = async (): Promise<string | null> => {
    if (!provider) return null;
    
    try {
      const idToken = await provider.request({ method: "eth_private_key" }) as string;
      return idToken;
    } catch (error) {
      console.error("Failed to get ID token:", error);
      return null;
    }
  };

  const initializeBiconomy = async () => {
    if (isInitializing) return;
    
    try {
      setIsInitializing(true);
      console.log("🔧 Initializing Biconomy smart account...");

      // Get user info for email
      if (web3Auth) {
        const userInfo = await web3Auth.getUserInfo();
        setUserEmail(userInfo?.email || null);
      }

      // Initialize smart account
      const { smartAccount: sa, saAddress } = await initSimpleSmartAccount();
      setSmartAccount(sa);
      setSmartAccountAddress(saAddress);

      console.log("✅ Smart account initialized:", saAddress);

      // Get ID token for backend authentication
      const idToken = await getIdToken();

      if (!idToken) {
        console.error("❌ Failed to get ID token");
        return;
      }

      // Store user in database
      const { error } = await supabase.functions.invoke('account-create', {
        body: {
          smartAccountAddress: saAddress,
          idToken: idToken,
        }
      });

      if (error) {
        console.error("❌ Failed to create account:", error);
        toast.error("Failed to create account");
      } else {
        console.log("✅ Account created successfully");
        toast.success("Account created successfully!");
      }
    } catch (error) {
      console.error("❌ Error initializing Biconomy:", error);
      toast.error("Failed to initialize wallet");
    } finally {
      setIsInitializing(false);
    }
  };

  const login = async () => {
    if (!web3Auth) {
      toast.error("Web3Auth not initialized");
      return;
    }

    try {
      console.log("🔐 Starting login...");
      await web3Auth.connect();
    } catch (error) {
      console.error("❌ Login failed:", error);
      toast.error("Login failed. Please try again.");
      throw error;
    }
  };

  const logout = async () => {
    if (!web3Auth) return;

    try {
      console.log("🚪 Logging out...");
      await web3Auth.logout();
      setProvider(null);
      setSmartAccountAddress(null);
      setSmartAccount(null);
      setUserEmail(null);
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("❌ Logout failed:", error);
      toast.error("Logout failed");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: isConnected && !!smartAccountAddress,
        isLoading: isInitializing || !web3Auth,
        smartAccountAddress,
        userEmail,
        login,
        logout,
        smartAccount,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

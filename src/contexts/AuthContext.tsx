import React, { createContext, useContext, useState, useEffect } from "react";
import { useWeb3AuthConnect, useWeb3AuthDisconnect, useWeb3AuthUser } from "@web3auth/modal/react";
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
  const { connect, isConnected } = useWeb3AuthConnect();
  const { disconnect } = useWeb3AuthDisconnect();
  const { userInfo } = useWeb3AuthUser();
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);
  const [smartAccount, setSmartAccount] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize Biconomy when connected
  useEffect(() => {
    if (isConnected && !smartAccountAddress && !isInitializing) {
      initializeBiconomy();
    }
  }, [isConnected, smartAccountAddress]);

  const getIdToken = async (): Promise<string | null> => {
    const provider = (window as any).ethereum;
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
    try {
      console.log("🔐 Starting login...");
      await connect();
    } catch (error) {
      console.error("❌ Login failed:", error);
      toast.error("Login failed. Please try again.");
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log("🚪 Logging out...");
      await disconnect();
      setSmartAccountAddress(null);
      setSmartAccount(null);
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
        isLoading: isInitializing,
        smartAccountAddress,
        userEmail: userInfo?.email || null,
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

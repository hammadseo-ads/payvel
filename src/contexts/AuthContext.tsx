import React, { createContext, useContext, useState, useEffect } from "react";
import { useWeb3AuthConnect, useWeb3AuthDisconnect, useWeb3AuthUser, useWeb3Auth } from "@web3auth/modal/react";
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
  loginError: string | null;
  retryLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connect, isConnected, error: connectError } = useWeb3AuthConnect();
  const { disconnect } = useWeb3AuthDisconnect();
  const { userInfo } = useWeb3AuthUser();
  const web3auth = useWeb3Auth();
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);
  const [smartAccount, setSmartAccount] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginAttemptTime, setLoginAttemptTime] = useState<number | null>(null);

  // Monitor Web3Auth connection errors
  useEffect(() => {
    if (connectError) {
      console.error("❌ Web3Auth connection error:", connectError);
      setLoginError(connectError.message || "Failed to connect with Web3Auth");
      setIsInitializing(false);
      setLoginAttemptTime(null);
      toast.error(`Connection failed: ${connectError.message}`);
    }
  }, [connectError]);

  // Monitor login timeout
  useEffect(() => {
    if (isInitializing && loginAttemptTime) {
      const timeout = setTimeout(() => {
        if (isInitializing) {
          console.error("⏱️ Login timeout - initialization taking too long");
          setLoginError("Login is taking longer than expected. Please try again.");
          setIsInitializing(false);
          toast.error("Login timeout. Please try again.");
        }
      }, 60000); // 60 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isInitializing, loginAttemptTime]);

  // Log connection state changes for debugging
  useEffect(() => {
    console.log("🔄 Connection state:", {
      isConnected,
      hasSmartAccount: !!smartAccountAddress,
      isInitializing,
      userEmail: userInfo?.email,
      hasConnectError: !!connectError,
    });
  }, [isConnected, smartAccountAddress, isInitializing, userInfo, connectError]);

  // Initialize Biconomy when connected
  useEffect(() => {
    if (isConnected && !smartAccountAddress && !isInitializing) {
      console.log("✅ Web3Auth connection detected, initializing Biconomy...");
      initializeBiconomy();
    }
  }, [isConnected, smartAccountAddress]);


  const initializeBiconomy = async () => {
    if (isInitializing) {
      console.log("⏳ Already initializing, skipping...");
      return;
    }
    
    try {
      setIsInitializing(true);
      setLoginError(null);
      console.log("🔧 Initializing Biconomy smart account...");

      // Check if provider is available from Web3Auth instance
      const provider = web3auth?.provider;
      if (!provider) {
        throw new Error("Provider not available. Web3Auth may not have completed authentication.");
      }
      console.log("✅ Provider available from Web3Auth instance");

      // Wait a bit for provider to be fully ready
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Initialize smart account
      console.log("🔧 Creating smart account...");
      const { smartAccount: sa, saAddress } = await initSimpleSmartAccount(provider);
      setSmartAccount(sa);
      setSmartAccountAddress(saAddress);

      console.log("✅ Smart account initialized:", saAddress);
      toast.success("Wallet ready! You can now send transactions.");
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error occurred";
      console.error("❌ Error initializing Biconomy:", error);
      setLoginError(errorMessage);
      
      // Reset states on error
      setSmartAccountAddress(null);
      setSmartAccount(null);
      
      toast.error(`Failed to initialize wallet: ${errorMessage}`);
    } finally {
      setIsInitializing(false);
      setLoginAttemptTime(null);
    }
  };

  const login = async () => {
    try {
      setLoginError(null);
      setLoginAttemptTime(Date.now());
      console.log("🔐 Starting Web3Auth login...");
      
      await connect();
      
      console.log("✅ Web3Auth connect() completed");
    } catch (error: any) {
      const errorMessage = error?.message || "Authentication failed";
      console.error("❌ Login failed:", error);
      setLoginError(errorMessage);
      setLoginAttemptTime(null);
      
      // Provide more specific error messages
      if (errorMessage.includes("User closed")) {
        toast.error("Login cancelled");
      } else if (errorMessage.includes("popup")) {
        toast.error("Please allow popups for this site");
      } else {
        toast.error(`Login failed: ${errorMessage}`);
      }
      
      throw error;
    }
  };

  const retryLogin = async () => {
    console.log("🔄 Retrying login...");
    setLoginError(null);
    setSmartAccountAddress(null);
    setSmartAccount(null);
    await login();
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
        loginError,
        retryLogin,
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

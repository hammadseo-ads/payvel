import { getWeb3AuthInstance } from "./web3auth-bootstrap";
import { WALLET_CONNECTORS, AUTH_CONNECTION } from "@web3auth/modal";

export async function getWeb3Auth() {
  return getWeb3AuthInstance();
}

export async function initWeb3Auth() {
  try {
    const instance = await getWeb3Auth();
    return instance;
  } catch (error) {
    console.error("Error initializing Web3Auth:", error);
    throw error;
  }
}

async function loginWithProvider(authConnection: string, authConnectionId: string) {
  try {
    const web3auth = await getWeb3Auth();
    
    console.log('🔐 Logging in with connection:', authConnectionId);
    
    // Clear stale session data
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.startsWith('Web3Auth') || key.startsWith('openlogin')
    );
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('🧹 Cleared stale session data:', keysToRemove.length, 'keys');
    
    // V10 API - Connect using AUTH connector
    const provider = await web3auth.connectTo(WALLET_CONNECTORS.AUTH, {
      authConnection,
      authConnectionId,
    });
    
    if (!provider) {
      throw new Error("No provider returned from login");
    }
    
    console.log("✅ Provider connected");
    
    // Wait for accounts to be available
    const accounts = await provider.request({ method: "eth_accounts" }) as string[];
    console.log("👛 Accounts:", accounts.length > 0 ? "received" : "MISSING");
    
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts available after login");
    }
    
    // Verify chain
    const chainId = await provider.request({ method: "eth_chainId" }) as string;
    console.log("⛓️ Connected to chain:", chainId, chainId === "0x14A34" ? "✅ Base Sepolia" : "⚠️ WRONG CHAIN");
    
    if (chainId !== "0x14A34") {
      console.warn("⚠️ Provider is on wrong chain. Expected 0x14A34 (Base Sepolia), got", chainId);
    }
    
    // Get user info
    const userInfo = await web3auth.getUserInfo();
    console.log("✅ User Info:", userInfo ? "received" : "MISSING");
    console.log("👤 User email:", userInfo?.email);
    
    if (!userInfo) {
      throw new Error("Authentication failed - no user info received");
    }
    
    // Get Identity Token
    const tokenInfo = await web3auth.getIdentityToken();
    const idToken = typeof tokenInfo === 'string' ? tokenInfo : (tokenInfo as any)?.idToken;
    console.log("🔑 ID Token:", idToken ? "received" : "MISSING");
    
    if (!idToken) {
      throw new Error("Failed to retrieve ID token - authentication incomplete");
    }
    
    return { provider, idToken: String(idToken) };
  } catch (error) {
    console.error("❌ Error during login:", error);
    throw error;
  }
}

export async function loginWithGoogle() {
  return loginWithProvider(AUTH_CONNECTION.GOOGLE, "payvel-connection");
}

export async function loginWithEmail() {
  return loginWithProvider(AUTH_CONNECTION.EMAIL_PASSWORDLESS, "payvel-email-connection");
}

export async function loginWithSMS() {
  return loginWithProvider(AUTH_CONNECTION.SMS_PASSWORDLESS, "payvel-sms-connection");
}

// Default login uses Google
export async function login() {
  return loginWithGoogle();
}

export async function logout() {
  try {
    console.log("🚪 Starting logout process...");
    
    // 1. Logout from Web3Auth
    const web3auth = await getWeb3Auth();
    await web3auth.logout();
    console.log("✅ Web3Auth logged out");
    
    // 2. Clear ALL Web3Auth-related localStorage
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.startsWith("Web3Auth") || 
      key.startsWith("openlogin") ||
      key.startsWith("@w3a") ||
      key === "w3a-user"
    );
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log("🧹 Removed localStorage key:", key);
    });
    
    // 3. Clear sessionStorage
    sessionStorage.clear();
    console.log("🧹 Cleared sessionStorage");
    
    console.log("✅ Logout cleanup complete");
  } catch (error) {
    console.error("❌ Error during logout:", error);
    
    // Force cleanup even if web3auth.logout() fails
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.startsWith("Web3Auth") || 
      key.startsWith("openlogin") ||
      key.startsWith("@w3a") ||
      key === "w3a-user"
    );
    keysToRemove.forEach(key => localStorage.removeItem(key));
    sessionStorage.clear();
    
    throw error;
  }
}

import { getWeb3AuthInstance } from "./web3auth-bootstrap";

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

async function loginWithModal() {
  try {
    const web3auth = await getWeb3Auth();
    
    console.log('🔐 Opening login modal with all options...');
    
    // Clear any stale Web3Auth session data to prevent chain mismatch
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.startsWith('Web3Auth') || key.startsWith('openlogin')
    );
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('🧹 Cleared stale session data:', keysToRemove.length, 'keys');
    
    // Open modal with explicit redirect URL
    const provider = await web3auth.connect();
    
    if (!provider) {
      throw new Error("No provider returned from login");
    }
    
    // Get user info
    const userInfo = await web3auth.getUserInfo();
    console.log("✅ User Info:", userInfo ? "received" : "MISSING");
    console.log("👤 User email:", userInfo?.email);
    
    if (!userInfo) {
      throw new Error("Authentication failed - no user info received");
    }
    
    // Get Identity Token using getIdentityToken
    const tokenInfo = await web3auth.getIdentityToken();
    const idToken = typeof tokenInfo === 'string' ? tokenInfo : (tokenInfo as any)?.idToken;
    console.log("🔑 ID Token:", idToken ? "received" : "MISSING");
    
    if (!idToken) {
      throw new Error("Failed to retrieve ID token - authentication incomplete");
    }
    
    return { provider, idToken: idToken as string };
  } catch (error) {
    console.error("❌ Error during login:", error);
    throw error;
  }
}

export async function login() {
  return loginWithModal();
}

export async function logout() {
  try {
    const web3auth = await getWeb3Auth();
    await web3auth.logout();
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
}

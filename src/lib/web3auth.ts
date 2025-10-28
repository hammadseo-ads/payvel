import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES } from "@web3auth/base";

const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID || "";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x14A34", // Base Sepolia (84532 in decimal)
  rpcTarget: "https://sepolia.base.org",
  displayName: "Base Sepolia",
  blockExplorerUrl: "https://sepolia.basescan.org",
  ticker: "ETH",
  tickerName: "Ethereum",
};

let web3authInstance: Web3Auth | null = null;

export async function getWeb3Auth() {
  if (web3authInstance) {
    return web3authInstance;
  }

  web3authInstance = new Web3Auth({
    clientId,
    web3AuthNetwork: "sapphire_devnet",
  });

  await web3authInstance.init();
  return web3authInstance;
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

export async function loginWithGoogle() {
  try {
    const web3auth = await getWeb3Auth();
    
    console.log("🔐 Initiating Google login with explicit connection...");
    
    // Explicit Google login with loginProvider option
    const provider = await web3auth.connect();
    
    if (!provider) {
      throw new Error("No provider returned from Google login");
    }
    
    // Get user info
    const userInfo = await web3auth.getUserInfo();
    console.log("✅ User Info:", userInfo ? "received" : "MISSING");
    console.log("👤 User email:", userInfo?.email);
    
    if (!userInfo) {
      throw new Error("Google authentication failed - no user info received");
    }
    
    // CRITICAL: Get Identity Token using authenticateUser
    // Cast to any as the method exists but may not be in type definitions
    const authResult = await (web3auth as any).authenticateUser?.();
    const idToken = authResult?.idToken;
    console.log("🔑 ID Token:", idToken ? "received" : "MISSING");
    
    if (!idToken) {
      console.error("⚠️ Failed to retrieve ID token - authentication may be incomplete");
      // Continue anyway as the provider is available
    }
    
    return { provider, idToken: (idToken as string) || "" };
  } catch (error) {
    console.error("❌ Error logging in with Google:", error);
    throw error;
  }
}

export async function logout() {
  try {
    if (web3authInstance) {
      await web3authInstance.logout();
      web3authInstance = null;
    }
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
}

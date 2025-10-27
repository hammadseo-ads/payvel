import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES } from "@web3auth/base";

const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID || "";

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
    
    console.log("🔐 Initiating Google login...");
    
    // Connect to Web3Auth with Google
    const provider = await web3auth.connect();
    
    if (!provider) {
      throw new Error("No provider returned from Google login");
    }
    
    // Verify user info
    const userInfo = await web3auth.getUserInfo();
    console.log("✅ User Info:", userInfo ? "received" : "MISSING");
    
    if (!userInfo) {
      throw new Error("Google authentication failed - no user info received");
    }
    
    return provider;
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

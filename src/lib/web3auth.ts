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
    chainConfig: {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      chainId: "0x14A34",
      rpcTarget: "https://sepolia.base.org",
      displayName: "Base Sepolia",
      blockExplorerUrl: "https://sepolia.basescan.org",
      ticker: "ETH",
      tickerName: "Ethereum",
    },
    uiConfig: {
      appName: "Payvel",
      loginMethodsOrder: ["google"],
      defaultLanguage: "en",
    },
  } as any);

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
    
    if (!web3auth) {
      throw new Error("Web3Auth not initialized");
    }

    console.log("Starting Google login...");
    const provider = await web3auth.connect();
    
    if (!provider) {
      throw new Error("Failed to get provider from Web3Auth");
    }
    
    console.log("Google login successful, provider obtained");
    return provider;
  } catch (error: any) {
    console.error("Error logging in with Google:", error);
    if (error.message?.includes("User closed the modal")) {
      throw new Error("Login cancelled");
    }
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

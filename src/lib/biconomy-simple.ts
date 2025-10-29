import { getWalletClientFromProvider, initSmartAccount, shortenAddress as biconomyShortenAddress } from "./biconomy";

export function shortenAddress(address: string, chars = 4): string {
  return biconomyShortenAddress(address, chars);
}

export async function initSimpleSmartAccount() {
  try {
    // Get Web3Auth provider
    const web3auth = (await import("./web3auth")).getWeb3Auth();
    const instance = await web3auth;
    const provider = instance.provider;
    
    if (!provider) {
      throw new Error("❌ Provider not available – user must login first");
    }

    console.log("✅ Provider available, creating wallet client...");

    // Create wallet client from Web3Auth provider
    const walletClient = await getWalletClientFromProvider(provider);
    
    // Initialize Biconomy smart account
    const { smartAccount, saAddress } = await initSmartAccount(walletClient);
    
    return {
      smartAccount,
      saAddress
    };
  } catch (error) {
    console.error("Error initializing smart account:", error);
    throw error;
  }
}

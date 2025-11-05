import { ethers } from "ethers";
import { createSmartAccountClient } from "@biconomy/account";

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export async function initSimpleSmartAccount() {
  try {
    // Get Web3Auth provider from window (injected by Web3AuthProvider)
    const provider = (window as any).ethereum;
    
    if (!provider) {
      throw new Error("❌ Provider not available – user must login first");
    }

    console.log("✅ Provider available, creating Ethers provider...");

    // Create Ethers provider from Web3Auth provider
    const ethersProvider = new ethers.providers.Web3Provider(provider);
    
    // Get Ethers signer
    const signer = ethersProvider.getSigner();
    const account = await signer.getAddress();
    console.log("✅ Signer address retrieved:", account);
    
    // Initialize Biconomy smart account with Ethers signer
    const bundlerUrl = import.meta.env.VITE_BICONOMY_BUNDLER_URL || "";
    const biconomyApiKey = import.meta.env.VITE_BICONOMY_API_KEY || "";

    const smartAccount = await createSmartAccountClient({
      signer: signer,
      bundlerUrl,
      biconomyPaymasterApiKey: biconomyApiKey,
      rpcUrl: "https://sepolia.base.org",
      chainId: 84532,
    });

    const saAddress = await smartAccount.getAccountAddress();
    
    return {
      smartAccount,
      saAddress
    };
  } catch (error) {
    console.error("Error initializing smart account:", error);
    throw error;
  }
}

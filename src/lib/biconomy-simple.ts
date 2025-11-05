import { createWalletClient, custom } from "viem";
import { baseSepolia } from "viem/chains";
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

    console.log("✅ Provider available, creating wallet client...");

    // Request account from Web3Auth provider
    const [account] = await provider.request({ 
      method: 'eth_requestAccounts' 
    });

    console.log("✅ Account retrieved:", account);

    // Create wallet client from Web3Auth provider with account
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: custom(provider),
    });
    
    // Initialize Biconomy smart account
    const bundlerUrl = import.meta.env.VITE_BICONOMY_BUNDLER_URL || "";
    const biconomyApiKey = import.meta.env.VITE_BICONOMY_API_KEY || "";

    const smartAccount = await createSmartAccountClient({
      signer: walletClient,
      bundlerUrl,
      biconomyPaymasterApiKey: biconomyApiKey,
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

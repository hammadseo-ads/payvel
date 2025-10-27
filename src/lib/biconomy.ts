import { createWalletClient, custom, type WalletClient } from "viem";
import { baseSepolia } from "viem/chains";
import { createSmartAccountClient } from "@biconomy/account";

export async function getWalletClientFromProvider(provider: any): Promise<WalletClient> {
  const walletClient = createWalletClient({
    chain: baseSepolia,
    transport: custom(provider),
  });
  return walletClient;
}

export async function initSmartAccount(walletClient: WalletClient) {
  try {
    const bundlerUrl = import.meta.env.VITE_BICONOMY_BUNDLER_URL || "";
    const biconomyApiKey = import.meta.env.VITE_BICONOMY_API_KEY || "";

    const smartAccount = await createSmartAccountClient({
      signer: walletClient,
      bundlerUrl,
      biconomyPaymasterApiKey: biconomyApiKey,
    });

    const saAddress = await smartAccount.getAccountAddress();
    return { smartAccount, saAddress };
  } catch (error) {
    console.error("Error initializing smart account:", error);
    throw error;
  }
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

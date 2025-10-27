import { ethers } from "ethers";
import { BiconomySmartAccountV2, DEFAULT_ENTRYPOINT_ADDRESS } from "@biconomy/account";

export async function getSignerFromProvider(provider: any) {
  const ethersProvider = new ethers.providers.Web3Provider(provider);
  const signer = ethersProvider.getSigner();
  return signer;
}

export async function initSmartAccount(signer: any) {
  try {
    const bundlerUrl = import.meta.env.VITE_BICONOMY_BUNDLER_URL || "";
    const biconomyApiKey = import.meta.env.VITE_BICONOMY_API_KEY || "";

    const smartAccount = await BiconomySmartAccountV2.create({
      signer,
      chainId: parseInt(import.meta.env.VITE_CHAIN_ID?.replace("0x", "") || "84532", 16),
      bundlerUrl,
      biconomyPaymasterApiKey: biconomyApiKey,
      entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
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

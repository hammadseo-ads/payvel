import { ethers } from "ethers";
import { SUPPORTED_TOKENS } from "@/config/tokens";

const BASE_SEPOLIA_RPC_URL = "https://sepolia.base.org";

export interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
}

/**
 * Fetch balance for a specific token (or ETH if no token address)
 */
async function fetchTokenBalance(
  smartAccountAddress: string,
  tokenAddress: string | null,
  decimals: number
): Promise<string> {
  const provider = new ethers.providers.JsonRpcProvider(BASE_SEPOLIA_RPC_URL);

  if (!tokenAddress) {
    // Fetch native ETH balance
    const balanceWei = await provider.getBalance(smartAccountAddress);
    const balanceEth = ethers.utils.formatEther(balanceWei);
    return parseFloat(balanceEth).toFixed(4);
  }

  // Fetch ERC20 token balance
  const tokenContract = new ethers.Contract(
    tokenAddress,
    ["function balanceOf(address) view returns (uint256)"],
    provider
  );

  const balanceRaw = await tokenContract.balanceOf(smartAccountAddress);
  const balance = ethers.utils.formatUnits(balanceRaw, decimals);
  return parseFloat(balance).toFixed(decimals === 18 ? 4 : 2);
}

/**
 * Fetch balances for all supported tokens
 */
export async function fetchAllBalances(
  smartAccountAddress: string
): Promise<TokenBalance[]> {
  const balancePromises = Object.entries(SUPPORTED_TOKENS).map(
    async ([symbol, token]) => {
      try {
        const balance = await fetchTokenBalance(
          smartAccountAddress,
          token.address,
          token.decimals
        );
        return {
          symbol,
          balance,
          decimals: token.decimals,
        };
      } catch (error) {
        console.error(`Failed to fetch ${symbol} balance:`, error);
        return {
          symbol,
          balance: "0.00",
          decimals: token.decimals,
        };
      }
    }
  );

  return Promise.all(balancePromises);
}

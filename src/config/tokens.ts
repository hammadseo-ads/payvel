// Token configuration for Base Sepolia testnet
export interface Token {
  symbol: string;
  name: string;
  decimals: number;
  address: string | null; // null for native ETH
  logo?: string;
}

export const SUPPORTED_TOKENS: Record<string, Token> = {
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    address: null, // Native token
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia USDC
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    address: "0xf6e0C6fA2f0D0E0e0e0e0e0e0e0e0e0e0e0e0e0e", // Placeholder - verify actual address
  },
};

// Minimal ERC20 ABI for balance and transfer
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
];

export function getTokenBySymbol(symbol: string): Token | undefined {
  return SUPPORTED_TOKENS[symbol];
}

export function getTokenByAddress(address: string | null): Token | undefined {
  if (!address) return SUPPORTED_TOKENS.ETH;
  return Object.values(SUPPORTED_TOKENS).find(
    (token) => token.address?.toLowerCase() === address.toLowerCase()
  );
}

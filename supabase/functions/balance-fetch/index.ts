import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import * as jose from "https://deno.land/x/jose@v5.9.6/index.ts";
import { ethers } from "https://esm.sh/ethers@5.7.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("📊 Balance fetch request received");

    // Get optional tokenAddress from query params
    const url = new URL(req.url);
    const tokenAddress = url.searchParams.get("tokenAddress");
    
    if (tokenAddress) {
      console.log(`📊 Fetching balance for token: ${tokenAddress}`);
    }

    // Verify JWT token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const web3AuthClientId = Deno.env.get("WEB3AUTH_CLIENT_ID");
    const jwksEndpoint = Deno.env.get("WEB3AUTH_JWKS_ENDPOINT");

    if (!web3AuthClientId || !jwksEndpoint) {
      throw new Error("Missing Web3Auth configuration");
    }

    console.log("🔐 Verifying JWT token...");
    const jwks = jose.createRemoteJWKSet(new URL(jwksEndpoint));
    const { payload } = await jose.jwtVerify(token, jwks, {
      algorithms: ["ES256"],
      issuer: "https://api-auth.web3auth.io",
      audience: web3AuthClientId,
    });

    const web3authUserId = payload.sub as string;
    console.log(`✅ Token verified for user: ${web3authUserId}`);

    // Get user's smart account address
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("smart_account_address")
      .eq("web3auth_user_id", web3authUserId)
      .single();

    if (userError || !user) {
      console.error("❌ User not found:", userError);
      throw new Error("User not found");
    }

    const smartAccountAddress = user.smart_account_address;
    console.log(`📍 Fetching balance for address: ${smartAccountAddress}`);

    const rpcUrl = Deno.env.get("CHAIN_RPC_URL");
    if (!rpcUrl) {
      throw new Error("Missing RPC URL configuration");
    }

    // If no token address, fetch ETH balance
    if (!tokenAddress) {
      const rpcResponse = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getBalance",
          params: [smartAccountAddress, "latest"],
          id: 1,
        }),
      });

      const rpcData = await rpcResponse.json();

      if (rpcData.error) {
        console.error("❌ RPC error:", rpcData.error);
        throw new Error(`RPC error: ${rpcData.error.message}`);
      }

      const balanceWei = BigInt(rpcData.result);
      const balanceEth = Number(balanceWei) / 1e18;
      const formattedBalance = balanceEth.toFixed(4);

      console.log(`✅ Balance fetched: ${formattedBalance} ETH (${rpcData.result} wei)`);

      return new Response(
        JSON.stringify({
          balance: formattedBalance,
          symbol: "ETH",
          decimals: 18,
          address: smartAccountAddress,
          raw: rpcData.result,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch ERC20 token balance
    const ERC20_ABI = ["function balanceOf(address) view returns (uint256)"];
    const iface = new ethers.utils.Interface(ERC20_ABI);
    const balanceOfData = iface.encodeFunctionData("balanceOf", [smartAccountAddress]);

    const rpcResponse = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_call",
        params: [
          {
            to: tokenAddress,
            data: balanceOfData,
          },
          "latest",
        ],
        id: 1,
      }),
    });

    const rpcData = await rpcResponse.json();

    if (rpcData.error) {
      console.error("❌ RPC error:", rpcData.error);
      throw new Error(`RPC error: ${rpcData.error.message}`);
    }

    // Decode balance
    const balanceWei = BigInt(rpcData.result);
    
    // Get token decimals (assume 6 for USDC/USDT, can be enhanced)
    const decimals = 6; // USDC/USDT use 6 decimals
    const balance = Number(balanceWei) / Math.pow(10, decimals);
    const formattedBalance = balance.toFixed(2);

    console.log(`✅ Token balance fetched: ${formattedBalance} (${rpcData.result} raw)`);

    return new Response(
      JSON.stringify({
        balance: formattedBalance,
        decimals,
        address: smartAccountAddress,
        tokenAddress,
        raw: rpcData.result,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ Error fetching balance:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

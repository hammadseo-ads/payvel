import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as jose from "https://deno.land/x/jose@v5.9.6/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    const web3AuthClientId = Deno.env.get("WEB3AUTH_CLIENT_ID")!;
    const jwksEndpoint = Deno.env.get("WEB3AUTH_JWKS_ENDPOINT")!;
    
    const jwks = jose.createRemoteJWKSet(new URL(jwksEndpoint));
    const { payload } = await jose.jwtVerify(token, jwks, {
      algorithms: ['ES256'],
      issuer: 'https://api-auth.web3auth.io',
      audience: web3AuthClientId,
    });

    const web3authUserId = payload.sub as string;
    console.log("🔐 Authenticated user:", web3authUserId);

    // Get request body
    const { transactionId, to, amount } = await req.json();

    // Validate input
    if (!transactionId || !to || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user from database
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, smart_account_address")
      .eq("web3auth_user_id", web3authUserId)
      .single();

    if (userError || !userData) {
      console.error("User not found:", userError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const smartAccountAddress = userData.smart_account_address;
    console.log("💼 Smart account:", smartAccountAddress);

    // Get Biconomy configuration
    const bundlerUrl = Deno.env.get("BICONOMY_BUNDLER_URL");
    const paymasterUrl = Deno.env.get("BICONOMY_PAYMASTER_URL");
    const chainRpcUrl = Deno.env.get("CHAIN_RPC_URL");

    if (!bundlerUrl || !paymasterUrl || !chainRpcUrl) {
      throw new Error("Missing Biconomy configuration");
    }

    console.log("🚀 Preparing transaction:", { to, amount, from: smartAccountAddress });

    // Convert amount to wei (ETH to wei: multiply by 10^18)
    const amountInWei = `0x${(BigInt(parseFloat(amount) * 1e18)).toString(16)}`;

    // Get nonce from smart account
    const nonceResponse = await fetch(chainRpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getTransactionCount",
        params: [smartAccountAddress, "latest"],
        id: 1,
      }),
    });

    const nonceData = await nonceResponse.json();
    const nonce = nonceData.result;

    console.log("📝 Building user operation with nonce:", nonce);

    // Build calldata for ETH transfer
    // For a simple ETH transfer, we use the execute function of the smart account
    // execute(address dest, uint256 value, bytes calldata func)
    const callData = `0xb61d27f6${
      to.slice(2).padStart(64, '0')
    }${
      amountInWei.slice(2).padStart(64, '0')
    }${
      '60'.padStart(64, '0') // offset for bytes
    }${'00'.padStart(64, '0')}`; // empty bytes length

    // Create user operation
    const userOp = {
      sender: smartAccountAddress,
      nonce: nonce,
      initCode: "0x",
      callData: callData,
      callGasLimit: "0x0", // Will be filled by paymaster
      verificationGasLimit: "0x0",
      preVerificationGas: "0x0",
      maxFeePerGas: "0x0",
      maxPriorityFeePerGas: "0x0",
      paymasterAndData: "0x",
      signature: "0x",
    };

    console.log("💰 Requesting paymaster sponsorship...");

    // Get paymaster data for gas sponsorship
    const paymasterResponse = await fetch(paymasterUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "pm_sponsorUserOperation",
        params: [
          userOp,
          {
            mode: "SPONSORED",
            calculateGasLimits: true,
          }
        ],
        id: Date.now(),
      }),
    });

    const paymasterData = await paymasterResponse.json();
    
    if (paymasterData.error) {
      console.error("❌ Paymaster error:", paymasterData.error);
      throw new Error(`Paymaster error: ${paymasterData.error.message}`);
    }

    console.log("✅ Paymaster approved with gas limits");

    // Update user operation with paymaster data
    const sponsoredUserOp = {
      ...userOp,
      callGasLimit: paymasterData.result.callGasLimit,
      verificationGasLimit: paymasterData.result.verificationGasLimit,
      preVerificationGas: paymasterData.result.preVerificationGas,
      maxFeePerGas: paymasterData.result.maxFeePerGas || "0x3B9ACA00", // 1 gwei fallback
      maxPriorityFeePerGas: paymasterData.result.maxPriorityFeePerGas || "0x3B9ACA00",
      paymasterAndData: paymasterData.result.paymasterAndData,
    };

    // NOTE: This is a simplified implementation
    // In production, we need to:
    // 1. Get the user's private key from Web3Auth backend API
    // 2. Sign the user operation with the private key
    // 3. Submit the signed operation to the bundler
    
    // For now, we'll return a mock response indicating the transaction needs client-side signing
    console.log("⚠️ Transaction prepared but requires client-side signing");

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Transaction prepared (client-side signing required)",
        userOperation: sponsoredUserOp,
        // In production, these would be real values after bundler submission
        userOpHash: `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`,
        txHash: null, // Will be available after confirmation
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Error in tx-execute:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

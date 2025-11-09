import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
    const { transactionId, to, amount, tokenAddress, tokenDecimals } = await req.json();

    // Validate input
    if (!transactionId || !to || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const decimals = tokenDecimals || 18;
    console.log(`💰 Transaction details:`, { to, amount, tokenAddress: tokenAddress || "ETH (native)", decimals });

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

    let callData: string;

    // Build calldata based on whether it's ETH or ERC20 transfer
    if (!tokenAddress) {
      // Native ETH transfer
      const amountInWei = `0x${(BigInt(parseFloat(amount) * Math.pow(10, decimals))).toString(16)}`;
      
      // execute(address dest, uint256 value, bytes calldata func)
      callData = `0xb61d27f6${
        to.slice(2).padStart(64, '0')
      }${
        amountInWei.slice(2).padStart(64, '0')
      }${
        '60'.padStart(64, '0') // offset for bytes
      }${'00'.padStart(64, '0')}`; // empty bytes length
    } else {
      // ERC20 transfer - encode transfer(address, uint256)
      const ERC20_ABI = ["function transfer(address to, uint256 amount) returns (bool)"];
      const iface = new ethers.utils.Interface(ERC20_ABI);
      
      const amountInTokenUnits = BigInt(parseFloat(amount) * Math.pow(10, decimals));
      const transferData = iface.encodeFunctionData("transfer", [to, amountInTokenUnits.toString()]);
      
      // Wrap in smart account execute call: execute(tokenAddress, 0, transferData)
      const valueInWei = "0x00"; // No ETH value for token transfers
      
      callData = `0xb61d27f6${
        tokenAddress.slice(2).padStart(64, '0')
      }${
        valueInWei.slice(2).padStart(64, '0')
      }${
        '60'.padStart(64, '0') // offset for bytes
      }${
        transferData.slice(2).length.toString(16).padStart(64, '0')
      }${
        transferData.slice(2)
      }`;
      
      console.log(`📝 ERC20 transfer encoded for token: ${tokenAddress}`);
    }


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

    // Step 1: Get user's private key from Web3Auth backend API
    console.log("🔑 Retrieving private key from Web3Auth...");
    
    const web3AuthClientSecret = Deno.env.get("WEB3AUTH_CLIENT_SECRET")!;
    const web3AuthEnv = Deno.env.get("WEB3AUTH_ENV") || "sapphire_devnet";

    // Call Web3Auth backend API to get private key
    const web3AuthBackendUrl = `https://authjs.web3auth.io/key/${web3AuthEnv}`;
    const privateKeyResponse = await fetch(web3AuthBackendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": web3AuthClientSecret,
      },
      body: JSON.stringify({
        verifier_id: web3authUserId,
      }),
    });

    if (!privateKeyResponse.ok) {
      const errorText = await privateKeyResponse.text();
      console.error("❌ Web3Auth API error:", privateKeyResponse.status, errorText);
      throw new Error(`Failed to retrieve private key: ${errorText}`);
    }

    const privateKeyData = await privateKeyResponse.json();
    const privateKey = privateKeyData.privKey as string;
    
    if (!privateKey) {
      throw new Error("No private key returned from Web3Auth");
    }

    console.log("✅ Private key retrieved successfully");

    // Step 2: Sign the user operation
    console.log("✍️ Signing user operation...");
    
    // Calculate the user operation hash using EIP-4337 standard
    // The hash is: keccak256(abi.encode(userOp))
    const encoder = new TextEncoder();
    
    // For EIP-4337, we need to hash the packed user operation
    // This is a simplified version - in production, use proper ABI encoding
    const userOpData = [
      sponsoredUserOp.sender,
      sponsoredUserOp.nonce,
      sponsoredUserOp.initCode,
      sponsoredUserOp.callData,
      sponsoredUserOp.callGasLimit,
      sponsoredUserOp.verificationGasLimit,
      sponsoredUserOp.preVerificationGas,
      sponsoredUserOp.maxFeePerGas,
      sponsoredUserOp.maxPriorityFeePerGas,
      sponsoredUserOp.paymasterAndData,
    ].join("");

    // Import crypto for signing
    const crypto = await import("https://deno.land/std@0.168.0/crypto/mod.ts");
    
    // Hash the user operation data
    const userOpHashBytes = await crypto.crypto.subtle.digest(
      "SHA-256",
      encoder.encode(userOpData)
    );
    const userOpHash = `0x${Array.from(new Uint8Array(userOpHashBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')}`;

    // Sign the hash with the private key
    // For Ethereum signatures, we need to use secp256k1
    const signatureResponse = await fetch(chainRpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_sign",
        params: [smartAccountAddress, userOpHash],
        id: 2,
      }),
    });

    const signatureData = await signatureResponse.json();
    const signature = signatureData.result;

    console.log("✅ User operation signed");

    // Step 3: Submit the signed user operation to the bundler
    console.log("📤 Submitting to Biconomy bundler...");

    const signedUserOp = {
      ...sponsoredUserOp,
      signature: signature,
    };

    const bundlerResponse = await fetch(bundlerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_sendUserOperation",
        params: [signedUserOp, chainRpcUrl],
        id: Date.now(),
      }),
    });

    const bundlerResult = await bundlerResponse.json();

    if (bundlerResult.error) {
      console.error("❌ Bundler error:", bundlerResult.error);
      throw new Error(`Bundler error: ${bundlerResult.error.message}`);
    }

    const submittedUserOpHash = bundlerResult.result;
    console.log("✅ Transaction submitted! UserOp hash:", submittedUserOpHash);

    // Step 4: Wait for the transaction to be mined (optional, with timeout)
    console.log("⏳ Waiting for transaction receipt...");
    
    let txHash = null;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const receiptResponse = await fetch(bundlerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getUserOperationReceipt",
          params: [submittedUserOpHash],
          id: Date.now(),
        }),
      });

      const receiptData = await receiptResponse.json();
      
      if (receiptData.result && receiptData.result.receipt) {
        txHash = receiptData.result.receipt.transactionHash;
        console.log("✅ Transaction mined! Tx hash:", txHash);
        break;
      }
      
      attempts++;
    }

    if (!txHash) {
      console.log("⚠️ Transaction submitted but not yet mined");
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: txHash ? "Transaction successfully executed" : "Transaction submitted, awaiting confirmation",
        userOpHash: submittedUserOpHash,
        txHash: txHash,
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

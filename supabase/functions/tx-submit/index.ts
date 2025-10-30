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
    const { to, amount, chainId } = await req.json();

    // Validate input
    if (!to || !amount || !chainId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, amount, chainId" }),
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

    console.log("💰 Transaction request:", { to, amount, chainId, from: userData.smart_account_address });

    // Log transaction
    const { data: txData, error: txError } = await supabase
      .from("tx_logs")
      .insert({
        user_id: userData.id,
        chain_id: chainId,
        to_address: to,
        amount: amount,
        status: "submitted",
      })
      .select()
      .single();

    if (txError) {
      console.error("Failed to log transaction:", txError);
      throw txError;
    }

    console.log("✅ Transaction logged:", txData.id);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        message: "Transaction submitted",
        transactionId: txData.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Error in tx-submit:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

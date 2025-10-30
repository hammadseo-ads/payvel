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

    // Get user from database
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("web3auth_user_id", web3authUserId)
      .single();

    if (userError || !userData) {
      console.error("User not found:", userError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user's transactions
    const { data, error } = await supabase
      .from("tx_logs")
      .select("*")
      .eq("user_id", userData.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    console.log("✅ Fetched", data?.length || 0, "transactions for user");

    return new Response(
      JSON.stringify({ transactions: data || [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Error in tx-list:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

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
    const web3AuthClientId = Deno.env.get("WEB3AUTH_CLIENT_ID")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { smartAccountAddress, idToken } = await req.json();

    // Verify ID token if provided
    if (idToken) {
      try {
        console.log("🔐 Verifying ID token...");
        
        // Verify JWT using Web3Auth JWKS
        const jwks = jose.createRemoteJWKSet(new URL('https://api-auth.web3auth.io/jwks'));
        const { payload } = await jose.jwtVerify(idToken, jwks, { 
          algorithms: ['ES256'],
          issuer: 'https://api-auth.web3auth.io',
          audience: web3AuthClientId,
        });
        
        console.log("🔍 Token verification details:");
        console.log("   Issuer:", payload.iss);
        console.log("   Audience:", payload.aud);
        console.log("   Expected Client ID:", web3AuthClientId);
        
        console.log("✅ ID token verified successfully");
        console.log("👤 User ID:", payload.sub);
        console.log("📧 Email:", payload.email);
        
        // Extract user info from verified token
        const web3authUserId = payload.sub as string;
        const userEmail = payload.email as string;
        
        // Upsert user record with verified data
        const { data, error } = await supabase
          .from("users")
          .upsert({ 
            web3auth_user_id: web3authUserId,
            email: userEmail,
            smart_account_address: smartAccountAddress 
          }, { 
            onConflict: "web3auth_user_id" 
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ ok: true, smartAccountAddress, email: data.email }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
        
      } catch (verifyError: any) {
        console.error("❌ ID token verification failed:", verifyError);
        return new Response(
          JSON.stringify({ error: "Invalid ID token", details: verifyError.message }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      console.error("❌ No ID token provided");
      return new Response(
        JSON.stringify({ error: "ID token is required for authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("💥 Account creation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

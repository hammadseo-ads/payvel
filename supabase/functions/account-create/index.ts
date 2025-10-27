import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { smartAccountAddress } = await req.json();

    // Upsert user record
    const { data, error } = await supabase
      .from("users")
      .upsert({ 
        web3auth_user_id: "temp_id",
        email: "user@example.com",
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
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

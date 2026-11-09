/**
 * Supabase Edge Function — fiyat tahmini (isteğe bağlı).
 * SPA aynı formülü istemcide de hesaplar; bu fonksiyon sunucu tarafı doğrulama içindir.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const body = await req.json() as {
      pickupDistrict?: string;
      dropoffDistrict?: string;
      packageType?: string;
      distanceKm?: number;
    };

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const { data: settings, error } = await supabase
      .from("pricing_settings")
      .select("*")
      .eq("id", 1)
      .single();
    if (error || !settings) {
      return new Response(JSON.stringify({ error: "Fiyat ayarları okunamadı" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const pkgMap: Record<string, number> = {
      evrak: Number(settings.package_evrak_tl),
      kucuk: Number(settings.package_kucuk_tl),
      orta: Number(settings.package_orta_tl),
      buyuk: Number(settings.package_buyuk_tl),
      gida: Number(settings.package_gida_tl),
    };
    const distanceKm = Math.max(0, Number(body.distanceKm) || 0);
    const packageFee = pkgMap[body.packageType ?? "kucuk"] ?? 0;
    const distanceFee = distanceKm * Number(settings.per_km_tl);
    const total = Math.max(
      Number(settings.base_fee_tl),
      Number(settings.base_fee_tl) + distanceFee + packageFee,
    );

    return new Response(
      JSON.stringify({
        distanceKm,
        baseFeeTl: Number(settings.base_fee_tl),
        distanceFeeTl: Number(distanceFee.toFixed(2)),
        packageFeeTl: packageFee,
        totalTl: Number(total.toFixed(2)),
      }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});

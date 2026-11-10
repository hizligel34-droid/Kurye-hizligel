/**
 * Supabase Edge Function — sürüş mesafesi fiyat tahmini (TL).
 * SPA aynı formülü istemcide kullanır; bu fonksiyon sunucu tarafı doğrulama içindir.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function roundMoney(value: number, decimals: number) {
  const digits = Math.max(0, Math.min(6, Math.floor(Number.isFinite(decimals) ? decimals : 2)));
  const factor = 10 ** digits;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const body = await req.json() as { distanceKm?: number; weightKg?: number };

    if (Number(body.weightKg ?? 0) > 30) {
      return new Response(JSON.stringify({ error: "Maksimum taşıma sınırı 30 kg" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const { data: settings, error } = await supabase
      .from("pricing_settings")
      .select("base_try, per_km_try, vat_rate, rounding_decimals, commission_rate")
      .eq("id", 1)
      .single();
    if (error) {
      return new Response(JSON.stringify({ error: "Fiyat ayarları okunamadı" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const distanceKm = Math.max(0, Number(body.distanceKm ?? 0));
    const decimals = Number(settings?.rounding_decimals ?? 2);
    const netTl = roundMoney(
      Number(settings?.base_try ?? 600) + Number(settings?.per_km_try ?? 50) * distanceKm,
      decimals,
    );
    const vatRate = Number(settings?.vat_rate ?? 0.2);
    const vatTl = roundMoney(netTl * vatRate, decimals);
    const grossTl = roundMoney(netTl + vatTl, decimals);
    const commissionRate = Number(settings?.commission_rate ?? 0.2);

    return new Response(
      JSON.stringify({
        distanceKm,
        netTl,
        vatTl,
        vatRate,
        grossTl,
        totalTl: grossTl,
        commissionTl: roundMoney(netTl * commissionRate, decimals),
        courierEarningTl: roundMoney(netTl * (1 - commissionRate), decimals),
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

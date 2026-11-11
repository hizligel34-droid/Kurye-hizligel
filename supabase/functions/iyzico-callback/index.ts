/**
 * iyzico Checkout Form callback: token ile retrieve.
 * Başarı: sipariş confirmed + payment paid. Başarısız: sipariş pending kalır.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  cors,
  iyzicoCommissionKurus,
  iyzicoPost,
  json,
  stripSecretsForLog,
} from "../_shared/iyzico.ts";

const DETAIL_PATH = "/payment/iyzipos/checkoutform/auth/ecom/detail";

async function applyRetrieve(
  admin: ReturnType<typeof createClient>,
  token: string,
) {
  const result = await iyzicoPost(DETAIL_PATH, { locale: "tr", token });
  const { data: payment } = await admin
    .from("payments")
    .select("id, order_id, status")
    .eq("iyzico_token", token)
    .maybeSingle();
  if (!payment) return { ok: false as const, paymentStatus: "failed" };

  const success = String(result.paymentStatus ?? result.status) === "SUCCESS"
    || String(result.status) === "success";
  const commission = iyzicoCommissionKurus({
    iyziCommissionRateAmount: result.iyziCommissionRateAmount as number,
    iyziCommissionFee: result.iyziCommissionFee as number,
  });
  const nextStatus = success ? "paid" : "failed";
  if (payment.status !== "paid") {
    await admin.from("payments").update({
      status: nextStatus,
      iyzico_payment_id: result.paymentId ?? result.paymentid ?? null,
      iyzi_commission_rate_amount_kurus: commission.rateKurus,
      iyzi_commission_fee_kurus: commission.feeKurus,
      iyzi_commission_total_kurus: commission.totalKurus,
    }).eq("id", payment.id);
    if (success) {
      await admin.from("orders").update({
        status: "confirmed",
        payment_status: "odendi",
        payment_method: "iyzico",
      }).eq("id", payment.order_id).eq("status", "pending");
    }
  }
  return { ok: success, paymentStatus: nextStatus };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let token = "";
    if (contentType.includes("application/json")) {
      const body = await req.json() as { token?: string };
      token = String(body.token ?? "");
    } else {
      const text = await req.text();
      token = new URLSearchParams(text).get("token") ?? new URL(req.url).searchParams.get("token") ?? "";
    }
    if (!token) return json({ error: "token yok" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const outcome = await applyRetrieve(admin, token);
    const site = Deno.env.get("PUBLIC_SITE_URL") ?? "https://kuryeler.tr";
    const next = `${site}/musteri/?odeme=${outcome.ok ? "ok" : "fail"}`;
    if ((req.headers.get("accept") ?? "").includes("application/json")) {
      return json({ ok: outcome.ok, status: outcome.paymentStatus });
    }
    return new Response(null, { status: 303, headers: { ...cors, Location: next } });
  } catch (error) {
    console.error("iyzico-callback", stripSecretsForLog({ error: String(error) }));
    return json({ error: "Ödeme doğrulanamadı" }, 400);
  }
});

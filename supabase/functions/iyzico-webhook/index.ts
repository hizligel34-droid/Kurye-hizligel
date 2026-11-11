/**
 * iyzico webhook: imza doğrula, Checkout Form retrieve, siparişi güncelle.
 * Kart ve VKN loglanmaz.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  cors,
  iyzicoCommissionKurus,
  iyzicoEnv,
  iyzicoPost,
  json,
  stripSecretsForLog,
  verifyIyzicoWebhookSignature,
} from "../_shared/iyzico.ts";

const DETAIL_PATH = "/payment/iyzipos/checkoutform/auth/ecom/detail";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const raw = await req.text();
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      payload = Object.fromEntries(new URLSearchParams(raw));
    }
    const token = String(payload.token ?? payload.iyziPaymentId ?? "");
    const eventType = String(payload.iyziEventType ?? payload.eventType ?? "CHECKOUT_FORM_AUTH");
    const paymentId = String(payload.paymentId ?? payload.iyziPaymentId ?? "");
    const provided = req.headers.get("x-iyz-signature-v3")
      ?? req.headers.get("x-iyz-signature")
      ?? String(payload.signature ?? "");
    const { secretKey } = iyzicoEnv();
    const ok = await verifyIyzicoWebhookSignature({
      secretKey,
      provided,
      merchantId: String(payload.merchantId ?? ""),
      eventType,
      paymentId,
      token,
    });
    if (!ok) return json({ error: "imza geçersiz" }, 401);
    if (!token) return json({ error: "token yok" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const result = await iyzicoPost(DETAIL_PATH, { locale: "tr", token });
    const { data: payment } = await admin
      .from("payments")
      .select("id, order_id, status")
      .eq("iyzico_token", token)
      .maybeSingle();
    if (!payment) return json({ ok: true, ignored: true });

    const success = String(result.paymentStatus ?? result.status) === "SUCCESS"
      || String(result.status) === "success";
    const commission = iyzicoCommissionKurus({
      iyziCommissionRateAmount: result.iyziCommissionRateAmount as number,
      iyziCommissionFee: result.iyziCommissionFee as number,
    });
    if (payment.status !== "paid") {
      await admin.from("payments").update({
        status: success ? "paid" : "failed",
        iyzico_payment_id: result.paymentId ?? paymentId ?? null,
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
    return json({ ok: true });
  } catch (error) {
    console.error("iyzico-webhook", stripSecretsForLog({ error: String(error) }));
    return json({ error: "webhook işlenemedi" }, 400);
  }
});

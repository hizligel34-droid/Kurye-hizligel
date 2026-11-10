/**
 * iyzico Checkout Form initialize.
 * Kart alanı kabul edilmez; tutar sunucuda 60000 + 5000×km kuruş + %20 KDV.
 * paymentGroup = LISTING (Hızlıgel kendi işi; alt üye yok).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  assertNoCardFields,
  cors,
  IYZICO_CURRENCY,
  IYZICO_PAYMENT_GROUP_OWN,
  iyzicoPost,
  json,
  kurusToIyzicoPrice,
  serverPriceKurus,
  stripSecretsForLog,
} from "../_shared/iyzico.ts";

const INIT_PATH = "/payment/iyzipos/checkoutform/initialize/auth/ecom";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const body = await req.json() as Record<string, unknown>;
    assertNoCardFields(body);
    const orderId = String(body.orderId ?? "");
    if (!orderId) return json({ error: "Sipariş gerekli" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: "Giriş yapmalısınız" }, 401);

    const admin = createClient(supabaseUrl, service);
    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, customer_id, status, payment_status, payment_method, distance_km, tracking_code, pickup_address, dropoff_address, contact_phone, recipient_name")
      .eq("id", orderId)
      .single();
    if (orderError || !order) return json({ error: "Sipariş bulunamadı" }, 404);
    if (order.customer_id !== userData.user.id) return json({ error: "Bu sipariş size ait değil" }, 403);
    if (order.status !== "pending" || order.payment_status === "odendi") {
      return json({ error: "Bu sipariş için ödeme başlatılamaz" }, 409);
    }

    const { data: settings } = await admin
      .from("pricing_settings")
      .select("base_try, per_km_try, vat_rate")
      .eq("id", 1)
      .maybeSingle();
    const price = serverPriceKurus(Number(order.distance_km), {
      baseTry: Number(settings?.base_try ?? 600),
      perKmTry: Number(settings?.per_km_try ?? 50),
      vatRate: Number(settings?.vat_rate ?? 0.2),
    });
    const paidPrice = kurusToIyzicoPrice(price.grossKurus);
    const netPrice = kurusToIyzicoPrice(price.netKurus);
    const conversationId = crypto.randomUUID();
    const callbackUrl = Deno.env.get("IYZICO_CALLBACK_URL")
      ?? `${supabaseUrl}/functions/v1/iyzico-callback`;

    const { data: payment, error: payError } = await admin.from("payments").insert({
      order_id: orderId,
      amount_kurus: price.grossKurus,
      net_kurus: price.netKurus,
      vat_kurus: price.vatKurus,
      currency: IYZICO_CURRENCY,
      status: "pending",
      conversation_id: conversationId,
      payment_group: IYZICO_PAYMENT_GROUP_OWN,
    }).select("id").single();
    if (payError || !payment) return json({ error: "Ödeme kaydı açılamadı" }, 500);

    await admin.from("orders").update({ payment_method: "iyzico" }).eq("id", orderId);

    const email = userData.user.email || "musteri@sandbox.local";
    const phone = String(order.contact_phone ?? "5324746745").replace(/\D/g, "").slice(-11) || "5324746745";
    const iyzicoBody = {
      locale: "tr",
      conversationId,
      price: netPrice,
      paidPrice,
      currency: IYZICO_CURRENCY,
      basketId: order.tracking_code,
      paymentGroup: IYZICO_PAYMENT_GROUP_OWN,
      callbackUrl,
      enabledInstallments: [1],
      buyer: {
        id: userData.user.id,
        name: String(order.recipient_name || "Müşteri").split(" ")[0] || "Müşteri",
        surname: String(order.recipient_name || "Müşteri").split(" ").slice(1).join(" ") || "Hızlıgel",
        gsmNumber: `+90${phone.slice(-10)}`,
        email,
        identityNumber: "11111111111",
        registrationAddress: String(order.pickup_address || "İstanbul"),
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1",
        city: "Istanbul",
        country: "Turkey",
      },
      shippingAddress: {
        contactName: String(order.recipient_name || "Müşteri"),
        city: "Istanbul",
        country: "Turkey",
        address: String(order.dropoff_address || "İstanbul"),
      },
      billingAddress: {
        contactName: String(order.recipient_name || "Müşteri"),
        city: "Istanbul",
        country: "Turkey",
        address: String(order.pickup_address || "İstanbul"),
      },
      basketItems: [
        {
          id: order.tracking_code,
          name: "Kurye teslimat",
          category1: "Teslimat",
          itemType: "VIRTUAL",
          price: netPrice,
        },
      ],
    };

    const result = await iyzicoPost(INIT_PATH, iyzicoBody);
    if (String(result.status) !== "success") {
      await admin.from("payments").update({ status: "failed" }).eq("id", payment.id);
      console.error("iyzico initialize", stripSecretsForLog({ status: result.status, errorCode: result.errorCode }));
      return json({ error: "Ödeme formu açılamadı" }, 502);
    }

    await admin.from("payments").update({ iyzico_token: result.token }).eq("id", payment.id);
    return json({
      paymentId: payment.id,
      token: result.token,
      checkoutFormContent: result.checkoutFormContent ?? null,
      paymentPageUrl: result.paymentPageUrl ?? null,
      amountKurus: price.grossKurus,
      currency: IYZICO_CURRENCY,
    });
  } catch (error) {
    console.error("iyzico-checkout", stripSecretsForLog({ error: String(error) }));
    return json({ error: error instanceof Error ? error.message : "Ödeme başlatılamadı" }, 400);
  }
});

import {
  assertNoCardFields,
  assertTry,
  iyzicoAuthorizationHeader,
  iyzicoBaseUrl,
  iyzicoCommissionKurus,
  IYZICO_CURRENCY,
  IYZICO_PAYMENT_GROUP_OWN,
  kurusToIyzicoPrice,
  serverPriceKurus,
  verifyIyzicoWebhookSignature,
} from "../../../shared/iyzicoPayment.ts";
import { stripSecretsForLog } from "../../../shared/businessProfile.ts";

export {
  assertNoCardFields,
  assertTry,
  iyzicoAuthorizationHeader,
  iyzicoBaseUrl,
  iyzicoCommissionKurus,
  IYZICO_CURRENCY,
  IYZICO_PAYMENT_GROUP_OWN,
  kurusToIyzicoPrice,
  serverPriceKurus,
  stripSecretsForLog,
  verifyIyzicoWebhookSignature,
};

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-iyz-signature, x-iyz-signature-v3",
};

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

export function iyzicoEnv() {
  const apiKey = Deno.env.get("IYZICO_API_KEY") ?? "";
  const secretKey = Deno.env.get("IYZICO_SECRET_KEY") ?? "";
  const baseUrl = iyzicoBaseUrl(Deno.env.get("IYZICO_BASE_URL"));
  if (!apiKey || !secretKey) {
    throw new Error("IYZICO_API_KEY ve IYZICO_SECRET_KEY ortam değişkeni gerekir");
  }
  return { apiKey, secretKey, baseUrl };
}

export async function iyzicoPost(path: string, body: Record<string, unknown>) {
  assertNoCardFields(body);
  assertTry(String(body.currency ?? IYZICO_CURRENCY));
  const { apiKey, secretKey, baseUrl } = iyzicoEnv();
  const payload = JSON.stringify(body);
  const randomKey = `${Date.now()}${crypto.randomUUID().replaceAll("-", "")}`;
  const authorization = await iyzicoAuthorizationHeader({
    apiKey,
    secretKey,
    randomKey,
    uriPath: path,
    body: payload,
  });
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
      "x-iyzi-rnd": randomKey,
    },
    body: payload,
  });
  const text = await response.text();
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("iyzico yanıtı okunamadı");
  }
  return parsed;
}

export function supabaseService() {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !key) throw new Error("Supabase servis anahtarı yok");
  return { url, key };
}

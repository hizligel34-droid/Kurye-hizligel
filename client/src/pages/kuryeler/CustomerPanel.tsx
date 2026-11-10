import { BrandShell, InstallHint, StatusBadge } from "@/components/kuryeler/BrandShell";
import { OrderCard } from "@/components/kuryeler/OrderCard";
import { RequireRole } from "@/components/kuryeler/RequireRole";
import { RoutePicker, type RouteSelection } from "@/components/kuryeler/RoutePicker";
import { EmptyState, ErrorState, FieldError, LoadingState } from "@/components/kuryeler/UiStates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useKuryelerAuth } from "@/contexts/KuryelerAuth";
import {
  createOrder,
  estimateOrder,
  getPricing,
  listOrdersFor,
  subscribeToOrders,
  type CreateOrderInput,
} from "@/lib/kuryelerApi";
import { areaClass, cardClass, fieldClass, goldBtn } from "@/lib/kuryelerTheme";
import {
  DEFAULT_PRICING,
  MAX_WEIGHT_KG,
  formatKm,
  formatTl,
  formatUsd,
  isActiveOrder,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  STATUS_LABELS,
  statusTone,
  WEIGHT_LIMIT_MESSAGE,
  type DeliveryOrder,
  type PaymentMethod,
  type PricingSettings,
} from "@shared/kuryeler";
import { firstError, validateDeliveryOrder, type FieldErrors } from "@shared/kuryelerValidation";
import { normalizeTurkishMobilePhone } from "@shared/orderValidation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

function defaultSchedule() {
  const date = new Date(Date.now() + 90 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function CustomerHome() {
  const { user, refresh } = useKuryelerAuth();
  const [product, setProduct] = useState("");
  const [route, setRoute] = useState<RouteSelection | null>(null);
  const [routeError, setRouteError] = useState<string | undefined>();
  const [weightKg, setWeightKg] = useState("1");
  const [recipientName, setRecipientName] = useState("");
  const [scheduledAt, setScheduledAt] = useState(defaultSchedule);
  const [notes, setNotes] = useState("");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("nakit");
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [tab, setTab] = useState<"yeni" | "aktif" | "gecmis">("yeni");

  const load = async () => {
    if (!user) return;
    setError(null);
    const [nextPricing, nextOrders] = await Promise.all([getPricing(), listOrdersFor(user)]);
    setPricing(nextPricing);
    setOrders(nextOrders);
  };

  useEffect(() => {
    setLoading(true);
    void load()
      .catch(err => setError(err instanceof Error ? err.message : "Veri alınamadı"))
      .finally(() => setLoading(false));
    return subscribeToOrders(() => {
      void load();
      void refresh();
    });
  }, [user?.id]);

  const weightValue = Number(weightKg.replace(",", "."));
  const input: CreateOrderInput = {
    product,
    pickupAddress: route?.pickupAddress ?? "",
    dropoffAddress: route?.dropoffAddress ?? "",
    recipientName,
    scheduledAt,
    notes,
    contactPhone: phone,
    paymentMethod,
    weightKg: weightValue,
    distanceKm: route?.distanceKm ?? 0,
    pickupLat: route?.pickupLat ?? 0,
    pickupLng: route?.pickupLng ?? 0,
    dropoffLat: route?.dropoffLat ?? 0,
    dropoffLng: route?.dropoffLng ?? 0,
    routeGeojson: route ? JSON.stringify(route.geometry) : null,
  };

  const quote = useMemo(
    () => (route && route.distanceKm > 0 ? estimateOrder(input, pricing) : null),
    [pricing, route?.distanceKm],
  );

  const active = orders.filter(o => isActiveOrder(o.status));
  const history = orders.filter(o => !isActiveOrder(o.status));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    const nextErrors = validateDeliveryOrder({
      ...input,
      pickupLat: route?.pickupLat,
      pickupLng: route?.pickupLng,
      dropoffLat: route?.dropoffLat,
      dropoffLng: route?.dropoffLng,
    });
    if (routeError) nextErrors.route = routeError;
    setFieldErrors(nextErrors);
    const message = firstError(nextErrors);
    if (message) {
      toast.error(message);
      return;
    }
    if (weightValue > MAX_WEIGHT_KG) {
      toast.error(WEIGHT_LIMIT_MESSAGE);
      return;
    }
    setBusy(true);
    try {
      const order = await createOrder(user.id, {
        ...input,
        contactPhone: normalizeTurkishMobilePhone(phone),
      });
      toast.success(`Sipariş alındı · ${order.trackingCode}`);
      setProduct("");
      setNotes("");
      setWeightKg("1");
      setFieldErrors({});
      setTab("aktif");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sipariş oluşturulamadı");
    } finally {
      setBusy(false);
    }
  };

  return (
    <BrandShell panel="musteri" title="Siparişleriniz">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <InstallHint panel="musteri" />
        <div
          role="tablist"
          aria-label="Sipariş görünümü"
          className="mt-4 grid grid-cols-3 gap-1 rounded-2xl border border-[#3a3014] bg-black p-1 sm:gap-2"
        >
          {([
            ["yeni", "Yeni"],
            ["aktif", `Aktif (${active.length})`],
            ["gecmis", "Geçmiş"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`min-h-11 rounded-xl px-1 text-[12px] font-bold sm:text-sm ${
                tab === id ? "bg-[#D4AF37] text-black" : "text-[#b4a882]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? <div className="mt-5"><LoadingState label="Siparişler yükleniyor…" /></div> : null}
        {error ? (
          <div className="mt-5">
            <ErrorState message={error} onRetry={() => void load()} />
          </div>
        ) : null}

        {!loading && !error && tab === "yeni" && (
          <form className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]" onSubmit={submit} noValidate>
            <div className={`${cardClass} min-w-0 space-y-4 p-4 sm:p-5`}>
              <div>
                <label className="mb-1 block text-sm font-bold text-[#D4AF37]" htmlFor="product">
                  Ürün
                </label>
                <Input
                  id="product"
                  className={fieldClass}
                  placeholder="Evrak, paket, yemek…"
                  value={product}
                  aria-invalid={Boolean(fieldErrors.product)}
                  aria-describedby={fieldErrors.product ? "product-err" : undefined}
                  onChange={e => setProduct(e.target.value)}
                />
                <FieldError id="product-err" message={fieldErrors.product} />
              </div>
              <RoutePicker
                pricing={pricing}
                value={route}
                onChange={(next, err) => {
                  setRoute(next);
                  setRouteError(err);
                  if (err) setFieldErrors(prev => ({ ...prev, route: err }));
                  else setFieldErrors(prev => ({ ...prev, route: "" }));
                }}
              />
              <FieldError id="route-err" message={fieldErrors.route} />
              <div>
                <label className="mb-1 block text-sm font-bold text-[#D4AF37]" htmlFor="weight">
                  Ağırlık (kg) · en fazla {MAX_WEIGHT_KG} kg
                </label>
                <Input
                  id="weight"
                  className={fieldClass}
                  type="number"
                  min={0.1}
                  max={MAX_WEIGHT_KG}
                  step="0.1"
                  inputMode="decimal"
                  value={weightKg}
                  aria-invalid={Boolean(fieldErrors.weightKg)}
                  aria-describedby={fieldErrors.weightKg ? "weight-err" : undefined}
                  onChange={e => setWeightKg(e.target.value)}
                />
                <FieldError id="weight-err" message={fieldErrors.weightKg} />
                {weightValue > MAX_WEIGHT_KG ? (
                  <p className="mt-1 text-xs text-red-400">{WEIGHT_LIMIT_MESSAGE}</p>
                ) : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-[#D4AF37]" htmlFor="recipient">
                  Teslim alan kişi
                </label>
                <Input
                  id="recipient"
                  className={fieldClass}
                  placeholder="Ad soyad"
                  value={recipientName}
                  aria-invalid={Boolean(fieldErrors.recipientName)}
                  aria-describedby={fieldErrors.recipientName ? "recipient-err" : undefined}
                  onChange={e => setRecipientName(e.target.value)}
                />
                <FieldError id="recipient-err" message={fieldErrors.recipientName} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-[#D4AF37]" htmlFor="when">
                  Gün ve saat
                </label>
                <Input
                  id="when"
                  className={fieldClass}
                  type="datetime-local"
                  value={scheduledAt}
                  aria-invalid={Boolean(fieldErrors.scheduledAt)}
                  aria-describedby={fieldErrors.scheduledAt ? "when-err" : undefined}
                  onChange={e => setScheduledAt(e.target.value)}
                />
                <FieldError id="when-err" message={fieldErrors.scheduledAt} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-[#D4AF37]" htmlFor="contact-phone">
                  İletişim telefonu
                </label>
                <Input
                  id="contact-phone"
                  className={fieldClass}
                  placeholder="05xx xxx xx xx"
                  value={phone}
                  aria-invalid={Boolean(fieldErrors.contactPhone)}
                  aria-describedby={fieldErrors.contactPhone ? "contact-phone-err" : undefined}
                  onChange={e => setPhone(e.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                />
                <FieldError id="contact-phone-err" message={fieldErrors.contactPhone} />
              </div>
              <fieldset>
                <legend className="mb-2 text-sm font-bold text-[#D4AF37]">Ödeme yöntemi</legend>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map(method => (
                    <button
                      key={method}
                      type="button"
                      className={`min-h-11 rounded-xl border px-2 text-xs font-bold ${
                        paymentMethod === method
                          ? "border-[#D4AF37] bg-[#1a1508] text-[#D4AF37]"
                          : "border-[#3a3014] text-[#b4a882]"
                      }`}
                      onClick={() => setPaymentMethod(method)}
                    >
                      {PAYMENT_METHOD_LABELS[method]}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="block" htmlFor="order-notes">
                <span className="mb-1 block text-sm font-bold text-[#D4AF37]">Notlar (isteğe bağlı)</span>
                <Textarea
                  id="order-notes"
                  className={areaClass}
                  placeholder="Kapı kodu, kırılır vb."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </label>
            </div>
            <aside className={`${cardClass} h-fit min-w-0 p-4 sm:p-5 lg:sticky lg:top-24`}>
              <p className="text-sm font-bold text-[#D4AF37]">Ücret</p>
              {quote && quote.priceUsd > 0 ? (
                <>
                  <p className="mt-4 text-3xl font-black text-[#D4AF37]">{formatUsd(quote.priceUsd, pricing.roundingDecimals)}</p>
                  {pricing.usdToTry > 0 ? (
                    <p className="mt-1 text-sm text-[#b4a882]">≈ {formatTl(quote.priceTl)}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-[#8a7c52]">
                    Sürüş {formatKm(quote.distanceKm)} · {formatUsd(pricing.baseUsd, pricing.roundingDecimals)} açılış +{" "}
                    {formatUsd(pricing.perKmUsd, pricing.roundingDecimals)}/km
                  </p>
                </>
              ) : (
                <p className="mt-4 text-sm text-[#8a7c52]">Alım ve teslim noktalarını seçince sürüş ücreti görünür.</p>
              )}
              <p className="mt-2 text-xs text-[#8a7c52]">
                Fiyat yol (sürüş) mesafesine göredir, kuş uçuşu değildir. Gerçek kart tahsilatı yok; yöntem ve durum kayıt
                edilir. {MAX_WEIGHT_KG} kg üzeri kabul edilmez.
              </p>
              <Button className={`mt-5 h-12 w-full ${goldBtn}`} disabled={busy || !quote}>
                {busy ? "Gönderiliyor…" : "Siparişi oluştur"}
              </Button>
            </aside>
          </form>
        )}

        {!loading && !error && tab === "aktif" && (
          <div className="mt-5 grid gap-3">
            {active.length === 0 ? (
              <EmptyState
                title="Aktif sipariş yok"
                body="Yeni sipariş sekmesinden haritada alım ve teslim noktalarını seçerek kurye çağırın."
                action={
                  <Button className={goldBtn} onClick={() => setTab("yeni")}>
                    Sipariş oluştur
                  </Button>
                }
              />
            ) : (
              active.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  showMap
                  extra={
                    <p className="mt-2 text-xs text-[#8a7c52]">
                      Durum canlı güncellenir: {STATUS_LABELS[order.status]}
                    </p>
                  }
                />
              ))
            )}
          </div>
        )}

        {!loading && !error && tab === "gecmis" && (
          <div className="mt-5 grid gap-3">
            {history.length === 0 ? (
              <EmptyState title="Geçmiş boş" body="Teslim edilen veya iptal edilen siparişler burada görünür." />
            ) : (
              history.map(order => <OrderCard key={order.id} order={order} />)
            )}
          </div>
        )}

        {orders[0] ? (
          <p className="mt-6 text-xs text-[#8a7c52]">
            Son sipariş{" "}
            <StatusBadge label={STATUS_LABELS[orders[0].status]} className={statusTone(orders[0].status)} />
          </p>
        ) : null}
      </div>
    </BrandShell>
  );
}

export default function CustomerPanel() {
  return (
    <RequireRole role="customer">
      <CustomerHome />
    </RequireRole>
  );
}

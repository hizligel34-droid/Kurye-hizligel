import { AddressFields, type AddressDraft } from "@/components/kuryeler/AddressFields";
import { BrandShell, InstallHint, StatusBadge } from "@/components/kuryeler/BrandShell";
import { OrderCard } from "@/components/kuryeler/OrderCard";
import { RequireRole } from "@/components/kuryeler/RequireRole";
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
import { areaClass, cardClass, fieldClass, goldBtn, selectClass } from "@/lib/kuryelerTheme";
import {
  formatTl,
  isActiveOrder,
  PACKAGE_DESCRIPTIONS,
  PACKAGE_LABELS,
  PACKAGE_TYPES,
  STATUS_LABELS,
  statusTone,
  type DeliveryOrder,
  type PackageType,
  type PricingSettings,
} from "@shared/kuryeler";
import { firstError, validateDeliveryOrder, type FieldErrors } from "@shared/kuryelerValidation";
import { normalizeTurkishMobilePhone } from "@shared/orderValidation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

const emptyAddress: AddressDraft = { district: "", neighborhood: "", street: "", note: "" };

function CustomerHome() {
  const { user, refresh } = useKuryelerAuth();
  const [pickup, setPickup] = useState<AddressDraft>({ ...emptyAddress, district: "Kadıköy" });
  const [dropoff, setDropoff] = useState<AddressDraft>({ ...emptyAddress, district: "Beşiktaş" });
  const [packageType, setPackageType] = useState<PackageType>("kucuk");
  const [notes, setNotes] = useState("");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [pricing, setPricing] = useState<PricingSettings | null>(null);
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

  const input: CreateOrderInput = {
    pickupDistrict: pickup.district,
    pickupNeighborhood: pickup.neighborhood,
    pickupStreet: pickup.street,
    pickupNote: pickup.note,
    dropoffDistrict: dropoff.district,
    dropoffNeighborhood: dropoff.neighborhood,
    dropoffStreet: dropoff.street,
    dropoffNote: dropoff.note,
    packageType,
    notes,
    contactPhone: phone,
  };

  const quote = useMemo(
    () => (pricing && pickup.district && dropoff.district ? estimateOrder(input, pricing) : null),
    [pricing, pickup, dropoff, packageType],
  );

  const active = orders.filter(o => isActiveOrder(o.status));
  const history = orders.filter(o => !isActiveOrder(o.status));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    const nextErrors = validateDeliveryOrder({
      pickupDistrict: pickup.district,
      pickupNeighborhood: pickup.neighborhood,
      pickupStreet: pickup.street,
      dropoffDistrict: dropoff.district,
      dropoffNeighborhood: dropoff.neighborhood,
      dropoffStreet: dropoff.street,
      contactPhone: phone,
    });
    setFieldErrors(nextErrors);
    const message = firstError(nextErrors);
    if (message) {
      toast.error(message);
      return;
    }
    setBusy(true);
    try {
      const order = await createOrder(user.id, {
        ...input,
        contactPhone: normalizeTurkishMobilePhone(phone),
      });
      toast.success(`Sipariş alındı · ${order.trackingCode}`);
      setNotes("");
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
              <AddressFields id="pickup" label="Alış adresi" value={pickup} onChange={setPickup} errors={fieldErrors} />
              <AddressFields id="dropoff" label="Teslim adresi" value={dropoff} onChange={setDropoff} errors={fieldErrors} />
              <label className="block space-y-2" htmlFor="package-type">
                <span className="text-sm font-bold text-[#D4AF37]">Paket türü</span>
                <select
                  id="package-type"
                  className={selectClass}
                  value={packageType}
                  onChange={e => setPackageType(e.target.value as PackageType)}
                >
                  {PACKAGE_TYPES.map(type => (
                    <option key={type} value={type}>
                      {PACKAGE_LABELS[type]}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-[#8a7c52]">{PACKAGE_DESCRIPTIONS[packageType]}</span>
              </label>
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
              <label className="block" htmlFor="order-notes">
                <span className="mb-1 block text-sm font-bold text-[#D4AF37]">Notlar (isteğe bağlı)</span>
                <Textarea
                  id="order-notes"
                  className={areaClass}
                  placeholder="Kapıda ödeme, kırılır vb."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </label>
            </div>
            <aside className={`${cardClass} h-fit min-w-0 p-4 sm:p-5 lg:sticky lg:top-24`}>
              <p className="text-sm font-bold text-[#D4AF37]">Fiyat tahmini</p>
              {quote ? (
                <ul className="mt-4 space-y-2 text-sm text-[#b4a882]">
                  <li className="flex justify-between gap-3">
                    <span>Mesafe</span>
                    <span>{quote.distanceKm.toLocaleString("tr-TR")} km</span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span>Açılış</span>
                    <span>{formatTl(quote.baseFeeTl)}</span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span>Km bedeli</span>
                    <span>{formatTl(quote.distanceFeeTl)}</span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span>Paket</span>
                    <span>{formatTl(quote.packageFeeTl)}</span>
                  </li>
                  {quote.zoneSurchargeTl > 0 && (
                    <li className="flex justify-between gap-3">
                      <span>Avrupa–Anadolu</span>
                      <span>{formatTl(quote.zoneSurchargeTl)}</span>
                    </li>
                  )}
                  <li className="flex justify-between gap-3 border-t border-[#3a3014] pt-2 text-lg font-black text-[#D4AF37]">
                    <span>Toplam</span>
                    <span>{formatTl(quote.totalTl)}</span>
                  </li>
                </ul>
              ) : (
                <p className="mt-4 text-sm text-[#8a7c52]">İlçeleri seçince fiyat görünür.</p>
              )}
              <Button className={`mt-5 h-12 w-full ${goldBtn}`} disabled={busy}>
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
                body="Yeni sipariş sekmesinden alış ve teslim adresini yazarak hemen kurye çağırabilirsiniz."
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

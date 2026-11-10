import { BrandShell, InstallHint } from "@/components/kuryeler/BrandShell";
import { OrderCard } from "@/components/kuryeler/OrderCard";
import { RequireRole } from "@/components/kuryeler/RequireRole";
import { EmptyState, ErrorState, FieldError, LoadingState } from "@/components/kuryeler/UiStates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useKuryelerAuth } from "@/contexts/KuryelerAuth";
import {
  advanceStatus,
  assignCourier,
  getDashboard,
  getPricing,
  listDistrictPrices,
  listOrdersFor,
  listSupportMessages,
  listSupportTickets,
  listUsers,
  postSupportMessage,
  setPaymentStatus,
  subscribeToOrders,
  updateDistrictPrice,
  updatePricing,
  updateUserRole,
} from "@/lib/kuryelerApi";
import { PriceLines } from "@/components/kuryeler/PriceLines";
import { areaClass, cardClass, fieldClass, goldBtn, ghostBtn, selectClass } from "@/lib/kuryelerTheme";
import {
  calculateDeliveryPrice,
  DEFAULT_PRICING,
  formatKm,
  formatTariff,
  formatTl,
  roundMoney,
  VAT_EXCL_LABEL,
  VAT_INCL_LABEL,
  GEOCODERS,
  ROLE_LABELS,
  ROUTING_PROVIDER_LABELS,
  ROUTING_PROVIDERS,
  type DashboardStats,
  type DeliveryOrder,
  type DistrictPrice,
  type Geocoder,
  type PricingSettings,
  type Profile,
  type RoutingProvider,
  type UserRole,
} from "@shared/kuryeler";
import { SUPPORT_KIND_LABELS, type SupportMessage, type SupportTicket } from "@shared/kuryelerSupport";
import { firstError, validateDistrictPrice, validatePricingForm } from "@shared/kuryelerValidation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

function AdminHome() {
  const { user, refresh } = useKuryelerAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);
  const [districts, setDistricts] = useState<DistrictPrice[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pricingErrors, setPricingErrors] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"siparis" | "destek" | "fiyat" | "hesaplar">("siparis");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [ticketMessages, setTicketMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState("");
  const [showDistricts, setShowDistricts] = useState(false);

  const load = async () => {
    if (!user) return;
    setError(null);
    const [nextStats, nextOrders, nextUsers, nextPricing, nextDistricts, nextTickets] = await Promise.all([
      getDashboard(user),
      listOrdersFor(user),
      listUsers(),
      getPricing(),
      listDistrictPrices(),
      listSupportTickets(user),
    ]);
    setStats(nextStats);
    setOrders(nextOrders);
    setUsers(nextUsers);
    setPricing(nextPricing);
    setDistricts(nextDistricts);
    setTickets(nextTickets);
    const nextTicket = ticketId && nextTickets.some(t => t.id === ticketId) ? ticketId : nextTickets[0]?.id ?? null;
    setTicketId(nextTicket);
    if (nextTicket) setTicketMessages(await listSupportMessages(nextTicket));
  };

  useEffect(() => {
    setLoading(true);
    void load()
      .catch(err => setError(err instanceof Error ? err.message : "Yönetim verisi alınamadı"))
      .finally(() => setLoading(false));
    return subscribeToOrders(() => {
      void load();
      void refresh();
    });
  }, [user?.id]);

  const couriers = users.filter(item => item.role === "courier");
  const customers = users.filter(item => item.role === "customer");
  const sample = calculateDeliveryPrice({ distanceKm: 10, pricing });

  const savePricing = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validatePricingForm(pricing);
    setPricingErrors(nextErrors);
    const message = firstError(nextErrors);
    if (message) {
      toast.error(message);
      return;
    }
    setBusy(true);
    try {
      setPricing(await updatePricing(pricing));
      toast.success("Fiyat ayarları kaydedildi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kaydedilemedi");
    } finally {
      setBusy(false);
    }
  };

  const saveZone = async (bolge: string, fiyatTl: number) => {
    const message = validateDistrictPrice(fiyatTl);
    if (message) {
      toast.error(`${bolge}: ${message}`);
      return;
    }
    try {
      setDistricts(await updateDistrictPrice(bolge, fiyatTl));
      toast.success(`${bolge} referans fiyatı güncellendi`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fiyat kaydedilemedi");
    }
  };

  return (
    <BrandShell panel="yonetici" title="Yönetici özeti">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-4">
        <InstallHint panel="yonetici" />
        {loading ? <LoadingState label="Özet yükleniyor…" /> : null}
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
        {loading || error ? null : (
          <>
            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                ["Bugünün siparişleri", String(stats?.todayOrders ?? "—")],
                ["Bugün gelir", stats ? `${formatTl(stats.todayRevenueTl)} ${VAT_INCL_LABEL}` : "—"],
                ["Aktif kurye", String(stats?.activeCouriers ?? "—")],
                ["Bekleyen / yolda", `${stats?.pendingOrders ?? 0} / ${stats?.enRouteOrders ?? 0}`],
              ].map(([label, value]) => (
                <div key={label} className={`${cardClass} min-w-0 p-3 sm:p-4`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a7c52] sm:text-xs">{label}</p>
                  <p className="mt-2 text-xl font-black text-[#D4AF37] sm:text-2xl">{value}</p>
                </div>
              ))}
            </section>

            <div className="grid grid-cols-4 gap-1 rounded-2xl border border-[#3a3014] bg-black p-1">
              {([
                ["siparis", "Siparişler"],
                ["destek", `Destek (${tickets.filter(t => t.status !== "kapali").length})`],
                ["fiyat", "Fiyat"],
                ["hesaplar", "Hesaplar"],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`min-h-11 rounded-xl text-xs font-bold sm:text-sm ${
                    tab === id ? "bg-[#D4AF37] text-black" : "text-[#b4a882]"
                  }`}
                  onClick={() => setTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "siparis" ? (
              <section>
                <h2 className="text-lg font-black">Tüm siparişler</h2>
                <div className="mt-3 grid gap-3">
                  {orders.length === 0 ? (
                    <EmptyState title="Sipariş yok" body="Müşteriler sipariş oluşturunca atama ve iptal buradan yönetilir." />
                  ) : (
                    orders.map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        audience="business"
                        showMap
                        extra={
                          <p className="mt-2 text-xs text-[#8a7c52]">
                            Firma payı {formatTl(order.companyRevenueTl)} {VAT_EXCL_LABEL} · Kurye {formatTl(order.courierEarningTl)} {VAT_EXCL_LABEL}
                          </p>
                        }
                        actions={
                          <>
                            <select
                              className={`${selectClass} min-w-0`}
                              value={order.courierId ?? ""}
                              aria-label="Kurye ata"
                              onChange={event => {
                                const courierId = event.target.value;
                                if (!courierId) return;
                                void assignCourier(order.id, courierId)
                                  .then(() => {
                                    toast.success("Kurye atandı");
                                    return load();
                                  })
                                  .catch(err => toast.error(err instanceof Error ? err.message : "Atanamadı"));
                              }}
                            >
                              <option value="">{order.courierId ? "Kuryeyi değiştir" : "Kurye ata"}</option>
                              {couriers.map(courier => (
                                <option key={courier.id} value={courier.id}>
                                  {courier.fullName || courier.email} {courier.isOnline ? "· çevrimiçi" : ""}
                                </option>
                              ))}
                            </select>
                            {order.paymentStatus === "bekliyor" ? (
                              <Button
                                variant="outline"
                                className={ghostBtn}
                                onClick={() =>
                                  void setPaymentStatus(order.id, "odendi")
                                    .then(() => {
                                      toast.success("Ödendi");
                                      return load();
                                    })
                                    .catch(err => toast.error(err instanceof Error ? err.message : "Güncellenemedi"))
                                }
                              >
                                Ödendi
                              </Button>
                            ) : null}
                            {order.status !== "cancelled" && order.status !== "delivered" ? (
                              <Button
                                variant="outline"
                                className={`${ghostBtn} w-full sm:w-auto`}
                                onClick={() =>
                                  void advanceStatus(order.id, "cancelled")
                                    .then(() => {
                                      toast.success("Sipariş iptal edildi");
                                      return load();
                                    })
                                    .catch(err => toast.error(err instanceof Error ? err.message : "İptal edilemedi"))
                                }
                              >
                                İptal
                              </Button>
                            ) : null}
                          </>
                        }
                      />
                    ))
                  )}
                </div>
              </section>
            ) : null}

            {tab === "destek" ? (
              <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-2">
                  <h2 className="text-lg font-black">Destek kuyruğu</h2>
                  {tickets.length === 0 ? (
                    <EmptyState title="Kayıt yok" body="Müşteri destek, iptal ve şikayetleri burada görünür." />
                  ) : (
                    tickets.map(ticket => (
                      <button
                        key={ticket.id}
                        type="button"
                        className={`${cardClass} w-full p-4 text-left ${ticket.id === ticketId ? "border-[#D4AF37]" : ""}`}
                        onClick={() => {
                          setTicketId(ticket.id);
                          void listSupportMessages(ticket.id).then(setTicketMessages);
                        }}
                      >
                        <p className="text-sm font-bold text-[#D4AF37]">{ticket.subject}</p>
                        <p className="mt-1 text-xs text-[#8a7c52]">
                          {SUPPORT_KIND_LABELS[ticket.kind]} · {ticket.status}
                        </p>
                      </button>
                    ))
                  )}
                </div>
                <div className={`${cardClass} space-y-3 p-4 sm:p-5`}>
                  {ticketId ? (
                    <>
                      <div className="max-h-80 space-y-2 overflow-y-auto">
                        {ticketMessages.map(message => (
                          <div key={message.id} className="rounded-2xl border border-[#3a3014] bg-black p-3">
                            <p className="text-[11px] font-bold uppercase text-[#8a7c52]">
                              {message.sender === "customer" ? "Müşteri" : message.sender === "bot" ? "Bot" : "Yönetici"}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm">{message.body}</p>
                          </div>
                        ))}
                      </div>
                      <Textarea
                        className={areaClass}
                        placeholder="Cevap yazın (bot da aynı kuyruğa düşer)"
                        value={reply}
                        onChange={e => setReply(e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          className={goldBtn}
                          onClick={() =>
                            void postSupportMessage({ ticketId, body: reply })
                              .then(() => {
                                setReply("");
                                toast.success("Cevap kayda düştü");
                                return load();
                              })
                              .catch(err => toast.error(err instanceof Error ? err.message : "Gönderilemedi"))
                          }
                        >
                          Cevapla
                        </Button>
                        <Button
                          variant="outline"
                          className={ghostBtn}
                          onClick={() =>
                            void postSupportMessage({ ticketId, body: reply, asBot: true })
                              .then(() => {
                                setReply("");
                                toast.success("Bot cevabı kayda düştü");
                                return load();
                              })
                              .catch(err => toast.error(err instanceof Error ? err.message : "Gönderilemedi"))
                          }
                        >
                          Bot olarak yaz
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-[#8a7c52]">Soldan bir kayıt seçin.</p>
                  )}
                </div>
              </section>
            ) : null}

            {tab === "fiyat" ? (
              <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                <form className={`${cardClass} h-fit space-y-3 p-5`} onSubmit={savePricing}>
                  <h2 className="text-lg font-black">Sürüş ücreti (TL)</h2>
                  <p className="text-xs text-[#8a7c52]">
                    Ana fiyat KDV hariçtir: açılış + km bedeli × yol mesafesi. Üstüne KDV eklenir. Kuş uçuşu kullanılmaz. Fiyat yalnızca Türk lirasıdır.
                  </p>
                  <label className="block text-sm">
                    Açılış ücreti (TL, KDV hariç)
                    <Input
                      className={`${fieldClass} mt-1`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={pricing.baseTry}
                      onChange={e => setPricing({ ...pricing, baseTry: Number(e.target.value) })}
                    />
                    <FieldError id="base-err" message={pricingErrors.baseTry} />
                  </label>
                  <label className="block text-sm">
                    Kilometre bedeli (TL / km, KDV hariç)
                    <Input
                      className={`${fieldClass} mt-1`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={pricing.perKmTry}
                      onChange={e => setPricing({ ...pricing, perKmTry: Number(e.target.value) })}
                    />
                    <FieldError id="perkm-err" message={pricingErrors.perKmTry} />
                  </label>
                  <label className="block text-sm">
                    Yuvarlama (ondalık basamak)
                    <Input
                      className={`${fieldClass} mt-1`}
                      type="number"
                      min={0}
                      max={6}
                      step="1"
                      value={pricing.roundingDecimals}
                      onChange={e => setPricing({ ...pricing, roundingDecimals: Number(e.target.value) })}
                    />
                    <FieldError id="round-err" message={pricingErrors.roundingDecimals} />
                  </label>
                  <label className="block text-sm">
                    KDV oranı (%)
                    <Input
                      className={`${fieldClass} mt-1`}
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={roundMoney(pricing.vatRate * 100, 2)}
                      onChange={e => setPricing({ ...pricing, vatRate: Number(e.target.value) / 100 })}
                    />
                    <FieldError id="vat-err" message={pricingErrors.vatRate} />
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={pricing.showcaseMode}
                      onChange={e => setPricing({ ...pricing, showcaseMode: e.target.checked })}
                    />
                    Vitrin modu (kayıt ve sipariş kapalı)
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={pricing.deliveryTargetsPublic}
                      onChange={e => setPricing({ ...pricing, deliveryTargetsPublic: e.target.checked })}
                    />
                    Teslim süresi tablosunu müşteriye göster (`delivery_targets_public`)
                  </label>
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-bold">Hedef teslim kademeleri (iç bilgi, yol km)</legend>
                    <p className="text-xs text-[#8a7c52]">
                      Yönetici iç bilgi. Varsayılan kapalı (KTY md.43/A-3). Müşteriye “Makul sürede, aktarmasız teslim”
                      gösterilir. Boş km = son kademe (aynı gün). Garanti veya iade sözü yazılmaz.
                    </p>
                    {pricing.deliveryTargetTiers.map((tier, index) => (
                      <div key={`${index}-${tier.label}`} className="grid grid-cols-[7rem_1fr] gap-2">
                        <Input
                          className={fieldClass}
                          type="number"
                          min={0}
                          step="0.1"
                          placeholder="km"
                          aria-label={`${index + 1}. kademe km eşiği`}
                          value={tier.maxKm ?? ""}
                          onChange={e => {
                            const raw = e.target.value.trim();
                            const next = [...pricing.deliveryTargetTiers];
                            next[index] = {
                              ...tier,
                              maxKm: raw === "" ? null : Number(raw),
                            };
                            setPricing({ ...pricing, deliveryTargetTiers: next });
                          }}
                        />
                        <Input
                          className={fieldClass}
                          aria-label={`${index + 1}. kademe etiket`}
                          value={tier.label}
                          onChange={e => {
                            const next = [...pricing.deliveryTargetTiers];
                            next[index] = { ...tier, label: e.target.value };
                            setPricing({ ...pricing, deliveryTargetTiers: next });
                          }}
                        />
                      </div>
                    ))}
                  </fieldset>
                  <label className="block text-sm">
                    Rota sağlayıcısı
                    <select
                      className={`${selectClass} mt-1 w-full`}
                      value={pricing.routingProvider}
                      onChange={e =>
                        setPricing({ ...pricing, routingProvider: e.target.value as RoutingProvider })
                      }
                    >
                      {ROUTING_PROVIDERS.map(provider => (
                        <option key={provider} value={provider}>
                          {ROUTING_PROVIDER_LABELS[provider]}
                        </option>
                      ))}
                    </select>
                    <FieldError id="provider-err" message={pricingErrors.routingProvider} />
                  </label>
                  <label className="block text-sm">
                    Rota adresi (OSRM uyumlu)
                    <Input
                      className={`${fieldClass} mt-1`}
                      value={pricing.routingUrl}
                      onChange={e => setPricing({ ...pricing, routingUrl: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm">
                    Adres araması
                    <select
                      className={`${selectClass} mt-1 w-full`}
                      value={pricing.geocoder}
                      onChange={e => setPricing({ ...pricing, geocoder: e.target.value as Geocoder })}
                    >
                      {GEOCODERS.map(item => (
                        <option key={item} value={item}>
                          {item === "nominatim" ? "Nominatim (OpenStreetMap)" : "Photon"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm">
                    Kurye kesintisi (0–1, KDV hariç net üzerinden)
                    <Input
                      className={`${fieldClass} mt-1`}
                      type="number"
                      min={0}
                      max={1}
                      step="0.01"
                      value={pricing.commissionRate}
                      onChange={e => setPricing({ ...pricing, commissionRate: Number(e.target.value) })}
                    />
                    <FieldError id="commission-err" message={pricingErrors.commissionRate} />
                  </label>
                  <div className="rounded-xl border border-[#3a3014] bg-black p-3 text-sm">
                    <p className="font-bold text-[#D4AF37]">Örnek: {formatKm(10)}</p>
                    <div className="mt-2">
                      <PriceLines price={sample} audience="business" />
                    </div>
                    <p className="mt-2 text-xs text-[#8a7c52]">{formatTariff(pricing)}</p>
                  </div>
                  <Button className={`h-11 w-full ${goldBtn}`} disabled={busy}>
                    {busy ? "Kaydediliyor…" : "Fiyat ayarlarını kaydet"}
                  </Button>
                </form>
                <div className={`${cardClass} p-5`}>
                  <h2 className="text-lg font-black">Bölge listesi (isteğe bağlı referans)</h2>
                  <p className="mt-1 text-xs text-[#8a7c52]">
                    Sipariş ücreti bu tablodan hesaplanmaz. Eski İstanbul CSV’si yalnızca yönetici notu olarak durur
                    (gösterilen rakamlar KDV hariç referanstır).
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className={`${ghostBtn} mt-3`}
                    onClick={() => setShowDistricts(open => !open)}
                  >
                    {showDistricts ? "Listeyi gizle" : `${districts.length} bölgeyi göster`}
                  </Button>
                  {showDistricts ? (
                    <ul className="mt-4 max-h-[70vh] space-y-2 overflow-y-auto">
                      {districts.map(row => (
                        <li
                          key={row.bolge}
                          className="flex items-center gap-2 rounded-xl border border-[#3a3014] bg-black px-3 py-2"
                        >
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{row.bolge}</span>
                          <Input
                            className={`${fieldClass} h-10 w-24`}
                            type="number"
                            min={0}
                            defaultValue={row.fiyatTl}
                            aria-label={`${row.bolge} referans fiyat, KDV hariç`}
                            onBlur={event => {
                              const next = Number(event.target.value);
                              if (next !== row.fiyatTl) void saveZone(row.bolge, next);
                            }}
                          />
                          <span className="text-xs text-[#8a7c52]">TL {VAT_EXCL_LABEL}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </section>
            ) : null}

            {tab === "hesaplar" ? (
              <section className={`${cardClass} p-5`}>
                <h2 className="text-lg font-black">Kuryeler, müşteriler, hesaplar</h2>
                <div className="mt-4 space-y-2">
                  {users.length === 0 ? (
                    <EmptyState title="Kullanıcı yok" body="Kayıt olan müşteri ve kuryeler burada listelenir." />
                  ) : null}
                  {users.map(person => (
                    <div
                      key={person.id}
                      className="flex flex-col gap-2 rounded-2xl border border-[#3a3014] bg-black px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold">{person.fullName || person.email || person.id.slice(0, 8)}</p>
                        <p className="text-xs text-[#8a7c52]">
                          {ROLE_LABELS[person.role]}
                          {person.phone ? ` · ${person.phone}` : ""}
                          {person.role === "courier" ? (person.isOnline ? " · çevrimiçi" : " · kapalı") : ""}
                        </p>
                      </div>
                      <select
                        className={selectClass}
                        value={person.role}
                        onChange={event => {
                          const role = event.target.value as UserRole;
                          void updateUserRole(person.id, role)
                            .then(() => {
                              toast.success("Rol güncellendi");
                              return load();
                            })
                            .catch(err => toast.error(err instanceof Error ? err.message : "Rol değiştirilemedi"));
                        }}
                      >
                        {(["customer", "courier", "admin"] as const).map(role => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                  <p className="text-xs text-[#8a7c52]">
                    {customers.length} müşteri · {couriers.length} kurye
                  </p>
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </BrandShell>
  );
}

export default function AdminPanel() {
  return (
    <RequireRole role="admin">
      <AdminHome />
    </RequireRole>
  );
}

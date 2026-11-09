import { BrandShell, InstallHint } from "@/components/kuryeler/BrandShell";
import { OrderCard } from "@/components/kuryeler/OrderCard";
import { RequireRole } from "@/components/kuryeler/RequireRole";
import { EmptyState, ErrorState, FieldError, LoadingState } from "@/components/kuryeler/UiStates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useKuryelerAuth } from "@/contexts/KuryelerAuth";
import {
  advanceStatus,
  assignCourier,
  getDashboard,
  getPricing,
  listOrdersFor,
  listUsers,
  subscribeToOrders,
  updatePricing,
  updateUserRole,
} from "@/lib/kuryelerApi";
import { cardClass, fieldClass, goldBtn, ghostBtn, selectClass } from "@/lib/kuryelerTheme";
import {
  DEFAULT_PRICING,
  formatTl,
  ROLE_LABELS,
  type DashboardStats,
  type DeliveryOrder,
  type PricingSettings,
  type Profile,
  type UserRole,
} from "@shared/kuryeler";
import { firstError, validatePricingForm, type FieldErrors } from "@shared/kuryelerValidation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

function AdminHome() {
  const { user, refresh } = useKuryelerAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const load = async () => {
    if (!user) return;
    setError(null);
    const [nextStats, nextOrders, nextUsers, nextPricing] = await Promise.all([
      getDashboard(user),
      listOrdersFor(user),
      listUsers(),
      getPricing(),
    ]);
    setStats(nextStats);
    setOrders(nextOrders);
    setUsers(nextUsers);
    setPricing(nextPricing);
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

  const savePricing = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validatePricingForm(pricing);
    setFieldErrors(nextErrors);
    const message = firstError(nextErrors);
    if (message) {
      toast.error(message);
      return;
    }
    setBusy(true);
    try {
      setPricing(await updatePricing(pricing));
      toast.success("Fiyat ayarları kaydedildi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kaydedilemedi");
    } finally {
      setBusy(false);
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
            ["Bugün gelir", stats ? formatTl(stats.todayRevenueTl) : "—"],
            ["Aktif kurye", String(stats?.activeCouriers ?? "—")],
            ["Bekleyen / yolda", `${stats?.pendingOrders ?? 0} / ${stats?.enRouteOrders ?? 0}`],
          ].map(([label, value]) => (
            <div key={label} className={`${cardClass} min-w-0 p-3 sm:p-4`}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a7c52] sm:text-xs">{label}</p>
              <p className="mt-2 text-xl font-black text-[#D4AF37] sm:text-2xl">{value}</p>
            </div>
          ))}
        </section>

        <section>
          <h2 className="text-lg font-black">Siparişler</h2>
          <div className="mt-3 grid gap-3">
            {orders.length === 0 ? (
              <EmptyState title="Sipariş yok" body="Müşteriler sipariş oluşturunca atama ve iptal buradan yönetilir." />
            ) : (
              orders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  extra={
                    <p className="mt-2 text-xs text-[#8a7c52]">
                      Firma payı {formatTl(order.companyRevenueTl)} · Kurye {formatTl(order.courierEarningTl)}
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
                            .catch(error => toast.error(error instanceof Error ? error.message : "Atanamadı"));
                        }}
                      >
                        <option value="">{order.courierId ? "Kuryeyi değiştir" : "Kurye ata"}</option>
                        {couriers.map(courier => (
                          <option key={courier.id} value={courier.id}>
                            {courier.fullName || courier.email} {courier.isOnline ? "· çevrimiçi" : ""}
                          </option>
                        ))}
                      </select>
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
                              .catch(error => toast.error(error instanceof Error ? error.message : "İptal edilemedi"))
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

        <section className="grid gap-4 lg:grid-cols-2">
          <div className={`${cardClass} p-5`}>
            <h2 className="text-lg font-black">Kuryeler ve müşteriler</h2>
            <div className="mt-4 space-y-2">
              {users.length === 0 ? (
                <EmptyState title="Kullanıcı yok" body="Kayıt olan müşteri ve kuryeler burada listelenir. Rolleri buradan değiştirebilirsiniz." />
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
                        .catch(error => toast.error(error instanceof Error ? error.message : "Rol değiştirilemedi"));
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
          </div>

          <form className={`${cardClass} space-y-3 p-5`} onSubmit={savePricing}>
            <h2 className="text-lg font-black">Fiyat ayarları</h2>
            <label className="block text-sm">
              Açılış ücreti (TL)
              <Input
                className={`${fieldClass} mt-1`}
                type="number"
                min={0}
                step="1"
                value={pricing.baseFeeTl}
                aria-invalid={Boolean(fieldErrors.baseFeeTl)}
                aria-describedby={fieldErrors.baseFeeTl ? "base-fee-err" : undefined}
                onChange={e => setPricing({ ...pricing, baseFeeTl: Number(e.target.value) })}
              />
              <FieldError id="base-fee-err" message={fieldErrors.baseFeeTl} />
            </label>
            <label className="block text-sm">
              Km başı (TL)
              <Input
                className={`${fieldClass} mt-1`}
                type="number"
                min={0}
                step="1"
                value={pricing.perKmTl}
                aria-invalid={Boolean(fieldErrors.perKmTl)}
                aria-describedby={fieldErrors.perKmTl ? "per-km-err" : undefined}
                onChange={e => setPricing({ ...pricing, perKmTl: Number(e.target.value) })}
              />
              <FieldError id="per-km-err" message={fieldErrors.perKmTl} />
            </label>
            <label className="block text-sm">
              Komisyon oranı (0–1)
              <Input
                className={`${fieldClass} mt-1`}
                type="number"
                min={0}
                max={1}
                step="0.01"
                value={pricing.commissionRate}
                aria-invalid={Boolean(fieldErrors.commissionRate)}
                aria-describedby={fieldErrors.commissionRate ? "commission-err" : undefined}
                onChange={e => setPricing({ ...pricing, commissionRate: Number(e.target.value) })}
              />
              <FieldError id="commission-err" message={fieldErrors.commissionRate} />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm">
              Avrupa–Anadolu ek ücreti
              <Switch
                checked={pricing.useZones}
                onCheckedChange={value => setPricing({ ...pricing, useZones: value })}
                aria-label="Avrupa–Anadolu ek ücretini kullan"
              />
            </label>
            <label className="block text-sm">
              Kıtalar arası ek (TL)
              <Input
                className={`${fieldClass} mt-1`}
                type="number"
                min={0}
                step="1"
                value={pricing.crossSideSurchargeTl}
                aria-invalid={Boolean(fieldErrors.crossSideSurchargeTl)}
                aria-describedby={fieldErrors.crossSideSurchargeTl ? "zone-err" : undefined}
                onChange={e => setPricing({ ...pricing, crossSideSurchargeTl: Number(e.target.value) })}
              />
              <FieldError id="zone-err" message={fieldErrors.crossSideSurchargeTl} />
            </label>
            <Button className={`h-11 w-full ${goldBtn}`} disabled={busy}>
              {busy ? "Kaydediliyor…" : "Ayarları kaydet"}
            </Button>
          </form>
        </section>
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

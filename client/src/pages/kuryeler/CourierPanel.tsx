import { BrandShell, InstallHint } from "@/components/kuryeler/BrandShell";
import { OrderCard } from "@/components/kuryeler/OrderCard";
import { ProofCapture } from "@/components/kuryeler/ProofCapture";
import { RequireRole } from "@/components/kuryeler/RequireRole";
import { EmptyState, ErrorState, LoadingState } from "@/components/kuryeler/UiStates";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useKuryelerAuth } from "@/contexts/KuryelerAuth";
import {
  acceptOrder,
  advanceStatus,
  dailyEarnings,
  listOrdersFor,
  setPaymentStatus,
  subscribeToOrders,
  toggleOnline,
} from "@/lib/kuryelerApi";
import { cardClass, goldBtn, ghostBtn } from "@/lib/kuryelerTheme";
import {
  courierStatusActionLabel,
  formatKm,
  formatTl,
  formatUsd,
  nextCourierStatus,
  type DeliveryOrder,
  type OrderStatus,
} from "@shared/kuryeler";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function CourierHome() {
  const { user, refresh } = useKuryelerAuth();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [online, setOnline] = useState(user?.isOnline ?? false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proofFor, setProofFor] = useState<{ order: DeliveryOrder; next: OrderStatus } | null>(null);

  const load = async () => {
    if (!user) return;
    setError(null);
    setOrders(await listOrdersFor(user));
  };

  useEffect(() => {
    setOnline(user?.isOnline ?? false);
  }, [user?.isOnline]);

  useEffect(() => {
    setLoading(true);
    void load()
      .catch(err => setError(err instanceof Error ? err.message : "İşler alınamadı"))
      .finally(() => setLoading(false));
    return subscribeToOrders(() => {
      void load();
      void refresh();
    });
  }, [user?.id]);

  const available = orders.filter(o => o.status === "pending" && !o.courierId);
  const mine = orders.filter(o => o.courierId === user?.id);
  const stats = useMemo(
    () => (user ? dailyEarnings(mine, user.id) : { deliveredCount: 0, earningTl: 0, earningUsd: 0, activeCount: 0 }),
    [mine, user?.id],
  );

  const setAvailability = async (next: boolean) => {
    if (!user) return;
    setOnline(next);
    try {
      await toggleOnline(user.id, next);
      await refresh();
    } catch (err) {
      setOnline(!next);
      toast.error(err instanceof Error ? err.message : "Durum güncellenemedi");
    }
  };

  const accept = async (orderId: string) => {
    setBusyId(orderId);
    try {
      await acceptOrder(orderId);
      toast.success("İş kabul edildi");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "İş alınamadı");
    } finally {
      setBusyId(null);
    }
  };

  const requestAdvance = (order: DeliveryOrder) => {
    const next = nextCourierStatus(order.status);
    if (!next) return;
    if (next === "picked_up" || next === "delivered") {
      setProofFor({ order, next });
      return;
    }
    void runAdvance(order.id, next);
  };

  const runAdvance = async (
    orderId: string,
    next: OrderStatus,
    proof?: { pickupPhoto?: string; deliveryPhoto?: string; signatureData?: string },
  ) => {
    setBusyId(orderId);
    try {
      await advanceStatus(orderId, next, proof);
      toast.success("Durum güncellendi");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Durum ilerletilemedi");
    } finally {
      setBusyId(null);
      setProofFor(null);
    }
  };

  return (
    <BrandShell panel="kurye" title="Kurye paneli">
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-4">
        <InstallHint panel="kurye" />
        {loading ? <LoadingState label="İşler yükleniyor…" /> : null}
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
        {loading || error ? null : (
          <>
            <section className={`${cardClass} flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5`}>
              <div>
                <p className="text-sm font-bold text-[#D4AF37]">{online ? "Çevrimiçisiniz" : "Çevrimdışısınız"}</p>
                <p className="mt-1 text-xs text-[#8a7c52]">
                  Çevrimiçi olunca bekleyen işler listelenir. Alım ve teslimde fotoğraf; teslimde imza gerekir.
                </p>
              </div>
              <Switch checked={online} onCheckedChange={value => void setAvailability(value)} aria-label="Çevrimiçi" />
            </section>
            <section className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                ["Bugün teslim", String(stats.deliveredCount)],
                ["Bugün kazanç", formatUsd(stats.earningUsd)],
                ["Aktif iş", String(stats.activeCount)],
              ].map(([label, value]) => (
                <div key={label} className={`${cardClass} min-w-0 p-3 sm:p-4`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a7c52] sm:text-xs">{label}</p>
                  <p className="mt-2 text-lg font-black text-[#D4AF37] sm:text-2xl">{value}</p>
                </div>
              ))}
            </section>

            <section>
              <h2 className="text-lg font-black">Müsait işler</h2>
              <div className="mt-3 grid gap-3">
                {!online ? (
                  <EmptyState title="Çevrimdışısınız" body="Müsait işleri görmek ve kabul etmek için çevrimiçi olun." />
                ) : available.length === 0 ? (
                  <EmptyState title="Bekleyen iş yok" body="Yeni sipariş düştüğünde burada görünür." />
                ) : (
                  available.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      showMap
                      extra={
                        <p className="mt-2 text-xs text-[#8a7c52]">
                          Sürüş {formatKm(order.distanceKm)} · {formatUsd(order.priceUsd)}
                          {order.courierEarningTl > 0 ? ` · kurye payı ${formatTl(order.courierEarningTl)}` : ""}
                        </p>
                      }
                      actions={
                        <Button
                          className={`h-11 w-full sm:w-auto ${goldBtn}`}
                          disabled={busyId === order.id}
                          onClick={() => void accept(order.id)}
                        >
                          İşi kabul et
                        </Button>
                      }
                    />
                  ))
                )}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-black">Atanan işlerim</h2>
              <div className="mt-3 grid gap-3">
                {mine.length === 0 ? (
                  <EmptyState title="Atanan iş yok" body="Bir işi kabul ettiğinizde burada görünür." />
                ) : (
                  mine.map(order => {
                    const action = courierStatusActionLabel(order.status);
                    return (
                      <OrderCard
                        key={order.id}
                        order={order}
                        showMap
                        extra={
                          <p className="mt-2 text-xs text-[#8a7c52]">
                            Sürüş {formatKm(order.distanceKm)} · Tel: {order.contactPhone}
                          </p>
                        }
                        actions={
                          <>
                            {action ? (
                              <Button
                                className={`h-11 w-full sm:w-auto ${goldBtn}`}
                                disabled={busyId === order.id}
                                onClick={() => requestAdvance(order)}
                              >
                                {action}
                              </Button>
                            ) : (
                              <Button variant="outline" className={ghostBtn} disabled>
                                Tamamlandı
                              </Button>
                            )}
                            {order.paymentStatus === "bekliyor" && order.status === "delivered" ? (
                              <Button
                                variant="outline"
                                className={ghostBtn}
                                onClick={() =>
                                  void setPaymentStatus(order.id, "odendi")
                                    .then(() => {
                                      toast.success("Ödeme alındı olarak işaretlendi");
                                      return load();
                                    })
                                    .catch(err => toast.error(err instanceof Error ? err.message : "Güncellenemedi"))
                                }
                              >
                                Ödendi işaretle
                              </Button>
                            ) : null}
                          </>
                        }
                      />
                    );
                  })
                )}
              </div>
            </section>
          </>
        )}
        {proofFor ? (
          <ProofCapture
            title={proofFor.next === "picked_up" ? "Alım fotoğrafı" : "Teslim fotoğrafı ve imza"}
            needPhoto
            needSignature={proofFor.next === "delivered"}
            confirmLabel={proofFor.next === "picked_up" ? "Paketi aldım" : "Teslim ettim"}
            onCancel={() => setProofFor(null)}
            onConfirm={proof =>
              void runAdvance(proofFor.order.id, proofFor.next, {
                pickupPhoto: proofFor.next === "picked_up" ? proof.photo : undefined,
                deliveryPhoto: proofFor.next === "delivered" ? proof.photo : undefined,
                signatureData: proof.signature,
              })
            }
          />
        ) : null}
      </div>
    </BrandShell>
  );
}

export default function CourierPanel() {
  return (
    <RequireRole role="courier">
      <CourierHome />
    </RequireRole>
  );
}

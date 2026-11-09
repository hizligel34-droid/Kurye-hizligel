import { BrandShell, InstallHint } from "@/components/kuryeler/BrandShell";
import { OrderCard } from "@/components/kuryeler/OrderCard";
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
  subscribeToOrders,
  toggleOnline,
} from "@/lib/kuryelerApi";
import { cardClass, goldBtn, ghostBtn } from "@/lib/kuryelerTheme";
import {
  courierStatusActionLabel,
  formatTl,
  nextCourierStatus,
  type DeliveryOrder,
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
  const stats = useMemo(() => (user ? dailyEarnings(mine, user.id) : { deliveredCount: 0, earningTl: 0, activeCount: 0 }), [mine, user?.id]);

  const setAvailability = async (next: boolean) => {
    if (!user) return;
    setOnline(next);
    try {
      await toggleOnline(user.id, next);
      await refresh();
    } catch (error) {
      setOnline(!next);
      toast.error(error instanceof Error ? error.message : "Durum güncellenemedi");
    }
  };

  const accept = async (orderId: string) => {
    if (!user) return;
    setBusyId(orderId);
    try {
      await acceptOrder(orderId, user.id);
      toast.success("İş kabul edildi");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "İş alınamadı");
    } finally {
      setBusyId(null);
    }
  };

  const advance = async (order: DeliveryOrder) => {
    const next = nextCourierStatus(order.status);
    if (!next) return;
    setBusyId(order.id);
    try {
      await advanceStatus(order.id, next);
      toast.success("Durum güncellendi");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Durum ilerletilemedi");
    } finally {
      setBusyId(null);
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
              Çevrimiçi olunca bekleyen işler listelenir. Yeni iş almak için açık olun.
            </p>
          </div>
          <Switch checked={online} onCheckedChange={value => void setAvailability(value)} aria-label="Çevrimiçi" />
        </section>
        <section className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            ["Bugün teslim", String(stats.deliveredCount)],
            ["Bugün kazanç", formatTl(stats.earningTl)],
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
              <EmptyState title="Bekleyen iş yok" body="Yeni sipariş düştüğünde burada görünür. Liste canlı güncellenir." />
            ) : (
              available.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  extra={<p className="mt-2 text-xs text-[#8a7c52]">Kazanç {formatTl(order.courierEarningTl)}</p>}
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
              <EmptyState title="Atanan iş yok" body="Bir işi kabul ettiğinizde veya yönetici sizi atadığında burada görünür." />
            ) : (
              mine.map(order => {
                const action = courierStatusActionLabel(order.status);
                return (
                  <OrderCard
                    key={order.id}
                    order={order}
                    extra={<p className="mt-2 text-xs text-[#8a7c52]">Tel: {order.contactPhone}</p>}
                    actions={
                      action ? (
                        <Button
                          className={`h-11 w-full sm:w-auto ${goldBtn}`}
                          disabled={busyId === order.id}
                          onClick={() => void advance(order)}
                        >
                          {action}
                        </Button>
                      ) : (
                        <Button variant="outline" className={ghostBtn} disabled>
                          Tamamlandı
                        </Button>
                      )
                    }
                  />
                );
              })
            )}
          </div>
        </section>
        </>
        )}
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

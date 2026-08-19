import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { buildCourierChartData, summarizeCourierRows } from "@/lib/courierProfile";
import { BarChart3, CalendarDays, CheckCircle2, Clock3, Coins, PackageCheck, RefreshCw, Route, Trophy, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const statusLabels: Record<string, string> = {
  received: "Alındı",
  on_the_way: "Yolda",
  delivered: "Teslim edildi",
  cancelled: "İptal edildi",
};

const statusStyles: Record<string, string> = {
  received: "border-amber-200 bg-amber-50 text-amber-700",
  on_the_way: "border-blue-200 bg-blue-50 text-blue-700",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700",
};

function money(value: number) {
  return `${value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
}

function dateLabel(value: string | number | Date | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CourierProfile() {
  const { user } = useAuth();
  const isCourier = user?.role === "courier";
  const [status, setStatus] = useState<"all" | "received" | "on_the_way" | "delivered" | "cancelled">("all");
  const reportInput = useMemo(() => ({ status, sortBy: "date" as const, direction: "desc" as const }), [status]);
  const report = trpc.courier.report.useQuery(reportInput, { enabled: isCourier });
  const achievement = trpc.courier.performance.useQuery(undefined, { enabled: isCourier });
  const leaderboard = trpc.courier.leaderboard.useQuery(undefined, { enabled: isCourier });

  const rows = report.data?.rows ?? [];
  const totals = report.data?.totals ?? { orders: 0, earnings: 0, gross: 0 };
  const metrics = useMemo(() => summarizeCourierRows(rows), [rows]);
  const currentRank = leaderboard.data?.find((entry) => entry.courierId === user?.id);
  const chartData = useMemo(() => buildCourierChartData(rows), [rows]);

  if (!isCourier) {
    return <DashboardLayout><main className="min-h-screen bg-slate-50 p-4 sm:p-8"><Card className="mx-auto max-w-xl border-0 shadow-sm"><CardContent className="p-8 text-center"><UserRound className="mx-auto h-10 w-10 text-orange-500"/><h1 className="mt-4 text-2xl font-black text-slate-950">Kurye profili</h1><p className="mt-2 text-sm text-slate-500">Bu profil yalnızca kurye hesaplarına açıktır.</p></CardContent></Card></main></DashboardLayout>;
  }

  return <DashboardLayout>
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col justify-between gap-4 rounded-3xl bg-slate-950 p-6 text-white shadow-sm sm:flex-row sm:items-end sm:p-8">
          <div>
            <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500"><UserRound className="h-6 w-6"/></div><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">Kurye profili</p><h1 className="text-2xl font-black sm:text-3xl">{user?.name || "Run Courier kuryesi"}</h1></div></div>
            <p className="mt-4 max-w-xl text-sm text-slate-300">Teslimat geçmişinizi, kazançlarınızı ve operasyon performansınızı tek ekrandan takip edin.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300"><CalendarDays className="h-4 w-4"/> Güncel rapor: {new Date().toLocaleDateString("tr-TR")}</div>
        </section>

        {report.isError || achievement.isError ? <Card className="border-rose-200 bg-rose-50"><CardContent className="flex flex-col gap-3 p-5 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"><span>Kurye raporu şu anda yüklenemedi. Hesabınızın ve veritabanı bağlantısının hazır olduğunu kontrol edin.</span><Button variant="outline" onClick={() => { void report.refetch(); void achievement.refetch(); }}><RefreshCw className="mr-2 h-4 w-4"/>Tekrar dene</Button></CardContent></Card> : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Toplam kazanç", value: money(totals.earnings), note: `${metrics.completed} tamamlanan teslimat`, icon: Coins, color: "text-emerald-600" },
            { label: "Teslimat başarısı", value: `%${metrics.successRate.toFixed(0)}`, note: `${metrics.cancelled} iptal · ${metrics.active} aktif`, icon: CheckCircle2, color: "text-blue-600" },
            { label: "Ortalama kazanç", value: money(metrics.averageEarning), note: "Teslimat başına", icon: BarChart3, color: "text-orange-600" },
            { label: "Ortalama rota süresi", value: metrics.averageDuration ? `${metrics.averageDuration.toFixed(0)} dk` : "—", note: "Teslim edilen siparişler", icon: Clock3, color: "text-violet-600" },
          ].map((metric) => <Card key={metric.label} className="border-0 shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-500">{metric.label}</p><metric.icon className={`h-5 w-5 ${metric.color}`}/></div><p className="mt-3 text-2xl font-black text-slate-950">{metric.value}</p><p className="mt-1 text-xs text-slate-400">{metric.note}</p></CardContent></Card>)}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-orange-500"/>Günlük kazanç ve teslimatlar</CardTitle></CardHeader><CardContent><div className="h-[300px]">{chartData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/><XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(value) => String(value).slice(5)}/><YAxis yAxisId="left" tick={{ fontSize: 11 }}/><YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(value) => `${value} TL`}/><Tooltip formatter={(value, name) => [name === "earnings" ? money(Number(value)) : Number(value), name === "earnings" ? "Kazanç" : "Teslimat"]}/><Bar yAxisId="left" dataKey="deliveries" name="Teslimat" fill="#f97316" radius={[5, 5, 0, 0]}/><Bar yAxisId="right" dataKey="earnings" name="Kazanç" fill="#10b981" radius={[5, 5, 0, 0]}/></BarChart></ResponsiveContainer> : <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center"><PackageCheck className="h-9 w-9 text-slate-300"/><p className="mt-3 font-bold text-slate-700">Henüz teslimat verisi yok</p><p className="mt-1 max-w-sm text-sm text-slate-500">Tamamlanan teslimatlarınız oluştukça günlük grafik burada görünecek.</p></div>}</div></CardContent></Card>
          <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-orange-500"/>Başarı seviyesi</CardTitle></CardHeader><CardContent>{achievement.data ? <div className="space-y-5"><div className="rounded-2xl bg-orange-50 p-5"><p className="text-xs font-bold uppercase tracking-wide text-orange-600">Mevcut rozet</p><p className="mt-2 text-2xl font-black text-slate-950">{achievement.data.badgeLabel}</p><p className="mt-1 text-sm text-slate-500">{achievement.data.points} puan · {achievement.data.completedDeliveries} tamamlanan teslimat</p></div><div><div className="mb-2 flex justify-between text-xs font-bold text-slate-500"><span>Sonraki seviye</span><span>%{achievement.data.progressPercent}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-orange-500" style={{ width: `${achievement.data.progressPercent}%` }}/></div><p className="mt-2 text-xs text-slate-500">{achievement.data.nextBadgeLabel ? `${achievement.data.remainingToNext} teslimat sonra ${achievement.data.nextBadgeLabel}` : "En üst seviyedesiniz."}</p></div>{currentRank ? <div className="flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-sm text-slate-500">Liderlik sırası</span><strong className="text-lg text-slate-950">#{(leaderboard.data ?? []).findIndex((entry) => entry.courierId === user?.id) + 1}</strong></div> : null}</div> : <p className="text-sm text-slate-500">Performans özeti yükleniyor.</p>}</CardContent></Card>
        </div>

        <Card className="border-0 shadow-sm"><CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="flex items-center gap-2"><Route className="h-5 w-5 text-orange-500"/>Teslimat geçmişi</CardTitle><p className="mt-1 text-sm text-slate-500">Kazançlarınız yalnızca size ait kurye raporu üzerinden gösterilir.</p></div><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700" aria-label="Teslimat durumu filtresi"><option value="all">Tüm durumlar</option><option value="delivered">Teslim edildi</option><option value="on_the_way">Yolda</option><option value="received">Alındı</option><option value="cancelled">İptal edildi</option></select></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b text-xs uppercase tracking-wide text-slate-400"><th className="px-3 py-3">Sipariş</th><th className="px-3 py-3">Rota</th><th className="px-3 py-3">Durum</th><th className="px-3 py-3">Tarih</th><th className="px-3 py-3 text-right">Kazanç</th></tr></thead><tbody>{report.isLoading ? <tr><td colSpan={5} className="px-3 py-12 text-center text-slate-500">Teslimat raporu yükleniyor…</td></tr> : rows.length ? rows.map((row) => <tr key={row.id} className="border-b last:border-0"><td className="px-3 py-4 font-bold text-slate-800">{row.trackingCode}</td><td className="max-w-[340px] px-3 py-4"><p className="truncate text-slate-700">{row.pickupAddress}</p><p className="truncate text-xs text-slate-400">→ {row.deliveryAddress}</p></td><td className="px-3 py-4"><Badge className={statusStyles[row.status] || "border-slate-200 bg-slate-50 text-slate-700"}>{statusLabels[row.status] || row.status}</Badge></td><td className="whitespace-nowrap px-3 py-4 text-slate-500">{dateLabel(row.createdAt)}</td><td className="whitespace-nowrap px-3 py-4 text-right font-black text-emerald-700">{money(Number(row.courierEarning))}</td></tr>) : <tr><td colSpan={5} className="px-3 py-12 text-center text-slate-500">Bu filtrede teslimat bulunmuyor.</td></tr>}</tbody></table></div></CardContent></Card>
      </div>
    </main>
  </DashboardLayout>;
}

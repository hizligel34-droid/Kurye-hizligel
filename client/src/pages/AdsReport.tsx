import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { BarChart3, ClipboardPaste, Download, RefreshCw, ShieldCheck, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type AdsRow = {
  date: string;
  campaignId: string;
  campaignName: string;
  status: string;
  impressions: number;
  clicks: number;
  ctr: number;
  averageCpc: number;
  cost: number;
  conversions: number;
  costPerConversion: number;
};

const QUERY = `SELECT
  campaign.id,
  campaign.name,
  campaign.status,
  segments.date,
  metrics.impressions,
  metrics.clicks,
  metrics.ctr,
  metrics.average_cpc,
  metrics.cost_micros,
  metrics.conversions,
  metrics.cost_per_conversion
FROM campaign
WHERE segments.date BETWEEN '{{START_DATE}}' AND '{{END_DATE}}'
  AND campaign.status != 'REMOVED'
ORDER BY segments.date DESC, metrics.cost_micros DESC`;

const money = (value: number) => `${value.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} TL`;
const number = (value: number) => value.toLocaleString("tr-TR", { maximumFractionDigits: 0 });

function normalizeRows(input: unknown): AdsRow[] {
  const raw = Array.isArray(input) ? input : typeof input === "object" && input !== null && "results" in input ? (input as { results?: unknown[] }).results ?? [] : [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const campaign = (row.campaign as Record<string, unknown> | undefined) ?? row;
    const metrics = (row.metrics as Record<string, unknown> | undefined) ?? row;
    const segments = (row.segments as Record<string, unknown> | undefined) ?? row;
    const micros = Number(metrics.cost_micros ?? metrics.costMicros ?? 0);
    const cpcMicros = Number(metrics.average_cpc ?? metrics.averageCpc ?? 0);
    const conversionCostMicros = Number(metrics.cost_per_conversion ?? metrics.costPerConversion ?? 0);
    const parsed: AdsRow = {
      date: String(segments.date ?? row.date ?? ""),
      campaignId: String(campaign.id ?? row.campaignId ?? ""),
      campaignName: String(campaign.name ?? row.campaignName ?? "Ads kampanyası"),
      status: String(campaign.status ?? row.status ?? "UNKNOWN"),
      impressions: Number(metrics.impressions ?? 0),
      clicks: Number(metrics.clicks ?? 0),
      ctr: Number(metrics.ctr ?? 0) * (Number(metrics.ctr ?? 0) <= 1 ? 100 : 1),
      averageCpc: cpcMicros > 1000 ? cpcMicros / 1_000_000 : cpcMicros,
      cost: micros > 1000 ? micros / 1_000_000 : micros,
      conversions: Number(metrics.conversions ?? 0),
      costPerConversion: conversionCostMicros > 1000 ? conversionCostMicros / 1_000_000 : conversionCostMicros,
    };
    return parsed.date && Number.isFinite(parsed.impressions) ? [parsed] : [];
  });
}

function readStoredRows(): AdsRow[] {
  try { return normalizeRows(JSON.parse(localStorage.getItem("run-courier-google-ads-report") ?? "[]")); } catch { return []; }
}

export default function AdsReport() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AdsRow[]>(() => typeof window === "undefined" ? [] : readStoredRows());
  const [json, setJson] = useState("");
  const [message, setMessage] = useState("");

  const daily = useMemo(() => {
    const grouped = new Map<string, AdsRow>();
    rows.forEach((row) => {
      const current = grouped.get(row.date) ?? { ...row, campaignName: "Tüm kampanyalar", campaignId: "", status: "MIXED" };
      grouped.set(row.date, { ...current, impressions: current.impressions + row.impressions, clicks: current.clicks + row.clicks, cost: current.cost + row.cost, conversions: current.conversions + row.conversions });
    });
    return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date)).map((row) => ({ ...row, ctr: row.impressions ? row.clicks / row.impressions * 100 : 0 }));
  }, [rows]);

  const totals = useMemo(() => rows.reduce((acc, row) => ({ impressions: acc.impressions + row.impressions, clicks: acc.clicks + row.clicks, cost: acc.cost + row.cost, conversions: acc.conversions + row.conversions }), { impressions: 0, clicks: 0, cost: 0, conversions: 0 }), [rows]);
  const totalCtr = totals.impressions ? totals.clicks / totals.impressions * 100 : 0;
  const avgCpa = totals.conversions ? totals.cost / totals.conversions : 0;

  const importReport = () => {
    try {
      const parsed = normalizeRows(JSON.parse(json));
      if (!parsed.length) throw new Error("Geçerli günlük satır bulunamadı");
      localStorage.setItem("run-courier-google-ads-report", JSON.stringify(parsed));
      setRows(parsed);
      setMessage(`${parsed.length} rapor satırı içe aktarıldı.`);
      setJson("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "GAQL çıktısı okunamadı."); }
  };

  const clearReport = () => { localStorage.removeItem("run-courier-google-ads-report"); setRows([]); setMessage("Yerel rapor verisi temizlendi."); };

  if (user && user.role !== "admin") {
    return <DashboardLayout><div className="mx-auto max-w-2xl py-16"><Card><CardContent className="p-8 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-orange-500"/><h1 className="mt-4 text-2xl font-black">Yönetici yetkisi gerekli</h1><p className="mt-2 text-slate-500">Google Ads performans raporu yalnızca operasyon yöneticilerine açıktır.</p></CardContent></Card></div></DashboardLayout>;
  }

  return <DashboardLayout><div className="mx-auto max-w-7xl space-y-6 py-4">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Badge className="bg-orange-100 text-orange-700">Google Ads · salt-okuma</Badge><h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Performans raporu</h1><p className="mt-2 max-w-2xl text-slate-500">GAQL çıktısını günlük kampanya trendleri, KPI özeti ve ayrıntılı tablo olarak inceleyin.</p></div><div className="flex gap-2"><Button variant="outline" onClick={clearReport} disabled={!rows.length}><RefreshCw className="mr-2 h-4 w-4"/>Temizle</Button><Button onClick={() => navigator.clipboard?.writeText(QUERY)} className="bg-[#e54725] hover:bg-[#c9381b]"><ClipboardPaste className="mr-2 h-4 w-4"/>GAQL’i kopyala</Button></div></div>
    <Card className="border-orange-100 bg-orange-50/60"><CardContent className="flex gap-3 p-4 text-sm text-orange-950"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-orange-600"/><p>Bu ekran gerçek Google Ads çıktısını gösterir; veri uydurmaz. Ads hesabı bağlanmadığında veya <code className="rounded bg-white px-1">NOT_ADS_USER</code> döndüğünde aşağıdaki içe aktarma alanına bağlayıcının JSON sonucunu yapıştırabilirsiniz.</p></CardContent></Card>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Gösterim", number(totals.impressions), "Toplam erişim"], ["Tıklama", number(totals.clicks), `${totalCtr.toFixed(2)}% CTR`], ["Harcama", money(totals.cost), "Mikro birimden çevrilmiş"], ["Dönüşüm", totals.conversions.toFixed(2), avgCpa ? `${money(avgCpa)} / dönüşüm` : "Henüz veri yok"]].map(([label, value, note]) => <Card key={label} className="border-0 shadow-sm"><CardContent className="p-5"><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></CardContent></Card>)}</div>
    <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
      <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-orange-500"/>Günlük kampanya trendi</CardTitle></CardHeader><CardContent><div className="h-[320px] w-full">{daily.length ? <ResponsiveContainer width="100%" height="100%"><ComposedChart data={daily} margin={{ top: 8, right: 8, left: -18, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/><XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => String(v).slice(5)}/><YAxis yAxisId="left" tick={{ fontSize: 11 }}/><YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v} TL`}/><Tooltip formatter={(value, name) => [name === "cost" ? money(Number(value)) : number(Number(value)), name === "cost" ? "Harcama" : name === "clicks" ? "Tıklama" : "Gösterim"]}/><Legend/><Bar yAxisId="left" dataKey="impressions" name="Gösterim" fill="#f97316" radius={[4,4,0,0]}/><Line yAxisId="left" type="monotone" dataKey="clicks" name="Tıklama" stroke="#0f172a" strokeWidth={3}/><Line yAxisId="right" type="monotone" dataKey="cost" name="Harcama" stroke="#16a34a" strokeWidth={2}/></ComposedChart></ResponsiveContainer> : <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center"><BarChart3 className="h-9 w-9 text-slate-300"/><p className="mt-3 font-bold text-slate-700">Grafik için rapor verisi bekleniyor</p><p className="mt-1 max-w-sm text-sm text-slate-500">GAQL çıktısını aşağıdaki alana eklediğinizde günlük trend burada görünecek.</p></div>}</div></CardContent></Card>
      <Card className="border-0 shadow-sm"><CardHeader><CardTitle>GAQL çıktısı içe aktar</CardTitle></CardHeader><CardContent className="space-y-3"><Textarea className="min-h-44 font-mono text-xs" value={json} onChange={(e) => setJson(e.target.value)} placeholder={'[{"segments":{"date":"2026-08-01"},"campaign":{"name":"..."},"metrics":{"impressions":"..."}}]'} aria-label="GAQL JSON çıktısı"/><div className="flex flex-wrap justify-between gap-2"><p className="text-xs text-slate-500">Alanlar mikro birimden TL’ye dönüştürülür.</p><Button onClick={importReport} disabled={!json.trim()} className="bg-slate-950"><Download className="mr-2 h-4 w-4"/>İçe aktar</Button></div>{message && <p className="text-sm font-semibold text-orange-700">{message}</p>}</CardContent></Card>
    </div>
    <Card className="border-0 shadow-sm"><CardHeader><CardTitle>Kampanya / gün ayrıntıları</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead><tr className="border-b text-xs uppercase tracking-wide text-slate-400"><th className="px-3 py-3">Tarih</th><th className="px-3 py-3">Kampanya</th><th className="px-3 py-3">Gösterim</th><th className="px-3 py-3">Tıklama</th><th className="px-3 py-3">CTR</th><th className="px-3 py-3">Harcama</th><th className="px-3 py-3">Dönüşüm</th></tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={`${row.date}-${row.campaignId}-${index}`} className="border-b last:border-0"><td className="px-3 py-3 font-medium">{row.date}</td><td className="px-3 py-3"><p className="font-bold text-slate-800">{row.campaignName}</p><p className="text-xs text-slate-400">{row.status}</p></td><td className="px-3 py-3">{number(row.impressions)}</td><td className="px-3 py-3">{number(row.clicks)}</td><td className="px-3 py-3">{row.ctr.toFixed(2)}%</td><td className="px-3 py-3 font-semibold">{money(row.cost)}</td><td className="px-3 py-3">{row.conversions.toFixed(2)}</td></tr>) : <tr><td colSpan={7} className="px-3 py-12 text-center text-slate-500">Henüz rapor satırı yok. Google Ads hesabı bağlandığında GAQL sonucunu içe aktarın.</td></tr>}</tbody></table></div></CardContent></Card>
  </div></DashboardLayout>;
}

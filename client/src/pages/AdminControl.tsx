import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  adminMembersToCsv,
  filterAndSortAdminMembers,
  type AdminMemberRoleFilter,
  type AdminMemberSortOption,
} from "@shared/membership";
import {
  Activity,
  CalendarClock,
  Download,
  Eye,
  MapPinned,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";

const featureLabels = {
  ordersEnabled: [
    "Yeni siparişler",
    "Müşterilerin yeni sipariş oluşturmasına izin ver",
  ],
  courierPortalEnabled: [
    "Kurye üyeliği",
    "Yeni kurye hesabı seçimini etkinleştir",
  ],
  storePortalEnabled: [
    "Mağaza üyeliği",
    "Yeni mağaza hesabı seçimini etkinleştir",
  ],
  liveTrackingEnabled: [
    "Canlı takip",
    "Teslimatların anlık konum takibini etkinleştir",
  ],
} as const;

const roleLabels = {
  all: "Tüm roller",
  user: "Müşteri",
  courier: "Kurye",
  store: "Mağaza",
  accountant: "Muhasebe",
  admin: "Yönetici",
} as const;
const sortLabels = {
  recently_active: "Son girişe göre",
  newest: "Üyelik tarihine göre",
  name_asc: "İsim A–Z",
  name_desc: "İsim Z–A",
} as const;

function formatDate(date: Date | null | undefined) {
  return date
    ? new Intl.DateTimeFormat("tr-TR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date)
    : "—";
}

export default function AdminControl() {
  const { user, isAuthenticated } = useAuth();
  const [memberQuery, setMemberQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<AdminMemberRoleFilter>("all");
  const [sortOption, setSortOption] =
    useState<AdminMemberSortOption>("recently_active");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [newProvinceName, setNewProvinceName] = useState("");
  const [coverageDrafts, setCoverageDrafts] = useState<Record<number, { isEnabled: boolean; operatingStart: string; operatingEnd: string; etaBufferMinutes: number }>>({});
  const overview = trpc.admin.overview.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });
  const provinceCoverage = trpc.admin.provinceCoverage.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });
  const addressSourceHealth = trpc.admin.addressSourceHealth.useQuery(
    undefined,
    {
      enabled: isAuthenticated && user?.role === "admin",
      refetchInterval: 60000,
    }
  );
  const utils = trpc.useUtils();
  const setFeature = trpc.admin.setFeature.useMutation({
    onSuccess: () => utils.admin.overview.invalidate(),
  });
  const setMemberRole = trpc.admin.setMemberRole.useMutation({
    onSuccess: () => utils.admin.overview.invalidate(),
  });
  const setProvinceCoverage = trpc.admin.setProvinceCoverage.useMutation({
    onSuccess: () => utils.admin.provinceCoverage.invalidate(),
    onError: error => toast.error(error.message),
  });
  const refreshAddressSource = trpc.admin.refreshAddressSource.useMutation({
    onSuccess: result => {
      toast.success(result.message);
      utils.admin.addressSourceHealth.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const updateCoverageDraft = (id: number, patch: Partial<{ isEnabled: boolean; operatingStart: string; operatingEnd: string; etaBufferMinutes: number }>, current: { isEnabled: number; operatingStart: string; operatingEnd: string; etaBufferMinutes: number }) => {
    setCoverageDrafts(previous => ({ ...previous, [id]: { isEnabled: previous[id]?.isEnabled ?? Boolean(current.isEnabled), operatingStart: previous[id]?.operatingStart ?? current.operatingStart, operatingEnd: previous[id]?.operatingEnd ?? current.operatingEnd, etaBufferMinutes: previous[id]?.etaBufferMinutes ?? current.etaBufferMinutes, ...patch } }));
  };
  const members = useMemo(
    () =>
      filterAndSortAdminMembers(overview.data?.members ?? [], {
        query: memberQuery,
        role: roleFilter,
        sort: sortOption,
        createdFrom,
        createdTo,
      }),
    [
      createdFrom,
      createdTo,
      memberQuery,
      overview.data?.members,
      roleFilter,
      sortOption,
    ]
  );
  const hasMemberFilters = Boolean(
    memberQuery ||
      createdFrom ||
      createdTo ||
      roleFilter !== "all" ||
      sortOption !== "recently_active"
  );
  const clearMemberFilters = () => {
    setMemberQuery("");
    setRoleFilter("all");
    setSortOption("recently_active");
    setCreatedFrom("");
    setCreatedTo("");
  };
  const exportMembersCsv = () => {
    const blob = new Blob([adminMembersToCsv(members)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `run-courier-uyelikler-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <DashboardLayout>
        <main className="mx-auto max-w-3xl px-4 py-12">
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardContent className="py-10 text-center">
              <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-slate-400" />
              <h1 className="text-xl font-black">Yönetici erişimi gerekli</h1>
              <p className="mt-2 text-sm text-slate-600">
                Bu panel yalnızca Run Courier yöneticileri için kullanılabilir.
              </p>
            </CardContent>
          </Card>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-7">
          <Badge className="mb-3 bg-orange-100 text-orange-800 hover:bg-orange-100">
            Yönetici merkezi
          </Badge>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">
            Kolay yönetim paneli
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Hizmet modüllerini tek tıkla yönetin; müşteri, kurye ve mağaza
            üyeliklerini filtreleyip sıralayın.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-[.85fr_1.4fr]">
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-[#e54725]" />
                Tek tıkla modül yönetimi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview.data ? (
                Object.entries(featureLabels).map(
                  ([key, [title, description]]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {description}
                        </p>
                      </div>
                      <Switch
                        checked={
                          overview.data.featureSettings[
                            key as keyof typeof overview.data.featureSettings
                          ]
                        }
                        disabled={setFeature.isPending}
                        onCheckedChange={enabled =>
                          setFeature.mutate({
                            key: key as keyof typeof featureLabels,
                            enabled,
                          })
                        }
                        aria-label={`${title} aç/kapat`}
                      />
                    </div>
                  )
                )
              ) : (
                <p className="text-sm text-slate-500">Ayarlar yükleniyor…</p>
              )}
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersRound className="h-5 w-5 text-[#e54725]" />
                Üyelikler ve roller
              </CardTitle>
              <p className="text-sm font-normal text-slate-500">
                Filtreler yalnızca bu yönetim oturumundaki görünümü değiştirir;
                CSV yalnızca şu anki filtrelenmiş sonucu içerir.
              </p>
            </CardHeader>
            <CardContent>
              {overview.data ? (
                <>
                  <div className="grid gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_145px_145px_150px_165px]">
                    <div className="relative sm:col-span-2 xl:col-span-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={memberQuery}
                        onChange={event => setMemberQuery(event.target.value)}
                        placeholder="Ad, e-posta veya telefon ara"
                        className="h-10 bg-white pl-9"
                        aria-label="Üyeliklerde ara"
                      />
                    </div>
                    <label className="min-w-0">
                      <span className="sr-only">Üyelik başlangıç tarihi</span>
                      <Input
                        type="date"
                        value={createdFrom}
                        max={createdTo || undefined}
                        onChange={event => setCreatedFrom(event.target.value)}
                        className="h-10 bg-white"
                        aria-label="Üyelik başlangıç tarihi"
                      />
                    </label>
                    <label className="min-w-0">
                      <span className="sr-only">Üyelik bitiş tarihi</span>
                      <Input
                        type="date"
                        value={createdTo}
                        min={createdFrom || undefined}
                        onChange={event => setCreatedTo(event.target.value)}
                        className="h-10 bg-white"
                        aria-label="Üyelik bitiş tarihi"
                      />
                    </label>
                    <select
                      value={roleFilter}
                      onChange={event =>
                        setRoleFilter(
                          event.target.value as AdminMemberRoleFilter
                        )
                      }
                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                      aria-label="Üyelik rolüne göre filtrele"
                    >
                      {Object.entries(roleLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={sortOption}
                      onChange={event =>
                        setSortOption(
                          event.target.value as AdminMemberSortOption
                        )
                      }
                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                      aria-label="Üyelikleri sırala"
                    >
                      {Object.entries(sortLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-slate-500">
                      <span className="text-slate-900">{members.length}</span> /{" "}
                      {overview.data.members.length} üye gösteriliyor
                      {(createdFrom || createdTo) && (
                        <span>
                          {" "}
                          · Üyelik tarihi: {createdFrom || "başlangıç"} —{" "}
                          {createdTo || "bugün"}
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearMemberFilters}
                        disabled={!hasMemberFilters}
                        className="text-xs text-[#c9381b]"
                      >
                        Filtreleri temizle
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={exportMembersCsv}
                        disabled={members.length === 0}
                        className="border-orange-200 bg-white text-xs text-[#c9381b]"
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        CSV indir
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 max-h-[540px] overflow-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="sticky top-0 bg-white text-xs text-slate-500">
                        <tr>
                          <th className="pb-3">Kullanıcı</th>
                          <th className="pb-3">İletişim</th>
                          <th className="pb-3">
                            <span className="inline-flex items-center gap-1">
                              <CalendarClock className="h-3.5 w-3.5" />
                              Son giriş
                            </span>
                          </th>
                          <th className="pb-3">Rol</th>
                          <th className="pb-3">İşlem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map(member => (
                          <tr
                            key={member.id}
                            className="border-t border-slate-100"
                          >
                            <td className="py-3">
                              <p className="font-semibold text-slate-900">
                                {member.name || "İsimsiz"}
                              </p>
                              <p className="mt-0.5 text-[11px] text-slate-400">
                                Üyelik: {formatDate(member.createdAt)}
                              </p>
                            </td>
                            <td className="py-3 text-slate-500">
                              {member.email || member.phone || "-"}
                            </td>
                            <td className="py-3 text-xs text-slate-500">
                              {formatDate(member.lastSignedIn)}
                            </td>
                            <td className="py-3">
                              <Badge variant="outline">
                                {roleLabels[member.role]}
                              </Badge>
                            </td>
                            <td className="py-3">
                              <select
                                className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs"
                                value={member.role}
                                disabled={
                                  member.role === "admin" ||
                                  setMemberRole.isPending
                                }
                                onChange={event =>
                                  setMemberRole.mutate({
                                    userId: member.id,
                                    role: event.target.value as
                                      | "user"
                                      | "courier"
                                      | "store"
                                      | "accountant",
                                  })
                                }
                                aria-label={`${member.name || "Kullanıcı"} rolünü güncelle`}
                              >
                                <option value="user">Müşteri</option>
                                <option value="courier">Kurye</option>
                                <option value="store">Mağaza</option>
                                <option value="accountant">Muhasebe</option>
                                {member.role === "admin" && (
                                  <option value="admin">Yönetici</option>
                                )}
                              </select>
                            </td>
                          </tr>
                        ))}
                        {members.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-10 text-center">
                              <Search className="mx-auto mb-2 h-5 w-5 text-slate-300" />
                              <p className="font-semibold text-slate-700">
                                Eşleşen üyelik bulunamadı.
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Arama metnini, tarih aralığını veya rol
                                filtresini değiştirin.
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">Üyelikler yükleniyor…</p>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-[#e54725]" />Adres kaynağı sağlık durumu</CardTitle>
              <p className="text-sm font-normal text-slate-500">Kaynağın erişimini, önbelleği ve il sayısını kontrol edin. Yenileme, yalnızca geçici önbelleği temizleyip kaynağı tekrar doğrular.</p>
            </CardHeader>
            <CardContent>
              {addressSourceHealth.data ? <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><Badge className={addressSourceHealth.data.status === "healthy" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-red-100 text-red-800 hover:bg-red-100"}>{addressSourceHealth.data.status === "healthy" ? "Sağlıklı" : "Erişilemiyor"}</Badge><Button type="button" size="sm" variant="outline" disabled={refreshAddressSource.isPending} onClick={() => refreshAddressSource.mutate()}><RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshAddressSource.isPending ? "animate-spin" : ""}`} />{refreshAddressSource.isPending ? "Yenileniyor…" : "Şimdi yenile"}</Button></div>
                <p className="text-sm font-semibold text-slate-900">{addressSourceHealth.data.message}</p>
                <dl className="grid grid-cols-2 gap-3 text-xs"><div><dt className="text-slate-500">İl kaydı</dt><dd className="mt-1 font-black text-slate-900">{addressSourceHealth.data.provinceCount ?? "—"}</dd></div><div><dt className="text-slate-500">Son başarılı kontrol</dt><dd className="mt-1 font-semibold text-slate-900">{formatDate(addressSourceHealth.data.lastSuccessAt)}</dd></div><div><dt className="text-slate-500">Dizin önbelleği</dt><dd className="mt-1 font-semibold text-slate-900">{addressSourceHealth.data.directoryCacheEntries}</dd></div><div><dt className="text-slate-500">Sokak önbelleği</dt><dd className="mt-1 font-semibold text-slate-900">{addressSourceHealth.data.streetCacheEntries}</dd></div></dl>
                <a href={addressSourceHealth.data.sourceUrl} target="_blank" rel="noreferrer" className="block truncate text-xs font-semibold text-[#c9381b] underline">Kaynak: {addressSourceHealth.data.sourceUrl}</a>
              </div> : <p className="text-sm text-slate-500">Adres kaynağı denetleniyor…</p>}
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MapPinned className="h-5 w-5 text-[#e54725]" />İl bazlı kurye kapsamı</CardTitle>
              <p className="text-sm font-normal text-slate-500">Açık iller sipariş kabul eder. Çalışma saati ve ek süre, sipariş ekranındaki tahmini teslimat süresine uygulanır.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2"><Input value={newProvinceName} onChange={event => setNewProvinceName(event.target.value)} placeholder="Örn. Ankara" aria-label="Yeni kapsam ili" /><Button type="button" disabled={!newProvinceName.trim() || setProvinceCoverage.isPending} onClick={() => { const provinceName = newProvinceName.trim(); setProvinceCoverage.mutate({ provinceName, isEnabled: true, operatingStart: "09:00", operatingEnd: "22:00", etaBufferMinutes: 20 }, { onSuccess: () => { setNewProvinceName(""); toast.success(`${provinceName} kapsam alanına eklendi`); } }); }}>İl ekle</Button></div>
              <div className="max-h-[360px] space-y-2 overflow-auto pr-1">{provinceCoverage.data?.map(coverage => { const draft = coverageDrafts[coverage.id] ?? { isEnabled: Boolean(coverage.isEnabled), operatingStart: coverage.operatingStart, operatingEnd: coverage.operatingEnd, etaBufferMinutes: coverage.etaBufferMinutes }; return <div key={coverage.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-black text-slate-900">{coverage.provinceName}</p><Switch checked={draft.isEnabled} onCheckedChange={isEnabled => updateCoverageDraft(coverage.id, { isEnabled }, coverage)} aria-label={`${coverage.provinceName} kapsamını aç veya kapat`} /></div><div className="mt-3 grid grid-cols-3 gap-2"><label className="text-[11px] font-semibold text-slate-500">Açılış<Input type="time" value={draft.operatingStart} onChange={event => updateCoverageDraft(coverage.id, { operatingStart: event.target.value }, coverage)} className="mt-1 h-9 bg-white text-xs" /></label><label className="text-[11px] font-semibold text-slate-500">Kapanış<Input type="time" value={draft.operatingEnd} onChange={event => updateCoverageDraft(coverage.id, { operatingEnd: event.target.value }, coverage)} className="mt-1 h-9 bg-white text-xs" /></label><label className="text-[11px] font-semibold text-slate-500">Ek süre (dk)<Input type="number" min="0" max="180" value={draft.etaBufferMinutes} onChange={event => updateCoverageDraft(coverage.id, { etaBufferMinutes: Math.max(0, Math.min(180, Number(event.target.value) || 0)) }, coverage)} className="mt-1 h-9 bg-white text-xs" /></label></div><Button type="button" size="sm" className="mt-3 w-full" disabled={setProvinceCoverage.isPending} onClick={() => setProvinceCoverage.mutate({ provinceName: coverage.provinceName, ...draft }, { onSuccess: () => toast.success(`${coverage.provinceName} kapsam ayarları kaydedildi`) })}>Kapsam ayarlarını kaydet</Button></div>; })}{provinceCoverage.data?.length === 0 && <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Henüz tanımlı bir il kapsamı yok.</p>}</div>
            </CardContent>
          </Card>
        </div>
        <Card className="mt-5 rounded-3xl border-0 bg-slate-950 text-white shadow-sm">
          <CardContent className="flex items-start gap-3 py-5">
            <Eye className="mt-0.5 h-5 w-5 text-orange-300" />
            <p className="text-sm leading-6 text-slate-300">
              Arama, rol, tarih aralığı ve sıralama yalnızca yöneticinin
              ekranındaki üyelik görünümünü düzenler. CSV dosyası, seçili filtre
              sonucunu Türkçe karakter uyumlu olarak indirir. Rol değişiklikleri
              ise yetkili sunucu prosedürü üzerinden kalıcı olarak uygulanır;
              yönetici rolü bu ekrandan değiştirilemez.
            </p>
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  );
}

import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { isMembershipRoleSelectable, type PlatformFeatureSnapshot } from "@shared/membership";
import { Bike, CheckCircle2, Loader2, Store, UserRound } from "lucide-react";
import { useLocation } from "wouter";

const membershipOptions = [
  { role: "user" as const, title: "Müşteri hesabı", description: "Gönderi oluşturun, kayıtlı adresleri kullanın ve siparişinizi anlık takip edin.", icon: UserRound, enabledKey: null },
  { role: "courier" as const, title: "Kurye hesabı", description: "Teslimatları yönetin, kazanç ve performansınızı profilinizden takip edin.", icon: Bike },
  { role: "store" as const, title: "Mağaza hesabı", description: "İşletme gönderilerinizi merkezi sipariş akışından yönetin.", icon: Store },
];

export default function Membership() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const features = trpc.platform.features.useQuery();
  const setMembershipRole = trpc.profile.setMembershipRole.useMutation({
    onSuccess: () => window.location.assign("/account"),
  });

  if (!isAuthenticated) return <main className="min-h-screen bg-slate-50 px-4 py-16"><div className="mx-auto max-w-md"><Card className="rounded-3xl border-0 shadow-sm"><CardHeader><Badge className="w-fit bg-orange-100 text-orange-800 hover:bg-orange-100">Run Courier üyelik</Badge><CardTitle className="text-2xl">Hesap türünüzü seçin</CardTitle></CardHeader><CardContent><p className="mb-6 text-sm leading-6 text-slate-600">Kurye, müşteri veya mağaza hesabı oluşturmak için güvenli giriş yapın. Hesap türünüzü girişten sonra değiştirebilirsiniz.</p><Button className="w-full bg-[#e54725]" onClick={() => startLogin()}>Giriş yap ve devam et</Button></CardContent></Card></div></main>;

  return <main className="min-h-screen bg-slate-50 px-4 py-10"><div className="mx-auto max-w-5xl"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Badge className="mb-3 bg-orange-100 text-orange-800 hover:bg-orange-100">Aktif hesap: {user?.role === "store" ? "Mağaza" : user?.role === "courier" ? "Kurye" : "Müşteri"}</Badge><h1 className="text-3xl font-black tracking-tight text-slate-950">Size uygun hesabı seçin</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Tüm hesaplar Türkiye geneli adres dizinini kullanır. Yönetici, hizmet erişimini güvenlik ve operasyon gereksinimlerine göre geçici olarak kapatabilir.</p></div><Button variant="outline" onClick={() => setLocation("/")}>Ana sayfaya dön</Button></div><div className="grid gap-4 md:grid-cols-3">{membershipOptions.map(option => { const Icon = option.icon; const enabled = !features.data || isMembershipRoleSelectable(option.role, features.data as PlatformFeatureSnapshot); const isCurrent = user?.role === option.role; return <Card key={option.role} className={`rounded-3xl border-0 shadow-sm ${isCurrent ? "ring-2 ring-orange-400" : ""}`}><CardHeader><Icon className="h-7 w-7 text-[#e54725]"/><CardTitle className="mt-3 text-xl">{option.title}</CardTitle></CardHeader><CardContent><p className="min-h-20 text-sm leading-6 text-slate-600">{option.description}</p>{isCurrent ? <Badge className="mt-5 bg-emerald-100 text-emerald-800 hover:bg-emerald-100"><CheckCircle2 className="mr-1 h-3.5 w-3.5"/>Seçili</Badge> : <Button className="mt-5 w-full" disabled={!enabled || setMembershipRole.isPending} onClick={() => setMembershipRole.mutate({ role: option.role })}>{setMembershipRole.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : !enabled ? "Geçici olarak kapalı" : "Bu hesabı seç"}</Button>}</CardContent></Card>})}</div></div></main>;
}

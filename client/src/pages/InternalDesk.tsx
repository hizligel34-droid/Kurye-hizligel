import { trpc } from "@/lib/trpc";
import { ROLE_NOTES, STATUS_LABELS, TARIFF_FIELDS, type Tariff } from "@shared/internalDesk";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bike, Building2, LockKeyhole, MessageSquare, WalletCards } from "lucide-react";

const SESSION_KEY = "internal-desk-session";

type TabId = "ozet" | "isler" | "yeni" | "sohbet" | "muhasebe" | "tarife" | "personel";
type HomeData = inferRouterOutputs<AppRouter>["internalDesk"]["home"];
type JobView = HomeData["jobs"][number];

function money(value: number | null | undefined) {
  if (value == null) return null;
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(value);
}

function when(iso: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function saveSession(token: string | null) {
  if (token) sessionStorage.setItem(SESSION_KEY, token);
  else sessionStorage.removeItem(SESSION_KEY);
}

function fieldClass() {
  return "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-orange-300";
}

export default function InternalDesk() {
  const [hasSession, setHasSession] = useState(() => sessionStorage.getItem(SESSION_KEY) != null);
  const home = trpc.internalDesk.home.useQuery(undefined, { enabled: hasSession, refetchInterval: 8000 });

  useEffect(() => {
    if (home.error?.message === "İç operasyon oturumu gerekli") {
      saveSession(null);
      setHasSession(false);
    }
  }, [home.error]);

  if (!hasSession) return <Login onSuccess={token => { saveSession(token); setHasSession(true); }} />;
  if (home.isLoading || !home.data) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 px-4 text-sm font-semibold text-slate-500">İç masa açılıyor</main>;
  }
  return <Desk home={home.data} onLeave={() => { saveSession(null); setHasSession(false); }} />;
}

function Login({ onSuccess }: { onSuccess: (token: string) => void }) {
  const directory = trpc.internalDesk.directory.useQuery();
  const me = trpc.auth.me.useQuery();
  const login = trpc.internalDesk.login.useMutation();
  const enterAdmin = trpc.internalDesk.enterAsAdmin.useMutation();
  const [group, setGroup] = useState("merkez");
  const [staffId, setStaffId] = useState("merkez-mudur");
  const [pin, setPin] = useState("");

  const staff = directory.data?.staff ?? [];
  const people = staff.filter(person => {
    if (group === "merkez") return person.role === "central_manager" || person.role === "admin" || person.role === "accountant";
    if (group === "kurye") return person.role === "courier_lead" || person.role === "courier";
    return person.branchId === group;
  });
  const selected = people.find(person => person.id === staffId) ?? people[0];

  useEffect(() => {
    if (selected && selected.id !== staffId) setStaffId(selected.id);
  }, [selected, staffId]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    login.mutate(
      { staffId: selected.id, pin },
      {
        onSuccess: result => onSuccess(result.token),
        onError: error => toast.error(error.message),
      },
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <section>
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">10 şubeli mağaza</Badge>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">İç operasyon masası</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Kurye, on mağaza şubesi ile merkez şube arasında ürün taşır. Fiyat listesini yalnız merkez müdür ve admin görür ve düzenler. Muhasebe her role açık değildir.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {(directory.data?.branches ?? []).map(branch => (
              <div key={branch.id} className="rounded-2xl bg-white p-3 shadow-sm">
                <Building2 className="h-4 w-4 text-orange-600" aria-hidden="true" />
                <p className="mt-2 text-sm font-bold text-slate-900">{branch.name}</p>
                <p className="text-xs leading-5 text-slate-500">{branch.address}</p>
              </div>
            ))}
          </div>
        </section>
        <Card className="h-fit rounded-3xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Personel girişi</CardTitle>
            <p className="text-sm leading-6 text-slate-500">{directory.data?.managerHint}</p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              <label className="block text-sm font-semibold text-slate-700" htmlFor="desk-group">Birim</label>
              <select id="desk-group" className={fieldClass()} value={group} onChange={event => setGroup(event.target.value)}>
                <option value="merkez">Merkez</option>
                <option value="kurye">Kurye ekibi</option>
                {(directory.data?.branches ?? []).map(branch => <option key={branch.id} value={branch.id}>{branch.name} şubesi</option>)}
              </select>
              <label className="block text-sm font-semibold text-slate-700" htmlFor="desk-person">Görev</label>
              <select id="desk-person" className={fieldClass()} value={selected?.id ?? ""} onChange={event => setStaffId(event.target.value)}>
                {people.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}
              </select>
              {selected && <p className="rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">{ROLE_NOTES[selected.role]}</p>}
              <label className="block text-sm font-semibold text-slate-700" htmlFor="desk-pin">Giriş kodu</label>
              <input id="desk-pin" className={fieldClass()} inputMode="numeric" autoComplete="off" value={pin} onChange={event => setPin(event.target.value)} aria-describedby="desk-pin-help" />
              <p id="desk-pin-help" className="text-xs leading-5 text-slate-500">Kod sunucuda kontrol edilir. Yanlış role ait kod muhasebeyi açmaz.</p>
              {me.data?.role === "admin" && <Button type="button" variant="outline" className="h-11 w-full rounded-xl" disabled={enterAdmin.isPending} onClick={() => enterAdmin.mutate(undefined, { onSuccess: result => onSuccess(result.token), onError: error => toast.error(error.message) })}>Yönetici hesabıyla fiyat listesine gir</Button>}
              <Button type="submit" className="h-11 w-full rounded-xl bg-[#e54725] hover:bg-[#cf3d1e]" disabled={login.isPending || !selected}>
                {login.isPending ? "Kontrol ediliyor" : "Masaya gir"}
              </Button>
              <Button type="button" variant="outline" className="w-full rounded-xl" onClick={() => window.location.assign("/")}>Müşteri uygulamasına dön</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Desk({ home, onLeave }: { home: HomeData; onLeave: () => void }) {
  const utils = trpc.useUtils();
  const logout = trpc.internalDesk.logout.useMutation();
  const tabs = useMemo(() => {
    const items: { id: TabId; label: string }[] = [
      { id: "ozet", label: "Özet" },
      { id: "isler", label: "İşler" },
    ];
    if (home.capabilities.canCreate) items.push({ id: "yeni", label: "Yeni iş" });
    items.push({ id: "sohbet", label: "Şube sohbeti" });
    if (home.capabilities.canViewLedger && home.capabilities.ledgerTitle) items.push({ id: "muhasebe", label: home.capabilities.ledgerTitle });
    if (home.capabilities.canViewTariff) items.push({ id: "tarife", label: "Fiyat listesi" });
    if (home.capabilities.canManagePins) items.push({ id: "personel", label: "Personel kodları" });
    return items;
  }, [home.capabilities]);
  const [tab, setTab] = useState<TabId>("ozet");
  const active = tabs.some(item => item.id === tab) ? tab : "ozet";

  function refresh() {
    return utils.internalDesk.invalidate();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-700">İç operasyon · 10 şube</p>
            <h1 className="text-2xl font-black text-slate-950">{home.actor.name}</h1>
            <p className="text-sm text-slate-500">{home.actor.roleLabel}{home.actor.branchId ? ` · ${home.branches.find(branch => branch.id === home.actor.branchId)?.name}` : ""}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => window.location.assign("/")}>Müşteri uygulaması</Button>
            <Button variant="ghost" className="rounded-xl" onClick={() => logout.mutate(undefined, { onSettled: () => { onLeave(); utils.internalDesk.home.reset(); } })}>Çıkış</Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-5">
        <div className="flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="İç masa bölümleri">
          {tabs.map(item => (
            <button key={item.id} role="tab" aria-selected={active === item.id} className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold ${active === item.id ? "bg-slate-950 text-white" : "bg-white text-slate-600"}`} onClick={() => setTab(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-500">{ROLE_NOTES[home.actor.role]}</p>
        <div className="mt-5">
          {active === "ozet" && <Overview home={home} />}
          {active === "isler" && <Jobs home={home} onChanged={refresh} />}
          {active === "yeni" && <NewJob home={home} onCreated={async () => { await refresh(); setTab("isler"); }} />}
          {active === "sohbet" && <Chat home={home} />}
          {active === "muhasebe" && home.ledger && <Ledger ledger={home.ledger} onChanged={refresh} />}
          {active === "tarife" && home.priceList && <TariffPanel list={home.priceList} canEdit={home.capabilities.canEditTariff} onChanged={refresh} />}
          {active === "personel" && <Pins onChanged={refresh} />}
        </div>
      </div>
    </main>
  );
}

function Overview({ home }: { home: HomeData }) {
  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="rounded-3xl border-0 shadow-sm"><CardContent className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Açık iş</p><p className="mt-2 text-3xl font-black">{home.openJobCount}</p></CardContent></Card>
        <Card className="rounded-3xl border-0 shadow-sm"><CardContent className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Şube</p><p className="mt-2 text-3xl font-black">{home.branches.length}</p></CardContent></Card>
        <Card className="rounded-3xl border-0 shadow-sm"><CardContent className="p-5"><WalletCards className="h-5 w-5 text-orange-600" aria-hidden="true" /><p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{home.capabilities.canViewLedger ? home.capabilities.ledgerTitle : "Muhasebe bu rolde kapalı"}</p></CardContent></Card>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {home.branches.map(branch => (
          <article key={branch.id} className="rounded-3xl bg-white p-4 shadow-sm">
            <h2 className="font-bold text-slate-950">{branch.name}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">{branch.address}</p>
            <p className="mt-3 text-sm font-semibold text-slate-700">{branch.openJobs} açık çıkış</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Jobs({ home, onChanged }: { home: HomeData; onChanged: () => Promise<void> }) {
  const approve = trpc.internalDesk.approve.useMutation();
  const assign = trpc.internalDesk.assign.useMutation();
  const advance = trpc.internalDesk.advance.useMutation();
  const cancel = trpc.internalDesk.cancel.useMutation();
  const [filter, setFilter] = useState("acik");
  const [courierByJob, setCourierByJob] = useState<Record<string, string>>({});
  const jobs = home.jobs.filter(job => {
    if (filter === "to_central" || filter === "from_central") return job.direction === filter;
    if (filter === "acik") return job.status !== "delivered" && job.status !== "cancelled";
    return true;
  });

  function run(action: Promise<unknown>) {
    action.then(onChanged).catch((error: Error) => toast.error(error.message));
  }

  return (
    <section className="space-y-3">
      <div className="flex gap-2 overflow-x-auto">
        {[["acik", "Açık"], ["to_central", "Merkeze giden"], ["from_central", "Şubeye gelen"], ["hepsi", "Tümü"]].map(([id, label]) => (
          <button key={id} className={`min-h-10 rounded-full px-3 text-sm font-bold ${filter === id ? "bg-orange-600 text-white" : "bg-white text-slate-600"}`} onClick={() => setFilter(id)}>{label}</button>
        ))}
      </div>
      {jobs.length === 0 && <p className="rounded-3xl bg-white p-6 text-sm text-slate-500">Bu filtrede gördüğünüz iş yok.</p>}
      {jobs.map(job => <JobCard key={job.id} job={job} couriers={home.couriers} courierId={courierByJob[job.id] ?? home.couriers[0]?.id ?? ""} onCourier={value => setCourierByJob(current => ({ ...current, [job.id]: value }))} busy={approve.isPending || assign.isPending || advance.isPending || cancel.isPending} onApprove={() => run(approve.mutateAsync({ jobId: job.id }))} onAssign={() => run(assign.mutateAsync({ jobId: job.id, courierId: courierByJob[job.id] ?? home.couriers[0]?.id ?? "" }))} onPickup={() => run(advance.mutateAsync({ jobId: job.id, next: "picked_up" }))} onDeliver={() => run(advance.mutateAsync({ jobId: job.id, next: "delivered" }))} onCancel={() => run(cancel.mutateAsync({ jobId: job.id }))} />)}
    </section>
  );
}

function JobCard({ job, couriers, courierId, onCourier, busy, onApprove, onAssign, onPickup, onDeliver, onCancel }: {
  job: JobView;
  couriers: HomeData["couriers"];
  courierId: string;
  onCourier: (value: string) => void;
  busy: boolean;
  onApprove: () => void;
  onAssign: () => void;
  onPickup: () => void;
  onDeliver: () => void;
  onCancel: () => void;
}) {
  const charge = money(job.branchChargeTl);
  const payout = money(job.courierPayoutTl);
  return (
    <article className="rounded-3xl bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{job.code} · {job.typeLabel}</p>
          <h2 className="mt-1 text-lg font-black text-slate-950">{job.product}</h2>
          <p className="mt-1 text-sm text-slate-600">{job.fromBranchName} → {job.toBranchName ?? job.destinationLabel}</p>
        </div>
        <Badge variant="secondary">{STATUS_LABELS[job.status]}</Badge>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
        <div><dt className="text-slate-400">Adet / kg</dt><dd className="font-semibold">{job.quantity} adet · {job.weightKg} kg</dd></div>
        <div><dt className="text-slate-400">Mesafe</dt><dd className="font-semibold">{job.distanceKm} km</dd></div>
        {charge && <div><dt className="text-slate-400">Şube bedeli ({job.feeLabel})</dt><dd className="font-semibold">{charge}</dd></div>}
        {payout && <div><dt className="text-slate-400">Kurye ödemesi ({job.feeLabel})</dt><dd className="font-semibold">{payout}</dd></div>}
        {job.courierName && <div><dt className="text-slate-400">Kurye</dt><dd className="font-semibold">{job.courierName}</dd></div>}
      </dl>
      {job.note && <p className="mt-3 text-sm text-slate-500">{job.note}</p>}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {job.actions.approve && <Button className="rounded-xl bg-[#e54725] hover:bg-[#cf3d1e]" disabled={busy} onClick={onApprove}>Onayla ve ücreti kilitle</Button>}
        {job.actions.assign && couriers.length > 0 && (
          <div className="flex min-w-0 flex-1 gap-2">
            <label className="sr-only" htmlFor={`courier-${job.id}`}>Kurye çalışanı</label>
            <select id={`courier-${job.id}`} className={fieldClass()} value={courierId} onChange={event => onCourier(event.target.value)}>
              {couriers.map(courier => <option key={courier.id} value={courier.id}>{courier.name}</option>)}
            </select>
            <Button variant="outline" className="rounded-xl" disabled={busy || !courierId} onClick={onAssign}>Ata</Button>
          </div>
        )}
        {job.actions.pickup && <Button variant="outline" className="rounded-xl" disabled={busy} onClick={onPickup}>Teslim aldım</Button>}
        {job.actions.deliver && <Button className="rounded-xl bg-slate-950 hover:bg-slate-800" disabled={busy} onClick={onDeliver}>Teslim et ve muhasebeleştir</Button>}
        {job.actions.cancel && <Button variant="ghost" className="rounded-xl text-red-700" disabled={busy} onClick={onCancel}>İptal</Button>}
      </div>
    </article>
  );
}

function NewJob({ home, onCreated }: { home: HomeData; onCreated: () => Promise<void> }) {
  const [direction, setDirection] = useState<"to_central" | "from_central">("to_central");
  const [source, setSource] = useState(home.actor.branchId ?? home.branches[0]?.id ?? "");
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [weightKg, setWeightKg] = useState("1");
  const [note, setNote] = useState("");
  const branchId = home.actor.branchId ?? source;
  const quote = trpc.internalDesk.quote.useQuery(
    { branchId: home.actor.branchId ? undefined : branchId, direction },
    { enabled: Boolean(branchId) },
  );
  const createJob = trpc.internalDesk.createHubJob.useMutation();

  function submit(event: FormEvent) {
    event.preventDefault();
    createJob.mutateAsync({
      branchId: home.actor.branchId ? undefined : branchId,
      direction,
      product,
      quantity: Number(quantity),
      weightKg: Number(weightKg),
      note,
    }).then(onCreated).catch((error: Error) => toast.error(error.message));
  }

  return (
    <form className="grid gap-4 rounded-3xl bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-[1.2fr_.8fr]" onSubmit={submit}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`min-h-11 rounded-full px-4 text-sm font-bold ${direction === "to_central" ? "bg-slate-950 text-white" : "bg-slate-100"}`} onClick={() => setDirection("to_central")}>Şubeden merkeze</button>
          <button type="button" className={`min-h-11 rounded-full px-4 text-sm font-bold ${direction === "from_central" ? "bg-slate-950 text-white" : "bg-slate-100"}`} onClick={() => setDirection("from_central")}>Merkezden şubeye</button>
        </div>
        {!home.actor.branchId && (
          <label className="block text-sm font-semibold">Mağaza şubesi
            <select className={`${fieldClass()} mt-1`} value={source} onChange={event => setSource(event.target.value)}>{home.branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select>
          </label>
        )}
        <label className="block text-sm font-semibold">Ürün
          <input className={`${fieldClass()} mt-1`} value={product} onChange={event => setProduct(event.target.value)} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">Adet
            <input className={`${fieldClass()} mt-1`} inputMode="numeric" value={quantity} onChange={event => setQuantity(event.target.value)} />
          </label>
          <label className="block text-sm font-semibold">Kg
            <input className={`${fieldClass()} mt-1`} inputMode="decimal" value={weightKg} onChange={event => setWeightKg(event.target.value)} />
          </label>
        </div>
        <label className="block text-sm font-semibold">Not
          <textarea className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-orange-300" value={note} onChange={event => setNote(event.target.value)} />
        </label>
        <Button type="submit" className="h-11 rounded-xl bg-[#e54725] hover:bg-[#cf3d1e]" disabled={createJob.isPending}>Kurye talebi gönder</Button>
      </div>
      <aside className="rounded-3xl bg-slate-950 p-5 text-white">
        <Bike className="h-5 w-5 text-orange-300" aria-hidden="true" />
        <h2 className="mt-3 text-lg font-black">Bedel fiyat listesinden gelir</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">Tutar elle yazılmaz. Listeyi yalnız merkez müdür ve admin değiştirir. Onay, o andaki liste fiyatını kilitler.</p>
        {quote.data && (
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-3"><dt>Hat</dt><dd className="font-bold">{quote.data.branchName} ↔ {quote.data.centralBranchName}</dd></div>
            <div className="flex justify-between gap-3"><dt>Mesafe</dt><dd className="font-bold">{quote.data.distanceKm} km</dd></div>
            <div className="flex justify-between gap-3"><dt>Şube bedeli</dt><dd className="font-bold">{money(quote.data.branchChargeTl)}</dd></div>
            {quote.data.courierPayoutTl != null && <div className="flex justify-between gap-3"><dt>Kurye ödemesi</dt><dd className="font-bold">{money(quote.data.courierPayoutTl)}</dd></div>}
          </dl>
        )}
        {quote.error && <p className="mt-4 text-sm text-orange-200">{quote.error.message}</p>}
      </aside>
    </form>
  );
}

function Chat({ home }: { home: HomeData }) {
  const fixed = home.rooms.filter(room => room.kind === "hq" || room.kind === "dispatch");
  const hubs = home.rooms.filter(room => room.kind === "hub");
  const pairs = home.rooms.filter(room => room.kind === "branch_pair");
  const [roomId, setRoomId] = useState(fixed[0]?.id ?? pairs[0]?.id ?? "");
  const selected = home.rooms.find(room => room.id === roomId) ?? home.rooms[0];
  const messages = trpc.internalDesk.messages.useQuery({ roomId: selected?.id ?? "" }, { enabled: Boolean(selected), refetchInterval: 5000 });
  const post = trpc.internalDesk.postMessage.useMutation();
  const [body, setBody] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    post.mutate({ roomId: selected.id, body }, {
      onSuccess: async () => {
        setBody("");
        await messages.refetch();
      },
      onError: error => toast.error(error.message),
    });
  }

  if (!selected) return <p className="rounded-3xl bg-white p-6 text-sm text-slate-500">Bu rol için açık sohbet yok.</p>;

  return (
    <section className="grid gap-4 lg:grid-cols-[16rem_1fr]">
      <div className="space-y-2">
        {fixed.map(room => (
          <button key={room.id} className={`min-h-11 w-full rounded-2xl px-3 text-left text-sm font-bold ${selected.id === room.id ? "bg-slate-950 text-white" : "bg-white"}`} onClick={() => setRoomId(room.id)}>{room.title}</button>
        ))}
        {hubs.length > 0 && (
          <label className="block text-sm font-semibold text-slate-700">Merkez şube hattı
            <select className={`${fieldClass()} mt-1`} value={hubs.some(room => room.id === selected.id) ? selected.id : ""} onChange={event => setRoomId(event.target.value)}>
              <option value="" disabled>Şube seçin</option>
              {hubs.map(room => <option key={room.id} value={room.id}>{room.title}</option>)}
            </select>
          </label>
        )}
        {pairs.length > 0 && (
          <label className="block text-sm font-semibold text-slate-700">Şubeler arası
            <select className={`${fieldClass()} mt-1`} value={pairs.some(room => room.id === selected.id) ? selected.id : ""} onChange={event => setRoomId(event.target.value)}>
              <option value="" disabled>Şube seçin</option>
              {pairs.map(room => <option key={room.id} value={room.id}>{room.title}</option>)}
            </select>
          </label>
        )}
      </div>
      <Card className="rounded-3xl border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg"><MessageSquare className="h-5 w-5 text-orange-600" aria-hidden="true" />{selected.title}</CardTitle>
          {!selected.canPost && <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500"><LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />Salt okunur</span>}
        </CardHeader>
        <CardContent>
          <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1" aria-live="polite">
            {(messages.data?.messages ?? []).length === 0 && <p className="text-sm text-slate-500">Bu odada henüz mesaj yok.</p>}
            {messages.data?.messages.map(message => (
              <article key={message.id} className={`max-w-[36rem] rounded-2xl p-3 text-sm ${message.mine ? "ml-auto bg-orange-50" : "bg-slate-50"}`}>
                <p className="text-xs font-bold text-slate-500">{message.senderName} · {when(message.createdAt)} İstanbul</p>
                <p className="mt-1 leading-6 text-slate-800">{message.body}</p>
              </article>
            ))}
          </div>
          {selected.canPost && (
            <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={submit}>
              <label className="sr-only" htmlFor="chat-body">Mesaj</label>
              <input id="chat-body" className={fieldClass()} value={body} onChange={event => setBody(event.target.value)} placeholder="Şube veya kurye notu" />
              <Button type="submit" className="h-11 rounded-xl bg-[#e54725] hover:bg-[#cf3d1e]" disabled={post.isPending || body.trim().length === 0}>Gönder</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function Ledger({ ledger, onChanged }: { ledger: NonNullable<HomeData["ledger"]>; onChanged: () => Promise<void> }) {
  const settle = trpc.internalDesk.settle.useMutation();
  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {ledger.showCharges && <Card className="rounded-3xl border-0 shadow-sm"><CardContent className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Şube bedeli</p><p className="mt-2 text-2xl font-black">{money(ledger.chargeTotalTl) ?? "—"}</p></CardContent></Card>}
        {ledger.showPayouts && <Card className="rounded-3xl border-0 shadow-sm"><CardContent className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Kurye ödemesi</p><p className="mt-2 text-2xl font-black">{money(ledger.payoutTotalTl) ?? "—"}</p></CardContent></Card>}
        {ledger.marginTl != null && <Card className="rounded-3xl border-0 shadow-sm"><CardContent className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">İç fark</p><p className="mt-2 text-2xl font-black">{money(ledger.marginTl)}</p></CardContent></Card>}
      </div>
      <div className="space-y-3">
        {ledger.entries.length === 0 && <p className="rounded-3xl bg-white p-6 text-sm text-slate-500">Bu role görünen muhasebe kaydı yok.</p>}
        {ledger.entries.map(entry => (
          <article key={entry.id} className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{entry.jobCode} · {entry.kind === "branch_charge" ? "Şube bedeli" : "Kurye ödemesi"}</p>
              <h2 className="mt-1 font-bold text-slate-950">{entry.description}</h2>
              <p className="text-sm text-slate-500">{entry.branchName}{entry.courierName ? ` · ${entry.courierName}` : ""} · {when(entry.createdAt)} İstanbul</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-lg font-black">{money(entry.amountTl)}</p>
              {entry.settled ? <Badge variant="secondary">Kapandı</Badge> : ledger.canSettle ? <Button variant="outline" className="rounded-xl" disabled={settle.isPending} onClick={() => settle.mutate({ entryId: entry.id }, { onSuccess: () => onChanged(), onError: error => toast.error(error.message) })}>Tahsilatı kapat</Button> : <Badge variant="outline">Açık</Badge>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TariffPanel({ list, canEdit, onChanged }: { list: NonNullable<HomeData["priceList"]>; canEdit: boolean; onChanged: () => Promise<void> }) {
  const updateRates = trpc.internalDesk.updateTariff.useMutation();
  const updateRows = trpc.internalDesk.updatePriceList.useMutation();
  const [rates, setRates] = useState<Tariff>(() => list.tariff);
  const [rows, setRows] = useState(list.rows);
  useEffect(() => { setRates(list.tariff); setRows(list.rows); }, [list]);

  function saveRates(event: FormEvent) {
    event.preventDefault();
    updateRates.mutate(rates, { onSuccess: () => { toast.success("Fiyat listesi formülden yenilendi"); void onChanged(); }, onError: error => toast.error(error.message) });
  }

  function saveRows(event: FormEvent) {
    event.preventDefault();
    updateRows.mutate({ rows: rows.map(row => ({ branchId: row.branchId, chargeTl: Number(row.chargeTl), payoutTl: Number(row.payoutTl) })) }, {
      onSuccess: () => { toast.success("Fiyat listesi kaydedildi"); void onChanged(); },
      onError: error => toast.error(error.message),
    });
  }

  return (
    <section className="space-y-4">
      <form className="rounded-3xl bg-white p-5 shadow-sm" onSubmit={saveRates}>
        <h2 className="text-lg font-black">Merkez hat formülü</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">Bu formül on şubenin liste fiyatını yeniden yazar. Düzenleme yalnız merkez müdür ve adminde.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {TARIFF_FIELDS.map(field => (
            <label key={field.key} className="text-sm font-semibold text-slate-700">{field.label}
              <input className={`${fieldClass()} mt-1`} inputMode="decimal" disabled={!canEdit} value={rates[field.key]} onChange={event => setRates(current => ({ ...current, [field.key]: Number(event.target.value) }))} />
              <span className="mt-1 block text-xs font-medium text-slate-400">{field.hint}</span>
            </label>
          ))}
        </div>
        {canEdit && <Button type="submit" className="mt-4 h-11 rounded-xl" variant="outline" disabled={updateRates.isPending}>Formülden listeyi yaz</Button>}
      </form>
      <form className="overflow-x-auto rounded-3xl bg-white p-5 shadow-sm" onSubmit={saveRows}>
        <h2 className="text-lg font-black">{list.centralBranchName} fiyat listesi</h2>
        <p className="mt-1 text-sm text-slate-500">Her satır, o şube ile merkez şube arasındaki kurye bedelidir. Teslim edilmiş işler değişmez.</p>
        <table className="mt-4 w-full min-w-[40rem] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-slate-400"><tr><th className="py-2">Şube</th><th>Mesafe</th><th>Şube bedeli</th><th>Kurye ödemesi</th></tr></thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.branchId} className="border-t border-slate-100">
                <td className="py-3 font-semibold">{row.branchName}</td>
                <td>{row.distanceKm} km</td>
                <td><label className="sr-only" htmlFor={`charge-${row.branchId}`}>{row.branchName} bedeli</label><input id={`charge-${row.branchId}`} className="h-10 w-28 rounded-lg border border-slate-200 px-2" inputMode="decimal" disabled={!canEdit} value={row.chargeTl} onChange={event => setRows(current => current.map(item => item.branchId === row.branchId ? { ...item, chargeTl: Number(event.target.value) } : item))} /></td>
                <td><label className="sr-only" htmlFor={`payout-${row.branchId}`}>{row.branchName} kurye ödemesi</label><input id={`payout-${row.branchId}`} className="h-10 w-28 rounded-lg border border-slate-200 px-2" inputMode="decimal" disabled={!canEdit} value={row.payoutTl} onChange={event => setRows(current => current.map(item => item.branchId === row.branchId ? { ...item, payoutTl: Number(event.target.value) } : item))} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {canEdit && <Button type="submit" className="mt-4 h-11 rounded-xl bg-[#e54725] hover:bg-[#cf3d1e]" disabled={updateRows.isPending}>Listeyi kaydet</Button>}
      </form>
    </section>
  );
}

function Pins({ onChanged }: { onChanged: () => Promise<void> }) {
  const codes = trpc.internalDesk.staffCodes.useQuery();
  const changePin = trpc.internalDesk.setPin.useMutation();
  const [staffId, setStaffId] = useState("");
  const [pin, setPinCode] = useState("");
  const people = codes.data ?? [];

  function submit(event: FormEvent) {
    event.preventDefault();
    changePin.mutate({ staffId: staffId || people[0]?.id || "", pin }, {
      onSuccess: async () => {
        setPinCode("");
        toast.success("Giriş kodu güncellendi");
        await codes.refetch();
        await onChanged();
      },
      onError: error => toast.error(error.message),
    });
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_18rem]">
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400"><tr><th className="px-4 py-3">Personel</th><th className="px-4 py-3">Görev</th><th className="px-4 py-3">Kod</th></tr></thead>
          <tbody>
            {people.map(person => (
              <tr key={person.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-semibold">{person.name}</td>
                <td className="px-4 py-3">{person.roleLabel}</td>
                <td className="px-4 py-3 font-mono">{person.pin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form className="h-fit space-y-3 rounded-3xl bg-white p-4 shadow-sm" onSubmit={submit}>
        <h2 className="font-black">Kod değiştir</h2>
        <label className="block text-sm font-semibold">Personel
          <select className={`${fieldClass()} mt-1`} value={staffId || people[0]?.id || ""} onChange={event => setStaffId(event.target.value)}>
            {people.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold">Yeni kod
          <input className={`${fieldClass()} mt-1`} inputMode="numeric" autoComplete="off" value={pin} onChange={event => setPinCode(event.target.value)} />
        </label>
        <Button type="submit" className="h-11 w-full rounded-xl bg-slate-950" disabled={changePin.isPending}>Kaydet</Button>
      </form>
    </section>
  );
}

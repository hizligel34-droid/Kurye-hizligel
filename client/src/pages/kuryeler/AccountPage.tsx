import { BrandShell } from "@/components/kuryeler/BrandShell";
import { PwaLegalLinks } from "@/components/kuryeler/PwaLegalLinks";
import { RequireRole } from "@/components/kuryeler/RequireRole";
import { EmptyState, ErrorState, LoadingState } from "@/components/kuryeler/UiStates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useKuryelerAuth } from "@/contexts/KuryelerAuth";
import { listNotifications, markNotificationRead, subscribeToOrders, updateOwnProfile } from "@/lib/kuryelerApi";
import { cardClass, fieldClass, goldBtn, ghostBtn } from "@/lib/kuryelerTheme";
import { formatDateTimeTr } from "@shared/kuryeler";
import { normalizeTurkishMobilePhone } from "@shared/orderValidation";
import type { AppNotification } from "@shared/kuryelerSupport";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

function AccountHome() {
  const { user, signOut, refresh } = useKuryelerAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [notes, setNotes] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    setError(null);
    setNotes(await listNotifications(user.id));
  };

  useEffect(() => {
    setFullName(user?.fullName ?? "");
    setPhone(user?.phone ?? "");
  }, [user?.fullName, user?.phone]);

  useEffect(() => {
    setLoading(true);
    void load()
      .catch(err => setError(err instanceof Error ? err.message : "Hesap yüklenemedi"))
      .finally(() => setLoading(false));
    return subscribeToOrders(() => {
      void load();
      void refresh();
    });
  }, [user?.id]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await updateOwnProfile({ fullName, phone: normalizeTurkishMobilePhone(phone) });
      await refresh();
      toast.success("Hesap güncellendi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kaydedilemedi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <BrandShell panel="musteri" title="Hesap">
      <div className="mx-auto max-w-lg space-y-4 px-4 py-4">
        {loading ? <LoadingState label="Hesap yükleniyor…" /> : null}
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
        <form className={`${cardClass} space-y-3 p-4 sm:p-5`} onSubmit={save}>
          <p className="text-sm font-bold uppercase tracking-wider text-[#8a7c52]">{user?.email}</p>
          <label className="block text-sm">
            <span className="mb-1 block font-bold text-[#D4AF37]">Ad soyad</span>
            <Input className={fieldClass} value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-bold text-[#D4AF37]">Telefon</span>
            <Input className={fieldClass} value={phone} onChange={e => setPhone(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" />
          </label>
          <Button className={`h-11 w-full ${goldBtn}`} disabled={busy}>
            {busy ? "Kaydediliyor…" : "Kaydet"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className={`h-11 w-full ${ghostBtn}`}
            onClick={() => void signOut()}
          >
            Çıkış
          </Button>
        </form>

        <section className={`${cardClass} space-y-3 p-4 sm:p-5`}>
          <h2 className="text-lg font-black">Bildirimler</h2>
          <p className="text-sm text-[#8a7c52]">Yalnızca uygulama içi. SMS, WhatsApp veya push otomatik gitmez.</p>
          {notes.length === 0 ? (
            <EmptyState title="Bildirim yok" body="Sipariş durumu değişince burada görünür." />
          ) : (
            notes.map(note => (
              <button
                key={note.id}
                type="button"
                className="w-full rounded-2xl border border-[#3a3014] bg-black p-3 text-left"
                onClick={() => {
                  if (!note.readAt) void markNotificationRead(note.id).then(() => load());
                }}
              >
                <p className={`text-sm font-bold ${note.readAt ? "text-[#b4a882]" : "text-[#D4AF37]"}`}>{note.title}</p>
                <p className="mt-1 text-sm text-[#8a7c52]">{note.body}</p>
                <p className="mt-1 text-sm text-[#8a7c52]">{formatDateTimeTr(note.createdAt)}</p>
              </button>
            ))
          )}
        </section>

        <div className={`${cardClass} p-4`}>
          <PwaLegalLinks />
        </div>
      </div>
    </BrandShell>
  );
}

export default function AccountPage() {
  return (
    <RequireRole role="customer">
      <AccountHome />
    </RequireRole>
  );
}

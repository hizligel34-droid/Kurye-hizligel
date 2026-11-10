import { BrandShell } from "@/components/kuryeler/BrandShell";
import { PhotoAttach } from "@/components/kuryeler/PhotoAttach";
import { PwaLegalLinks } from "@/components/kuryeler/PwaLegalLinks";
import { RequireRole } from "@/components/kuryeler/RequireRole";
import { EmptyState, ErrorState, FieldError, LoadingState } from "@/components/kuryeler/UiStates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useKuryelerAuth } from "@/contexts/KuryelerAuth";
import {
  listOrdersFor,
  listSupportMessages,
  listSupportTickets,
  openSupportTicket,
  postSupportMessage,
  subscribeToOrders,
} from "@/lib/kuryelerApi";
import { areaClass, cardClass, fieldClass, goldBtn } from "@/lib/kuryelerTheme";
import { formatDateTimeTr, STATUS_LABELS, type DeliveryOrder } from "@shared/kuryeler";
import {
  claimDisclaimer,
  SUPPORT_KIND_LABELS,
  validateClaimInput,
  validateSupportBody,
  type SupportMessage,
  type SupportTicket,
  type SupportTicketKind,
} from "@shared/kuryelerSupport";
import { firstError } from "@shared/kuryelerValidation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

function DestekHome() {
  const { user, refresh } = useKuryelerAuth();
  const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  const presetOrder = params.get("siparis") ?? "";
  const [tab, setTab] = useState<"yazisma" | "sikayet">(params.get("sekme") === "sikayet" ? "sikayet" : "yazisma");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [orderId, setOrderId] = useState(presetOrder);
  const [claimKind, setClaimKind] = useState<SupportTicketKind>("hasar");
  const [claimCode, setClaimCode] = useState("");
  const [claimBody, setClaimBody] = useState("");
  const [claimPhoto, setClaimPhoto] = useState<string | null>(null);
  const [claimErrors, setClaimErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    setError(null);
    const [nextTickets, nextOrders] = await Promise.all([listSupportTickets(user), listOrdersFor(user)]);
    setTickets(nextTickets);
    setOrders(nextOrders);
    const nextActive = activeId && nextTickets.some(t => t.id === activeId) ? activeId : nextTickets[0]?.id ?? null;
    setActiveId(nextActive);
    if (nextActive) setMessages(await listSupportMessages(nextActive));
    else setMessages([]);
  };

  useEffect(() => {
    setLoading(true);
    void load()
      .catch(err => setError(err instanceof Error ? err.message : "Destek yüklenemedi"))
      .finally(() => setLoading(false));
    return subscribeToOrders(() => {
      void load();
      void refresh();
    });
  }, [user?.id]);

  useEffect(() => {
    if (!activeId) return;
    void listSupportMessages(activeId).then(setMessages);
  }, [activeId]);

  const active = tickets.find(t => t.id === activeId) ?? null;
  const orderOptions = useMemo(() => orders, [orders]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const invalid = validateSupportBody(body);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    setBusy(true);
    try {
      if (active) {
        await postSupportMessage({ ticketId: active.id, body, photoUrl: photo });
      } else {
        const ticket = await openSupportTicket({
          kind: orderId ? "siparis" : "destek",
          body,
          orderId: orderId || null,
          photoUrl: photo,
        });
        setActiveId(ticket.id);
      }
      setBody("");
      setPhoto(null);
      toast.success("Mesaj kayda düştü");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gönderilemedi");
    } finally {
      setBusy(false);
    }
  };

  const submitClaim = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateClaimInput({
      kind: claimKind,
      trackingCode: claimCode,
      body: claimBody,
      photoUrl: claimPhoto,
    });
    setClaimErrors(nextErrors);
    const message = firstError(nextErrors);
    if (message) {
      toast.error(message);
      return;
    }
    setBusy(true);
    try {
      const ticket = await openSupportTicket({
        kind: claimKind,
        body: claimBody,
        trackingCode: claimCode,
        photoUrl: claimPhoto,
      });
      toast.success("Kayıt yönetici kuyruğuna düştü");
      setClaimBody("");
      setClaimPhoto(null);
      setTab("yazisma");
      setActiveId(ticket.id);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kayıt gönderilemedi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <BrandShell panel="musteri" title="Destek">
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-4">
        <p className="text-sm text-[#8a7c52]">
          Yazışmalar kayda düşer. Çağrı merkezi botu yalnızca burada cevaplar. WhatsApp’tan otomatik bot mesajı
          gitmez.
        </p>
        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-[#3a3014] bg-black p-1">
          {(
            [
              ["yazisma", "Yazışmalar"],
              ["sikayet", "Hasar / kayıp / şikayet"],
            ] as const
          ).map(([id, label]) => (
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

        {loading ? <LoadingState label="Destek yükleniyor…" /> : null}
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}

        {!loading && !error && tab === "yazisma" ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="space-y-2">
              {tickets.length === 0 ? (
                <EmptyState title="Henüz yazışma yok" body="Aşağıdan sipariş kodu seçip mesaj yazın." />
              ) : (
                tickets.map(ticket => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => setActiveId(ticket.id)}
                    className={`${cardClass} w-full p-4 text-left ${
                      ticket.id === activeId ? "border-[#D4AF37]" : ""
                    }`}
                  >
                    <p className="text-sm font-bold text-[#D4AF37]">{ticket.subject}</p>
                    <p className="mt-1 text-xs text-[#8a7c52]">
                      {SUPPORT_KIND_LABELS[ticket.kind]} · {formatDateTimeTr(ticket.createdAt)}
                    </p>
                  </button>
                ))
              )}
            </div>
            <div className={`${cardClass} space-y-3 p-4 sm:p-5`}>
              {active ? (
                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {messages.map(message => (
                    <div key={message.id} className="rounded-2xl border border-[#3a3014] bg-black p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a7c52]">
                        {message.sender === "customer" ? "Siz" : message.sender === "bot" ? "Destek botu" : "Yönetici"}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">{message.body}</p>
                      {message.photoUrl ? (
                        <img
                          src={message.photoUrl}
                          alt="Mesaj fotoğrafı"
                          className="mt-2 h-28 w-full rounded-xl object-cover"
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#8a7c52]">Yeni bir yazışma başlatın. İsterseniz sipariş bağlayın.</p>
              )}
              <form className="space-y-3" onSubmit={send}>
                {!active ? (
                  <label className="block text-sm">
                    <span className="mb-1 block font-bold text-[#D4AF37]">Sipariş (isteğe bağlı)</span>
                    <select
                      className={fieldClass + " w-full px-3"}
                      value={orderId}
                      onChange={e => setOrderId(e.target.value)}
                    >
                      <option value="">Genel destek</option>
                      {orderOptions.map(order => (
                        <option key={order.id} value={order.id}>
                          {order.trackingCode} · {STATUS_LABELS[order.status]}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <Textarea
                  className={areaClass}
                  placeholder="Sorununuzu yazın"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  aria-label="Destek mesajı"
                />
                <PhotoAttach value={photo} onChange={setPhoto} />
                <Button className={`h-11 w-full ${goldBtn}`} disabled={busy}>
                  {busy ? "Gönderiliyor…" : "Gönder"}
                </Button>
              </form>
            </div>
          </div>
        ) : null}

        {!loading && !error && tab === "sikayet" ? (
          <form className={`${cardClass} space-y-4 p-4 sm:p-5`} onSubmit={submitClaim} noValidate>
            <p className="text-sm text-[#b4a882]">{claimDisclaimer()}</p>
            <fieldset>
              <legend className="mb-2 text-sm font-bold text-[#D4AF37]">Konu</legend>
              <div className="grid grid-cols-3 gap-2">
                {(["hasar", "kayip", "sikayet"] as const).map(kind => (
                  <button
                    key={kind}
                    type="button"
                    aria-pressed={claimKind === kind}
                    className={`min-h-11 rounded-xl border px-2 text-xs font-bold ${
                      claimKind === kind
                        ? "border-[#D4AF37] bg-[#1a1508] text-[#D4AF37]"
                        : "border-[#3a3014] text-[#b4a882]"
                    }`}
                    onClick={() => setClaimKind(kind)}
                  >
                    {SUPPORT_KIND_LABELS[kind]}
                  </button>
                ))}
              </div>
            </fieldset>
            <div>
              <label className="mb-1 block text-sm font-bold text-[#D4AF37]" htmlFor="claim-code">
                İş kodu
              </label>
              <Input
                id="claim-code"
                className={fieldClass}
                placeholder="KY-…"
                value={claimCode}
                aria-invalid={Boolean(claimErrors.trackingCode)}
                onChange={e => setClaimCode(e.target.value)}
              />
              <FieldError id="claim-code-err" message={claimErrors.trackingCode} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-[#D4AF37]" htmlFor="claim-body">
                Açıklama
              </label>
              <Textarea
                id="claim-body"
                className={areaClass}
                placeholder="Ne olduğunu, saatini ve fotoğrafı yazın"
                value={claimBody}
                aria-invalid={Boolean(claimErrors.body)}
                onChange={e => setClaimBody(e.target.value)}
              />
              <FieldError id="claim-body-err" message={claimErrors.body} />
            </div>
            <PhotoAttach value={claimPhoto} onChange={setClaimPhoto} />
            <FieldError id="claim-photo-err" message={claimErrors.photo} />
            <Button className={`h-11 w-full ${goldBtn}`} disabled={busy}>
              {busy ? "Gönderiliyor…" : "Kaydı gönder"}
            </Button>
          </form>
        ) : null}

        <div className={`${cardClass} p-4`}>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#8a7c52]">İletişim</p>
          <PwaLegalLinks />
        </div>
      </div>
    </BrandShell>
  );
}

export default function DestekPage() {
  return (
    <RequireRole role="customer">
      <DestekHome />
    </RequireRole>
  );
}

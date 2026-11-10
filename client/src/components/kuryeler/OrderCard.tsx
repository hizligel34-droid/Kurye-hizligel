import { StatusBadge } from "@/components/kuryeler/BrandShell";
import { OrderMap } from "@/components/kuryeler/OrderMap";
import { PriceLines } from "@/components/kuryeler/PriceLines";
import { Button } from "@/components/ui/button";
import { copyText, copyTrackingLink, shareTrackingLink } from "@/lib/kuryelerShare";
import { cardClass, ghostBtn } from "@/lib/kuryelerTheme";
import { safeMediaUrl } from "@shared/kuryelerSecurity";
import {
  breakdownFromOrder,
  formatDateTimeTr,
  formatEtaMinutes,
  formatKm,
  PAYMENT_METHOD_LABELS,
  paymentStatusLabel,
  STATUS_LABELS,
  statusTone,
  type DeliveryOrder,
} from "@shared/kuryeler";
import type { ReactNode } from "react";
import { toast } from "sonner";

export function OrderCard({
  order,
  extra,
  actions,
  showMap = false,
  showProof = false,
  showPhones = false,
  audience = "consumer",
}: {
  order: DeliveryOrder;
  extra?: ReactNode;
  actions?: ReactNode;
  showMap?: boolean;
  showProof?: boolean;
  showPhones?: boolean;
  audience?: "consumer" | "business";
}) {
  const deliveryPhoto = safeMediaUrl(order.deliveryPhoto);
  const signature = safeMediaUrl(order.signatureData);
  const eta = formatEtaMinutes(order.durationMin);
  const board = Boolean(order.boardOnly);
  return (
    <article className={`${cardClass} min-w-0 p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono text-sm font-bold text-[#D4AF37]">{order.trackingCode}</p>
          <p className="mt-1 text-sm font-semibold text-[#f5edd6]">{board ? "Gönderi" : order.product || "Gönderi"}</p>
        </div>
        <StatusBadge label={STATUS_LABELS[order.status]} className={statusTone(order.status)} />
      </div>
      <div className="mt-3">
        <PriceLines price={breakdownFromOrder(order)} audience={audience} />
      </div>
      <p className="mt-2 text-sm text-[#b4a882]">
        {order.distanceKm > 0 ? formatKm(order.distanceKm) : ""}
        {order.weightKg ? ` · ${order.weightKg} kg` : ""}
      </p>
      {eta ? <p className="mt-1 text-xs text-[#8a7c52]">{eta}</p> : null}
      <p className="mt-1 break-words text-xs leading-5 text-[#8a7c52]">
        Alım: {order.pickupAddress}
        <br />
        Gidecek yer: {order.dropoffAddress}
        {board ? null : (
          <>
            <br />
            Teslim alan: {order.recipientName || "—"}
            {showPhones && order.recipientPhone ? (
              <>
                <br />
                Alıcı tel: {order.recipientPhone}
              </>
            ) : null}
            {showPhones && order.contactPhone ? (
              <>
                <br />
                Gönderen tel: {order.contactPhone}
              </>
            ) : null}
            <br />
            İstenen alım zamanı: {formatDateTimeTr(order.scheduledAt)}
          </>
        )}
      </p>
      {board ? null : (
        <p className="mt-2 text-xs text-[#b4a882]">
          {PAYMENT_METHOD_LABELS[order.paymentMethod]} · {paymentStatusLabel(order.paymentMethod, order.paymentStatus)}
        </p>
      )}
      {!board && order.notes ? <p className="mt-2 text-xs text-[#b4a882]">{order.notes}</p> : null}
      {order.status === "cancelled" && order.cancelReason ? (
        <p className="mt-2 text-xs text-[#8a7c52]">İptal notu: {order.cancelReason}</p>
      ) : null}
      {order.status === "assigned" ? (
        <p className="mt-2 text-xs font-semibold text-[#D4AF37]">Kurye atandı, alıma gidiyor.</p>
      ) : null}
      {showMap && !board ? <OrderMap order={order} /> : null}
      {showProof && !board && (deliveryPhoto || signature) ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {deliveryPhoto ? (
            <figure>
              <img src={deliveryPhoto} alt="Teslim fotoğrafı" className="h-32 w-full rounded-2xl object-cover" />
              <figcaption className="mt-1 text-[11px] text-[#8a7c52]">Teslim fotoğrafı</figcaption>
            </figure>
          ) : null}
          {signature ? (
            <figure>
              <img src={signature} alt="Teslim imzası" className="h-32 w-full rounded-2xl bg-[#141414] object-contain" />
              <figcaption className="mt-1 text-[11px] text-[#8a7c52]">İmza</figcaption>
            </figure>
          ) : null}
        </div>
      ) : null}
      {board ? null : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className={`${ghostBtn} h-10`}
            onClick={() =>
              void copyText(order.trackingCode).then(() => toast.success("Takip kodu kopyalandı")).catch(() => toast.error("Kopyalanamadı"))
            }
          >
            Kodu kopyala
          </Button>
          <Button
            type="button"
            variant="outline"
            className={`${ghostBtn} h-10`}
            onClick={() =>
              void copyTrackingLink(order.trackingCode)
                .then(() => toast.success("Takip linki kopyalandı"))
                .catch(() => toast.error("Kopyalanamadı"))
            }
          >
            Linki kopyala
          </Button>
          <Button
            type="button"
            variant="outline"
            className={`${ghostBtn} h-10`}
            onClick={() =>
              void shareTrackingLink(order.trackingCode)
                .then(mode => toast.success(mode === "shared" ? "Paylaşıldı" : "Takip linki kopyalandı"))
                .catch(() => toast.error("Paylaşılamadı"))
            }
          >
            Paylaş
          </Button>
        </div>
      )}
      {extra}
      {actions ? <div className="mt-4 flex flex-col gap-2 sm:flex-row">{actions}</div> : null}
    </article>
  );
}

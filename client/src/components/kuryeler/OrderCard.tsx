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
      {eta ? <p className="mt-1 text-sm text-[#8a7c52]">{eta}</p> : null}
      <dl className="mt-1 space-y-1 break-words text-base leading-[1.5] text-[#b4a882]">
        <div>
          <dt className="inline text-[#8a7c52]">Alım: </dt>
          <dd className="inline">{order.pickupAddress}</dd>
        </div>
        <div>
          <dt className="inline text-[#8a7c52]">Gidecek yer: </dt>
          <dd className="inline">{order.dropoffAddress}</dd>
        </div>
        {board ? null : (
          <>
            <div>
              <dt className="inline text-[#8a7c52]">Teslim alan: </dt>
              <dd className="inline">{order.recipientName || "—"}</dd>
            </div>
            {showPhones && order.recipientPhone ? (
              <div>
                <dt className="inline text-[#8a7c52]">Alıcı tel: </dt>
                <dd className="inline">{order.recipientPhone}</dd>
              </div>
            ) : null}
            {showPhones && order.contactPhone ? (
              <div>
                <dt className="inline text-[#8a7c52]">Gönderen tel: </dt>
                <dd className="inline">{order.contactPhone}</dd>
              </div>
            ) : null}
            <div>
              <dt className="inline text-[#8a7c52]">İstenen alım zamanı: </dt>
              <dd className="inline">{formatDateTimeTr(order.scheduledAt)}</dd>
            </div>
          </>
        )}
      </dl>
      {board ? null : (
        <p className="mt-2 text-xs text-[#b4a882]">
          {PAYMENT_METHOD_LABELS[order.paymentMethod]} · {paymentStatusLabel(order.paymentMethod, order.paymentStatus)}
        </p>
      )}
      {!board && order.notes ? <p className="mt-2 text-xs text-[#b4a882]">{order.notes}</p> : null}
      {order.status === "cancelled" && order.cancelReason ? (
        <p className="mt-2 text-sm text-[#8a7c52]">İptal notu: {order.cancelReason}</p>
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
              <figcaption className="mt-1 text-sm text-[#8a7c52]">Teslim fotoğrafı</figcaption>
            </figure>
          ) : null}
          {signature ? (
            <figure>
              <img src={signature} alt="Teslim imzası" className="h-32 w-full rounded-2xl bg-[#141414] object-contain" />
              <figcaption className="mt-1 text-sm text-[#8a7c52]">İmza</figcaption>
            </figure>
          ) : null}
        </div>
      ) : null}
      {board ? null : (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            variant="outline"
            className={`${ghostBtn} min-h-11 w-full sm:w-auto`}
            onClick={() =>
              void copyText(order.trackingCode).then(() => toast.success("Takip kodu kopyalandı")).catch(() => toast.error("Kopyalanamadı"))
            }
          >
            Kodu kopyala
          </Button>
          <Button
            type="button"
            variant="outline"
            className={`${ghostBtn} min-h-11 w-full sm:w-auto`}
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
            className={`${ghostBtn} min-h-11 w-full sm:w-auto`}
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

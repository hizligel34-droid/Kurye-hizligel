import { StatusBadge } from "@/components/kuryeler/BrandShell";
import { OrderMap } from "@/components/kuryeler/OrderMap";
import { PriceLines } from "@/components/kuryeler/PriceLines";
import { cardClass } from "@/lib/kuryelerTheme";
import {
  breakdownFromOrder,
  formatDateTimeTr,
  formatKm,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
  displayStatus,
  statusTone,
  type DeliveryOrder,
} from "@shared/kuryeler";
import type { ReactNode } from "react";

export function OrderCard({
  order,
  extra,
  actions,
  showMap = false,
  audience = "consumer",
}: {
  order: DeliveryOrder;
  extra?: ReactNode;
  actions?: ReactNode;
  showMap?: boolean;
  audience?: "consumer" | "business";
}) {
  const status = displayStatus(order.status);
  const board = Boolean(order.boardOnly);
  return (
    <article className={`${cardClass} min-w-0 p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono text-sm font-bold text-[#D4AF37]">{order.trackingCode}</p>
          <p className="mt-1 text-sm font-semibold text-[#f5edd6]">{board ? "Gönderi" : order.product || "Gönderi"}</p>
        </div>
        <StatusBadge label={STATUS_LABELS[status]} className={statusTone(order.status)} />
      </div>
      <div className="mt-3">
        <PriceLines price={breakdownFromOrder(order)} audience={audience} />
      </div>
      <p className="mt-2 text-sm text-[#b4a882]">
        {order.distanceKm > 0 ? formatKm(order.distanceKm) : ""}
        {order.weightKg ? ` · ${order.weightKg} kg` : ""}
      </p>
      <p className="mt-1 break-words text-xs leading-5 text-[#8a7c52]">
        Alım: {order.pickupAddress}
        <br />
        Gidecek yer: {order.dropoffAddress}
        {board ? null : (
          <>
            <br />
            Teslim alan: {order.recipientName || "—"}
            <br />
            Gün ve saat: {formatDateTimeTr(order.scheduledAt)}
          </>
        )}
      </p>
      {board ? null : (
        <p className="mt-2 text-xs text-[#b4a882]">
          {PAYMENT_METHOD_LABELS[order.paymentMethod]} · {PAYMENT_STATUS_LABELS[order.paymentStatus]}
        </p>
      )}
      {!board && order.notes ? <p className="mt-2 text-xs text-[#b4a882]">{order.notes}</p> : null}
      {order.status === "assigned" ? (
        <p className="mt-2 text-xs font-semibold text-[#D4AF37]">Kurye atandı, alıma gidiyor.</p>
      ) : null}
      {showMap && !board ? <OrderMap order={order} /> : null}
      {extra}
      {actions ? <div className="mt-4 flex flex-col gap-2 sm:flex-row">{actions}</div> : null}
    </article>
  );
}

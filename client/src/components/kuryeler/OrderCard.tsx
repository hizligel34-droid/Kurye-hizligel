import { StatusBadge } from "@/components/kuryeler/BrandShell";
import { cardClass } from "@/lib/kuryelerTheme";
import {
  formatTl,
  PACKAGE_LABELS,
  STATUS_LABELS,
  statusTone,
  type DeliveryOrder,
} from "@shared/kuryeler";
import type { ReactNode } from "react";

export function OrderCard({
  order,
  extra,
  actions,
}: {
  order: DeliveryOrder;
  extra?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <article className={`${cardClass} min-w-0 p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono text-sm font-bold text-[#D4AF37]">{order.trackingCode}</p>
          <p className="mt-1 text-sm text-[#b4a882]">
            {order.pickupDistrict} → {order.dropoffDistrict}
          </p>
        </div>
        <StatusBadge label={STATUS_LABELS[order.status]} className={statusTone(order.status)} />
      </div>
      <p className="mt-3 text-sm text-[#f5edd6]">
        {PACKAGE_LABELS[order.packageType]} · {formatTl(order.totalPriceTl)}
      </p>
      <p className="mt-1 break-words text-xs leading-5 text-[#8a7c52]">
        Alış: {order.pickupAddress}
        <br />
        Teslim: {order.dropoffAddress}
      </p>
      {order.notes ? <p className="mt-2 text-xs text-[#b4a882]">{order.notes}</p> : null}
      {extra}
      {actions ? <div className="mt-4 flex flex-col gap-2 sm:flex-row">{actions}</div> : null}
    </article>
  );
}

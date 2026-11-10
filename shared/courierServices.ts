export const COURIER_SERVICE_TYPES = ["standard", "pharmacy_on_call", "vip", "mall", "airport", "express"] as const;
export type CourierServiceType = typeof COURIER_SERVICE_TYPES[number];

export const COURIER_SERVICES: Record<CourierServiceType, { label: string; description: string; deliveryTargetMinutes: number; assignmentMinutes: number }> = {
  standard: { label: "Standart kurye", description: "Planlı teslimat", deliveryTargetMinutes: 180, assignmentMinutes: 20 },
  pharmacy_on_call: { label: "Nöbetçi eczane", description: "İlaç ve reçete teslimatı", deliveryTargetMinutes: 120, assignmentMinutes: 15 },
  vip: { label: "VIP kurye", description: "Öncelikli kurye ataması", deliveryTargetMinutes: 60, assignmentMinutes: 10 },
  mall: { label: "AVM kurye", description: "Mağaza ve AVM teslimatları", deliveryTargetMinutes: 180, assignmentMinutes: 20 },
  airport: { label: "Havaalanı kurye", description: "Terminal ve havaalanı teslimatları", deliveryTargetMinutes: 180, assignmentMinutes: 25 },
  express: { label: "Express kurye", description: "Hızlı şehir içi teslimat", deliveryTargetMinutes: 120, assignmentMinutes: 15 },
};

export const PUBLIC_DELIVERY_PROMISE = "Makul sürede, aktarmasız teslim";

export function publicServiceTimingLabel(
  service: { deliveryTargetMinutes: number },
  deliveryTargetsPublic = false,
) {
  if (!deliveryTargetsPublic) return PUBLIC_DELIVERY_PROMISE;
  return service.deliveryTargetMinutes === 60 ? "60 dk" : "2–3 saat";
}

export function getDeliveryEstimate(input: {
  serviceType?: CourierServiceType;
  routeDurationMinutes?: number | null;
  deliveryTargetsPublic?: boolean;
}) {
  const service = COURIER_SERVICES[input.serviceType ?? "standard"];
  const routeMinutes = Math.max(0, Number(input.routeDurationMinutes) || 0);
  const calculatedMinutes = Math.ceil(routeMinutes + service.assignmentMinutes);
  const publicTargets = Boolean(input.deliveryTargetsPublic);
  return {
    assignmentMinutes: service.assignmentMinutes,
    calculatedMinutes,
    deliveryTargetMinutes: service.deliveryTargetMinutes,
    label: publicTargets
      ? service.deliveryTargetMinutes === 60
        ? "60 dakika"
        : "2–3 saat"
      : PUBLIC_DELIVERY_PROMISE,
  };
}

export function getWeightSurcharge(packageWeightKg: number) {
  return Number(packageWeightKg) > 5 ? 500 : 0;
}

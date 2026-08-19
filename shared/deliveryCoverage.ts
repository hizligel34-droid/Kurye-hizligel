import { getDeliveryEstimate, type CourierServiceType } from "./courierServices";

export type CoverageStatus = "available" | "unsupported" | "closed";

export type ProvinceCoverageConfig = {
  provinceName: string;
  isEnabled: number | boolean;
  operatingStart: string;
  operatingEnd: string;
  etaBufferMinutes: number;
};

function timeToMinutes(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return 0;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60 ? hours * 60 + minutes : 0;
}

export function normalizeProvinceName(value: string) {
  return value.trim().toLocaleUpperCase("tr-TR");
}

export function isWithinOperatingHours(start: string, end: string, currentMinutes: number) {
  const opening = timeToMinutes(start);
  const closing = timeToMinutes(end);
  if (opening === closing) return false;
  return opening < closing
    ? currentMinutes >= opening && currentMinutes < closing
    : currentMinutes >= opening || currentMinutes < closing;
}

export function getIstanbulCurrentMinutes(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = Number(parts.find(part => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find(part => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

export function evaluateDeliveryCoverage(input: {
  pickupProvince: string;
  deliveryProvince: string;
  pickupCoverage?: ProvinceCoverageConfig | null;
  deliveryCoverage?: ProvinceCoverageConfig | null;
  serviceType: CourierServiceType;
  routeDurationMinutes?: number | null;
  currentMinutes?: number;
}) {
  const currentMinutes = input.currentMinutes ?? getIstanbulCurrentMinutes();
  const stages = [
    { province: input.pickupProvince, coverage: input.pickupCoverage },
    { province: input.deliveryProvince, coverage: input.deliveryCoverage },
  ];
  const unsupported = stages.find(stage => !stage.coverage || !stage.coverage.isEnabled);
  if (unsupported) {
    return {
      status: "unsupported" as const,
      isAvailable: false,
      estimatedDeliveryMinutes: null,
      message: `${unsupported.province} için henüz hizmet verilmiyor. Lütfen desteklenen bir il seçin.`,
      operatingWindow: null,
    };
  }
  const closed = stages.find(stage => stage.coverage && !isWithinOperatingHours(stage.coverage.operatingStart, stage.coverage.operatingEnd, currentMinutes));
  if (closed?.coverage) {
    return {
      status: "closed" as const,
      isAvailable: false,
      estimatedDeliveryMinutes: null,
      message: `${closed.province} için hizmet saatleri ${closed.coverage.operatingStart}–${closed.coverage.operatingEnd}. Şu an sipariş alınmıyor.`,
      operatingWindow: `${closed.coverage.operatingStart}–${closed.coverage.operatingEnd}`,
    };
  }
  const estimate = getDeliveryEstimate({ serviceType: input.serviceType, routeDurationMinutes: input.routeDurationMinutes });
  const bufferMinutes = Math.max(...stages.map(stage => Math.max(0, Number(stage.coverage?.etaBufferMinutes ?? 0))));
  return {
    status: "available" as const,
    isAvailable: true,
    estimatedDeliveryMinutes: Math.max(estimate.calculatedMinutes + bufferMinutes, estimate.assignmentMinutes + bufferMinutes),
    message: `Bu bölgede hizmet veriliyor. Tahmini teslimat süresi rotaya ve hizmet saatlerine göre güncellendi.`,
    operatingWindow: `${input.pickupCoverage?.operatingStart}–${input.pickupCoverage?.operatingEnd}`,
  };
}

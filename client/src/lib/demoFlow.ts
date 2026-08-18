export type DemoStatus = "draft" | "received" | "accepted" | "picked_up" | "on_the_way" | "delivered";

export type DemoMessage = { sender: "customer" | "courier"; text: string };

export const demoSteps: Array<{ status: DemoStatus; label: string }> = [
  { status: "draft", label: "Adres ve ürün" },
  { status: "received", label: "Sipariş alındı" },
  { status: "accepted", label: "Kurye kabul etti" },
  { status: "picked_up", label: "Ürün alındı" },
  { status: "on_the_way", label: "Yolda" },
  { status: "delivered", label: "Teslim edildi" },
];

export const demoAddress = {
  pickup: "Bostancı Mahallesi, Bağdat Caddesi No: 10, Kadıköy, İstanbul",
  delivery: "Abbasağa Mahallesi, Ihlamur Yolu No: 20, Beşiktaş, İstanbul",
};

export const demoRoute = { distanceKm: 20.14, durationMinutes: 36, totalTl: 2114, commissionTl: 422.8 };

export function nextDemoStatus(status: DemoStatus): DemoStatus | null {
  const index = demoSteps.findIndex(step => step.status === status);
  return index >= 0 && index < demoSteps.length - 1 ? demoSteps[index + 1].status : null;
}

export function canAdvanceDemo(status: DemoStatus): boolean {
  return nextDemoStatus(status) !== null;
}

export function demoPaymentLabel(): string {
  return "Kapıda nakit · teslimatta tahsil edilecek";
}

export type RouteStatus = "verified" | "unavailable";

export function canConfirmOrder(routeStatus: string | null | undefined) {
  return routeStatus === "verified";
}
